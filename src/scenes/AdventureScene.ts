// ============================================================
// 🗺️ Adventure Scene — 10 Zones, Random Map Exploration
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { DiceSystem, DiceType, EncounterType } from '../systems/DiceSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';
import type { Character } from '../models/Character';
import { createNewSave } from '../models/PlayerState';

type ZoneType = 'forest' | 'cave' | 'desert' | 'castle' | 'hills' | 'peaks' | 'pyramids' | 'plain' | 'beach' | 'volcano';

interface ZoneData { bg: string; label: string; color: number; emoji: string; }
interface ZoneEvent { type: EncounterType; label: string; description: string; dc?: number; statBonus?: string; hpDamage?: number; }

const ZONES: Record<ZoneType, ZoneData> = {
  forest:   { bg: 'bg_forest',   label: 'ป่า',      color: 0x4ecca3, emoji: '🌲' },
  cave:     { bg: 'bg_cave',     label: 'ถ้ำ',      color: 0x8888cc, emoji: '🪨' },
  desert:   { bg: 'bg_desert',   label: 'ทะเลทราย', color: 0xddcc88, emoji: '🏜️' },
  castle:   { bg: 'bg_castle',   label: 'ปราสาท',   color: 0xccaaff, emoji: '🏰' },
  hills:    { bg: 'bg_hills',    label: 'เนินเขา',   color: 0x66cc66, emoji: '⛰️' },
  peaks:    { bg: 'bg_peaks',    label: 'ยอดเขา',   color: 0xccccff, emoji: '🏔️' },
  pyramids: { bg: 'bg_pyramids', label: 'พีระมิด',  color: 0xddaa44, emoji: '🔺' },
  plain:    { bg: 'bg_plain',    label: 'ที่ราบ',   color: 0xaadd88, emoji: '🌾' },
  beach:    { bg: 'bg_adventure',label: 'ชายหาด',   color: 0x88ddff, emoji: '🏖️' },
  volcano:  { bg: 'bg_volcano',  label: 'ภูเขาไฟ',  color: 0xff6644, emoji: '🌋' },
};

const LOCATION_NAMES: Record<ZoneType, string[]> = {
  forest:   ['ลานต้นโอ๊ก', 'ลำธารใส', 'ดงไผ่', 'ถ้ำไม้', 'เนินหญ้า', 'น้ำตก'],
  cave:     ['ปากถ้ำ', 'โถงคริสตัล', 'ทางแยก', 'ทะเลสาบใต้ดิน', 'สะพานหิน'],
  desert:   ['โอเอซิส', 'เนินทรายใหญ่', 'ซากโบราณ', 'ทะเลทราย', 'คาราวาน'],
  castle:   ['ประตูใหญ่', 'ลานกลาง', 'หอคอย', 'คลังสมบัติ', 'ห้องบัลลังก์'],
  hills:    ['เนินลาด', 'ทุ่งดอกไม้', 'ไร่องุ่น', 'ศาลาไม้', 'ลำธารบนเขา'],
  peaks:    ['ยอดเขาน้ำแข็ง', 'ทะเลหมอก', 'ถ้ำน้ำแข็ง', 'ช่องเขา', 'ลานหิมะ'],
  pyramids: ['มหาพีระมิด', 'สฟิงซ์', 'สุสาน', 'ห้องลับ', 'ทางเดินใต้ดิน'],
  plain:    ['ทุ่งกว้าง', 'หมู่บ้าน', 'ไร่ข้าว', 'บึงน้ำ', 'สะพานไม้'],
  beach:    ['หาดทรายขาว', 'แนวปะการัง', 'อ่าวลับ', 'แหลมหิน', 'ดงปาล์ม'],
  volcano:  ['ปล่องภูเขาไฟ', 'ลาวาไหล', 'ถ้ำแม็กม่า', 'ธารน้ำร้อน', 'เถ้าถ่าน'],
};

