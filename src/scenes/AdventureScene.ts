// ============================================================
// 🏞️ Adventure Scene — D&D Exploration
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { DiceSystem, DiceType, EncounterType } from '../systems/DiceSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';
import type { Character } from '../models/Character';
import type { SaveSlot } from '../models/PlayerState';
import { createCharacter } from '../models/Character';
import { createNewSave } from '../models/PlayerState';

interface ChapterNode {
  type: EncounterType;
  label: string;
  description: string;
  dc?: number;
  statBonus?: string;
  goldReward?: number;
  hpDamage?: number;
  isBossGate?: boolean;
}

const CHAPTERS: ChapterNode[][] = [
  // Chapter 1: Forest of Beginnings
  [
    { type: EncounterType.Empty, label: 'เริ่มต้นการผจญภัย', description: 'คุณเริ่มต้นในป่าลึกลับ...' },
    { type: EncounterType.Puzzle, label: TH.adventure.climbTree, description: TH.adventure.climbTreeDesc, dc: 10, statBonus: 'atk' },
    { type: EncounterType.Treasure, label: TH.adventure.openChest, description: TH.adventure.findTreasure, goldReward: 50 },
    { type: EncounterType.Enemy, label: 'สลิมป์ป่า', description: 'สลิมป์ป่าขวางทางอยู่!' },
    { type: EncounterType.Rest, label: TH.adventure.rest, description: TH.adventure.findRest },
    { type: EncounterType.Puzzle, label: TH.adventure.jumpGap, description: TH.adventure.jumpGapDesc, dc: 12, statBonus: 'spd' },
    { type: EncounterType.Trap, label: 'กับดักเถาวัลย์', description: TH.adventure.findTrap, hpDamage: 15 },
    { type: EncounterType.Boss, label: 'ราชาสลิมป์', description: 'ราชาสลิมป์ปรากฏตัว!', isBossGate: true },
  ],
  // Chapter 2: Crystal Cave
  [
    { type: EncounterType.Empty, label: 'เข้าสู่ถ้ำคริสตัล', description: 'ถ้ำคริสตัลส่องประกายระยิบระยับ...' },
    { type: EncounterType.Puzzle, label: TH.adventure.forceDoor, description: TH.adventure.forceDoorDesc, dc: 13, statBonus: 'def' },
    { type: EncounterType.Treasure, label: TH.adventure.searchArea, description: 'คุณพบคริสตัลวิเศษ!', goldReward: 80 },
    { type: EncounterType.Enemy, label: 'ก็อบลินถ้ำ', description: 'ก็อบลินถือกระบองขวางทาง!' },
    { type: EncounterType.Puzzle, label: TH.adventure.sneakPast, description: TH.adventure.sneakPastDesc, dc: 14, statBonus: 'spd' },
    { type: EncounterType.Trap, label: 'หินถล่ม', description: 'หินถล่มใส่คุณ!', hpDamage: 25 },
    { type: EncounterType.Rest, label: TH.adventure.rest, description: 'คุณพักที่ลานคริสตัล' },
    { type: EncounterType.Boss, label: 'ก็อบลินคิง', description: 'ก็อบลินคิงผู้ยิ่งใหญ่!', isBossGate: true },
  ],
  // Chapter 3: Dragon's Peak
  [
    { type: EncounterType.Empty, label: 'ยอดเขามังกร', description: 'ภูเขาไฟที่มียอดเขาสูงตระหง่าน...' },
    { type: EncounterType.Puzzle, label: TH.adventure.persuade, description: TH.adventure.persuadeDesc, dc: 15, statBonus: 'wis' },
    { type: EncounterType.Treasure, label: 'สมบัติมังกร', description: 'คุณพบสมบัติโบราณ!', goldReward: 120 },
    { type: EncounterType.Enemy, label: 'มังกรน้อย', description: 'มังกรน้อยพ่นไฟใส่คุณ!' },
    { type: EncounterType.Puzzle, label: TH.adventure.climbTree, description: 'ปีนหน้าผาสูงชัน', dc: 16, statBonus: 'atk' },
    { type: EncounterType.Trap, label: 'ลาวา', description: 'ลาวาปะทุ!', hpDamage: 35 },
    { type: EncounterType.Rest, label: TH.adventure.rest, description: 'ที่หลบภัยบนเขา' },
    { type: EncounterType.Boss, label: 'มังกรไฟ', description: 'มังกรไฟจอมโหด!', isBossGate: true },
  ],
];

