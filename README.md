# **🎣 Fishing Legend (Lilygo T-Embed Edition)**

Fishing Legend is a retro RPG fishing game for Lilygo T-Embed.  
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
 ├── main.js                \<-- Copy code from fishing\_legend.js here  
 └── FishingLegendDB/       \<-- Copy this entire folder from the repo  
      ├── fish.json  
      ├── rod.json  
      ├── charm.json  
      └── money.json

1. **Download** the /FishingLegendDB folder from this repository.  
2. **Paste** the folder into the main (root) directory of your SD Card.  
3. **Copy** the game code (fishing\_legend.js) and save it as main.js (or your firmware's default app name) on the SD Card.  
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

* Press the **Dial (Click)** once.  
* Wait for the bobber to move.  
* Status: WAITING...

### **Step 2: The Bite ❗️**

* Wait for the **(\!) Exclamation Mark** and a sound.  
* This means a fish bit the hook\!

### **Step 3: Catch It\! (Reeling)**

* **FAST MASHING**: Click the Dial repeatedly and quickly\!  
* **Target**: The **Yellow Bar** is the fish's HP. Drain it to 0\.  
* *If you are too slow, the fish escapes.*

## **⚔️ Game Secrets & Tips**

### **🌈 The "Pity" System (Rainbow Bobber)**

Your Fishing Rod gets damaged over time. **Don't fix it immediately\!**

* **Damaged Rod (50%)** \= **Green/Fast Rainbow Bobber** (+20% Luck)  
* **Broken Rod (25%)** \= **Hyper Speed Rainbow Bobber** (+45% Luck)

**Pro Tip:** Use a broken rod to catch the rarest fish (Mythic/Secret)\!

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

**"Screen looks wrong?"**

* This game is made for T-Embed resolution.

*Happy Fishing\!* 🎣