const ZONE_EVENTS: Record<ZoneType, ZoneEvent[]> = {
  forest: [
    { type: EncounterType.Puzzle, label: 'ปีนต้นไม้', description: 'ปีนต้นไม้ใหญ่ข้ามเหว', dc: 10, statBonus: 'atk' },
    { type: EncounterType.Treasure, label: 'สมุนไพร', description: 'พบสมุนไพรหายาก' },
    { type: EncounterType.Enemy, label: 'หมาป่า', description: 'หมาป่าจู่โจม!' },
    { type: EncounterType.Rest, label: 'แค้มป์', description: 'พบที่พักกลางป่า' },
    { type: EncounterType.Trap, label: 'หลุมพราง', description: 'ตกลงหลุมพราง!', hpDamage: 15 },
  ],
  cave: [
    { type: EncounterType.Puzzle, label: 'เขย่าผนัง', description: 'ต้องหาทางออก', dc: 12, statBonus: 'def' },
    { type: EncounterType.Treasure, label: 'คริสตัล', description: 'พบคริสตัลส่องแสง' },
    { type: EncounterType.Enemy, label: 'ค้างคาว', description: 'ค้างคาวยักษ์โจมตี!' },
    { type: EncounterType.Trap, label: 'หินถล่ม', description: 'หินถล่มใส่คุณ!', hpDamage: 20 },
  ],
  desert: [
    { type: EncounterType.Puzzle, label: 'หาเส้นทาง', description: 'หาทางในพายุทราย', dc: 13, statBonus: 'wis' },
    { type: EncounterType.Treasure, label: 'สุสาน', description: 'พบสุสานโบราณ' },
    { type: EncounterType.Enemy, label: 'แมงป่อง', description: 'แมงป่องยักษ์!' },
    { type: EncounterType.Rest, label: 'โอเอซิส', description: 'พักที่โอเอซิส' },
    { type: EncounterType.Trap, label: 'ทรายดูด', description: 'ทรายดูด!', hpDamage: 20 },
  ],
  castle: [
    { type: EncounterType.Puzzle, label: 'ยามเฝ้า', description: 'เลี่ยงยามเฝ้าประตู', dc: 14, statBonus: 'spd' },
    { type: EncounterType.Treasure, label: 'สมบัติ', description: 'พบห้องสมบัติ!' },
    { type: EncounterType.Enemy, label: 'อัศวิน', description: 'อัศวินผีสิงโจมตี!' },
    { type: EncounterType.Rest, label: 'ห้องพัก', description: 'พบห้องพักของคนใช้' },
  ],
  hills: [
    { type: EncounterType.Puzzle, label: 'ข้ามเขา', description: 'ข้ามเนินสูงชัน', dc: 11, statBonus: 'atk' },
    { type: EncounterType.Treasure, label: 'ดอกไม้', description: 'พบดอกไม้วิเศษ' },
    { type: EncounterType.Enemy, label: 'อีแร้ง', description: 'อีแร้งยักษ์!' },
    { type: EncounterType.Rest, label: 'ศาลา', description: 'พักที่ศาลาริมทาง' },
  ],
  peaks: [
    { type: EncounterType.Puzzle, label: 'ปีนน้ำแข็ง', description: 'ปีนหน้าผาน้ำแข็ง', dc: 15, statBonus: 'atk' },
    { type: EncounterType.Treasure, label: 'เพชร', description: 'พบเพชรบนยอดเขา' },
    { type: EncounterType.Enemy, label: 'ยักษ์', description: 'ยักษ์ภูเขา!' },
    { type: EncounterType.Trap, label: 'หิมะถล่ม', description: 'หิมะถล่ม!', hpDamage: 25 },
  ],
  pyramids: [
    { type: EncounterType.Puzzle, label: 'ปริศนา', description: 'แก้ปริศนาห้องฝังศพ', dc: 14, statBonus: 'wis' },
    { type: EncounterType.Treasure, label: 'สุสาน', description: 'พบขุมทรัพย์ฟาโรห์' },
    { type: EncounterType.Enemy, label: 'มัมมี่', description: 'มัมมี่คืนชีพ!' },
    { type: EncounterType.Trap, label: 'กับดัก', description: 'กับดักโบราณ!', hpDamage: 25 },
  ],
  plain: [
    { type: EncounterType.Puzzle, label: 'ข้ามบึง', description: 'หาทางข้ามบึง', dc: 10, statBonus: 'spd' },
    { type: EncounterType.Treasure, label: 'พืชหายาก', description: 'พบพืชพันธุ์หายาก' },
    { type: EncounterType.Enemy, label: 'กระทิง', description: 'กระทิงป่า!' },
    { type: EncounterType.Rest, label: 'หมู่บ้าน', description: 'พักในหมู่บ้าน' },
  ],
  beach: [
    { type: EncounterType.Puzzle, label: 'ข้ามโขดหิน', description: 'เดินบนโขดหิน', dc: 11, statBonus: 'spd' },
    { type: EncounterType.Treasure, label: 'ไข่มุก', description: 'พบไข่มุกในเปลือกหอย' },
    { type: EncounterType.Enemy, label: 'ปลาหมึก', description: 'ปลาหมึกยักษ์!' },
    { type: EncounterType.Rest, label: 'ชายหาด', description: 'พักผ่อนริมทะเล' },
  ],
  volcano: [
    { type: EncounterType.Puzzle, label: 'ปีนปล่อง', description: 'ปีนข้ามปล่องภูเขาไฟ', dc: 14, statBonus: 'atk' },
    { type: EncounterType.Treasure, label: 'หินร้อน', description: 'พบหินวิเศษร้อนแรง' },
    { type: EncounterType.Enemy, label: 'มังกร', description: 'มังกรพ่นไฟ!' },
    { type: EncounterType.Trap, label: 'ลาวา', description: 'ลาวาปะทุ!', hpDamage: 30 },
  ],
};

