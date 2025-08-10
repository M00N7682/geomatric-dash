/**
 * Progress and scoring system for the runner game
 */
export class ProgressManager {
  private scene: Phaser.Scene;
  private gameState: any;
  
  // Score tracking
  private score: number = 0;
  private highScore: number = 0;
  private coins: number = 0;
  private gems: number = 0;
  private stars: number = 0;
  
  // Progress tracking
  private distance: number = 0;
  private time: number = 0;
  private level: number = 1;
  private difficulty: number = 1;
  
  // Combo system
  private combo: number = 0;
  private maxCombo: number = 0;
  private comboMultiplier: number = 1;
  private lastCollectionTime: number = 0;
  private comboTimeout: number = 3000; // 3 seconds
  
  // Achievements tracking
  private achievements: Map<string, boolean> = new Map();
  private milestones: number[] = [100, 500, 1000, 2500, 5000, 10000];
  private reachedMilestones: Set<number> = new Set();
  
  // Statistics
  private stats: {
    totalJumps: number;
    totalDashes: number;
    totalSlides: number;
    totalDeaths: number;
    totalItemsCollected: number;
    bestTime: number;
    longestCombo: number;
    fastestSpeed: number;
  } = {
    totalJumps: 0,
    totalDashes: 0,
    totalSlides: 0,
    totalDeaths: 0,
    totalItemsCollected: 0,
    bestTime: 0,
    longestCombo: 0,
    fastestSpeed: 0
  };

  constructor(scene: Phaser.Scene, gameState: any) {
    this.scene = scene;
    this.gameState = gameState;
    
    this.loadProgressData();
    console.log('📊 ProgressManager initialized');
  }

  /**
   * Load saved progress from localStorage
   */
  private loadProgressData(): void {
    try {
      const savedData = localStorage.getItem('geometricDash_progress');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.highScore = data.highScore || 0;
        this.stats = { ...this.stats, ...data.stats };
        this.achievements = new Map(data.achievements || []);
        console.log('📊 Progress data loaded');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load progress data:', error);
    }
  }

  /**
   * Save progress to localStorage
   */
  private saveProgressData(): void {
    try {
      const data = {
        highScore: this.highScore,
        stats: this.stats,
        achievements: Array.from(this.achievements.entries())
      };
      localStorage.setItem('geometricDash_progress', JSON.stringify(data));
      console.log('💾 Progress data saved');
    } catch (error) {
      console.warn('⚠️ Failed to save progress data:', error);
    }
  }

  /**
   * Update progress based on game state
   */
  update(time: number, delta: number): void {
    this.time += delta / 1000;
    
    // Update combo timeout
    if (this.combo > 0 && time - this.lastCollectionTime > this.comboTimeout) {
      this.resetCombo();
    }
    
    // Update score from distance
    const distanceScore = Math.floor(this.distance * 10);
    this.score = distanceScore + this.calculateBonusScore();
    
    // Check for new high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    
    // Update difficulty based on distance
    this.difficulty = Math.floor(this.distance / 100) + 1;
    this.level = Math.floor(this.distance / 200) + 1;
    
    // Check milestones
    this.checkMilestones();
    
    // Check achievements
    this.checkAchievements();
  }

  /**
   * Add points to score
   */
  addScore(points: number, source: string = 'general'): number {
    const bonusPoints = Math.floor(points * this.comboMultiplier);
    this.score += bonusPoints;
    
    console.log(`📊 +${bonusPoints} points from ${source} (combo x${this.comboMultiplier})`);
    return bonusPoints;
  }

  /**
   * Add distance progress
   */
  addDistance(distance: number): void {
    this.distance += distance;
    this.gameState.distance = this.distance;
  }

