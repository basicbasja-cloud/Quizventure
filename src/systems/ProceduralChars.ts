// ============================================================
// 🎨 Procedural Character Generator
// Draws unique pixel-art characters per class using Canvas 2D
// ============================================================

import Phaser from 'phaser';

const W = 32; // design width
const H = 32; // design height (square — matches original LPC 64x64 output)
const SCALE = 2; // output: 64x64

interface ClassStyle {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'spiky' | 'long' | 'ponytail' | 'bald';
  hat: 'helmet' | 'hood' | 'wizard' | 'circlet' | 'bandana' | 'crown' | 'none';
  body: 'armor' | 'tunic' | 'robe' | 'leather';
  bodyColor: string;
  bodyColor2: string;
  cape: string | null;
  weapon: 'sword' | 'bow' | 'mace' | 'dagger' | 'staff' | 'none';
  weaponColor: string;
  accent: string;
}

const CLASSES: Record<string, ClassStyle> = {
  warrior: {
    skin: '#e8c090', hair: '#6a4422', hairStyle: 'short',
    hat: 'helmet', body: 'armor',
    bodyColor: '#8899bb', bodyColor2: '#6677aa',
    cape: '#cc2222', weapon: 'sword', weaponColor: '#ccccdd',
    accent: '#ffcc44',
  },
  archer: {
    skin: '#d4a87a', hair: '#8a5a2a', hairStyle: 'ponytail',
    hat: 'hood', body: 'tunic',
    bodyColor: '#3a7a3a', bodyColor2: '#2a5a2a',
    cape: '#4a9a4a', weapon: 'bow', weaponColor: '#8a6a4a',
    accent: '#66bb66',
  },
  paladin: {
    skin: '#f0d0a0', hair: '#c8a060', hairStyle: 'short',
    hat: 'crown', body: 'armor',
    bodyColor: '#4488cc', bodyColor2: '#3366aa',
    cape: '#ffffff', weapon: 'mace', weaponColor: '#ddcc88',
    accent: '#ffdd44',
  },
  rogue: {
    skin: '#c8a878', hair: '#3a2a1a', hairStyle: 'spiky',
    hat: 'bandana', body: 'leather',
    bodyColor: '#3a3a4a', bodyColor2: '#2a2a3a',
    cape: '#553344', weapon: 'dagger', weaponColor: '#bbbbcc',
    accent: '#cc3344',
  },
  mage: {
    skin: '#e0c8a8', hair: '#4a2a6a', hairStyle: 'long',
    hat: 'wizard', body: 'robe',
    bodyColor: '#5533aa', bodyColor2: '#442288',
    cape: null, weapon: 'staff', weaponColor: '#8a6a4a',
    accent: '#ff66ff',
  },
  healer: {
    skin: '#f0dcc0', hair: '#d4b080', hairStyle: 'long',
    hat: 'circlet', body: 'robe',
    bodyColor: '#dddddd', bodyColor2: '#ccbbcc',
    cape: null, weapon: 'staff', weaponColor: '#c8a86a',
    accent: '#ff6644',
  },
};

function darken(c: string, f: number): string {
  const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
  return `rgb(${Math.floor(r*f)},${Math.floor(g*f)},${Math.floor(b*f)})`;
}
function lighten(c: string, f: number): string {
  const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
  return `rgb(${Math.min(255,Math.floor(r+(255-r)*f))},${Math.min(255,Math.floor(g+(255-g)*f))},${Math.min(255,Math.floor(b+(255-b)*f))})`;
}

