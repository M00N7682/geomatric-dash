import './style.css';
import Phaser from 'phaser';
import { BootScene, MenuScene, PauseScene, GameOverScene } from './core/Scenes';
import { PlayScene } from './core/PlayScene';
import { testStateMachine } from './core/StateMachine';

// Import entity system
import './entities/Player';
import './entities/Obstacle';
import './entities/Item';
import './entities/EntityFactory';

// Import visual systems
import './core/CameraManager';
import './core/EffectsManager';
import './core/TextureGenerator';

/**
 * Game configuration and initialization
 */
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'app',
  backgroundColor: '#161a22',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 }, // We'll handle gravity manually in entities
      debug: false
    }
  },
  scene: [BootScene, MenuScene, PlayScene, PauseScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 400,
      height: 300
    },
    max: {
      width: 1600,
      height: 1200
    }
  }
};

/**
 * Initialize the game
 */
async function initGame() {
  console.log('🚀 Initializing Geometric Dash...');

  // Clean up any existing game instance
  const existingCanvas = document.querySelector('canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  try {
    // Run state machine tests
    testStateMachine();

    // Create game instance
    const game = new Phaser.Game(gameConfig);
    
    // Global game reference for debugging
    (window as any).game = game;
    
    console.log('🎮 Geometric Dash initialized successfully');
    
    return game;
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    throw error;
  }
}

// Start the game
initGame().catch(error => {
  console.error('💥 Critical error during game initialization:', error);
  
  // Show error message in DOM
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="text-align: center; color: white; padding: 50px;">
        <h2>Failed to initialize Geometric Dash</h2>
        <p>Check console for details</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
          Retry
        </button>
      </div>
    `;
  }
});
