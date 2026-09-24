# SHADOW ASCENSION

**Shadow Ascension** is a browser-based 3D Anime Action RPG built with **React**, **Three.js**, **React Three Fiber (@react-three/fiber)**, **@react-three/drei**, and **Zustand**.

All characters, lore, enemies, abilities, sound synthesis, and assets are **100% original**.

---

## Story & Concept

The player controls **Kael**, a low-ranked awakened hunter who discovers a mysterious cosmic entity known as the **Ascension Core**. By clearing the **Forgotten Crypt**, defeating ferocious fiends, harvesting dark essence, and performing **Shadow Extraction** on fallen foes, Kael commands a legion of shadow companions and ascends to become the supreme monarch of shadows.

---

## Features

- **Smooth Third-Person 3D Action RPG Controller**:
  - Smooth WASD movement, forward tilt running, and dynamic dash mechanics.
  - Orbiting third-person camera.
  - 3-step basic attack combo with dual glowing shadow blades.
- **Original Skill System**:
  - `[ LMB ]` **Basic Attack Strike**: 3-hit rapid shadow blade combo.
  - `[ Q ]` **Shadow Slash**: Fast crescent blade wave of concentrated dark essence.
  - `[ E ]` **Void Burst**: High-impact area-of-effect detonation repelling surrounding enemies.
  - `[ SPACE ]` **Phantom Step**: High-speed dash providing complete invulnerability.
  - `[ R ]` **Eclipse Dominion (Ultimate)**: Smashes the ground with cataclysmic abyssal rifts and supercharges active shadows.
- **Enemies & AI State Machine**:
  - `Ash Goblin`: Aggressive pack melee beast.
  - `Bone Reaver`: Rapid skirmisher with twin sickle-claws.
  - `Void Archer`: Dark ranged marksman.
  - `Crypt Guardian`: Elite armored sentinel with runic shield and broadaxe.
  - `Abyss Warden (Boss)`: 4-phase dungeon boss with ground-cleave attacks, Phase 2 minion summons, Phase 3 telegraphed red warning area attacks, and Phase 4 Enraged Frenzy.
- **Shadow Extraction & Shadow Army**:
  - Slay elite foes and extract their souls (`[ F ]`) to recruit them into your army.
  - Summon up to **3 active shadow soldiers** into the 3D world:
    - *Dusk Knight* (Rank C - Melee Heavy Tank)
    - *Nightfang* (Rank D - Agile Assassin)
    - *Void Marksman* (Rank C - Ranged Sniper)
    - *Umbral General* (Rank A - Supreme Commander)
  - Shadows follow Kael in formation, seek out targets, and battle enemies in real time.
  - Level up and ascend shadows using harvested **Ascension Essence Shards**.
- **RPG Progression & Character Stats**:
  - Leveling curve with attribute points allocation: Strength (STR), Agility (AGI), Intelligence (INT), and Vitality (VIT).
  - Combat attributes: Level, XP, HP, Max HP, Mana, Max Mana, Attack, Defense, Speed, Crit Rate, Crit Damage.
- **Inventory & Loot System**:
  - Equipment slots: Weapons, Armor, Accessories, Consumables.
  - 6 Rarity tiers: *Common, Uncommon, Rare, Epic, Legendary, Mythic* with distinct glowing aura borders.
  - 3D crystal drops with magnetic auto-collection.
- **Audio Synthesizer Engine**:
  - Built-in Web Audio API sound generator providing zero-dependency sound effects for blade slashes, critical strikes, skills, boss roars, level-up fanfare, and soul extraction.
- **Save / Load Persistence**:
  - Automatically preserves character level, equipment, inventory, and extracted shadow army to `localStorage`.

---

## Controls

| Key | Action |
|---|---|
| **W, A, S, D** | Move Kael |
| **Mouse / Drag** | Orbit Camera Look |
| **Left Click (LMB)** | Basic Attack Combo |
| **Q** | Skill 1: Shadow Slash |
| **E** | Skill 2: Void Burst |
| **Space** | Phantom Step (Invulnerable Dash) |
| **R** | Ultimate: Eclipse Dominion |
| **F** | Soul Extraction / Interact |
| **C** | Character Status & Attribute Allocation |
| **I / B** | Inventory & Equipment |
| **Y** | Shadow Army Interface |
| **ESC** | Settings & Configuration |

---

## Running the Project

Install dependencies:
```bash
npm install
```

Launch development server:
```bash
npm run dev
```

Open browser at:
```text
http://localhost:5173
```
# SOLO