function drawChar(ctx: CanvasRenderingContext2D, st: ClassStyle): void {
  // ── Legs ──
  ctx.fillStyle = darken(st.bodyColor, 0.15);
  ctx.fillRect(11, 24, 4, 4);
  ctx.fillRect(17, 24, 4, 4);
  // Boots
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(10, 28, 6, 4);
  ctx.fillRect(16, 28, 6, 4);

  // ── Cape ──
  if (st.cape) {
    ctx.fillStyle = darken(st.cape, 0.3);
    ctx.fillRect(5, 10, 22, 20);
    ctx.fillStyle = st.cape;
    ctx.fillRect(6, 9, 20, 19);
    ctx.fillStyle = lighten(st.cape, 0.2);
    ctx.fillRect(6, 9, 20, 2);
  }

  // ── Body ──
  const bodyY = 12;
  if (st.body === 'armor') {
    ctx.fillStyle = lighten(st.bodyColor, 0.15);
    ctx.fillRect(6, bodyY, 5, 4);
    ctx.fillRect(21, bodyY, 5, 4);
    ctx.fillStyle = st.bodyColor;
    ctx.fillRect(8, bodyY, 16, 13);
    ctx.fillStyle = lighten(st.bodyColor, 0.2);
    ctx.fillRect(9, bodyY + 1, 14, 2);
    ctx.fillStyle = st.accent;
    ctx.fillRect(14, bodyY + 3, 4, 3);
    ctx.fillRect(15, bodyY + 2, 2, 5);
    ctx.fillStyle = darken(st.bodyColor, 0.3);
    ctx.fillRect(8, bodyY + 10, 16, 2);
    ctx.fillStyle = st.accent;
    ctx.fillRect(14, bodyY + 10, 4, 2);
  } else if (st.body === 'robe') {
    ctx.fillStyle = st.bodyColor;
    ctx.fillRect(7, bodyY, 18, 16);
    ctx.fillStyle = lighten(st.bodyColor, 0.15);
    ctx.fillRect(14, bodyY + 1, 4, 14);
    ctx.fillStyle = darken(st.bodyColor, 0.3);
    ctx.fillRect(7, bodyY + 10, 18, 2);
    ctx.fillStyle = st.accent;
    ctx.fillRect(14, bodyY + 9, 4, 3);
  } else if (st.body === 'tunic') {
    ctx.fillStyle = st.bodyColor;
    ctx.fillRect(8, bodyY, 16, 12);
    ctx.fillStyle = lighten(st.bodyColor, 0.2);
    ctx.fillRect(10, bodyY, 12, 2);
    ctx.fillStyle = darken(st.bodyColor, 0.3);
    ctx.fillRect(8, bodyY + 9, 16, 2);
    ctx.fillStyle = st.accent;
    ctx.fillRect(14, bodyY + 8, 4, 3);
  } else if (st.body === 'leather') {
    ctx.fillStyle = st.bodyColor;
    ctx.fillRect(8, bodyY, 16, 12);
    ctx.fillStyle = st.bodyColor2;
    ctx.fillRect(8, bodyY, 16, 2);
    ctx.fillRect(14, bodyY, 2, 12);
    ctx.fillStyle = darken(st.bodyColor, 0.3);
    ctx.fillRect(8, bodyY + 9, 16, 2);
    ctx.fillStyle = st.accent;
    ctx.fillRect(14, bodyY + 8, 4, 3);
  }

  // ── Arms ──
  ctx.fillStyle = st.skin;
  ctx.fillRect(4, bodyY + 2, 3, 8);
  ctx.fillRect(25, bodyY + 2, 3, 8);
  ctx.fillStyle = darken(st.skin, 0.1);
  ctx.fillRect(4, bodyY + 9, 3, 2);
  ctx.fillRect(25, bodyY + 9, 3, 2);

  // ── Head (skin) ──
  ctx.fillStyle = st.skin;
  ctx.fillRect(10, 2, 12, 9);
  ctx.fillRect(9, 3, 14, 7);

  // ── Eyes ──
  ctx.fillStyle = '#222222';
  ctx.fillRect(12, 5, 2, 2);
  ctx.fillRect(18, 5, 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(12, 5, 1, 1);
  ctx.fillRect(18, 5, 1, 1);
  ctx.fillStyle = darken(st.skin, 0.2);
  ctx.fillRect(14, 9, 4, 1);

  // ── Hair ──
  ctx.fillStyle = st.hair;
  if (st.hairStyle === 'short') {
    ctx.fillRect(10, 0, 12, 3);
    ctx.fillRect(9, 1, 2, 4);
    ctx.fillRect(21, 1, 2, 4);
  } else if (st.hairStyle === 'spiky') {
    ctx.fillRect(10, 0, 12, 3);
    ctx.fillRect(11, -2, 3, 3);
    ctx.fillRect(17, -2, 3, 3);
    ctx.fillRect(14, -3, 4, 3);
    ctx.fillRect(9, 1, 2, 4);
    ctx.fillRect(21, 1, 2, 4);
  } else if (st.hairStyle === 'long') {
    ctx.fillRect(10, 0, 12, 3);
    ctx.fillRect(8, 2, 3, 8);
    ctx.fillRect(21, 2, 3, 8);
    ctx.fillRect(10, 4, 12, 4);
  } else if (st.hairStyle === 'ponytail') {
    ctx.fillRect(10, 0, 12, 3);
    ctx.fillRect(9, 1, 2, 4);
    ctx.fillRect(21, 1, 2, 4);
    ctx.fillRect(18, 4, 4, 3);
    ctx.fillRect(19, 7, 3, 5);
  }

  // ── Headgear ──
  if (st.hat === 'helmet') {
    ctx.fillStyle = st.bodyColor;
    ctx.fillRect(8, -1, 16, 5);
    ctx.fillStyle = lighten(st.bodyColor, 0.25);
    ctx.fillRect(9, -1, 14, 1);
    ctx.fillStyle = '#222244';
    ctx.fillRect(12, 2, 8, 1);
    ctx.fillStyle = st.bodyColor2;
    ctx.fillRect(7, -3, 3, 4);
    ctx.fillRect(22, -3, 3, 4);
  } else if (st.hat === 'hood') {
    ctx.fillStyle = st.bodyColor;
    ctx.fillRect(7, -1, 18, 7);
    ctx.fillRect(6, 2, 2, 4);
    ctx.fillRect(24, 2, 2, 4);
    ctx.fillStyle = darken(st.bodyColor, 0.15);
    ctx.fillRect(10, 2, 12, 2);
  } else if (st.hat === 'wizard') {
    ctx.fillStyle = st.bodyColor;
    ctx.fillRect(8, -3, 16, 3);
    ctx.fillRect(10, -7, 12, 4);
    ctx.fillRect(12, -11, 8, 4);
    ctx.fillRect(13, -13, 6, 2);
    ctx.fillStyle = darken(st.bodyColor, 0.2);
    ctx.fillRect(6, 1, 20, 1);
    ctx.fillStyle = st.accent;
    ctx.fillRect(15, -8, 2, 2);
  } else if (st.hat === 'crown') {
    ctx.fillStyle = st.accent;
    ctx.fillRect(10, -2, 12, 2);
    ctx.fillRect(11, -4, 3, 2);
    ctx.fillRect(15, -5, 3, 3);
    ctx.fillRect(19, -4, 3, 2);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(15, -2, 3, 1);
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(11, -2, 2, 1);
  } else if (st.hat === 'circlet') {
    ctx.fillStyle = st.accent;
    ctx.fillRect(11, 0, 10, 1);
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(14, 0, 4, 1);
  } else if (st.hat === 'bandana') {
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(9, 0, 14, 2);
    ctx.fillRect(19, 2, 3, 3);
  }

  // ── Weapon ──
  if (st.weapon === 'sword') {
    ctx.fillStyle = st.weaponColor;
    ctx.fillRect(27, 13, 3, 11);
    ctx.fillStyle = darken(st.weaponColor, 0.2);
    ctx.fillRect(26, 23, 5, 2);
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(27, 25, 3, 3);
    ctx.fillStyle = lighten(st.weaponColor, 0.3);
    ctx.fillRect(28, 13, 2, 5);
  } else if (st.weapon === 'bow') {
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(27, 10, 2, 16);
    ctx.fillRect(26, 10, 4, 1);
    ctx.fillRect(26, 24, 4, 1);
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(27, 10, 1, 16);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(28, 12, 1, 12);
  } else if (st.weapon === 'mace') {
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(27, 15, 3, 11);
    ctx.fillStyle = st.weaponColor;
    ctx.fillRect(24, 10, 9, 6);
    ctx.fillStyle = lighten(st.weaponColor, 0.3);
    ctx.fillRect(25, 11, 7, 1);
    ctx.fillStyle = darken(st.weaponColor, 0.2);
    ctx.fillRect(23, 12, 2, 2);
    ctx.fillRect(32, 12, 2, 2);
  } else if (st.weapon === 'dagger') {
    ctx.fillStyle = st.weaponColor;
    ctx.fillRect(4, 13, 2, 7);
    ctx.fillStyle = darken(st.weaponColor, 0.2);
    ctx.fillRect(3, 19, 4, 2);
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(4, 21, 2, 3);
    ctx.fillStyle = lighten(st.weaponColor, 0.3);
    ctx.fillRect(4, 13, 1, 3);
  } else if (st.weapon === 'staff') {
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(4, 8, 2, 18);
    ctx.fillStyle = st.accent;
    ctx.fillRect(2, 5, 5, 5);
    ctx.fillStyle = lighten(st.accent, 0.3);
    ctx.fillRect(3, 6, 3, 1);
    ctx.fillStyle = darken('#6a4a2a', 0.8);
    ctx.fillRect(4, 16, 2, 1);
    ctx.fillRect(4, 20, 2, 1);
  }
}

export function generateClassTextures(scene: Phaser.Scene): void {
  const classNames = ['warrior', 'archer', 'paladin', 'rogue', 'mage', 'healer'];
  for (const cls of classNames) {
    const st = CLASSES[cls];
    if (!st) continue;

    // Generate normal texture
    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;

    // Draw at design resolution
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = W;
    tmpCanvas.height = H;
    const tmpCtx = tmpCanvas.getContext('2d')!;
    drawChar(tmpCtx, st);

    // Scale up
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmpCanvas, 0, 0, W * SCALE, H * SCALE);

    scene.textures.addCanvas('char_' + cls, canvas);
  }

  // Generate evolved versions (slightly enhanced)
  for (const cls of classNames) {
    const st = CLASSES[cls];
    if (!st) continue;

    const stEvolved = { ...st };
    // Brighter colors for evolved
    stEvolved.bodyColor = lighten(st.bodyColor, 0.15);
    stEvolved.bodyColor2 = lighten(st.bodyColor2, 0.15);
    if (stEvolved.cape) stEvolved.cape = lighten(st.cape, 0.15);

    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = W;
    tmpCanvas.height = H;
    const tmpCtx = tmpCanvas.getContext('2d')!;
    drawChar(tmpCtx, stEvolved);

    // Add evolved aura (golden glow border)
    tmpCtx.fillStyle = 'rgba(255,215,0,0.15)';
    tmpCtx.fillRect(0, 0, W, 2);
    tmpCtx.fillRect(0, H - 2, W, 2);
    tmpCtx.fillRect(0, 0, 2, H);
    tmpCtx.fillRect(W - 2, 0, 2, H);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmpCanvas, 0, 0, W * SCALE, H * SCALE);

    scene.textures.addCanvas('char_' + cls + '_evolved', canvas);
  }

  // Generate enemy (red tinted warrior)
  const enemySt: ClassStyle = {
    skin: '#8a6a4a', hair: '#2a1a0a', hairStyle: 'short',
    hat: 'helmet', body: 'armor',
    bodyColor: '#663344', bodyColor2: '#552233',
    cape: '#882222', weapon: 'sword', weaponColor: '#888899',
    accent: '#ff4444',
  };
  const enemyCanvas = document.createElement('canvas');
  enemyCanvas.width = W * SCALE;
  enemyCanvas.height = H * SCALE;
  const enemyCtx = enemyCanvas.getContext('2d')!;
  const tmp2 = document.createElement('canvas');
  tmp2.width = W; tmp2.height = H;
  const tmpCtx2 = tmp2.getContext('2d')!;
  drawChar(tmpCtx2, enemySt);
  enemyCtx.imageSmoothingEnabled = false;
  enemyCtx.drawImage(tmp2, 0, 0, W * SCALE, H * SCALE);
  scene.textures.addCanvas('enemy', enemyCanvas);

  // Generate boss (larger, more ornate)
  const BOSS_W = 40, BOSS_H = 32;
  const bossSt: ClassStyle = {
    skin: '#6a4a2a', hair: '#1a0a00', hairStyle: 'spiky',
    hat: 'crown', body: 'armor',
    bodyColor: '#884433', bodyColor2: '#663322',
    cape: '#cc0000', weapon: 'sword', weaponColor: '#ccccdd',
    accent: '#ffaa00',
  };
  const bossCanvas = document.createElement('canvas');
  bossCanvas.width = BOSS_W * SCALE;
  bossCanvas.height = BOSS_H * SCALE;
  const bossCtx = bossCanvas.getContext('2d')!;
  const tmp3 = document.createElement('canvas');
  tmp3.width = BOSS_W; tmp3.height = BOSS_H;
  const tmpCtx3 = tmp3.getContext('2d')!;
  // Boss - wider body
  tmpCtx3.fillStyle = darken(bossSt.bodyColor, 0.15);
  tmpCtx3.fillRect(14, 24, 5, 4);
  tmpCtx3.fillRect(21, 24, 5, 4);
  tmpCtx3.fillStyle = '#3a2a1a';
  tmpCtx3.fillRect(13, 28, 7, 4);
  tmpCtx3.fillRect(20, 28, 7, 4);
  // Cape
  tmpCtx3.fillStyle = darken(bossSt.cape!, 0.3);
  tmpCtx3.fillRect(5, 9, 30, 22);
  tmpCtx3.fillStyle = bossSt.cape!;
  tmpCtx3.fillRect(6, 8, 28, 21);
  // Body
  tmpCtx3.fillStyle = bossSt.bodyColor;
  tmpCtx3.fillRect(9, 12, 22, 14);
  tmpCtx3.fillStyle = lighten(bossSt.bodyColor, 0.2);
  tmpCtx3.fillRect(10, 13, 20, 2);
  tmpCtx3.fillStyle = bossSt.accent;
  tmpCtx3.fillRect(18, 16, 4, 4);
  // Arms
  tmpCtx3.fillStyle = bossSt.skin;
  tmpCtx3.fillRect(5, 14, 4, 8);
  tmpCtx3.fillRect(31, 14, 4, 8);
  // Head
  tmpCtx3.fillStyle = bossSt.skin;
  tmpCtx3.fillRect(13, 2, 14, 9);
  // Eyes (angry)
  tmpCtx3.fillStyle = '#ff2222';
  tmpCtx3.fillRect(15, 5, 3, 2);
  tmpCtx3.fillRect(22, 5, 3, 2);
  tmpCtx3.fillStyle = '#ff4444';
  tmpCtx3.fillRect(15, 5, 2, 1);
  tmpCtx3.fillRect(22, 5, 2, 1);
  // Mouth
  tmpCtx3.fillStyle = darken(bossSt.skin, 0.2);
  tmpCtx3.fillRect(17, 9, 6, 1);
  // Crown
  tmpCtx3.fillStyle = bossSt.accent;
  tmpCtx3.fillRect(13, -1, 14, 3);
  tmpCtx3.fillRect(14, -3, 4, 3);
  tmpCtx3.fillRect(18, -4, 4, 4);
  tmpCtx3.fillRect(22, -3, 4, 3);
  tmpCtx3.fillStyle = '#ff2222';
  tmpCtx3.fillRect(18, -1, 4, 2);
  // Sword
  tmpCtx3.fillStyle = bossSt.weaponColor;
  tmpCtx3.fillRect(34, 12, 4, 13);
  tmpCtx3.fillStyle = lighten(bossSt.weaponColor, 0.3);
  tmpCtx3.fillRect(35, 12, 2, 7);
  tmpCtx3.fillStyle = darken(bossSt.weaponColor, 0.2);
  tmpCtx3.fillRect(33, 24, 6, 2);
  tmpCtx3.fillStyle = '#6a4a2a';
  tmpCtx3.fillRect(34, 26, 4, 3);

  bossCtx.imageSmoothingEnabled = false;
  bossCtx.drawImage(tmp3, 0, 0, BOSS_W * SCALE, BOSS_H * SCALE);
  scene.textures.addCanvas('boss', bossCanvas);
}
