# **🎣 Fishing Legend**

Fishing Legend is a retro RPG fishing game for Bruce Firmware.  
Catch rare fish, upgrade your gear, and become a legend\!

## **🚀 Quick Installation Guide (Beginner Friendly)**

Follow these simple steps to play.

### **1\. Prepare your T-Embed**

* **HIGHLY RECOMMENDED**: Use **Bruce Firmware** for the Lilygo T-Embed. This game is optimized to run smoothly on it.  
* Alternatively, ensure your device has any firmware that supports **JavaScript** (XS/Moddable).  
* Make sure you have a **MicroSD Card** (formatted to **FAT32**).

### **2\. Copy Files to SD Card (IMPORTANT\!)**

You must copy the game files to your SD Card exactly like this image below.

**📂 SD Card Structure:**

\[SD\_Card\_Root\]  
 ├── fishing_legend.js                \<-- RENAME your chosen version to this\!  
 └── FishingLegendDB/                 \<-- Copy this entire folder from the repo  
..      └── fish.json  
..      └── rod.json  
..      └── charm.json  
..      └── money.json
..      └── level.json

1. **Download** the /FishingLegendDB folder from this repository.  
2. **Paste** the folder into the main (root) directory of your SD Card.  
3. **Copy & Rename**: Save your chosen file as main.js (or your firmware's default app name) on the SD Card.  
4. **Insert** the SD Card into your T-Embed.

### **3\. Play\!**

* Turn on your device.  
* Launch the app (if using Bruce, usually found in the Script/App manager).  
* Enjoy\!

## **🎮 How to Control (Rotary Dial)**

This game uses the **Dial (Knob)** on the right side of the T-Embed.

| Action | Icon | Menu | Fishing |  
| Click Dial | 🔘 | Select / OK | Cast Line / Reel In |  
| Rotate Right | ↻ | Move Down | Switch to Auto Mode |  
| Rotate Left | ↺ | Move Up | Switch to Manual Mode |  
| Side Button | 🔙 | Back / Exit | Cancel / Quit |

## **📖 How to Play**

### **Step 1: Cast the Line 🎣**

* Choose **Manual/Auto/Menu**  
* Wait for the bobber to move.  
* Status: WAITING...

### **Step 2: The Bite ❗️**

* Wait for the **(\!) Exclamation Mark** and a sound.  
* This means a fish bit the hook\!

### **Step 3: Catch It\! (Reeling)**

* **FAST MASHING**: Click the Dial repeatedly and quickly\!  
* **Target**: The **Yellow Bar** is the fish's HP. Drain it to 0\.  
* *If you are too slow, the fish escapes.*

## **🌟 Exclusive Features (New Update 2026-01-21)**

⚔️ RPG Leveling System
Gain EXP: Every catch grants EXP based on Rarity and Price.
Level Up: Fill the blue bar at the bottom to level up.
Milestone Rewards: The game automatically grants you FREE RODS when you reach specific levels:
* Lvl 10: 10+ Rod
* Lvl 20: 20+ Rod
* Lvl 40: 40+ Rod
* Lvl 60: 60+ Rod

**🎣 Smart Inventory & Auto-Equip**
* Spare Rod System: If you have multiple of the same rod (e.g., "Bamboo Rod x5"), breaking one will automatically use a spare without equipping a new one.
* Auto-Equip: If your last rod breaks completely, the game intelligently equips the next best rod in your inventory.
* Sell All: Quickly sell all your caught fish at the market to get rich.

**🧿 Charms System**
* Buy Charms in the Shop to boost your stats temporarily!
* Charms: Consumable items that increase your Luck.
* Durability: Charms have durability just like rods.
* Toggle: You can turn Charms ON/OFF in the Inventory.

**🌦️ Dynamic Living World**
The game features a fully simulated environment that changes as you play:
* Day & Night Cycle: Watch the sky change from sunrise, to bright day, sunset, and starry night.
* Dynamic Weather: Random Rain Storms occur every few days.
* Effect: Rain changes the sky color and adds particle effects.
* Alive Background: Moving clouds, birds, passing ships, islands, and jumping fish.

## **⚔️ Game Secrets & Tips**

### **🌈 The "Pity" System (Rainbow Bobber)**

Your Fishing Rod gets damaged over time. **Don't fix it immediately\!**

* **Damaged Rod (50%)** \= **Green/Fast Rainbow Bobber** (+20% Luck)  
* **Broken Rod (25%)** \= **Hyper Speed Rainbow Bobber** (+45% Luck)

**Pro Tip:** Use a broken rod to catch the rarest fish (Mythic/Secret)\!

## **📈 Economy Tips**
Level Requirements: Some powerful rods in the shop require a specific Player Level to buy.
Inflation: As you level up, fish give more EXP, but high-tier rods cost millions. Save your money!

### **💎 Rarity Colors**

* ⚪ **Common** (Gray) \- Cheap  
* 🟢 **Uncommon** (Green)  
* 🔵 **Rare** (Blue)  
* 🟣 **Epic** (Purple)  
* 🟠 **Legend** (Orange)  
* 🔴 **Mythic** (Red) \- BOSS  
* 💎 **Secret** (Cyan) \- ???

## **❓ Troubleshooting**

**"Game is not saving\!"**

* Did you create the folder /FishingLegendDB on the SD Card?  
* Is your SD Card formatted to FAT32?

**"My progress is gone!"**
* Check if the /FishingLegendDB folder exists on the SD Card. The game needs permission to write JSON files there.

**"Screen looks wrong?"**

* This game is made for T-Embed resolution.

*Happy Fishing\!* 🎣

![alt text](https://github.com/metalgalz/Fishing-Legend-Games-Bruce-Firmware-For-Lilygo-T-Embed/blob/main/Pictures/LILYGO%20T-EMBED%20C1101%20PLUS.png?raw=true)

![alt text](https://github.com/metalgalz/Fishing-Legend-Games-Bruce-Firmware-For-Lilygo-T-Embed/blob/main/Pictures/LILYGO%20T-Deck.png?raw=true)
