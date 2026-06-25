// ============================================================
// 💾 Save/Load Scene
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { SaveSystem } from '../systems/SaveSystem';
import { createNewSave } from '../models/PlayerState';
import type { Character } from '../models/Character';

export class SaveLoadScene extends Phaser.Scene {
  private mode: 'save' | 'load' = 'load';

  constructor() {
    super({ key: 'SaveLoadScene' });
  }

  create(data?: { mode?: 'save' | 'load'; party?: Character[] }) {
    const { width, height } = this.cameras.main;
    this.mode = data?.mode ?? 'load';

    this.add.image(width / 2, height / 2, 'bg_menu')
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);

    // Title
    const titleText = this.mode === 'save' ? TH.saveLoad.save : TH.saveLoad.load;
    this.add.text(width / 2, 60, titleText, {
      fontSize: '36px',
      color: '#4ecca3',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(60, 60, TH.general.back, {
      fontSize: '22px',
      color: '#e74c3c',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Save slots
    const slots = SaveSystem.getAllSlots();

    slots.forEach((slot, i) => {
      const y = 150 + i * 140;
      const bgColor = slot.exists ? 0x1a1a3e : 0x111122;
      const slotBg = this.add.rectangle(width / 2, y, 500, 120, bgColor, 0.8)
        .setStrokeStyle(1, slot.exists ? 0x4ecca3 : 0x333333);

      if (slot.exists) {
        this.add.text(width / 2 - 220, y - 35, `${TH.saveLoad.saveSlot} ${i + 1}`, {
          fontSize: '18px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        });
        this.add.text(width / 2 - 220, y - 10, `${TH.saveLoad.chapter}: ${slot.currentChapter}`, {
          fontSize: '16px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        });
        this.add.text(width / 2 - 220, y + 15, `${TH.stats.gold}: ${slot.gold} | ทีม: ${slot.party.length} คน`, {
          fontSize: '14px', color: '#999999', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        });
        this.add.text(width / 2 + 220, y + 15, new Date(slot.timestamp).toLocaleDateString('th-TH'), {
          fontSize: '12px', color: '#666666', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        }).setOrigin(1, 0.5);

        slotBg.setInteractive({ useHandCursor: true });
        slotBg.on('pointerdown', () => {
          if (this.mode === 'load') {
            this.scene.start('AdventureScene', { saveSlot: i });
          } else {
            // Save mode - overwrite
            if (data?.party) {
              const saveData = createNewSave(data.party);
              saveData.id = i;
              SaveSystem.save(i, saveData);
              this.scene.start('MainMenuScene');
            }
          }
        });
      } else {
        this.add.text(width / 2, y, `${TH.saveLoad.saveSlot} ${i + 1}: ${TH.saveLoad.empty}`, {
          fontSize: '20px', color: '#555555', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        }).setOrigin(0.5);

        slotBg.setInteractive({ useHandCursor: true });
        slotBg.on('pointerdown', () => {
          if (this.mode === 'save' && data?.party) {
            const saveData = createNewSave(data.party);
            saveData.id = i;
            SaveSystem.save(i, saveData);
            this.scene.start('MainMenuScene');
          }
        });
      }
    });
  }
}
