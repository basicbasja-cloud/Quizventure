// ============================================================
// 🖼️ Battle Background Generator
// Draws a proper battlefield scene with integrated ground
// ============================================================

import Phaser from 'phaser';

const W = 800;
const H = 600;

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
  ctx.moveTo(cx - bw / 2, H - 180);
  const peakX = cx + (Math.random() - 0.5) * bw * 0.3;
  ctx.lineTo(peakX, H - 180 - h);
  ctx.lineTo(cx + bw / 2, H - 180);
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
  for (let y = 0; y < H * 0.6; y++) {
    const t = y / (H * 0.6);
    ctx.fillStyle = t < 0.5 ? lerpColor(skyTop, skyMid, t * 2) : lerpColor(skyMid, skyBot, (t - 0.5) * 2);
    ctx.fillRect(0, y, W, 1);
  }

  // ── Stars ──
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.4;
    const s = Math.random() > 0.8 ? 2 : 1;
    const a = 0.3 + Math.random() * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, s, s);
  }

  // ── Moon ──
  ctx.fillStyle = '#ddddee';
  ctx.beginPath();
  ctx.arc(650, 60, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0a2e';
  ctx.beginPath();
  ctx.arc(640, 55, 27, 0, Math.PI * 2);
  ctx.fill();

  // ── Far mountains ──
  drawMountain(ctx, 100, 300, 80, '#1a1a3a');
  drawMountain(ctx, 400, 350, 100, '#151535');
  drawMountain(ctx, 650, 250, 60, '#1a1a3a');
  drawMountain(ctx, 200, 200, 50, '#151535');
  drawMountain(ctx, 550, 300, 70, '#1a1a3a');

  // ── Mid-ground hills ──
  for (let i = 0; i < 5; i++) {
    const cx = i * 180 + Math.random() * 60;
    const bw = 200 + Math.random() * 100;
    const bh = 30 + Math.random() * 40;
    ctx.fillStyle = '#1e1e3e';
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2, H - 180);
    ctx.lineTo(cx + (Math.random() - 0.5) * 30, H - 180 - bh);
    ctx.lineTo(cx + bw / 2, H - 180);
    ctx.closePath();
    ctx.fill();
  }

  // ── Ground plane ──
  const groundTop = H - 180;
  for (let y = groundTop; y < H; y++) {
    const t = (y - groundTop) / (H - groundTop);
    const g = lerp(30, 20, t);
    const b = lerp(40, 25, t);
    ctx.fillStyle = `rgb(${lerp(25,20,t)},${g},${b})`;
    ctx.fillRect(0, y, W, 1);
  }

  // ── Ground grass texture ──
  ctx.fillStyle = 'rgba(30,50,30,0.15)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W;
    const y = groundTop + Math.random() * (H - groundTop);
    ctx.fillRect(x, y, 2 + Math.random() * 2, 1);
  }

  // ── Horizon line ──
  ctx.fillStyle = 'rgba(78, 204, 163, 0.08)';
  ctx.fillRect(0, groundTop, W, 1);

  scene.textures.addCanvas('bg_battlefield', canvas);
}
