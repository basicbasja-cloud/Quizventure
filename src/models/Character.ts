// ============================================================
// 📦 Game Character Model (Player Hero)
// ============================================================

import { ClassType, ClassStage, CLASS_DEFINITIONS, getEvolvedClassKey } from './CharacterClass';
import { SkillDefinition, getAvailableSkills } from './Skill';
import type { StatGrowth } from './CharacterClass';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  int: number;
  wis: number;
}

export interface Character {
  id: string;               // unique id
  name: string;             // Character name (Thai)
  classType: ClassType;
  stage: ClassStage;
  level: number;
  xp: number;
  xpToNext: number;
  stats: CharacterStats;
  baseStats: StatGrowth;    // Store base for re-calculation
  isAlive: boolean;
  statusEffects: StatusEffect[];
}

export enum StatusEffectType {
  None = 'none',
  Poison = 'poison',
  Defend = 'defend',
  SpeedUp = 'speedUp',
  SpeedDown = 'speedDown',
  AtkUp = 'atkUp',
  DefUp = 'defUp',
  Regen = 'regen',
  Invincible = 'invincible',
}

export interface StatusEffect {
  type: StatusEffectType;
  turnsRemaining: number;
  value: number; // e.g., 0.5 = 50% boost
}

export const XP_PER_LEVEL = 100; // Base XP per level
export const XP_SCALE = 1.5;     // Scaling factor

/** Calculate XP needed for next level */
export function xpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_SCALE, level - 1));
}

/** Create a new character */
export function createCharacter(
  id: string,
  name: string,
  classType: ClassType,
  level: number = 1,
): Character {
  const classDef = CLASS_DEFINITIONS[classType];
  if (!classDef) throw new Error(`Unknown class: ${classType}`);

  const lvl = level;
  const growth = classDef.growthPerLevel;
  const base = classDef.baseStats;

  const hp = Math.floor(base.hp + growth.hp * (lvl - 1));
  const mp = Math.floor(base.mp + growth.mp * (lvl - 1));
  const atk = Math.floor(base.atk + growth.atk * (lvl - 1));
  const def = Math.floor(base.def + growth.def * (lvl - 1));
  const spd = Math.floor(base.spd + growth.spd * (lvl - 1));
  const int = Math.floor(base.int + growth.int * (lvl - 1));
  const wis = Math.floor(base.wis + growth.wis * (lvl - 1));

  const isEvolved = lvl >= classDef.evolveLevel && classDef.stage === ClassStage.Evolved;

  return {
    id,
    name,
    classType,
    stage: isEvolved ? ClassStage.Evolved : ClassStage.Base,
    level: lvl,
    xp: 0,
    xpToNext: xpForLevel(lvl),
    stats: { hp, maxHp: hp, mp, maxMp: mp, atk, def, spd, int, wis },
    baseStats: { hp: base.hp, mp: base.mp, atk: base.atk, def: base.def, spd: base.spd, int: base.int, wis: base.wis },
    isAlive: true,
    statusEffects: [],
  };
}

/** Add XP to a character and handle level ups */
export function addXp(char: Character, amount: number): { leveledUp: boolean; evolved: boolean } {
  char.xp += amount;
  let leveledUp = false;
  let evolved = false;

  while (char.xp >= char.xpToNext) {
    char.xp -= char.xpToNext;
    char.level++;
    leveledUp = true;

    // Apply stat growth
    const classDef = CLASS_DEFINITIONS[char.classType];
    const growth = classDef.growthPerLevel;
    char.stats.maxHp += Math.floor(growth.hp);
    char.stats.maxMp += Math.floor(growth.mp);
    char.stats.atk += Math.floor(growth.atk);
    char.stats.def += Math.floor(growth.def);
    char.stats.spd += Math.floor(growth.spd);
    char.stats.int += Math.floor(growth.int);
    char.stats.wis += Math.floor(growth.wis);
    char.stats.hp = char.stats.maxHp;
    char.stats.mp = char.stats.maxMp;

    char.xpToNext = xpForLevel(char.level);

    // Check evolution
    if (char.level >= CLASS_DEFINITIONS[char.classType].evolveLevel && char.stage === ClassStage.Base) {
      char.stage = ClassStage.Evolved;
      evolved = true;
    }
  }

  return { leveledUp, evolved };
}

/** Get available skills for this character */
export function getCharacterSkills(char: Character): SkillDefinition[] {
  return getAvailableSkills(char.classType, char.level, char.stage === ClassStage.Evolved);
}
