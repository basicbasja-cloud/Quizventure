// ============================================================
// 🏠 Main Menu Scene
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background (cover: maintain aspect ratio)
    SoundManager.init(this);
    this.add.image(width / 2, height / 2, 'bg_menu')
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);

    // Title
    this.add.text(width / 2, height * 0.15, TH.gameTitle, {
      fontSize: '52px',
      color: '#4ecca3',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.22, TH.gameSubtitle, {
      fontSize: '22px',
      color: '#f39c12',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(2, 0x4ecca3, 0.5);
    line.beginPath();
    line.moveTo(width * 0.3, height * 0.27);
    line.lineTo(width * 0.7, height * 0.27);
    line.strokePath();

    // Menu buttons
    const hasSave = SaveSystem.getAllSlots().some(s => s.exists);
    const buttons: { text: string; action: () => void; enabled: boolean }[] = [
      {
        text: TH.mainMenu.newGame,
        action: () => this.scene.start('PartySelectScene'),
        enabled: true,
      },
      {
        text: TH.mainMenu.continue,
        action: () => this.scene.start('SaveLoadScene'),
        enabled: hasSave,
      },
      {
        text: TH.mainMenu.teacherDashboard,
        action: () => this.scene.start('TeacherDashboard'),
        enabled: true,
      },
      {
        text: TH.mainMenu.settings,
        action: () => this.showSettings(),
        enabled: true,
      },
    ];

    const startY = height * 0.33;
    const spacing = 70;

    buttons.forEach((btn, i) => {
      const y = startY + i * spacing;
      const bg = this.add.image(width / 2, y, 'btn_green_lg').setAlpha(btn.enabled ? 1 : 0.4);
      const txt = this.add.text(width / 2, y, btn.text, {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0.5);

      if (btn.enabled) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => { bg.setScale(1.05); });
        bg.on('pointerout', () => { bg.setScale(1); });
        bg.on('pointerdown', () => {
          bg.setScale(0.95);
          this.time.delayedCall(100, btn.action);
        });
      }
    });

    // Credits
    this.add.text(width / 2, height * 0.92, '© 2026 Quest to Learn', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-T', () => {
      this.scene.start('TeacherDashboard');
    });
    this.input.keyboard?.on('keydown-ONE', () => {
      this.scene.start('PartySelectScene', { saveSlot: -1 });
    });
    this.input.keyboard?.on('keydown-TWO', () => {
      this.scene.start('SaveLoadScene', { mode: 'load' });
    });
  }

  private showSettings() {
    // Simple settings overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7).setInteractive();
    const panel = this.add.rectangle(400, 300, 400, 300, 0x16213e).setStrokeStyle(2, 0x4ecca3);

    const title = this.add.text(400, 180, TH.settings.title, {
      fontSize: '28px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(400, 420, TH.general.close, {
      fontSize: '20px', color: '#e74c3c', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      closeBtn.destroy();
    });
  }
}
