import Phaser from 'phaser';
import type { Bounds } from '../core/types';

/**
 * Obstacle entity that can damage or kill the player
 */
export class Obstacle {
  public sprite!: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private config: any;
  
  // Position and movement
  public x: number = 0;
  public y: number = 0;
  public velocityX: number = 0;
  public velocityY: number = 0;
  
  // Obstacle properties
  public obstacleType: string;
  public isActive: boolean = true;
  public isDeadly: boolean = true;
  private animationTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, type: string = 'spike') {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.obstacleType = type;
    
    // Get configuration
    this.config = (globalThis as any).gameConfig?.obstacles?.[type] || {
      size: { w: 32, h: 32 },
      damage: 1,
      deadly: true
    };

    this.setupVisuals();
    console.log(`🔺 Obstacle created: ${type} at (${x}, ${y})`);
  }

  private setupVisuals(): void {
    this.sprite = this.scene.add.container(this.x, this.y);
    
    switch (this.obstacleType) {
      case 'spike':
        this.createSpikeVisual();
        break;
      case 'saw':
        this.createSawVisual();
        break;
      case 'block':
        this.createBlockVisual();
        break;
      case 'moving_platform':
        this.createMovingPlatformVisual();
        break;
      default:
        this.createDefaultVisual();
    }
  }

  private createSpikeVisual(): void {
    const size = this.config.size || { w: 32, h: 32 };
    
    // Create triangle spike
    const points = [
      0, -size.h / 2,        // Top point
      -size.w / 2, size.h / 2,  // Bottom left
      size.w / 2, size.h / 2    // Bottom right
    ];
    
    const spike = this.scene.add.polygon(0, 0, points, 0xff4444);
    spike.setStrokeStyle(2, 0xaa2222);
    
    // Add highlight for 3D effect
    const highlight = this.scene.add.polygon(0, -2, points, 0xff6666);
    highlight.setScale(0.8);
    
    this.sprite.add([highlight, spike]);
  }

  private createSawVisual(): void {
    const radius = (this.config.size?.w || 32) / 2;
    
    // Main circular saw
    const saw = this.scene.add.circle(0, 0, radius, 0x888888);
    saw.setStrokeStyle(3, 0x444444);
    
    // Add teeth around the edge
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const x = Math.cos(angle) * (radius - 2);
      const y = Math.sin(angle) * (radius - 2);
      
      const tooth = this.scene.add.polygon(x, y, [0, -4, -2, 2, 2, 2], 0x666666);
      tooth.setRotation(angle);
      this.sprite.add(tooth);
    }
    
    // Center hub
    const hub = this.scene.add.circle(0, 0, radius * 0.3, 0x333333);
    
    this.sprite.add([saw, hub]);
    
    // Continuous rotation animation
    this.animationTween = this.scene.tweens.add({
      targets: this.sprite,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  private createBlockVisual(): void {
    const size = this.config.size || { w: 32, h: 32 };
    
    // Solid block obstacle
    const block = this.scene.add.rectangle(0, 0, size.w, size.h, 0x8b4513);
    block.setStrokeStyle(2, 0x654321);
    
    // Add texture lines
    const line1 = this.scene.add.line(0, 0, -size.w/4, -size.h/4, size.w/4, size.h/4, 0x654321);
    const line2 = this.scene.add.line(0, 0, size.w/4, -size.h/4, -size.w/4, size.h/4, 0x654321);
    
    this.sprite.add([block, line1, line2]);
  }

  private createMovingPlatformVisual(): void {
    const size = this.config.size || { w: 64, h: 16 };
    
    // Platform base
    const platform = this.scene.add.rectangle(0, 0, size.w, size.h, 0x666666);
    platform.setStrokeStyle(2, 0x444444);
    
    // Add grip pattern
    for (let i = -size.w/2 + 8; i < size.w/2; i += 8) {
      const grip = this.scene.add.circle(i, 0, 2, 0x888888);
      this.sprite.add(grip);
    }
    
    this.sprite.add(platform);
    this.isDeadly = false; // Platforms are not deadly by default
  }

  private createDefaultVisual(): void {
    const size = this.config.size || { w: 32, h: 32 };
    
    // Generic red obstacle
    const obstacle = this.scene.add.rectangle(0, 0, size.w, size.h, 0xff0000);
    obstacle.setStrokeStyle(2, 0xaa0000);
    
    // Warning stripes
    for (let i = -size.w/2; i < size.w/2; i += 8) {
      const stripe = this.scene.add.line(0, 0, i, -size.h/2, i + 4, size.h/2, 0xffff00);
      stripe.setLineWidth(2);
      this.sprite.add(stripe);
    }
    
    this.sprite.add(obstacle);
  }

  /**
   * Update obstacle physics and animations
   */
  update(_time: number, delta: number): void {
    if (!this.isActive) return;
    
    const deltaSeconds = delta / 1000;
    
    // Update position based on velocity
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;
    
    this.updateMovement(deltaSeconds);
    this.updatePosition();
  }

  private updateMovement(deltaSeconds: number): void {
    // Special movement patterns for different obstacle types
    switch (this.obstacleType) {
      case 'moving_platform':
        this.updateMovingPlatform(deltaSeconds);
        break;
      case 'saw':
        // Saws might have special movement patterns
        break;
    }
  }

  private updateMovingPlatform(_deltaSeconds: number): void {
    // This would implement platform-specific movement
    // Could be controlled by patterns.json data
  }

  private updatePosition(): void {
    this.sprite.setPosition(this.x, this.y);
  }

  /**
   * Get collision bounds for AABB detection
   */
  getCollisionBounds(): Bounds {
    const size = this.config.size || { w: 32, h: 32 };
    return {
      x: this.x - size.w / 2,
      y: this.y - size.h / 2,
      width: size.w,
      height: size.h
    };
  }

  /**
   * Check collision with player bounds
   */
  checkCollision(playerBounds: Bounds): boolean {
    if (!this.isActive) return false;
    
    const bounds = this.getCollisionBounds();
    
    return (bounds.x < playerBounds.x + playerBounds.width &&
            bounds.x + bounds.width > playerBounds.x &&
            bounds.y < playerBounds.y + playerBounds.height &&
            bounds.y + bounds.height > playerBounds.y);
  }

  /**
   * Handle collision with player
   */
  onPlayerCollision(_player: any): boolean {
    if (!this.isActive) return false;
    
    console.log(`💥 Player hit ${this.obstacleType}!`);
    
    if (this.isDeadly) {
      // Trigger death/damage
      return true; // Signal that collision was deadly
    } else {
      // Non-deadly collision (like platforms)
      return false;
    }
  }

  /**
   * Set movement velocity
   */
  setVelocity(x: number, y: number): void {
    this.velocityX = x;
    this.velocityY = y;
  }

  /**
   * Set movement pattern from patterns.json
   */
  setMovementPattern(pattern: any): void {
    if (pattern.type === 'oscillate') {
      // Oscillating movement
      this.scene.tweens.add({
        targets: this,
        x: this.x + (pattern.distance || 100),
        duration: pattern.duration || 2000,
        yoyo: true,
        repeat: -1,
        ease: pattern.ease || 'Sine.easeInOut'
      });
    } else if (pattern.type === 'circular') {
      // Circular movement
      const centerX = this.x;
      const centerY = this.y;
      const radius = pattern.radius || 50;
      
      this.scene.tweens.add({
        targets: this,
        angle: Math.PI * 2,
        duration: pattern.duration || 3000,
        repeat: -1,
        ease: 'Linear',
        onUpdate: () => {
          this.x = centerX + Math.cos(this.sprite.rotation) * radius;
          this.y = centerY + Math.sin(this.sprite.rotation) * radius;
        }
      });
    }
  }

  /**
   * Activate/deactivate the obstacle
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.sprite.setVisible(active);
    
    if (active) {
      this.sprite.setAlpha(1);
    } else {
      this.sprite.setAlpha(0.5);
    }
  }

  /**
   * Get obstacle state for debugging
   */
  getState(): any {
    return {
      type: this.obstacleType,
      position: { x: this.x, y: this.y },
      velocity: { x: this.velocityX, y: this.velocityY },
      active: this.isActive,
      deadly: this.isDeadly
    };
  }

  /**
   * Destroy the obstacle
   */
  destroy(): void {
    if (this.animationTween) {
      this.animationTween.destroy();
    }
    this.sprite.destroy();
  }
}
