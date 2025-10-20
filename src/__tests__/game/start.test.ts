/**
 * Tests for game/start.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GameStarter } from '../../lib/game/start';
import { Game, GameStage } from '../../lib/shared/types';
import { MIN_PLAYERS } from '../../lib/shared/constants';

// Mock game data
const createMockGame = (overrides?: Partial<Game>): Game => ({
  authority: PublicKey.unique(),
  gameId: new BN(123),
  stage: GameStage.Waiting,
  smallBlind: new BN(10),
  bigBlind: new BN(20),
  minBuyIn: new BN(1000),
  maxBuyIn: new BN(50000),
  maxPlayers: 6,
  playerCount: 2, // Default to minimum players
  players: Array(6).fill(PublicKey.default),
  activePlayers: Array(6).fill(false),
  dealerPosition: 0,
  currentPlayerIndex: 0,
  pot: new BN(0),
  currentBet: new BN(0),
  playersActed: Array(6).fill(false),
  communityCards: Array(5).fill(0),
  communityCardsRevealed: 0,
  encryptedDeck: Array(32).fill(0),
  deckInitialized: false,
  startedAt: new BN(0),
  lastActionAt: new BN(0),
  shuffleSessionId: Array(32).fill(0),
  bump: 0,
  ...overrides,
});

describe('GameStarter', () => {
  describe('Validation', () => {
    it('should validate valid start', () => {
      const authority = PublicKey.unique();
      const game = createMockGame({
        authority,
        playerCount: 2,
      });

      const result = GameStarter.validateStart(game, authority);
      expect(result.valid).toBe(true);
    });

    it('should reject start by non-authority', () => {
      const authority = PublicKey.unique();
      const nonAuthority = PublicKey.unique();
      const game = createMockGame({
        authority,
        playerCount: 2,
      });

      const result = GameStarter.validateStart(game, nonAuthority);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('authority');
    });

    it('should reject start when game already started', () => {
      const authority = PublicKey.unique();
      const game = createMockGame({
        authority,
        stage: GameStage.PreFlop,
        playerCount: 2,
      });

      const result = GameStarter.validateStart(game, authority);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be started');
    });

    it('should reject start with insufficient players', () => {
      const authority = PublicKey.unique();
      const game = createMockGame({
        authority,
        playerCount: 1, // Less than MIN_PLAYERS
      });

      const result = GameStarter.validateStart(game, authority);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should accept start with minimum players', () => {
      const authority = PublicKey.unique();
      const game = createMockGame({
        authority,
        playerCount: MIN_PLAYERS,
      });

      const result = GameStarter.validateStart(game, authority);
      expect(result.valid).toBe(true);
    });

    it('should accept start with maximum players', () => {
      const authority = PublicKey.unique();
      const game = createMockGame({
        authority,
        playerCount: 6,
      });

      const result = GameStarter.validateStart(game, authority);
      expect(result.valid).toBe(true);
    });
  });

  describe('Player Count Check', () => {
    it('should detect enough players', () => {
      const game = createMockGame({
        playerCount: 2,
      });

      expect(GameStarter.hasEnoughPlayers(game)).toBe(true);
    });

    it('should detect insufficient players', () => {
      const game = createMockGame({
        playerCount: 1,
      });

      expect(GameStarter.hasEnoughPlayers(game)).toBe(false);
    });

    it('should handle zero players', () => {
      const game = createMockGame({
        playerCount: 0,
      });

      expect(GameStarter.hasEnoughPlayers(game)).toBe(false);
    });

    it('should handle full table', () => {
      const game = createMockGame({
        playerCount: 6,
      });

      expect(GameStarter.hasEnoughPlayers(game)).toBe(true);
    });
  });

  describe('Entropy Generation', () => {
    it('should generate entropy for each player', () => {
      const playerCount = 3;
      const entropy = GameStarter.generatePlayerEntropy(playerCount);

      expect(entropy.length).toBe(playerCount);
      entropy.forEach(e => {
        expect(e).toBeInstanceOf(Uint8Array);
        expect(e.length).toBe(32);
      });
    });

    it('should generate different entropy values', () => {
      const entropy1 = GameStarter.generateSingleEntropy();
      const entropy2 = GameStarter.generateSingleEntropy();

      expect(entropy1).not.toEqual(entropy2);
    });

    it('should generate 32 bytes of entropy', () => {
      const entropy = GameStarter.generateSingleEntropy();

      expect(entropy).toBeInstanceOf(Uint8Array);
      expect(entropy.length).toBe(32);
    });

    it('should generate entropy for minimum players', () => {
      const entropy = GameStarter.generatePlayerEntropy(MIN_PLAYERS);

      expect(entropy.length).toBe(MIN_PLAYERS);
    });

    it('should generate entropy for maximum players', () => {
      const entropy = GameStarter.generatePlayerEntropy(6);

      expect(entropy.length).toBe(6);
    });
  });

  describe('Entropy Validation', () => {
    it('should validate correct entropy', () => {
      const entropy = GameStarter.generatePlayerEntropy(3);
      const result = GameStarter.validateEntropy(entropy, 3);

      expect(result.valid).toBe(true);
    });

    it('should reject wrong number of entropy values', () => {
      const entropy = GameStarter.generatePlayerEntropy(2);
      const result = GameStarter.validateEntropy(entropy, 3);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Expected 3');
    });

    it('should reject entropy with wrong size', () => {
      const entropy = [
        new Uint8Array(32),
        new Uint8Array(16), // Wrong size
      ];
      const result = GameStarter.validateEntropy(entropy, 2);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('32 bytes');
    });

    it('should validate empty entropy array', () => {
      const entropy: Uint8Array[] = [];
      const result = GameStarter.validateEntropy(entropy, 0);

      expect(result.valid).toBe(true);
    });

    it('should reject empty entropy when expecting values', () => {
      const entropy: Uint8Array[] = [];
      const result = GameStarter.validateEntropy(entropy, 2);

      expect(result.valid).toBe(false);
    });
  });

  describe('Game Started Check', () => {
    it('should detect game not started', () => {
      const game = createMockGame({
        stage: GameStage.Waiting,
      });

      expect(GameStarter.hasGameStarted(game)).toBe(false);
    });

    it('should detect game started - PreFlop', () => {
      const game = createMockGame({
        stage: GameStage.PreFlop,
      });

      expect(GameStarter.hasGameStarted(game)).toBe(true);
    });

    it('should detect game started - Flop', () => {
      const game = createMockGame({
        stage: GameStage.Flop,
      });

      expect(GameStarter.hasGameStarted(game)).toBe(true);
    });

    it('should detect game started - Turn', () => {
      const game = createMockGame({
        stage: GameStage.Turn,
      });

      expect(GameStarter.hasGameStarted(game)).toBe(true);
    });

    it('should detect game started - River', () => {
      const game = createMockGame({
        stage: GameStage.River,
      });

      expect(GameStarter.hasGameStarted(game)).toBe(true);
    });

    it('should detect game started - Showdown', () => {
      const game = createMockGame({
        stage: GameStage.Showdown,
      });

      expect(GameStarter.hasGameStarted(game)).toBe(true);
    });

    it('should detect game started - Finished', () => {
      const game = createMockGame({
        stage: GameStage.Finished,
      });

      expect(GameStarter.hasGameStarted(game)).toBe(true);
    });
  });

  describe('Get Game Stage', () => {
    it('should return correct stage', () => {
      const game = createMockGame({
        stage: GameStage.Waiting,
      });

      expect(GameStarter.getGameStage(game)).toBe(GameStage.Waiting);
    });

    it('should return stage for all stages', () => {
      const stages = [
        GameStage.Waiting,
        GameStage.PreFlop,
        GameStage.Flop,
        GameStage.Turn,
        GameStage.River,
        GameStage.Showdown,
        GameStage.Finished,
      ];

      stages.forEach(stage => {
        const game = createMockGame({ stage });
        expect(GameStarter.getGameStage(game)).toBe(stage);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should reject all non-Waiting stages', () => {
      const authority = PublicKey.unique();
      const stages = [
        GameStage.PreFlop,
        GameStage.Flop,
        GameStage.Turn,
        GameStage.River,
        GameStage.Showdown,
        GameStage.Finished,
      ];

      stages.forEach(stage => {
        const game = createMockGame({
          authority,
          stage,
          playerCount: 2,
        });

        const result = GameStarter.validateStart(game, authority);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot be started');
      });
    });

    it('should handle game with exactly minimum players', () => {
      const authority = PublicKey.unique();
      const game = createMockGame({
        authority,
        playerCount: MIN_PLAYERS,
      });

      const result = GameStarter.validateStart(game, authority);
      expect(result.valid).toBe(true);
    });

    it('should generate consistent entropy size', () => {
      for (let i = 1; i <= 6; i++) {
        const entropy = GameStarter.generatePlayerEntropy(i);
        expect(entropy.length).toBe(i);
        entropy.forEach(e => expect(e.length).toBe(32));
      }
    });
  });
});
