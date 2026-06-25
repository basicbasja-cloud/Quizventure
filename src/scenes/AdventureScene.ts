// ============================================================
// 🗺️ Adventure Scene — Zone-Based Random Map Exploration
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
import { startIdleAnimation } from '../systems/CharacterAnimations';

// ── Zone definitions ──
type ZoneType = 'forest' | 'cave' | 'hell' | 'volcano' | 'castle' | 'city';
interface ZoneData { bg: string; label: string; color: number; }

const ZONES: Record<ZoneType, ZoneData> = {
  forest:  { bg: 'bg_forest',  label: 'ป่า',    color: 0x4ecca3 },
  cave:    { bg: 'bg_cave',    label: 'ถ้ำ',    color: 0x8888cc },
  hell:    { bg: 'bg_battle',  label: 'นรก',    color: 0xff4444 },
  volcano: { bg: 'bg_mountain',label: 'ภูเขาไฟ', color: 0xff8844 },
  castle:  { bg: 'bg_battle',  label: 'ปราสาท', color: 0xccaaff },
  city:    { bg: 'bg_menu',    label: 'เมือง',   color: 0x88ddff },
};

// ── Location names per zone ──
const LOCATION_NAMES: Record<ZoneType, string[]> = {
  forest:  ['ลานต้นโอ๊ก', 'ลำธารใส', 'ดงไผ่', 'ถ้ำไม้', 'เนินหญ้า', 'น้ำตก'],
  cave:    ['ปากถ้ำ', 'โถงคริสตัล', 'ทางแยก', 'ทะเลสาบใต้ดิน', 'สะพานหิน'],
  hell:    ['ทุ่งลาวา', 'หุบผาชะง่อน', 'ทะเลเพลิง', 'ด่านนรก', 'ปราสาทปีศาจ'],
  volcano: ['ปล่องภูเขาไฟ', 'ลานหินร้อน', 'ถ้ำแม็กม่า', 'ยอดเขา', 'ธารน้ำร้อน'],
  castle:  ['ประตูใหญ่', 'ลานกลาง', 'หอคอย', 'คลังสมบัติ', 'ห้องบัลลังก์'],
  city:    ['ตลาด', 'จัตุรัส', 'วัด', 'ห้องสมุด', 'ท่าเรือ'],
};

// ── Event tables per zone ──
interface ZoneEvent {
  type: EncounterType;
  label: string;
  description: string;
  dc?: number;
  statBonus?: string;
  hpDamage?: number;
}

const ZONE_EVENTS: Record<ZoneType, ZoneEvent[]> = {
  forest: [
    { type: EncounterType.Puzzle, label: 'ปีนต้นไม้', description: 'ปีนต้นไม้ใหญ่ข้ามเหว', dc: 10, statBonus: 'atk' },
    { type: EncounterType.Treasure, label: 'สมุนไพร', description: 'พบสมุนไพรหายาก' },
    { type: EncounterType.Enemy, label: 'หมาป่า', description: 'หมาป่าจู่โจม!' },
    { type: EncounterType.Rest, label: 'แค้มป์', description: 'พบที่พักกลางป่า' },
    { type: EncounterType.Trap, label: 'หลุมพราง', description: 'ตกลงหลุมพราง!', hpDamage: 15 },
    { type: EncounterType.Puzzle, label: 'สะพานเชือก', description: 'ต้องเดินบนสะพานเชือก', dc: 11, statBonus: 'spd' },
  ],
  cave: [
    { type: EncounterType.Puzzle, label: 'เขย่าผนัง', description: 'ต้องหาทางออก', dc: 12, statBonus: 'def' },
    { type: EncounterType.Treasure, label: 'คริสตัล', description: 'พบคริสตัลส่องแสง' },
    { type: EncounterType.Enemy, label: 'ค้างคาว', description: 'ค้างคาวยักษ์โจมตี!' },
    { type: EncounterType.Trap, label: 'หินถล่ม', description: 'หินถล่มใส่คุณ!', hpDamage: 20 },
    { type: EncounterType.Puzzle, label: 'รอยแยก', description: 'กระโดดข้ามรอยแยก', dc: 13, statBonus: 'atk' },
  ],
  hell: [
    { type: EncounterType.Puzzle, label: 'พิธีกรรม', description: 'หยุดพิธีกรรมอสูร', dc: 14, statBonus: 'wis' },
    { type: EncounterType.Treasure, label: 'อัญมณี', description: 'พบอัญมณีต้องห้าม' },
    { type: EncounterType.Enemy, label: 'อสูร', description: 'อสูรน้อยปรากฏตัว!' },
    { type: EncounterType.Trap, label: 'หลุมลาวา', description: 'ลาวาปะทุ!', hpDamage: 25 },
    { type: EncounterType.Puzzle, label: 'สะพานนรก', description: 'ข้ามสะพานกระดูก', dc: 15, statBonus: 'spd' },
  ],
  volcano: [
    { type: EncounterType.Puzzle, label: 'ปีนปล่อง', description: 'ปีนข้ามปล่องภูเขาไฟ', dc: 13, statBonus: 'atk' },
    { type: EncounterType.Treasure, label: 'หินร้อน', description: 'พบหินวิเศษร้อนแรง' },
    { type: EncounterType.Enemy, label: 'มังกร', description: 'มังกรน้อยพ่นไฟ!' },
    { type: EncounterType.Trap, label: 'ลาวาไหล', description: 'ลาวาไหลท่วมทาง!', hpDamage: 30 },
  ],
  castle: [
    { type: EncounterType.Puzzle, label: 'ยามเฝ้า', description: 'เลี่ยงยามเฝ้าประตู', dc: 14, statBonus: 'spd' },
    { type: EncounterType.Treasure, label: 'สมบัติ', description: 'พบห้องสมบัติ!' },
    { type: EncounterType.Enemy, label: 'อัศวิน', description: 'อัศวินผีสิงโจมตี!' },
    { type: EncounterType.Rest, label: 'ห้องพัก', description: 'พบห้องพักของคนใช้' },
  ],
  city: [
    { type: EncounterType.Puzzle, label: 'ปริศนา', description: 'แก้ปริศนาที่จัตุรัส', dc: 11, statBonus: 'wis' },
    { type: EncounterType.Treasure, label: 'ตลาด', description: 'พบของดีในตลาด' },
    { type: EncounterType.Rest, label: 'โรงแรม', description: 'พักผ่อนที่โรงแรม' },
    { type: EncounterType.Enemy, label: 'โจร', description: 'โจรปรากฏตัว!' },
  ],
};

