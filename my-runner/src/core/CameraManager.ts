import Phaser from 'phaser';

/**
 * Camera system for dynamic following, effects, and transitions
 */
export class CameraManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private target: Phaser.GameObjects.GameObject | null = null;
  private config: any;
  
  // Camera state
  private followOffset: { x: number; y: number } = { x: 0, y: 0 };
  private shakeIntensity: number = 0;
  private zoomLevel: number = 1;
  private targetZoom: number = 1;
  
  // Effects
  private effectsQueue: any[] = [];
  private isTransitioning: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    
    // Get camera configuration
    this.config = (globalThis as any).GameConfig?.camera || {
      smoothFollow: 0.05,
      offsetX: -200,
      offsetY: 0,
      bounds: { x: 0, y: -200, width: 4000, height: 1000 },
      zoom: {
        default: 1,
        min: 0.5,
        max: 2.0,
        speed: 0.02
      }
    };

    this.setupCamera();
    console.log('📷 CameraManager initialized');
  }

  private setupCamera(): void {
    // Set camera bounds if specified
    if (this.config.bounds) {
      this.camera.setBounds(
        this.config.bounds.x,
        this.config.bounds.y,
        this.config.bounds.width,
        this.config.bounds.height
      );
    }

    // Set initial zoom
    this.zoomLevel = this.config.zoom?.default || 1;
    this.targetZoom = this.zoomLevel;
    this.camera.setZoom(this.zoomLevel);

    // Camera effects
    this.camera.setRoundPixels(true); // Crisp pixel art
  }

  /**
   * Set the target for camera to follow
   */
  setTarget(target: Phaser.GameObjects.GameObject, offsetX: number = 0, offsetY: number = 0): void {
    this.target = target;
    this.followOffset.x = offsetX || this.config.offsetX || -200;
    this.followOffset.y = offsetY || this.config.offsetY || 0;
    
    console.log(`📷 Camera following target with offset (${this.followOffset.x}, ${this.followOffset.y})`);
  }

  /**
   * Update camera following and effects
   */
  update(_time: number, delta: number): void {
    this.updateFollow(delta);
    this.updateZoom(delta);
    this.updateEffects(delta);
    this.processEffectsQueue();
  }

  private updateFollow(delta: number): void {
    if (!this.target) return;

    const smoothness = this.config.smoothFollow || 0.05;
    const deltaSeconds = delta / 1000;
    
    // Calculate target position
    const targetX = (this.target as any).x + this.followOffset.x;
    const targetY = (this.target as any).y + this.followOffset.y;
    
    // Smooth interpolation to target
    const currentX = this.camera.scrollX;
    const currentY = this.camera.scrollY;
    
    const newX = Phaser.Math.Linear(currentX, targetX, smoothness * deltaSeconds * 60);
    const newY = Phaser.Math.Linear(currentY, targetY, smoothness * deltaSeconds * 60);
    
    this.camera.setScroll(newX, newY);
  }

  private updateZoom(delta: number): void {
    if (Math.abs(this.zoomLevel - this.targetZoom) > 0.001) {
      const zoomSpeed = this.config.zoom?.speed || 0.02;
      const deltaSeconds = delta / 1000;
      
      this.zoomLevel = Phaser.Math.Linear(
        this.zoomLevel,
        this.targetZoom,
        zoomSpeed * deltaSeconds * 60
      );
      
      this.camera.setZoom(this.zoomLevel);
    }
  }

  private updateEffects(delta: number): void {
    // Update shake effect
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      
      this.camera.setScroll(
        this.camera.scrollX + shakeX,
        this.camera.scrollY + shakeY
      );
      
      // Decrease shake intensity
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 0.01);
    }
  }

  private processEffectsQueue(): void {
    if (this.effectsQueue.length > 0 && !this.isTransitioning) {
      const effect = this.effectsQueue.shift();
      this.executeEffect(effect);
    }
  }

  /**
   * Add screen shake effect
   */
  shake(intensity: number = 10, duration: number = 500): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    
    // Auto-stop shake after duration
    this.scene.time.delayedCall(duration, () => {
      this.shakeIntensity = 0;
    });
    
    console.log(`📷 Camera shake: intensity ${intensity}, duration ${duration}ms`);
  }

  /**
   * Set zoom level with animation
   */
  setZoom(zoom: number, immediate: boolean = false): void {
    const minZoom = this.config.zoom?.min || 0.5;
    const maxZoom = this.config.zoom?.max || 2.0;
    
    this.targetZoom = Phaser.Math.Clamp(zoom, minZoom, maxZoom);
    
    if (immediate) {
      this.zoomLevel = this.targetZoom;
      this.camera.setZoom(this.zoomLevel);
    }
    
    console.log(`📷 Camera zoom set to ${this.targetZoom}`);
  }

  /**
   * Flash effect
   */
  flash(color: number = 0xffffff, duration: number = 200): void {
    this.camera.flash(duration, 
      (color >> 16) & 0xff,  // Red
      (color >> 8) & 0xff,   // Green
      color & 0xff           // Blue
    );
    
    console.log(`📷 Camera flash: color 0x${color.toString(16)}, duration ${duration}ms`);
  }

  /**
   * Fade effect
   */
  fade(duration: number = 500, color: number = 0x000000, fadeIn: boolean = false): Promise<void> {
    return new Promise((resolve) => {
      const fadeMethod = fadeIn ? this.camera.fadeIn : this.camera.fadeOut;
      
      fadeMethod.call(this.camera, duration,
        (color >> 16) & 0xff,  // Red
        (color >> 8) & 0xff,   // Green
        color & 0xff,          // Blue
        (_camera: any, progress: number) => {
          if (progress === 1) {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Pan to specific position
   */
  panTo(x: number, y: number, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      this.isTransitioning = true;
      
      this.scene.tweens.add({
        targets: this.camera,
        scrollX: x,
        scrollY: y,
        duration: duration,
        ease: 'Power2',
        onComplete: () => {
          this.isTransitioning = false;
          resolve();
        }
      });
    });
  }

  /**
   * Stop following target
   */
  stopFollowing(): void {
    this.target = null;
    console.log('📷 Camera stopped following');
  }

  /**
   * Look ahead in direction of movement
   */
  lookAhead(velocity: { x: number; y: number }, factor: number = 0.3): void {
    if (!this.target) return;
    
    this.followOffset.x = (this.config.offsetX || -200) + velocity.x * factor;
    this.followOffset.y = (this.config.offsetY || 0) + velocity.y * factor;
  }

  /**
   * Add effect to queue
   */
  queueEffect(effect: any): void {
    this.effectsQueue.push(effect);
  }

  private executeEffect(effect: any): void {
    switch (effect.type) {
      case 'shake':
        this.shake(effect.intensity, effect.duration);
        break;
        
      case 'zoom':
        this.setZoom(effect.zoom, effect.immediate);
        break;
        
      case 'flash':
        this.flash(effect.color, effect.duration);
        break;
        
      case 'fade':
        this.fade(effect.duration, effect.color, effect.fadeIn);
        break;
        
      case 'pan':
        this.panTo(effect.x, effect.y, effect.duration);
        break;
    }
  }

  /**
   * Reset camera to default state
   */
  reset(): void {
    this.camera.setScroll(0, 0);
    this.setZoom(this.config.zoom?.default || 1, true);
    this.shakeIntensity = 0;
    this.effectsQueue = [];
    this.isTransitioning = false;
    
    console.log('📷 Camera reset to default state');
  }

  /**
   * Get current camera state
   */
  getState(): any {
    return {
      position: { x: this.camera.scrollX, y: this.camera.scrollY },
      zoom: this.zoomLevel,
      targetZoom: this.targetZoom,
      following: this.target !== null,
      shaking: this.shakeIntensity > 0,
      transitioning: this.isTransitioning
    };
  }

  /**
   * Destroy camera manager
   */
  destroy(): void {
    this.effectsQueue = [];
    this.target = null;
    console.log('📷 CameraManager destroyed');
  }
}
