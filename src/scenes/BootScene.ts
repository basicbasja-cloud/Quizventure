// ============================================================
// 🎬 Boot Scene — Load assets & seed data
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { QuestionBank } from '../systems/QuestionBank';
import { generateClassTextures } from '../systems/ProceduralChars';
import { generateBattleBg } from '../systems/BattleBg';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load zone backgrounds
    this.load.image('bg_menu', 'assets/images/backgrounds/bg_menu.png');
    this.load.image('bg_adventure', 'assets/images/backgrounds/bg_adventure.png');
    this.load.image('bg_battle', 'assets/images/backgrounds/bg_battle.png');
    this.load.image('bg_forest', 'assets/images/backgrounds/colored_forest.png');
    this.load.image('bg_cave', 'assets/images/backgrounds/colored_talltrees.png');
    this.load.image('bg_desert', 'assets/images/backgrounds/colored_desert.png');
    this.load.image('bg_castle', 'assets/images/backgrounds/colored_castle.png');
    this.load.image('bg_hills', 'assets/images/backgrounds/uncolored_hills.png');
    this.load.image('bg_peaks', 'assets/images/backgrounds/uncolored_peaks.png');
    this.load.image('bg_pyramids', 'assets/images/backgrounds/uncolored_piramids.png');
    this.load.image('bg_plain', 'assets/images/backgrounds/uncolored_plain.png');
    this.load.image('bg_volcano', 'assets/images/backgrounds/uncolored_talltrees.png');

    // JRPG battle background (CC-BY ansimuz.com)
    this.load.image('bg_battle_jrpg', 'assets/images/backgrounds/bg_battle_jrpg.png');

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

    const loadText = this.add.text(width / 2, height / 2 - 60, TH.general.loading, {
      fontSize: '48px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    const progressText = this.add.text(width / 2, height / 2 + 10, TH.general.pleaseWait, {
      fontSize: '26px', color: '#aaaaaa', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(width / 2, height / 2 + 80, 500, 28, 0x333333);
    barBg.setStrokeStyle(2, 0x4ecca3, 0.3);
    const barFill = this.add.rectangle(width / 2 - 250, height / 2 + 80, 0, 22, 0x4ecca3).setOrigin(0, 0.5);

    const updateProgress = (pct: number) => { barFill.width = 500 * (pct / 100); };

    // Seed sample questions in background (don't block on it)
    QuestionBank.seedSampleData().then(() => updateProgress(40)).catch(() => updateProgress(40));
    updateProgress(20);

    // Generate procedural character textures
    try {
      generateClassTextures(this);
      generateBattleBg(this);
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
      { w:360, h:70, sfx:'_lg' },
      { w:280, h:60, sfx:'' },
      { w:180, h:50, sfx:'_sm' },
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
        const r = Math.min(14, sz.h * 0.2);
        g.fillStyle(cl.dc,1); g.fillRoundedRect(0,0,sz.w,sz.h,r);
        g.fillStyle(cl.c,1); g.fillRoundedRect(0,Math.ceil(sz.h*0.08),sz.w,sz.h-Math.ceil(sz.h*0.08),r);
        g.lineStyle(2,cl.dc); g.strokeRoundedRect(0,0,sz.w,sz.h,r);
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
      g.fillStyle(clr,1); g.fillRoundedRect(0,0,60,60,9);
      g.fillStyle(0xffffff,0.25); g.fillRoundedRect(5,5,50,24,6);
      g.lineStyle(3,0x555); g.strokeRoundedRect(2,2,56,56,9);
      g.generateTexture('dice_' + names[i], 60, 60); g.destroy();
    }
  }
}
