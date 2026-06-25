// ============================================================
// ✨ Visual Effects System — skill animations & particles
// ============================================================

import Phaser from 'phaser';

export class VisualEffects {
  private scene: Phaser.Scene;
  private particles: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Sword slash effect */
  slashEffect(x: number, y: number, color: number = 0xffffff) {
    const arc = this.scene.add.graphics();
    arc.lineStyle(4, color, 0.9);
    arc.beginPath();
    arc.arc(x, y, 40, -0.8, 0.8);
    arc.strokePath();

    // Second arc
    arc.lineStyle(2, color, 0.5);
    arc.beginPath();
    arc.arc(x, y, 55, -0.6, 0.6);
    arc.strokePath();

    this.scene.tweens.add({
      targets: arc,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => arc.destroy(),
    });
  }

  /** Magic spell burst */
  magicBurst(x: number, y: number, color: number = 0x9b59b6) {
    // Center glow
    const glow = this.scene.add.circle(x, y, 10, color, 0.8);
    this.scene.tweens.add({
      targets: glow,
      radius: 30,
      alpha: 0,
      duration: 400,
      onComplete: () => glow.destroy(),
    });

    // Ring expansion
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, 5, color, 0.6);
      this.scene.tweens.add({
        targets: ring,
        radius: 15 + i * 20,
        alpha: 0,
        duration: 300 + i * 100,
        delay: i * 80,
        onComplete: () => ring.destroy(),
      });
    }

    // Sparkles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = this.scene.add.circle(x, y, 3, 0xffffff, 0.8);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 350,
        delay: i * 50,
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Healing effect */
  healEffect(x: number, y: number) {
    // Cross
    const cross = this.scene.add.graphics();
    cross.fillStyle(0x4ecca3, 0.9);
    cross.fillRect(x - 3, y - 12, 6, 24);
    cross.fillRect(x - 12, y - 3, 24, 6);

    this.scene.tweens.add({
      targets: cross,
      alpha: 0,
      y: y - 20,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 600,
      onComplete: () => cross.destroy(),
    });

    // Floating +HP text
    const hpText = this.scene.add.text(x, y - 20, '+HP', {
      fontSize: '16px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: hpText,
      y: y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => hpText.destroy(),
    });

    // Green sparkles
    for (let i = 0; i < 4; i++) {
      const sp = this.scene.add.circle(x, y, 2, 0x4ecca3, 0.7);
      this.scene.tweens.add({
        targets: sp,
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 50,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        onComplete: () => sp.destroy(),
      });
    }
  }

  /** Shield/defense effect */
  shieldEffect(x: number, y: number) {
    const shield = this.scene.add.graphics();
    shield.lineStyle(3, 0x3498db, 0.8);
    shield.beginPath();
    shield.arc(x, y, 30, 0, Math.PI * 2);
    shield.strokePath();
    shield.lineStyle(2, 0xffffff, 0.4);
    shield.beginPath();
    shield.arc(x, y, 35, 0, Math.PI * 2);
    shield.strokePath();

    this.scene.tweens.add({
      targets: shield,
      alpha: 0,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 500,
      onComplete: () => shield.destroy(),
    });
  }

  /** Fire effect */
  fireEffect(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const px = x + (Math.random() - 0.5) * 20;
      const py = y - 5;
      const particle = this.scene.add.circle(px, py, 3 + Math.random() * 3, 0xff6600, 0.8);
      this.scene.tweens.add({
        targets: particle,
        x: px + (Math.random() - 0.5) * 50,
        y: py - 20 - Math.random() * 30,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 300 + Math.random() * 200,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** Ice effect */
  iceEffect(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const crystal = this.scene.add.graphics();
      crystal.fillStyle(0x87ceeb, 0.8);
      crystal.fillTriangle(
        x, y - 8,
        x - 4, y + 4,
        x + 4, y + 4,
      );
      this.scene.tweens.add({
        targets: crystal,
        x: x + Math.cos(angle) * 35,
        y: y + Math.sin(angle) * 35,
        alpha: 0,
        duration: 400,
        onComplete: () => crystal.destroy(),
      });
    }
  }

  /** Screen shake */
  screenShake(intensity: number = 0.01, duration: number = 200) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /** Damage number popup */
  damagePopup(x: number, y: number, value: number, color: string = '#ff4444') {
    const txt = this.scene.add.text(x, y - 10, String(value), {
      fontSize: '20px',
      color: color,
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: y - 50,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  /** Hit flash on a sprite */
  hitFlash(sprite: Phaser.GameObjects.Image) {
    sprite.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => sprite.clearTint());
    this.scene.time.delayedCall(120, () => sprite.setTint(0xffffff));
    this.scene.time.delayedCall(180, () => sprite.clearTint());
  }

  /** Generic burst particles */
  burst(x: number, y: number, color: number = 0xf39c12, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.circle(x, y, 2 + Math.random() * 3, color, 0.7);
      this.scene.tweens.add({
        targets: p,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Cleanup */
  destroy() {
    this.particles.forEach(p => p.destroy());
    this.particles = [];
  }
}
