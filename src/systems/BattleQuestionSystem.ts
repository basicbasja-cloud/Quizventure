// ============================================================
// ⚔️ Battle Question Integration System
// ============================================================

import type { SkillDefinition } from '../models/Skill';
import { QuestionDifficulty } from '../models/Skill';
import type { QuestionData } from '../models/Question';
import { QuestionBank } from './QuestionBank';
import { ClassType } from '../models/CharacterClass';
import { numericToQuestionDifficulty } from '../models/Question';

export interface QuestionResult {
  question: QuestionData;
  isCorrect: boolean;
}

export interface SkillExecutionResult {
  questions: QuestionResult[];
  allCorrect: boolean;
  correctCount: number;
  totalQuestions: number;
  effectivenessMultiplier: number; // 1.0 = full, 0.4 = reduced
}

export class BattleQuestionSystem {
  /**
   * Draw questions for a skill use.
   * Returns questions and handles decrementing the use counter.
   */
  static async drawQuestions(skill: SkillDefinition): Promise<QuestionData[]> {
    const questions = await QuestionBank.getAvailableQuestions(
      skill.requiredClass,
      skill.questionDifficulty,
      skill.id,
      skill.requiredQuestionCount,
    );
    return questions;
  }

  /**
   * Calculate the effectiveness multiplier based on answers.
   * Each wrong answer reduces effectiveness by 60% multiplicatively.
   * All correct = 100% | 1 wrong = 40% | 2 wrong = 16% | 3 wrong = 6.4%
   */
  static calculateEffectiveness(results: QuestionResult[]): number {
    let multiplier = 1.0;
    for (const r of results) {
      if (!r.isCorrect) {
        multiplier *= 0.4; // 60% reduction per wrong answer
      }
    }
    return multiplier;
  }

  /**
   * Process skill execution with questions.
   * @returns SkillExecutionResult with effectiveness info
   */
  static processResults(questions: QuestionData[], answers: boolean[]): SkillExecutionResult {
    const results: QuestionResult[] = questions.map((q, i) => ({
      question: q,
      isCorrect: answers[i] ?? false,
    }));

    const correctCount = results.filter(r => r.isCorrect).length;
    const totalQuestions = results.length;
    const allCorrect = correctCount === totalQuestions;
    const effectivenessMultiplier = this.calculateEffectiveness(results);

    return {
      questions: results,
      allCorrect,
      correctCount,
      totalQuestions,
      effectivenessMultiplier,
    };
  }

  /** Get difficulty label in Thai */
  static getDifficultyLabel(difficulty: QuestionDifficulty): string {
    switch (difficulty) {
      case QuestionDifficulty.Easy: return 'ง่าย';
      case QuestionDifficulty.Medium: return 'ปานกลาง';
      case QuestionDifficulty.Hard: return 'ยาก';
    }
  }

  /** Get the number of questions remaining in the pool for a skill */
  static async getAvailableQuestionCount(skill: SkillDefinition): Promise<number> {
    return await QuestionBank.getAvailableCount(
      skill.requiredClass,
      skill.questionDifficulty,
    );
  }
}
