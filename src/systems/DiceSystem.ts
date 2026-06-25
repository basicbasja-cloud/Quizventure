// ============================================================
// 🎲 D&D Dice System
// ============================================================

export enum DiceType {
  D4 = 4,
  D6 = 6,
  D8 = 8,
  D10 = 10,
  D12 = 12,
  D20 = 20,
}

export interface DiceRollResult {
  diceType: DiceType;
  rolls: number[];       // Individual die rolls
  total: number;         // Sum of rolls
  bonus: number;         // Stat bonus
  grandTotal: number;    // total + bonus
  isSuccess: boolean;
  dc: number;            // Difficulty Class
}

export class DiceSystem {
  /** Roll a single die */
  static rollDie(type: DiceType): number {
    return Math.floor(Math.random() * type) + 1;
  }

  /** Roll multiple dice of the same type */
  static rollDice(type: DiceType, count: number = 1): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.rollDie(type));
    }
    return results;
  }

  /** Make a D&D skill check: d20 + bonus vs DC */
  static skillCheck(bonus: number, dc: number): DiceRollResult {
    const rolls = this.rollDice(DiceType.D20, 1);
    const total = rolls[0];
    const grandTotal = total + bonus;
    return {
      diceType: DiceType.D20,
      rolls,
      total,
      bonus,
      grandTotal,
      isSuccess: grandTotal >= dc,
      dc,
    };
  }

  /** Get a narrative description (Thai) of a roll result */
  static getResultText(result: DiceRollResult): string {
    if (result.isSuccess) {
      return `คุณโยนได้ ${result.total} + โบนัส ${result.bonus} = ${result.grandTotal} ✅ สำเร็จ! (DC ${result.dc})`;
    } else {
      return `คุณโยนได้ ${result.total} + โบนัส ${result.bonus} = ${result.grandTotal} ❌ ล้มเหลว... (DC ${result.dc})`;
    }
  }

  /** Get random encounter description (Thai) */
  static getEncounterText(type: EncounterType, value?: number): string {
    switch (type) {
      case EncounterType.Treasure:
        return `คุณพบสมบัติ! รับทอง ${value ?? 50} เหรียญ`;
      case EncounterType.Trap:
        return `กับดัก! คุณเสีย HP ${value ?? 20}`;
      case EncounterType.Rest:
        return 'คุณพักผ่อน ฟื้นฟู HP และ MP ทั้งหมด';
      case EncounterType.Enemy:
        return 'ศัตรูปรากฏตัว!';
      case EncounterType.Boss:
        return '⚠️ บอสปรากฏตัว! จงเตรียมพร้อม!';
      case EncounterType.Puzzle:
        return 'คุณพบปริศนาลึกลับ...';
      case EncounterType.Empty:
        return 'เส้นทางว่างเปล่า... เดินหน้าต่อ';
    }
  }
}

export enum EncounterType {
  Empty = 'empty',
  Enemy = 'enemy',
  Boss = 'boss',
  Treasure = 'treasure',
  Trap = 'trap',
  Rest = 'rest',
  Puzzle = 'puzzle',
}
