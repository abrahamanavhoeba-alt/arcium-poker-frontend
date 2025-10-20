/**
 * Tests for game/initialize.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GameInitializer } from '../../lib/game/initialize';
import {
  DEFAULT_SMALL_BLIND,
  DEFAULT_BIG_BLIND,
  DEFAULT_MIN_BUY_IN,
  DEFAULT_MAX_BUY_IN,
  DEFAULT_MAX_PLAYERS,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from '../../lib/shared/constants';

describe('GameInitializer', () => {
  describe('Parameter Validation', () => {
    it('should validate valid game parameters', () => {
      const params = {
        gameId: Date.now(),
        smallBlind: 10,
        bigBlind: 20,
        minBuyIn: 1000,
        maxBuyIn: 50000,
        maxPlayers: 6,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject missing game ID', () => {
      const params = {
        gameId: 0,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Game ID');
    });

    it('should reject negative game ID', () => {
      const params = {
        gameId: -1,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
    });

    it('should reject zero small blind', () => {
      const params = {
        gameId: 123,
        smallBlind: 0,
        bigBlind: 20,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Small blind');
    });

    it('should reject big blind less than or equal to small blind', () => {
      const params = {
        gameId: 123,
        smallBlind: 20,
        bigBlind: 20,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Big blind');
    });

    it('should reject big blind less than small blind', () => {
      const params = {
        gameId: 123,
        smallBlind: 20,
        bigBlind: 10,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
    });

    it('should reject zero minimum buy-in', () => {
      const params = {
        gameId: 123,
        minBuyIn: 0,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum buy-in');
    });

    it('should reject max buy-in less than or equal to min buy-in', () => {
      const params = {
        gameId: 123,
        minBuyIn: 1000,
        maxBuyIn: 1000,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum buy-in');
    });

    it('should reject min buy-in less than 50 big blinds', () => {
      const params = {
        gameId: 123,
        smallBlind: 10,
        bigBlind: 20,
        minBuyIn: 500, // Less than 50 * 20
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50 big blinds');
    });

    it('should accept min buy-in of exactly 50 big blinds', () => {
      const params = {
        gameId: 123,
        smallBlind: 10,
        bigBlind: 20,
        minBuyIn: 1000, // Exactly 50 * 20
        maxBuyIn: 50000,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });

    it('should reject max players less than minimum', () => {
      const params = {
        gameId: 123,
        maxPlayers: 1, // Less than MIN_PLAYERS (2)
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Max players');
    });

    it('should reject max players greater than maximum', () => {
      const params = {
        gameId: 123,
        maxPlayers: 10, // Greater than MAX_PLAYERS (6)
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Max players');
    });

    it('should accept max players within valid range', () => {
      for (let i = MIN_PLAYERS; i <= MAX_PLAYERS; i++) {
        const params = {
          gameId: 123,
          maxPlayers: i,
        };

        const result = GameInitializer.validateGameParams(params);
        expect(result.valid).toBe(true);
      }
    });

    it('should use defaults for optional parameters', () => {
      const params = {
        gameId: 123,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });
  });

  describe('Default Parameters', () => {
    it('should return default game parameters', () => {
      const defaults = GameInitializer.getDefaultParams();

      expect(defaults.smallBlind).toBe(DEFAULT_SMALL_BLIND);
      expect(defaults.bigBlind).toBe(DEFAULT_BIG_BLIND);
      expect(defaults.minBuyIn).toBe(DEFAULT_MIN_BUY_IN);
      expect(defaults.maxBuyIn).toBe(DEFAULT_MAX_BUY_IN);
      expect(defaults.maxPlayers).toBe(DEFAULT_MAX_PLAYERS);
    });

    it('should not include gameId in defaults', () => {
      const defaults = GameInitializer.getDefaultParams();
      expect(defaults).not.toHaveProperty('gameId');
    });
  });

  describe('Game ID Generation', () => {
    it('should generate unique game IDs', () => {
      const id1 = GameInitializer.generateGameId();
      const id2 = GameInitializer.generateGameId();

      expect(id1).toBeGreaterThan(0);
      expect(id2).toBeGreaterThan(0);
      expect(id2).toBeGreaterThanOrEqual(id1);
    });

    it('should generate timestamp-based game IDs', () => {
      const before = Date.now();
      const gameId = GameInitializer.generateGameId();
      const after = Date.now();

      expect(gameId).toBeGreaterThanOrEqual(before);
      expect(gameId).toBeLessThanOrEqual(after);
    });
  });

  describe('Parameter Conversion', () => {
    it('should handle BN game ID', () => {
      const params = {
        gameId: new BN(12345),
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });

    it('should handle number game ID', () => {
      const params = {
        gameId: 12345,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });

    it('should handle mixed number and BN parameters', () => {
      const params = {
        gameId: 123,
        smallBlind: new BN(10),
        bigBlind: 20,
        minBuyIn: new BN(1000),
        maxBuyIn: 50000,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large game ID', () => {
      const params = {
        gameId: Number.MAX_SAFE_INTEGER,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });

    it('should handle very large buy-in amounts', () => {
      const params = {
        gameId: 123,
        smallBlind: 1000,
        bigBlind: 2000,
        minBuyIn: 100000,
        maxBuyIn: 10000000,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });

    it('should handle minimum valid configuration', () => {
      const params = {
        gameId: 1,
        smallBlind: 1,
        bigBlind: 2,
        minBuyIn: 100, // 50 * 2
        maxBuyIn: 101,
        maxPlayers: 2,
      };

      const result = GameInitializer.validateGameParams(params);
      expect(result.valid).toBe(true);
    });
  });
});
