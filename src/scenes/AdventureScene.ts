// ============================================================
// 🗺️ Adventure Scene — 14-Node Winding Path, 4 Zones per Run
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { DiceSystem, EncounterType } from '../systems/DiceSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';
import type { Character } from '../models/Character';

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

// 14 nodes winding in an S-curve across the full canvas
const PATH_NODES: { x: number; y: number }[] = [
  { x: 80,  y: 370 }, // N0  start bottom-left
  { x: 220, y: 330 }, // N1
  { x: 400, y: 370 }, // N2
  { x: 580, y: 330 }, // N3
  { x: 740, y: 370 }, // N4  bottom-right
  { x: 740, y: 280 }, // N5  turn up right side
  { x: 580, y: 240 }, // N6
  { x: 400, y: 280 }, // N7
  { x: 220, y: 240 }, // N8
  { x: 80,  y: 280 }, // N9  left side
  { x: 80,  y: 190 }, // N10 turn up left side
  { x: 220, y: 150 }, // N11
  { x: 400, y: 190 }, // N12
  { x: 580, y: 150 }, // N13 final boss
];

interface MapNode { zone: ZoneType; x: number; y: number; locationName: string; event: ZoneEvent; }

const ALL_ZONE_TYPES: ZoneType[] = ['forest','cave','desert','castle','hills','peaks','pyramids','plain','beach','volcano'];

