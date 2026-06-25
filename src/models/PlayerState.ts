// ============================================================
// 📦 Player State Model
// ============================================================

import type { Character } from './Character';

export interface SaveSlot {
  id: number;
  exists: boolean;
  party: Character[];
  gold: number;
  currentChapter: number;
  currentNodeIndex: number;
  playTime: number; // seconds
  timestamp: number;
}

export function createEmptySaveSlot(id: number): SaveSlot {
  return {
    id,
    exists: false,
    party: [],
    gold: 0,
    currentChapter: 1,
    currentNodeIndex: 0,
    playTime: 0,
    timestamp: 0,
  };
}

export function createNewSave(party: Character[]): SaveSlot {
  return {
    id: 0,
    exists: true,
    party,
    gold: 100,
    currentChapter: 1,
    currentNodeIndex: 0,
    playTime: 0,
    timestamp: Date.now(),
  };
}
