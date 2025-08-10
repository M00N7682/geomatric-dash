import Phaser from 'phaser';
import type { Bounds } from '../core/types';

/**
 * Item entity that provides powerups, points, or other benefits
 */
export class Item {
  public sprite!: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private config: any;
  
  // Position and movement
  public x: number = 0;
  public y: number = 0;
  public velocityX: number = 0;
  public velocityY: number = 0;
  
  // Item properties
  public itemType: string;
  public isActive: boolean = true;
  public isCollected: boolean = false;
  public value: number = 1;
  private animationTween?: Phaser.Tweens.Tween;
  private glowTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, type: string = 'coin') {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.itemType = type;
    
    // Get configuration
    this.config = (globalThis as any).gameConfig?.items?.[type] || {
      size: { w: 24, h: 24 },
      value: 1,
      effect: null
    };
    
    this.value = this.config.value || 1;

    this.setupVisuals();
    this.setupAnimations();
    console.log(`💎 Item created: ${type} at (${x}, ${y})`);
  }

  private setupVisuals(): void {
    this.sprite = this.scene.add.container(this.x, this.y);
    
    switch (this.itemType) {
      case 'coin':
        this.createCoinVisual();
        break;
      case 'gem':
        this.createGemVisual();
        break;
      case 'powerup_jump':
        this.createJumpPowerupVisual();
        break;
      case 'powerup_dash':
        this.createDashPowerupVisual();
        break;
      case 'powerup_slide':
        this.createSlidePowerupVisual();
        break;
      case 'powerup_giant':
        this.createGiantPowerupVisual();
        break;
      case 'key':
        this.createKeyVisual();
        break;
      case 'star':
        this.createStarVisual();
        break;
      default:
        this.createDefaultVisual();
    }
  }

  private createCoinVisual(): void {
    const radius = (this.config.size?.w || 24) / 2;
    
    // Main coin circle
    const coin = this.scene.add.circle(0, 0, radius, 0xffd700);
    coin.setStrokeStyle(2, 0xffaa00);
    
    // Inner detail
    const inner = this.scene.add.circle(0, 0, radius - 4, 0xffff66);
    
    // Currency symbol
    const symbol = this.scene.add.text(0, 0, '$', {
      fontSize: `${radius}px`,
      color: '#ffaa00',
      fontStyle: 'bold'
    });
    symbol.setOrigin(0.5);
    
    this.sprite.add([coin, inner, symbol]);
  }

  private createGemVisual(): void {
    const size = this.config.size || { w: 24, h: 24 };
    
    // Diamond shape
    const points = [
      0, -size.h / 2,           // Top
      -size.w / 3, -size.h / 6, // Upper left
      -size.w / 2, size.h / 3,  // Lower left
      0, size.h / 2,            // Bottom
      size.w / 2, size.h / 3,   // Lower right
      size.w / 3, -size.h / 6   // Upper right
    ];
    
    const gem = this.scene.add.polygon(0, 0, points, 0x9966ff);
    gem.setStrokeStyle(2, 0x6633cc);
    
    // Inner facets
    const facet1 = this.scene.add.polygon(0, -2, points, 0xbb88ff);
    facet1.setScale(0.7);
    
    this.sprite.add([gem, facet1]);
    this.value = 5; // Gems are worth more than coins
  }

  private createJumpPowerupVisual(): void {
    const size = this.config.size || { w: 28, h: 28 };
    
    // Powerup base
    const base = this.scene.add.circle(0, 0, size.w / 2, 0x00ff88);
    base.setStrokeStyle(2, 0x00cc66);
    
    // Jump arrow symbol
    const arrow = this.scene.add.polygon(0, -2, [
      0, -8,    // Top point
      -4, 0,    // Left wing
      -2, 0,    // Left inner
      -2, 6,    // Left bottom
      2, 6,     // Right bottom
      2, 0,     // Right inner
      4, 0      // Right wing
    ], 0xffffff);
    
    this.sprite.add([base, arrow]);
  }

  private createDashPowerupVisual(): void {
    const size = this.config.size || { w: 28, h: 28 };
    
    // Powerup base
    const base = this.scene.add.circle(0, 0, size.w / 2, 0xff6600);
    base.setStrokeStyle(2, 0xcc4400);
    
    // Dash lines symbol
    for (let i = 0; i < 3; i++) {
      const line = this.scene.add.line(0, 0, -6 + i * 3, -6 + i * 4, 6 + i * 3, 6 + i * 4, 0xffffff);
      line.setLineWidth(3);
      this.sprite.add(line);
    }
    
    this.sprite.add(base);
  }

  private createSlidePowerupVisual(): void {
    const size = this.config.size || { w: 28, h: 28 };
    
    // Powerup base
    const base = this.scene.add.circle(0, 0, size.w / 2, 0x4466ff);
    base.setStrokeStyle(2, 0x2244cc);
    
    // Slide arrow (downward)
    const arrow = this.scene.add.polygon(0, 2, [
      0, 8,     // Bottom point
      -4, 0,    // Left wing
      -2, 0,    // Left inner
      -2, -6,   // Left top
      2, -6,    // Right top
      2, 0,     // Right inner
      4, 0      // Right wing
    ], 0xffffff);
    
    this.sprite.add([base, arrow]);
  }

  private createGiantPowerupVisual(): void {
    const size = this.config.size || { w: 28, h: 28 };
    
    // Powerup base (larger than others)
    const base = this.scene.add.circle(0, 0, size.w / 2, 0xff3366);
    base.setStrokeStyle(2, 0xcc1144);
    
    // Size expansion symbol
    const outer = this.scene.add.circle(0, 0, size.w / 2 - 3, 0xff6688);
    outer.setAlpha(0.7);
    
    // Plus symbol
    const plus1 = this.scene.add.line(0, 0, -6, 0, 6, 0, 0xffffff);
    const plus2 = this.scene.add.line(0, 0, 0, -6, 0, 6, 0xffffff);
    plus1.setLineWidth(3);
    plus2.setLineWidth(3);
    
    this.sprite.add([base, outer, plus1, plus2]);
  }

  private createKeyVisual(): void {
    const size = this.config.size || { w: 20, h: 24 };
    
    // Key head (circular)
    const head = this.scene.add.circle(-2, -size.h / 4, 6, 0xffaa00);
    head.setStrokeStyle(2, 0xcc8800);
    
    // Key hole
    const hole = this.scene.add.circle(-2, -size.h / 4, 2, 0x000000);
    
    // Key shaft
    const shaft = this.scene.add.rectangle(0, size.h / 4, 3, size.h / 2, 0xffaa00);
    
    // Key teeth
    const tooth1 = this.scene.add.rectangle(3, size.h / 3, 4, 2, 0xffaa00);
    const tooth2 = this.scene.add.rectangle(3, size.h / 2, 6, 2, 0xffaa00);
    
    this.sprite.add([head, shaft, tooth1, tooth2, hole]);
  }

  private createStarVisual(): void {
    const radius = (this.config.size?.w || 24) / 2;
    
    // Star shape (5-pointed)
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const r = i % 2 === 0 ? radius : radius * 0.5;
      points.push(Math.cos(angle - Math.PI / 2) * r);
      points.push(Math.sin(angle - Math.PI / 2) * r);
    }
    
    const star = this.scene.add.polygon(0, 0, points, 0xffff00);
    star.setStrokeStyle(2, 0xffcc00);
    
    // Inner glow
    const glow = this.scene.add.polygon(0, 0, points, 0xffffaa);
    glow.setScale(0.7);
    glow.setAlpha(0.8);
    
    this.sprite.add([star, glow]);
    this.value = 10; // Stars are very valuable
  }

  private createDefaultVisual(): void {
    const size = this.config.size || { w: 24, h: 24 };
    
    // Generic square item
    const item = this.scene.add.rectangle(0, 0, size.w, size.h, 0x00ffff);
    item.setStrokeStyle(2, 0x00cccc);
    
    // Question mark
    const symbol = this.scene.add.text(0, 0, '?', {
      fontSize: `${size.w * 0.7}px`,
      color: '#ffffff',
      fontStyle: 'bold'
    });
    symbol.setOrigin(0.5);
    
    this.sprite.add([item, symbol]);
  }

  private setupAnimations(): void {
    // Floating animation
    this.animationTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.y - 3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Gentle glow effect
    this.glowTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Slow rotation for some items
    if (['gem', 'star', 'key'].includes(this.itemType)) {
      this.scene.tweens.add({
        targets: this.sprite,
        rotation: Math.PI * 2,
        duration: 4000,
        repeat: -1,
        ease: 'Linear'
      });
    }
  }

  /**
   * Update item physics and animations
   */
  update(_time: number, delta: number): void {
    if (!this.isActive || this.isCollected) return;
    
    const deltaSeconds = delta / 1000;
    
    // Update position based on velocity
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;
    
    this.updatePosition();
  }

  private updatePosition(): void {
    // Update the container position, animations handle relative movement
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }

  /**
   * Get collision bounds for AABB detection
   */
  getCollisionBounds(): Bounds {
    const size = this.config.size || { w: 24, h: 24 };
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
    if (!this.isActive || this.isCollected) return false;
    
    const bounds = this.getCollisionBounds();
    
    return (bounds.x < playerBounds.x + playerBounds.width &&
            bounds.x + bounds.width > playerBounds.x &&
            bounds.y < playerBounds.y + playerBounds.height &&
            bounds.y + bounds.height > playerBounds.y);
  }

  /**
   * Handle collection by player
   */
  onPlayerCollision(_player: any): any {
    if (!this.isActive || this.isCollected) return null;
    
    this.isCollected = true;
    console.log(`✨ Player collected ${this.itemType} (value: ${this.value})!`);
    
    // Collection animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.setActive(false);
      }
    });

    // Return the effect/benefit of this item
    return this.getItemEffect();
  }

  /**
   * Get the effect this item provides when collected
   */
  private getItemEffect(): any {
    switch (this.itemType) {
      case 'coin':
      case 'gem':
      case 'star':
        return { type: 'score', value: this.value };
        
      case 'powerup_jump':
        return { type: 'ability', ability: 'doubleJump', duration: 10000 };
        
      case 'powerup_dash':
        return { type: 'ability', ability: 'dash', duration: 8000 };
        
      case 'powerup_slide':
        return { type: 'ability', ability: 'slide', duration: 12000 };
        
      case 'powerup_giant':
        return { type: 'ability', ability: 'giant', duration: 5000 };
        
      case 'key':
        return { type: 'key', value: 1 };
        
      default:
        return { type: 'score', value: this.value };
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
   * Activate/deactivate the item
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.sprite.setVisible(active);
    
    if (!active) {
      // Stop all animations
      if (this.animationTween) {
        this.animationTween.pause();
      }
      if (this.glowTween) {
        this.glowTween.pause();
      }
    } else {
      // Resume animations
      if (this.animationTween) {
        this.animationTween.resume();
      }
      if (this.glowTween) {
        this.glowTween.resume();
      }
    }
  }

  /**
   * Reset item state (for object pooling)
   */
  reset(x: number, y: number, type?: string): void {
    this.x = x;
    this.y = y;
    this.isCollected = false;
    this.isActive = true;
    
    if (type && type !== this.itemType) {
      // Change item type
      this.itemType = type;
      this.sprite.destroy();
      this.setupVisuals();
      this.setupAnimations();
    }
    
    this.sprite.setPosition(x, y);
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.setVisible(true);
  }

  /**
   * Get item state for debugging
   */
  getState(): any {
    return {
      type: this.itemType,
      position: { x: this.x, y: this.y },
      velocity: { x: this.velocityX, y: this.velocityY },
      active: this.isActive,
      collected: this.isCollected,
      value: this.value
    };
  }

  /**
   * Destroy the item
   */
  destroy(): void {
    if (this.animationTween) {
      this.animationTween.destroy();
    }
    if (this.glowTween) {
      this.glowTween.destroy();
    }
    this.sprite.destroy();
  }
}
