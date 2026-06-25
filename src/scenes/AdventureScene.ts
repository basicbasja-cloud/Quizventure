// ============================================================
// 🗺️ Adventure Scene — Map-Based Exploration
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
  hpDamage?: number;
  isBossGate?: boolean;
  /** Map position (x,y) for this node on the 800x600 canvas */
  mapX: number;
  mapY: number;
}

const CHAPTER_MAP_BG: Record<number, string> = {
  0: 'bg_forest',
  1: 'bg_cave',
  2: 'bg_mountain',
};

const CHAPTERS: ChapterNode[][] = [
  // Chapter 1: Forest Path
  [
    { type: EncounterType.Empty, label: 'เริ่มต้น', description: 'คุณเริ่มต้นในป่าลึกลับ...', mapX: 80, mapY: 370 },
    { type: EncounterType.Puzzle, label: TH.adventure.climbTree, description: TH.adventure.climbTreeDesc, dc: 10, statBonus: 'atk', mapX: 200, mapY: 310 },
    { type: EncounterType.Treasure, label: 'หีบสมบัติ', description: TH.adventure.findTreasure, mapX: 350, mapY: 280 },
    { type: EncounterType.Enemy, label: 'สลิมป์', description: 'สลิมป์ป่าขวางทางอยู่!', mapX: 500, mapY: 310 },
    { type: EncounterType.Rest, label: TH.adventure.rest, description: TH.adventure.findRest, mapX: 600, mapY: 230 },
    { type: EncounterType.Puzzle, label: TH.adventure.jumpGap, description: TH.adventure.jumpGapDesc, dc: 12, statBonus: 'spd', mapX: 480, mapY: 160 },
    { type: EncounterType.Trap, label: 'กับดัก', description: TH.adventure.findTrap, hpDamage: 15, mapX: 300, mapY: 120 },
    { type: EncounterType.Boss, label: 'ราชาสลิมป์', description: 'ราชาสลิมป์ปรากฏตัว!', isBossGate: true, mapX: 150, mapY: 75 },
  ],
  // Chapter 2: Crystal Cave
  [
    { type: EncounterType.Empty, label: 'เข้าถ้ำ', description: 'เข้าสู่ถ้ำคริสตัล...', mapX: 80, mapY: 370 },
    { type: EncounterType.Puzzle, label: TH.adventure.forceDoor, description: TH.adventure.forceDoorDesc, dc: 13, statBonus: 'def', mapX: 250, mapY: 320 },
    { type: EncounterType.Treasure, label: 'คริสตัล', description: 'คุณพบคริสตัลวิเศษ!', mapX: 400, mapY: 350 },
    { type: EncounterType.Enemy, label: 'ก็อบลิน', description: 'ก็อบลินถือกระบองขวางทาง!', mapX: 550, mapY: 300 },
    { type: EncounterType.Puzzle, label: TH.adventure.sneakPast, description: TH.adventure.sneakPastDesc, dc: 14, statBonus: 'spd', mapX: 620, mapY: 210 },
    { type: EncounterType.Trap, label: 'หินถล่ม', description: 'หินถล่มใส่คุณ!', hpDamage: 25, mapX: 500, mapY: 140 },
    { type: EncounterType.Rest, label: TH.adventure.rest, description: 'คุณพักที่ลานคริสตัล', mapX: 350, mapY: 100 },
    { type: EncounterType.Boss, label: 'ก็อบลินคิง', description: 'ก็อบลินคิงผู้ยิ่งใหญ่!', isBossGate: true, mapX: 200, mapY: 65 },
  ],
  // Chapter 3: Dragon Summit
  [
    { type: EncounterType.Empty, label: 'ยอดเขา', description: 'ภูเขาไฟที่มียอดเขาสูงตระหง่าน...', mapX: 80, mapY: 370 },
    { type: EncounterType.Puzzle, label: TH.adventure.persuade, description: TH.adventure.persuadeDesc, dc: 15, statBonus: 'wis', mapX: 200, mapY: 300 },
    { type: EncounterType.Treasure, label: 'สมบัติมังกร', description: 'คุณพบสมบัติโบราณ!', mapX: 350, mapY: 260 },
    { type: EncounterType.Enemy, label: 'มังกรน้อย', description: 'มังกรน้อยพ่นไฟใส่คุณ!', mapX: 520, mapY: 280 },
    { type: EncounterType.Puzzle, label: 'ปีนผา', description: 'ปีนหน้าผาสูงชัน', dc: 16, statBonus: 'atk', mapX: 640, mapY: 190 },
    { type: EncounterType.Trap, label: 'ลาวา', description: 'ลาวาปะทุ!', hpDamage: 35, mapX: 500, mapY: 120 },
    { type: EncounterType.Rest, label: TH.adventure.rest, description: 'ที่หลบภัยบนเขา', mapX: 350, mapY: 80 },
    { type: EncounterType.Boss, label: 'มังกรไฟ', description: 'มังกรไฟจอมโหด!', isBossGate: true, mapX: 150, mapY: 55 },
  ],
];

