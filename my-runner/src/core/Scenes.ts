import Phaser from 'phaser';
import { StateMachine } from '../core/StateMachine';
import type { State } from '../core/StateMachine';

/**
 * Boot Scene - Initial loading and configuration
 */
export class BootScene extends Phaser.Scene implements State {
  private stateMachine: StateMachine;

  constructor() {
    super({ key: 'BootScene' });
    this.stateMachine = new StateMachine();
  }

  // Phaser lifecycle
  preload() {
    this.showLoadingUI();
  }

  async create() {
    await this.initializeGame();
  }

  // State interface
  enter(data?: any): void {
    console.log('📱 Entering BootScene', data);
  }

  exit(): void {
    console.log('📱 Exiting BootScene');
  }

  update(time: number, delta: number): void {
    this.stateMachine.update(time, delta);
  }

  private showLoadingUI(): void {
    this.add.text(400, 250, 'Geometric Dash', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(400, 300, 'Loading configuration...', {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Loading progress bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    
    progressBox.fillStyle(0x222222);
    progressBox.fillRect(300, 320, 200, 20);
    
    // Simulate loading progress
    let progress = 0;
    const progressTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        progress += 0.1;
        progressBar.clear();
        progressBar.fillStyle(0x00ff88);
        progressBar.fillRect(302, 322, (200 - 4) * Math.min(progress, 1), 16);
        
        if (progress >= 1) {
          progressTimer.remove();
        }
      },
      repeat: 10
    });
  }

  private async initializeGame(): Promise<void> {
    try {
      // Import and initialize configuration
      const { initializeConfig } = await import('../core/ConfigLoader');
      await initializeConfig();

      // Load game assets
      this.load.image('player', '/player.png');
      this.load.image('obstacle', '/obstacle.png');
      this.load.image('me', '/me.png');

      this.load.start();
      this.load.once('complete', () => {
        console.log('✅ Assets loaded successfully');
        
        // Transition to menu after a brief delay
        this.time.delayedCall(500, () => {
          this.scene.start('MenuScene');
        });
      });

      this.load.once('loaderror', (file: any) => {
        console.warn('⚠️ Failed to load asset:', file.key);
      });

    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      this.showErrorMessage();
    }
  }

