// ============================================================
// 🎬 Character Animation System
// Tween-based idles, attacks, skills, hit, heal, defend
// ============================================================

import Phaser from 'phaser';
import type { BattleUnit } from '../scenes/BattleScene';

/** Start idle bobbing animation on a sprite */
export function startIdleAnimation(sprite: Phaser.GameObjects.Image): void {
  if (sprite.getData('idleTween')) return; // already running

  const bob = sprite.scene.tweens.add({
    targets: sprite,
    y: sprite.y - 4,
    duration: 1200 + Math.random() * 400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    delay: Math.random() * 1000,
  });
  sprite.setData('idleTween', bob);
}

/** Stop idle bobbing */
export function stopIdleAnimation(sprite: Phaser.GameObjects.Image): void {
  const tween = sprite.getData('idleTween');
  if (tween) {
    tween.stop();
    sprite.setData('idleTween', null);
  }
}

/** Attack animation — lunge toward target, return */
export function playAttackAnimation(
  attacker: Phaser.GameObjects.Image,
  target: Phaser.GameObjects.Image,
  onComplete?: () => void,
): void {
  stopIdleAnimation(attacker);

  const homeX = attacker.x;
  const homeY = attacker.y;
  const dir = target.x > attacker.x ? 1 : -1;
  const lungeDist = 40;

  // Quick lunge forward
  attacker.scene.tweens.add({
    targets: attacker,
    x: homeX + dir * lungeDist,
    y: homeY - 5,
    duration: 120,
    ease: 'Power2',
    onComplete: () => {
      // Return to home
      attacker.scene.tweens.add({
        targets: attacker,
        x: homeX,
        y: homeY,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          startIdleAnimation(attacker);
          if (onComplete) onComplete();
        },
      });
    },
  });
}

/** Enemy attack animation — simpler version */
export function playEnemyAttackAnimation(
  attacker: Phaser.GameObjects.Image,
  target: Phaser.GameObjects.Image,
  onComplete?: () => void,
): void {
  stopIdleAnimation(attacker);

  const homeX = attacker.x;
  const homeY = attacker.y;
  const dir = target.x > attacker.x ? 1 : -1;

  // Wind up back
  attacker.scene.tweens.add({
    targets: attacker,
    x: homeX - dir * 20,
    duration: 150,
    ease: 'Power1',
    onComplete: () => {
      // Lunge forward
      attacker.scene.tweens.add({
        targets: attacker,
        x: homeX + dir * 35,
        y: homeY - 3,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          // Return
          attacker.scene.tweens.add({
            targets: attacker,
            x: homeX,
            y: homeY,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: () => {
              startIdleAnimation(attacker);
              if (onComplete) onComplete();
            },
          });
        },
      });
    },
  });
}

/** Skill animation — spin + flash */
export function playSkillAnimation(
  unit: Phaser.GameObjects.Image,
  onComplete?: () => void,
): void {
  stopIdleAnimation(unit);

  const scene = unit.scene;
  const homeY = unit.y;

  // Jump up
  scene.tweens.add({
    targets: unit,
    y: homeY - 30,
    angle: 360,
    scaleX: unit.scaleX * 1.2,
    scaleY: unit.scaleY * 1.2,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      // Flash burst
      const burst = scene.add.circle(unit.x, unit.y - 15, 10, 0xffffaa, 0.8);
      scene.tweens.add({
        targets: burst,
        scaleX: 5,
        scaleY: 5,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => burst.destroy(),
      });

      // Return
      scene.tweens.add({
        targets: unit,
        y: homeY,
        angle: 0,
        scaleX: unit.getData('origScale') || unit.scaleX,
        scaleY: unit.getData('origScale') || unit.scaleY,
        duration: 250,
        ease: 'Back.easeOut',
        onComplete: () => {
          startIdleAnimation(unit);
          if (onComplete) onComplete();
        },
      });
    },
  });
}

/** Heal animation — gentle green pulse */
export function playHealAnimation(
  unit: Phaser.GameObjects.Image,
  onComplete?: () => void,
): void {
  stopIdleAnimation(unit);

  const scene = unit.scene;
  const homeY = unit.y;

  // Gentle rise
  scene.tweens.add({
    targets: unit,
    y: homeY - 12,
    duration: 300,
    ease: 'Sine.easeOut',
    onComplete: () => {
      // Green glow ring
      const ring = scene.add.circle(unit.x, unit.y - 6, 5, 0x44ff44, 0.6);
      scene.tweens.add({
        targets: ring,
        scaleX: 4,
        scaleY: 4,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => ring.destroy(),
      });

      // Return
      scene.tweens.add({
        targets: unit,
        y: homeY,
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: () => {
          startIdleAnimation(unit);
          if (onComplete) onComplete();
        },
      });
    },
  });
}

/** Defend animation — shield glow */
export function playDefendAnimation(
  unit: Phaser.GameObjects.Image,
  onComplete?: () => void,
): void {
  stopIdleAnimation(unit);

  const scene = unit.scene;

  // Shield flash
  const shield = scene.add.rectangle(unit.x + 10, unit.y - 5, 24, 30, 0x44aaff, 0.5);
  shield.setStrokeStyle(2, 0x88ccff);

  scene.tweens.add({
    targets: shield,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 400,
    onComplete: () => shield.destroy(),
  });

  // Push back slightly
  scene.tweens.add({
    targets: unit,
    x: unit.x - 5,
    duration: 100,
    yoyo: true,
    ease: 'Power1',
    onComplete: () => {
      startIdleAnimation(unit);
      if (onComplete) onComplete();
    },
  });
}

/** Hit reaction — flash red + shake */
export function playHitAnimation(
  unit: Phaser.GameObjects.Image,
  onComplete?: () => void,
): void {
  stopIdleAnimation(unit);

  const scene = unit.scene;
  const homeX = unit.x;
  const color = unit.getData('origTint') ?? 0xffffff;

  // Flash tint red
  unit.setTint(0xff4444);

  // Shake
  scene.tweens.add({
    targets: unit,
    x: homeX + 6,
    duration: 40,
    yoyo: true,
    repeat: 4,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      unit.setTint(color);
      startIdleAnimation(unit);
      if (onComplete) onComplete();
    },
  });
}

/** Death animation — fade and fall */
export function playDeathAnimation(
  unit: Phaser.GameObjects.Image,
  onComplete?: () => void,
): void {
  stopIdleAnimation(unit);

  const scene = unit.scene;

  scene.tweens.add({
    targets: unit,
    alpha: 0,
    y: unit.y + 30,
    angle: 90,
    scaleX: 0.3,
    scaleY: 0.3,
    duration: 500,
    ease: 'Power2',
    onComplete: () => {
      if (onComplete) onComplete();
    },
  });
}

/** Boss phase transition — flash red, pulse */
export function playBossPhaseAnimation(
  boss: Phaser.GameObjects.Image,
  phaseName: string,
  onComplete?: () => void,
): void {
  stopIdleAnimation(boss);

  const scene = boss.scene;
  const homeScale = boss.getData('origScale') || boss.scaleX;

  // Angry pulse
  boss.setTint(0xff2222);
  scene.tweens.add({
    targets: boss,
    scaleX: homeScale * 1.3,
    scaleY: homeScale * 1.3,
    duration: 200,
    yoyo: true,
    repeat: 2,
    ease: 'Power2',
    onComplete: () => {
      boss.clearTint();
      scene.tweens.add({
        targets: boss,
        scaleX: homeScale,
        scaleY: homeScale,
        duration: 200,
        onComplete: () => {
          startIdleAnimation(boss);
          if (onComplete) onComplete();
        },
      });
    },
  });
}
