// ============================================================
// 🖼️ Battle Background Generator
// Draws a proper battlefield scene with integrated ground
// ============================================================

import Phaser from 'phaser';

const W = 1920;
const H = 1080;

function hex(c: string): number { return parseInt(c.slice(1), 16); }
function lerp(a: number, b: number, t: number): number { return Math.floor(a + (b - a) * t); }
function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
  const r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
  return `rgb(${lerp(r1,r2,t)},${lerp(g1,g2,t)},${lerp(b1,b2,t)})`;
}

/** Draw a pixel-art mountain silhouette */
function drawMountain(ctx: CanvasRenderingContext2D, cx: number, bw: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const groundY = H - 300;
  ctx.moveTo(cx - bw / 2, groundY);
  const peakX = cx + (Math.random() - 0.5) * bw * 0.3;
  ctx.lineTo(peakX, groundY - h);
  ctx.lineTo(cx + bw / 2, groundY);
  ctx.closePath();
  ctx.fill();
}

/** Generate a complete battle background texture */
export function generateBattleBg(scene: Phaser.Scene): void {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Sky gradient ──
  const skyTop = '#0a0a2e';
  const skyMid = '#1a1a4e';
  const skyBot = '#2a2a5e';
  const skyHeight = H * 0.6;
  for (let y = 0; y < skyHeight; y++) {
    const t = y / skyHeight;
    ctx.fillStyle = t < 0.5 ? lerpColor(skyTop, skyMid, t * 2) : lerpColor(skyMid, skyBot, (t - 0.5) * 2);
    ctx.fillRect(0, y, W, 1);
  }

  // ── Stars ──
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.4;
    const s = Math.random() > 0.8 ? 3 : 2;
    const a = 0.3 + Math.random() * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, s, s);
  }

  // ── Moon ──
  ctx.fillStyle = '#ddddee';
  ctx.beginPath();
  ctx.arc(1560, 110, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0a2e';
  ctx.beginPath();
  ctx.arc(1540, 100, 50, 0, Math.PI * 2);
  ctx.fill();

  // ── Far mountains ──
  drawMountain(ctx, 240, 720, 160, '#1a1a3a');
  drawMountain(ctx, 960, 840, 200, '#151535');
  drawMountain(ctx, 1560, 600, 120, '#1a1a3a');
  drawMountain(ctx, 480, 480, 100, '#151535');
  drawMountain(ctx, 1320, 720, 140, '#1a1a3a');

  // ── Mid-ground hills ──
  for (let i = 0; i < 7; i++) {
    const cx = i * 280 + Math.random() * 80;
    const bw = 350 + Math.random() * 180;
    const bh = 50 + Math.random() * 70;
    ctx.fillStyle = '#1e1e3e';
    ctx.beginPath();
    const groundY = H - 300;
    ctx.moveTo(cx - bw / 2, groundY);
    ctx.lineTo(cx + (Math.random() - 0.5) * 50, groundY - bh);
    ctx.lineTo(cx + bw / 2, groundY);
    ctx.closePath();
    ctx.fill();
  }

  // ── Ground plane ──
  const groundTop = H - 300;
  for (let y = groundTop; y < H; y++) {
    const t = (y - groundTop) / (H - groundTop);
    const g = lerp(40, 28, t);
    const b = lerp(55, 35, t);
    ctx.fillStyle = `rgb(${lerp(35,28,t)},${g},${b})`;
    ctx.fillRect(0, y, W, 1);
  }

  // ── Ground grass texture ──
  ctx.fillStyle = 'rgba(30,55,30,0.12)';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * W;
    const y = groundTop + Math.random() * (H - groundTop);
    ctx.fillRect(x, y, 3 + Math.random() * 4, 2);
  }

  // ── Horizon line ──
  ctx.fillStyle = 'rgba(78, 204, 163, 0.08)';
  ctx.fillRect(0, groundTop, W, 2);

  scene.textures.addCanvas('bg_battlefield', canvas);
}
