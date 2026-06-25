# Quizventure — ผจญภัยเรียนรู้

An educational JRPG built with **Phaser 4**, **TypeScript**, and **Vite**. Teachers can create custom question banks, and students battle through turn-based combat by answering questions correctly!

## 🎮 Features

### Turn-Based Combat ⚔️
- Party of 4 heroes vs monsters or bosses
- 5 actions: Attack, Skill (requires answering questions), Heal, Defend, Escape
- SPD-based turn order
- Boss phases with increasing difficulty

### D&D Exploration 🎲
- 3 adventure chapters with branching paths
- Dice roll challenges (D20) for puzzles, traps, and encounters
- Treasure, rest, and enemy encounters

### Character System 🧙‍♂️
- 6 unique classes with procedurally generated pixel-art sprites:
  - **Warrior** 🗡️ — Sword & shield, horned helmet, red cape
  - **Archer** 🏹 — Bow & arrow, green hood, ponytail
  - **Paladin** ⚔️ — Mace & cross shield, gold crown, white cape
  - **Rogue** 🗡️ — Dual daggers, dark leather, bandana
  - **Mage** 🔮 — Magic staff, wizard hat, purple robe
  - **Healer** ✨ — Holy staff, gold circlet, white robe
- Class evolution at Level 10 (enhanced sprites with golden aura)
- Leveling system with stat growth

### Question Bank System 📚
- Teacher Dashboard for adding/editing/deleting questions
- Import/export questions (JSON)
- 48 sample questions across 6 categories (math, science, geography, language, etc.)
- 3-use counter per question
- Category and difficulty filtering
- Skill effectiveness depends on answer accuracy

### Animations 🎬
- **Idle** — Gentle floating bob on all characters
- **Attack** — Lunge forward with bounce-back
- **Skill** — 360° spin + burst effect
- **Hit** — Red flash + screen shake
- **Heal** — Green expanding ring
- **Defend** — Shield flash + push back
- **Death** — Fade out + fall + rotation
- **Boss Phase** — Angry pulse + red tint

### Sound Effects 🔊
- 32 CC0 sound effects
- Attack swings, spells, hits, menu clicks, victory, enemy roars

### Save System 💾
- 3 save slots (localStorage)
- Saves party, progress, gold, and levels

### Thai Language 🇹🇭
- Full Thai localization (400+ UI strings)
- All menus, battles, tooltips, and dialogue in Thai

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/basicbasja-cloud/Quizventure.git

# Install dependencies
cd Quizventure
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🏗️ Project Structure

```
src/
├── lang/               # Thai language strings
│   └── th.ts
├── models/             # Data models
│   ├── Character.ts
│   ├── CharacterClass.ts
│   ├── PlayerState.ts
│   ├── Question.ts
│   └── Skill.ts
├── scenes/             # Phaser game scenes
│   ├── BootScene.ts        # Asset loading & initialization
│   ├── MainMenuScene.ts    # Title screen
│   ├── PartySelectScene.ts # Character selection
│   ├── SaveLoadScene.ts    # Save/load management
│   ├── AdventureScene.ts   # D&D exploration
│   ├── BattleScene.ts      # Turn-based combat
│   └── TeacherDashboard.ts # Question management
├── systems/            # Game systems
│   ├── BattleQuestionSystem.ts
│   ├── CharacterAnimations.ts  # Tween-based animation system
│   ├── DiceSystem.ts
│   ├── ProceduralChars.ts      # Procedural pixel-art generator
│   ├── QuestionBank.ts         # Dexie.js IndexedDB
│   ├── SaveSystem.ts
│   ├── SoundManager.ts
│   └── VisualEffects.ts
├── main.ts             # Game entry point
└── style.css
```

## 🧑‍🏫 Teacher Dashboard

Accessible from the main menu. Teachers can:
1. **Add questions** — prompt, 4 choices, correct answer, category, difficulty
2. **Edit/Delete** — manage existing questions
3. **Import** — bulk import questions via JSON
4. **Export** — backup all questions to JSON

Question format:
```json
{
  "prompt": "5 + 3 = ?",
  "choices": ["6", "7", "8", "9"],
  "correctIndex": 2,
  "category": "Warrior",
  "difficulty": 1
}
```

## 🎨 Assets

- **Character sprites**: Procedurally generated pixel art (Canvas 2D at boot time)
- **Backgrounds**: Kenney scenic backgrounds (CC0)
- **Sound effects**: CC0 RPG sound pack
- **No external sprite downloads required!**

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Phaser 4.2 | Game engine |
| TypeScript 5 | Language |
| Vite 8 | Bundler/dev server |
| Dexie.js 4 | IndexedDB for question bank |

## 📝 License

MIT
