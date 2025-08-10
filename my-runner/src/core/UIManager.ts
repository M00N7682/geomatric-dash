import Phaser from 'phaser';

/**
 * UI Manager for displaying game state, progress, and HUD elements
 */
export class UIManager {
  private scene: Phaser.Scene;
  private progressManager: any;
  
  // UI elements
  private hudContainer!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  
  // Collection counters
  private coinCountText!: Phaser.GameObjects.Text;
  private gemCountText!: Phaser.GameObjects.Text;
  private starCountText!: Phaser.GameObjects.Text;
  
  // Progress bars
  private healthBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  
  // Floating UI elements
  private floatingTexts: Phaser.GameObjects.Text[] = [];
  
  // UI configuration
  private config: any;

  constructor(scene: Phaser.Scene, progressManager: any) {
    this.scene = scene;
    this.progressManager = progressManager;
    
    this.config = (globalThis as any).GameConfig?.ui || {
      fontSize: {
        small: '14px',
        medium: '18px',
        large: '24px'
      },
      colors: {
        primary: '#ffffff',
        secondary: '#888888',
        score: '#44ff44',
        combo: '#ffaa00',
        danger: '#ff4444'
      }
    };

    this.createHUD();
    console.log('🖥️ UIManager initialized');
  }

  /**
   * Create the main HUD elements
   */
  private createHUD(): void {
    // Create main HUD container
    this.hudContainer = this.scene.add.container(0, 0);
    this.hudContainer.setDepth(1000);
    this.hudContainer.setScrollFactor(0);

    // Top bar background
    const topBarBg = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      40,
      this.scene.cameras.main.width,
      80,
      0x000000,
      0.3
    );
    this.hudContainer.add(topBarBg);