  /**
   * Collect an item
   */
  collectItem(itemType: string, value: number = 1): { score: number; combo: number } {
    this.lastCollectionTime = this.scene.time.now;
    this.combo++;
    this.stats.totalItemsCollected++;
    
    // Update combo multiplier
    this.comboMultiplier = Math.min(1 + (this.combo - 1) * 0.1, 5); // Max 5x multiplier
    
    // Track specific item types
    switch (itemType) {
      case 'coin':
        this.coins++;
        break;
      case 'gem':
        this.gems++;
        break;
      case 'star':
        this.stars++;
        break;
    }
    
    // Calculate score with combo
    const baseScore = this.getItemScore(itemType, value);
    const finalScore = this.addScore(baseScore, itemType);
    
    // Update max combo
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    if (this.combo > this.stats.longestCombo) {
      this.stats.longestCombo = this.combo;
    }
    
    console.log(`💎 Collected ${itemType} | Combo: ${this.combo} | Score: +${finalScore}`);
    
    return { score: finalScore, combo: this.combo };
  }

  /**
   * Record player actions for statistics
   */
  recordJump(): void {
    this.stats.totalJumps++;
    this.saveProgressData();
  }

  recordDash(): void {
    this.stats.totalDashes++;
    this.saveProgressData();
  }

  recordSlide(): void {
    this.stats.totalSlides++;
    this.saveProgressData();
  }

  /**
   * Get base score for item type
   */
  private getItemScore(itemType: string, value: number): number {
    const baseScores = {
      coin: 10,
      gem: 50,
      star: 100,
      key: 25
    };
    
    return (baseScores[itemType as keyof typeof baseScores] || 10) * value;
  }

  /**
   * Calculate bonus score from combos and achievements
   */
  private calculateBonusScore(): number {
    let bonus = 0;
    
    // Distance bonus
    bonus += Math.floor(this.distance * this.difficulty * 0.5);
    
    // Time bonus (faster completion = more points)
    if (this.distance > 0) {
      const timeEfficiency = this.distance / Math.max(this.time, 1);
      bonus += Math.floor(timeEfficiency * 10);
    }
    
    // Level completion bonus
    bonus += (this.level - 1) * 100;
    
    return bonus;
  }

  /**
   * Reset combo
   */
  resetCombo(): void {
    if (this.combo > 0) {
      console.log(`💥 Combo broken at ${this.combo}`);
    }
    this.combo = 0;
    this.comboMultiplier = 1;
  }

  /**
   * Record player action for statistics
   */
  recordAction(action: string): void {
    switch (action) {
      case 'jump':
        this.stats.totalJumps++;
        break;
      case 'dash':
        this.stats.totalDashes++;
        break;
      case 'slide':
        this.stats.totalSlides++;
        break;
      case 'death':
        this.stats.totalDeaths++;
        this.resetCombo(); // Break combo on death
        break;
    }
  }

  /**
   * Update speed record
   */
  updateSpeed(speed: number): void {
    if (speed > this.stats.fastestSpeed) {
      this.stats.fastestSpeed = speed;
    }
  }

  /**
   * Check for milestone achievements
   */
  private checkMilestones(): void {
    for (const milestone of this.milestones) {
      if (this.distance >= milestone && !this.reachedMilestones.has(milestone)) {
        this.reachedMilestones.add(milestone);
        this.unlockAchievement(`distance_${milestone}`, `Traveled ${milestone}m!`);
        
        // Milestone bonus
        this.addScore(milestone * 2, 'milestone');
      }
    }
  }