function pickRandomZones(count: number): ZoneType[] {
  const shuffled = [...ALL_ZONE_TYPES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export class AdventureScene extends Phaser.Scene {
  private party: Character[] = [];
  private currentNodeIndex = 0;
  private mapNodes: MapNode[] = [];
  private zoneOrder: ZoneType[] = [];
  private saveSlot = 0;
  private infoText!: Phaser.GameObjects.Text;
  private diceResultText!: Phaser.GameObjects.Text;
  private rollingDice!: Phaser.GameObjects.Container;
  private rollingValue!: Phaser.GameObjects.Text;
  private isRolling = false;
  private partyIcon!: Phaser.GameObjects.Text;
  private isMoving = false;

  constructor() { super({ key: 'AdventureScene' }); }

  async create(data?: { party?: Character[]; saveSlot?: number; nodeIndex?: number; zoneOrder?: ZoneType[] }) {
    const { width, height } = this.cameras.main;
    if (data?.party) {
      this.party = data.party;
      this.saveSlot = data.saveSlot ?? 0;
      this.currentNodeIndex = data.nodeIndex ?? 0;
      this.zoneOrder = data.zoneOrder ?? pickRandomZones(4);
    } else if (data?.saveSlot !== undefined) {
      const saved = SaveSystem.load(data.saveSlot);
      if (saved) {
        this.party = saved.party;
        this.currentNodeIndex = saved.currentNodeIndex ?? 0;
        this.zoneOrder = (saved.zoneOrder as ZoneType[]) ?? pickRandomZones(4);
        this.saveSlot = data.saveSlot;
      }
    }
    if (this.zoneOrder.length === 0) this.zoneOrder = pickRandomZones(4);
    SoundManager.init(this);
    this.generateMap();

    // Background for current node's zone
    const zone = this.mapNodes[this.currentNodeIndex]?.zone || this.zoneOrder[0] || 'forest';
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

    // Home button (top-right corner)
    const homeBtn = this.add.text(width - 10, 8, '🏠', { fontSize: '22px', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(50);
    homeBtn.on('pointerover', () => homeBtn.setScale(1.2));
    homeBtn.on('pointerout', () => homeBtn.setScale(1));
    homeBtn.on('pointerdown', () => {
      SoundManager.confirm();
      this.scene.start('MainMenuScene');
    });

    this.drawMap();
    this.partyIcon = this.add.text(0, 0, '👥', { fontSize: '18px' }).setOrigin(0.5).setDepth(10);
    this.positionPartyIcon();

    // Bottom UI: Info Panel
    this.createInfoPanel();

    // Dice overlay
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
    // 4 zones → segment sizes: 4, 4, 3, 3 (last one ends with boss)
    const segments = [
      { start: 0,  end: 3,  isBoss: false },
      { start: 4,  end: 7,  isBoss: false },
      { start: 8,  end: 10, isBoss: false },
      { start: 11, end: 12, isBoss: false },
    ];
    PATH_NODES.forEach((pos, i) => {
      // Determine which segment this node belongs to
      let segIdx = 3;
      for (let s = 0; s < segments.length; s++) {
        if (i >= segments[s].start && i <= segments[s].end) { segIdx = s; break; }
      }
      const zone = this.zoneOrder[segIdx] || this.zoneOrder[0];
      const locs = LOCATION_NAMES[zone];
      const evts = ZONE_EVENTS[zone];
      // Last node is always boss
      const isBoss = i === PATH_NODES.length - 1;
      const evt = isBoss
        ? { type: EncounterType.Boss, label: 'บอส', description: `จอมโจรแห่ง${ZONES[zone].label}ปรากฏตัว!` }
        : evts[Math.floor(Math.random() * evts.length)];
      this.mapNodes.push({ zone, x: pos.x, y: pos.y, locationName: locs[Math.floor(Math.random() * locs.length)], event: evt });
    });
  }

  private createInfoPanel() {
    const { width } = this.cameras.main;
    const panelY = 410;
    // Panel background
    this.add.rectangle(width / 2, panelY, width - 16, 48, 0x0a0a2e, 0.92).setStrokeStyle(2, 0x4ecca3).setDepth(20);
    const node = this.mapNodes[this.currentNodeIndex];
    // Zone name row
    this.add.text(width / 2, panelY - 14, `${ZONES[node.zone].emoji} ${node.locationName} [${ZONES[node.zone].label}]`, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);
    // Event description
    this.infoText = this.add.text(width / 2, panelY + 4, node.event.description, {
      fontSize: '11px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      wordWrap: { width: width - 60 }, align: 'center',
    }).setOrigin(0.5).setDepth(21);
    // Dice result
    this.diceResultText = this.add.text(width / 2, panelY + 20, '', {
      fontSize: '12px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setDepth(21);
    // Action buttons below panel
    this.createActionButtons(node.event);
  }

  private drawMap() {
    const gfx = this.add.graphics().setDepth(5);
    // Draw path lines
    for (let i = 0; i < PATH_NODES.length - 1; i++) {
      const a = PATH_NODES[i], b = PATH_NODES[i + 1];
      const done = i < this.currentNodeIndex;
      gfx.lineStyle(done ? 3 : 1.5, done ? 0x4ecca3 : 0x555577, done ? 0.8 : 0.5);
      gfx.lineBetween(a.x, a.y, b.x, b.y);
    }
    // Draw zone labels along the right edge
    const zoneLabels: Record<string, { x: number; y: number; zone: ZoneType; done: boolean }> = {};
    const segments = [{ s: 0, e: 3 }, { s: 4, e: 7 }, { s: 8, e: 10 }, { s: 11, e: 13 }];
    segments.forEach((seg, si) => {
      const mid = Math.floor((seg.s + seg.e) / 2);
      const n = this.mapNodes[mid];
      if (n) {
        const allDone = this.currentNodeIndex > seg.e;
        zoneLabels[this.zoneOrder[si]] = { x: 770, y: n.y, zone: n.zone, done: allDone };
      }
    });
    Object.values(zoneLabels).forEach(zl => {
      const z = ZONES[zl.zone];
      this.add.text(zl.x, zl.y, zl.done ? '✅' : z.emoji + ' ' + z.label, {
        fontSize: '11px', color: zl.done ? '#88cc88' : '#' + z.color.toString(16).padStart(6, '0'),
        fontFamily: 'Noto Sans Thai, Arial, sans-serif', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 0.5).setDepth(7);
    });
    // Draw nodes
    this.mapNodes.forEach((node, i) => {
      const curr = i === this.currentNodeIndex;
      const past = i < this.currentNodeIndex;
      const z = ZONES[node.zone];
      const r = past ? 7 : curr ? 12 : 9;
      const c = this.add.circle(node.x, node.y, r, curr ? 0xf39c12 : z.color, curr ? 1 : 0.65)
        .setStrokeStyle(curr ? 3 : 1, curr ? 0xffffff : 0x445566).setDepth(6);
      if (curr) this.tweens.add({ targets: c, scaleX: 1.3, scaleY: 1.3, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // Label position: alternate above/below based on node index to avoid overlap
      const labelAbove = i % 3 === 0 || i === 13; // certain nodes get labels above
      const textColor = past ? '#88cc88' : '#' + z.color.toString(16).padStart(6, '0');
      // Location name
      this.add.text(node.x, node.y + (labelAbove ? -20 : 18), node.locationName, {
        fontSize: '9px', color: textColor,
        fontFamily: 'Noto Sans Thai, Arial, sans-serif', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7);
      // Zone emoji
      this.add.text(node.x, node.y + (labelAbove ? 18 : -20), z.emoji, {
        fontSize: '10px', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7);
      // Checkmark for completed
      if (past) this.add.text(node.x, node.y, '✓', {
        fontSize: '11px', color: '#ffffff', fontFamily: 'Arial', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7);
    });
  }

  private positionPartyIcon() {
    const n = this.mapNodes[this.currentNodeIndex];
    if (n) this.partyIcon.setPosition(n.x, n.y - 22);
  }

  private animatePartyMove(to: number, cb: () => void) {
    if (this.isMoving) return;
    this.isMoving = true;
    const t = this.mapNodes[to];
    if (!t) { cb(); return; }
    this.tweens.add({
      targets: this.partyIcon, x: t.x, y: t.y - 22, duration: 400, ease: 'Power2',
      onComplete: () => { this.isMoving = false; cb(); },
    });
  }

  private createActionButtons(event: ZoneEvent) {
    const { width } = this.cameras.main;
    const btnY = 478;
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
      const x = width / 2 - 50 + i * 115;
      const bg = this.add.image(x, btnY, i === 1 ? 'btn_gold_sm' : 'btn_blue_sm')
        .setInteractive({ useHandCursor: true }).setScale(0.9).setDepth(22);
      this.add.text(x, btnY, b.text, {
        fontSize: '12px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0.5).setDepth(23);
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
    const spin = () => {
      t++; this.rollingValue.setText(String(Math.floor(Math.random() * 20) + 1));
      if (t < 12) this.time.delayedCall(30 + (t / 12) * 120, spin);
      else {
        this.rollingValue.setText(String(result.total));
        this.tweens.add({ targets: this.rollingValue, scaleX: 1.5, scaleY: 1.5, duration: 120, yoyo: true });
        this.time.delayedCall(600, () => {
          this.rollingDice.setVisible(false);
          this.diceResultText.setText(DiceSystem.getResultText(result));
          if (result.isSuccess) this.infoText.setText('✅ ' + DiceSystem.getResultText(result));
          else {
            this.infoText.setText('❌ ' + DiceSystem.getResultText(result));
            this.party.forEach(c => c.stats.hp = Math.max(1, c.stats.hp - 10));
          }
          this.isRolling = false;
          this.time.delayedCall(1500, () => this.advanceToNext());
        });
      }
    };
    spin();
  }

  private doOpenChest() {
    this.party.forEach(c => c.stats.hp = Math.min(c.stats.maxHp, c.stats.hp + Math.floor(c.stats.maxHp * 0.2)));
    this.infoText.setText('✨ ฟื้นฟู HP 20%'); this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doTrapDamage(event: ZoneEvent) {
    const d = event.hpDamage || 20;
    this.party.forEach(c => c.stats.hp = Math.max(1, c.stats.hp - d));
    this.infoText.setText(`💥 เสีย HP ${d}`); this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private doRest() {
    this.party.forEach(c => { c.stats.hp = c.stats.maxHp; c.stats.mp = c.stats.maxMp; });
    this.infoText.setText('💤 ฟื้นฟูเต็มที่'); this.diceResultText.setText('');
    this.time.delayedCall(1500, () => this.advanceToNext());
  }

  private startBattle(isBoss: boolean) {
    this.scene.start('BattleScene', {
      party: this.party, isBoss, chapter: 0,
      nodeIndex: this.currentNodeIndex, saveSlot: this.saveSlot,
      zoneOrder: this.zoneOrder,
    });
  }

  private advanceToNext() {
    const next = this.currentNodeIndex + 1;
    if (next >= this.mapNodes.length) {
      // Game complete!
      this.scene.start('MainMenuScene');
      return;
    }
    this.animatePartyMove(next, () => {
      this.currentNodeIndex = next;
      this.scene.restart({ party: this.party, saveSlot: this.saveSlot, nodeIndex: next, zoneOrder: this.zoneOrder });
    });
  }

  private createPartyBar() {
    const { width } = this.cameras.main;
    const y = 535;
    // Bar background
    this.add.rectangle(width / 2, y + 5, width, 35, 0x0a0a2e, 0.85).setDepth(19);
    // Zone progress on left
    const zoneLabel = this.zoneOrder.map((z, zi) => {
      const segEnd = [3, 7, 10, 13][zi];
      const done = this.currentNodeIndex > segEnd;
      return done ? '✅' : ZONES[z].emoji;
    }).join(' ');
    this.add.text(4, y + 5, zoneLabel, { fontSize: '12px' }).setOrigin(0, 0.5).setDepth(20);
    // Party members
    this.party.forEach((c, i) => {
      const x = 160 + i * 155;
      const p = c.stats.hp / c.stats.maxHp;
      // Name
      this.add.text(x, y + 5, c.name, {
        fontSize: '10px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setDepth(20);
      // HP bar
      this.add.rectangle(x + 55, y + 5, 70, 6, 0x333333).setOrigin(0, 0.5).setDepth(20);
      this.add.rectangle(x + 55, y + 5, 70 * p, 6, p > 0.5 ? 0x4ecca3 : p > 0.25 ? 0xf39c12 : 0xe74c3c)
        .setOrigin(0, 0.5).setDepth(21);
      // Level
      this.add.text(x + 130, y + 5, `Lv${c.level}`, {
        fontSize: '10px', color: '#f39c12', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      }).setOrigin(0, 0.5).setDepth(20);
    });
    // Progress
    this.add.text(width - 4, y + 5, `${this.currentNodeIndex + 1}/${this.mapNodes.length}`, {
      fontSize: '11px', color: '#555555', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(1, 0.5).setDepth(20);
  }
}
