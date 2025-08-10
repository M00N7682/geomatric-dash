import Phaser from 'phaser';
import { StateMachine } from '../core/StateMachine';
import type { State } from '../core/StateMachine';
import { EntityFactory } from '../entities/EntityFactory';
import { Player } from '../entities/Player';
import { CameraManager } from '../core/CameraManager';
import { EffectsManager } from '../core/EffectsManager';
import { TextureGenerator } from '../core/TextureGenerator';
import { ProgressManager } from '../core/ProgressManager';
import { UIManager } from '../core/UIManager';

/**
 * Play Scene - Main gameplay with state machine integration
 */
export class PlayScene extends Phaser.Scene implements State {
  private stateMachine: StateMachine;
  private entityFactory!: EntityFactory;
  private player!: Player;
  private cameraManager!: CameraManager;
  private effectsManager!: EffectsManager;
  private progressManager!: ProgressManager;
  private uiManager!: UIManager;
  private gameTime: number = 0;
  private lastPatternSpawn: number = 0;
  private lastLevel: number = 1;
  private gameState: {
    score: number;
    distance: number;
    coins: number;
    combo: number;
    lives: number;
    speed: number;
    time: number;
    paused: boolean;
    difficulty: number;
  };

  constructor() {
    super({ key: 'PlayScene' });
    this.stateMachine = new StateMachine();
    this.gameState = {
      score: 0,
      distance: 0,
      coins: 0,
      combo: 0,
      lives: 3,
      speed: 320,
      time: 0,
      paused: false,
      difficulty: 1
    };
  }

  // State interface
  enter(data?: any): void {
    console.log('🎮 Entering PlayScene', data);
    this.resetGameState();
  }

  exit(): void {
    console.log('🎮 Exiting PlayScene');
  }

  update(time: number, delta: number): void {
    if (!this.gameState.paused) {
      this.gameTime = time;
      this.gameState.time += delta / 1000;
      this.updateGameplay(time, delta);
    }
    
    this.stateMachine.update(time, delta);
  }

  pause(): void {
    console.log('⏸️ PlayScene paused');
    this.gameState.paused = true;
  }

  resume(): void {
    console.log('▶️ PlayScene resumed');
    this.gameState.paused = false;
  }

  create() {
    console.log('🎮 PlayScene created');
    
    // Generate textures for particles
    TextureGenerator.generateParticleTextures(this);
    
    this.setupGame();
    this.setupInput();
    this.setupStateMachine();
    this.setupVisualSystems();
  }

  private resetGameState(): void {
    this.gameState = {
      score: 0,
      distance: 0,
      coins: 0,
      combo: 0,
      lives: 3,
      speed: 320,
      time: 0,
      paused: false,
      difficulty: 1
    };
  }

  private setupGame(): void {
    const config = (globalThis as any).GameConfig;
    const patterns = (globalThis as any).Patterns;

    // Initialize entity factory
    this.entityFactory = new EntityFactory(this);
    
    // Create player
    this.player = this.entityFactory.createPlayer(100, 450);
    
    // Display game area
    this.add.rectangle(512, 288, 1024, 576, 0x161a22);
    
    // Ground line
    this.add.line(512, 500, 0, 0, 1024, 0, 0x2e3850, 1).setLineWidth(2);

    // Display config info
    this.add.text(10, 10, `Gravity: ${config?.game?.gravity || 'Default'}`, {
      fontSize: '12px',
      color: '#888888'
    });

    this.add.text(10, 25, `Patterns: ${(patterns || []).length}`, {
      fontSize: '12px',
      color: '#888888'
    });

    console.log('🎮 Game setup complete with entity system');
  }

