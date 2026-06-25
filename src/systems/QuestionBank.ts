// ============================================================
// ❓ Question Bank — Dexie.js (IndexedDB)
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { QuestionData } from '../models/Question';
import { ClassType } from '../models/CharacterClass';
import { questionDifficultyToNumeric } from '../models/Question';
import { QuestionDifficulty } from '../models/Skill';

class QuestionDatabase extends Dexie {
  questions!: Table<QuestionData, number>;

  constructor() {
    super('Quest2LearnDB');
    this.version(1).stores({
      questions: '++id, category, difficulty, assignedSkillId, usesRemaining',
    });
  }
}

const db = new QuestionDatabase();

export class QuestionBank {
  /** Add a new question */
  static async add(question: QuestionData): Promise<number> {
    return await db.questions.add({ ...question, usesRemaining: 3 });
  }

  /** Update an existing question */
  static async update(id: number, question: Partial<QuestionData>): Promise<void> {
    await db.questions.update(id, question);
  }

  /** Delete a question */
  static async delete(id: number): Promise<void> {
    await db.questions.delete(id);
  }

  /** Get all questions */
  static async getAll(): Promise<QuestionData[]> {
    return await db.questions.toArray();
  }

  /** Get questions by category (class type) */
  static async getByCategory(category: ClassType): Promise<QuestionData[]> {
    return await db.questions.where('category').equals(category).toArray();
  }

  /** Get questions by difficulty range */
  static async getByDifficultyRange(min: number, max: number): Promise<QuestionData[]> {
    return await db.questions
      .where('difficulty')
      .between(min, max, true, true)
      .toArray();
  }

  /** Get available (non-exhausted) questions for a skill use */
  static async getAvailableQuestions(
    category: ClassType,
    difficulty: QuestionDifficulty,
    skillId: string,
    count: number,
  ): Promise<QuestionData[]> {
    const [minDiff, maxDiff] = questionDifficultyToNumeric(difficulty);

    const allQuestions = await db.questions
      .where('category')
      .equals(category)
      .filter(q => q.usesRemaining > 0)
      .filter(q => q.difficulty >= minDiff && q.difficulty <= maxDiff)
      .toArray();

    // Shuffle and return requested count
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Decrement usesRemaining for selected questions
    for (const q of selected) {
      if (q.id !== undefined) {
        await db.questions.update(q.id, {
          usesRemaining: Math.max(0, q.usesRemaining - 1),
        });
        q.usesRemaining = Math.max(0, q.usesRemaining - 1);
      }
    }

    return selected;
  }

  /** Get count of available questions for a category/difficulty */
  static async getAvailableCount(
    category: ClassType,
    difficulty: QuestionDifficulty,
  ): Promise<number> {
    const [minDiff, maxDiff] = questionDifficultyToNumeric(difficulty);

    return await db.questions
      .where('category')
      .equals(category)
      .filter(q => q.usesRemaining > 0)
      .filter(q => q.difficulty >= minDiff && q.difficulty <= maxDiff)
      .count();
  }

  /** Check if a category is running low on questions */
  static async isCategoryLow(category: ClassType, threshold: number = 3): Promise<boolean> {
    const count = await db.questions
      .where('category')
      .equals(category)
      .filter(q => q.usesRemaining > 0)
      .count();
    return count <= threshold;
  }

  /** Bulk add questions */
  static async bulkAdd(questions: QuestionData[]): Promise<number[]> {
    return await db.questions.bulkAdd(
      questions.map(q => ({ ...q, usesRemaining: 3 })),
      { allKeys: true },
    );
  }

  /** Reset all question uses */
  static async resetAllUses(): Promise<void> {
    await db.questions.toCollection().modify({ usesRemaining: 3 });
  }

  /** Export all questions as JSON */
  static async exportJson(): Promise<string> {
    const all = await db.questions.toArray();
    return JSON.stringify(all, null, 2);
  }

  /** Get total question count */
  static async count(): Promise<number> {
    return await db.questions.count();
  }

