// ============================================================
// 👥 Party Selection Scene — Pick 4 out of 6 classes
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { ClassType, ClassStage, CLASS_DEFINITIONS } from '../models/CharacterClass';
import { createCharacter } from '../models/Character';
import type { Character } from '../models/Character';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';
import { createNewSave } from '../models/PlayerState';
import { startIdleAnimation } from '../systems/CharacterAnimations';

const ALL_CLASSES: ClassType[] = [
  ClassType.Warrior,
  ClassType.Archer,
  ClassType.Paladin,
  ClassType.Rogue,
  ClassType.Mage,
  ClassType.Healer,
];

const CLASS_NAMES_TH: Record<ClassType, string> = {
  [ClassType.Warrior]: TH.classes.warrior,
  [ClassType.Archer]: TH.classes.archer,
  [ClassType.Paladin]: TH.classes.paladin,
  [ClassType.Rogue]: TH.classes.rogue,
  [ClassType.Mage]: TH.classes.mage,
  [ClassType.Healer]: TH.classes.healer,
};

const CLASS_DESC_TH: Record<ClassType, string> = {
  [ClassType.Warrior]: TH.classes.warriorDesc,
  [ClassType.Archer]: TH.classes.archerDesc,
  [ClassType.Paladin]: TH.classes.paladinDesc,
  [ClassType.Rogue]: TH.classes.rogueDesc,
  [ClassType.Mage]: TH.classes.mageDesc,
  [ClassType.Healer]: TH.classes.healerDesc,
};

export class PartySelectScene extends Phaser.Scene {
  private selected: ClassType[] = [];
  private partySlots: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'PartySelectScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    this.selected = [];

