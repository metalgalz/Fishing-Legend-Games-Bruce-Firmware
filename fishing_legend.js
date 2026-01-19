var d = require('display');
var k = require('keyboard');
var a = require('audio');
var storage = require('storage');
var serialApi = require('serial'); 

// --- ALIAS (HEMAT RAM) ---
var M = Math.floor;
var R = Math.random;
var C = d.color;
var spr = d.createSprite();
var serialCmd = serialApi.cmd; 

function main() {
  // --- KONFIGURASI UMUM ---
  var dw = d.width(), dh = d.height();
  
  // 1. SPLIT 50% 50%
  var gW = M(dw * 0.50) & ~7; // Lebar game 50%, kelipatan 8
  var sX = gW;   

  // --- CONFIG FILE ---
  var folderPath = "/FishingLegendDB";
  try { serialCmd("storage mkdir " + folderPath); } catch(e) {} 

  var fishDbFile = {fs:"sd", path: folderPath + "/fish.json"}; 
  var rodDbFile  = {fs:"sd", path: folderPath + "/rod.json"}; 
  var invFile    = {fs:"sd", path: folderPath + "/myfish.json"}; 
  var rodInvFile = {fs:"sd", path: folderPath + "/myrod.json"}; 
  var monFile    = {fs:"sd", path: folderPath + "/money.json"}; 
  
  // Game State Data
  var gameData = { money: 0, items: {}, rods: [] }; 

  // --- HARGA JUAL IKAN ---
  var sellPrice = [2, 5, 20, 500, 1000, 8000, 20000];

  // --- PALET WARNA ---
  var cK=C(0,0,0), cW=C(255,255,255), cSea=C(0,0,100), cBar=C(255,200,0);
  var cSun=C(255,255,0), cMoon=C(240,240,255), cStar=C(150,150,150);
  var sDay=C(135,206,235), sDusk=C(255,160,120), sNight=C(10,10,50);
  var cWave=C(30,30,150), cBird=C(50,50,50), cIsl=C(30,80,30), cShip=C(100,100,100);
  var cRodDefault=C(139,69,19); 
  var cRed=C(255,0,0); 
  var cBg=C(40,40,40), cBdr=C(180,180,180), cSep=C(100,100,100);
  var cGrn=C(0,255,0), cYel=C(255,255,0), cBoat=C(139,69,19);
  var cMenuSel=C(0, 255, 255);
  var cGold=C(255, 215, 0); 
  var cCloudNight=C(100,100,100); 
  var cMountDay=C(60,60,60); 
  var cMountNight=C(20,20,40); 
  var cRain=C(150, 150, 200); 
  var cRainSky=C(70, 70, 80); 

  var rCols = [
      C(200,200,200), // 0: Common
      C(50,255,50),   // 1: Uncommon
      C(50,100,255),  // 2: Rare
      C(200,0,255),   // 3: Epic
      C(255,165,0),   // 4: Legend
      C(255,50,50),   // 5: Mythic
      C(0,255,255)    // 6: Secret
  ];

  // --- DATABASE & DEFAULTS ---
  var baseDefaultFish = [{n:"Goldfish", r:0}, {n:"Nemo", r:1}, {n:"Piranha", r:2}, {n:"GreatWhite", r:3}, {n:"Megalodon", r:4}, {n:"Kraken", r:5}, {n:"Cthulhu", r:6}];
  var baseDefaultRods = [{n:"Starter Rod", r:0, p:25, d:50, l:0}, {n:"Heaven Rod", r:6, p:50000, d:350, l:850}];

  var fishDB = []; 
  var rodDB = [];

  function loadDBs() {
      try {
          var c1 = storage.read(fishDbFile);
          if (c1) fishDB = JSON.parse(c1); else throw "e";
      } catch (e) {
          fishDB = baseDefaultFish;
          try { serialCmd("storage remove " + fishDbFile.path); storage.write(fishDbFile, JSON.stringify(baseDefaultFish)); } catch(err){}
      }
      try {
          var c2 = storage.read(rodDbFile);
          if (c2) rodDB = JSON.parse(c2); else throw "e";
      } catch (e) {
          rodDB = baseDefaultRods;
          try { serialCmd("storage remove " + rodDbFile.path); storage.write(rodDbFile, JSON.stringify(baseDefaultRods)); } catch(err){}
      }
  }
  loadDBs();

  // --- GLOBAL VARIABLES ---
  var appState = 0; 
  var menuIdx = 0;
  var invScroll = 0; 
  var invSel = 0;   
  
  var rec = [];
  var luck = [];
  var stars = []; for(var i=0;i<10;i++) stars.push({x:M(R()*gW), y:M(R()*(dh/2))});
  
  var st=0, mode=0; 
  var tmCast=0, tmBite=0, tmAct=0, tmSel=0;
  var curF=null, fStam=0, maxStam=0;
  var tmDay=0, tmSpd=0.25; 
  var wOff=0;
  var notifMsg = ""; 
  var notifTm = 0;
  
  var bird={x:-20,y:10,a:false};
  var isl={x:-40,a:false,t:0}; 
  var ship={x:-40,a:false}; 
  var jmp={x:0,y:0,vy:0,a:false};
  var clouds=[];
  var mountains=[]; 

  // Variabel Hujan
  var rain = { a: false, t: 0, tm: 0, drops: [] };
  var dayCount = 0;
  var nextRainDay = 5 + M(R()*3); 

  // --- ASSETS (FIXED SIZES) ---
  function mkSol(w, h) {
    var sz = Math.ceil(w/8)*h;
    var d = new Uint8Array(sz);
    for(var i=0; i<sz; i++) d[i]=255;
    return d;
  }
  
  var sprToast = mkSol(144, 24);

  // AWAN KECIL (16x8)
  var sCloud = new Uint8Array([
      0,0, 12,48, 30,120, 63,252, 127,254, 127,254, 63,252, 0,0
  ]);

  // GUNUNG "M" (32x16)
  var sMount = new Uint8Array([
      0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 
      0,4,32,0, 0,14,112,0, 0,31,248,0, 0,63,252,0, 
      0,127,254,0, 0,255,255,0, 1,255,255,128, 3,255,255,192, 
      7,255,255,224, 15,255,255,240
  ]);

  // PULAU BESAR (64x16)
  var sBigIsl = new Uint8Array([
      0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 
      0,0,0,60,60,0,0,0, 0,0,1,255,255,128,0,0, 0,0,7,255,255,224,0,0, 0,0,31,255,255,248,0,0,
      0,0,127,255,255,254,0,0, 0,1,255,255,255,255,128,0, 0,7,255,255,255,255,224,0, 0,31,255,255,255,255,248,0,
      0,127,255,255,255,255,254,0, 255,255,255,255,255,255,255,255, 255,255,255,255,255,255,255,255, 255,255,255,255,255,255,255,255
  ]);

  // KAPAL PESIAR (24x12)
  var sBetterShip = new Uint8Array([
      0,0,0,       // Baris 1
      0,0,0,       // Baris 2
      0,0,0,       // Baris 3
      0,0,0,       // Baris 4
      0,12,0,      // Baris 5
      0,12,0,      // Baris 6
      0,31,0,      // Baris 7
      0,31,0,      // Baris 8
      3,255,128,   // Baris 9
      7,255,192,   // Baris 10
      15,255,224,  // Baris 11
      63,255,248   // Baris 12
  ]);

  var sprSky=mkSol(gW,M(dh/2)), sprSea=mkSol(gW,dh-M(dh/2));
  var sprSep=mkSol(2,dh), sprBob=mkSol(4,4);
  
  var barW = (gW-20) & ~7; 
  var sprBar = mkSol(barW,6); 
  var dkH=20, sprDk=mkSol(gW,dkH);
  
  // --- LAYOUT SIDEBAR BARU (FULL FILL) ---
  // bW adalah lebar sisa layar (pastikan kelipatan 8 agar aman)
  var bW = (dw - gW) & ~7; 
  
  // Hitung tinggi 3 kotak agar pas total dh (Display Height)
  var bH1 = M(dh/3);
  var bH2 = M(dh/3);
  // Kotak terakhir (Stats) mengambil sisa pixel agar pas sampai bawah
  var bH3 = dh - bH1 - bH2; 
  
  // --- PERBAIKAN: BITMAP KHUSUS UNTUK SETIAP UKURAN ---
  // Membuat background dan border vertikal khusus untuk setiap tinggi kotak
  var sprBg1 = mkSol(bW, bH1);
  var sprBg2 = mkSol(bW, bH2);
  var sprBg3 = mkSol(bW, bH3);

  var sprV1 = mkSol(1, bH1);
  var sprV2 = mkSol(1, bH2);
  var sprV3 = mkSol(1, bH3);

  // Horizontal border aman karena lebar (bW) sama semua
  var sprH = mkSol(bW, 1);
  
  var sSun = new Uint8Array([0,24,60,126,126,60,24,0]); 
  var sMoon = new Uint8Array([0,28,62,126,112,112,56,0]); 
  var sBird = new Uint8Array([0,0,66,102,60,0,0,0]); 
  var fS = new Uint8Array([8,28,62,127,109,62,20,36]);
  var skyH=M(dh/2), seaH=dh-skyH;

  // --- STORAGE LOGIC ---
  function readJSON(f) {
      try {
          var d = storage.read(f);
          if(d) {
              var lines = d.split("\n");
              for(var i=lines.length-1; i>=0; i--) {
                  if(lines[i] && lines[i].trim().length>0) return JSON.parse(lines[i]);
              }
          }
      } catch(e) {}
      return null;
  }

  function loadData() {
    var mData = readJSON(monFile);
    if(mData && mData.money !== undefined) gameData.money = mData.money;
    var iData = readJSON(invFile);
    if(iData) gameData.items = iData;
    var rData = readJSON(rodInvFile);
    if (rData && rData.length > 0) {
        gameData.rods = rData.map(function(r) { if (r.q === undefined) r.q = 1; return r; });
    } else {
        gameData.rods = [{n:"Bamboo Rod", r:0, p:0, d:0, curD:0, l:0.0, q:1, use:true}];
        saveRods();
    }
  }

  function saveItems() { try { serialCmd("storage remove " + invFile.path); storage.write(invFile, JSON.stringify(gameData.items) + "\n"); } catch(e){} }
  function saveMoney() { try { serialCmd("storage remove " + monFile.path); storage.write(monFile, JSON.stringify({money: gameData.money}) + "\n"); } catch(e){} }
  function saveRods()  { try { serialCmd("storage remove " + rodInvFile.path); storage.write(rodInvFile, JSON.stringify(gameData.rods) + "\n"); } catch(e){} }
  function saveAll() { saveItems(); saveMoney(); saveRods(); }
  loadData();

  function getW(r) {
    var min=1, max=5;
    if(r==1){min=2; max=10;} if(r==2){min=10; max=50;} if(r==3){min=50; max=200;}
    if(r==4){min=200; max=1000;} if(r==5){min=1000; max=5000;} if(r==6){min=5000; max=9999;}
    return min + (R()*(max-min));
  }
  
  function fmtP(n) {
      var i = M(n);
      var f = M((n - i) * 100);
      var s = f.toString();
      if(s.length < 2) s = "0" + s;
      return i + "." + s + "%";
  }

  // --- ROD SYSTEM ---
  function getCurRod() {
      for(var i=0; i<gameData.rods.length; i++) { if(gameData.rods[i].use) return gameData.rods[i]; }
      if(gameData.rods.length === 0) { gameData.rods.push({n:"Bamboo Rod", r:0, p:0, d:0, curD:0, l:0.0, q:1, use:true}); }
      gameData.rods[0].use = true; return gameData.rods[0];
  }

  function autoEquip(brokenRarity) {
      for(var i=0; i<gameData.rods.length; i++) gameData.rods[i].use = false;
      var bestIdx = -1; var bestR = -1;
      for(var i=0; i<gameData.rods.length; i++) {
          var r = gameData.rods[i].r;
          if (r <= brokenRarity) { if (r > bestR) { bestR = r; bestIdx = i; } }
      }
      if (bestIdx === -1 && gameData.rods.length > 0) {
           var minR = 999;
           for(var i=0; i<gameData.rods.length; i++) { if(gameData.rods[i].r < minR) { minR = gameData.rods[i].r; bestIdx = i; } }
      }
      if (bestIdx !== -1) { gameData.rods[bestIdx].use = true; notifMsg = "BROKEN! Used: " + gameData.rods[bestIdx].n; } 
      else { gameData.rods.push({n:"Bamboo Rod", r:0, p:0, d:0, curD:0, l:0.0, q:1, use:true}); notifMsg = "BROKEN! Used: Bamboo Rod"; }
      notifTm = new Date().getTime();
  }

  function useRod() {
      var rod = getCurRod();
      if(rod.d > 0) { 
          rod.curD--;
          if(rod.curD <= 0) {
              if(a&&a.tone) a.tone(100, 500); 
              rod.q--;
              if(rod.q > 0) { rod.curD = rod.d; notifMsg = "BROKEN! Used Spare"; notifTm = new Date().getTime(); } 
              else {
                  var brokenRarity = rod.r; var brokenIdx = -1;
                  for(var i=0; i<gameData.rods.length; i++) { if(gameData.rods[i]===rod) brokenIdx=i; }
                  if(brokenIdx !== -1) gameData.rods.splice(brokenIdx, 1);
                  autoEquip(brokenRarity);
              }
          }
          saveRods();
      }
  }

  function buyRod(idx) {
      var rodToBuy = rodDB[idx];
      if (gameData.money >= rodToBuy.p) {
          gameData.money -= rodToBuy.p;
          var existingIdx = -1;
          for(var i=0; i<gameData.rods.length; i++) { if(gameData.rods[i].n === rodToBuy.n) { existingIdx = i; break; } }
          if (existingIdx !== -1) { gameData.rods[existingIdx].q++; } 
          else { var newRod = { n: rodToBuy.n, r: rodToBuy.r, p: rodToBuy.p, d: rodToBuy.d, curD: rodToBuy.d, l: rodToBuy.l, q: 1, use: false }; gameData.rods.push(newRod); }
          saveAll(); notifMsg = "BOUGHT " + rodToBuy.n; notifTm = new Date().getTime(); if(a&&a.tone) { a.tone(1000, 100); delay(50); a.tone(2000, 200); }
      } else { notifMsg = "NOT ENOUGH MONEY!"; notifTm = new Date().getTime(); if(a&&a.tone) a.tone(200, 200); }
  }

  function equipRod(idx) {
      for(var i=0; i<gameData.rods.length; i++) gameData.rods[i].use = false;
      gameData.rods[idx].use = true; saveRods(); if(a&&a.tone) a.tone(1500, 100);
  }

  function randF() {
    var rod = getCurRod();
    var luckBonus = rod.l || 0; 
    var mult = 1 + (luckBonus / 100.0);
    
    var roll = R() * 100; 
    var r = 0; 
    // UPDATED PROBABILITY: LEBIH MENANTANG
    if (roll < (0.002 * mult)) r = 6;        
    else if (roll < (0.05 * mult)) r = 5;  
    else if (roll < (0.1 * mult)) r = 4;  
    else if (roll < (5.0 * mult)) r = 3; 
    else if (roll < (10.0 * mult)) r = 2; 
    else if (roll < (30.0 * mult)) r = 1; 
    else r = 0;                            
    
    var c = []; for(var i=0; i<fishDB.length; i++) { if(fishDB[i].r === r) c.push(fishDB[i]); }
    if (c.length === 0 && fishDB.length > 0) c.push(fishDB[0]);
    var picked = c[M(R()*c.length)];
    return { n: picked.n, r: r, w: getW(r), hp: 15+(r*10)+(getW(r)*0.01) };
  }

  function addS(f) {
    rec.unshift({name: f.n, w: f.w, r: f.r}); 
    if(rec.length > 3) rec.pop(); // Limit Recent ke 3
    if(f.r >= 3) { luck.push({ name: f.n, r: f.r, w: f.w }); luck.sort(function(a,b){if(b.r!=a.r)return b.r-a.r; return b.w-a.w;}); if(luck.length > 3) luck.pop(); } // Limit Luck ke 3
    if(!gameData.items[f.n]) { gameData.items[f.n] = { q: 0, r: f.r }; }
    gameData.items[f.n].q++; if(gameData.items[f.n].r < f.r) gameData.items[f.n].r = f.r;
    useRod(); saveItems(); 
  }

  function sellF(name) {
      if(gameData.items[name] && gameData.items[name].q > 0) {
          var item = gameData.items[name];
          var totalPrice = sellPrice[item.r] * item.q; 
          gameData.money += totalPrice; delete gameData.items[name]; 
          if(invSel >= Object.keys(gameData.items).length && invSel > 0) invSel--;
          saveAll(); if(a&&a.tone) { a.tone(1200, 50); delay(50); a.tone(1800, 100); } 
      }
  }

  function sellAll() {
      var keys = Object.keys(gameData.items);
      if (keys.length === 0) {
          notifMsg = "NOTHING TO SELL!"; notifTm = new Date().getTime(); if(a&&a.tone) a.tone(200, 200);
          return;
      }
      var total = 0;
      for (var i=0; i<keys.length; i++) {
          var item = gameData.items[keys[i]];
          total += sellPrice[item.r] * item.q;
      }
      gameData.money += total;
      gameData.items = {}; 
      saveAll();
      notifMsg = "SOLD ALL! +$" + total; notifTm = new Date().getTime();
      if(a&&a.tone) { a.tone(1000, 50); delay(50); a.tone(2000, 50); delay(50); a.tone(3000, 100); }
  }

  // UPDATED: Menerima parameter khusus untuk sprite background & vertical border
  function drBox(x,y,h,bg,v,t,c) {
    spr.drawXBitmap(x,y,bg,bW,h,cBg); 
    spr.drawXBitmap(x,y,sprH,bW,1,cBdr); 
    spr.drawXBitmap(x,y+h-1,sprH,bW,1,cBdr); 
    spr.drawXBitmap(x,y,v,1,h,cBdr); 
    spr.drawXBitmap(x+bW-1,y,v,1,h,cBdr);
    spr.setTextColor(c); spr.setTextAlign(1); spr.drawText(t,x+M(bW/2),y+3);
  }
  function fmt(w) { var i=M(w), d=M((w-i)*100), s=d.toString(); if(s.length<2)s="0"+s; return i+"."+s+"kg"; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function getSkyColor(t) {
    var c1, c2, p;
    var rN=[10,10,50], rD=[60,60,100], rM=[135,206,235], rS=[255,160,120];
    if(t<300) { c1=rN; c2=rD; p=t/300; } 
    else if(t<500) { c1=rD; c2=rM; p=(t-300)/200; } 
    else if(t<1500) { c1=rM; c2=rM; p=0; } 
    else if(t<1700) { c1=rM; c2=rS; p=(t-1500)/200; } 
    else if(t<1900) { c1=rS; c2=rN; p=(t-1700)/200; } 
    else { c1=rN; c2=rN; p=0; }
    return C(M(lerp(c1[0],c2[0],p)), M(lerp(c1[1],c2[1],p)), M(lerp(c1[2],c2[2],p)));
  }

  function getSeaColor(t) {
    var c1, c2, p;
    var rN=[5,5,30], rD=[20,40,100], rM=[0,60,150], rS=[60,40,90];
    if(t<300) { c1=rN; c2=rD; p=t/300; } 
    else if(t<500) { c1=rD; c2=rM; p=(t-300)/200; } 
    else if(t<1500) { c1=rM; c2=rM; p=0; } 
    else if(t<1700) { c1=rM; c2=rS; p=(t-1500)/200; } 
    else if(t<1900) { c1=rS; c2=rN; p=(t-1700)/200; } 
    else { c1=rN; c2=rN; p=0; }
    return C(M(lerp(c1[0],c2[0],p)), M(lerp(c1[1],c2[1],p)), M(lerp(c1[2],c2[2],p)));
  }

  k.setLongPress(true);
  while(true) {
    var now = new Date().getTime();
    var ok = k.getSelPress(true);
    var nxt = k.getNextPress(true);
    var prv = k.getPrevPress(true);
    
    if(k.getEscPress(true)) {
        if(a&&a.tone) a.tone(400, 50);
        if(appState === 0) break; 
        else if(appState === 1) appState = 0; 
        else if(appState === 2) appState = 0; 
        else if(appState === 3) appState = 2; 
        else if(appState === 4) appState = 2; 
        else if(appState === 5) appState = 0; 
        else if(appState === 6) appState = 5; 
        else if(appState === 7) appState = 5; 
        delay(200);
        continue;
    }

    spr.fill(cK);
    spr.setTextColor(cW);
    spr.setTextAlign(1);

    if (notifMsg !== "" && now - notifTm > 2500) { notifMsg = ""; }

    if (appState === 0) {
        spr.setTextSize(2); spr.drawText("FISHING LEGEND", dw/2, 20); spr.setTextSize(1);
        spr.setTextColor(cGold); spr.drawText("$ " + gameData.money, dw/2, 45);
        var opts = ["START GAME", "SHOP", "INVENTORY", "EXIT"];
        if (nxt) { menuIdx++; if (menuIdx >= opts.length) menuIdx=0; if(a&&a.tone)a.tone(600,20); }
        if (prv) { menuIdx--; if (menuIdx < 0) menuIdx=opts.length-1; if(a&&a.tone)a.tone(600,20); }
        var menuY = 65;
        for (var i = 0; i < opts.length; i++) {
            if (i === menuIdx) { spr.setTextColor(cMenuSel); spr.drawText("> " + opts[i] + " <", dw/2, menuY + (i*15)); } 
            else { spr.setTextColor(C(100, 100, 100)); spr.drawText(opts[i], dw/2, menuY + (i*15)); }
        }
        if (ok) {
            if(a&&a.tone) a.tone(800, 100);
            if (menuIdx === 0) { appState = 1; st = 0; rec = []; luck = []; } 
            else if (menuIdx === 1) { appState = 5; menuIdx = 0; } 
            else if (menuIdx === 2) { appState = 2; menuIdx = 0; } 
            else if (menuIdx === 3) { break; } 
            delay(200);
        }

    } else if (appState === 1) {
        var activeRod = getCurRod();
        // DEFINISI RODCOL DIPINDAHKAN KE ATAS SINI
        var rodCol = (activeRod.r === 0 && activeRod.p === 0) ? cRodDefault : rCols[activeRod.r]; 
        
        var vld = ok; 
        tmDay += tmSpd; if(tmDay>2000) { 
            tmDay=0; 
            dayCount++;
            if(dayCount >= nextRainDay) {
                rain.a = true;
                rain.t = (R() > 0.7) ? 1 : 0; 
                rain.tm = 800 + M(R()*400);    
                nextRainDay = dayCount + 5 + M(R()*3); 
            }
        }
        var curSky = getSkyColor(tmDay);
        var curSea = getSeaColor(tmDay); 
        var isN = (tmDay < 400 || tmDay > 1800); 

        if (rain.a) {
             rain.tm--;
             if(rain.tm <= 0) rain.a = false;
             if (now % 2 === 0) {
                 var spawnRate = (rain.t===1) ? 2 : 1; 
                 for(var i=0; i<spawnRate; i++) {
                     if(rain.drops.length < 40) { 
                        rain.drops.push({x: M(R()*gW), y: -10, l: (rain.t===1)?6:3, s: (rain.t===1)?5:3});
                     }
                 }
             }
        }
        for (var i = rain.drops.length - 1; i >= 0; i--) {
            var p = rain.drops[i];
            p.y += p.s;
            if (rain.t === 1) p.x -= 2; 
            if (p.y > dh - 20) rain.drops.splice(i, 1);
        }
        
        if(R() > 0.985 && clouds.length < 3) { clouds.push({x: gW + 10, y: 5 + R()*20, s: 0.1 + R()*0.2}); }
        for(var i=clouds.length-1; i>=0; i--) { clouds[i].x -= clouds[i].s; if(clouds[i].x < -40) clouds.splice(i, 1); }

        if(R() > 0.995 && mountains.length < 2) { mountains.push({x: gW + 20}); }
        for(var i=mountains.length-1; i>=0; i--) { mountains[i].x -= 0.05; if(mountains[i].x < -40) mountains.splice(i, 1); }

        if(!isN && R()>0.98 && !bird.a) { bird.a=true; bird.x=-10; bird.y=5+R()*20; }
        if(bird.a) { bird.x++; if(bird.x>gW) bird.a=false; }
        
        if(!isl.a && R()>0.995) { isl.a=true; isl.x=gW; }
        if(isl.a) { isl.x-=0.2; if(isl.x<-70) isl.a=false; }

        if(!ship.a && R()>0.993) { ship.a=true; ship.x=gW+10; }
        if(ship.a) { ship.x-=0.3; if(ship.x<-30) ship.a=false; }
        if(!jmp.a && R()>0.99) { jmp.a=true; jmp.x=20+R()*(gW-40); jmp.y=skyH+5; jmp.vy=-2.5; }
        if(jmp.a) { jmp.y+=jmp.vy; jmp.vy+=0.2; if(jmp.y>skyH+10) jmp.a=false; }
        if(now%200<20) wOff=M(R()*(isN?2:4));

        if(st===0) { st=1; tmCast=now; tmBite=tmCast+1000+(R()*2000); } 
        else if(st===1) { 
          if(nxt||prv) { mode=(mode===0)?1:0; if(a&&a.tone)a.tone(600,50); }
          if(now>tmBite) { curF=randF(); fStam=curF.hp; maxStam=fStam; st=2; tmAct=now; if(a&&a.tone){a.tone(800,100);delay(50);a.tone(800,100);} }
        } else if(st===2) { 
          if(nxt||prv) { mode=(mode===0)?1:0; if(mode===0)tmAct=now; if(a&&a.tone)a.tone(600,50); }
          fStam += (0.3+(curF.r*0.1)); if(fStam>maxStam)fStam=maxStam;
          var barY = dh - 35; 
          if(mode===0) { if(vld) { fStam-=8; tmAct=now; if(a&&a.tone)a.tone(200,20); } if(now-tmAct>3000) { st=5; if(a&&a.tone)a.tone(100,500); } } 
          else { fStam-=1.5; if(now%500<50 && a&&a.tone)a.tone(200,10); }
          if(fStam<=0) { addS(curF); if(a&&a.tone){a.tone(1000,100);a.tone(1500,300);} st=0; }
        } else if(st===5) { if(vld || (now-tmAct>1500)) st=0; }

        var drawSky = curSky;
        if (rain.a && !isN) drawSky = cRainSky; 

        spr.drawXBitmap(0,0,sprSky,gW,skyH,drawSky);
        spr.drawXBitmap(0,skyH,sprSea,gW,seaH,curSea);

        for(var i=0; i<mountains.length; i++) { spr.drawXBitmap(M(mountains[i].x), skyH-16, sMount, 32, 16, isN?cMountNight:cMountDay); }

        var cloudCol = isN ? cCloudNight : cW;
        for(var i=0; i<clouds.length; i++) { spr.drawXBitmap(M(clouds[i].x), M(clouds[i].y), sCloud, 16, 8, cloudCol); }

        if(isN) { spr.setTextColor(cStar); for(var j=0;j<stars.length;j++) if((tmDay+j)%3!=0) spr.drawPixel(stars[j].x,stars[j].y,cStar); var mX = (tmDay>1700) ? M((tmDay-1700)/800*gW) : M((300+tmDay)/800*gW)+gW/2; spr.drawXBitmap(mX,10,sMoon,8,8,cMoon); } 
        else { var sXPos = M((tmDay-500)/1200*gW), sYPos = 30-M(Math.sin((tmDay-500)/1200*3.14)*20); if(!rain.a) spr.drawXBitmap(sXPos,sYPos,sSun,8,8,cSun); if(bird.a) spr.drawXBitmap(M(bird.x),M(bird.y),sBird,8,8,cBird); }
        
        if(isl.a) { spr.drawXBitmap(M(isl.x), skyH-16, sBigIsl, 64, 16, isN?cBird:cIsl); }
        if(ship.a) { spr.drawXBitmap(M(ship.x), skyH-12, sBetterShip, 24, 12, isN?cBird:cShip); }
        
        if(jmp.a) spr.drawXBitmap(M(jmp.x),M(jmp.y),fS,8,8,cW);
        for(var y=skyH+5;y<dh-dkH;y+=8) { if(((tmDay/5)+y)%10 > 5) { var wy=y+wOff; if(wy<dh-dkH) spr.drawLine(5,wy,gW-5,wy,cWave); } }
        spr.drawXBitmap(gW,0,sprSep,2,dh,cSep);
        spr.drawXBitmap(0,dh-dkH,sprDk,gW,dkH,cBoat);

        for(var i=0; i<rain.drops.length; i++) {
            var p = rain.drops[i];
            if (rain.t === 1) spr.drawLine(p.x, p.y, p.x-2, p.y+p.l, cRain); 
            else spr.drawLine(p.x, p.y, p.x, p.y+p.l, cRain); 
        }

        var rodBaseX = gW + 10; var rodBaseY = dh + 10; var rodTipX = (gW / 2); var rodTipY = (dh / 2) - 20;
        if (st === 2 && M(now/200)%2===0) { rodTipY -= 8; rodTipX += 3; }
        for(var t=0; t<3; t++) { spr.drawLine(rodBaseX+t, rodBaseY, rodTipX+t, rodTipY, (t===1)?rodCol:C(40,20,0)); }
        if(st==1||st==2) {
          var bobX = (gW / 2); var bobY = (dh / 2) + 10; bobY += wOff; 
          if (st === 2) { bobX += (Math.random() * 6) - 3; bobY += (Math.random() * 4) - 2; }
          spr.drawLine(rodTipX, rodTipY, bobX, bobY, cK);
          if (st === 1) { bobY += (Math.sin(now/300) * 2); spr.drawXBitmap(M(bobX)-2,M(bobY)-2,sprBob,4,4,cRed); } 
          else if (st === 2) { spr.setTextColor(cW); spr.setTextAlign(1); spr.drawText("!",M(bobX),M(bobY)-15); }
        }

        spr.setTextSize(1);
        spr.setTextColor(cW); spr.setTextAlign(1); var cX=gW/2;
        if(st==0) spr.drawText("CASTING...",cX,dh-10);
        else if(st==1) { spr.drawText("WAITING...",cX,dh-20); spr.setTextColor(mode==1?cGrn:cYel); spr.drawText(mode==1?"< AUTO >":"< MAN >",cX,dh-8); } 
        else if(st==2) {
          spr.drawText(mode==1?"REELING...":"MASH OK!",cX,dh-15);
          var bX=(gW-barW)/2, pct=fStam/maxStam; if(pct<0)pct=0;
          spr.drawXBitmap(M(bX), barY, sprBar,barW,6,cW);
          var fW=M((barW-2)*pct);
          if(fW>0) { var sx=M(bX+1); for(var l=0;l<4;l++) spr.drawLine(sx,barY+1+l,sx+fW,barY+1+l,cBar); }
        } else if(st==5) { spr.setTextColor(cRed); spr.drawText("ESCAPED!",cX,dh/2); spr.setTextColor(cW); spr.drawText("Too Slow!",cX,dh/2+15); }

        // --- NEW SIDEBAR LOGIC (No Game Overlay) ---
        // Posisinya sekarang sX (awal sidebar)
        var pX=sX; 
        
        // BOX 1: RECENT (Mulai y=0, Tinggi=bH1)
        drBox(pX,0,bH1,sprBg1,sprV1,"RECENT",C(100,255,255));
        spr.setTextSize(1);
        for(var i=0;i<Math.min(rec.length, 3);i++) { // Limit 3
          var f=rec[i], y=18+(i*10); spr.setTextAlign(0); spr.setTextColor(rCols[f.r]); 
          var n=f.name; if(n.length>10)n=n.substring(0,10); spr.drawText(n,pX+3,y);
          spr.setTextAlign(2); spr.setTextColor(cW); spr.drawText(fmt(f.w),pX+bW-3,y);
        }
        
        // BOX 2: TOP LUCK (Mulai y=bH1, Tinggi=bH2)
        var y2 = bH1; 
        drBox(pX,y2,bH2,sprBg2,sprV2,"TOP LUCK",C(255,200,0));
        if(luck.length==0) { spr.setTextAlign(0); spr.setTextColor(C(150,150,150)); spr.drawText("- Empty -",pX+3,y2+18); }
        else {
          for(var i=0;i<Math.min(luck.length, 3);i++) { // Limit 3
            var f=luck[i], y=y2+18+(i*10); spr.setTextAlign(0); spr.setTextColor(rCols[f.r]);
            var n=f.name; if(n.length>10)n=n.substring(0,10); spr.drawText(n,pX+3,y);
            spr.setTextAlign(2); spr.setTextColor(cW); spr.drawText(fmt(f.w),pX+bW-3,y);
          }
        }

        // BOX 3: STATS (Mulai y=bH1+bH2, Tinggi=bH3)
        var y3 = bH1 + bH2;
        drBox(pX, y3, bH3, sprBg3, sprV3, "STATS", C(0, 255, 100));
        
        var mult = 1 + ((activeRod.l || 0) / 100.0);

        // --- KOLOM KIRI: INFO ROD ---
        spr.setTextAlign(0); 
        
        // Baris 1: Nama Rod
        spr.setTextColor(rodCol); 
        var dRodName = activeRod.n; 
        // Potong nama jika lebih dari 12 karakter
        if(dRodName.length > 12) dRodName = dRodName.substring(0,12) + "..";
        spr.drawText(dRodName, pX+3, y3+16);
        
        spr.setTextColor(cW);
        // Baris 2: Durability (D: Cur/Max)
        var durText = (activeRod.d === 0) ? "Inf" : activeRod.curD + "/" + activeRod.d;
        spr.drawText("D:" + durText, pX+3, y3+26);

        // Baris 3: Quantity (Q: xN)
        spr.drawText("Q:x" + activeRod.q, pX+3, y3+36);

        // Baris 4: Luck (L: +N%)
        spr.drawText("L:+" + activeRod.l + "%", pX+3, y3+46);

        // --- KOLOM KANAN: DROP RATES ---
        spr.setTextAlign(2);
        
        // Baris 1: Epic (Ungu)
        spr.setTextColor(rCols[3]); 
        spr.drawText(fmtP(5.0 * mult), pX+bW-3, y3+16);
        
        // Baris 2: Legend (Oranye)
        spr.setTextColor(rCols[4]); 
        spr.drawText(fmtP(0.1 * mult), pX+bW-3, y3+26); 

        // Baris 3: Mythic (Merah)
        spr.setTextColor(rCols[5]); 
        spr.drawText(fmtP(0.05 * mult), pX+bW-3, y3+36); 
        
        // Baris 4: Secret (Cyan)
        spr.setTextColor(rCols[6]); 
        spr.drawText(fmtP(0.002 * mult), pX+bW-3, y3+46); 

    } else if (appState === 2) { 
        spr.drawText("INVENTORY", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        var opts = ["FISH", "ROD", "SELL ALL", "BACK"];
        if (nxt) { menuIdx++; if (menuIdx >= opts.length) menuIdx=0; if(a&&a.tone)a.tone(600,20); }
        if (prv) { menuIdx--; if (menuIdx < 0) menuIdx=opts.length-1; if(a&&a.tone)a.tone(600,20); }
        for (var i = 0; i < opts.length; i++) {
            if (i === menuIdx) { spr.setTextColor(cMenuSel); spr.drawText("> " + opts[i] + " <", dw/2, 60 + (i*20)); } 
            else { spr.setTextColor(C(100, 100, 100)); spr.drawText(opts[i], dw/2, 60 + (i*20)); }
        }
        if (ok) {
            if(a&&a.tone) a.tone(800, 100);
            if (menuIdx === 0) { loadData(); appState = 3; invScroll=0; invSel=0; } 
            else if (menuIdx === 1) { loadData(); appState = 4; invScroll=0; invSel=0; } 
            else if (menuIdx === 2) { sellAll(); }
            else if (menuIdx === 3) { appState = 0; } 
            delay(200);
        }

    } else if (appState === 3) {
        var keys = Object.keys(gameData.items);
        keys.sort(function(a, b) { var rA = gameData.items[a].r; var rB = gameData.items[b].r; if (rB !== rA) return rB - rA; if (a < b) return -1; if (a > b) return 1; return 0; });
        spr.drawText("FISH (" + keys.length + ")  $" + gameData.money, dw/2, 10); spr.drawLine(20, 22, dw-20, 22, cSep);
        if (keys.length === 0) { spr.setTextColor(C(150,150,150)); spr.drawText("(Empty - Catch fish!)", dw/2, dh/2); } 
        else {
           var maxLines = 5; 
           if(nxt) { invSel++; if(invSel >= keys.length) invSel = keys.length - 1; if(invSel >= invScroll + maxLines) invScroll = invSel - maxLines + 1; if(a&&a.tone) a.tone(600,20); }
           if(prv) { invSel--; if(invSel < 0) invSel = 0; if(invSel < invScroll) invScroll = invSel; if(a&&a.tone) a.tone(600,20); }
           spr.setTextAlign(0);
           for(var i=0; i<maxLines; i++) {
               var idx = invScroll + i;
               if(idx < keys.length) {
                   var kName = keys[idx];
                   var item = gameData.items[kName];
                   var price = sellPrice[item.r];
                   if(idx === invSel) { spr.drawRect(18, 33+(i*18), dw-36, 16, cMenuSel); }
                   spr.setTextColor(rCols[item.r]); spr.drawText(kName, 22, 35 + (i*18));
                   spr.setTextColor(cW); spr.drawText("x" + item.q, 100, 35 + (i*18));
                   spr.setTextColor(cGold); spr.drawText("$" + price, dw-40, 35 + (i*18));
               }
           }
           if (ok && keys.length > 0) { sellF(keys[invSel]); delay(150); }
           if(keys.length > maxLines) { spr.setTextAlign(1); spr.setTextColor(C(100,100,100)); spr.drawText((invSel+1) + "/" + keys.length, dw/2, dh-22); }
        }
        spr.setTextAlign(1); spr.setTextColor(cMenuSel); spr.drawText("[OK] SELL   [ESC] BACK", dw/2, dh-12);

    } else if (appState === 4) {
        spr.drawText("MY RODS", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        var maxLines = 5;
        var myRods = gameData.rods;
        if (myRods.length === 0) { spr.setTextColor(C(150,150,150)); spr.drawText("(No rods?)", dw/2, dh/2); } 
        else {
             if(nxt) { invSel++; if(invSel >= myRods.length) invSel = myRods.length-1; if(invSel >= invScroll + maxLines) invScroll = invSel - maxLines + 1; if(a&&a.tone)a.tone(600,20); }
             if(prv) { invSel--; if(invSel < 0) invSel = 0; if(invSel < invScroll) invScroll = invSel; if(a&&a.tone)a.tone(600,20); }
             spr.setTextAlign(0);
             for(var i=0; i<maxLines; i++) {
                 var idx = invScroll + i;
                 if(idx < myRods.length) {
                     var rod = myRods[idx];
                     var yPos = 35 + (i*22); 
                     if(idx === invSel) { spr.drawRect(5, yPos-2, dw-10, 20, cMenuSel); }
                     var xOff = 10;
                     if(rod.use) { spr.setTextColor(cGrn); spr.drawText("[E]", xOff, yPos); xOff += 20; }
                     spr.setTextColor(rCols[rod.r]); var dispName = rod.n + " x" + rod.q; spr.drawText(dispName, xOff, yPos);
                     spr.setTextSize(0.5); spr.setTextColor(C(200,200,200));
                     var durT = (rod.d === 0) ? "INF" : rod.curD + "/" + rod.d;
                     spr.drawText("Luck:+" + rod.l + "%  Dur:" + durT, xOff, yPos+10);
                     spr.setTextSize(1);
                 }
             }
             if(ok) { equipRod(invSel); delay(150); }
             if(myRods.length > maxLines) { spr.setTextAlign(1); spr.setTextColor(C(100,100,100)); spr.drawText((invSel+1) + "/" + myRods.length, dw/2, dh-22); }
        }
        spr.setTextAlign(1); spr.setTextColor(cMenuSel); spr.drawText("[OK] EQUIP   [ESC] BACK", dw/2, dh-12);

    } else if (appState === 5) {
        spr.drawText("SHOP", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        spr.setTextColor(cGold); spr.drawText("$ " + gameData.money, dw/2, 45);
        var opts = ["ROD", "CHARM", "BACK"];
        if (nxt) { menuIdx++; if (menuIdx >= opts.length) menuIdx=0; if(a&&a.tone)a.tone(600,20); }
        if (prv) { menuIdx--; if (menuIdx < 0) menuIdx=opts.length-1; if(a&&a.tone)a.tone(600,20); }
        for (var i = 0; i < opts.length; i++) {
            if (i === menuIdx) { spr.setTextColor(cMenuSel); spr.drawText("> " + opts[i] + " <", dw/2, 65 + (i*20)); } 
            else { spr.setTextColor(C(100, 100, 100)); spr.drawText(opts[i], dw/2, 65 + (i*20)); }
        }
        if (ok) {
            if(a&&a.tone) a.tone(800, 100);
            if (menuIdx === 0) { appState = 6; invScroll=0; invSel=0; loadDBs(); } 
            else if (menuIdx === 1) { appState = 7; } 
            else if (menuIdx === 2) { appState = 0; } 
            delay(200);
        }

    } else if (appState === 6) {
        spr.drawText("ROD SHOP", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        spr.setTextColor(cGold); spr.drawText("$ " + gameData.money, dw/2, 45); 
        var maxLines = 5;
        if(nxt) { invSel++; if(invSel >= rodDB.length) invSel = rodDB.length-1; if(invSel >= invScroll + maxLines) invScroll = invSel - maxLines + 1; if(a&&a.tone)a.tone(600,20); }
        if(prv) { invSel--; if(invSel < 0) invSel = 0; if(invSel < invScroll) invScroll = invSel; if(a&&a.tone)a.tone(600,20); }
        spr.setTextAlign(0);
        for(var i=0; i<maxLines; i++) {
            var idx = invScroll + i;
            if(idx < rodDB.length) {
                var rItem = rodDB[idx];
                if(idx === invSel) { spr.drawRect(5, 53+(i*22), dw-10, 20, cMenuSel); }
                spr.setTextColor(rCols[rItem.r]); spr.drawText(rItem.n, 10, 55 + (i*22));
                spr.setTextSize(0.5); spr.setTextColor(C(200,200,200));
                var durT = (rItem.d===0)?"INF":rItem.d;
                spr.drawText("Luck:+" + rItem.l + "% Dur:" + durT, 10, 65 + (i*22));
                spr.setTextSize(1);
                if(rItem.p > 0) { spr.setTextColor(cGold); spr.drawText("$" + rItem.p, dw-50, 55 + (i*22)); } 
                else { spr.setTextColor(cGrn); spr.drawText("FREE", dw-50, 55 + (i*22)); }
            }
        }
        if(ok) { buyRod(invSel); delay(200); }
        spr.setTextAlign(1); spr.setTextColor(cMenuSel); spr.drawText("[OK] BUY   [ESC] BACK", dw/2, dh-12);

    } else if (appState === 7) {
        spr.drawText("CHARM SHOP", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        spr.setTextColor(C(150,150,150)); spr.drawText("(Coming Soon)", dw/2, dh/2);
        spr.setTextColor(cMenuSel); spr.drawText("[ESC] BACK", dw/2, dh-12);
    }

    if(notifMsg !== "") {
        // FIX: TOAST 144x24 (Width harus match dengan pembuatan bitmap)
        var toastY = 30; var toastH = 24; var tW = 144;
        spr.drawXBitmap(dw/2 - (tW/2), toastY, sprToast, tW, toastH, C(0,0,0)); 
        spr.drawRect(dw/2 - (tW/2), toastY, tW, toastH, cW);        
        spr.setTextColor(cGold); spr.setTextAlign(1); spr.drawText(notifMsg, dw/2, toastY + 8);
    }

    spr.pushSprite(); 
    delay(20);
  }
  k.setLongPress(false);
}
main();