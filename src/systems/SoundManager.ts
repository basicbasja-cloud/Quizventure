// ============================================================
// 🔊 Sound Manager — handles all game audio
// ============================================================

export class SoundManager {
  private static scene: Phaser.Scene | null = null;

  /** Initialize with current scene */
  static init(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Play a sound effect */
  static play(key: string, volume: number = 1, rate: number = 1) {
    if (!this.scene) return;
    try {
      this.scene.sound.play(key, { volume, rate });
    } catch (e) {
      // Sound not loaded or error
    }
  }

  /** Play a menu click sound */
  static click() { this.play('menu_click', 0.5); }

  /** Play a confirm sound */
  static confirm() { this.play('menu_confirm', 0.6); }

  /** Play a cancel sound */
  static cancel() { this.play('menu_cancel', 0.5); }

  /** Play a sword swing */
  static swing(volume: number = 0.6) {
    const variants = ['swing', 'swing2', 'swing3'];
    const pick = variants[Math.floor(Math.random() * variants.length)];
    this.play(pick, volume);
  }

  /** Play a spell cast */
  static spell(volume: number = 0.7) {
    const variants = ['spell', 'magic'];
    const pick = variants[Math.floor(Math.random() * variants.length)];
    this.play(pick, volume);
  }

  /** Play a hit impact */
  static hit(volume: number = 0.8) { this.play('hit', volume); }

  /** Play enemy roar */
  static enemyRoar(volume: number = 0.5) { this.play('enemy_roar', volume); }

  /** Play enemy hit */
  static enemyHit(volume: number = 0.6) { this.play('enemy_hit', volume); }

  /** Play correct answer sound */
  static correct() { this.play('correct', 0.6); }

  /** Play wrong answer sound */
  static wrong() { this.play('menu_cancel', 1, 0.7); }

  /** Play coin/treasure sound */
  static coin(volume: number = 0.5) {
    const variants = ['coin', 'coin2', 'coin3'];
    const pick = variants[Math.floor(Math.random() * variants.length)];
    this.play(pick, volume);
  }

  /** Play level up sound */
  static levelUp() { this.play('levelup', 0.7); }

  /** Play dice roll sound */
  static diceRoll() { this.play('coin', 0.3, 0.5); }
}
