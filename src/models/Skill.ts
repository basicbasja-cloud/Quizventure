// ============================================================
// 📦 Skill Data Model
// ============================================================

import { ClassType, CLASS_EVOLVE_LEVEL } from './CharacterClass';

export enum SkillTarget {
  Self = 'self',
  SingleEnemy = 'singleEnemy',
  AllEnemies = 'allEnemies',
  SingleAlly = 'singleAlly',
  AllAllies = 'allAllies',
}

export enum QuestionDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface SkillDefinition {
  id: string;
  nameKey: string;          // Key into TH.skills
  descKey: string;          // Key into TH.skills
  requiredClass: ClassType;
  isEvolvedSkill: boolean;  // true if requires evolved class
  levelRequired: number;    // Level needed to unlock
  mpCost: number;
  basePower: number;        // Damage/heal multiplier (e.g., 1.5 = 150%)
  targetType: SkillTarget;
  associatedStat: keyof import('./CharacterClass').StatGrowth; // Which stat powers this skill
  requiredQuestionCount: number; // 1, 2, or 3
  questionDifficulty: QuestionDifficulty; // Easy, Medium, Hard
}

// ============================================================
// Skill Catalog — All 30 skills
// ============================================================

export const SKILLS: SkillDefinition[] = [
  // ---- Warrior (Base) ----
  {
    id: 'heavyStrike', nameKey: 'heavyStrike', descKey: 'heavyStrikeDesc',
    requiredClass: ClassType.Warrior, isEvolvedSkill: false, levelRequired: 1,
    mpCost: 10, basePower: 1.5, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'shieldBlock', nameKey: 'shieldBlock', descKey: 'shieldBlockDesc',
    requiredClass: ClassType.Warrior, isEvolvedSkill: false, levelRequired: 3,
    mpCost: 8, basePower: 0.5, targetType: SkillTarget.Self,
    associatedStat: 'def', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'groundSmash', nameKey: 'groundSmash', descKey: 'groundSmashDesc',
    requiredClass: ClassType.Warrior, isEvolvedSkill: false, levelRequired: 5,
    mpCost: 15, basePower: 0.8, targetType: SkillTarget.AllEnemies,
    associatedStat: 'atk', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Easy,
  },
  // ---- Knight (Evolved) ----
  {
    id: 'holySlash', nameKey: 'holySlash', descKey: 'holySlashDesc',
    requiredClass: ClassType.Warrior, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 20, basePower: 2.0, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Medium,
  },
  {
    id: 'goldenArmor', nameKey: 'goldenArmor', descKey: 'goldenArmorDesc',
    requiredClass: ClassType.Warrior, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 25, basePower: 1.0, targetType: SkillTarget.AllAllies,
    associatedStat: 'def', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Hard,
  },

  // ---- Archer (Base) ----
  {
    id: 'preciseShot', nameKey: 'preciseShot', descKey: 'preciseShotDesc',
    requiredClass: ClassType.Archer, isEvolvedSkill: false, levelRequired: 1,
    mpCost: 8, basePower: 1.3, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'quickStep', nameKey: 'quickStep', descKey: 'quickStepDesc',
    requiredClass: ClassType.Archer, isEvolvedSkill: false, levelRequired: 3,
    mpCost: 6, basePower: 0.5, targetType: SkillTarget.Self,
    associatedStat: 'spd', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'arrowRain', nameKey: 'arrowRain', descKey: 'arrowRainDesc',
    requiredClass: ClassType.Archer, isEvolvedSkill: false, levelRequired: 5,
    mpCost: 12, basePower: 0.7, targetType: SkillTarget.AllEnemies,
    associatedStat: 'atk', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Easy,
  },
  // ---- Sniper (Evolved) ----
  {
    id: 'bullseye', nameKey: 'bullseye', descKey: 'bullseyeDesc',
    requiredClass: ClassType.Archer, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 18, basePower: 2.5, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Medium,
  },
  {
    id: 'piercingShot', nameKey: 'piercingShot', descKey: 'piercingShotDesc',
    requiredClass: ClassType.Archer, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 15, basePower: 1.8, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Hard,
  },

  // ---- Paladin (Base) ----
  {
    id: 'holyStrike', nameKey: 'holyStrike', descKey: 'holyStrikeDesc',
    requiredClass: ClassType.Paladin, isEvolvedSkill: false, levelRequired: 1,
    mpCost: 10, basePower: 1.2, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'divineProtection', nameKey: 'divineProtection', descKey: 'divineProtectionDesc',
    requiredClass: ClassType.Paladin, isEvolvedSkill: false, levelRequired: 3,
    mpCost: 12, basePower: 0.3, targetType: SkillTarget.AllAllies,
    associatedStat: 'def', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'sacredBlessing', nameKey: 'sacredBlessing', descKey: 'sacredBlessingDesc',
    requiredClass: ClassType.Paladin, isEvolvedSkill: false, levelRequired: 5,
    mpCost: 15, basePower: 0.25, targetType: SkillTarget.AllAllies,
    associatedStat: 'wis', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Easy,
  },
  // ---- Royal Guard (Evolved) ----
  {
    id: 'kingsShield', nameKey: 'kingsShield', descKey: 'kingsShieldDesc',
    requiredClass: ClassType.Paladin, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 25, basePower: 1.0, targetType: SkillTarget.AllAllies,
    associatedStat: 'def', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Hard,
  },
  {
    id: 'royalJudgment', nameKey: 'royalJudgment', descKey: 'royalJudgmentDesc',
    requiredClass: ClassType.Paladin, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 22, basePower: 1.5, targetType: SkillTarget.AllEnemies,
    associatedStat: 'wis', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Medium,
  },

  // ---- Rogue (Base) ----
  {
    id: 'shadowStrike', nameKey: 'shadowStrike', descKey: 'shadowStrikeDesc',
    requiredClass: ClassType.Rogue, isEvolvedSkill: false, levelRequired: 1,
    mpCost: 8, basePower: 1.4, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'poisonBlade', nameKey: 'poisonBlade', descKey: 'poisonBladeDesc',
    requiredClass: ClassType.Rogue, isEvolvedSkill: false, levelRequired: 3,
    mpCost: 10, basePower: 0.3, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'smokeScreen', nameKey: 'smokeScreen', descKey: 'smokeScreenDesc',
    requiredClass: ClassType.Rogue, isEvolvedSkill: false, levelRequired: 5,
    mpCost: 8, basePower: 0.3, targetType: SkillTarget.AllEnemies,
    associatedStat: 'spd', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Easy,
  },
  // ---- Assassin (Evolved) ----
  {
    id: 'deathMark', nameKey: 'deathMark', descKey: 'deathMarkDesc',
    requiredClass: ClassType.Rogue, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 22, basePower: 3.0, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'atk', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Hard,
  },
  {
    id: 'shadowDance', nameKey: 'shadowDance', descKey: 'shadowDanceDesc',
    requiredClass: ClassType.Rogue, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 18, basePower: 1.2, targetType: SkillTarget.AllEnemies,
    associatedStat: 'atk', requiredQuestionCount: 3, questionDifficulty: QuestionDifficulty.Easy,
  },

  // ---- Mage (Base) ----
  {
    id: 'fireBolt', nameKey: 'fireBolt', descKey: 'fireBoltDesc',
    requiredClass: ClassType.Mage, isEvolvedSkill: false, levelRequired: 1,
    mpCost: 10, basePower: 1.3, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'int', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'iceShard', nameKey: 'iceShard', descKey: 'iceShardDesc',
    requiredClass: ClassType.Mage, isEvolvedSkill: false, levelRequired: 3,
    mpCost: 10, basePower: 0.3, targetType: SkillTarget.SingleEnemy,
    associatedStat: 'int', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'thunderBolt', nameKey: 'thunderBolt', descKey: 'thunderBoltDesc',
    requiredClass: ClassType.Mage, isEvolvedSkill: false, levelRequired: 5,
    mpCost: 15, basePower: 0.9, targetType: SkillTarget.AllEnemies,
    associatedStat: 'int', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Easy,
  },
  // ---- Archmage (Evolved) ----
  {
    id: 'meteorStorm', nameKey: 'meteorStorm', descKey: 'meteorStormDesc',
    requiredClass: ClassType.Mage, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 30, basePower: 1.8, targetType: SkillTarget.AllEnemies,
    associatedStat: 'int', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Hard,
  },
  {
    id: 'arcaneSurge', nameKey: 'arcaneSurge', descKey: 'arcaneSurgeDesc',
    requiredClass: ClassType.Mage, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 20, basePower: 1.0, targetType: SkillTarget.Self,
    associatedStat: 'int', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Medium,
  },

  // ---- Healer (Base) ----
  {
    id: 'heal', nameKey: 'heal', descKey: 'healDesc',
    requiredClass: ClassType.Healer, isEvolvedSkill: false, levelRequired: 1,
    mpCost: 12, basePower: 0.35, targetType: SkillTarget.SingleAlly,
    associatedStat: 'wis', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'cure', nameKey: 'cure', descKey: 'cureDesc',
    requiredClass: ClassType.Healer, isEvolvedSkill: false, levelRequired: 3,
    mpCost: 8, basePower: 0, targetType: SkillTarget.SingleAlly,
    associatedStat: 'wis', requiredQuestionCount: 1, questionDifficulty: QuestionDifficulty.Easy,
  },
  {
    id: 'regen', nameKey: 'regen', descKey: 'regenDesc',
    requiredClass: ClassType.Healer, isEvolvedSkill: false, levelRequired: 5,
    mpCost: 15, basePower: 0.15, targetType: SkillTarget.AllAllies,
    associatedStat: 'wis', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Easy,
  },
  // ---- Bishop (Evolved) ----
  {
    id: 'panacea', nameKey: 'panacea', descKey: 'panaceaDesc',
    requiredClass: ClassType.Healer, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 25, basePower: 1.0, targetType: SkillTarget.SingleAlly,
    associatedStat: 'wis', requiredQuestionCount: 2, questionDifficulty: QuestionDifficulty.Hard,
  },
  {
    id: 'sanctuary', nameKey: 'sanctuary', descKey: 'sanctuaryDesc',
    requiredClass: ClassType.Healer, isEvolvedSkill: true, levelRequired: CLASS_EVOLVE_LEVEL,
    mpCost: 30, basePower: 0.3, targetType: SkillTarget.AllAllies,
    associatedStat: 'wis', requiredQuestionCount: 3, questionDifficulty: QuestionDifficulty.Easy,
  },
];

/** Get skills available for a character at a given level */
export function getAvailableSkills(classType: ClassType, level: number, isEvolved: boolean): SkillDefinition[] {
  return SKILLS.filter(s => {
    if (s.requiredClass !== classType) return false;
    if (s.isEvolvedSkill && !isEvolved) return false;
    if (level < s.levelRequired) return false;
    return true;
  });
}

/** Get a skill by its id */
export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILLS.find(s => s.id === id);
}