const PATH_NODES: { x: number; y: number }[] = [
  { x: 80,  y: 350 }, { x: 220, y: 280 }, { x: 400, y: 250 }, { x: 580, y: 280 },
  { x: 630, y: 180 }, { x: 480, y: 120 }, { x: 300, y: 100 }, { x: 140, y: 80 },
  { x: 80,  y: 55 },
];

// 3 chapters × 9 nodes = 27 zone assignments
const CHAPTER_ZONES: ZoneType[][] = [
  ['forest','forest','cave','beach','cave','hills','forest','plain','forest'],
  ['desert','desert','pyramids','desert','hills','peaks','cave','volcano','peaks'],
  ['volcano','castle','castle','volcano','peaks','volcano','peaks','volcano','volcano'],
];

interface MapNode { zone: ZoneType; x: number; y: number; locationName: string; event: ZoneEvent; }

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

  constructor() { super({ key: 'AdventureScene' }); }

  async create(data?: { party?: Character[]; saveSlot?: number }) {
    const { width, height } = this.cameras.main;
    if (data?.party) { this.party = data.party; this.saveSlot = data.saveSlot ?? 0; }
    else if (data?.saveSlot !== undefined) {
      const saved = SaveSystem.load(data.saveSlot);
      if (saved) { this.party = saved.party; this.currentChapter = saved.currentChapter - 1; this.currentNodeIndex = saved.currentNodeIndex; this.saveSlot = data.saveSlot; }
    }
    SoundManager.init(this);
    this.generateMap();

    // Background for current node's zone
    const zone = this.mapNodes[this.currentNodeIndex]?.zone || 'forest';
    const bgKey = ZONES[zone].bg;
    this.add.image(width / 2, height / 2, bgKey)
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);

    // Tinted overlay for uncolored backgrounds
    const isUncolored = ['hills','peaks','pyramids','plain'].includes(zone);
    if (isUncolored) {
      const z = ZONES[zone];
      const r = (z.color >> 16) & 0xff, g = (z.color >> 8) & 0xff, b = z.color & 0xff;
      this.add.rectangle(width / 2, height / 2, width, height, (r << 16) | (g << 8) | b, 0.2).setDepth(0);
    }
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3).setDepth(1);

    this.drawMap();
    this.partyIcon = this.add.text(0, 0, '👥', { fontSize: '20px' }).setOrigin(0.5).setDepth(10);
    this.positionPartyIcon();

    const panelY = 440;
    this.add.rectangle(width / 2, panelY, width - 20, 68, 0x0a0a2e, 0.92).setStrokeStyle(2, 0x4ecca3).setDepth(20);
    const node = this.mapNodes[this.currentNodeIndex];
    this.add.text(width / 2, panelY - 20, `${ZONES[node.zone].emoji} ${node.locationName} [${ZONES[node.zone].label}]`, {
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

    this.rollingDice = this.add.container(width / 2, height / 2).setVisible(false).setDepth(100);
    this.rollingDice.add([
      this.add.rectangle(0, 0, 200, 200, 0x000000, 0.9).setStrokeStyle(3, 0xf39c12),
      this.add.image(0, -15, 'dice_d20').setScale(3),
      this.add.text(0, -70, '🎲 กำลังทอย...', { fontSize: '18px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5),
      this.rollingValue = this.add.text(0, 45, '20', { fontSize: '36px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold' }).setOrigin(0.5),
    ]);
    this.createPartyBar();
  }

  private generateMap() {
    this.mapNodes = [];
    const zones = CHAPTER_ZONES[this.currentChapter] || CHAPTER_ZONES[0];
    PATH_NODES.forEach((pos, i) => {
      const zone = zones[i];
      const locs = LOCATION_NAMES[zone];
      const evts = ZONE_EVENTS[zone];
      this.mapNodes.push({ zone, x: pos.x, y: pos.y, locationName: locs[Math.floor(Math.random() * locs.length)], event: evts[Math.floor(Math.random() * evts.length)] });
    });
  }

  private drawMap() {
    const gfx = this.add.graphics().setDepth(5);
    for (let i = 0; i < PATH_NODES.length - 1; i++) {
      const a = PATH_NODES[i], b = PATH_NODES[i + 1];
      const done = i < this.currentNodeIndex;
      gfx.lineStyle(done ? 3 : 1, done ? 0x4ecca3 : 0x444466, done ? 0.8 : 0.4);
      gfx.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.mapNodes.forEach((node, i) => {
      const curr = i === this.currentNodeIndex;
      const past = i < this.currentNodeIndex;
      const z = ZONES[node.zone];
      const r = past ? 7 : curr ? 11 : 8;
      const c = this.add.circle(node.x, node.y, r, curr ? 0xf39c12 : z.color, curr ? 1 : 0.6)
        .setStrokeStyle(curr ? 3 : 1, curr ? 0xffffff : 0x445566).setDepth(6);
      if (curr) this.tweens.add({ targets: c, scaleX: 1.3, scaleY: 1.3, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const top = node.y < 150;
      this.add.text(node.x, node.y + (top ? -18 : 16), node.locationName, {
        fontSize: curr ? '10px' : '8px', color: past ? '#88cc88' : '#' + z.color.toString(16).padStart(6, '0'),
        fontFamily: 'Noto Sans Thai, Arial, sans-serif', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7);
      this.add.text(node.x, node.y - (top ? 16 : -14), z.emoji, { fontSize: '9px' }).setOrigin(0.5).setDepth(7);
      if (past) this.add.text(node.x, node.y, '✓', { fontSize: '9px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(7);
    });
  }

  private positionPartyIcon() {
    const n = this.mapNodes[this.currentNodeIndex];
    if (n) this.partyIcon.setPosition(n.x, n.y - 28);
  }

  private animatePartyMove(to: number, cb: () => void) {
    if (this.isMoving) return;
    this.isMoving = true;
    const t = this.mapNodes[to];
    if (!t) { cb(); return; }
    this.tweens.add({ targets: this.partyIcon, x: t.x, y: t.y - 28, duration: 400, ease: 'Power2', onComplete: () => { this.isMoving = false; cb(); } });
  }

  private createActionButtons(event: ZoneEvent, panelY: number) {
    const { width } = this.cameras.main;
    const btns: { text: string; action: () => void }[] = [];
    switch (event.type) {
      case EncounterType.Empty: btns.push({ text: TH.adventure.continue, action: () => this.advanceToNext() }); break;
      case EncounterType.Puzzle: if (event.dc) btns.push({ text: `🎲 d20 (DC ${event.dc})`, action: () => this.doDiceCheck(event) }); break;
      case EncounterType.Treasure: btns.push({ text: 'เปิด', action: () => this.doOpenChest() }); break;
      case EncounterType.Trap: btns.push({ text: 'เดินต่อ', action: () => this.doTrapDamage(event) }); break;
      case EncounterType.Rest: btns.push({ text: TH.adventure.rest, action: () => this.doRest() }); break;
      case EncounterType.Enemy: btns.push({ text: '⚔️ สู้', action: () => this.startBattle(false) }); break;
      case EncounterType.Boss: btns.push({ text: '⚔️ บอส', action: () => this.startBattle(true) }); break;
    }
    btns.forEach((b, i) => {
      const x = width / 2 - 50 + i * 110;
      const bg = this.add.image(x, panelY + 30, i === 1 ? 'btn_gold_sm' : 'btn_blue_sm').setInteractive({ useHandCursor: true }).setScale(0.9).setDepth(22);
      this.add.text(x, panelY + 30, b.text, { fontSize: '11px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5).setDepth(23);
      bg.on('pointerover', () => bg.setScale(0.95));
      bg.on('pointerout', () => bg.setScale(0.9));
      bg.on('pointerdown', () => { bg.setScale(0.85); b.action(); });
    });
  }

  private async doDiceCheck(event: ZoneEvent) {
    if (this.isRolling) return; this.isRolling = true;
    const dc = event.dc || 10;
    const sk = (event.statBonus || 'atk') as keyof typeof this.party[0]['stats'];
    const bc = [...this.party].sort((a, b) => b.stats[sk] - a.stats[sk])[0];
    const bonus = Math.floor((bc?.stats[sk] || 10) / 4);
    this.diceResultText.setText(''); this.rollingDice.setVisible(true);
    const result = DiceSystem.skillCheck(bonus, dc);
    let t = 0; SoundManager.diceRoll();
    const spin = () => { t++; this.rollingValue.setText(String(Math.floor(Math.random() * 20) + 1)); if (t < 12) this.time.delayedCall(30 + (t / 12) * 120, spin); else { this.rollingValue.setText(String(result.total)); this.tweens.add({ targets: this.rollingValue, scaleX: 1.5, scaleY: 1.5, duration: 120, yoyo: true }); this.time.delayedCall(600, () => { this.rollingDice.setVisible(false); this.diceResultText.setText(DiceSystem.getResultText(result)); if (result.isSuccess) this.infoText.setText('✅ ' + DiceSystem.getResultText(result)); else { this.infoText.setText('❌ ' + DiceSystem.getResultText(result)); this.party.forEach(c => c.stats.hp = Math.max(1, c.stats.hp - 10)); } this.isRolling = false; this.time.delayedCall(1500, () => this.advanceToNext()); }); } };
    spin();
  }

  private doOpenChest() { this.party.forEach(c => c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + Math.floor(c.stats.maxHp * 0.2))); this.infoText.setText('✨ ฟื้นฟู HP 20%'); this.diceResultText.setText(''); this.time.delayedCall(1500, () => this.advanceToNext()); }
  private doTrapDamage(event: ZoneEvent) { const d = event.hpDamage || 20; this.party.forEach(c => c.stats.hp = Math.max(1, c.stats.hp - d)); this.infoText.setText(`💥 เสีย HP ${d}`); this.diceResultText.setText(''); this.time.delayedCall(1500, () => this.advanceToNext()); }
  private doRest() { this.party.forEach(c => { c.stats.hp = c.stats.maxHp; c.stats.mp = c.stats.maxMp; }); this.infoText.setText('💤 ฟื้นฟูเต็มที่'); this.diceResultText.setText(''); this.time.delayedCall(1500, () => this.advanceToNext()); }
  private startBattle(isBoss: boolean) { this.scene.start('BattleScene', { party: this.party, isBoss, chapter: this.currentChapter, nodeIndex: this.currentNodeIndex, saveSlot: this.saveSlot }); }

  private advanceToNext() {
    const next = this.currentNodeIndex + 1;
    if (next >= this.mapNodes.length) {
      this.currentChapter++;
      if (this.currentChapter >= CHAPTER_ZONES.length) { this.scene.start('MainMenuScene'); return; }
      this.currentNodeIndex = 0; this.scene.restart({ party: this.party, saveSlot: this.saveSlot }); return;
    }
    this.animatePartyMove(next, () => { this.currentNodeIndex = next; this.scene.restart({ party: this.party, saveSlot: this.saveSlot }); });
  }

  private createPartyBar() {
    const { width } = this.cameras.main;
    const y = 530;
    this.add.rectangle(width / 2, y + 10, width, 40, 0x0a0a2e, 0.85).setDepth(19);
    this.add.text(5, y, `ด่าน ${this.currentChapter + 1}`, { fontSize: '10px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0, 0.5).setDepth(20);
    this.party.forEach((c, i) => {
      const x = 70 + i * 180; const p = c.stats.hp / c.stats.maxHp;
      this.add.text(x, y, c.name, { fontSize: '10px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(20);
      this.add.rectangle(x + 40, y, 60, 5, 0x333333).setOrigin(0, 0.5).setDepth(20);
      this.add.rectangle(x + 40, y, 60 * p, 5, p > 0.5 ? 0x4ecca3 : p > 0.25 ? 0xf39c12 : 0xe74c3c).setOrigin(0, 0.5).setDepth(21);
      this.add.text(x + 100, y, `Lv.${c.level}`, { fontSize: '9px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0, 0.5).setDepth(20);
    });
    this.add.text(width - 5, y, `${this.currentNodeIndex + 1}/${this.mapNodes.length}`, { fontSize: '10px', color: '#555555', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(1, 0.5).setDepth(20);
  }
}
