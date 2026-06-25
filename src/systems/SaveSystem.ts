// ============================================================
// 💾 Save/Load System — localStorage
// ============================================================

import type { SaveSlot } from '../models/PlayerState';
import { createEmptySaveSlot } from '../models/PlayerState';

const SAVE_PREFIX = 'quest2learn_save_';
const MAX_SLOTS = 3;

export class SaveSystem {
  /** Get list of all save slots */
  static getAllSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const data = localStorage.getItem(`${SAVE_PREFIX}${i}`);
      if (data) {
        try {
          slots.push(JSON.parse(data) as SaveSlot);
        } catch {
          slots.push(createEmptySaveSlot(i));
        }
      } else {
        slots.push(createEmptySaveSlot(i));
      }
    }
    return slots;
  }

  /** Save to a specific slot */
  static save(slotId: number, data: SaveSlot): boolean {
    try {
      data.timestamp = Date.now();
      localStorage.setItem(`${SAVE_PREFIX}${slotId}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  /** Load from a specific slot */
  static load(slotId: number): SaveSlot | null {
    const data = localStorage.getItem(`${SAVE_PREFIX}${slotId}`);
    if (!data) return null;
    try {
      return JSON.parse(data) as SaveSlot;
    } catch {
      return null;
    }
  }

  /** Delete a save slot */
  static delete(slotId: number): boolean {
    try {
      localStorage.removeItem(`${SAVE_PREFIX}${slotId}`);
      return true;
    } catch {
      return false;
    }
  }

  /** Check if a slot exists */
  static slotExists(slotId: number): boolean {
    return localStorage.getItem(`${SAVE_PREFIX}${slotId}`) !== null;
  }
}
