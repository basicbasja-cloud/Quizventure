// ============================================================
// 📦 Character Class Definitions with Evolution Tree
// ============================================================

export enum ClassType {
  Warrior = 'warrior',
  Archer = 'archer',
  Paladin = 'paladin',
  Rogue = 'rogue',
  Mage = 'mage',
  Healer = 'healer',
}

export enum ClassStage {
  Base = 'base',
  Evolved = 'evolved',
}

export interface EvolutionInfo {
  type: ClassType;
  stage: ClassStage;
  className: string;       // Thai name
  classDesc: string;       // Thai description
  levelRequirement: number; // Level required to evolve
}

export interface StatGrowth {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
  int: number;
  wis: number;
}

export interface ClassDefinition {
  type: ClassType;
  stage: ClassStage;
  nameKey: string;         // Key into TH.classes
  descKey: string;         // Key into TH.classes
  baseStats: StatGrowth;   // Starting stats
  growthPerLevel: StatGrowth;
  evolution: ClassType;    // What it evolves into (same if no evolution)
  evolveLevel: number;     // Level required to evolve
}

export const CLASS_EVOLVE_LEVEL = 10;

export const CLASS_DEFINITIONS: Record<string, ClassDefinition> = {
  // ========== Base Classes ==========
  warrior: {
    type: ClassType.Warrior,
    stage: ClassStage.Base,
    nameKey: 'warrior',
    descKey: 'warriorDesc',
    baseStats: { hp: 120, mp: 30, atk: 18, def: 15, spd: 10, int: 8, wis: 6 },
    growthPerLevel: { hp: 12, mp: 3, atk: 3, def: 2.5, spd: 1.5, int: 1, wis: 1 },
    evolution: ClassType.Warrior,
    evolveLevel: CLASS_EVOLVE_LEVEL,
  },
  archer: {
    type: ClassType.Archer,
    stage: ClassStage.Base,
    nameKey: 'archer',
    descKey: 'archerDesc',
    baseStats: { hp: 90, mp: 40, atk: 15, def: 10, spd: 18, int: 10, wis: 8 },
    growthPerLevel: { hp: 9, mp: 4, atk: 2.5, def: 1.5, spd: 3, int: 1.5, wis: 1 },
    evolution: ClassType.Archer,
    evolveLevel: CLASS_EVOLVE_LEVEL,
  },
  paladin: {
    type: ClassType.Paladin,
    stage: ClassStage.Base,
    nameKey: 'paladin',
    descKey: 'paladinDesc',
    baseStats: { hp: 110, mp: 50, atk: 12, def: 18, spd: 8, int: 10, wis: 14 },
    growthPerLevel: { hp: 11, mp: 5, atk: 2, def: 3, spd: 1, int: 1.5, wis: 2 },
    evolution: ClassType.Paladin,
    evolveLevel: CLASS_EVOLVE_LEVEL,
  },
  rogue: {
    type: ClassType.Rogue,
    stage: ClassStage.Base,
    nameKey: 'rogue',
    descKey: 'rogueDesc',
    baseStats: { hp: 85, mp: 35, atk: 16, def: 8, spd: 20, int: 12, wis: 6 },
    growthPerLevel: { hp: 8, mp: 3.5, atk: 2.5, def: 1, spd: 3.5, int: 1.5, wis: 0.5 },
    evolution: ClassType.Rogue,
    evolveLevel: CLASS_EVOLVE_LEVEL,
  },
  mage: {
    type: ClassType.Mage,
    stage: ClassStage.Base,
    nameKey: 'mage',
    descKey: 'mageDesc',
    baseStats: { hp: 75, mp: 80, atk: 6, def: 6, spd: 12, int: 20, wis: 10 },
    growthPerLevel: { hp: 7, mp: 10, atk: 0.5, def: 0.5, spd: 2, int: 3.5, wis: 1.5 },
    evolution: ClassType.Mage,
    evolveLevel: CLASS_EVOLVE_LEVEL,
  },
  healer: {
    type: ClassType.Healer,
    stage: ClassStage.Base,
    nameKey: 'healer',
    descKey: 'healerDesc',
    baseStats: { hp: 85, mp: 70, atk: 6, def: 8, spd: 10, int: 8, wis: 20 },
    growthPerLevel: { hp: 8, mp: 8, atk: 0.5, def: 1, spd: 1.5, int: 1, wis: 3.5 },
    evolution: ClassType.Healer,
    evolveLevel: CLASS_EVOLVE_LEVEL,
  },

  // ========== Evolved Classes ==========
  knight: {
    type: ClassType.Warrior,
    stage: ClassStage.Evolved,
    nameKey: 'knight',
    descKey: 'knightDesc',
    baseStats: { hp: 200, mp: 50, atk: 28, def: 25, spd: 15, int: 10, wis: 8 },
    growthPerLevel: { hp: 15, mp: 4, atk: 4, def: 3.5, spd: 2, int: 1.5, wis: 1 },
    evolution: ClassType.Warrior,
    evolveLevel: 99,
  },
  sniper: {
    type: ClassType.Archer,
    stage: ClassStage.Evolved,
    nameKey: 'sniper',
    descKey: 'sniperDesc',
    baseStats: { hp: 150, mp: 60, atk: 25, def: 15, spd: 30, int: 15, wis: 10 },
    growthPerLevel: { hp: 12, mp: 5, atk: 3.5, def: 2, spd: 4, int: 2, wis: 1.5 },
    evolution: ClassType.Archer,
    evolveLevel: 99,
  },
  royalGuard: {
    type: ClassType.Paladin,
    stage: ClassStage.Evolved,
    nameKey: 'royalGuard',
    descKey: 'royalGuardDesc',
    baseStats: { hp: 190, mp: 70, atk: 18, def: 30, spd: 12, int: 15, wis: 22 },
    growthPerLevel: { hp: 14, mp: 6, atk: 2.5, def: 4, spd: 1.5, int: 2, wis: 3 },
    evolution: ClassType.Paladin,
    evolveLevel: 99,
  },
  assassin: {
    type: ClassType.Rogue,
    stage: ClassStage.Evolved,
    nameKey: 'assassin',
    descKey: 'assassinDesc',
    baseStats: { hp: 140, mp: 55, atk: 28, def: 12, spd: 35, int: 18, wis: 8 },
    growthPerLevel: { hp: 10, mp: 5, atk: 3.5, def: 1.5, spd: 4.5, int: 2, wis: 1 },
    evolution: ClassType.Rogue,
    evolveLevel: 99,
  },
  archmage: {
    type: ClassType.Mage,
    stage: ClassStage.Evolved,
    nameKey: 'archmage',
    descKey: 'archmageDesc',
    baseStats: { hp: 120, mp: 140, atk: 8, def: 8, spd: 18, int: 35, wis: 18 },
    growthPerLevel: { hp: 9, mp: 12, atk: 1, def: 1, spd: 2.5, int: 5, wis: 2 },
    evolution: ClassType.Mage,
    evolveLevel: 99,
  },
  bishop: {
    type: ClassType.Healer,
    stage: ClassStage.Evolved,
    nameKey: 'bishop',
    descKey: 'bishopDesc',
    baseStats: { hp: 140, mp: 120, atk: 8, def: 12, spd: 15, int: 12, wis: 35 },
    growthPerLevel: { hp: 10, mp: 10, atk: 1, def: 1.5, spd: 2, int: 1.5, wis: 5 },
    evolution: ClassType.Healer,
    evolveLevel: 99,
  },
};

/** Get the class definition key for a given class type and stage */
export function getClassKey(type: ClassType, stage: ClassStage): string {
  const defs = Object.entries(CLASS_DEFINITIONS);
  const found = defs.find(([_, d]) => d.type === type && d.stage === stage);
  return found ? found[0] : '';
}

/** Get the evolved class key for a base class */
export function getEvolvedClassKey(type: ClassType): string {
  const defs = Object.entries(CLASS_DEFINITIONS);
  const base = defs.find(([_, d]) => d.type === type && d.stage === ClassStage.Base);
  if (!base) return '';
  const evolved = defs.find(([_, d]) => d.type === base[1].evolution && d.stage === ClassStage.Evolved);
  return evolved ? evolved[0] : '';
}
