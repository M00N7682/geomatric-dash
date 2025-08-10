// Core game configuration types
export interface GameConfig {
  game: {
    tickRate: number;
    gravity: number;
    baseSpeed: number;
    speedGainPerSec: number;
    maxSpeed: number;
  };
  player: {
    hitbox: { w: number; h: number };
    jump: { vy0: number; airControl: number };
  };
  score: {
    distanceUnit: number;
    coin: number;
    comboMultiplierPerTier: number;
    graceOnBuff: number;
  };
  powerups: {
    shield: { duration: number; keepCombo: boolean };
    dash: { duration: number; speedBoost: number; invincible: boolean; breakObstacles: boolean };
    magnet: { radius: number; duration: number };
    timewarp: { duration: number; timeScale: number };
    doublejump: { duration: number; charges: number; refreshOnLand: boolean };
    giant: { duration: number; scale: number; lowObstaclesIgnore: boolean };
  };
  spawn: {
    patternIntervalSec: { start: number; end: number; untilSec: number; min: number };
    weightsTimeline: Array<{
      untilSec: number;
      easy: number;
      mid: number;
      hard: number;
    }>;
    spikeWindow: {
      everySec: number;
      durationSec: number;
      hardBonus: number;
      hardCap: number;
      recoveryEasyBonus: number;
      recoverySec: number;
    };
  };
  adaptive: {
    recentHitWindowSec: number;
    hitThreshold: number;
    postHitDurationSec: number;
    easeUp: { hard: number; easy: number };
    comboWindowSec: number;
    postComboDurationSec: number;
    spiceUp: { hard: number; coinBonusPct: number };
  };
}

// Pattern system types
export interface PatternEntry {
  type: string;
  x: number;
  y?: number;
  w?: number;
  h?: number;
  amp?: number;
  period?: number;
  delay?: number;
  power?: number;
  n?: number;
}

export type PatternsMap = Record<string, PatternEntry[]>;

// Difficulty levels
export type DifficultyLevel = 'easy' | 'mid' | 'hard';

// Entity bounds for collision detection
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Game state types
export interface GameState {
  score: number;
  distance: number;
  coins: number;
  combo: number;
  lives: number;
  speed: number;
  time: number;
}

// Powerup types
export type PowerupType = 'shield' | 'dash' | 'magnet' | 'timewarp' | 'doublejump' | 'giant';

export interface ActivePowerup {
  type: PowerupType;
  timeLeft: number;
  data?: any;
}

// Analytics event types
export interface AnalyticsEvent {
  type: string;
  timestamp: number;
  data: Record<string, any>;
}
