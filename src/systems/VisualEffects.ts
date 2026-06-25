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
    arc.lineStyle(8, color, 0.9);
    arc.beginPath();
    arc.arc(x, y, 80, -0.8, 0.8);
    arc.strokePath();

    // Second arc
    arc.lineStyle(4, color, 0.5);
    arc.beginPath();
    arc.arc(x, y, 100, -0.6, 0.6);
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
    const glow = this.scene.add.circle(x, y, 20, color, 0.8);
    this.scene.tweens.add({
      targets: glow,
      radius: 60,
      alpha: 0,
      duration: 400,
      onComplete: () => glow.destroy(),
    });

    // Ring expansion
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, 10, color, 0.6);
      this.scene.tweens.add({
        targets: ring,
        radius: 30 + i * 40,
        alpha: 0,
        duration: 300 + i * 100,
        delay: i * 80,
        onComplete: () => ring.destroy(),
      });
    }

    // Sparkles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = this.scene.add.circle(x, y, 6, 0xffffff, 0.8);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 80,
        y: y + Math.sin(angle) * 80,
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
    cross.fillRect(x - 6, y - 22, 12, 44);
    cross.fillRect(x - 22, y - 6, 44, 12);

    this.scene.tweens.add({
      targets: cross,
      alpha: 0,
      y: y - 40,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 600,
      onComplete: () => cross.destroy(),
    });

    // Floating +HP text
    const hpText = this.scene.add.text(x, y - 40, '+HP', {
      fontSize: '28px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: hpText,
      y: y - 80,
      alpha: 0,
      duration: 800,
      onComplete: () => hpText.destroy(),
    });

    // Green sparkles
    for (let i = 0; i < 4; i++) {
      const sp = this.scene.add.circle(x, y, 4, 0x4ecca3, 0.7);
      this.scene.tweens.add({
        targets: sp,
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        onComplete: () => sp.destroy(),
      });
    }
  }

  /** Shield/defense effect */
  shieldEffect(x: number, y: number) {
    const shield = this.scene.add.graphics();
    shield.lineStyle(5, 0x3498db, 0.8);
    shield.beginPath();
    shield.arc(x, y, 50, 0, Math.PI * 2);
    shield.strokePath();
    shield.lineStyle(3, 0xffffff, 0.4);
    shield.beginPath();
    shield.arc(x, y, 58, 0, Math.PI * 2);
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
      const px = x + (Math.random() - 0.5) * 35;
      const py = y - 10;
      const particle = this.scene.add.circle(px, py, 6 + Math.random() * 5, 0xff6600, 0.8);
      this.scene.tweens.add({
        targets: particle,
        x: px + (Math.random() - 0.5) * 80,
        y: py - 30 - Math.random() * 50,
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
        x, y - 16,
        x - 8, y + 8,
        x + 8, y + 8,
      );
      this.scene.tweens.add({
        targets: crystal,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
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
    const txt = this.scene.add.text(x, y - 15, String(value), {
      fontSize: '30px',
      color: color,
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: txt,
      y: y - 80,
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
      const p = this.scene.add.circle(x, y, 4 + Math.random() * 5, color, 0.7);
      this.scene.tweens.add({
        targets: p,
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
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