// ── Map node path (fixed positions) ──
const PATH_NODES: { x: number; y: number }[] = [
  { x: 80,  y: 350 },  // 0: Start
  { x: 220, y: 280 },  // 1
  { x: 400, y: 250 },  // 2
  { x: 580, y: 280 },  // 3
  { x: 630, y: 180 },  // 4
  { x: 480, y: 120 },  // 5
  { x: 300, y: 100 },  // 6
  { x: 140, y: 80 },   // 7
  { x: 80,  y: 55 },   // 8: Pre-boss
];

// ── Zone pool per chapter ──
const CHAPTER_ZONES: ZoneType[][] = [
  ['forest', 'forest', 'cave', 'cave', 'city', 'forest', 'cave', 'forest', 'forest'],
  ['cave', 'cave', 'hell', 'volcano', 'volcano', 'cave', 'hell', 'volcano', 'cave'],
  ['hell', 'volcano', 'castle', 'hell', 'castle', 'volcano', 'castle', 'hell', 'volcano'],
];

interface MapNode {
  zone: ZoneType;
  x: number;
  y: number;
  locationName: string;
  event: ZoneEvent;
}

export class AdventureScene extends Phaser.Scene {
  private party: Character[] = [];
  private currentChapter = 0;
  private currentNodeIndex = 0;
  private mapNodes: MapNode[] = [];
  private saveSlot = 0;
  private infoText!: Phaser.GameObjects.Text;
  private diceResultText!: Phaser.GameObjects.Text;
  private rollingDice!: Phaser.GameObjects.Container;
  private rollingValue!: Phaser.GameObjects.Text;
  private isRolling = false;
  private partyIcon!: Phaser.GameObjects.Text;
  private isMoving = false;

  constructor() {
    super({ key: 'AdventureScene' });
  }

  async create(data?: { party?: Character[]; saveSlot?: number }) {
    const { width, height } = this.cameras.main;

    if (data?.party) { this.party = data.party; this.saveSlot = data.saveSlot ?? 0; }
    else if (data?.saveSlot !== undefined) {
      const saved = SaveSystem.load(data.saveSlot);
      if (saved) { this.party = saved.party; this.currentChapter = saved.currentChapter - 1; this.currentNodeIndex = saved.currentNodeIndex; this.saveSlot = data.saveSlot; }
    }

    SoundManager.init(this);

    // Generate or restore map
    this.generateMap();

    // Background for current node's zone
    const bgKey = ZONES[this.mapNodes[this.currentNodeIndex]?.zone || 'forest'].bg;
    this.add.image(width / 2, height / 2, bgKey)
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3).setDepth(1);

    // Draw map
    this.drawMap();

    // Party icon
    this.partyIcon = this.add.text(0, 0, '👥', { fontSize: '20px' }).setOrigin(0.5).setDepth(10);
    this.positionPartyIcon();