export class AdventureScene extends Phaser.Scene {
  private party: Character[] = [];
  private currentChapter = 0;
  private currentNodeIndex = 0;
  private currentChapterData!: ChapterNode[];
  private gold = 100;
  private saveSlot = 0;
  private infoText!: Phaser.GameObjects.Text;
  private diceResultText!: Phaser.GameObjects.Text;
  private diceContainer!: Phaser.GameObjects.Container;
  private rollingDice!: Phaser.GameObjects.Container;
  private rollingValue!: Phaser.GameObjects.Text;
  private isRolling = false;

  constructor() {
    super({ key: 'AdventureScene' });
  }

  async create(data?: { party?: Character[]; saveSlot?: number }) {
    const { width, height } = this.cameras.main;

    // Load state
    if (data?.party) {
      this.party = data.party;
      this.saveSlot = data.saveSlot ?? 0;
    } else if (data?.saveSlot !== undefined) {
      const saved = SaveSystem.load(data.saveSlot);
      if (saved) {
        this.party = saved.party;
        this.gold = saved.gold;
        this.currentChapter = saved.currentChapter - 1;
        this.currentNodeIndex = saved.currentNodeIndex;
        this.saveSlot = data.saveSlot;
      }
    }

    SoundManager.init(this);
    this.currentChapterData = CHAPTERS[this.currentChapter] || CHAPTERS[0];

    this.add.image(width / 2, height / 2, 'bg_adventure')
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);

