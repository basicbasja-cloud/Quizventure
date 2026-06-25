// ============================================================
// 🎬 Boot Scene — Load assets & seed data
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { QuestionBank } from '../systems/QuestionBank';
import { generateClassTextures } from '../systems/ProceduralChars';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load Kenney background images
    this.load.image('bg_menu', 'assets/images/backgrounds/bg_menu.png');
    this.load.image('bg_adventure', 'assets/images/backgrounds/bg_adventure.png');
    this.load.image('bg_battle', 'assets/images/backgrounds/bg_battle.png');

    // Character textures are generated procedurally in create()

    // Load sound effects
    const sounds = [
      'swing','swing2','swing3','spell','magic','hit',
      'menu_click','menu_confirm','menu_cancel','correct','levelup',
      'enemy_roar','enemy_hit','coin','coin2','coin3',
    ];
    sounds.forEach(s => this.load.audio(s, 'assets/audio/'+s+'.wav'));
  }

  async create() {
    const { width, height } = this.cameras.main;

    this.cameras.main.setBackgroundColor('#1a1a2e');

    const loadText = this.add.text(width / 2, height / 2 - 40, TH.general.loading, {
      fontSize: '32px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);

    const progressText = this.add.text(width / 2, height / 2 + 10, TH.general.pleaseWait, {
      fontSize: '18px', color: '#aaaaaa', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(width / 2, height / 2 + 60, 300, 20, 0x333333);
    const barFill = this.add.rectangle(width / 2 - 150, height / 2 + 60, 0, 16, 0x4ecca3).setOrigin(0, 0.5);

    const updateProgress = (pct: number) => { barFill.width = 300 * (pct / 100); };

    // Seed sample questions in background (don't block on it)
    QuestionBank.seedSampleData().then(() => updateProgress(40)).catch(() => updateProgress(40));
    updateProgress(20);

    // Generate procedural character textures
    try {
      generateClassTextures(this);
    } catch (e) {
      console.error('ProceduralChars failed:', e);
    }
    updateProgress(60);

    // Generate UI buttons & dice
    this.genUI();
    this.genDice();
    updateProgress(80);

    // Transition to main menu after a moment
    this.time.delayedCall(400, () => {
      this.scene.start('MainMenuScene');
    });
  }

  private genUI() {
    const sizes = [
      { w:260, h:50, sfx:'_lg' },
      { w:200, h:44, sfx:'' },
      { w:130, h:36, sfx:'_sm' },
    ];
    const colors = [
      { n:'green', c:0x2ecc71, dc:0x27ae60 },
      { n:'red',   c:0xe74c3c, dc:0xc0392b },
      { n:'blue',  c:0x3498db, dc:0x2980b9 },
      { n:'gold',  c:0xf39c12, dc:0xe67e22 },
    ];
    for (const sz of sizes) {
      for (const cl of colors) {
        const g = this.make.graphics({ x:0, y:0 });
        const r = Math.min(8, sz.h * 0.18);
        g.fillStyle(cl.dc,1); g.fillRoundedRect(0,0,sz.w,sz.h,r);
        g.fillStyle(cl.c,1); g.fillRoundedRect(0,Math.ceil(sz.h*0.08),sz.w,sz.h-Math.ceil(sz.h*0.08),r);
        g.lineStyle(1,cl.dc); g.strokeRoundedRect(0,0,sz.w,sz.h,r);
        g.generateTexture('btn_' + cl.n + sz.sfx, sz.w, sz.h); g.destroy();
      }
    }
  }

  private genDice() {
    const names = ['d4','d6','d8','d10','d12','d20'];
    for (let i = 0; i < 6; i++) {
      const g = this.make.graphics({x:0,y:0});
      const s = 0xf0 - i * 8;
      const clr = (s << 16) | (s << 8) | s;
      g.fillStyle(clr,1); g.fillRoundedRect(0,0,40,40,6);
      g.fillStyle(0xffffff,0.25); g.fillRoundedRect(3,3,34,18,4);
      g.lineStyle(2,0x555); g.strokeRoundedRect(1,1,38,38,6);
      g.generateTexture('dice_' + names[i], 40, 40); g.destroy();
    }
  }
}
