# **🎣 Fishing Legend**

**Fishing Legend** is a retro-style RPG fishing simulation game built using JavaScript for embedded devices. Catch legendary fish, collect money, and upgrade your gear\!

## **✨ Key Features**

* **🎣 Challenging Fishing System:**  
  * Interactive *Cast* and *Reel* mechanics.  
  * **Manual Mode** (rapid button mashing) and **Auto Mode** (relaxed gameplay).  
  * Fish stamina and rod durability indicators.  
* **🍀 Smart RNG System (Pity System):**  
  * Chances of finding rare fish increase as your rod nears breaking point.  
  * Use **Charms** to boost your *Luck*.  
  * Rarity tiers: *Common* to *Secret* (Max drop rate capped at 50%).  
* **🌦️ Dynamic Time & Weather Cycle:**  
  * Visual time progression: **Dawn, Day, Dusk, Night**.  
  * **Rain System:** Random rainfall affects the sky and sea visuals.  
  * Dynamic background objects (Clouds, Birds, Ships, Islands).  
* **💰 Economy & Progression:**  
  * **Shop:** Buy new *Rods* and *Charms*.  
  * **Inventory:** Manage your catches and equipment.  
  * **Persistence:** All data (Money, Items, Inventory) is automatically saved to the SD Card (/FishingLegendDB).

## **🎮 Controls**

| Button | Menu Function | Fishing Function |
| :---- | :---- | :---- |
| **Next / Prev** | Menu Navigation / Scroll Items | Toggle Mode (Manual/Auto) |
| **Select (OK)** | Confirm / Buy / Sell | Cast Line / Reel In Fish |
| **Esc** | Back / Exit | Cancel Action |

## **🛠️ System Requirements**

This game requires an embedded JavaScript runtime with the following modules:

* display (Graphics & Sprites)  
* keyboard (Button Input)  
* audio (Tone sound effects)  
* storage (File system for data saving)  
* serial (For file system commands)

## **🚀 How to Install**

1. Ensure your hardware has firmware installed that supports the modules listed above.  
2. Copy the fishing\_legend.js file to the device storage.  
3. Run the fishing\_legend.js file.  
4. The save data folder /FishingLegendDB will be created automatically upon the first run.

## **📸 Data Structure**

The game stores data in JSON format:

* fish.json / myfish.json: Fish Database & Inventory.  
* rod.json / myrod.json: Rod Database & Inventory.  
* money.json: Player currency data.

## **📜 License**

This project was created for educational and hobby purposes. Feel free to modify it as you like\!