  private showErrorMessage(): void {
    this.add.text(400, 380, 'Failed to load game', {
      fontSize: '16px',
      color: '#ff6666'
    }).setOrigin(0.5);
    
    this.add.text(400, 410, 'Check console for details', {
      fontSize: '14px',
      color: '#ff6666'
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.text(400, 450, 'Retry', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    retryBtn.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}

/**
 * Menu Scene - Main menu and navigation
 */
export class MenuScene extends Phaser.Scene implements State {
  private stateMachine: StateMachine;

  constructor() {
    super({ key: 'MenuScene' });
    this.stateMachine = new StateMachine();
  }

  // State interface
  enter(data?: any): void {
    console.log('🏠 Entering MenuScene', data);
  }

  exit(): void {
    console.log('🏠 Exiting MenuScene');
  }

  update(time: number, delta: number): void {
    this.stateMachine.update(time, delta);
  }

  create() {
    this.createMenuUI();
    this.setupInput();
  }

  private createMenuUI(): void {
    // Title
    this.add.text(400, 150, 'GEOMETRIC DASH', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(400, 200, 'v2.0 - Advanced Edition', {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.text(400, 280, 'PLAY', {
      fontSize: '24px',
      color: '#00ff88',
      backgroundColor: '#1a4d3a',
      padding: { x: 40, y: 15 }
    }).setOrigin(0.5).setInteractive();

    playBtn.on('pointerover', () => {
      playBtn.setStyle({ backgroundColor: '#2d6b4d' });
    });
    
    playBtn.on('pointerout', () => {
      playBtn.setStyle({ backgroundColor: '#1a4d3a' });
    });

    playBtn.on('pointerdown', () => {
      this.startGame();
    });

    // Settings button
    const settingsBtn = this.add.text(400, 340, 'SETTINGS', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive();

    settingsBtn.on('pointerdown', () => {
      console.log('⚙️ Settings requested (not implemented yet)');
    });

    // Stats display
    const config = (globalThis as any).GameConfig;
    const patterns = (globalThis as any).Patterns;
    
    if (config && patterns) {
      this.add.text(400, 420, `✅ Config loaded - ${Object.keys(patterns).length} patterns ready`, {
        fontSize: '14px',
        color: '#888888'
      }).setOrigin(0.5);
    }

    // Instructions
    this.add.text(400, 500, 'Press SPACE to start • ESC for menu', {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  private setupInput(): void {
    // Keyboard shortcuts
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey?.on('down', () => {
      this.startGame();
    });

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      console.log('🏠 Already in menu');
    });
  }

  private startGame(): void {
    console.log('🎮 Starting game...');
    this.scene.start('PlayScene');
  }
}

/**
 * Pause Scene - Game pause overlay
 */
export class PauseScene extends Phaser.Scene implements State {
  private stateMachine: StateMachine;
  private resumeCallback?: () => void;

  constructor() {
    super({ key: 'PauseScene' });
    this.stateMachine = new StateMachine();
  }

  // State interface
  enter(data?: any): void {
    console.log('⏸️ Entering PauseScene', data);
    this.resumeCallback = data?.resumeCallback;
  }

  exit(): void {
    console.log('⏸️ Exiting PauseScene');
  }

  update(time: number, delta: number): void {
    this.stateMachine.update(time, delta);
  }

  create() {
    this.createPauseUI();
    this.setupInput();
  }

  private createPauseUI(): void {
    // Semi-transparent overlay
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

    // Pause title
    this.add.text(400, 200, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.add.text(400, 280, 'RESUME', {
      fontSize: '24px',
      color: '#00ff88',
      backgroundColor: '#1a4d3a',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setInteractive();

    resumeBtn.on('pointerdown', () => {
      this.resumeGame();
    });

    // Restart button
    const restartBtn = this.add.text(400, 340, 'RESTART', {
      fontSize: '18px',
      color: '#ffaa00',
      backgroundColor: '#4d3300',
      padding: { x: 25, y: 10 }
    }).setOrigin(0.5).setInteractive();

    restartBtn.on('pointerdown', () => {
      this.restartGame();
    });

    // Menu button
    const menuBtn = this.add.text(400, 400, 'MAIN MENU', {
      fontSize: '18px',
      color: '#ff6666',
      backgroundColor: '#4d1a1a',
      padding: { x: 25, y: 10 }
    }).setOrigin(0.5).setInteractive();

    menuBtn.on('pointerdown', () => {
      this.goToMenu();
    });

    // Instructions
    this.add.text(400, 480, 'Press P or ESC to resume', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  private setupInput(): void {
    const pKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    pKey?.on('down', () => {
      this.resumeGame();
    });

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      this.resumeGame();
    });

    const rKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    rKey?.on('down', () => {
      this.restartGame();
    });
  }

  private resumeGame(): void {
    console.log('▶️ Resuming game...');
    this.scene.stop();
    if (this.resumeCallback) {
      this.resumeCallback();
    }
  }

  private restartGame(): void {
    console.log('🔄 Restarting game...');
    this.scene.stop();
    this.scene.start('PlayScene');
  }

  private goToMenu(): void {
    console.log('🏠 Going to menu...');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}

/**
 * Game Over Scene - End game screen
 */
export class GameOverScene extends Phaser.Scene implements State {
  private stateMachine: StateMachine;
  private gameData: any;

  constructor() {
    super({ key: 'GameOverScene' });
    this.stateMachine = new StateMachine();
  }

  // State interface
  enter(data?: any): void {
    console.log('💀 Entering GameOverScene', data);
    this.gameData = data || {};
  }

  exit(): void {
    console.log('💀 Exiting GameOverScene');
  }

  update(time: number, delta: number): void {
    this.stateMachine.update(time, delta);
  }

  create() {
    this.createGameOverUI();
    this.setupInput();
  }

  private createGameOverUI(): void {
    // Game Over title
    this.add.text(400, 150, 'GAME OVER', {
      fontSize: '42px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score display
    const score = this.gameData.score || 0;
    const distance = this.gameData.distance || 0;
    const time = this.gameData.time || 0;

    this.add.text(400, 220, `Score: ${score}`, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(400, 250, `Distance: ${distance.toFixed(1)}m`, {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(400, 275, `Time: ${time.toFixed(1)}s`, {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.text(400, 340, 'TRY AGAIN', {
      fontSize: '24px',
      color: '#00ff88',
      backgroundColor: '#1a4d3a',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setInteractive();

    retryBtn.on('pointerdown', () => {
      this.retryGame();
    });

    // Menu button
    const menuBtn = this.add.text(400, 410, 'MAIN MENU', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 25, y: 10 }
    }).setOrigin(0.5).setInteractive();

    menuBtn.on('pointerdown', () => {
      this.goToMenu();
    });

    // Instructions
    this.add.text(400, 480, 'Press R to retry • ESC for menu', {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  private setupInput(): void {
    const rKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    rKey?.on('down', () => {
      this.retryGame();
    });

    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => {
      this.goToMenu();
    });

    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey?.on('down', () => {
      this.retryGame();
    });
  }

  private retryGame(): void {
    console.log('🔄 Retrying game...');
    this.scene.start('PlayScene');
  }

  private goToMenu(): void {
    console.log('🏠 Going to menu...');
    this.scene.start('MenuScene');
  }
}
