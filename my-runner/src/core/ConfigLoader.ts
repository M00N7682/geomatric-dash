import { GameConfig, PatternsMap } from './types';

/**
 * Configuration loader with validation and fallback support
 * Loads JSON configs at runtime with type safety
 */
export class ConfigLoader {
  private static readonly DEFAULT_CONFIG: GameConfig = {
    game: { tickRate: 60, gravity: 2200, baseSpeed: 320, speedGainPerSec: 6, maxSpeed: 640 },
    player: { hitbox: { w: 28, h: 42 }, jump: { vy0: -720, airControl: 0.15 } },
    score: { distanceUnit: 1.0, coin: 10, comboMultiplierPerTier: 0.2, graceOnBuff: 0.2 },
    powerups: {
      shield: { duration: 8, keepCombo: true },
      dash: { duration: 2.0, speedBoost: 1.5, invincible: true, breakObstacles: true },
      magnet: { radius: 180, duration: 6 },
      timewarp: { duration: 3.0, timeScale: 0.5 },
      doublejump: { duration: 10.0, charges: 1, refreshOnLand: true },
      giant: { duration: 4.0, scale: 1.5, lowObstaclesIgnore: true }
    },
    spawn: {
      patternIntervalSec: { start: 2.6, end: 2.2, untilSec: 150, min: 2.0 },
      weightsTimeline: [
        { untilSec: 90, easy: 0.65, mid: 0.30, hard: 0.05 },
        { untilSec: 180, easy: 0.45, mid: 0.40, hard: 0.15 },
        { untilSec: 9999, easy: 0.30, mid: 0.45, hard: 0.25 }
      ],
      spikeWindow: { everySec: 40, durationSec: 5, hardBonus: 0.15, hardCap: 0.6, recoveryEasyBonus: 0.10, recoverySec: 10 }
    },
    adaptive: {
      recentHitWindowSec: 20, hitThreshold: 2,
      postHitDurationSec: 15, easeUp: { hard: -0.10, easy: 0.10 },
      comboWindowSec: 30, postComboDurationSec: 10, spiceUp: { hard: 0.08, coinBonusPct: 10 }
    }
  };

  private static readonly DEFAULT_PATTERNS: PatternsMap = {
    'easy_001': [
      { type: 'ground', x: 0, w: 8 },
      { type: 'coin_arc', x: 3, y: -2, n: 5 }
    ]
  };

