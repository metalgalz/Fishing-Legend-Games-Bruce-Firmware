var d = require('display');
var k = require('keyboard');
var a = require('audio');
var storage = require('storage');
var serialApi = require('serial'); 

// --- ALIAS (RAM SAVER) ---
var M = Math.floor;
var R = Math.random;
var C = d.color;
var spr = d.createSprite();
var serialCmd = serialApi.cmd; 

function main() {
  // --- GENERAL CONFIGURATION ---
  var dw = d.width();
  var dh = d.height();

  // FIX: Ensure Game Width (gW) is strictly aligned to 8 bits for safe bitmaps
  var gW = M(dw * 0.50) & ~7; 
  if (gW < 16) gW = 16; 
   
  var sX = gW;        

  // --- CONFIG FILE ---
  var folderPath = "/FishingLegendDB";
  try { serialCmd("storage mkdir " + folderPath); } catch(e) {} 

  var fishDbFile = {fs:"sd", path: folderPath + "/fish.json"}; 
  var rodDbFile  = {fs:"sd", path: folderPath + "/rod.json"}; 
  var charmDbFile= {fs:"sd", path: folderPath + "/charm.json"}; 
  var levelDbFile= {fs:"sd", path: folderPath + "/level.json"}; 
   
  var invFile    = {fs:"sd", path: folderPath + "/myfish.json"}; 
  var rodInvFile = {fs:"sd", path: folderPath + "/myrod.json"}; 
  var charmInvFile={fs:"sd", path: folderPath + "/mycharm.json"}; 
  var monFile    = {fs:"sd", path: folderPath + "/mymoney.json"};
  var levelInvFile={fs:"sd", path: folderPath + "/mylevel.json"}; 
   
  // Game State Data
  var gameData = { money: 0, items: {}, rods: [], charms: [], level: 1, exp: 0.00 }; 

  var sellPrice = [
    700,             // Common
    2500,            // Uncommon
    65000,           // Rare
    250000,          // Epic
    2500000,         // Legend
    95000000,        // Mythic
    850000000        // Secret
  ];

  // --- COLOR PALETTE ---
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
  var cDanger=C(255, 50, 50);
  var cExp=C(0, 200, 255); 

  var rCols = [
      C(200,200,200), // 0: Common
      C(50,255,50),   // 1: Uncommon
      C(50,100,255),  // 2: Rare
      C(200,0,255),   // 3: Epic
      C(255,165,0),   // 4: Legend
      C(255,50,50),   // 5: Mythic
      C(0,255,255)    // 6: Secret
  ];

  var baseDefaultFish = [{n:"Goldfish", r:0}, {n:"Nemo", r:1}, {n:"Piranha", r:2}, {n:"GreatWhite", r:3}, {n:"Megalodon", r:4}, {n:"Kraken", r:5}, {n:"Cthulhu", r:6}];
  // Placeholder, will be overwritten by JSON load if exists
  var baseDefaultRods = [{n:"Starter Rod", r:0, p:100, d:40, l:10}];
  var baseDefaultCharms = [{n:"Rusty Coin", r:1, p:50000, d:25, l:1000}];
  var baseDefaultLevels = [{l:1, x:50}, {l:2, x:120}];

  var fishDB = []; 
  var rodDB = [];
  var charmDB = [];
  var levelDB = []; 
  var shopList = [];

  function loadDBs() {
      try {
          var c1 = storage.read(fishDbFile);
          if (c1) fishDB = JSON.parse(c1); else throw "e";
      } catch (e) {
          fishDB = baseDefaultFish;
          // Fish DB is minimal as prices are in JS now
          try { serialCmd("storage remove " + fishDbFile.path); storage.write(fishDbFile, JSON.stringify(baseDefaultFish)); } catch(err){}
      }
      try {
          var c2 = storage.read(rodDbFile);
          if (c2) rodDB = JSON.parse(c2); else throw "e";
      } catch (e) {
          rodDB = baseDefaultRods;
      }
      try {
          var c3 = storage.read(charmDbFile);
          if (c3) charmDB = JSON.parse(c3); else throw "e";
      } catch (e) {
          charmDB = baseDefaultCharms;
      }
      try {
          var c4 = storage.read(levelDbFile);
          if (c4) levelDB = JSON.parse(c4); else throw "e";
      } catch (e) {
          levelDB = baseDefaultLevels;
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
   
  var st=0, mode=0; // mode: 0=Auto, 1=Man, 2=Menu
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

  var rain = { a: false, t: 0, tm: 0, drops: [] };
  var dayCount = 0;
  var nextRainDay = 5 + M(R()*3); 

  // --- ASSETS (FIXED SIZES) ---
  function mkSol(w, h) {
    if (w < 1) w = 1;
    if (h < 1) h = 1;
    var stride = (w + 7) >> 3;
    var sz = stride * h;
    var d = new Uint8Array(sz);
    for(var i=0; i<sz; i++) d[i]=255;
    return d;
  }
   
  var sprToast = mkSol(144, 24);
  var sprBadge = mkSol(24, 12); 
  var sCloud = new Uint8Array([0,0, 12,48, 30,120, 63,252, 127,254, 127,254, 63,252, 0,0]);
  var sMount = new Uint8Array([
    0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 
    0,1,128,0, 0,3,192,0, 0,7,224,0, 0,15,240,0,
    0,31,248,0, 0,63,252,0, 0,127,254,0, 0,255,255,0,
    1,255,255,128, 3,255,255,192, 7,255,255,224, 15,255,255,240
  ]);
  var sBigIsl = new Uint8Array([
    0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0, 0,0,0,0,24,0,0,0, 0,0,0,1,255,128,0,0, 0,0,0,7,255,224,0,0,
    0,0,0,31,255,248,0,0, 0,0,0,127,255,254,0,0, 0,0,1,255,255,255,128,0, 0,0,7,255,255,255,224,0,
    0,0,31,255,255,255,248,0, 0,0,127,255,255,255,254,0, 0,3,255,255,255,255,255,0, 255,255,255,255,255,255,255,255
  ]);
  var sBetterShip = new Uint8Array([
    0,0,0, 0,0,0, 0,0,0, 0,8,0, 0,12,0, 0,14,0, 
    0,31,0, 0,31,0, 1,255,0, 15,255,224, 63,255,248, 127,255,252
  ]);

  // Dynamic Backgrounds
  var skyH = M(dh/2);
  var seaH = dh - skyH;
  var sprSky = mkSol(gW, skyH); 
  var sprSea = mkSol(gW, seaH);
  var sprSep = mkSol(2, dh); 
  var sprBob = mkSol(4, 4);
   
  // Bar Logic
  var barW = (gW-20) & ~7; 
  if(barW < 8) barW = 8; 
  var sprBar = mkSol(barW,6); 
  var dkH=20; 
  var sprDk=mkSol(gW,dkH);
   
  // Sidebar Logic
  var bW = ((dw-gW)-6) & ~7; 
  if(bW < 8) bW = 8; 
   
  var bH1 = M(dh/3);
  var bH2 = M(dh/3);
  var bH3 = dh - bH1 - bH2; 
   
  var sprBg1 = mkSol(bW, bH1);
  var sprBg2 = mkSol(bW, bH2);
  var sprBg3 = mkSol(bW, bH3);
  var sprV1 = mkSol(1, bH1);
  var sprV2 = mkSol(1, bH2);
  var sprV3 = mkSol(1, bH3);
  var sprH = mkSol(bW, 1);
   
  var sSun = new Uint8Array([0,24,60,126,126,60,24,0]); 
  var sMoon = new Uint8Array([0,28,62,126,112,112,56,0]); 
  var sBird = new Uint8Array([0,0,66,102,60,0,0,0]); 
  var fS = new Uint8Array([8,28,62,127,109,62,20,36]);

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

    // --- SYNC ROD STATS (AUTO UPDATE) ---
    var rodSpecs = {
        "Bamboo Rod": {r:0, p:0, d:0, l:5},
        "10+ Rod": {r:2, p:0, d:0, l:50, reqL:10},
        "20+ Rod": {r:3, p:0, d:0, l:100, reqL:20},
        "40+ Rod": {r:4, p:0, d:0, l:1000, reqL:40},
        "60+ Rod": {r:5, p:0, d:0, l:5000, reqL:60}
    };

    if (rData && rData.length > 0) {
        gameData.rods = rData.map(function(r) { 
            if (r.q === undefined) r.q = 1; 
            // Update stats if rod matches specific blueprints
            if (rodSpecs[r.n]) {
                var s = rodSpecs[r.n];
                r.r = s.r; r.p = s.p; r.d = s.d; r.l = s.l;
                if(s.reqL) r.reqL = s.reqL;
                if(r.d === 0) r.curD = 0; // Reset durability for infinite rods
            }
            return r; 
        });
        saveRods(); // Force update file with new stats immediately
    } else {
        // FIX: Default is now Bamboo Rod (Durability 0 = Infinite)
        gameData.rods = [{n:"Bamboo Rod", r:0, p:0, d:0, curD:0, l:5, q:1, use:true}];
        saveRods();
    }
    var cData = readJSON(charmInvFile);
    if (cData && cData.length > 0) {
        gameData.charms = cData;
    } else {
        gameData.charms = []; 
    }
    var lData = readJSON(levelInvFile);
    if (lData) {
        gameData.level = lData.lvl || 1;
        gameData.exp = lData.exp || 0.00;
    } else {
        gameData.level = 1;
        gameData.exp = 0.00;
        saveLevel();
    }
  }

  function saveItems() { try { serialCmd("storage remove " + invFile.path); storage.write(invFile, JSON.stringify(gameData.items) + "\n"); } catch(e){} }
  function saveMoney() { try { serialCmd("storage remove " + monFile.path); storage.write(monFile, JSON.stringify({money: gameData.money}) + "\n"); } catch(e){} }
  function saveRods()  { try { serialCmd("storage remove " + rodInvFile.path); storage.write(rodInvFile, JSON.stringify(gameData.rods) + "\n"); } catch(e){} }
  function saveCharms(){ try { serialCmd("storage remove " + charmInvFile.path); storage.write(charmInvFile, JSON.stringify(gameData.charms) + "\n"); } catch(e){} }
  function saveLevel() { try { serialCmd("storage remove " + levelInvFile.path); storage.write(levelInvFile, JSON.stringify({lvl: gameData.level, exp: gameData.exp}) + "\n"); } catch(e){} }
  function saveAll() { saveItems(); saveMoney(); saveRods(); saveCharms(); saveLevel(); }
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

  // --- BALANCING: NEW MONEY FORMATTER ---
  // Handles Millions, Billions (B), and Trillions (T) to fit on the screen
  function fmtM(n) {
      if (n >= 1000000000000) return (n / 1000000000000).toFixed(2) + "T";
      if (n >= 1000000000) return (n / 1000000000).toFixed(2) + "B";
      if (n >= 1000000) return (n / 1000000).toFixed(2) + "M";
      if (n >= 1000) return (n / 1000).toFixed(1) + "k";
        
      var s = M(n).toString();
      var res = "";
      var cnt = 0;
      for (var i = s.length - 1; i >= 0; i--) {
          res = s.charAt(i) + res;
          cnt++;
          if (cnt % 3 === 0 && i !== 0) res = "," + res;
      }
      return res;
  }

  function fmtExp(n) {
      if (n >= 1000000) {
          var v = (n / 1000000).toFixed(2);
          if(v.length > 4) v = (n / 1000000).toFixed(1);
          return v + "m";
      }
      if (n >= 1000) {
          return M(n / 1000) + "k";
      }
      return fmtM(M(n));
  }
   
  function drInfo(y) {
      var max = getLevelMax(gameData.level);
      var expStr = "";
      if (gameData.level >= 100) {
          expStr = "MAX";
      } else {
          expStr = fmtExp(gameData.exp) + "/" + fmtExp(max);
      }
      var infoStr = "$ " + fmtM(gameData.money) + " | Lvl: " + gameData.level + " (" + expStr + ")";
      spr.setTextColor(cGold); 
      spr.drawText(infoStr, dw/2, y);
  }

  function drShopStats() {
      spr.setTextAlign(0); // Left
      spr.setTextColor(cW);
      spr.drawText("Lv : " + gameData.level, 10, 10);
      spr.setTextAlign(1); // Center
      spr.setTextColor(cGold); 
      spr.drawText("$ " + fmtM(gameData.money), dw/2, 45);
  }

  // --- ROD SYSTEM ---
  function getCurRod() {
      for(var i=0; i<gameData.rods.length; i++) { if(gameData.rods[i].use) return gameData.rods[i]; }
      // FIX: Default fallback is Bamboo Rod
      if(gameData.rods.length === 0) { gameData.rods.push({n:"Bamboo Rod", r:0, p:0, d:0, curD:0, l:5, q:1, use:true}); }
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
      if (bestIdx !== -1) { 
          gameData.rods[bestIdx].use = true; 
          notifMsg = "Equipped: " + gameData.rods[bestIdx].n; 
      } else { 
          // FIX: Fallback to Bamboo Rod
          gameData.rods.push({n:"Bamboo Rod", r:0, p:0, d:0, curD:0, l:5, q:1, use:true}); 
          notifMsg = "Equipped: Bamboo Rod"; 
      }
      notifTm = new Date().getTime();
  }

  function useRod() {
      var rod = getCurRod();
      if(rod.d > 0) { 
          rod.curD--;
          if(rod.curD <= 0) {
              if(a&&a.tone) a.tone(100, 500); 
              rod.q--;
              if(rod.q > 0) { 
                  rod.curD = rod.d; 
                  notifMsg = rod.n + " Broke! (Used Spare)"; 
                  notifTm = new Date().getTime(); 
              } else {
                  var brokenRarity = rod.r; var brokenIdx = -1;
                  for(var i=0; i<gameData.rods.length; i++) { if(gameData.rods[i]===rod) brokenIdx=i; }
                  if(brokenIdx !== -1) gameData.rods.splice(brokenIdx, 1);
                  autoEquip(brokenRarity);
              }
          }
          saveRods();
      }
  }

  function buyRod(rodToBuy) {
      var req = rodToBuy.reqL || 0; 
      if (gameData.level < req) {
          notifMsg = "NEED LVL " + req + "!"; notifTm = new Date().getTime(); if(a&&a.tone) a.tone(200, 200);
          return;
      }
      if (gameData.money >= rodToBuy.p) {
          gameData.money -= rodToBuy.p;
          var existingIdx = -1;
          for(var i=0; i<gameData.rods.length; i++) { if(gameData.rods[i].n === rodToBuy.n) { existingIdx = i; break; } }
           
          if (existingIdx !== -1) { 
             gameData.rods[existingIdx].q++; 
          } else { 
             var newRod = { n: rodToBuy.n, r: rodToBuy.r, p: rodToBuy.p, d: rodToBuy.d, curD: rodToBuy.d, l: rodToBuy.l, q: 1, use: false }; 
             gameData.rods.push(newRod); 
          }
          saveAll(); notifMsg = "BOUGHT " + rodToBuy.n; notifTm = new Date().getTime(); if(a&&a.tone) { a.tone(1000, 100); delay(50); a.tone(2000, 200); }
      } else { notifMsg = "NOT ENOUGH MONEY!"; notifTm = new Date().getTime(); if(a&&a.tone) a.tone(200, 200); }
  }

  function equipRod(idx) {
      for(var i=0; i<gameData.rods.length; i++) gameData.rods[i].use = false;
      gameData.rods[idx].use = true; saveRods(); if(a&&a.tone) a.tone(1500, 100);
  }

  // --- CHARM SYSTEM ---
  function buyCharm(ch) {
      var req = ch.reqL || 0;
      if (gameData.level < req) {
          notifMsg = "NEED LVL " + req + "!"; notifTm = new Date().getTime(); if(a&&a.tone) a.tone(200, 200);
          return;
      }

      if(gameData.money >= ch.p) {
          gameData.money -= ch.p;
          var exIdx = -1;
          for(var i=0; i<gameData.charms.length; i++) { if(gameData.charms[i].n === ch.n) { exIdx = i; break; } }
          if (exIdx !== -1) { 
            gameData.charms[exIdx].q++; 
          } else { 
            gameData.charms.push({ n:ch.n, r:ch.r, d:ch.d, curD:ch.d, l:ch.l, q:1, use:false }); 
          }
          saveAll(); notifMsg = "BOUGHT " + ch.n; notifTm = new Date().getTime(); if(a&&a.tone) { a.tone(1000, 100); delay(50); a.tone(2000, 200); }
      } else { notifMsg = "NOT ENOUGH MONEY!"; notifTm = new Date().getTime(); if(a&&a.tone) a.tone(200, 200); }
  }

  function toggleCharm(idx) {
      gameData.charms[idx].use = !gameData.charms[idx].use;
      saveCharms();
      if(a&&a.tone) a.tone(1500, 50);
  }

  function useCharms() {
      var brokenNames = [];
      for(var i = gameData.charms.length-1; i>=0; i--) {
          var ch = gameData.charms[i];
          if(ch.use) {
              if(ch.d > 0) {
                  ch.curD--;
                  if(ch.curD <= 0) {
                      ch.q--;
                      if(ch.q > 0) { ch.curD = ch.d; } 
                      else { 
                          gameData.charms.splice(i, 1); 
                          brokenNames.push(ch.n);
                      }
                  }
              }
          }
      }
      if(brokenNames.length > 0) {
          notifMsg = "Charm Depleted: " + brokenNames[0]; 
          notifTm = new Date().getTime(); 
          if(a&&a.tone) a.tone(100, 500); 
      }
      saveCharms();
  }

  // --- PITY MECHANIC ---
  function getTotalLuck() {
      var rod = getCurRod();
      var l = rod.l || 0;
      if (rod.d > 0) {
          if (rod.curD <= (rod.d * 0.25)) {
              l += (rod.l * 0.45); 
          } else if (rod.curD <= (rod.d * 0.5)) {
              l += (rod.l * 0.20); 
          }
      }
      for(var i=0; i<gameData.charms.length; i++) {
          if(gameData.charms[i].use) l += gameData.charms[i].l;
      }
      return M(l);
  }
   
  // --- EXP LOGIC ---
  function getLevelMax(lvl) {
      // Priority: Check JSON DB
      for(var i=0; i<levelDB.length; i++) {
          if(levelDB[i].l === lvl) return levelDB[i].x;
      }
      // Fallback: Geometric Logic with gaps filling
      if(levelDB.length > 0) {
          // Find the closest level below current
          var last = levelDB[0];
          for(var i=0; i<levelDB.length; i++) {
              if(levelDB[i].l <= lvl) last = levelDB[i];
          }
          var diff = lvl - last.l;
          // Smooth curve: 1.15 multiplier for every level gap
          return last.x * Math.pow(1.15, diff);
      }
      return 999999.00;
  }
   
  // --- UNIFIED REWARD CHECKER (COMPENSATION & LEVEL UP) ---
  function checkRewards() {
      var rList = [
          {l:10, r:{n:"10+ Rod",r:2,p:0,d:0,curD:0,l:50,reqL:10,q:1,use:false}},
          {l:20, r:{n:"20+ Rod",r:3,p:0,d:0,curD:0,l:100,reqL:20,q:1,use:false}},
          {l:40, r:{n:"40+ Rod",r:4,p:0,d:0,curD:0,l:1000,reqL:40,q:1,use:false}},
          {l:60, r:{n:"60+ Rod",r:5,p:0,d:0,curD:0,l:5000,reqL:60,q:1,use:false}}
      ];
      
      var got = false;
      var lastN = "";
      
      for(var i=0; i<rList.length; i++) {
          if(gameData.level >= rList[i].l) {
              var rw = rList[i].r;
              var owned = false;
              for(var j=0; j<gameData.rods.length; j++) { if(gameData.rods[j].n === rw.n) owned = true; }
              if(!owned) {
                  // Must parse/stringify to clone the object cleanly to avoid reference issues
                  gameData.rods.push(JSON.parse(JSON.stringify(rw)));
                  got = true;
                  lastN = rw.n;
              }
          }
      }
      
      if(got) {
          saveRods();
          if(a&&a.tone) { delay(50); a.tone(2000, 200); }
          return "GET " + lastN + "!";
      }
      return null;
  }

  // Auto-Check on Startup for Compensation
  var initMsg = checkRewards();
  if(initMsg) { notifMsg = initMsg; notifTm = new Date().getTime(); }

  function gainExp(amount) {
      if (gameData.level >= 100) return;

      gameData.exp += amount;
      var max = getLevelMax(gameData.level);
        
      while (gameData.exp >= max && gameData.level < 100) {
          gameData.exp -= max; 
          gameData.level++;
          max = getLevelMax(gameData.level); 
           
          if (gameData.level >= 100) {
              gameData.level = 100;
              gameData.exp = 0; 
              break;
          }

          var lvlMsg = "LEVEL UP! -> " + gameData.level;
          var rwMsg = checkRewards();
          
          if(rwMsg) notifMsg = rwMsg; // Priority to reward notification
          else if(notifMsg.indexOf("GET") === -1) notifMsg = lvlMsg; // Only show Level Up if not overwriting a reward
          
          notifTm = new Date().getTime();
          if(a&&a.tone) { a.tone(500,100); a.tone(1000,100); a.tone(1500,200); }
      }
      saveLevel();
  }

  // --- BALANCED DROP RATE & HP SYSTEM ---
  function randF() {
    // 1. Dapatkan info pancingan aktif
    var activeRod = getCurRod();
    var rodRarity = activeRod.r;

    // 2. Tentukan Batas Bawah dan Batas Atas Rarity
    // Request: "1-2 rarity di bawah" dan "1 rarity di atas (termasuk sama)"
    // Contoh: Rod Rarity 3 -> Ikan Rarity 1, 2, 3, 4. (0 excluded)
    // Contoh: Rod Rarity 0 -> Ikan Rarity 0, 1.
    var minR = Math.max(0, rodRarity - 2); 
    var maxR = Math.min(6, rodRarity + 1);

    var luckBonus = getTotalLuck(); 
    var mult = 1.0 + (luckBonus / 100.0);               
    var roll = R() * 100; 
    var r = 0; 
     
    var t6 = Math.min(50, 0.01 * mult);  
    var t5 = Math.min(65, 0.15 * mult);  
    var t4 = Math.min(95, 0.60 * mult);  
    var t3 = Math.min(99, 2.50 * mult);  
    var t2 = Math.min(100, 12.0 * mult); 
    var t1 = Math.min(100, 45.0 * mult); 
        
    // Cek roll standar keberuntungan
    if (roll < t6) r = 6;             
    else if (roll < t5) r = 5;  
    else if (roll < t4) r = 4;  
    else if (roll < t3) r = 3;  
    else if (roll < t2) r = 2; 
    else if (roll < t1) r = 1; 
    else r = 0;                                       

    // 3. TERAPKAN BATASAN PANCINGAN
    // Jika hasil roll (r) lebih tinggi dari kemampuan pancingan, turunkan ke maxR.
    // Ini mencegah pancingan murah dapat ikan Rarity 6.
    if (r > maxR) {
        r = maxR;
    }
    // Jika hasil roll (r) lebih rendah dari standar pancingan (ikan sampah), naikkan ke minR.
    // Pancingan mahal tidak akan dapat ikan Rarity 0 (kecuali minR memang 0).
    if (r < minR) {
        r = minR;
    }
        
    var c = []; for(var i=0; i<fishDB.length; i++) { if(fishDB[i].r === r) c.push(fishDB[i]); }
    if (c.length === 0 && fishDB.length > 0) c.push(fishDB[0]);
    var picked = c[M(R()*c.length)];

    // --- BALANCING: HP CALCULATION (EASIER) ---
    // Reduced HP significantly for smoother early game & High Tier
    var baseHp = 10;
    // Old: [0, 15, 60, 250, 1000, 4000, 15000]
    var rarityBonus = [0, 12, 50, 200, 750, 2500, 9000]; // Reduced for easier high tier gameplay
    var sizeBonus = getW(r) * 0.5; 
      
    var totalHp = baseHp + rarityBonus[r] + sizeBonus;
    return { n: picked.n, r: r, w: getW(r), hp: totalHp };
  }

  function addS(f) {
    rec.unshift({name: f.n, w: f.w, r: f.r}); 
    if(rec.length > 3) rec.pop(); 
    if(f.r >= 3) { luck.push({ name: f.n, r: f.r, w: f.w }); luck.sort(function(a,b){if(b.r!=a.r)return b.r-a.r; return b.w-a.w;}); if(luck.length > 3) luck.pop(); } 
        
    if(!gameData.items[f.n]) { gameData.items[f.n] = { q: 0, r: f.r, p: sellPrice[f.r] }; }
     
    // Always update price to current market value (Balance update fix)
    gameData.items[f.n].p = sellPrice[f.r];
    gameData.items[f.n].q++; 
    if(gameData.items[f.n].r < f.r) gameData.items[f.n].r = f.r;
     
    // --- BALANCING: XP SCALED FOR ~70 HOURS GAMEPLAY TO LEVEL 50 ---
    var val = sellPrice[f.r];
    // Base 25 XP (Early game safe)
    // Rarity Bonus: +40 per star
    // Price Bonus: Price / 135 (Major boost for Legend/Mythic only)
    var gainedExp = 25 + (f.r * 40) + M(val / 135);
    gainExp(gainedExp);
        
    useRod(); 
    useCharms(); 
    saveItems(); 
  }

  function sellF(name) {
      if(gameData.items[name] && gameData.items[name].q > 0) {
          var item = gameData.items[name];
          var p = (item.p !== undefined) ? item.p : sellPrice[item.r];
          var totalPrice = p * item.q; 
           
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
          var p = (item.p !== undefined) ? item.p : sellPrice[item.r];
          total += p * item.q;
      }
      gameData.money += total;
      gameData.items = {}; 
      saveAll();
      notifMsg = "+$" + fmtM(total); notifTm = new Date().getTime();
      if(a&&a.tone) { a.tone(1000, 50); delay(50); a.tone(2000, 50); delay(50); a.tone(3000, 100); }
  }

  function drBox(x,y,h,bg,v,t,c) {
    if(bW < 1 || h < 1) return;
    spr.drawXBitmap(x,y,bg,bW,h,cBg); 
    spr.drawXBitmap(x,y,sprH,bW,1,cBdr); 
    spr.drawXBitmap(x,y+h-1,sprH,bW,1,cBdr); 
    spr.drawXBitmap(x,y,v,1,h,cBdr); 
    spr.drawXBitmap(x+bW-1,y,v,1,h,cBdr);
    spr.setTextColor(c); spr.setTextAlign(1); spr.drawText(t,x+M(bW/2),y+3);
  }
   
  // --- HUD DRAWER (IN-GAME) ---
  function drHud(y) {
      var bW = 24, bH = 12;
      var bX = 2; 
      spr.drawXBitmap(bX, y, sprBadge, bW, bH, cBdr);
        
      spr.setTextColor(cW); spr.setTextAlign(1); spr.setTextSize(1);
      spr.drawText(gameData.level, bX + 12, y + 2);

      var barX = bX + bW + 4;
      var barW = gW - barX - 4; 
      var barH = 6;
      var barY = y + 2; 

      spr.drawRect(barX, barY, barW, barH, cBdr);
        
      var max = getLevelMax(gameData.level);
      var pct = gameData.exp / max;
        
      if (gameData.level >= 100) {
          pct = 1;
      } else {
          if(pct > 1) pct = 1;
          if(pct < 0) pct = 0;
      }
        
      var fillW = M((barW - 2) * pct);
      if(fillW > 0) {
          var sx = barX + 1;
          for(var l=0; l < (barH-2); l++) {
              spr.drawLine(sx, barY + 1 + l, sx + fillW, barY + 1 + l, cExp);
          }
      }
        
      spr.setTextSize(0.5);
      spr.setTextColor(C(200,200,200));
      spr.setTextAlign(1); 
        
      var textX = barX + (barW/2);
      var textY = y + 9; 
        
      if (gameData.level >= 100) {
          spr.drawText("MAX", textX, textY);
      } else {
          spr.drawText(fmtExp(gameData.exp) + " / " + fmtExp(max), textX, textY);
      }
        
      spr.setTextSize(1);
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

  function getShopRods() {
      var res = [];
      for(var i=0; i<rodDB.length; i++) {
          var r = rodDB[i];
          if(r.d === 0) { 
              var owned = false;
              for(var j=0; j<gameData.rods.length; j++) {
                  if(gameData.rods[j].n === r.n) { owned = true; break; }
              }
              if(!owned) res.push(r);
          } else {
              res.push(r);
          }
      }
      return res;
  }

  function getShopCharms() {
      var res = [];
      for(var i=0; i<charmDB.length; i++) {
          var c = charmDB[i];
          if(c.d === 0) { 
              var owned = false;
              for(var j=0; j<gameData.charms.length; j++) {
                  if(gameData.charms[j].n === c.n) { owned = true; break; }
              }
              if(!owned) res.push(c);
          } else {
              res.push(c);
          }
      }
      return res;
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
        else if(appState === 8) appState = 2; 
        delay(200);
        continue;
    }

    spr.fill(cK);
    spr.setTextColor(cW);
    spr.setTextAlign(1);

    if (notifMsg !== "" && now - notifTm > 2500) { notifMsg = ""; }

    if (appState === 0) {
        spr.setTextSize(2); spr.drawText("FISHING LEGEND", dw/2, 20); spr.setTextSize(1);
          
        spr.setTextAlign(0); // Left
        spr.setTextColor(cW);
        spr.drawText("Lv : " + gameData.level, 10, 10);
        spr.setTextAlign(1); // Center Restore
          
        spr.setTextColor(cGold); 
        spr.drawText("$ " + fmtM(gameData.money), dw/2, 45);
          
        var opts = ["START GAME", "SHOP", "INVENTORY", "EXIT"];
        if (nxt) { menuIdx++; if (menuIdx >= opts.length) menuIdx=0; if(a&&a.tone)a.tone(600,20); }
        if (prv) { menuIdx--; if (menuIdx < 0) menuIdx=opts.length-1; if(a&&a.tone)a.tone(600,20); }
        var menuY = 65;
        var menuX = dw/2; 
        for (var i = 0; i < opts.length; i++) {
            if (i === menuIdx) { spr.setTextColor(cMenuSel); spr.drawText("> " + opts[i] + " <", menuX, menuY + (i*15)); } 
            else { spr.setTextColor(C(100, 100, 100)); spr.drawText(opts[i], menuX, menuY + (i*15)); }
        }

        spr.setTextColor(C(80, 80, 80)); 
        spr.setTextSize(0.5); 
        spr.drawText("by github : metalgalz", dw/2, dh - 18);
        spr.setTextColor(C(150, 50, 50)); 
        spr.drawText("NOT FOR SALE! THIS IS FREE", dw/2, dh - 8);
        spr.setTextSize(1); 

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
          if(nxt) { mode++; if(mode>2)mode=0; if(a&&a.tone)a.tone(600,50); }
          if(prv) { mode--; if(mode<0)mode=2; if(a&&a.tone)a.tone(600,50); }
           
          if(now>tmBite) { curF=randF(); fStam=curF.hp; maxStam=fStam; st=2; tmAct=now; if(a&&a.tone){a.tone(800,100);delay(50);a.tone(800,100);} }
        } else if(st===2) { 
          if(nxt) { mode++; if(mode>2)mode=0; if(mode===1)tmAct=now; if(a&&a.tone)a.tone(600,50); }
          if(prv) { mode--; if(mode<0)mode=2; if(mode===1)tmAct=now; if(a&&a.tone)a.tone(600,50); }

          // --- BALANCING: REGEN & DAMAGE ---
          // Fish Regen: Reduced significantly for easier early game
          var regen = 0.05 + (curF.r * 0.15); // Much slower regen
          fStam += regen; if(fStam>maxStam)fStam=maxStam;
           
          var totalL = getTotalLuck();
          // Damage Formula:
          var rodPwr = Math.sqrt(totalL) * 0.2; 
          // Buffed Manual Damage (Easier Pull)
          var dmgMan = 15 + (activeRod.r * 7) + rodPwr; 
          // Buffed Auto Damage
          var dmgAuto = 4.0 + (activeRod.r * 3.0) + (rodPwr * 0.6); 

          var barY = dh - 26; 
            
          if(mode===1) { 
              if(vld) { fStam-=dmgMan; tmAct=now; if(a&&a.tone)a.tone(200,20); } 
              if(now-tmAct>3000) { st=5; if(a&&a.tone)a.tone(100,500); } 
          } 
          else if(mode===0) { 
              fStam-=dmgAuto; if(now%500<50 && a&&a.tone)a.tone(200,10); 
          }
            
          if(fStam<=0) { addS(curF); if(a&&a.tone){a.tone(1000,100);a.tone(1500,300);} st=0; }
        } else if(st===5) { if(vld || (now-tmAct>1500)) st=0; }

        if(mode===2 && ok) {
           appState = 0;
           if(a&&a.tone) a.tone(400, 100);
           delay(200);
        }

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

        drHud(dh - 16);

        var rodCol = (activeRod.r === 0 && activeRod.p === 0) ? cRodDefault : rCols[activeRod.r];
        var rodBaseX = gW + 10; var rodBaseY = dh + 10; var rodTipX = (gW / 2); var rodTipY = (dh / 2) - 20;
        if (st === 2 && M(now/200)%2===0) { rodTipY -= 8; rodTipX += 3; }
        for(var t=0; t<3; t++) { spr.drawLine(rodBaseX+t, rodBaseY, rodTipX+t, rodTipY, (t===1)?rodCol:C(40,20,0)); }
           
        if(st==1||st==2) {
          var bobX = (gW / 2); var bobY = (dh / 2) + 10; bobY += wOff; 
          if (st === 2) { bobX += (Math.random() * 6) - 3; bobY += (Math.random() * 4) - 2; }
          spr.drawLine(rodTipX, rodTipY, bobX, bobY, cK);
            
          if (st === 1) { 
              bobY += (Math.sin(now/300) * 2); 
              var bobColor = cRed; 
              if (activeRod.d > 0) {
                  if (activeRod.curD <= (activeRod.d * 0.25)) {
                      var spd = 2; 
                      var r = M(128 + 127 * Math.sin(now / spd));
                      var g = M(128 + 127 * Math.sin((now / spd) + 2.09)); 
                      var b = M(128 + 127 * Math.sin((now / spd) + 4.18)); 
                      bobColor = C(r, g, b);
                  }
                  else if (activeRod.curD <= (activeRod.d * 0.5)) {
                      var spd = 7; 
                      var r = M(128 + 127 * Math.sin(now / spd));
                      var g = M(128 + 127 * Math.sin((now / spd) + 2.09)); 
                      var b = M(128 + 127 * Math.sin((now / spd) + 4.18)); 
                      bobColor = C(r, g, b);
                  }
              }
              spr.drawXBitmap(M(bobX)-2,M(bobY)-2,sprBob,4,4,bobColor); 
          } 
          else if (st === 2) { spr.setTextColor(cW); spr.setTextAlign(1); spr.drawText("!",M(bobX),M(bobY)-15); }
        }

        spr.setTextSize(1);
        spr.setTextColor(cW); spr.setTextAlign(1); var cX=gW/2;
        var barY = dh - 26; 
        
        if(st==1 || st==2) {
              if(mode===1) { spr.setTextColor(cYel); spr.drawText("< MAN >", cX, barY - 10); }
              else if(mode===0) { spr.setTextColor(cGrn); spr.drawText("< AUTO >", cX, barY - 10); }
              else if(mode===2) { spr.setTextColor(cRed); spr.drawText("< MENU >", cX, barY - 10); }
        }
        
        if(st==2) {
          var bX=(gW-barW)/2, pct=fStam/maxStam; if(pct<0)pct=0;
          spr.drawXBitmap(M(bX), barY, sprBar,barW,6,cW);
          var fW=M((barW-2)*pct);
          if(fW>0) { var sx=M(bX+1); for(var l=0;l<4;l++) spr.drawLine(sx,barY+1+l,sx+fW,barY+1+l,cBar); }
        } else if(st==5) { spr.setTextColor(cRed); spr.drawText("ESCAPED!",cX,dh/2); spr.setTextColor(cW); spr.drawText("Too Slow!",cX,dh/2+15); }
           
        // --- SIDEBAR BOX 1: RECENT ---
        var pX=sX; 
        drBox(pX,0,bH1,sprBg1,sprV1,"RECENT",C(100,255,255));
        spr.setTextSize(1);
        for(var i=0;i<Math.min(rec.length, 3);i++) { 
          var f=rec[i], y=18+(i*10); spr.setTextAlign(0); spr.setTextColor(rCols[f.r]); 
          var n=f.name; if(n.length>10)n=n.substring(0,10); spr.drawText(n,pX+3,y);
          spr.setTextAlign(2); spr.setTextColor(cW); spr.drawText(fmt(f.w),pX+bW-3,y);
        }
           
        // --- SIDEBAR BOX 2: TOP LUCK ---
        var y2 = bH1; 
        drBox(pX,y2,bH2,sprBg2,sprV2,"TOP LUCK",C(255,200,0));
        if(luck.length==0) { spr.setTextAlign(0); spr.setTextColor(C(150,150,150)); spr.drawText("- Empty -",pX+3,y2+18); }
        else {
          for(var i=0;i<Math.min(luck.length, 3);i++) { 
            var f=luck[i], y=y2+18+(i*10); spr.setTextAlign(0); spr.setTextColor(rCols[f.r]);
            var n=f.name; if(n.length>10)n=n.substring(0,10); spr.drawText(n,pX+3,y);
            spr.setTextAlign(2); spr.setTextColor(cW); spr.drawText(fmt(f.w),pX+bW-3,y);
          }
        }

        // --- SIDEBAR BOX 3: STATS ---
        var y3 = bH1 + bH2;
        drBox(pX, y3, bH3, sprBg3, sprV3, "STATS", C(0, 255, 100));
           
        var totalL = getTotalLuck();
        var mult = 1.0 + (totalL / 100.0);

        spr.setTextAlign(0); 
        spr.setTextColor(rodCol); 
        var dRodName = activeRod.n; if(dRodName.length > 15) dRodName = dRodName.substring(0,15) + "..";
        spr.drawText(dRodName, pX+3, y3+16);
        spr.setTextColor(cW);
           
        var durCol = cW;
        if(activeRod.d > 0 && activeRod.curD < 10 && M(now/500)%2===0) { durCol = cDanger; }
        spr.setTextColor(durCol);
        var durText = (activeRod.d === 0) ? "Inf" : activeRod.curD + "/" + activeRod.d;
        spr.drawText("D:" + durText, pX+3, y3+26);
           
        spr.setTextColor(cW);
        var activeCharms = 0; for(var i=0;i<gameData.charms.length;i++) if(gameData.charms[i].use) activeCharms++;
        spr.drawText("Charm:" + activeCharms, pX+3, y3+36); 
           
        var luckCol = cW;
        var pityActive = (activeRod.d > 0 && activeRod.curD <= (activeRod.d * 0.5));
        if (pityActive) {
            luckCol = cGold; 
        }
        spr.setTextColor(luckCol);
        spr.drawText("Luck:+" + totalL + "%", pX+3, y3+46);
           
        spr.setTextAlign(2);
        
        // --- NEW DYNAMIC STATS DISPLAY ---
        var t6 = Math.min(50, 0.01 * mult);  
        var t5 = Math.min(65, 0.15 * mult);  
        var t4 = Math.min(95, 0.60 * mult);  
        var t3 = Math.min(99, 2.50 * mult);  
        var t2 = Math.min(100, 12.0 * mult); 
        var t1 = Math.min(100, 45.0 * mult);
        var t0 = 100;
        
        var showR = [t0, t1, t2, t3, t4, t5, t6];
        var activeR = activeRod.r;
        var minR = Math.max(0, activeR - 2); 
        var maxR = Math.min(6, activeR + 1);
        
        var line = 0;
        // Show from Max Rarity down to Min Rarity (max 4 lines to fit box)
        for(var r = maxR; r >= minR; r--) {
            if(line > 3) break;
            
            spr.setTextColor(rCols[r]);
            var txt = fmtP(showR[r]);
            if(showR[r] >= 100) txt = "100%";
            spr.drawText(txt, pX+bW-3, y3+16+(line*10));
            line++;
        }
        // --- END DYNAMIC STATS ---

    } else if (appState === 2) { 
        spr.drawText("INVENTORY", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        var opts = ["FISH", "ROD", "CHARM", "SELL ALL FISH", "BACK"]; 
        if (nxt) { menuIdx++; if (menuIdx >= opts.length) menuIdx=0; if(a&&a.tone)a.tone(600,20); }
        if (prv) { menuIdx--; if (menuIdx < 0) menuIdx=opts.length-1; if(a&&a.tone)a.tone(600,20); }
        for (var i = 0; i < opts.length; i++) {
            if (i === menuIdx) { spr.setTextColor(cMenuSel); spr.drawText("> " + opts[i] + " <", dw/2, 60 + (i*20)); } 
            else { spr.setTextColor(C(100, 100, 100)); spr.drawText(opts[i], dw/2, 60 + (i*20)); }
        }
        if (ok) {
            if(a&&a.tone) a.tone(800, 100);
            if (menuIdx === 0) { loadData(); appState = 3; invScroll=0; invSel=0; } 
            else if (menuIdx === 1) { 
                loadData(); 
                gameData.rods.sort(function(a,b){ if(a.r!==b.r) return a.r-b.r; return a.l-b.l; });
                appState = 4; invScroll=0; invSel=0; 
            } 
            else if (menuIdx === 2) { 
                loadData(); 
                gameData.charms.sort(function(a,b){ if(a.r!==b.r) return a.r-b.r; return a.l-b.l; });
                appState = 8; invScroll=0; invSel=0; 
            } 
            else if (menuIdx === 3) { sellAll(); }
            else if (menuIdx === 4) { appState = 0; } 
            delay(200);
        }

    } else if (appState === 3) {
        // FISH INVENTORY
        var keys = Object.keys(gameData.items);
        keys.sort(function(a, b) { var rA = gameData.items[a].r; var rB = gameData.items[b].r; if (rB !== rA) return rB - rA; if (a < b) return -1; if (a > b) return 1; return 0; });
        
        spr.drawText("INVENTORY", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        drShopStats();

        var listStartY = 60;

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
                   var price = (item.p !== undefined) ? item.p : sellPrice[item.r];
                   
                   var itemY = listStartY + (i*22);

                   if(idx === invSel) { spr.drawRect(5, itemY-2, dw-10, 20, cMenuSel); }
                   
                   spr.setTextAlign(0);
                   spr.setTextColor(rCols[item.r]); spr.drawText(kName, 10, itemY);
                   
                   spr.setTextSize(0.5); spr.setTextColor(C(200,200,200));
                   spr.drawText("Qty: " + item.q + " | Rarity: " + item.r, 10, itemY + 10);

                   spr.setTextSize(1);
                   spr.setTextAlign(2);
                   spr.setTextColor(cGold); spr.drawText("$" + fmtM(price), dw-5, itemY);
                   spr.setTextAlign(0);
               }
           }
           if (ok && keys.length > 0) { sellF(keys[invSel]); delay(150); }
           if(keys.length > maxLines) { spr.setTextAlign(1); spr.setTextColor(C(100,100,100)); spr.drawText((invSel+1) + "/" + keys.length, dw/2, dh-22); }
        }
        
        // MOVED TO TOP RIGHT
        spr.setTextAlign(2); 
        spr.setTextColor(cMenuSel); 
        spr.drawText("BACK [ESC]", dw-5, 5);
        spr.drawText("SELL [OK ]", dw-5, 15);
        
        // Counter above money
        spr.setTextAlign(1); 
        spr.setTextColor(cW);
        if(keys.length > 0) {
            spr.drawText((invSel+1) + " / " + keys.length, dw/2, 35);
        }

    } else if (appState === 4) {
        // MY RODS
        spr.drawText("MY RODS", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        drShopStats();

        var listStartY = 60;
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
                     var itemY = listStartY + (i*22);
                     
                     if(idx === invSel) { spr.drawRect(5, itemY-2, dw-10, 20, cMenuSel); }
                     
                     spr.setTextAlign(0);
                     spr.setTextColor(rCols[rod.r]); 
                     var dispName = rod.n + " x" + rod.q; 
                     spr.drawText(dispName, 10, itemY);

                     spr.setTextSize(0.5); spr.setTextColor(C(200,200,200));
                     var durT = (rod.d === 0) ? "INF" : rod.curD + "/" + rod.d;
                     var warnCol = (rod.d > 0 && rod.curD < 10) ? cDanger : C(200,200,200);
                     spr.setTextColor(warnCol);
                     spr.drawText("Luck:+" + rod.l + "%  Dur:" + durT, 10, itemY+10);
                     spr.setTextSize(1);

                     if(rod.use) { 
                       spr.setTextAlign(2);
                       spr.setTextColor(cGrn); 
                       spr.drawText("[E]", dw-5, itemY); 
                       spr.setTextAlign(0);
                     }
                 }
             }
             if(ok) { equipRod(invSel); delay(150); }
             if(myRods.length > maxLines) { spr.setTextAlign(1); spr.setTextColor(C(100,100,100)); spr.drawText((invSel+1) + "/" + myRods.length, dw/2, dh-22); }
        }
        
        // MOVED TO TOP RIGHT
        spr.setTextAlign(2); 
        spr.setTextColor(cMenuSel); 
        spr.drawText("BACK [ESC]", dw-5, 5);
        spr.drawText("EQUIP [OK ]", dw-5, 15);
        
        // Counter above money
        spr.setTextAlign(1); 
        spr.setTextColor(cW);
        if(myRods.length > 0) {
            spr.drawText((invSel+1) + " / " + myRods.length, dw/2, 35);
        }

    } else if (appState === 5) {
        spr.drawText("SHOP", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        drShopStats(); 
        
        var opts = ["ROD", "CHARM", "BACK"];
        if (nxt) { menuIdx++; if (menuIdx >= opts.length) menuIdx=0; if(a&&a.tone)a.tone(600,20); }
        if (prv) { menuIdx--; if (menuIdx < 0) menuIdx=opts.length-1; if(a&&a.tone)a.tone(600,20); }
        for (var i = 0; i < opts.length; i++) {
            if (i === menuIdx) { spr.setTextColor(cMenuSel); spr.drawText("> " + opts[i] + " <", dw/2, 65 + (i*20)); } 
            else { spr.setTextColor(C(100, 100, 100)); spr.drawText(opts[i], dw/2, 65 + (i*20)); }
        }
        if (ok) {
            if(a&&a.tone) a.tone(800, 100);
            if (menuIdx === 0) { 
                loadDBs();
                shopList = getShopRods();
                appState = 6; invScroll=0; invSel=0; 
            } 
            else if (menuIdx === 1) { 
                loadDBs();
                shopList = getShopCharms();
                appState = 7; invScroll=0; invSel=0; 
            } 
            else if (menuIdx === 2) { appState = 0; } 
            delay(200);
        }

    } else if (appState === 6) {
        spr.drawText("ROD SHOP", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        drShopStats(); 

        var listStartY = 60; 
        var maxLines = 5;
        if(shopList.length === 0) {
             spr.setTextColor(C(150,150,150)); 
             spr.drawText("Sold Out / Empty", dw/2, dh/2);
        } else {
            if(nxt) { invSel++; if(invSel >= shopList.length) invSel = shopList.length-1; if(invSel >= invScroll + maxLines) invScroll = invSel - maxLines + 1; if(a&&a.tone)a.tone(600,20); }
            if(prv) { invSel--; if(invSel < 0) invSel = 0; if(invSel < invScroll) invScroll = invSel; if(a&&a.tone)a.tone(600,20); }
            spr.setTextAlign(0);
            for(var i=0; i<maxLines; i++) {
                var idx = invScroll + i;
                if(idx < shopList.length) {
                    var rItem = shopList[idx];
                    var itemY = listStartY + (i*22);
                    
                    if(idx === invSel) { spr.drawRect(5, itemY-2, dw-10, 20, cMenuSel); }
                    spr.setTextAlign(0);
                    spr.setTextColor(rCols[rItem.r]); spr.drawText(rItem.n, 10, itemY);
                    
                    spr.setTextSize(0.5); spr.setTextColor(C(200,200,200));
                    var durT = (rItem.d===0)?"INF":rItem.d;
                    spr.drawText("Lck:+" + rItem.l + "% Dur:" + durT, 10, itemY + 10);
                    
                    var rL = rItem.reqL || 0;
                    var lvlCol = (gameData.level >= rL) ? C(100,255,100) : cDanger;
                    spr.setTextColor(lvlCol);
                    spr.setTextAlign(2); 
                    spr.drawText("Lv." + rL, dw-10, itemY + 10);
                    spr.setTextAlign(0); 
                    
                    spr.setTextSize(1);
                    
                    spr.setTextAlign(2);
                    if(rItem.p > 0) { spr.setTextColor(cGold); spr.drawText("$" + fmtM(rItem.p), dw-5, itemY); } 
                    else { spr.setTextColor(cGrn); spr.drawText("FREE", dw-5, itemY); }
                    spr.setTextAlign(0);
                }
            }
            if(ok) { buyRod(shopList[invSel]); delay(200); }
        }
        
        // MOVED TO TOP RIGHT
        spr.setTextAlign(2); 
        spr.setTextColor(cMenuSel); 
        spr.drawText("BACK [ESC]", dw-5, 5);
        spr.drawText("BUY [OK ]", dw-5, 15);
        
        // Counter above money
        spr.setTextAlign(1); 
        spr.setTextColor(cW);
        if(shopList.length > 0) {
            spr.drawText((invSel+1) + " / " + shopList.length, dw/2, 35);
        }

    } else if (appState === 7) {
        spr.drawText("CHARM SHOP", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        drShopStats(); 
        
        var listStartY = 60; 
        var maxLines = 5;
        if(shopList.length === 0) {
             spr.setTextColor(C(150,150,150)); 
             spr.drawText("Sold Out / Empty", dw/2, dh/2);
        } else {
            if(nxt) { invSel++; if(invSel >= shopList.length) invSel = shopList.length-1; if(invSel >= invScroll + maxLines) invScroll = invSel - maxLines + 1; if(a&&a.tone)a.tone(600,20); }
            if(prv) { invSel--; if(invSel < 0) invSel = 0; if(invSel < invScroll) invScroll = invSel; if(a&&a.tone)a.tone(600,20); }
            spr.setTextAlign(0);
            for(var i=0; i<maxLines; i++) {
                var idx = invScroll + i;
                if(idx < shopList.length) {
                    var cItem = shopList[idx];
                    var itemY = listStartY + (i*22);
                    
                    if(idx === invSel) { spr.drawRect(5, itemY-2, dw-10, 20, cMenuSel); }
                    spr.setTextAlign(0);
                    spr.setTextColor(rCols[cItem.r]); spr.drawText(cItem.n, 10, itemY);
                    
                    spr.setTextSize(0.5); spr.setTextColor(C(200,200,200));
                    var durT = (cItem.d===0)?"INF":cItem.d;
                    spr.drawText("Lck:+" + cItem.l + "% Dur:" + durT, 10, itemY + 10);
                    
                    var rL = cItem.reqL || 0;
                    var lvlCol = (gameData.level >= rL) ? C(100,255,100) : cDanger;
                    spr.setTextColor(lvlCol);
                    spr.setTextAlign(2); 
                    spr.drawText("Lv." + rL, dw-10, itemY + 10);
                    spr.setTextAlign(0); 

                    spr.setTextSize(1);
                    
                    spr.setTextAlign(2);
                    spr.setTextColor(cGold); spr.drawText("$" + fmtM(cItem.p), dw-5, itemY);
                    spr.setTextAlign(0);
                }
            }
            if(ok) { buyCharm(shopList[invSel]); delay(200); }
        }
        
        // MOVED TO TOP RIGHT
        spr.setTextAlign(2); 
        spr.setTextColor(cMenuSel); 
        spr.drawText("BACK [ESC]", dw-5, 5);
        spr.drawText("BUY [OK ]", dw-5, 15);
        
        // Counter above money
        spr.setTextAlign(1); 
        spr.setTextColor(cW);
        if(shopList.length > 0) {
            spr.drawText((invSel+1) + " / " + shopList.length, dw/2, 35);
        }
       
    } else if (appState === 8) {
        // MY CHARMS
        spr.drawText("MY CHARMS", dw/2, 20); spr.drawLine(20, 32, dw-20, 32, cSep);
        drShopStats();

        var listStartY = 60;
        var maxLines = 5;
        var myCharms = gameData.charms;
        if (myCharms.length === 0) { spr.setTextColor(C(150,150,150)); spr.drawText("(No charms)", dw/2, dh/2); } 
        else {
             if(nxt) { invSel++; if(invSel >= myCharms.length) invSel = myCharms.length-1; if(invSel >= invScroll + maxLines) invScroll = invSel - maxLines + 1; if(a&&a.tone)a.tone(600,20); }
             if(prv) { invSel--; if(invSel < 0) invSel = 0; if(invSel < invScroll) invScroll = invSel; if(a&&a.tone)a.tone(600,20); }
             spr.setTextAlign(0);
             for(var i=0; i<maxLines; i++) {
                 var idx = invScroll + i;
                 if(idx < myCharms.length) {
                     var ch = myCharms[idx];
                     var itemY = listStartY + (i*22);
                     
                     if(idx === invSel) { spr.drawRect(5, itemY-2, dw-10, 20, cMenuSel); }

                     spr.setTextAlign(0);
                     spr.setTextColor(rCols[ch.r]); 
                     var dispName = ch.n + " x" + ch.q; 
                     spr.drawText(dispName, 10, itemY);

                     spr.setTextSize(0.5); spr.setTextColor(C(200,200,200));
                     var durT = (ch.d === 0) ? "INF" : ch.curD + "/" + ch.d;
                     var warnCol = (ch.d > 0 && ch.curD < 20) ? cDanger : C(200,200,200);
                     spr.setTextColor(warnCol);
                     spr.drawText("Luck:+" + ch.l + "%  Dur:" + durT, 10, itemY+10);
                     spr.setTextSize(1);
                     
                     if(ch.use) { 
                       spr.setTextAlign(2);
                       spr.setTextColor(cGrn); 
                       spr.drawText("[ON]", dw-5, itemY); 
                       spr.setTextAlign(0);
                     } else {
                       spr.setTextAlign(2);
                       spr.setTextColor(C(100,100,100)); 
                       spr.drawText("[  ]", dw-5, itemY); 
                       spr.setTextAlign(0);
                     }
                 }
             }
             if(ok) { toggleCharm(invSel); delay(150); }
             if(myCharms.length > maxLines) { spr.setTextAlign(1); spr.setTextColor(C(100,100,100)); spr.drawText((invSel+1) + "/" + myCharms.length, dw/2, dh-22); }
        }
        
        // MOVED TO TOP RIGHT
        spr.setTextAlign(2); 
        spr.setTextColor(cMenuSel); 
        spr.drawText("BACK [ESC]", dw-5, 5);
        spr.drawText("TOGGLE [OK ]", dw-5, 15);
        
        // Counter above money
        spr.setTextAlign(1); 
        spr.setTextColor(cW);
        if(myCharms.length > 0) {
            spr.drawText((invSel+1) + " / " + myCharms.length, dw/2, 35);
        }
    }

    if(notifMsg !== "") {
        var toastY = 30; var toastH = 24; var tW = 144;
        spr.drawXBitmap(M(dw/2 - (tW/2)), toastY, sprToast, tW, toastH, C(0,0,0)); 
        spr.drawRect(M(dw/2 - (tW/2)), toastY, tW, toastH, cW);             
        spr.setTextColor(cGold); spr.setTextAlign(1); spr.drawText(notifMsg, dw/2, toastY + 8);
    }

    spr.pushSprite(); 
    delay(20);
  }
  k.setLongPress(false);
}
main();