import Phaser from 'phaser';
import type { Bounds } from '../core/types';

/**
 * Player entity with physics, movement, and state management
 */
export class Player {
  public sprite!: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private config: any;
  
  // Position and physics
  public x: number = 0;
  public y: number = 0;
  public velocityX: number = 0;
  public velocityY: number = 0;
  
  // Movement state
  private onGround: boolean = true;
  private canJump: boolean = true;
  private canDoubleJump: boolean = false;
  private jumpCharges: number = 0;
  
  // Animation state
  private rotationSpeed: number = 0;
  private invulnerable: boolean = false;
  private invulnerabilityTimer: number = 0;
  
  // Abilities - Enable all abilities by default for testing
  private abilities: {
    doubleJump: boolean;
    dash: boolean;
    slide: boolean;
    giant: boolean;
  } = {
    doubleJump: true,
    dash: true,
    slide: true,
    giant: false
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    // Get configuration
    this.config = (globalThis as any).gameConfig?.player || {
      hitbox: { w: 28, h: 42 },
      jump: { vy0: -720, airControl: 0.15 }
    };

    this.setupVisuals();
    
    console.log('🤖 Player created with config:', this.config);
  }

  private setupVisuals(): void {
    console.log('🎨 Setting up player visuals at:', this.x, this.y);
    
    // Create container for all visual elements
    this.sprite = this.scene.add.container(this.x, this.y);
    
    // Main sprite (cube with geometric design) - Make it very visible
    const mainRect = this.scene.add.rectangle(0, 0, this.config.hitbox.w, this.config.hitbox.h, 0x44aaff);
    mainRect.setStrokeStyle(4, 0xffffff);
    
    // Add geometric details
    const innerSquare = this.scene.add.rectangle(0, 0, this.config.hitbox.w - 8, this.config.hitbox.h - 8, 0x88ccff);
    innerSquare.setStrokeStyle(2, 0x44aaff);
    
    // Add corner accents
    const corners = [
      [-8, -8], [8, -8], [-8, 8], [8, 8]
    ];
    
    corners.forEach(([offsetX, offsetY]) => {
      const corner = this.scene.add.rectangle(offsetX, offsetY, 6, 6, 0xffffff);
      this.sprite.add(corner);
    });
    
    this.sprite.add([mainRect, innerSquare]);
    
    // Ensure maximum visibility
    this.sprite.setVisible(true);
    this.sprite.setDepth(200); // Higher depth than test player
    this.sprite.setAlpha(1);
    
    console.log('🎨 Player sprite created with depth 200');
    
    // Idle floating animation - less subtle for debugging
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Update player physics and state
   */
  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    
    this.updatePhysics(deltaSeconds);
    this.updateAnimations(deltaSeconds);
    this.updateInvulnerability(deltaSeconds);
    this.updatePosition();
  }

  private updatePhysics(deltaSeconds: number): void {
    // Simple gravity
    const gravity = (globalThis as any).gameConfig?.game?.gravity || 2200;
    if (!this.onGround) {
      this.velocityY += gravity * deltaSeconds;
    }
    
    // Ground collision (simple)
    const groundY = 500; // Temporary ground level
    if (this.y + this.config.hitbox.h / 2 >= groundY) {
      this.y = groundY - this.config.hitbox.h / 2;
      this.velocityY = 0;
      this.onGround = true;
      this.canJump = true;
      
      if (this.abilities.doubleJump) {
        this.jumpCharges = 1;
        this.canDoubleJump = true;
      }
    } else {
      this.onGround = false;
    }

    // Apply air control
    if (!this.onGround && this.velocityX !== 0) {
      const airControl = this.config.jump.airControl || 0.15;
      this.velocityX *= (1 - airControl * deltaSeconds);
    }
    
    // Update position based on velocity
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;
  }

  private updateAnimations(deltaSeconds: number): void {
    // Rotation while jumping
    if (!this.onGround) {
      this.rotationSpeed += deltaSeconds * 8;
      this.sprite.setRotation(this.rotationSpeed);
    } else {
      // Snap to nearest 90-degree angle when landing
      const targetRotation = Math.round(this.sprite.rotation / (Math.PI / 2)) * (Math.PI / 2);
      this.sprite.setRotation(targetRotation);
      this.rotationSpeed = targetRotation;
    }

    // Scale effects
    if (this.abilities.giant) {
      this.sprite.setScale(1.5);
    } else {
      this.sprite.setScale(1);
    }
  }