    SoundManager.init(this);
    this.add.image(width / 2, height / 2, 'bg_menu')
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3).setDepth(1);

    // Title
    this.add.text(width / 2, 60, TH.partySelect.title, {
      fontSize: '60px',
      color: '#4ecca3',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: '#4ecca3', blur: 20, fill: true },
    }).setOrigin(0.5).setDepth(5);

    this.add.text(width / 2, 125, TH.partySelect.subtitle, {
      fontSize: '30px',
      color: '#aaaaaa',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setDepth(5);

    // Class cards in a 3x2 grid — repositioned to not overlap title area
    const cardWidth = 540;
    const cardHeight = 320;
    const cols = 3;
    const spacingX = cardWidth + 40;
    const spacingY = cardHeight + 30;
    const startY = 300;

    ALL_CLASSES.forEach((classType, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (width / 2) - ((cols - 1) * spacingX / 2) + col * spacingX;
      const y = startY + row * spacingY;

      this.createClassCard(x, y, cardWidth, cardHeight, classType);
    });

    // Confirm button
    this.createConfirmButton(width, height);

    // Keyboard shortcuts: 1-6 to select, Enter to confirm
    this.input.keyboard?.on('keydown-ONE', () => this.toggleClass(0));
    this.input.keyboard?.on('keydown-TWO', () => this.toggleClass(1));
    this.input.keyboard?.on('keydown-THREE', () => this.toggleClass(2));
    this.input.keyboard?.on('keydown-FOUR', () => this.toggleClass(3));
    this.input.keyboard?.on('keydown-FIVE', () => this.toggleClass(4));
    this.input.keyboard?.on('keydown-SIX', () => this.toggleClass(5));
    this.input.keyboard?.on('keydown-ENTER', () => { if (this.selected.length === 4) this.startGame(); });
  }

  private toggleClass(index: number) {
    if (index < 0 || index >= ALL_CLASSES.length) return;
    const ct = ALL_CLASSES[index];
    const idx = this.selected.indexOf(ct);
    if (idx >= 0) { this.selected.splice(idx, 1); }
    else if (this.selected.length < 4) { this.selected.push(ct); }
  }

  private createClassCard(x: number, y: number, w: number, h: number, classType: ClassType) {
    const container = this.add.container(x, y);

    // Card shadow/glow effect
    const glow = this.add.rectangle(0, 0, w + 8, h + 8, 0x4ecca3, 0.08)
      .setStrokeStyle(1, 0x4ecca3, 0.15);
    container.add(glow);

    // Card background with gradient look
    const bg = this.add.rectangle(0, 0, w, h, 0x16213e, 0.92)
      .setStrokeStyle(3, 0x333355);
    container.add(bg);

    // Inner highlight border
    const innerBorder = this.add.rectangle(0, 0, w - 12, h - 12, 0x000000, 0)
      .setStrokeStyle(1, 0x4ecca3, 0.1);
    container.add(innerBorder);

    // Character sprite placeholder — repositioned for smaller card
    const charKey = `char_${classType}`;
    if (this.textures.exists(charKey)) {
      const sprite = this.add.image(0, -60, charKey).setScale(3.0);
      sprite.setData('origScale', 3.0);
      startIdleAnimation(sprite);
      container.add(sprite);
    }

    // Class name
    const nameText = this.add.text(0, 45, CLASS_NAMES_TH[classType], {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(nameText);

    // Description
    const descText = this.add.text(0, 90, CLASS_DESC_TH[classType], {
      fontSize: '16px',
      color: '#999999',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: w - 40 },
      align: 'center',
    }).setOrigin(0.5);
    container.add(descText);

    // Selected indicator — larger and more prominent
    const selectedIndicator = this.add.text(w / 2 - 35, -h / 2 + 25, '✓', {
      fontSize: '40px',
      color: '#4ecca3',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setVisible(false);
    container.add(selectedIndicator);

    // Interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      if (!this.selected.includes(classType)) {
        bg.setStrokeStyle(3, 0x4ecca3);
        glow.setStrokeStyle(2, 0x4ecca3, 0.5);
        this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 150, ease: 'Back.easeOut' });
      }
    });
    bg.on('pointerout', () => {
      if (!this.selected.includes(classType)) {
        bg.setStrokeStyle(3, 0x333355);
        glow.setStrokeStyle(1, 0x4ecca3, 0.15);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
      }
    });
    bg.on('pointerdown', () => {
      this.toggleSelection(classType, container, bg, selectedIndicator, glow);
    });

    container.setData('classType', classType);
    container.setData('bg', bg);
    container.setData('indicator', selectedIndicator);
    container.setData('glow', glow);
  }

  private toggleSelection(
    classType: ClassType,
    container: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Rectangle,
    indicator: Phaser.GameObjects.Text,
    glow?: Phaser.GameObjects.Rectangle,
  ) {
    const idx = this.selected.indexOf(classType);

    if (idx >= 0) {
      this.selected.splice(idx, 1);
      bg.setStrokeStyle(3, 0x333355);
      if (glow) glow.setStrokeStyle(1, 0x4ecca3, 0.15);
      indicator.setVisible(false);
      SoundManager.confirm();
    } else if (this.selected.length < 4) {
      this.selected.push(classType);
      bg.setStrokeStyle(3, 0x4ecca3);
      if (glow) glow.setStrokeStyle(2, 0x4ecca3, 0.6);
      indicator.setVisible(true);
      // Pulse animation on select
      this.tweens.add({
        targets: container, scaleX: 1.05, scaleY: 1.05, duration: 150, yoyo: true,
        ease: 'Back.easeOut',
      });
      SoundManager.confirm();
    }
  }

  private createConfirmButton(width: number, height: number) {
    const btnY = height - 85;
    const glowBg = this.add.rectangle(width / 2, btnY, 420, 65, 0xf39c12, 0.1)
      .setStrokeStyle(2, 0xf39c12, 0.3).setDepth(20);
    const confirmBg = this.add.rectangle(width / 2, btnY, 400, 55, 0x2a2a0a, 0.9)
      .setStrokeStyle(3, 0xf39c12, 0.5).setDepth(21);
    const confirmText = this.add.text(width / 2, btnY, TH.partySelect.confirm, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(22);

    // Counter: X/4 selected
    const counter = this.add.text(width / 2, btnY + 42, `เลือกแล้ว ${this.selected.length}/4`, {
      fontSize: '18px',
      color: '#888888',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setDepth(22);

    const updateButton = () => {
      const ready = this.selected.length === 4;
      confirmBg.fillColor = ready ? 0x3a2a0a : 0x2a2a0a;
      confirmBg.setStrokeStyle(3, ready ? 0xf39c12 : 0x665500, ready ? 0.9 : 0.4);
      glowBg.setStrokeStyle(2, ready ? 0xf39c12 : 0x665500, ready ? 0.6 : 0.2);
      confirmText.setColor(ready ? '#ffffff' : '#777777');
      counter.setText(`เลือกแล้ว ${this.selected.length}/4`);
      if (ready) {
        this.tweens.add({ targets: glowBg, alpha: 0.6, duration: 600, yoyo: true, repeat: -1 });
      }
    };

    confirmBg.setInteractive({ useHandCursor: true });
    confirmBg.on('pointerover', () => {
      if (this.selected.length === 4) {
        this.tweens.add({ targets: [confirmBg, confirmText], scaleX: 1.06, scaleY: 1.08, duration: 120 });
      }
    });
    confirmBg.on('pointerout', () => {
      this.tweens.add({ targets: [confirmBg, confirmText], scaleX: 1, scaleY: 1, duration: 120 });
    });
    confirmBg.on('pointerdown', () => {
      if (this.selected.length === 4) {
        SoundManager.confirm();
        this.startGame();
      }
    });

    // Periodically update counter
    this.time.addEvent({ delay: 200, loop: true, callback: updateButton });
  }

  private startGame() {
    if (this.selected.length !== 4) return;

    // Create default character names
    const nameMap: Record<ClassType, string> = {
      [ClassType.Warrior]: 'อัคนี',
      [ClassType.Archer]: 'สายธาร',
      [ClassType.Paladin]: 'ศักดิ์สิทธิ์',
      [ClassType.Rogue]: 'เงามืด',
      [ClassType.Mage]: 'เวทมนตร์',
      [ClassType.Healer]: 'เมตตา',
    };

    const party: Character[] = this.selected.map((classType, idx) => {
      return createCharacter(
        `hero_${idx}`,
        nameMap[classType],
        classType,
        1,
      );
    });

    // Auto-save the initial party
    const saveData = createNewSave(party);
    saveData.id = 0;
    SaveSystem.save(0, saveData);

    this.scene.start('AdventureScene', { party, saveSlot: 0 });
  }
}