  /**
   * Load and validate game configuration
   */
  static async loadGameConfig(): Promise<GameConfig> {
    try {
      const response = await fetch('/src/config/gameConfig.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }

      const data = await response.json();
      const validated = this.validateGameConfig(data);
      
      console.log('✅ Game config loaded successfully');
      return validated;
    } catch (error) {
      console.warn('⚠️ Failed to load game config, using defaults:', error);
      return this.DEFAULT_CONFIG;
    }
  }

  /**
   * Load and validate pattern definitions
   */
  static async loadPatterns(): Promise<PatternsMap> {
    try {
      const response = await fetch('/src/config/patterns.json');
      if (!response.ok) {
        throw new Error(`Failed to load patterns: ${response.status}`);
      }

      const data = await response.json();
      const validated = this.validatePatterns(data);
      
      console.log(`✅ Patterns loaded successfully (${Object.keys(validated).length} patterns)`);
      return validated;
    } catch (error) {
      console.warn('⚠️ Failed to load patterns, using defaults:', error);
      return this.DEFAULT_PATTERNS;
    }
  }

  /**
   * Validate game config structure with fallback for missing fields
   */
  private static validateGameConfig(data: any): GameConfig {
    const config = { ...this.DEFAULT_CONFIG };
    
    try {
      // Validate and merge game settings
      if (data.game && typeof data.game === 'object') {
        Object.assign(config.game, this.validateNumericFields(data.game, config.game));
      }

      // Validate player settings
      if (data.player && typeof data.player === 'object') {
        if (data.player.hitbox) {
          Object.assign(config.player.hitbox, this.validateNumericFields(data.player.hitbox, config.player.hitbox));
        }
        if (data.player.jump) {
          Object.assign(config.player.jump, this.validateNumericFields(data.player.jump, config.player.jump));
        }
      }

      // Validate powerups
      if (data.powerups && typeof data.powerups === 'object') {
        for (const [key, powerup] of Object.entries(data.powerups)) {
          if (config.powerups[key as keyof typeof config.powerups] && typeof powerup === 'object') {
            Object.assign(
              config.powerups[key as keyof typeof config.powerups], 
              this.validateMixedFields(powerup as any, config.powerups[key as keyof typeof config.powerups])
            );
          }
        }
      }

      // Validate spawn settings
      if (data.spawn && typeof data.spawn === 'object') {
        if (data.spawn.patternIntervalSec) {
          Object.assign(config.spawn.patternIntervalSec, this.validateNumericFields(data.spawn.patternIntervalSec, config.spawn.patternIntervalSec));
        }
        if (data.spawn.spikeWindow) {
          Object.assign(config.spawn.spikeWindow, this.validateNumericFields(data.spawn.spikeWindow, config.spawn.spikeWindow));
        }
        if (Array.isArray(data.spawn.weightsTimeline)) {
          config.spawn.weightsTimeline = data.spawn.weightsTimeline.filter(this.isValidWeightEntry);
        }
      }

      // Validate adaptive settings
      if (data.adaptive && typeof data.adaptive === 'object') {
        Object.assign(config.adaptive, this.validateNumericFields(data.adaptive, config.adaptive));
        if (data.adaptive.easeUp) {
          Object.assign(config.adaptive.easeUp, this.validateNumericFields(data.adaptive.easeUp, config.adaptive.easeUp));
        }
        if (data.adaptive.spiceUp) {
          Object.assign(config.adaptive.spiceUp, this.validateNumericFields(data.adaptive.spiceUp, config.adaptive.spiceUp));
        }
      }

    } catch (error) {
      console.warn('⚠️ Config validation error, using defaults for affected fields:', error);
    }

    return config;
  }

  /**
   * Validate patterns structure
   */
  private static validatePatterns(data: any): PatternsMap {
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Invalid patterns format, using defaults');
      return this.DEFAULT_PATTERNS;
    }

    const patterns: PatternsMap = {};
    let validCount = 0;

    for (const [key, pattern] of Object.entries(data)) {
      if (Array.isArray(pattern) && pattern.every(this.isValidPatternEntry)) {
        patterns[key] = pattern as any;
        validCount++;
      } else {
        console.warn(`⚠️ Invalid pattern: ${key}`);
      }
    }

    if (validCount === 0) {
      console.warn('⚠️ No valid patterns found, using defaults');
      return this.DEFAULT_PATTERNS;
    }

    return patterns;
  }

  /**
   * Validate numeric fields with fallback
   */
  private static validateNumericFields(source: any, defaults: any): any {
    const result = { ...defaults };
    
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (typeof defaultValue === 'number' && typeof source[key] === 'number' && !isNaN(source[key])) {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Validate mixed type fields (numbers and booleans)
   */
  private static validateMixedFields(source: any, defaults: any): any {
    const result = { ...defaults };
    
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const sourceValue = source[key];
      if (typeof defaultValue === typeof sourceValue) {
        if (typeof defaultValue === 'number' && !isNaN(sourceValue)) {
          result[key] = sourceValue;
        } else if (typeof defaultValue === 'boolean') {
          result[key] = sourceValue;
        }
      }
    }
    
    return result;
  }

  /**
   * Check if weight entry is valid
   */
  private static isValidWeightEntry(entry: any): boolean {
    return entry && 
           typeof entry.untilSec === 'number' && 
           typeof entry.easy === 'number' && 
           typeof entry.mid === 'number' && 
           typeof entry.hard === 'number' &&
           Math.abs((entry.easy + entry.mid + entry.hard) - 1.0) < 0.01; // Allow small floating point errors
  }

  /**
   * Check if pattern entry is valid
   */
  private static isValidPatternEntry(entry: any): boolean {
    return entry && 
           typeof entry.type === 'string' && 
           typeof entry.x === 'number' &&
           entry.type.length > 0;
  }
}

// Global config storage
export let GameConfig: GameConfig;
export let Patterns: PatternsMap;

/**
 * Initialize global configuration
 */
export async function initializeConfig(): Promise<void> {
  const [gameConfig, patterns] = await Promise.all([
    ConfigLoader.loadGameConfig(),
    ConfigLoader.loadPatterns()
  ]);

  // Store globally
  (globalThis as any).GameConfig = gameConfig;
  (globalThis as any).Patterns = patterns;
  
  // Export for modules
  GameConfig = gameConfig;
  Patterns = patterns;

  console.log('🎮 Global configuration initialized');
}
