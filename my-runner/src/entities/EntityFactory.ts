import Phaser from 'phaser';
import { Player } from './Player';
import { Obstacle } from './Obstacle';
import { Item } from './Item';

/**
 * Factory class for creating entities from patterns.json data
 */
export class EntityFactory {
  private scene: Phaser.Scene;
  private patterns: any;
  private currentPattern: any = null;
  private patternIndex: number = 0;
  
  // Entity pools for performance
  private obstaclePool: Obstacle[] = [];
  private itemPool: Item[] = [];
  private activeObstacles: Obstacle[] = [];
  private activeItems: Item[] = [];
  
  // Player reference
  private player: Player | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.patterns = (globalThis as any).Patterns || [];
    
    this.initializePools();
    console.log('🏭 EntityFactory initialized with', this.patterns.length, 'patterns');
  }

  /**
   * Initialize object pools for better performance
   */
  private initializePools(): void {
    // Pre-create obstacle pool
    for (let i = 0; i < 20; i++) {
      const obstacle = new Obstacle(this.scene, -1000, -1000, 'spike');
      obstacle.setActive(false);
      this.obstaclePool.push(obstacle);
    }
    
    // Pre-create item pool
    for (let i = 0; i < 30; i++) {
      const item = new Item(this.scene, -1000, -1000, 'coin');
      item.setActive(false);
      this.itemPool.push(item);
    }
    
    console.log('📦 Initialized pools: 20 obstacles, 30 items');
  }

  /**
   * Create and return a player entity
   */
  createPlayer(x: number, y: number): Player {
    this.player = new Player(this.scene, x, y);
    console.log('🤖 Player created by EntityFactory');
    return this.player;
  }

  /**
   * Get pattern by difficulty level
   */
  getPatternsByDifficulty(difficulty: number): any[] {
    if (!this.patterns || this.patterns.length === 0) {
      console.warn('⚠️ No patterns loaded');
      return [];
    }
    
    return this.patterns.filter((pattern: any) => {
      const patternDiff = pattern.difficulty || 1;
      return patternDiff <= difficulty;
    });
  }

  /**
   * Select next pattern based on progression
   */
  selectNextPattern(difficulty: number, distance: number): any {
    const availablePatterns = this.getPatternsByDifficulty(difficulty);
    
    if (availablePatterns.length === 0) {
      console.warn('⚠️ No patterns available for difficulty', difficulty);
      return this.createDefaultPattern();
    }
    
    // Weight patterns by difficulty and distance
    const weightedPatterns = availablePatterns.map((pattern: any) => ({
      pattern,
      weight: this.calculatePatternWeight(pattern, difficulty, distance)
    }));
    
    // Select pattern based on weights
    const totalWeight = weightedPatterns.reduce((sum: number, wp: any) => sum + wp.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const wp of weightedPatterns) {
      random -= wp.weight;
      if (random <= 0) {
        this.currentPattern = wp.pattern;
        return wp.pattern;
      }
    }
    
    // Fallback
    this.currentPattern = availablePatterns[0];
    return this.currentPattern;
  }

  /**
   * Calculate pattern weight for selection
   */
  private calculatePatternWeight(pattern: any, difficulty: number, distance: number): number {
    let weight = 1;
    
    // Base weight on pattern difficulty match
    const difficultyMatch = Math.abs((pattern.difficulty || 1) - difficulty);
    weight *= Math.max(0.1, 1 - difficultyMatch * 0.3);
    
    // Increase weight for patterns we haven't used recently
    // (This would need pattern usage tracking in a real implementation)
    
    // Boost weight based on distance milestones
    if (distance > 1000 && pattern.type === 'challenge') {
      weight *= 1.5;
    }
    
    return weight;
  }

  /**
   * Spawn entities from pattern data
   */
  spawnFromPattern(pattern: any, offsetX: number = 0, offsetY: number = 0): void {
    if (!pattern) {
      console.warn('⚠️ No pattern provided for spawning');
      return;
    }
    
    console.log('🌟 Spawning pattern:', pattern.name || 'unnamed');
    
    // Spawn obstacles
    if (pattern.obstacles) {
      pattern.obstacles.forEach((obsData: any) => {
        this.spawnObstacle(
          obsData.type || 'spike',
          offsetX + (obsData.x || 0),
          offsetY + (obsData.y || 0),
          obsData
        );
      });
    }
    
    // Spawn items
    if (pattern.items) {
      pattern.items.forEach((itemData: any) => {
        this.spawnItem(
          itemData.type || 'coin',
          offsetX + (itemData.x || 0),
          offsetY + (itemData.y || 0),
          itemData
        );
      });
    }
    
    // Handle special pattern properties
    if (pattern.movement) {
      this.applyPatternMovement(pattern.movement, offsetX, offsetY);
    }
  }

  /**
   * Spawn an obstacle using object pooling
   */
  spawnObstacle(type: string, x: number, y: number, data: any = {}): Obstacle | null {
    // Try to get from pool
    let obstacle = this.obstaclePool.find(obs => !obs.isActive);
    
    if (!obstacle) {
      // Create new if pool is empty
      obstacle = new Obstacle(this.scene, x, y, type);
      console.log('🆕 Created new obstacle (pool full)');
    } else {
      // Reset and reuse
      obstacle.x = x;
      obstacle.y = y;
      obstacle.obstacleType = type;
      obstacle.setActive(true);
    }
    
    // Apply data properties
    if (data.movement) {
      obstacle.setMovementPattern(data.movement);
    }
    
    if (data.velocity) {
      obstacle.setVelocity(data.velocity.x || 0, data.velocity.y || 0);
    }
    
    this.activeObstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Spawn an item using object pooling
   */
  spawnItem(type: string, x: number, y: number, data: any = {}): Item | null {
    // Try to get from pool
    let item = this.itemPool.find(itm => !itm.isActive);
    
    if (!item) {
      // Create new if pool is empty
      item = new Item(this.scene, x, y, type);
      console.log('🆕 Created new item (pool full)');
    } else {
      // Reset and reuse
      item.reset(x, y, type);
    }
    
    // Apply data properties
    if (data.velocity) {
      item.setVelocity(data.velocity.x || 0, data.velocity.y || 0);
    }
    
    if (data.value) {
      item.value = data.value;
    }
    
    this.activeItems.push(item);
    return item;
  }

  /**
   * Apply movement patterns to recently spawned entities
   */
  private applyPatternMovement(movement: any, offsetX: number, _offsetY: number): void {
    if (movement.type === 'wave') {
      // Apply wave movement to all active obstacles in this pattern
      const recentObstacles = this.activeObstacles.slice(-10); // Last 10 obstacles
      
      recentObstacles.forEach((obstacle, index) => {
        this.scene.tweens.add({
          targets: obstacle,
          y: obstacle.y + Math.sin((offsetX + index * 50) * 0.01) * (movement.amplitude || 50),
          duration: movement.duration || 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }
  }

  /**
   * Update all active entities
   */
  update(time: number, delta: number): void {
    // Update active obstacles
    this.activeObstacles.forEach(obstacle => {
      obstacle.update(time, delta);
    });
    
    // Update active items
    this.activeItems.forEach(item => {
      item.update(time, delta);
    });
    
    // Clean up off-screen entities
    this.cleanupOffScreenEntities();
  }

  /**
   * Clean up entities that are off-screen
   */
  private cleanupOffScreenEntities(): void {
    const screenLeft = -200; // Buffer zone
    
    // Clean up obstacles
    this.activeObstacles = this.activeObstacles.filter(obstacle => {
      if (obstacle.x < screenLeft) {
        obstacle.setActive(false);
        return false;
      }
      return true;
    });
    
    // Clean up items
    this.activeItems = this.activeItems.filter(item => {
      if (item.x < screenLeft || item.isCollected) {
        item.setActive(false);
        return false;
      }
      return true;
    });
  }

  /**
   * Check collisions between player and all entities
   */
  checkCollisions(): { obstacles: Obstacle[], items: Item[] } {
    if (!this.player) return { obstacles: [], items: [] };
    
    const playerBounds = this.player.getCollisionBounds();
    const collisions: { obstacles: Obstacle[], items: Item[] } = { obstacles: [], items: [] };
    
    // Check obstacle collisions
    for (const obstacle of this.activeObstacles) {
      if (obstacle.checkCollision(playerBounds)) {
        collisions.obstacles.push(obstacle);
      }
    }
    
    // Check item collisions
    for (const item of this.activeItems) {
      if (item.checkCollision(playerBounds)) {
        collisions.items.push(item);
      }
    }
    
    return collisions;
  }

  /**
   * Process collision effects
   */
  processCollisions(): { playerHit: boolean, itemsCollected: any[] } {
    const collisions = this.checkCollisions();
    let playerHit = false;
    const itemsCollected: any[] = [];
    
    // Process obstacle collisions
    for (const obstacle of collisions.obstacles) {
      if (obstacle.onPlayerCollision(this.player)) {
        playerHit = true;
        break; // Only need one deadly collision
      }
    }
    
    // Process item collisions
    for (const item of collisions.items) {
      const effect = item.onPlayerCollision(this.player);
      if (effect) {
        itemsCollected.push(effect);
      }
    }
    
    return { playerHit, itemsCollected };
  }

  /**
   * Create a default pattern for fallback
   */
  private createDefaultPattern(): any {
    return {
      name: 'default',
      difficulty: 1,
      obstacles: [
        { type: 'spike', x: 200, y: 500 },
        { type: 'block', x: 350, y: 450 }
      ],
      items: [
        { type: 'coin', x: 250, y: 400 },
        { type: 'coin', x: 300, y: 350 }
      ]
    };
  }

  /**
   * Get current entity counts for debugging
   */
  getEntityCounts(): any {
    return {
      activeObstacles: this.activeObstacles.length,
      activeItems: this.activeItems.length,
      pooledObstacles: this.obstaclePool.filter(obs => !obs.isActive).length,
      pooledItems: this.itemPool.filter(itm => !itm.isActive).length
    };
  }

  /**
   * Clear all active entities (for level reset)
   */
  clearAllEntities(): void {
    // Deactivate all obstacles
    this.activeObstacles.forEach(obstacle => {
      obstacle.setActive(false);
    });
    this.activeObstacles = [];
    
    // Deactivate all items
    this.activeItems.forEach(item => {
      item.setActive(false);
    });
    this.activeItems = [];
    
    console.log('🧹 All entities cleared');
  }

  /**
   * Destroy the factory and all entities
   */
  destroy(): void {
    this.clearAllEntities();
    
    // Destroy pool objects
    this.obstaclePool.forEach(obstacle => obstacle.destroy());
    this.itemPool.forEach(item => item.destroy());
    
    this.obstaclePool = [];
    this.itemPool = [];
    
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    
    console.log('💥 EntityFactory destroyed');
  }
}
