// ============================================================
// ⚔️ Battle Scene — Turn-Based Combat with Questions
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import type { Character } from '../models/Character';
import { addXp, createCharacter, getCharacterSkills } from '../models/Character';
import { ClassType, CLASS_DEFINITIONS, ClassStage } from '../models/CharacterClass';
import { SkillTarget, QuestionDifficulty } from '../models/Skill';
import type { SkillDefinition } from '../models/Skill';
import { BattleQuestionSystem } from '../systems/BattleQuestionSystem';
import { QuestionBank } from '../systems/QuestionBank';
import { SaveSystem } from '../systems/SaveSystem';
import { createNewSave } from '../models/PlayerState';
import type { QuestionData } from '../models/Question';
import { SoundManager } from '../systems/SoundManager';
import { VisualEffects } from '../systems/VisualEffects';
import {
  startIdleAnimation,
  playAttackAnimation,
  playEnemyAttackAnimation,
  playSkillAnimation,
  playHealAnimation,
  playDefendAnimation,
  playHitAnimation,
  playDeathAnimation,
  playBossPhaseAnimation,
} from '../systems/CharacterAnimations';

export interface BattleUnit {
  character: Character;
  isEnemy: boolean;
  isBoss: boolean;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  name: string;
  isAlive: boolean;
  defending: boolean;
  sprite: Phaser.GameObjects.Image;
}

// ⚡ Crit helper (Pokemon-style)
function calcCrit(unit: BattleUnit): boolean {
  return Math.random() < 0.0625 + unit.spd / 300;
}
const CRIT_MULT = 1.5;

interface BossPhase {
  hpThreshold: number;
  name: string;
  attackMultiplier: number;
}

export class BattleScene extends Phaser.Scene {
  private heroes: BattleUnit[] = [];
  private enemies: BattleUnit[] = [];
  private turnOrder: BattleUnit[] = [];
  private currentTurnIndex = 0;
  private isProcessing = false;
  private isBoss = false;
  private chapter = 0;
  private nodeIndex = 0;
  private saveSlot = 0;
  private zoneOrder: string[] = [];
  private turnIndicator!: Phaser.GameObjects.Text;
  private turnOrderCalculated = false;

  private party: Character[] = [];
  private battleLog: Phaser.GameObjects.Text[] = [];
  private logY = 370;
  private bossPhase = 0;
  private vfx!: VisualEffects;
  private bossPhases: BossPhase[] = [];
  private actionMenu!: Phaser.GameObjects.Container;
  private skillMenu!: Phaser.GameObjects.Container;
  private questionOverlay!: Phaser.GameObjects.Container;
  private hpBarContainer!: Phaser.GameObjects.Container;
  private currentUnit!: BattleUnit;

  constructor() {
    super({ key: 'BattleScene' });
  }

