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

    // Title
    this.add.text(width / 2, 40, TH.partySelect.title, {
      fontSize: '32px',
      color: '#4ecca3',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 75, TH.partySelect.subtitle, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);

    // Class cards in a 3x2 grid
    const cardWidth = 220;
    const cardHeight = 200;
    const startX = width / 2 - (cardWidth + 20);
    const startY = 130;
    const cols = 3;
    const spacingX = cardWidth + 15;
    const spacingY = cardHeight + 15;

    ALL_CLASSES.forEach((classType, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (width / 2) - ((cols - 1) * spacingX / 2) + col * spacingX;
      const y = startY + row * spacingY;

      this.createClassCard(x, y, cardWidth, cardHeight, classType);
    });

    // Confirm button
    this.createConfirmButton(width, height);
  }

  private createClassCard(x: number, y: number, w: number, h: number, classType: ClassType) {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, w, h, 0x16213e, 0.9)
      .setStrokeStyle(2, 0x333333);
    container.add(bg);

    // Character sprite placeholder
    const charKey = `char_${classType}`;
    if (this.textures.exists(charKey)) {
      const sprite = this.add.image(0, -45, charKey).setScale(2);
      sprite.setData('origScale', 2);
      startIdleAnimation(sprite);
      container.add(sprite);
    }

    // Class name
    const nameText = this.add.text(0, 20, CLASS_NAMES_TH[classType], {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(nameText);

    // Description
    const descText = this.add.text(0, 50, CLASS_DESC_TH[classType], {
      fontSize: '11px',
      color: '#999999',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: w - 20 },
      align: 'center',
    }).setOrigin(0.5);
    container.add(descText);

    // Selected indicator
    const selectedIndicator = this.add.text(w / 2 - 15, -h / 2 + 10, '✓', {
      fontSize: '20px',
      color: '#4ecca3',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5).setVisible(false);
    container.add(selectedIndicator);

    // Interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      if (!this.selected.includes(classType)) {
        bg.setStrokeStyle(2, 0x4ecca3);
      }
    });
    bg.on('pointerout', () => {
      if (!this.selected.includes(classType)) {
        bg.setStrokeStyle(2, 0x333333);
      }
    });
    bg.on('pointerdown', () => {
      this.toggleSelection(classType, container, bg, selectedIndicator);
    });

    container.setData('classType', classType);
    container.setData('bg', bg);
    container.setData('indicator', selectedIndicator);
  }

  private toggleSelection(
    classType: ClassType,
    container: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Rectangle,
    indicator: Phaser.GameObjects.Text,
  ) {
    const idx = this.selected.indexOf(classType);

    if (idx >= 0) {
      // Deselect
      this.selected.splice(idx, 1);
      bg.setStrokeStyle(2, 0x333333);
      indicator.setVisible(false);
    } else if (this.selected.length < 4) {
      // Select
      this.selected.push(classType);
      bg.setStrokeStyle(2, 0x4ecca3);
      indicator.setVisible(true);
    }
  }

  private createConfirmButton(width: number, height: number) {
    const confirmBg = this.add.image(width / 2, height - 50, 'btn_gold_lg').setAlpha(0.5);
    const confirmText = this.add.text(width / 2, height - 50, TH.partySelect.confirm, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);

    const updateButton = () => {
      const ready = this.selected.length === 4;
      confirmBg.setAlpha(ready ? 1 : 0.5);
      if (ready) {
        confirmBg.setInteractive({ useHandCursor: true });
        confirmBg.on('pointerdown', () => { SoundManager.confirm(); this.startGame(); });
      }
    };

    // Watch for changes by re-checking on pointer events
    this.events.on('wake', updateButton);

    // Initial state
    confirmBg.setInteractive({ useHandCursor: true });
    confirmBg.on('pointerdown', () => {
      if (this.selected.length === 4) {
        this.startGame();
      }
    });
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
