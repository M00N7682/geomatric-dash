import Phaser from 'phaser';

/**
 * Visual effects system for particles, animations, and screen effects
 */
export class EffectsManager {
  private scene: Phaser.Scene;
  private particleSystems: Map<string, Phaser.GameObjects.Particles.ParticleEmitter[]> = new Map();
  private activeEffects: Map<string, any> = new Map();
  private effectsContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.effectsContainer = scene.add.container(0, 0);
    this.effectsContainer.setDepth(1000); // Always on top
    
    this.setupParticleSystems();
    console.log('✨ EffectsManager initialized');
  }

  private setupParticleSystems(): void {
    // Create particle systems for different effects
    this.createTrailSystem();
    this.createExplosionSystem();
    this.createCollectionSystem();
    this.createDashSystem();
    this.createJumpSystem();
  }

  private createTrailSystem(): void {
    // Player trail particles
    const trailEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    
    // Create multiple trail emitters for different colors
    const trailColors = [0x38d996, 0x4bffaa, 0x2ea876];
    
    trailColors.forEach((color, index) => {
      const emitter = this.scene.add.particles(0, 0, 'pixel', {
        scale: { start: 0.3 - index * 0.05, end: 0 },
        speed: { min: 20, max: 40 },
        lifespan: { min: 200, max: 400 },
        alpha: { start: 0.8 - index * 0.1, end: 0 },
        tint: color,
        frequency: 50,
        maxParticles: 50
      });
      
      emitter.stop();
      trailEmitters.push(emitter);
      this.effectsContainer.add(emitter);
    });
    
    this.particleSystems.set('trail', trailEmitters);
  }

  private createExplosionSystem(): void {
    // Explosion particles for collisions
    const explosionEmitter = this.scene.add.particles(0, 0, 'pixel', {
      scale: { start: 0.5, end: 0.1 },
      speed: { min: 80, max: 150 },
      lifespan: { min: 300, max: 600 },
      alpha: { start: 1, end: 0 },
      tint: [0xff4444, 0xff6666, 0xffaa44, 0xffffff],
      frequency: -1, // Burst mode
      quantity: 15,
      blendMode: 'ADD'
    });
    
    explosionEmitter.stop();
    this.particleSystems.set('explosion', [explosionEmitter]);
    this.effectsContainer.add(explosionEmitter);
  }

  private createCollectionSystem(): void {
    // Item collection sparkles
    const collectionEmitter = this.scene.add.particles(0, 0, 'pixel', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 30, max: 80 },
      lifespan: { min: 400, max: 800 },
      alpha: { start: 1, end: 0 },
      tint: [0xffd700, 0xffff66, 0xffffaa],
      frequency: -1,
      quantity: 8,
      gravityY: -100,
      blendMode: 'ADD'
    });
    
    collectionEmitter.stop();
    this.particleSystems.set('collection', [collectionEmitter]);
    this.effectsContainer.add(collectionEmitter);
  }

  private createDashSystem(): void {
    // Dash effect particles
    const dashEmitter = this.scene.add.particles(0, 0, 'pixel', {
      scale: { start: 0.4, end: 0 },
      speed: { min: 60, max: 120 },
      lifespan: { min: 200, max: 400 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xff6600, 0xffaa44],
      frequency: 10,
      maxParticles: 30,
      blendMode: 'ADD'
    });
    
    dashEmitter.stop();
    this.particleSystems.set('dash', [dashEmitter]);
    this.effectsContainer.add(dashEmitter);
  }

  private createJumpSystem(): void {
    // Jump dust particles
    const jumpEmitter = this.scene.add.particles(0, 0, 'pixel', {
      scale: { start: 0.2, end: 0 },
      speed: { min: 40, max: 80 },
      lifespan: { min: 300, max: 500 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x888888, 0xaaaaaa, 0xcccccc],
      frequency: -1,
      quantity: 6,
      gravityY: 100
    });
    
    jumpEmitter.stop();
    this.particleSystems.set('jump', [jumpEmitter]);
    this.effectsContainer.add(jumpEmitter);
  }

  /**
   * Start player trail effect
   */
  startPlayerTrail(target: any): void {
    const trailEmitters = this.particleSystems.get('trail');
    if (!trailEmitters || !target) return;
    
    trailEmitters.forEach((emitter, index) => {
      emitter.startFollow(target, index * 5, index * 3);
      emitter.start();
    });
    
    console.log('✨ Player trail started');
  }

  /**
   * Stop player trail effect
   */
  stopPlayerTrail(): void {
    const trailEmitters = this.particleSystems.get('trail');
    if (!trailEmitters) return;
    
    trailEmitters.forEach(emitter => {
      emitter.stopFollow();
      emitter.stop();
    });
    
    console.log('✨ Player trail stopped');
  }

  /**
   * Create explosion effect at position
   */
  explosion(x: number, y: number, intensity: number = 1): void {
    const explosionEmitters = this.particleSystems.get('explosion');
    if (!explosionEmitters) return;
    
    const emitter = explosionEmitters[0];
    emitter.setPosition(x, y);
    emitter.setConfig({
      quantity: Math.floor(15 * intensity),
      speed: { min: 80 * intensity, max: 150 * intensity }
    });
    emitter.explode();
    
    console.log(`💥 Explosion effect at (${x}, ${y}) intensity ${intensity}`);
  }

  /**
   * Create item collection effect
   */
  collectItem(x: number, y: number, itemType: string = 'coin'): void {
    const collectionEmitters = this.particleSystems.get('collection');
    if (!collectionEmitters) return;
    
    const emitter = collectionEmitters[0];
    emitter.setPosition(x, y);
    
    // Different colors for different item types
    switch (itemType) {
      case 'gem':
        emitter.setConfig({ tint: [0x9966ff, 0xbb88ff, 0xdd99ff] });
        break;
      case 'star':
        emitter.setConfig({ tint: [0xffff00, 0xffffaa, 0xffffff] });
        break;
      default: // coin
        emitter.setConfig({ tint: [0xffd700, 0xffff66, 0xffffaa] });
    }
    
    emitter.explode();
    
    console.log(`✨ Collection effect for ${itemType} at (${x}, ${y})`);
  }

  /**
   * Start dash effect
   */
  startDash(target: any): void {
    const dashEmitters = this.particleSystems.get('dash');
    if (!dashEmitters || !target) return;
    
    const emitter = dashEmitters[0];
    emitter.startFollow(target, -20, 0);
    emitter.start();
    
    // Auto-stop after dash duration
    this.scene.time.delayedCall(500, () => {
      this.stopDash();
    });
    
    console.log('💨 Dash effect started');
  }

  /**
   * Stop dash effect
   */
  stopDash(): void {
    const dashEmitters = this.particleSystems.get('dash');
    if (!dashEmitters) return;
    
    const emitter = dashEmitters[0];
    emitter.stopFollow();
    emitter.stop();
  }

  /**
   * Create jump dust effect
   */
  jumpDust(x: number, y: number): void {
    const jumpEmitters = this.particleSystems.get('jump');
    if (!jumpEmitters) return;
    
    const emitter = jumpEmitters[0];
    emitter.setPosition(x, y + 20); // Ground level
    emitter.explode();
    
    console.log(`💨 Jump dust at (${x}, ${y})`);
  }

  /**
   * Create screen flash effect
   */
  screenFlash(color: number = 0xffffff, duration: number = 100): void {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color
    );
    
    flash.setScrollFactor(0); // Stay on screen
    flash.setDepth(2000); // Very top
    flash.setAlpha(0.8);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * Create floating text effect
   */
  floatingText(x: number, y: number, text: string, options: any = {}): void {
    const config = {
      fontSize: options.fontSize || '24px',
      color: options.color || '#ffffff',
      fontStyle: options.fontStyle || 'bold',
      ...options
    };
    
    const textObj = this.scene.add.text(x, y, text, config);
    textObj.setOrigin(0.5);
    textObj.setDepth(1500);
    
    // Floating animation
    this.scene.tweens.add({
      targets: textObj,
      y: y - 50,
      alpha: 0,
      scale: options.endScale || 0.5,
      duration: options.duration || 1000,
      ease: 'Power2',
      onComplete: () => {
        textObj.destroy();
      }
    });
    
    console.log(`📝 Floating text: "${text}" at (${x}, ${y})`);
  }

  /**
   * Create damage indicator
   */
  damageIndicator(x: number, y: number, damage: number): void {
    this.floatingText(x, y, `-${damage}`, {
      fontSize: '20px',
      color: '#ff4444',
      duration: 800,
      endScale: 0.3
    });
  }

  /**
   * Create score popup
   */
  scorePopup(x: number, y: number, score: number): void {
    this.floatingText(x, y, `+${score}`, {
      fontSize: '18px',
      color: '#44ff44',
      duration: 600,
      endScale: 0.4
    });
  }

  /**
   * Create combo indicator
   */
  comboIndicator(x: number, y: number, combo: number): void {
    this.floatingText(x, y, `COMBO x${combo}!`, {
      fontSize: '16px',
      color: '#ffaa00',
      duration: 500,
      endScale: 0.6
    });
  }

  /**
   * Create speed lines effect for fast movement
   */
  speedLines(show: boolean = true): void {
    const effectId = 'speedLines';
    
    if (show && !this.activeEffects.has(effectId)) {
      const lines: Phaser.GameObjects.Line[] = [];
      
      // Create multiple speed lines
      for (let i = 0; i < 8; i++) {
        const line = this.scene.add.line(
          this.scene.cameras.main.width + 50,
          50 + i * 70,
          0, 0, -200, 0,
          0xffffff
        );
        
        line.setLineWidth(2);
        line.setScrollFactor(0.1); // Parallax effect
        line.setAlpha(0.3);
        line.setDepth(100);
        
        // Animate line movement
        this.scene.tweens.add({
          targets: line,
          x: -300,
          duration: 500,
          repeat: -1,
          ease: 'Linear'
        });
        
        lines.push(line);
      }
      
      this.activeEffects.set(effectId, lines);
    } else if (!show && this.activeEffects.has(effectId)) {
      const lines = this.activeEffects.get(effectId);
      lines.forEach((line: Phaser.GameObjects.Line) => {
        this.scene.tweens.killTweensOf(line);
        line.destroy();
      });
      
      this.activeEffects.delete(effectId);
    }
  }

  /**
   * Update all effects
   */
  update(_time: number, _delta: number): void {
    // Update any time-based effects here
  }

  /**
   * Clear all effects
   */
  clearAllEffects(): void {
    // Stop all particle systems
    this.particleSystems.forEach((emitters) => {
      emitters.forEach(emitter => {
        emitter.stop();
        emitter.stopFollow();
      });
    });
    
    // Clear active effects
    this.activeEffects.forEach((effect) => {
      if (Array.isArray(effect)) {
        effect.forEach((obj: any) => {
          if (obj.destroy) obj.destroy();
        });
      }
    });
    this.activeEffects.clear();
    
    console.log('✨ All effects cleared');
  }

  /**
   * Destroy effects manager
   */
  destroy(): void {
    this.clearAllEffects();
    
    // Destroy particle systems
    this.particleSystems.forEach((emitters) => {
      emitters.forEach(emitter => emitter.destroy());
    });
    this.particleSystems.clear();
    
    // Destroy container
    this.effectsContainer.destroy();
    
    console.log('✨ EffectsManager destroyed');
  }
}