  async create(data: {
    party: Character[];
    isBoss?: boolean;
    chapter?: number;
    nodeIndex?: number;
    saveSlot?: number;
    zoneOrder?: string[];
  }) {
    const { width, height } = this.cameras.main;

    this.party = data.party;
    this.isBoss = data.isBoss ?? false;
    this.chapter = Math.floor((data.nodeIndex ?? 0) / 3);
    this.nodeIndex = data.nodeIndex ?? 0;
    this.saveSlot = data.saveSlot ?? 0;
    this.zoneOrder = data.zoneOrder ?? [];

    this.bossPhase = 0;
    this.battleLog = [];
    this.logY = 795;

    // Procedural battlefield background (now 1920x1080 native)
    this.add.image(width / 2, height / 2, 'bg_battlefield').setDepth(0);
    // Subtle dark overlay on battlefield only (above command window at y=680)
    this.add.rectangle(width / 2, 340, width, 680, 0x000000, 0.15).setDepth(1);

    // === FF-STYLE COMMAND WINDOW (bottom 330px) ===
    this.createCommandWindow();

    // Enemy health check
    if (this.isBoss) {
      const availableCount = await this.checkQuestionAvailability();
      if (availableCount < 2) {
        this.scene.start('AdventureScene', { party: this.party, saveSlot: this.saveSlot });
        return;
      }
    }

    // Create units
    this.createHeroUnits();
    this.createEnemyUnits();
    this.createBossPhases();
    this.createHpBars();

    // Battle title
    const title = this.isBoss ? TH.adventure.findBoss : TH.adventure.findEnemy;
    this.add.text(width / 2, 14, `⚔️ ${title}`, {
      fontSize: '30px', color: '#ff6600', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0.9).setDepth(30);

    // Turn indicator — now displayed inside command window message area
    this.turnIndicator = this.add.text(width / 2, 765, '', {
      fontSize: '22px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(30);

    // Create menus (hidden initially)
    this.actionMenu = this.add.container(0, 0).setVisible(false).setDepth(50);
    this.skillMenu = this.add.container(0, 0).setVisible(false).setDepth(50);
    this.questionOverlay = this.add.container(0, 0).setVisible(false).setDepth(100);

    // Calculate turn order ONCE — persists across rounds
    this.calculateTurnOrder();
    this.turnOrderCalculated = true;
    this.currentTurnIndex = 0;

    // Start battle
    this.addLog(`⚔️ การต่อสู้เริ่มต้น!`);
    this.startNextTurn();
  }

  /** FF-style command window at the bottom of the screen */
  private createCommandWindow() {
    const { width, height } = this.cameras.main;
    const panelY = 880;
    const panelH = 400;

    // Main dark panel
    this.add.rectangle(width / 2, panelY, width - 20, panelH, 0x0a0a2e, 0.96)
      .setStrokeStyle(4, 0x4ecca3, 0.5).setDepth(25);
    // Inner border
    this.add.rectangle(width / 2, panelY, width - 40, panelH - 12, 0x000000, 0)
      .setStrokeStyle(2, 0x4ecca3, 0.2).setDepth(25);
    // Top accent line
    this.add.rectangle(width / 2, panelY - panelH / 2 + 3, width - 40, 3, 0x4ecca3, 0.4).setDepth(26);
    // Divider between message area and status/commands
    this.add.rectangle(width / 2, 775, width - 40, 2, 0x4ecca3, 0.2).setDepth(26);
    // Vertical divider between party status and commands
    this.add.rectangle(640, 885, 2, 170, 0x4ecca3, 0.15).setDepth(26);
  }

  private createHeroUnits() {
    // FF-style: heroes on the RIGHT side of battlefield, facing left toward enemies
    // Positioned in the lower-right portion of the battlefield area (above command window)
    const total = this.party.length;
    this.heroes = this.party.map((char, i) => {
      const fromBack = total - 1 - i;
      // Row-based: front row closer to center, back row further right
      const x = 1450 + fromBack * 70;
      const y = 470 - fromBack * 80;
      const charKey = `char_${char.classType}`;
      const sprite = this.add.image(x, y, charKey).setScale(2.5);
      // Flip sprite to face left toward enemies
      sprite.setFlipX(true);
      sprite.setData('origScale', 2.5);
      sprite.setData('origTint', 0xffffff);
      sprite.setData('homeX', x);
      sprite.setData('homeY', y);
      sprite.setDepth(10 - i);
      startIdleAnimation(sprite);
      return {
        character: char,
        isEnemy: false,
        isBoss: false,
        hp: char.stats.hp,
        maxHp: char.stats.maxHp,
        mp: char.stats.mp,
        maxMp: char.stats.maxMp,
        atk: char.stats.atk,
        def: char.stats.def,
        spd: char.stats.spd,
        name: char.name,
        isAlive: true,
        defending: false,
        sprite,
      };
    });

    // Hero names shown in the command window status panel (left side of command window)
    this.heroes.forEach((h, i) => {
      const y = 810 + i * 45;
      // Name
      this.add.text(30, y, h.name, {
        fontSize: '20px', color: '#88ddff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5).setDepth(30);
      // Level
      this.add.text(200, y, `Lv${h.character.level}`, {
        fontSize: '16px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0, 0.5).setDepth(30);
    });
  }

  private createEnemyUnits() {
    const { width } = this.cameras.main;

    if (this.isBoss) {
      const bossNames = ['ราชาสลิมป์', 'ก็อบลินคิง', 'มังกรไฟ'];
      const bossName = bossNames[Math.min(Math.floor((this.nodeIndex ?? 0) / 4), 2)] || 'จอมมาร';
      const statMult = 1 + this.chapter * 0.85;
      const bossHp = Math.floor(400 * statMult);
      const bossAtk = Math.floor(30 * statMult);
      const bossDef = Math.floor(18 * statMult);
      // Boss in upper-left center, facing right toward heroes
      const sprite = this.add.image(500, 260, 'boss').setScale(4.0);
      sprite.setData('origScale', 4.0);
      sprite.setData('origTint', 0xffffff);
      sprite.setData('homeX', 500);
      sprite.setData('homeY', 260);
      sprite.setDepth(15);
      startIdleAnimation(sprite);
      this.enemies = [{
        character: createCharacter('boss', bossName, ClassType.Warrior, 3 + Math.floor((this.nodeIndex ?? 0) / 2)),
        isEnemy: true,
        isBoss: true,
        hp: bossHp,
        maxHp: bossHp,
        mp: 100,
        maxMp: 100,
        atk: bossAtk,
        def: bossDef,
        spd: 8,
        name: bossName,
        isAlive: true,
        defending: false,
        sprite,
      }];
    } else {
      const enemyPool: string[][] = [
        ['สลิมป์', 'สลิมป์พิษ', 'สลิมป์ยักษ์'],
        ['ก็อบลิน', 'ออร์ค', 'สเคเลตัน'],
        ['มังกรน้อย', 'เดม่อน', 'วิญญาณ'],
      ];
      const pool = enemyPool[Math.min(Math.floor((this.nodeIndex ?? 0) / 4), 2)] || enemyPool[0];
      const enemyCount = 2;
      // Enemies on the LEFT side, facing right toward heroes
      for (let i = 0; i < enemyCount; i++) {
        const x = 350 + i * 120;
        const y = 280 + i * 90;
        const name = pool[Math.floor(Math.random() * pool.length)];
        const statMult = 1 + this.chapter * 0.65;
        const hp = Math.floor(60 * statMult);
        const atk = Math.floor(11 * statMult);
        const def = Math.floor(6 * statMult);
        const sprite = this.add.image(x, y, 'enemy').setScale(2.5);
        sprite.setData('origScale', 2.5);
        sprite.setData('origTint', 0xffffff);
        sprite.setData('homeX', x);
        sprite.setData('homeY', y);
        sprite.setDepth(15 - i);
        startIdleAnimation(sprite);
        this.enemies.push({
          character: createCharacter(`enemy_${i}`, name, ClassType.Warrior, 1 + Math.floor((this.nodeIndex ?? 0) / 3)),
          isEnemy: true,
          isBoss: false,
          hp,
          maxHp: hp,
          mp: 20,
          maxMp: 20,
          atk: 8 + Math.floor((this.nodeIndex ?? 0) / 3) * 3,
          def: 4 + Math.floor((this.nodeIndex ?? 0) / 3) * 2,
          spd: 6 + Math.floor(Math.random() * 8),
          name,
          isAlive: true,
          defending: false,
          sprite,
        });
      }
    }

    // Enemy name labels - below sprites
    this.enemies.forEach(e => {
      this.add.text(e.sprite.x, e.sprite.y + 60, e.name, {
        fontSize: '26px', color: '#ff6644', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(25);
    });
  }

  private createBossPhases() {
    this.bossPhases = [
      { hpThreshold: 1.0, name: 'ปกติ', attackMultiplier: 1.0 },
      { hpThreshold: 0.7, name: 'โกรธ', attackMultiplier: 1.3 },
      { hpThreshold: 0.4, name: 'คลั่ง', attackMultiplier: 1.6 },
      { hpThreshold: 0.15, name: 'สุดยอด', attackMultiplier: 2.0 },
    ];
  }

  private createHpBars() {
    this.hpBarContainer = this.add.container(0, 0);

    // Heroes: HP/MP bars in command window status panel (left side)
    this.heroes.forEach((unit, i) => {
      const sx = 250;
      const sy = 810 + i * 45;
      // HP bar
      this.createUnitHpBar(unit, sx, sy, 160, 10);
      // MP bar below HP
      const mpFill = this.add.rectangle(sx - 80, sy + 16, 160, 6, 0x112233).setOrigin(0, 0.5).setDepth(30);
      const mpPct = unit.mp / unit.maxMp;
      const mpFillBar = this.add.rectangle(sx - 80, sy + 16, 160 * mpPct, 6, 0x4488ff).setOrigin(0, 0.5).setDepth(31);
      unit.sprite.setData('mpFill', mpFillBar);
      unit.sprite.setData('mpBg', mpFill);
      const mpText = this.add.text(sx, sy + 24, `MP ${unit.mp}/${unit.maxMp}`, {
        fontSize: '12px', color: '#88bbff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(32);
      unit.sprite.setData('mpText', mpText);
      // HP value text on right
      const hpVal = this.add.text(sx + 90, sy, `${unit.hp}/${unit.maxHp}`, {
        fontSize: '13px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5).setDepth(32);
      unit.sprite.setData('hpValText', hpVal);
    });

    // Enemies: HP bar below sprite
    this.enemies.forEach((unit) => {
      const x = unit.sprite.x;
      const y = unit.sprite.y + 45;
      this.createUnitHpBar(unit, x, y, 100, 9);
    });

    // Boss: classic FF boss bar at the top of the screen
    const boss = this.enemies.find(e => e.isBoss);
    if (boss) {
      const sprite = boss.sprite;
      const { width } = this.cameras.main;
      const oldFill = sprite.getData('hpFill');
      const oldBg = sprite.getData('hpBg');
      const oldText = sprite.getData('hpText');
      if (oldFill) oldFill.destroy();
      if (oldBg) oldBg.destroy();
      if (oldText) oldText.destroy();

      this.add.text(width / 2, 60, `👑 ${boss.name}`, {
        fontSize: '28px', color: '#ff4444', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(30);

      const barW = 500;
      const barH = 20;
      const barX = width / 2;
      const barY = 88;

      const hpBg = this.add.rectangle(barX, barY, barW, barH, 0x331111).setOrigin(0.5).setDepth(30);
      hpBg.setStrokeStyle(3, 0xff4444);

      const hpFill = this.add.rectangle(barX - barW / 2, barY, barW, barH, 0xcc2222).setOrigin(0, 0.5).setDepth(31);
      sprite.setData('hpFill', hpFill);
      sprite.setData('hpBg', hpBg);

      const hpText = this.add.text(barX, barY, `HP ${boss.hp}/${boss.maxHp}`, {
        fontSize: '16px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(32);
      sprite.setData('hpText', hpText);
    }
  }

  private createUnitHpBar(unit: BattleUnit, x: number, y: number, barWidth: number, barHeight: number) {
    // Store bar width for updates
    unit.sprite.setData('barW', barWidth);
    // HP background
    const hpBg = this.add.rectangle(x, y, barWidth, barHeight, 0x332222).setOrigin(0.5).setDepth(22);
    hpBg.setStrokeStyle(1, 0x553333);
    // HP fill
    const hpPct = unit.hp / unit.maxHp;
    const hpColor = hpPct > 0.5 ? 0x4ecca3 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c;
    const hpFill = this.add.rectangle(x - barWidth / 2, y, barWidth * hpPct, barHeight, hpColor).setOrigin(0, 0.5).setDepth(23);
    unit.sprite.setData('hpFill', hpFill);
    unit.sprite.setData('hpBg', hpBg);

    // HP text — larger
    const hpText = this.add.text(x, y + 14, `HP ${unit.hp}/${unit.maxHp}`, {
      fontSize: '14px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(24);
    unit.sprite.setData('hpText', hpText);

    // MP bar below HP (heroes only, not enemies) — larger
    if (!unit.isEnemy) {
      const mpY = y + 30;
      const mpBg = this.add.rectangle(x, mpY, barWidth, 7, 0x112233).setOrigin(0.5).setDepth(22);
      const mpPct = unit.mp / unit.maxMp;
      const mpFill = this.add.rectangle(x - barWidth / 2, mpY, barWidth * mpPct, 7, 0x4488ff).setOrigin(0, 0.5).setDepth(23);
      unit.sprite.setData('mpFill', mpFill);
      unit.sprite.setData('mpBg', mpBg);
      // MP text
      const mpText = this.add.text(x, mpY + 12, `MP ${unit.mp}/${unit.maxMp}`, {
        fontSize: '13px', color: '#88bbff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(24);
      unit.sprite.setData('mpText', mpText);
    }
  }

  private updateHpBar(unit: BattleUnit) {
    const barW = (unit.sprite.getData('barW') as number) || 80;
    const hpFill = unit.sprite.getData('hpFill') as Phaser.GameObjects.Rectangle;
    const hpText = unit.sprite.getData('hpText') as Phaser.GameObjects.Text;
    const hpValText = unit.sprite.getData('hpValText') as Phaser.GameObjects.Text;
    if (hpFill) {
      const pct = Math.max(0, unit.hp / unit.maxHp);
      hpFill.width = barW * pct;
      hpFill.fillColor = pct > 0.5 ? 0x4ecca3 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;
    }
    if (hpText) {
      hpText.setText(`HP ${Math.max(0, unit.hp)}/${unit.maxHp}`);
    }
    if (hpValText) {
      hpValText.setText(`${Math.max(0, unit.hp)}/${unit.maxHp}`);
    }
    const mpFill = unit.sprite.getData('mpFill') as Phaser.GameObjects.Rectangle;
    const mpText = unit.sprite.getData('mpText') as Phaser.GameObjects.Text;
    if (mpFill) {
      const mpPct = Math.max(0, unit.mp / unit.maxMp);
      mpFill.width = barW * mpPct;
    }
    if (mpText) {
      mpText.setText(`MP ${Math.max(0, unit.mp)}/${unit.maxMp}`);
    }
  }

  private calculateTurnOrder() {
    const allUnits = [...this.heroes.filter(h => h.isAlive), ...this.enemies.filter(e => e.isAlive)];
    this.turnOrder = allUnits.sort((a, b) => b.spd - a.spd);
  }

  private startNextTurn() {
    // Rebuild turn list — only alive units remain
    this.heroes = this.heroes.filter(h => h.isAlive || h.hp > 0);
    this.enemies = this.enemies.filter(e => e.isAlive || e.hp > 0);

    // Check win/lose
    if (this.enemies.length === 0) {
      this.victory();
      return;
    }
    if (this.heroes.length === 0) {
      this.defeat();
      return;
    }

    // Rebuild turn order removing dead units, preserving speed-based order
    const liveUnits = [...this.heroes.filter(h => h.isAlive), ...this.enemies.filter(e => e.isAlive)];
    this.turnOrder = liveUnits.sort((a, b) => b.spd - a.spd);

    // Wrap around when we reach the end of the turn order
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.addLog(`🔄 ${TH.battle.turn} รอบใหม่!`);
    }

    // Find the next alive unit starting from currentTurnIndex
    let found = false;
    let attempts = 0;
    while (!found && attempts < this.turnOrder.length) {
      const candidate = this.turnOrder[this.currentTurnIndex];
      if (candidate && candidate.isAlive && candidate.hp > 0) {
        found = true;
        this.currentUnit = candidate;

        // Update turn indicator
        this.turnIndicator.setText(`⚔️ ${TH.battle.turn} ${this.currentUnit.name}${this.currentUnit.isEnemy ? ' (ศัตรู)' : ''}`);

        if (candidate.isEnemy) {
          this.addLog(`👾 ${candidate.name} กำลังจะโจมตี`);
          this.time.delayedCall(1000, () => this.enemyTurn(candidate));
        } else {
          this.addLog(`🎮 ${TH.battle.playerTurn}: ${candidate.name}`);
          // Highlight active hero sprite
          this.highlightActiveHero(candidate);
          this.showActionMenu(candidate);
        }
      } else {
        this.currentTurnIndex++;
        if (this.currentTurnIndex >= this.turnOrder.length) {
          this.currentTurnIndex = 0;
        }
      }
      attempts++;
    }

    if (!found) {
      // Shouldn't happen, but fallback
      this.currentTurnIndex = 0;
      this.time.delayedCall(200, () => this.startNextTurn());
    }
  }

  /** Highlight the active hero - FF style: step left toward enemies */
  private highlightActiveHero(unit: BattleUnit) {
    this.heroes.forEach(h => {
      if (h.sprite) {
        h.sprite.setAlpha(0.4);
        const hx = h.sprite.getData('homeX');
        const hy = h.sprite.getData('homeY');
        if (hx) h.sprite.x = hx;
        if (hy) h.sprite.y = hy;
      }
    });
    if (unit.sprite) {
      unit.sprite.setAlpha(1);
      const origScale = unit.sprite.getData('origScale') || 2.5;
      // Step left toward enemies (FF-style)
      this.tweens.add({
        targets: unit.sprite,
        x: unit.sprite.x - 40,
        scaleX: origScale * 1.1,
        scaleY: origScale * 1.1,
        duration: 250,
        ease: 'Back.easeOut',
        yoyo: true,
        repeat: 1,
        hold: 200,
      });
    }
  }

  private showActionMenu(unit: BattleUnit) {
    this.actionMenu.removeAll(true);
    this.actionMenu.setVisible(true);

    const { width } = this.cameras.main;
    const isHealer = unit.character.classType === ClassType.Healer;

    // FF-style: 2×2 command grid on the RIGHT side of command window
    const actions: { text: string; action: () => void }[] = [
      { text: `⚔️ ${TH.battle.attack}`, action: () => this.doAttack(unit) },
      { text: `✨ ${TH.battle.specialSkill}`, action: () => this.showSkillMenu(unit) },
      { text: `💚 ${isHealer ? 'สกิล' : TH.battle.heal}`, action: () => this.tryHeal(unit) },
      { text: `🛡️ ${TH.battle.defend}`, action: () => this.doDefend(unit) },
    ];

    // The active character indicator at the top of the command area
    const activeLabel = this.add.text(680, 795, `▶ ${unit.name}`, {
      fontSize: '22px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5);
    this.actionMenu.add(activeLabel);

    actions.forEach((btn, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 800 + col * 420;
      const y = 850 + row * 80;

      const glow = this.add.rectangle(x, y, 380, 65, 0x4ecca3, 0.05)
        .setStrokeStyle(2, 0x4ecca3, 0.15);
      const bg = this.add.rectangle(x, y, 360, 56, 0x16213e, 0.95)
        .setStrokeStyle(2, 0x4ecca3, 0.4);
      const txt = this.add.text(x, y, btn.text, {
        fontSize: '24px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        this.tweens.add({ targets: [bg, txt, glow], scaleX: 1.04, scaleY: 1.06, duration: 100 });
        bg.setStrokeStyle(2, 0xf39c12, 0.9);
        glow.setStrokeStyle(2, 0xf39c12, 0.5);
      });
      bg.on('pointerout', () => {
        this.tweens.add({ targets: [bg, txt, glow], scaleX: 1, scaleY: 1, duration: 100 });
        bg.setStrokeStyle(2, 0x4ecca3, 0.4);
        glow.setStrokeStyle(2, 0x4ecca3, 0.15);
      });
      bg.on('pointerdown', () => {
        this.actionMenu.setVisible(false);
        btn.action();
      });

      this.actionMenu.add(glow);
      this.actionMenu.add(bg);
      this.actionMenu.add(txt);
    });
  }

  private async showSkillMenu(unit: BattleUnit) {
    this.skillMenu.removeAll(true);
    this.skillMenu.setVisible(true);

    const { width } = this.cameras.main;
    const skills = getCharacterSkills(unit.character);

    if (skills.length === 0) {
      this.addLog('❌ ไม่มีทักษะที่พร้อมใช้');
      this.endTurn(unit);
      return;
    }

    // Title in command window area
    const skillTitle = this.add.text(680, 795, `▶ ${unit.name} | เลือกทักษะ`, {
      fontSize: '22px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5);
    this.skillMenu.add(skillTitle);

    skills.forEach((skill, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 800 + col * 420;
      const y = 850 + row * 80;

      const questionLabel = `${TH.battle.questionRequired} ${skill.requiredQuestionCount} ${TH.battle.questions}`;
      const diffLabel = `(${BattleQuestionSystem.getDifficultyLabel(skill.questionDifficulty)})`;
      const mpOk = unit.mp >= skill.mpCost;

      const glow = this.add.rectangle(x, y, 380, 65, 0x4ecca3, 0.04)
        .setStrokeStyle(1, mpOk ? 0x4ecca3 : 0x663333, 0.2);
      const bg = this.add.rectangle(x, y, 360, 56, mpOk ? 0x1a3a2e : 0x331a1a, 0.95)
        .setStrokeStyle(2, mpOk ? 0x4ecca3 : 0x663333, 0.5);
      const txt = this.add.text(x, y - 8, `${(TH.skills as any)[skill.nameKey] || skill.nameKey}`, {
        fontSize: '18px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
      }).setOrigin(0.5);
      const info = this.add.text(x, y + 16, `${questionLabel} ${diffLabel} | MP:${skill.mpCost}`, {
        fontSize: '13px', color: mpOk ? '#aaffaa' : '#ff8888', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0.5);

      this.skillMenu.add(glow);
      this.skillMenu.add(bg);
      this.skillMenu.add(txt);
      this.skillMenu.add(info);

      if (mpOk) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
          this.tweens.add({ targets: [bg, txt, info, glow], scaleX: 1.04, scaleY: 1.06, duration: 100 });
        });
        bg.on('pointerout', () => {
          this.tweens.add({ targets: [bg, txt, info, glow], scaleX: 1, scaleY: 1, duration: 100 });
        });
        bg.on('pointerdown', async () => {
          this.skillMenu.setVisible(false);
          await this.useSkill(unit, skill);
        });
      }
    });

    // Cancel button in command window
    const cancelBg = this.add.rectangle(680, 980, 180, 46, 0x331a1a, 0.95)
      .setStrokeStyle(2, 0x663333, 0.5).setInteractive({ useHandCursor: true });
    const cancelTxt = this.add.text(680, 980, `← ${TH.general.cancel}`, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.skillMenu.add(cancelBg);
    this.skillMenu.add(cancelTxt);
    cancelBg.on('pointerdown', () => {
      this.skillMenu.setVisible(false);
      this.showActionMenu(unit);
    });
  }

  private async useSkill(unit: BattleUnit, skill: SkillDefinition) {
    this.isProcessing = true;
    unit.mp -= skill.mpCost;

    // Check if questions are available
    const availableCount = await BattleQuestionSystem.getAvailableQuestionCount(skill);
    if (availableCount < skill.requiredQuestionCount) {
      this.addLog(`❌ ${TH.battle.noQuestionsLeft}`);
      this.endTurn(unit);
      return;
    }

    // Draw questions
    const questions = await BattleQuestionSystem.drawQuestions(skill);
    if (questions.length < skill.requiredQuestionCount) {
      this.addLog(`❌ ${TH.battle.noQuestionsLeft}`);
      this.endTurn(unit);
      return;
    }

    // Show question panel (with skill cast visual)
    playSkillAnimation(unit.sprite);
    const answers = await this.showQuestionPanel(questions);

    // Process results
    const results = BattleQuestionSystem.processResults(questions, answers);
    const effectiveness = results.effectivenessMultiplier;

    if (results.allCorrect) {
      this.addLog(`✅ ${TH.battle.skillEffectFull}`);
    } else {
      this.addLog(`⚠️ ${TH.battle.skillEffectReduced} (${results.correctCount}/${results.totalQuestions} ถูก)`);
    }

    // Apply skill effect
    this.applySkillEffect(unit, skill, effectiveness);

    this.isProcessing = false;
    this.endTurn(unit);
  }

  private showQuestionPanel(questions: QuestionData[]): Promise<boolean[]> {
    return new Promise((resolve) => {
      const answers: boolean[] = [];
      let currentQ = 0;

      this.questionOverlay.removeAll(true);
      this.questionOverlay.setVisible(true);

      const { width, height } = this.cameras.main;

      const showQuestion = () => {
        this.questionOverlay.removeAll(true);

        const q = questions[currentQ];

        // Overlay background
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        this.questionOverlay.add(overlay);

        // Question panel — wider, taller, more modern
        const panel = this.add.rectangle(width / 2, height / 2 - 40, 750, 480, 0x1a1a3e, 0.97).setStrokeStyle(3, 0xf39c12);
        this.questionOverlay.add(panel);

        // Progress
        const progress = this.add.text(width / 2, height / 2 - 220,
          `${TH.battle.questionProgress} ${currentQ + 1}${TH.battle.of}${questions.length}`,
          { fontSize: '22px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2 },
        ).setOrigin(0.5);
        this.questionOverlay.add(progress);

        // Question text
        const questionText = this.add.text(width / 2, height / 2 - 150, q.prompt, {
          fontSize: '26px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
          wordWrap: { width: 680 }, align: 'center',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        this.questionOverlay.add(questionText);

        // Choices — larger
        q.choices.forEach((choice, i) => {
          const y = height / 2 - 50 + i * 70;
          const choiceBg = this.add.rectangle(width / 2, y, 620, 58, 0x0a0a2e, 0.9).setStrokeStyle(2, 0x4ecca3);
          choiceBg.setInteractive({ useHandCursor: true });
          this.questionOverlay.add(choiceBg);

          const choiceText = this.add.text(width / 2 - 290, y, `${i + 1}. ${choice}`, {
            fontSize: '20px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
            wordWrap: { width: 570 }, align: 'left',
          }).setOrigin(0, 0.5);
          this.questionOverlay.add(choiceText);

          choiceBg.on('pointerover', () => {
            choiceBg.setStrokeStyle(3, 0xf39c12);
            choiceBg.fillColor = 0x1a1a3e;
          });
          choiceBg.on('pointerout', () => choiceBg.setStrokeStyle(2, 0x4ecca3));
          choiceBg.on('pointerdown', () => {
            const isCorrect = i === q.correctIndex;
            answers.push(isCorrect);

            // Show correct/wrong feedback
            const feedback = this.add.text(width / 2, height / 2 - 210,
              isCorrect ? `✅ ${TH.battle.correct}` : `❌ ${TH.battle.wrong}`,
              {
                fontSize: '30px',
                color: isCorrect ? '#4ecca3' : '#e74c3c',
                fontFamily: 'Noto Sans Thai, Arial, sans-serif',
                fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 3,
              },
            ).setOrigin(0.5);
            this.questionOverlay.add(feedback);

            this.time.delayedCall(800, () => {
              currentQ++;
              if (currentQ < questions.length) {
                showQuestion();
              } else {
                this.questionOverlay.setVisible(false);
                resolve(answers);
              }
            });
          });
        });
      };

      showQuestion();
    });
  }

  private applySkillEffect(unit: BattleUnit, skill: SkillDefinition, effectiveness: number) {
    const power = skill.basePower * effectiveness;

    // Skill cast animation on caster
    playSkillAnimation(unit.sprite);

    switch (skill.targetType) {
      case SkillTarget.SingleEnemy:
      case SkillTarget.AllEnemies: {
        const targets = this.enemies.filter(e => e.isAlive);
        targets.forEach(target => {
          let damage = Math.max(1, Math.floor((unit.atk * power) - target.def * 0.5));
          let critLog = '';
          if (!unit.isEnemy && calcCrit(unit)) { damage = Math.floor(damage * CRIT_MULT); critLog = ' 💥คริติคอล!'; }

          // Hit animation on target
          playHitAnimation(target.sprite, () => {
            target.hp = Math.max(0, target.hp - damage);
            this.updateHpBar(target);
            const dmgText = effectiveness < 1 ? `${Math.floor(damage)} (ลดลง)` : `${damage}`;
            this.addLog(`⚡ ${unit.name} ใช้ทักษะ! สร้างดาเมจ ${dmgText} แก่ ${target.name}${critLog}`);

            if (target.hp <= 0) {
              playDeathAnimation(target.sprite);
              target.isAlive = false;
              this.addLog(`💀 ${target.name} ถูกกำจัด!`);
            }
          });
        });
        break;
      }
      case SkillTarget.Self: {
        if (skill.id === 'shieldBlock' || skill.id === 'goldenArmor' || skill.id === 'kingsShield') {
          unit.defending = true;
          playDefendAnimation(unit.sprite);
          this.addLog(`🛡️ ${unit.name} ใช้ ${(TH.skills as any)[skill.nameKey]} ป้องกันตัว`);
        } else if (skill.id === 'arcaneSurge' || skill.id === 'quickStep') {
          // Buff effects
          this.addLog(`✨ ${unit.name} ใช้ ${(TH.skills as any)[skill.nameKey]} เพิ่มพลัง`);
        }
        break;
      }
      case SkillTarget.SingleAlly: {
        const target = this.heroes.filter(h => h.isAlive && h !== unit).sort((a, b) => a.hp - b.hp)[0] || unit;
        if (skill.id === 'heal' || skill.id === 'panacea') {
          const heal = Math.floor(target.maxHp * power);
          target.hp = Math.min(target.maxHp, target.hp + heal);
          this.updateHpBar(target);
          playHealAnimation(target.sprite);
          this.addLog(`💚 ${unit.name} รักษา ${target.name} HP +${heal}`);
        }
        break;
      }
      case SkillTarget.AllAllies: {
        this.heroes.filter(h => h.isAlive).forEach(target => {
          if (skill.id === 'sacredBlessing' || skill.id === 'regen' || skill.id === 'sanctuary') {
            const heal = Math.floor(target.maxHp * power);
            target.hp = Math.min(target.maxHp, target.hp + heal);
            this.updateHpBar(target);
            playHealAnimation(target.sprite);
          }
        });
        this.addLog(`💚 ${unit.name} ใช้ ${(TH.skills as any)[skill.nameKey] || ''} รักษาทั้งทีม`);
        break;
      }
    }
  }

  private async doAttack(unit: BattleUnit) {
    const target = this.enemies.filter(e => e.isAlive).sort((a, b) => a.hp - b.hp)[0];
    if (!target) return;

    // Basic attack: draw 1 easy question matching this class
    const attackQuestions = await QuestionBank.getAvailableQuestions(
      unit.character.classType,
      QuestionDifficulty.Easy,
      '',
      1,
    );
    if (attackQuestions.length < 1) {
      this.addLog(`❌ ${TH.battle.noQuestionsLeft}`);
      this.endTurn(unit);
      return;
    }

    const answers = await this.showQuestionPanel(attackQuestions);
    const correct = answers[0];

    // Animate attack
    playAttackAnimation(unit.sprite, target.sprite, () => {
      const dmgMult = correct ? 1.0 : 0.4;
      let damage = Math.max(1, Math.floor(unit.atk * dmgMult - target.def * 0.3));
      let critLog = '';
      if (!unit.isEnemy && calcCrit(unit)) { damage = Math.floor(damage * CRIT_MULT); critLog = ' 💥คริติคอล!'; }

      if (correct) {
        SoundManager.correct();
      } else {
        SoundManager.wrong();
      }

      // Hit animation on target
      playHitAnimation(target.sprite, () => {
        target.hp = Math.max(0, target.hp - damage);
        this.updateHpBar(target);
        const log = correct
          ? `⚔️ ${unit.name} โจมตี ${target.name}! ${damage} ดาเมจ${critLog}`
          : `⚔️ ${unit.name} โจมตี ${target.name}! ${damage} ดาเมจ (ตอบผิด - ลดลง)${critLog}`;
        this.addLog(log);

        this.cameras.main.shake(100, 0.005);

        if (target.hp <= 0) {
          playDeathAnimation(target.sprite);
          target.isAlive = false;
          this.addLog(`💀 ${target.name} ถูกกำจัด!`);
        }

        this.endTurn(unit);
      });
    });
  }

  private doDefend(unit: BattleUnit) {
    unit.defending = true;
    playDefendAnimation(unit.sprite);
    this.addLog(`🛡️ ${unit.name} ป้องกันตัว!`);
    this.endTurn(unit);
  }

  private async tryHeal(unit: BattleUnit) {
    // Auto-target the ally with lowest HP percentage
    const targets = this.heroes.filter(h => h.isAlive && h !== unit).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const target = targets[0] || unit;
    const healAmt = Math.floor(target.maxHp * 0.3);
    target.hp = Math.min(target.maxHp, target.hp + healAmt);
    this.updateHpBar(target);
    playHealAnimation(target.sprite);
    const targetName = target === unit ? 'ตัวเอง' : target.name;
    this.addLog(`💚 ${unit.name} รักษา ${targetName} HP +${healAmt}`);
    this.endTurn(unit);
  }

  private async tryEscape(unit: BattleUnit) {
    const escapeChance = 0.4 + (unit.spd / 100);
    if (Math.random() < escapeChance && !this.isBoss) {
      this.addLog(`🏃 ${TH.battle.youEscape}`);
      this.scene.start('AdventureScene', { party: this.party, saveSlot: this.saveSlot });
    } else {
      this.addLog(`❌ ${TH.battle.escapeFailed}`);
      this.endTurn(unit);
    }
  }

  private async enemyTurn(unit: BattleUnit) {
    // Boss phase check
    if (unit.isBoss && this.enemies.length > 0) {
      this.checkBossPhase(unit);
    }

    // Pick a random hero target
    const target = this.heroes.filter(h => h.isAlive).sort(() => Math.random() - 0.5)[0];
    if (!target) return;

    // Get boss phase multiplier
    let bossMult = 1.0;
    if (unit.isBoss) {
      const phase = this.bossPhases[this.bossPhase];
      if (phase) bossMult = phase.attackMultiplier;
    }

    let damage = Math.max(1, Math.floor((unit.atk * bossMult) - (target.def * 0.3 * (target.defending ? 2 : 1))));
    let critLog = '';
    if (calcCrit(unit)) { damage = Math.floor(damage * CRIT_MULT); critLog = ' 💥คริติคอล!'; }

    // Animate enemy attack → hit on target
    playEnemyAttackAnimation(unit.sprite, target.sprite, () => {
      target.hp = Math.max(0, target.hp - damage);
      target.defending = false;
      this.updateHpBar(target);
      this.addLog(`👊 ${unit.name} โจมตี ${target.name}! ${damage} ดาเมจ${critLog}`);
      this.cameras.main.shake(100, 0.005);

      playHitAnimation(target.sprite, () => {
        if (target.hp <= 0) {
          playDeathAnimation(target.sprite);
          target.isAlive = false;
          this.addLog(`💀 ${target.name} ล้มลง!`);
        }
        this.endTurn(unit);
      });
    });
  }

  private checkBossPhase(unit: BattleUnit) {
    const hpPct = unit.hp / unit.maxHp;
    for (let i = this.bossPhases.length - 1; i >= 0; i--) {
      if (hpPct <= this.bossPhases[i].hpThreshold && this.bossPhase < i) {
        this.bossPhase = i;
        const phase = this.bossPhases[i];
        this.addLog(`⚠️ ${TH.battle.bossEnrage}! ${phase.name} — โจมตี x${phase.attackMultiplier}`);
        this.addLog(`📖 ตอบคำถามให้ถูกเพื่อทำดาเมจ!`);

        // Boss phase animation
        playBossPhaseAnimation(unit.sprite, phase.name);

        // Screen shake
        this.cameras.main.shake(300, 0.01);
        break;
      }
    }
  }

  private endTurn(unit: BattleUnit) {
    // Check if any hero died
    this.heroes = this.heroes.filter(h => {
      if (h.hp <= 0 && h.isAlive) {
        h.isAlive = false;
        playDeathAnimation(h.sprite);
        this.addLog(`💀 ${h.name} ล้มลง!`);
        return false;
      }
      return true;
    });

    this.enemies = this.enemies.filter(e => {
      if (e.hp <= 0 && e.isAlive) {
        e.isAlive = false;
        playDeathAnimation(e.sprite);
        this.addLog(`💀 ${e.name} ถูกกำจัด!`);
        return false;
      }
      return true;
    });

    this.currentTurnIndex++;
    // Reset active hero highlight
    this.heroes.forEach(h => {
      if (h.sprite) h.sprite.setAlpha(1);
    });
    this.time.delayedCall(500, () => this.startNextTurn());
  }

  private async victory() {
    SoundManager.levelUp();
    this.addLog(`🎉 ${TH.battle.victory}`);

    // Calculate rewards
    const xpReward = 30 + (this.nodeIndex ?? 0) * 10;

    this.addLog(`✨ ได้รับ EXP ${xpReward} ทุกตัว`);

    // Apply XP and check level ups
    for (const char of this.party) {
      const result = addXp(char, xpReward);
      if (result.leveledUp) {
        this.addLog(`⬆️ ${char.name} เลเวล ${char.level}!`);
      }
      if (result.evolved) {
        this.addLog(`🌟 ${char.name} ${TH.levelUp.evolvedTo} ${(TH.classes as any)[`${char.classType}Evolved`] || ''}!`);
      }
    }

    // Auto-save
    const saveData = createNewSave(this.party);
    saveData.id = this.saveSlot;

    saveData.currentChapter = Math.floor((this.nodeIndex ?? 0) / 3) + 1;
    saveData.currentNodeIndex = this.nodeIndex;
    saveData.zoneOrder = this.zoneOrder;
    SaveSystem.save(this.saveSlot, saveData);

    this.time.delayedCall(2500, () => {
      this.scene.start('AdventureScene', {
        party: this.party,
        saveSlot: this.saveSlot,
        nodeIndex: (this.nodeIndex ?? 0) + 1,
        zoneOrder: this.zoneOrder,
      });
    });
  }

  private defeat() {
    this.addLog(`💔 ${TH.battle.defeat}`);
    this.time.delayedCall(2000, () => {
      this.scene.start('MainMenuScene');
    });
  }

  private async checkQuestionAvailability(): Promise<number> {
    let total = 0;
    for (const hero of this.heroes) {
      const skills = getCharacterSkills(hero.character);
      for (const skill of skills) {
        total += await BattleQuestionSystem.getAvailableQuestionCount(skill);
      }
    }
    return total;
  }

  private addLog(text: string) {
    const { width } = this.cameras.main;
    // FF-style: message displayed in command window message area
    const msgY = 795;
    // Clear previous message
    this.battleLog.forEach(l => l.destroy());
    this.battleLog = [];
    const logEntry = this.add.text(width / 2, msgY, text, {
      fontSize: '19px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: width - 100 }, align: 'center',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(28);
    this.battleLog.push(logEntry);
    this.logY = 795;
  }
}