    // UI Layout
    // Top bar
    this.add.text(width / 2, 20, `${TH.adventure.chapter} ${this.currentChapter + 1}: ${this.currentChapterData[0]?.label || ''}`, {
      fontSize: '20px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Party summary
    this.createPartySummary();

    // Main info area
    const node = this.currentChapterData[this.currentNodeIndex];
    const panelBg = this.add.rectangle(width / 2, 220, 600, 180, 0x16213e, 0.9).setStrokeStyle(1, 0x4ecca3);

    this.add.text(width / 2, 150, `📍 ${node.label}`, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.infoText = this.add.text(width / 2, 220, node.description, {
      fontSize: '16px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: 550 }, align: 'center',
    }).setOrigin(0.5);

    // Dice result area
    this.diceResultText = this.add.text(width / 2, 290, '', {
      fontSize: '18px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: 550 }, align: 'center',
    }).setOrigin(0.5);

    // Action buttons
    this.createActionButtons(node);

    // Dice visual
    this.diceContainer = this.add.container(width / 2, 420);
    this.createDiceDisplay();

    // Bottom nav
    const progressText = this.add.text(width / 2, height - 20, `[${this.currentNodeIndex + 1}/${this.currentChapterData.length}]`, {
      fontSize: '14px', color: '#555555', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);
  }

  private createPartySummary() {
    const { width } = this.cameras.main;
    this.party.forEach((char, i) => {
      const x = 40 + i * 190;
      const y = 60;
      const hpPct = char.stats.hp / char.stats.maxHp;
      const hpColor = hpPct > 0.5 ? '#4ecca3' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';

      this.add.text(x, y, `${char.name}`, { fontSize: '12px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold' });
      this.add.text(x, y + 16, `Lv.${char.level}`, { fontSize: '11px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif' });
      this.add.text(x + 50, y + 16, `HP ${char.stats.hp}/${char.stats.maxHp}`, { fontSize: '11px', color: hpColor, fontFamily: 'Noto Sans Thai, Arial, sans-serif' });

      // HP bar
      const barBg = this.add.rectangle(x + 70, y + 30, 80, 6, 0x333333);
      const barFill = this.add.rectangle(x + 30, y + 30, 80 * hpPct, 6, hpPct > 0.5 ? 0x4ecca3 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c).setOrigin(0, 0.5);
    });

    // Gold display
    this.add.text(width - 50, 60, `${TH.stats.gold}: ${this.gold}`, {
      fontSize: '16px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(1, 0);
  }

  private createActionButtons(node: ChapterNode) {
    const { width } = this.cameras.main;
    const buttons: { text: string; action: () => void }[] = [];

    switch (node.type) {
      case EncounterType.Empty:
        buttons.push({ text: TH.adventure.continue, action: () => this.advanceToNext() });
        break;
      case EncounterType.Puzzle:
        if (node.dc) {
          buttons.push({ text: `🎲 โยน d20 (DC ${node.dc})`, action: () => this.doDiceCheck(node) });
        }
        break;
      case EncounterType.Treasure:
        buttons.push({ text: TH.adventure.openChest, action: () => this.doOpenChest(node) });
        break;
      case EncounterType.Trap:
        buttons.push({ text: TH.adventure.continue, action: () => this.doTrapDamage(node) });
        break;
      case EncounterType.Rest:
        buttons.push({ text: TH.adventure.rest, action: () => this.doRest() });
        break;
      case EncounterType.Enemy:
        buttons.push({ text: `⚔️ ${TH.adventure.findEnemy}`, action: () => this.startBattle(false) });
        break;
      case EncounterType.Boss:
        buttons.push({ text: `⚔️ ${TH.adventure.findBoss}`, action: () => this.startBattle(true) });
        break;
      case EncounterType.Puzzle:
        buttons.push({ text: TH.adventure.continue, action: () => this.advanceToNext() });
        break;
    }

    buttons.forEach((btn, i) => {
      const x = width / 2 - 100 + i * 210;
      const bg = this.add.image(x, 370, i === 1 ? 'btn_gold' : 'btn_green').setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, 370, btn.text, { fontSize: '16px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setScale(1.05));
      bg.on('pointerout', () => bg.setScale(1));
      bg.on('pointerdown', () => {
        bg.setScale(0.95);
        btn.action();
      });
    });

    // Save button
    const saveBg = this.add.image(width - 40, 370, 'btn_blue_sm').setInteractive({ useHandCursor: true });
    const saveTxt = this.add.text(width - 40, 370, TH.saveLoad.save, { fontSize: '12px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5);
    saveBg.on('pointerdown', () => this.saveGame());
  }

  private createDiceDisplay() {
    const diceTypes = [DiceType.D4, DiceType.D6, DiceType.D8, DiceType.D10, DiceType.D12, DiceType.D20];
    const labels = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
    diceTypes.forEach((dice, i) => {
      const x = -150 + i * 60;
      const diceSprite = this.add.image(x, 0, `dice_${labels[i]}`).setScale(1.2);
      this.diceContainer.add(diceSprite);
    });

    // Rolling dice overlay (center screen, hidden initially)
    this.rollingDice = this.add.container(400, 300).setVisible(false).setDepth(100);
    const bg = this.add.rectangle(0, 0, 200, 200, 0x000000, 0.85).setStrokeStyle(3, 0xf39c12);
    const diceImg = this.add.image(0, -15, 'dice_d20').setScale(3);
    this.rollingValue = this.add.text(0, 45, '20', {
      fontSize: '36px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);
    const rollLabel = this.add.text(0, -70, '\u{1F3B2} \u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E2D\u0E22...', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);
    this.rollingDice.add([bg, rollLabel, diceImg, this.rollingValue]);
  }

  private async doDiceCheck(node: ChapterNode) {
    if (this.isRolling) return;
    this.isRolling = true;

    const dc = node.dc || 10;
    const statKey = (node.statBonus || 'atk') as keyof typeof this.party[0]['stats'];
    const bestChar = [...this.party].sort((a, b) => b.stats[statKey] - a.stats[statKey])[0];
    const bonus = Math.floor((bestChar?.stats[statKey] || 10) / 4);

    // Hide dice bar, show rolling overlay
    this.diceContainer.setVisible(false);
    this.diceResultText.setText('');
    this.rollingDice.setVisible(true);

    const result = DiceSystem.skillCheck(bonus, dc);
    const finalValue = result.total;

    let tickCount = 0;
    const maxTicks = 25;
    SoundManager.diceRoll();
    const doSpinTick = () => {
      tickCount++;
      this.rollingValue.setText(String(Math.floor(Math.random() * 20) + 1));
      // Rotate dice container contents
      this.rollingDice.each((child: any) => {
        if (child.rotation !== undefined && child.text === undefined) {
          child.rotation += 1.5;
        }
      });
      
      if (tickCount < maxTicks) {
        const nextDelay = 50 + (tickCount / maxTicks) * 350;
        this.time.delayedCall(nextDelay, doSpinTick);
      } else {
        this.rollingDice.each(child => {
          if (child.type === 'Image') child.rotation = 0;
        });
        this.rollingValue.setText(String(finalValue));
        this.tweens.add({
          targets: this.rollingValue,
          scaleX: 1.5, scaleY: 1.5,
          duration: 120, yoyo: true,
        });
        this.time.delayedCall(600, () => {
          this.rollingDice.setVisible(false);
          this.diceContainer.setVisible(true);
          this.diceResultText.setText(DiceSystem.getResultText(result));
          if (result.isSuccess) {
            this.infoText.setText('\u2705 ' + DiceSystem.getResultText(result));
            this.gold += 30;
          } else {
            this.infoText.setText('\u274C ' + DiceSystem.getResultText(result));
            this.party.forEach(char => char.stats.hp = Math.max(1, char.stats.hp - 10));
          }
          this.isRolling = false;
          this.time.delayedCall(1500, () => this.advanceToNext());
        });
      }
    };
    doSpinTick();
  }

  private doOpenChest(node: ChapterNode) {
    const reward = node.goldReward || 50;
    this.gold += reward;
    this.infoText.setText(`💰 ${TH.adventure.findTreasure} ${reward} ${TH.adventure.coins}`);
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doTrapDamage(node: ChapterNode) {
    const dmg = node.hpDamage || 20;
    this.party.forEach(char => {
      char.stats.hp = Math.max(1, char.stats.hp - dmg);
    });
    this.infoText.setText(`💥 ${TH.adventure.findTrap} ${dmg}`);
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doRest() {
    this.party.forEach(char => {
      char.stats.hp = char.stats.maxHp;
      char.stats.mp = char.stats.maxMp;
    });
    this.infoText.setText(`💤 ${TH.adventure.findRest}`);
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private startBattle(isBoss: boolean) {
    this.scene.start('BattleScene', {
      party: this.party,
      isBoss,
      chapter: this.currentChapter,
      nodeIndex: this.currentNodeIndex,
      saveSlot: this.saveSlot,
      gold: this.gold,
    });
  }

  private advanceToNext() {
    this.currentNodeIndex++;
    if (this.currentNodeIndex >= this.currentChapterData.length) {
      // Chapter complete!
      this.currentChapter++;
      if (this.currentChapter >= CHAPTERS.length) {
        // Game complete
        this.scene.start('MainMenuScene');
        return;
      }
      this.currentNodeIndex = 0;
      this.currentChapterData = CHAPTERS[this.currentChapter];
    }
    this.scene.restart({
      party: this.party,
      saveSlot: this.saveSlot,
      gold: this.gold,
      currentChapter: this.currentChapter,
      currentNodeIndex: this.currentNodeIndex,
    });
  }

  private saveGame() {
    const saveData = createNewSave(this.party);
    saveData.id = this.saveSlot;
    saveData.gold = this.gold;
    saveData.currentChapter = this.currentChapter + 1;
    saveData.currentNodeIndex = this.currentNodeIndex;
    SaveSystem.save(this.saveSlot, saveData);
    this.infoText.setText('💾 ' + TH.saveLoad.saveSuccess);
  }
}
