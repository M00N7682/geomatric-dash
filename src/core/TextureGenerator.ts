import Phaser from 'phaser';

/**
 * Utility for creating particle textures and visual assets
 */
export class TextureGenerator {
  
  /**
   * Generate a pixel texture for particles
   */
  static createPixelTexture(scene: Phaser.Scene, key: string = 'pixel', size: number = 4, color: number = 0xffffff): void {
    if (scene.textures.exists(key)) return;
    
    const graphics = scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(0, 0, size, size);
    
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    
    console.log(`🎨 Generated texture '${key}' ${size}x${size} color 0x${color.toString(16)}`);
  }

  /**
   * Generate various particle textures
   */
  static generateParticleTextures(scene: Phaser.Scene): void {
    this.createPixelTexture(scene, 'pixel', 4, 0xffffff);
    this.createPixelTexture(scene, 'spark', 6, 0xffff00);
    this.createPixelTexture(scene, 'dust', 3, 0x888888);
    
    // Create circle texture for smooth particles
    this.createCircleTexture(scene, 'circle', 8, 0xffffff);
    
    console.log('🎨 All particle textures generated');
  }

  /**
   * Create circle texture
   */
  static createCircleTexture(scene: Phaser.Scene, key: string, radius: number, color: number): void {
    if (scene.textures.exists(key)) return;
    
    const graphics = scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillCircle(radius, radius, radius);
    
    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();
  }

  /**
   * Create gradient texture
   */
  static createGradientTexture(scene: Phaser.Scene, key: string, width: number, height: number, colors: number[]): void {
    if (scene.textures.exists(key)) return;
    
    const canvas = scene.add.renderTexture(0, 0, width, height);
    const graphics = scene.add.graphics();
    
    // Create gradient
    for (let i = 0; i < colors.length - 1; i++) {
      const progress = i / (colors.length - 1);
      const nextProgress = (i + 1) / (colors.length - 1);
      
      graphics.fillGradientStyle(colors[i], colors[i], colors[i + 1], colors[i + 1]);
      graphics.fillRect(0, progress * height, width, (nextProgress - progress) * height);
    }
    
    canvas.draw(graphics);
    canvas.saveTexture(key);
    
    graphics.destroy();
    canvas.destroy();
  }
}