    this.createScoreUI();
    this.createProgressUI();
    this.createCollectionUI();
    this.createStatusUI();
    this.createProgressBars();
  }

  /**
   * Create score and distance UI
   */
  private createScoreUI(): void {
    // Score display
    const scoreLabel = this.scene.add.text(50, 20, 'SCORE', {
      fontSize: this.config.fontSize.small,
      color: this.config.colors.secondary,
      fontFamily: 'Arial'
    });
    
    this.scoreText = this.scene.add.text(50, 35, '0', {
      fontSize: this.config.fontSize.large,
      color: this.config.colors.score,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    });

    // Distance display
    const distanceLabel = this.scene.add.text(200, 20, 'DISTANCE', {
      fontSize: this.config.fontSize.small,
      color: this.config.colors.secondary,
      fontFamily: 'Arial'
    });
    
    this.distanceText = this.scene.add.text(200, 35, '0.0m', {
      fontSize: this.config.fontSize.medium,
      color: this.config.colors.primary,
      fontFamily: 'Arial'
    });

    this.hudContainer.add([scoreLabel, this.scoreText, distanceLabel, this.distanceText]);
  }

  /**
   * Create level and combo UI
   */
  private createProgressUI(): void {
    // Level display
    const levelLabel = this.scene.add.text(350, 20, 'LEVEL', {
      fontSize: this.config.fontSize.small,
      color: this.config.colors.secondary,
      fontFamily: 'Arial'
    });
    
    this.levelText = this.scene.add.text(350, 35, '1', {
      fontSize: this.config.fontSize.medium,
      color: this.config.colors.primary,
      fontFamily: 'Arial'
    });

    // Combo display
    const comboLabel = this.scene.add.text(450, 20, 'COMBO', {
      fontSize: this.config.fontSize.small,
      color: this.config.colors.secondary,
      fontFamily: 'Arial'
    });
    
    this.comboText = this.scene.add.text(450, 35, 'x1', {
      fontSize: this.config.fontSize.medium,
      color: this.config.colors.combo,
      fontFamily: 'Arial'
    });

    this.hudContainer.add([levelLabel, this.levelText, comboLabel, this.comboText]);
  }

  /**
   * Create collection counters
   */
  private createCollectionUI(): void {
    const startX = 600;
    const spacing = 80;

    // Coins
    const coinIcon = this.scene.add.text(startX, 25, '🪙', { fontSize: '20px' });
    this.coinCountText = this.scene.add.text(startX + 25, 30, '0', {
      fontSize: this.config.fontSize.small,
      color: '#ffd700',
      fontFamily: 'Arial'
    });

    // Gems  
    const gemIcon = this.scene.add.text(startX + spacing, 25, '💎', { fontSize: '20px' });
    this.gemCountText = this.scene.add.text(startX + spacing + 25, 30, '0', {
      fontSize: this.config.fontSize.small,
      color: '#9966ff',
      fontFamily: 'Arial'
    });

    // Stars
    const starIcon = this.scene.add.text(startX + spacing * 2, 25, '⭐', { fontSize: '20px' });
    this.starCountText = this.scene.add.text(startX + spacing * 2 + 25, 30, '0', {
      fontSize: this.config.fontSize.small,
      color: '#ffff00',
      fontFamily: 'Arial'
    });

    this.hudContainer.add([
      coinIcon, this.coinCountText,
      gemIcon, this.gemCountText,
      starIcon, this.starCountText
    ]);
  }

  /**
   * Create status indicators
   */
  private createStatusUI(): void {
    const rightX = this.scene.cameras.main.width - 150;

    // Lives display
    const livesLabel = this.scene.add.text(rightX, 20, 'LIVES', {
      fontSize: this.config.fontSize.small,
      color: this.config.colors.secondary,
      fontFamily: 'Arial'
    });
    
    this.livesText = this.scene.add.text(rightX, 35, '♥♥♥', {
      fontSize: this.config.fontSize.medium,
      color: this.config.colors.danger,
      fontFamily: 'Arial'
    });

    // Speed display
    const speedLabel = this.scene.add.text(rightX, 55, 'SPEED', {
      fontSize: this.config.fontSize.small,
      color: this.config.colors.secondary,
      fontFamily: 'Arial'
    });
    
    this.speedText = this.scene.add.text(rightX, 70, '320', {
      fontSize: this.config.fontSize.small,
      color: this.config.colors.primary,
      fontFamily: 'Arial'
    });

    this.hudContainer.add([livesLabel, this.livesText, speedLabel, this.speedText]);
  }

  /**
   * Create progress bars
   */
  private createProgressBars(): void {
    // Health bar
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(1001);
    this.healthBar.setScrollFactor(0);

    // Progress bar for level completion
    this.progressBar = this.scene.add.graphics();
    this.progressBar.setDepth(1001);
    this.progressBar.setScrollFactor(0);
  }

  /**
   * Update UI elements with current game state
   */
  update(gameState: any): void {
    const progress = this.progressManager.getProgress();

    // Update score and distance
    this.scoreText.setText(progress.score.toLocaleString());
    this.distanceText.setText(`${progress.distance.toFixed(1)}m`);
    
    // Update level and combo
    this.levelText.setText(progress.level.toString());
    
    if (progress.combo > 1) {
      this.comboText.setText(`x${progress.combo}`);
      this.comboText.setColor(this.config.colors.combo);
      
      // Pulse effect for high combos
      if (progress.combo > 5) {
        this.comboText.setScale(1 + Math.sin(this.scene.time.now * 0.01) * 0.1);
      }
    } else {
      this.comboText.setText('x1');
      this.comboText.setColor(this.config.colors.secondary);
      this.comboText.setScale(1);
    }

    // Update collection counters
    this.coinCountText.setText(progress.collections.coins.toString());
    this.gemCountText.setText(progress.collections.gems.toString());
    this.starCountText.setText(progress.collections.stars.toString());

    // Update lives
    const heartsText = '♥'.repeat(Math.max(0, gameState.lives)) + 
                      '♡'.repeat(Math.max(0, 3 - gameState.lives));
    this.livesText.setText(heartsText);

    // Update speed
    this.speedText.setText(Math.floor(gameState.speed).toString());

    // Update progress bars
    this.updateProgressBars(gameState, progress);
  }

  /**
   * Update progress bars
   */
  private updateProgressBars(gameState: any, progress: any): void {
    // Clear previous drawings
    this.healthBar.clear();
    this.progressBar.clear();

    // Health bar (based on lives)
    const healthPercent = gameState.lives / 3;
    const healthBarWidth = 100;
    const healthBarHeight = 6;
    const healthBarX = this.scene.cameras.main.width - 150;
    const healthBarY = 90;

    // Health bar background
    this.healthBar.fillStyle(0x444444);
    this.healthBar.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health bar fill
    const healthColor = healthPercent > 0.6 ? 0x44ff44 : 
                       healthPercent > 0.3 ? 0xffaa00 : 0xff4444;
    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

    // Level progress bar
    const levelProgress = (progress.distance % 200) / 200; // Every 200m is a level
    const progressBarWidth = 200;
    const progressBarHeight = 4;
    const progressBarX = 350;
    const progressBarY = 55;

    // Progress bar background
    this.progressBar.fillStyle(0x444444);
    this.progressBar.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // Progress bar fill
    this.progressBar.fillStyle(0x44aaff);
    this.progressBar.fillRect(progressBarX, progressBarY, progressBarWidth * levelProgress, progressBarHeight);
  }

  /**
   * Show floating score text
   */
  showFloatingScore(x: number, y: number, score: number, combo: number = 1): void {
    const color = combo > 1 ? this.config.colors.combo : this.config.colors.score;
    const text = combo > 1 ? `+${score} x${combo}!` : `+${score}`;
    
    const floatingText = this.scene.add.text(x, y, text, {
      fontSize: combo > 5 ? this.config.fontSize.large : this.config.fontSize.medium,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    floatingText.setOrigin(0.5);
    floatingText.setDepth(2000);
    
    // Animation
    this.scene.tweens.add({
      targets: floatingText,
      y: y - 40,
      alpha: 0,
      scale: combo > 5 ? 1.5 : 1.2,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
        const index = this.floatingTexts.indexOf(floatingText);
        if (index > -1) {
          this.floatingTexts.splice(index, 1);
        }
      }
    });
    
    this.floatingTexts.push(floatingText);
  }

  /**
   * Show combo break notification
   */
  showComboBreak(combo: number): void {
    if (combo <= 1) return;
    
    const notification = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 50,
      `COMBO BROKEN!\n${combo} items`,
      {
        fontSize: this.config.fontSize.large,
        color: this.config.colors.danger,
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    
    notification.setOrigin(0.5);
    notification.setDepth(2500);
    notification.setScrollFactor(0);
    notification.setAlpha(0);
    
    // Animation
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: notification,
          alpha: 0,
          y: notification.y - 30,
          duration: 500,
          delay: 500,
          onComplete: () => notification.destroy()
        });
      }
    });
  }

  /**
   * Show level up notification
   */
  showLevelUp(level: number): void {
    const notification = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      `LEVEL ${level}!`,
      {
        fontSize: '48px',
        color: '#44aaff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    
    notification.setOrigin(0.5);
    notification.setDepth(2500);
    notification.setScrollFactor(0);
    notification.setScale(0);
    
    // Animation
    this.scene.tweens.add({
      targets: notification,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: notification,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 500,
          delay: 1000,
          onComplete: () => notification.destroy()
        });
      }
    });
  }

  /**
   * Toggle HUD visibility
   */
  toggleHUD(visible: boolean): void {
    this.hudContainer.setVisible(visible);
  }

  /**
   * Show floating text for score, combos, etc.
   */
  showFloatingText(x: number, y: number, text: string, color: string = '#ffffff'): void {
    const floatingText = this.scene.add.text(x, y, text, {
      fontSize: '16px',
      color: color,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add to floating texts array
    this.floatingTexts.push(floatingText);

    // Animate floating text
    this.scene.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
        const index = this.floatingTexts.indexOf(floatingText);
        if (index > -1) {
          this.floatingTexts.splice(index, 1);
        }
      }
    });
  }

  /**
   * Show combo notification
   */
  showComboText(combo: number): void {
    if (combo <= 1) return;

    const comboText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY - 100,
      `COMBO x${combo}!`,
      {
        fontSize: combo > 10 ? '32px' : '24px',
        color: combo > 10 ? '#ff0080' : '#ffff00',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Add to floating texts array
    this.floatingTexts.push(comboText);

    // Scale animation
    comboText.setScale(0);
    this.scene.tweens.add({
      targets: comboText,
      scale: 1.2,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: comboText,
          alpha: 0,
          y: comboText.y - 30,
          duration: 800,
          delay: 500,
          onComplete: () => {
            comboText.destroy();
            const index = this.floatingTexts.indexOf(comboText);
            if (index > -1) {
              this.floatingTexts.splice(index, 1);
            }
          }
        });
      }
    });
  }

  /**
   * Get HUD visibility state
   */
  isHUDVisible(): boolean {
    return this.hudContainer.visible;
  }

  /**
   * Destroy UI manager
   */
  destroy(): void {
    // Clean up floating texts
    this.floatingTexts.forEach(text => text.destroy());
    this.floatingTexts = [];
    
    // Destroy main container
    this.hudContainer.destroy();
    
    // Destroy graphics
    this.healthBar.destroy();
    this.progressBar.destroy();
    
    console.log('🖥️ UIManager destroyed');
  }
}