  private updateInvulnerability(deltaSeconds: number): void {
    if (this.invulnerable) {
      this.invulnerabilityTimer -= deltaSeconds;
      
      // Flashing effect
      const alpha = Math.sin(this.invulnerabilityTimer * 20) * 0.5 + 0.5;
      this.sprite.setAlpha(alpha);
      
      if (this.invulnerabilityTimer <= 0) {
        this.invulnerable = false;
        this.sprite.setAlpha(1);
      }
    }
  }

  private updatePosition(): void {
    this.sprite.setPosition(this.x, this.y);
  }

  /**
   * Attempt to jump
   */
  jump(): boolean {
    console.log('🦘 Jump attempted - onGround:', this.onGround, 'canJump:', this.canJump);
    
    // Always allow jump if on ground (simplified logic for debugging)
    if (this.onGround) {
      this.performJump();
      this.onGround = false; // Make sure player leaves ground
      console.log('🦘 Jump executed successfully!');
      return true;
    } else if (this.canDoubleJump && this.jumpCharges > 0) {
      this.performJump();
      this.jumpCharges--;
      this.canDoubleJump = this.jumpCharges > 0;
      console.log('🦘 Double jump executed!');
      return true;
    }
    
    console.log('🦘 Jump failed - conditions not met');
    return false;
  }

  private performJump(): void {
    const jumpVelocity = this.config.jump.vy0 || -720;
    this.velocityY = jumpVelocity;
    
    // Jump animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true
    });
    
    console.log('🦘 Player jumped!');
  }

  /**
   * Perform dash ability
   */
  dash(direction: { x: number; y: number }): boolean {
    if (!this.abilities.dash) return false;
    
    const dashForce = 800;
    this.velocityX = direction.x * dashForce;
    this.velocityY = direction.y * dashForce;
    
    // Dash visual effect
    this.makeInvulnerable(0.5); // Brief invulnerability during dash
    
    console.log('💨 Player dashed!');
    return true;
  }

  /**
   * Slide/crouch action
   */
  slide(): boolean {
    if (!this.onGround || !this.abilities.slide) return false;
    
    // Slide animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.6,
      duration: 300,
      onComplete: () => {
        this.sprite.setScale(1);
      }
    });
    
    console.log('⬇️ Player sliding!');
    return true;
  }

  /**
   * Make player temporarily invulnerable
   */
  makeInvulnerable(duration: number): void {
    this.invulnerable = true;
    this.invulnerabilityTimer = duration;
  }

  /**
   * Enable/disable abilities
   */
  setAbility(ability: keyof typeof this.abilities, enabled: boolean): void {
    this.abilities[ability] = enabled;
    console.log(`🔧 Ability ${ability}: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get collision bounds for AABB detection
   */
  getCollisionBounds(): Bounds {
    return {
      x: this.x - this.config.hitbox.w / 2,
      y: this.y - this.config.hitbox.h / 2,
      width: this.config.hitbox.w,
      height: this.config.hitbox.h
    };
  }

  /**
   * Handle collision with another entity
   */
  onCollision(_other: any): void {
    if (this.invulnerable) return;
    
    console.log('💥 Player collision!');
    // This would trigger damage/death logic
  }

  /**
   * Reset player state
   */
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.canJump = true;
    this.canDoubleJump = false;
    this.jumpCharges = 0;
    this.invulnerable = false;
    this.sprite.setAlpha(1);
    this.sprite.setRotation(0);
    this.rotationSpeed = 0;
    
    // Reset abilities to default
    Object.keys(this.abilities).forEach(key => {
      this.abilities[key as keyof typeof this.abilities] = false;
    });
    
    this.updatePosition();
    console.log('🔄 Player reset');
  }

  /**
   * Get current state for debugging
   */
  getState(): any {
    return {
      position: { x: this.x, y: this.y },
      velocity: { x: this.velocityX, y: this.velocityY },
      onGround: this.onGround,
      canJump: this.canJump,
      abilities: { ...this.abilities },
      invulnerable: this.invulnerable
    };
  }

  /**
   * Destroy the player
   */
  destroy(): void {
    this.sprite.destroy();
  }
}