export class AdventureScene extends Phaser.Scene {
  private party: Character[] = [];
  private currentChapter = 0;
  private currentNodeIndex = 0;
  private currentChapterData!: ChapterNode[];
  private saveSlot = 0;
  private infoText!: Phaser.GameObjects.Text;
  private diceResultText!: Phaser.GameObjects.Text;
  private rollingDice!: Phaser.GameObjects.Container;
  private rollingValue!: Phaser.GameObjects.Text;
  private isRolling = false;
  private diceContainer!: Phaser.GameObjects.Container;

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
        this.currentChapter = saved.currentChapter - 1;
        this.currentNodeIndex = saved.currentNodeIndex;
        this.saveSlot = data.saveSlot;
      }
    }

    SoundManager.init(this);
    this.currentChapterData = CHAPTERS[this.currentChapter] || CHAPTERS[0];

    // Chapter background
    const bgKey = CHAPTER_MAP_BG[this.currentChapter] || 'bg_adventure';
    this.add.image(width / 2, height / 2, bgKey)
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);

    // Dark overlay for map visibility
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35).setDepth(1);

    // Draw the map paths + nodes
    this.drawMap();

    // Dice container (hidden until roll)
    this.diceContainer = this.add.container(0, 0).setDepth(10);

    // Event panel overlay — compact, at bottom, no map overlap
    const panelY = 440;
    const panelH = 68;
    this.add.rectangle(width / 2, panelY, width - 20, panelH, 0x0a0a2e, 0.92)
      .setStrokeStyle(2, 0x4ecca3).setDepth(20);

    const node = this.currentChapterData[this.currentNodeIndex];
    this.add.text(width / 2, panelY - 20, `📍 ${node.label}`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);

    this.infoText = this.add.text(width / 2, panelY + 2, node.description, {
      fontSize: '11px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: width - 60 }, align: 'center',
    }).setOrigin(0.5).setDepth(21);

    this.diceResultText = this.add.text(width / 2, panelY + 18, '', {
      fontSize: '12px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setDepth(21);

    // Action buttons on the panel
    this.createActionButtons(node, panelY);

    // Rolling dice overlay
    this.rollingDice = this.add.container(width / 2, height / 2).setVisible(false).setDepth(100);
    const rollBg = this.add.rectangle(0, 0, 200, 200, 0x000000, 0.9).setStrokeStyle(3, 0xf39c12);
    const diceImg = this.add.image(0, -15, 'dice_d20').setScale(3);
    this.rollingValue = this.add.text(0, 45, '20', {
      fontSize: '36px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);
    const rollLabel = this.add.text(0, -70, '🎲 กำลังทอย...', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);
    this.rollingDice.add([rollBg, rollLabel, diceImg, this.rollingValue]);

    // Party bar
    this.createPartyBar();
  }

  private drawMap() {
    const nodes = this.currentChapterData;
    const completed = this.currentNodeIndex;

    // Connection lines between nodes
    const lineGfx = this.add.graphics().setDepth(5);
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const isDone = i < completed;
      lineGfx.lineStyle(isDone ? 3 : 1, isDone ? 0x4ecca3 : 0x444466, isDone ? 0.8 : 0.4);
      lineGfx.lineBetween(a.mapX, a.mapY, b.mapX, b.mapY);
    }

    // Node circles + labels
    nodes.forEach((node, i) => {
      const isCurrent = i === completed;
      const isPast = i < completed;

      const color = isCurrent ? 0xf39c12 : isPast ? 0x4ecca3 : 0x334466;
      const radius = isCurrent ? 12 : isPast ? 8 : 7;

      const circle = this.add.circle(node.mapX, node.mapY, radius, color, isCurrent ? 1 : 0.7)
        .setStrokeStyle(isCurrent ? 3 : 1, isCurrent ? 0xffffff : 0x667788)
        .setDepth(6);

      if (isCurrent) {
        this.tweens.add({
          targets: circle,
          scaleX: 1.3, scaleY: 1.3,
          duration: 800, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      // Node label: above if near bottom, below if near top
      const isBottomHalf = node.mapY > 200;
      const labelOffY = isBottomHalf ? -18 : 16;
      this.add.text(node.mapX, node.mapY + labelOffY, node.label, {
        fontSize: isCurrent ? '11px' : '9px',
        color: isCurrent ? '#f39c12' : isPast ? '#88cc88' : '#667788',
        fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7);

      if (isPast) {
        this.add.text(node.mapX, node.mapY, '✓', {
          fontSize: '10px', color: '#ffffff', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(7);
      }
    });
  }

  private createPartyBar() {
    const { width } = this.cameras.main;
    const barY = 560;

    // Dark strip at bottom
    this.add.rectangle(width / 2, barY + 10, width, 40, 0x0a0a2e, 0.85).setDepth(19);

    this.add.text(5, barY, `บท ${this.currentChapter + 1}`, {
      fontSize: '10px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0, 0.5).setDepth(20);

    this.party.forEach((char, i) => {
      const x = 70 + i * 180;
      const hpPct = char.stats.hp / char.stats.maxHp;
      const hpColor = hpPct > 0.5 ? '#4ecca3' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';

      this.add.text(x, barY, `${char.name}`, {
        fontSize: '10px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setDepth(20);

      this.add.rectangle(x + 40, barY, 60, 5, 0x333333).setOrigin(0, 0.5).setDepth(20);
      this.add.rectangle(x + 40, barY, 60 * hpPct, 5,
        hpPct > 0.5 ? 0x4ecca3 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c
      ).setOrigin(0, 0.5).setDepth(21);

      this.add.text(x + 100, barY, `Lv.${char.level}`, {
        fontSize: '9px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0, 0.5).setDepth(20);
    });

    this.add.text(width - 5, barY, `${this.currentNodeIndex + 1}/${this.currentChapterData.length}`, {
      fontSize: '10px', color: '#555555', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(1, 0.5).setDepth(20);
  }

  private createActionButtons(node: ChapterNode, panelY: number) {
    const { width } = this.cameras.main;
    const buttons: { text: string; action: () => void }[] = [];

    switch (node.type) {
      case EncounterType.Empty:
        buttons.push({ text: TH.adventure.continue, action: () => this.advanceToNext() });
        break;
      case EncounterType.Puzzle:
        if (node.dc) buttons.push({ text: `🎲 d20 (DC ${node.dc})`, action: () => this.doDiceCheck(node) });
        break;
      case EncounterType.Treasure:
        buttons.push({ text: 'เปิด', action: () => this.doOpenChest() });
        break;
      case EncounterType.Trap:
        buttons.push({ text: 'เดินต่อ', action: () => this.doTrapDamage(node) });
        break;
      case EncounterType.Rest:
        buttons.push({ text: TH.adventure.rest, action: () => this.doRest() });
        break;
      case EncounterType.Enemy:
        buttons.push({ text: '⚔️ สู้', action: () => this.startBattle(false) });
        break;
      case EncounterType.Boss:
        buttons.push({ text: '⚔️ บอส', action: () => this.startBattle(true) });
        break;
    }

    buttons.forEach((btn, i) => {
      const x = width / 2 - 50 + i * 110;
      const bg = this.add.image(x, panelY + 30, i === 1 ? 'btn_gold_sm' : 'btn_blue_sm')
        .setInteractive({ useHandCursor: true }).setScale(0.9).setDepth(22);
      const txt = this.add.text(x, panelY + 30, btn.text, {
        fontSize: '11px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0.5).setDepth(23);

      bg.on('pointerover', () => bg.setScale(1.05));
      bg.on('pointerout', () => bg.setScale(1));
      bg.on('pointerdown', () => { bg.setScale(0.95); btn.action(); });
    });
  }

  private async doDiceCheck(node: ChapterNode) {
    if (this.isRolling) return;
    this.isRolling = true;

    const dc = node.dc || 10;
    const statKey = (node.statBonus || 'atk') as keyof typeof this.party[0]['stats'];
    const bestChar = [...this.party].sort((a, b) => b.stats[statKey] - a.stats[statKey])[0];
    const bonus = Math.floor((bestChar?.stats[statKey] || 10) / 4);

    this.diceResultText.setText('');
    this.rollingDice.setVisible(true);

    const result = DiceSystem.skillCheck(bonus, dc);
    const finalValue = result.total;

    let tickCount = 0;
    const maxTicks = 12;
    SoundManager.diceRoll();
    const doSpinTick = () => {
      tickCount++;
      this.rollingValue.setText(String(Math.floor(Math.random() * 20) + 1));
      if (tickCount < maxTicks) {
        this.time.delayedCall(30 + (tickCount / maxTicks) * 120, doSpinTick);
      } else {
        this.rollingValue.setText(String(finalValue));
        this.tweens.add({ targets: this.rollingValue, scaleX: 1.5, scaleY: 1.5, duration: 120, yoyo: true });
        this.time.delayedCall(600, () => {
          this.rollingDice.setVisible(false);
          this.diceResultText.setText(DiceSystem.getResultText(result));
          if (result.isSuccess) {
            this.infoText.setText('✅ ' + DiceSystem.getResultText(result));
          } else {
            this.infoText.setText('❌ ' + DiceSystem.getResultText(result));
            this.party.forEach(char => char.stats.hp = Math.max(1, char.stats.hp - 10));
          }
          this.isRolling = false;
          this.time.delayedCall(1500, () => this.advanceToNext());
        });
      }
    };
    doSpinTick();
  }

  private doOpenChest() {
    this.party.forEach(char => {
      char.stats.hp = Math.min(char.stats.maxHp, char.stats.hp + Math.floor(char.stats.maxHp * 0.2));
    });
    this.infoText.setText('✨ พบของวิเศษ! ทีมฟื้นฟู HP 20%');
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doTrapDamage(node: ChapterNode) {
    const dmg = node.hpDamage || 20;
    this.party.forEach(char => { char.stats.hp = Math.max(1, char.stats.hp - dmg); });
    this.infoText.setText(`💥 ${TH.adventure.findTrap} ${dmg}`);
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doRest() {
    this.party.forEach(char => { char.stats.hp = char.stats.maxHp; char.stats.mp = char.stats.maxMp; });
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
    });
  }

  private advanceToNext() {
    this.currentNodeIndex++;
    if (this.currentNodeIndex >= this.currentChapterData.length) {
      this.currentChapter++;
      if (this.currentChapter >= CHAPTERS.length) {
        this.scene.start('MainMenuScene');
        return;
      }
      this.currentNodeIndex = 0;
      this.currentChapterData = CHAPTERS[this.currentChapter];
    }
    this.scene.restart({ party: this.party, saveSlot: this.saveSlot });
  }
}
