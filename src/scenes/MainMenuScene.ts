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

    // Dark gradient overlay for depth
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.25).setDepth(1);

    // === Animated particles background effect ===
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * width;
      const py = Math.random() * height;
      const p = this.add.circle(px, py, Math.random() * 3 + 1, 0x4ecca3, 0.15).setDepth(1);
      this.tweens.add({
        targets: p, y: py - 80, alpha: 0, duration: 2000 + Math.random() * 3000,
        repeat: -1, delay: Math.random() * 2000, yoyo: true,
      });
    }

    // Title with gradient-like glow
    const title = this.add.text(width / 2, height * 0.13, TH.gameTitle, {
      fontSize: '110px',
      color: '#4ecca3',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#003322',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#4ecca3', blur: 30, fill: true },
    }).setOrigin(0.5).setDepth(5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.22, TH.gameSubtitle, {
      fontSize: '52px',
      color: '#f39c12',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: '#f39c12', blur: 15, fill: true },
    }).setOrigin(0.5).setDepth(5);

    // Pulsing animations
    this.tweens.add({ targets: title, alpha: 0.85, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: subtitle, alpha: 0.7, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Decorative line with gradient effect
    const lineGfx = this.add.graphics().setDepth(5);
    // Left glow
    lineGfx.lineStyle(8, 0x4ecca3, 0.15);
    lineGfx.beginPath();
    lineGfx.moveTo(width * 0.2, height * 0.275);
    lineGfx.lineTo(width * 0.8, height * 0.275);
    lineGfx.strokePath();
    // Core line
    lineGfx.lineStyle(3, 0x4ecca3, 0.6);
    lineGfx.beginPath();
    lineGfx.moveTo(width * 0.25, height * 0.275);
    lineGfx.lineTo(width * 0.75, height * 0.275);
    lineGfx.strokePath();
    // Center accent dot
    this.add.circle(width / 2, height * 0.275, 5, 0x4ecca3, 0.8).setDepth(5);

    // Menu buttons — larger and more modern
    const hasSave = SaveSystem.getAllSlots().some(s => s.exists);
    const buttons: { text: string; action: () => void; enabled: boolean; emoji: string }[] = [
      { text: TH.mainMenu.newGame, action: () => this.scene.start('PartySelectScene'), enabled: true, emoji: '⚔️' },
      { text: TH.mainMenu.continue, action: () => this.scene.start('SaveLoadScene'), enabled: hasSave, emoji: '📂' },
      { text: TH.mainMenu.teacherDashboard, action: () => this.scene.start('TeacherDashboard'), enabled: true, emoji: '📊' },
      { text: TH.mainMenu.settings, action: () => this.showSettings(), enabled: true, emoji: '⚙️' },
    ];

    const startY = height * 0.35;
    const spacing = 150;

    buttons.forEach((btn, i) => {
      const y = startY + i * spacing;
      const baseAlpha = btn.enabled ? 1 : 0.35;

      // Button background glow
      const glowBg = this.add.rectangle(width / 2, y, 520, 80, 0x4ecca3, 0.05)
        .setStrokeStyle(2, 0x4ecca3, 0.3).setDepth(10);
      const btnBg = this.add.rectangle(width / 2, y, 500, 70, 0x16213e, 0.95)
        .setStrokeStyle(2, 0x4ecca3, baseAlpha * 0.6).setDepth(11);

      // Emoji
      const emojiTxt = this.add.text(width / 2 - 200, y, btn.emoji, {
        fontSize: '36px',
      }).setOrigin(0.5).setDepth(12).setAlpha(baseAlpha);

      // Button text
      const txt = this.add.text(width / 2 + 20, y, btn.text, {
        fontSize: '42px',
        color: '#ffffff',
        fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(12).setAlpha(baseAlpha);

      if (btn.enabled) {
        btnBg.setInteractive({ useHandCursor: true });
        btnBg.on('pointerover', () => {
          this.tweens.add({ targets: [btnBg, txt, emojiTxt, glowBg], scaleX: 1.06, scaleY: 1.08, duration: 150, ease: 'Back.easeOut' });
          glowBg.setStrokeStyle(3, 0xf39c12, 0.8);
          btnBg.setStrokeStyle(3, 0xf39c12, 0.9);
          btnBg.fillColor = 0x1a2a4e;
        });
        btnBg.on('pointerout', () => {
          this.tweens.add({ targets: [btnBg, txt, emojiTxt, glowBg], scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeIn' });
          glowBg.setStrokeStyle(2, 0x4ecca3, 0.3);
          btnBg.setStrokeStyle(2, 0x4ecca3, 0.6);
          btnBg.fillColor = 0x16213e;
        });
        btnBg.on('pointerdown', () => {
          this.tweens.add({ targets: [btnBg, txt, emojiTxt], scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true });
          SoundManager.confirm();
          this.time.delayedCall(100, btn.action);
        });
      }
    });

    // Credits
    this.add.text(width / 2, height * 0.94, '© 2026 Quizventure — ผจญภัยเรียนรู้', {
      fontSize: '22px',
      color: '#555566',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setDepth(5);

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-T', () => {
      this.scene.start('TeacherDashboard');
    });
    this.input.keyboard?.on('keydown-F', () => {
      if (document.fullscreenElement) { document.exitFullscreen(); }
      else { document.documentElement.requestFullscreen(); }
    });
    this.input.keyboard?.on('keydown-ONE', () => {
      this.scene.start('PartySelectScene', { saveSlot: -1 });
    });
    this.input.keyboard?.on('keydown-TWO', () => {
      this.scene.start('SaveLoadScene', { mode: 'load' });
    });
  }

  private showSettings() {
    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setInteractive().setDepth(100);
    const panel = this.add.rectangle(width / 2, height / 2, 700, 500, 0x16213e, 0.96)
      .setStrokeStyle(3, 0x4ecca3).setDepth(101);

    const titleTxt = this.add.text(width / 2, height / 2 - 180, TH.settings.title, {
      fontSize: '40px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(102);

    // Controls info
    const controls = [
      '⌨️ ปุ่ม 1-6: เลือกตัวละคร',
      '⏎ Enter: ยืนยัน / ดำเนินการ',
      'Space: ดำเนินการ',
      '🖱️ เมาส์: คลิกเลือก',
      'F: เต็มจอ',
    ];
    controls.forEach((c, i) => {
      this.add.text(width / 2, height / 2 - 100 + i * 45, c, {
        fontSize: '24px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0.5).setDepth(102);
    });

    const closeBtn = this.add.text(width / 2, height / 2 + 170, TH.general.close, {
      fontSize: '30px', color: '#e74c3c', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(102);

    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#e74c3c'));
    closeBtn.on('pointerdown', () => {
      overlay.destroy(); panel.destroy(); titleTxt.destroy(); closeBtn.destroy();
      // Clean up control texts
      this.children.list.filter(c => c.type === 'Text' && c !== closeBtn && c !== titleTxt && c.depth === 102)
        .forEach(c => c.destroy());
    });
  }
}
