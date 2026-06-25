// ============================================================
// 🎮 Quizventure — Main Game Entry Point
// ============================================================

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PartySelectScene } from './scenes/PartySelectScene';
import { TeacherDashboard } from './scenes/TeacherDashboard';
import { AdventureScene } from './scenes/AdventureScene';
import { BattleScene } from './scenes/BattleScene';
import { SaveLoadScene } from './scenes/SaveLoadScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    MainMenuScene,
    PartySelectScene,
    TeacherDashboard,
    AdventureScene,
    BattleScene,
    SaveLoadScene,
  ],
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

new Phaser.Game(config);

if (import.meta.hot) {
  import.meta.hot.accept();
}