  /** Seed sample questions (Thai) */
  static async seedSampleData(): Promise<void> {
    const existing = await db.questions.count();
    if (existing > 0) return; // Don't seed if questions exist

    const samples: QuestionData[] = [
      // ---- Warrior questions ----
      { prompt: '5 + 3 = ?', choices: ['6', '7', '8', '9'], correctIndex: 2, category: ClassType.Warrior, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: '10 - 4 = ?', choices: ['5', '6', '7', '8'], correctIndex: 1, category: ClassType.Warrior, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ข้อใดคือผลรวมของ 12 + 15', choices: ['25', '27', '29', '30'], correctIndex: 1, category: ClassType.Warrior, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: '20 × 3 = ?', choices: ['40', '50', '60', '70'], correctIndex: 2, category: ClassType.Warrior, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'พื้นที่ของสี่เหลี่ยมผืนผ้ากว้าง 5 ยาว 8 คือเท่าไร', choices: ['13', '30', '40', '45'], correctIndex: 2, category: ClassType.Warrior, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: '√144 = ?', choices: ['10', '11', '12', '13'], correctIndex: 2, category: ClassType.Warrior, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'x + 5 = 12, x = ?', choices: ['5', '6', '7', '8'], correctIndex: 2, category: ClassType.Warrior, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },
      { prompt: '15% ของ 200 คือเท่าไร', choices: ['20', '25', '30', '35'], correctIndex: 2, category: ClassType.Warrior, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },

      // ---- Archer questions ----
      { prompt: 'โลกหมุนรอบอะไร', choices: ['ดวงจันทร์', 'ดวงอาทิตย์', 'ดาวอังคาร', 'ดาวศุกร์'], correctIndex: 1, category: ClassType.Archer, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ดาวเคราะห์ที่อยู่ใกล้ดวงอาทิตย์ที่สุดคือ', choices: ['ดาวอังคาร', 'ดาวศุกร์', 'ดาวพุธ', 'โลก'], correctIndex: 2, category: ClassType.Archer, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'น้ำแข็งเปลี่ยนสถานะเป็นน้ำเรียกว่า', choices: ['การระเหย', 'การหลอมเหลว', 'การแข็งตัว', 'การควบแน่น'], correctIndex: 1, category: ClassType.Archer, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'สัตว์ชนิดใดเป็นสัตว์เลี้ยงลูกด้วยนม', choices: ['จระเข้', 'กิ้งก่า', 'ปลาวาฬ', 'เต่า'], correctIndex: 2, category: ClassType.Archer, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'แรงโน้มถ่วงถูกค้นพบโดยใคร', choices: ['ไอน์สไตน์', 'นิวตัน', 'กาลิเลโอ', 'อาร์คิมิดีส'], correctIndex: 1, category: ClassType.Archer, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'photosynthesis คือกระบวนการของอะไร', choices: ['การหายใจ', 'การสังเคราะห์แสง', 'การย่อยอาหาร', 'การหมุนเวียนเลือด'], correctIndex: 1, category: ClassType.Archer, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ความเร็วแสงประมาณกี่ km/s', choices: ['200,000', '250,000', '300,000', '350,000'], correctIndex: 2, category: ClassType.Archer, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'pH ของกรดคือค่าใด', choices: ['น้อยกว่า 7', 'เท่ากับ 7', 'มากกว่า 7', 'เท่ากับ 0'], correctIndex: 0, category: ClassType.Archer, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },

      // ---- Paladin questions ----
      { prompt: 'เมืองหลวงของประเทศไทยคือ', choices: ['เชียงใหม่', 'ภูเก็ต', 'กรุงเทพฯ', 'พัทยา'], correctIndex: 2, category: ClassType.Paladin, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'แม่น้ำสายที่ยาวที่สุดในโลกคือ', choices: ['เจ้าพระยา', 'ไนล์', 'อเมซอน', 'โขง'], correctIndex: 1, category: ClassType.Paladin, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ประเทศไทยมีกี่ภาค', choices: ['3', '4', '5', '6'], correctIndex: 1, category: ClassType.Paladin, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ทะเลที่ใหญ่ที่สุดในโลกคือ', choices: ['แปซิฟิก', 'แอตแลนติก', 'อินเดีย', 'อาร์กติก'], correctIndex: 0, category: ClassType.Paladin, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ประเทศใดมีประชากรมากที่สุดในโลก', choices: ['สหรัฐอเมริกา', 'อินเดีย', 'จีน', 'อินโดนีเซีย'], correctIndex: 1, category: ClassType.Paladin, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ทวีปใดเล็กที่สุดในโลก', choices: ['ยุโรป', 'ออสเตรเลีย', 'แอฟริกา', 'อเมริกาใต้'], correctIndex: 1, category: ClassType.Paladin, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ข้อใดคือสัญลักษณ์แทนธาตุเหล็ก', choices: ['Fe', 'Ir', 'Le', 'He'], correctIndex: 0, category: ClassType.Paladin, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ค่าคงที่ของอาโวกาโดรเท่ากับเท่าไร', choices: ['6.02×10²³', '3.14×10²³', '1.60×10¹⁹', '2.99×10⁸'], correctIndex: 0, category: ClassType.Paladin, difficulty: 5, assignedSkillId: '', usesRemaining: 3 },

      // ---- Rogue questions ----
      { prompt: '1 กิโลเมตร เท่ากับกี่เมตร', choices: ['10', '100', '1,000', '10,000'], correctIndex: 2, category: ClassType.Rogue, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: '1 ชั่วโมงมีกี่นาที', choices: ['30', '45', '60', '90'], correctIndex: 2, category: ClassType.Rogue, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'รูปที่มี 3 ด้านเท่ากันคือรูปอะไร', choices: ['สามเหลี่ยมด้านเท่า', 'สามเหลี่ยมหน้าจั่ว', 'สามเหลี่ยมมุมฉาก', 'สี่เหลี่ยม'], correctIndex: 0, category: ClassType.Rogue, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: '2⁵ = ?', choices: ['16', '24', '32', '64'], correctIndex: 2, category: ClassType.Rogue, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'เส้นผ่านศูนย์กลางของวงกลมรัศมี 5 คือ', choices: ['5', '10', '15', '25'], correctIndex: 1, category: ClassType.Rogue, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'เลข 144 เป็นเลขกำลังสองของเลขใด', choices: ['10', '11', '12', '13'], correctIndex: 2, category: ClassType.Rogue, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: '∫ 2x dx = ?', choices: ['x² + C', '2x² + C', 'x²/2 + C', 'x + C'], correctIndex: 0, category: ClassType.Rogue, difficulty: 5, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'อนุพันธ์ของ x³ คืออะไร', choices: ['2x²', '3x²', 'x²', '3x³'], correctIndex: 1, category: ClassType.Rogue, difficulty: 5, assignedSkillId: '', usesRemaining: 3 },

      // ---- Mage questions ----
      { prompt: 'คำว่า "รัก" ในภาษาอังกฤษคืออะไร', choices: ['Like', 'Love', 'Hate', 'Care'], correctIndex: 1, category: ClassType.Mage, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ประโยค "Hello" แปลว่าอะไร', choices: ['ลาก่อน', 'สวัสดี', 'ขอบคุณ', 'ขอโทษ'], correctIndex: 1, category: ClassType.Mage, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'คำศัพท์ "Beautiful" แปลว่าอะไร', choices: ['น่าเกลียด', 'สวยงาม', 'ใหญ่โต', 'เล็ก'], correctIndex: 1, category: ClassType.Mage, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'คำว่า "Eventually" แปลว่าอะไร', choices: ['เริ่มต้น', 'ในที่สุด', 'บางครั้ง', 'ทันที'], correctIndex: 1, category: ClassType.Mage, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ข้อใดเป็นคำพ้องความหมายของ "กล้าหาญ"', choices: ['ขี้ขลาด', 'อ่อนแอ', 'ห้าวหาญ', 'อ่อนโยน'], correctIndex: 2, category: ClassType.Mage, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'คำว่า "Phenomenon" พหูพจน์คืออะไร', choices: ['Phenomenons', 'Phenomena', 'Phenomenum', 'Phenomeni'], correctIndex: 1, category: ClassType.Mage, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ประโยคใดใช้ Present Perfect Tense ถูกต้อง', choices: ['I go to school', 'I have gone to school', 'I went to school', 'I am going'], correctIndex: 1, category: ClassType.Mage, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'Active voice "The cat ate the fish" Passive voice คืออะไร', choices: ['The fish ate the cat', 'The fish was eaten by the cat', 'The cat was eaten by the fish', 'The fish is eating the cat'], correctIndex: 1, category: ClassType.Mage, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },

      // ---- Healer questions ----
      { prompt: 'อวัยวะที่สูบฉีดเลือดคืออะไร', choices: ['ปอด', 'หัวใจ', 'ตับ', 'ไต'], correctIndex: 1, category: ClassType.Healer, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ร่างกายคนเรามีกระดูกประมาณกี่ชิ้น', choices: ['106', '206', '306', '406'], correctIndex: 1, category: ClassType.Healer, difficulty: 1, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'เลือดแดงมีสีอะไร', choices: ['น้ำเงิน', 'แดงสด', 'แดงคล้ำ', 'เขียว'], correctIndex: 1, category: ClassType.Healer, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'อวัยวะใดกรองของเสียในร่างกาย', choices: ['หัวใจ', 'ปอด', 'ไต', 'กระเพาะอาหาร'], correctIndex: 2, category: ClassType.Healer, difficulty: 2, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'โรคที่เกิดจากเชื้อไวรัสคือข้อใด', choices: ['หวัด', 'อาหารเป็นพิษ', 'บาดทะยัก', 'เชื้อรา'], correctIndex: 0, category: ClassType.Healer, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'วิตามินที่ได้จากแสงแดดคือ', choices: ['A', 'B', 'C', 'D'], correctIndex: 3, category: ClassType.Healer, difficulty: 3, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'เซลล์เม็ดเลือดขาวทำหน้าที่อะไร', choices: ['นำออกซิเจน', 'ต่อสู้เชื้อโรค', 'แข็งตัวของเลือด', 'ลำเลียงสารอาหาร'], correctIndex: 1, category: ClassType.Healer, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },
      { prompt: 'ระบบภูมิคุ้มกันของร่างกายผลิตอะไรเพื่อต่อสู้เชื้อโรค', choices: ['เอนไซม์', 'ฮอร์โมน', 'แอนติบอดี', 'เม็ดเลือดแดง'], correctIndex: 2, category: ClassType.Healer, difficulty: 4, assignedSkillId: '', usesRemaining: 3 },
    ];

    await db.questions.bulkAdd(samples);
  }
}

export { db };