  /**
   * Check for various achievements
   */
  private checkAchievements(): void {
    // Combo achievements
    if (this.combo >= 10 && !this.achievements.has('combo_10')) {
      this.unlockAchievement('combo_10', 'Combo Master - 10 items in a row!');
    }
    
    if (this.combo >= 25 && !this.achievements.has('combo_25')) {
      this.unlockAchievement('combo_25', 'Combo Legend - 25 items in a row!');
    }
    
    // Collection achievements
    if (this.coins >= 100 && !this.achievements.has('coins_100')) {
      this.unlockAchievement('coins_100', 'Coin Collector - 100 coins!');
    }
    
    if (this.gems >= 50 && !this.achievements.has('gems_50')) {
      this.unlockAchievement('gems_50', 'Gem Hunter - 50 gems!');
    }
    
    if (this.stars >= 10 && !this.achievements.has('stars_10')) {
      this.unlockAchievement('stars_10', 'Star Seeker - 10 stars!');
    }
    
    // Survival achievements
    if (this.stats.totalDeaths === 0 && this.distance >= 500) {
      this.unlockAchievement('no_death_500', 'Perfectionist - 500m without dying!');
    }
    
    // Speed achievements
    if (this.stats.fastestSpeed >= 800 && !this.achievements.has('speed_800')) {
      this.unlockAchievement('speed_800', 'Speed Demon - Reached 800 speed!');
    }
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(id: string, description: string): void {
    if (!this.achievements.has(id)) {
      this.achievements.set(id, true);
      
      // Show achievement notification
      this.showAchievementNotification(description);
      
      // Achievement bonus score
      this.addScore(500, 'achievement');
      
      console.log(`🏆 Achievement unlocked: ${description}`);
    }
  }

  /**
   * Show achievement notification
   */
  private showAchievementNotification(description: string): void {
    // Create achievement popup
    const notification = this.scene.add.container(
      this.scene.cameras.main.centerX,
      100
    );
    notification.setDepth(3000);
    notification.setScrollFactor(0);
    
    // Background
    const bg = this.scene.add.rectangle(0, 0, 400, 80, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0xffd700);
    
    // Trophy icon
    const trophy = this.scene.add.text(-150, 0, '🏆', {
      fontSize: '32px'
    });
    trophy.setOrigin(0.5);
    
    // Achievement text
    const text = this.scene.add.text(0, -10, 'ACHIEVEMENT UNLOCKED!', {
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    
    const desc = this.scene.add.text(0, 10, description, {
      fontSize: '12px',
      color: '#ffffff'
    });
    desc.setOrigin(0.5);
    
    notification.add([bg, trophy, text, desc]);
    
    // Animation
    notification.setAlpha(0);
    notification.setScale(0.8);
    
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Auto remove after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: notification,
        alpha: 0,
        y: 50,
        duration: 300,
        onComplete: () => notification.destroy()
      });
    });
  }

  /**
   * End game and finalize progress
   */
  endGame(): void {
    // Update best time if this is a new record
    if (this.distance >= 1000 && (this.stats.bestTime === 0 || this.time < this.stats.bestTime)) {
      this.stats.bestTime = this.time;
    }
    
    // Save progress
    this.saveProgressData();
    
    console.log('🏁 Game ended, progress saved');
  }

  /**
   * Reset current session
   */
  resetSession(): void {
    this.score = 0;
    this.distance = 0;
    this.time = 0;
    this.level = 1;
    this.difficulty = 1;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.coins = 0;
    this.gems = 0;
    this.stars = 0;
    this.reachedMilestones.clear();
    
    console.log('🔄 Session progress reset');
  }

  /**
   * Get current progress state
   */
  getProgress(): any {
    return {
      score: this.score,
      highScore: this.highScore,
      distance: this.distance,
      time: this.time,
      level: this.level,
      difficulty: this.difficulty,
      combo: this.combo,
      comboMultiplier: this.comboMultiplier,
      collections: {
        coins: this.coins,
        gems: this.gems,
        stars: this.stars
      },
      stats: { ...this.stats },
      achievements: Array.from(this.achievements.entries()),
      achievementCount: this.achievements.size
    };
  }

  /**
   * Get formatted progress summary
   */
  getProgressSummary(): string {
    return `Score: ${this.score.toLocaleString()} | Distance: ${this.distance.toFixed(1)}m | Level: ${this.level} | Combo: x${this.combo}`;
  }

  /**
   * Destroy progress manager
   */
  destroy(): void {
    this.endGame();
    console.log('📊 ProgressManager destroyed');
  }
}