    // Event panel
    const panelY = 440;
    const panelH = 68;
    this.add.rectangle(width / 2, panelY, width - 20, panelH, 0x0a0a2e, 0.92)
      .setStrokeStyle(2, 0x4ecca3).setDepth(20);

    const node = this.mapNodes[this.currentNodeIndex];
    const zoneLabel = ZONES[node.zone].label;
    this.add.text(width / 2, panelY - 20, `📍 ${node.locationName} [${zoneLabel}]`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);

    this.infoText = this.add.text(width / 2, panelY + 2, node.event.description, {
      fontSize: '11px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: width - 60 }, align: 'center',
    }).setOrigin(0.5).setDepth(21);

    this.diceResultText = this.add.text(width / 2, panelY + 18, '', {
      fontSize: '12px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setDepth(21);

    this.createActionButtons(node.event, panelY);

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

    this.createPartyBar();
  }

  private generateMap() {
    this.mapNodes = [];
    const zones = CHAPTER_ZONES[this.currentChapter] || CHAPTER_ZONES[0];
    PATH_NODES.forEach((pos, i) => {
      const zone = zones[i];
      const names = LOCATION_NAMES[zone];
      const events = ZONE_EVENTS[zone];
      const locationName = names[Math.floor(Math.random() * names.length)];
      const event = events[Math.floor(Math.random() * events.length)];
      this.mapNodes.push({ zone, x: pos.x, y: pos.y, locationName, event });
    });
  }

  private drawMap() {
    const lineGfx = this.add.graphics().setDepth(5);
    for (let i = 0; i < PATH_NODES.length - 1; i++) {
      const a = PATH_NODES[i];
      const b = PATH_NODES[i + 1];
      const done = i < this.currentNodeIndex;
      lineGfx.lineStyle(done ? 3 : 1, done ? 0x4ecca3 : 0x444466, done ? 0.8 : 0.4);
      lineGfx.lineBetween(a.x, a.y, b.x, b.y);
    }

    this.mapNodes.forEach((node, i) => {
      const isCurrent = i === this.currentNodeIndex;
      const isPast = i < this.currentNodeIndex;
      const z = ZONES[node.zone];
      const color = isCurrent ? 0xf39c12 : z.color;
      const radius = isCurrent ? 11 : 8;

      const circle = this.add.circle(node.x, node.y, radius, color, isCurrent ? 1 : 0.6)
        .setStrokeStyle(isCurrent ? 3 : 1, isCurrent ? 0xffffff : 0x445566).setDepth(6);

      if (isCurrent) {
        this.tweens.add({ targets: circle, scaleX: 1.3, scaleY: 1.3, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }

      // Zone-colored location name
      const colorStr = '#' + z.color.toString(16).padStart(6, '0');
      const isTop = node.y < 150;
      this.add.text(node.x, node.y + (isTop ? -18 : 16), node.locationName, {
        fontSize: isCurrent ? '10px' : '8px',
        color: isPast ? '#88cc88' : colorStr,
        fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7);

      // Zone emoji
      const emojis: Record<ZoneType, string> = { forest: '🌲', cave: '🪨', hell: '🔥', volcano: '🌋', castle: '🏰', city: '🏛️' };
      this.add.text(node.x, node.y - (isTop ? 16 : -14), emojis[node.zone], {
        fontSize: '9px',
      }).setOrigin(0.5).setDepth(7);

      if (isPast) {
        this.add.text(node.x, node.y, '✓', { fontSize: '9px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(7);
      }
    });
  }

  private positionPartyIcon() {
    const node = this.mapNodes[this.currentNodeIndex];
    if (node) { this.partyIcon.setPosition(node.x, node.y - 28); }
  }

  private animatePartyMove(toIndex: number, onComplete: () => void) {
    if (this.isMoving) return;
    this.isMoving = true;
    const target = this.mapNodes[toIndex];
    if (!target) { onComplete(); return; }

    // Slide party icon along path
    this.tweens.add({
      targets: this.partyIcon,
      x: target.x,
      y: target.y - 28,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
        onComplete();
      },
    });
  }

  private createActionButtons(event: ZoneEvent, panelY: number) {
    const { width } = this.cameras.main;
    const buttons: { text: string; action: () => void }[] = [];

    switch (event.type) {
      case EncounterType.Empty:
        buttons.push({ text: TH.adventure.continue, action: () => this.advanceToNext() });
        break;
      case EncounterType.Puzzle:
        if (event.dc) buttons.push({ text: `🎲 d20 (DC ${event.dc})`, action: () => this.doDiceCheck(event) });
        break;
      case EncounterType.Treasure:
        buttons.push({ text: 'เปิด', action: () => this.doOpenChest() });
        break;
      case EncounterType.Trap:
        buttons.push({ text: 'เดินต่อ', action: () => this.doTrapDamage(event) });
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
      bg.on('pointerover', () => bg.setScale(0.95));
      bg.on('pointerout', () => bg.setScale(0.9));
      bg.on('pointerdown', () => { bg.setScale(0.85); btn.action(); });
    });
  }

  private async doDiceCheck(event: ZoneEvent) {
    if (this.isRolling) return;
    this.isRolling = true;
    const dc = event.dc || 10;
    const statKey = (event.statBonus || 'atk') as keyof typeof this.party[0]['stats'];
    const bestChar = [...this.party].sort((a, b) => b.stats[statKey] - a.stats[statKey])[0];
    const bonus = Math.floor((bestChar?.stats[statKey] || 10) / 4);
    this.diceResultText.setText('');
    this.rollingDice.setVisible(true);
    const result = DiceSystem.skillCheck(bonus, dc);
    let tickCount = 0;
    SoundManager.diceRoll();
    const spin = () => {
      tickCount++;
      this.rollingValue.setText(String(Math.floor(Math.random() * 20) + 1));
      if (tickCount < 12) { this.time.delayedCall(30 + (tickCount / 12) * 120, spin); }
      else {
        this.rollingValue.setText(String(result.total));
        this.tweens.add({ targets: this.rollingValue, scaleX: 1.5, scaleY: 1.5, duration: 120, yoyo: true });
        this.time.delayedCall(600, () => {
          this.rollingDice.setVisible(false);
          this.diceResultText.setText(DiceSystem.getResultText(result));
          if (result.isSuccess) { this.infoText.setText('✅ ' + DiceSystem.getResultText(result)); }
          else { this.infoText.setText('❌ ' + DiceSystem.getResultText(result)); this.party.forEach(c => c.stats.hp = Math.max(1, c.stats.hp - 10)); }
          this.isRolling = false;
          this.time.delayedCall(1500, () => this.advanceToNext());
        });
      }
    };
    spin();
  }

  private doOpenChest() {
    this.party.forEach(c => c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + Math.floor(c.stats.maxHp * 0.2)));
    this.infoText.setText('✨ พบของวิเศษ! ทีมฟื้นฟู HP 20%');
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doTrapDamage(event: ZoneEvent) {
    const dmg = event.hpDamage || 20;
    this.party.forEach(c => c.stats.hp = Math.max(1, c.stats.hp - dmg));
    this.infoText.setText(`💥 ถูกกับดัก! เสีย HP ${dmg}`);
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doRest() {
    this.party.forEach(c => { c.stats.hp = c.stats.maxHp; c.stats.mp = c.stats.maxMp; });
    this.infoText.setText('💤 พักผ่อนเต็มที่! HP/MP เต็ม');
    this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private startBattle(isBoss: boolean) {
    this.scene.start('BattleScene', { party: this.party, isBoss, chapter: this.currentChapter, nodeIndex: this.currentNodeIndex, saveSlot: this.saveSlot });
  }

  private advanceToNext() {
    const nextIndex = this.currentNodeIndex + 1;
    if (nextIndex >= this.mapNodes.length) {
      this.currentChapter++;
      if (this.currentChapter >= CHAPTER_ZONES.length) { this.scene.start('MainMenuScene'); return; }
      this.currentNodeIndex = 0;
      this.scene.restart({ party: this.party, saveSlot: this.saveSlot });
      return;
    }

    // Animate party moving to next node
    this.animatePartyMove(nextIndex, () => {
      this.currentNodeIndex = nextIndex;
      this.scene.restart({ party: this.party, saveSlot: this.saveSlot });
    });
  }

  private createPartyBar() {
    const { width } = this.cameras.main;
    const barY = 530;
    this.add.rectangle(width / 2, barY + 10, width, 40, 0x0a0a2e, 0.85).setDepth(19);
    this.add.text(5, barY, `ด่าน ${this.currentChapter + 1}`, { fontSize: '10px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0, 0.5).setDepth(20);

    this.party.forEach((char, i) => {
      const x = 70 + i * 180;
      const hpPct = char.stats.hp / char.stats.maxHp;
      this.add.text(x, barY, char.name, { fontSize: '10px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(20);
      this.add.rectangle(x + 40, barY, 60, 5, 0x333333).setOrigin(0, 0.5).setDepth(20);
      this.add.rectangle(x + 40, barY, 60 * hpPct, 5, hpPct > 0.5 ? 0x4ecca3 : hpPct > 0.25 ? 0xf39c12 : 0xe74c3c).setOrigin(0, 0.5).setDepth(21);
      this.add.text(x + 100, barY, `Lv.${char.level}`, { fontSize: '9px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0, 0.5).setDepth(20);
    });

    this.add.text(width - 5, barY, `${this.currentNodeIndex + 1}/${this.mapNodes.length}`, { fontSize: '10px', color: '#555555', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(1, 0.5).setDepth(20);
  }
}