  private setupInput(): void {
    // Jump input
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey?.on('down', () => {
      this.handleJump();
    });
    
    // Dash input (Shift)
    const shiftKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    shiftKey?.on('down', () => {
      this.handleDash();
    });
    
    // Slide input (Down arrow or S)
    const downKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const sKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    downKey?.on('down', () => {
      this.handleSlide();
    });
    sKey?.on('down', () => {
      this.handleSlide();
    });

    // Pause input
    const pKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    pKey?.on('down', () => {
      this.handlePause();
    });

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      this.handlePause();
    });

    // Restart input
    const rKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    rKey?.on('down', () => {
      this.handleRestart();
    });

    // Touch/click input for mobile
    this.input.on('pointerdown', () => {
      this.handleJump();
    });
  }

  private setupStateMachine(): void {
    // Add pause state to local state machine
    this.stateMachine.addState('playing', {
      enter: () => console.log('▶️ Entered playing state'),
      exit: () => console.log('⏸️ Exited playing state'),
      update: () => { /* gameplay logic */ }
    });

    this.stateMachine.addState('paused', {
      enter: () => {
        console.log('⏸️ Entered paused state');
        this.gameState.paused = true;
      },
      exit: () => {
        console.log('▶️ Exited paused state');
        this.gameState.paused = false;
      },
      update: () => { /* paused logic */ }
    });

    // Start in playing state
    this.stateMachine.replaceState('playing');
  }

  private setupVisualSystems(): void {
    // Initialize progress manager
    this.progressManager = new ProgressManager(this, this.gameState);
    
    // Initialize camera manager
    this.cameraManager = new CameraManager(this);
    this.cameraManager.setTarget(this.player.sprite, -200, 0);
    
    // Initialize effects manager
    this.effectsManager = new EffectsManager(this);
    
    // Initialize UI manager
    this.uiManager = new UIManager(this, this.progressManager);
    
    // Start player trail effect
    this.effectsManager.startPlayerTrail(this.player.sprite);
    
    console.log('📷✨📊 Visual and progress systems initialized');
  }

  private updateGameplay(time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    
    // Update visual systems
    this.cameraManager.update(time, delta);
    this.effectsManager.update(time, delta);
    
    // Update entity factory (handles all entities)
    this.entityFactory.update(time, delta);
    
    // Update player
    this.player.update(time, delta);
    
    // Update distance based on speed
    this.gameState.distance += this.gameState.speed * deltaSeconds / 100; // Convert to meters
    
    // Increase speed over time
    const config = (globalThis as any).GameConfig;
    if (config?.game?.speedGainPerSec) {
      this.gameState.speed = Math.min(
        this.gameState.speed + config.game.speedGainPerSec * deltaSeconds,
        config.game.maxSpeed || 640
      );
    }
    
    // Update difficulty based on distance
    this.gameState.difficulty = Math.floor(this.gameState.distance / 100) + 1;
    
    // Update camera look-ahead based on player velocity
    this.cameraManager.lookAhead(
      { x: this.player.velocityX, y: this.player.velocityY },
      0.1
    );
    
    // Speed lines effect when moving fast
    if (this.gameState.speed > 500) {
      this.effectsManager.speedLines(true);
    } else {
      this.effectsManager.speedLines(false);
    }
    
    // Spawn new patterns
    this.spawnPatterns();
    
    // Check collisions
    const collisionResults = this.entityFactory.processCollisions();
    
    // Handle player death
    if (collisionResults.playerHit) {
      this.handlePlayerDeath();
    }
    
    // Handle collected items
    collisionResults.itemsCollected.forEach(effect => {
      this.applyItemEffect(effect);
      
      // Record collection in progress manager
      const { score, combo } = this.progressManager.collectItem(effect.type, effect.value || 1);
      
      // Show floating score text
      this.uiManager.showFloatingText(
        this.player.x, 
        this.player.y - 30, 
        `+${score}`, 
        '#ffff00'
      );
      
      // Show combo notification if combo > 1
      if (combo > 1) {
        this.uiManager.showComboText(combo);
      }
    });

    // Update score based on distance
    this.gameState.score = Math.floor(this.gameState.distance * 10);

    // Update UI
    this.updateUI();
  }
  
  private spawnPatterns(): void {
    // Spawn new patterns every 200 pixels of distance
    const spawnDistance = 200;
    const currentSpawnPoint = Math.floor(this.gameState.distance / spawnDistance);
    const lastSpawnPoint = Math.floor(this.lastPatternSpawn / spawnDistance);
    
    if (currentSpawnPoint > lastSpawnPoint) {
      const pattern = this.entityFactory.selectNextPattern(
        this.gameState.difficulty,
        this.gameState.distance
      );
      
      if (pattern) {
        // Spawn pattern ahead of player
        const spawnX = 1200; // Off-screen to the right
        const spawnY = 0; // Ground level
        
        this.entityFactory.spawnFromPattern(pattern, spawnX, spawnY);
        this.lastPatternSpawn = this.gameState.distance;
        
        console.log(`🌟 Spawned pattern at distance ${this.gameState.distance.toFixed(1)}m`);
      }
    }
  }
  
  private applyItemEffect(effect: any): void {
    switch (effect.type) {
      case 'score':
        this.gameState.score += effect.value;
        // Show score popup effect
        this.effectsManager.scorePopup(
          this.player.x + 30,
          this.player.y - 20,
          effect.value
        );
        break;
        
      case 'ability':
        this.player.setAbility(effect.ability, true);
        // Set timer to disable ability (would need proper timer system)
        this.time.delayedCall(effect.duration, () => {
          this.player.setAbility(effect.ability, false);
        });
        break;
        
      case 'key':
        // Handle key collection (for locked areas)
        break;
    }
  }
  
  private handlePlayerDeath(): void {
    // Screen shake effect
    this.cameraManager.shake(15, 300);
    
    // Explosion effect at player position
    this.effectsManager.explosion(this.player.x, this.player.y, 1.5);
    
    // Screen flash
    this.effectsManager.screenFlash(0xff4444, 200);
    
    this.gameState.lives--;
    if (this.gameState.lives <= 0) {
      this.handleGameOver();
    } else {
      // Respawn player
      this.player.reset(100, 450);
      this.player.makeInvulnerable(2); // 2 seconds of invulnerability
      
      // Reset camera
      this.cameraManager.setTarget(this.player.sprite, -200, 0);
    }
  }

  private updateUI(): void {
    // Update score
    const scoreText = this.children.getAt(6) as Phaser.GameObjects.Text;
    if (scoreText) {
      scoreText.setText(this.gameState.score.toString());
    }

    // Update distance
    const distanceText = this.children.getAt(8) as Phaser.GameObjects.Text;
    if (distanceText) {
      distanceText.setText(`${this.gameState.distance.toFixed(1)}m`);
    }
  }

  private handleJump(): void {
    if (this.gameState.paused) return;
    
    if (this.player.jump()) {
      // Record jump for statistics
      this.progressManager.recordJump();
      
      // Jump dust effect
      this.effectsManager.jumpDust(this.player.x, this.player.y);
      
      // Small camera shake
      this.cameraManager.shake(3, 100);
      
      console.log('🦘 Player jumped!');
    }
  }
  
  private handleDash(): void {
    if (this.gameState.paused) return;
    
    // Dash forward and slightly up
    const dashDirection = { x: 1, y: -0.2 };
    if (this.player.dash(dashDirection)) {
      // Record dash for statistics
      this.progressManager.recordDash();
      
      // Dash effect
      this.effectsManager.startDash(this.player.sprite);
      
      // Screen zoom effect during dash
      this.cameraManager.setZoom(1.2);
      this.time.delayedCall(300, () => {
        this.cameraManager.setZoom(1);
      });
      
      console.log('💨 Player dashed!');
    }
  }
  
  private handleSlide(): void {
    if (this.gameState.paused) return;
    
    if (this.player.slide()) {
      // Record slide for statistics
      this.progressManager.recordSlide();
      
      // Slide dust effect
      this.effectsManager.jumpDust(this.player.x - 10, this.player.y + 15);
      
      console.log('⬇️ Player sliding!');
    }
  }

  private handlePause(): void {
    if (this.gameState.paused) {
      // Resume game
      this.resume();
      this.scene.stop('PauseScene');
    } else {
      // Pause game
      this.pause();
      this.scene.launch('PauseScene', {
        resumeCallback: () => {
          this.resume();
        }
      });
    }
  }

  private handleRestart(): void {
    console.log('🔄 Restarting game...');
    this.scene.restart();
  }

  private handleGameOver(): void {
    console.log('💀 Game Over!');
    this.scene.start('GameOverScene', {
      score: this.gameState.score,
      distance: this.gameState.distance,
      coins: this.gameState.coins,
      time: this.gameState.time
    });
  }

  // Public methods for testing
  public getGameState() {
    return { 
      ...this.gameState,
      gameTime: this.gameTime
    };
  }

  public getStateMachine() {
    return this.stateMachine;
  }
}

/**
 * Test function for PlayScene state management
 */
export function testPlaySceneStateMachine(): void {
  console.log('🧪 Testing PlayScene state machine...');
  
  // This would be called after scene is created
  // For now, just verify the concept
  console.log('✅ PlayScene state machine test placeholder');
}
