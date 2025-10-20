/**
 * Tests for player/join.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PlayerJoin } from '../../lib/player/join';
import { Game, GameStage, PlayerStatus } from '../../lib/shared/types';

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
  playerCount: 0,
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

describe('PlayerJoin', () => {
  describe('Validation', () => {
    it('should validate valid join', () => {
      const game = createMockGame();
      const player = PublicKey.unique();
      const buyIn = 5000;

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(true);
    });

    it('should reject join when game is full', () => {
      const players = Array(6).fill(null).map(() => PublicKey.unique());
      const game = createMockGame({
        playerCount: 6,
        players,
      });
      const player = PublicKey.unique();
      const buyIn = 5000;

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('full');
    });

    it('should reject join when game has started', () => {
      const game = createMockGame({
        stage: GameStage.PreFlop,
      });
      const player = PublicKey.unique();
      const buyIn = 5000;

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('started');
    });

    it('should reject join when player already in game', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 1,
        players: [player, ...Array(5).fill(PublicKey.default)],
      });
      const buyIn = 5000;

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already');
    });

    it('should reject buy-in below minimum', () => {
      const game = createMockGame({
        minBuyIn: new BN(1000),
      });
      const player = PublicKey.unique();
      const buyIn = 500; // Below minimum

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should reject buy-in above maximum', () => {
      const game = createMockGame({
        maxBuyIn: new BN(50000),
      });
      const player = PublicKey.unique();
      const buyIn = 100000; // Above maximum

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should accept buy-in at minimum', () => {
      const game = createMockGame({
        minBuyIn: new BN(1000),
        maxBuyIn: new BN(50000),
      });
      const player = PublicKey.unique();
      const buyIn = 1000; // Exactly minimum

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(true);
    });

    it('should accept buy-in at maximum', () => {
      const game = createMockGame({
        minBuyIn: new BN(1000),
        maxBuyIn: new BN(50000),
      });
      const player = PublicKey.unique();
      const buyIn = 50000; // Exactly maximum

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(true);
    });

    it('should handle BN buy-in', () => {
      const game = createMockGame();
      const player = PublicKey.unique();
      const buyIn = new BN(5000);

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(true);
    });
  });

  describe('Game Full Check', () => {
    it('should detect full game', () => {
      const game = createMockGame({
        maxPlayers: 6,
        playerCount: 6,
      });

      expect(PlayerJoin.isGameFull(game)).toBe(true);
    });

    it('should detect non-full game', () => {
      const game = createMockGame({
        maxPlayers: 6,
        playerCount: 3,
      });

      expect(PlayerJoin.isGameFull(game)).toBe(false);
    });

    it('should detect empty game', () => {
      const game = createMockGame({
        maxPlayers: 6,
        playerCount: 0,
      });

      expect(PlayerJoin.isGameFull(game)).toBe(false);
    });

    it('should handle edge case of 1 seat left', () => {
      const game = createMockGame({
        maxPlayers: 6,
        playerCount: 5,
      });

      expect(PlayerJoin.isGameFull(game)).toBe(false);
    });
  });

  describe('Player In Game Check', () => {
    it('should detect player in game', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 3,
        players: [player, PublicKey.unique(), PublicKey.unique(), ...Array(3).fill(PublicKey.default)],
      });

      expect(PlayerJoin.isPlayerInGame(game, player)).toBe(true);
    });

    it('should detect player not in game', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 2,
        players: [PublicKey.unique(), PublicKey.unique(), ...Array(4).fill(PublicKey.default)],
      });

      expect(PlayerJoin.isPlayerInGame(game, player)).toBe(false);
    });

    it('should handle empty game', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 0,
      });

      expect(PlayerJoin.isPlayerInGame(game, player)).toBe(false);
    });

    it('should find player at different positions', () => {
      const player = PublicKey.unique();
      
      // Test player at each position
      for (let i = 0; i < 6; i++) {
        const players = Array(6).fill(PublicKey.default);
        players[i] = player;
        
        const game = createMockGame({
          playerCount: i + 1,
          players,
        });

        expect(PlayerJoin.isPlayerInGame(game, player)).toBe(true);
      }
    });
  });

  describe('Available Seats', () => {
    it('should calculate available seats correctly', () => {
      const game = createMockGame({
        maxPlayers: 6,
        playerCount: 2,
      });

      expect(PlayerJoin.getAvailableSeats(game)).toBe(4);
    });

    it('should return 0 for full game', () => {
      const game = createMockGame({
        maxPlayers: 6,
        playerCount: 6,
      });

      expect(PlayerJoin.getAvailableSeats(game)).toBe(0);
    });

    it('should return max for empty game', () => {
      const game = createMockGame({
        maxPlayers: 6,
        playerCount: 0,
      });

      expect(PlayerJoin.getAvailableSeats(game)).toBe(6);
    });

    it('should handle different max players', () => {
      const game = createMockGame({
        maxPlayers: 4,
        playerCount: 1,
      });

      expect(PlayerJoin.getAvailableSeats(game)).toBe(3);
    });
  });

  describe('Get Player Seat Index', () => {
    it('should return correct seat index', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 3,
        players: [PublicKey.unique(), player, PublicKey.unique(), ...Array(3).fill(PublicKey.default)],
      });

      expect(PlayerJoin.getPlayerSeatIndex(game, player)).toBe(1);
    });

    it('should return -1 for player not in game', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 2,
        players: [PublicKey.unique(), PublicKey.unique(), ...Array(4).fill(PublicKey.default)],
      });

      expect(PlayerJoin.getPlayerSeatIndex(game, player)).toBe(-1);
    });

    it('should return 0 for first player', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 1,
        players: [player, ...Array(5).fill(PublicKey.default)],
      });

      expect(PlayerJoin.getPlayerSeatIndex(game, player)).toBe(0);
    });

    it('should return correct index for last seat', () => {
      const player = PublicKey.unique();
      const players = Array(6).fill(null).map(() => PublicKey.unique());
      players[5] = player;
      
      const game = createMockGame({
        playerCount: 6,
        players,
      });

      expect(PlayerJoin.getPlayerSeatIndex(game, player)).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large buy-in', () => {
      const game = createMockGame({
        minBuyIn: new BN(1000),
        maxBuyIn: new BN(1000000),
      });
      const player = PublicKey.unique();
      const buyIn = 999999;

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(true);
    });

    it('should handle minimum player count game', () => {
      const game = createMockGame({
        maxPlayers: 2,
        playerCount: 0,
      });
      const player = PublicKey.unique();
      const buyIn = 5000;

      const result = PlayerJoin.validateJoin(game, buyIn, player);
      expect(result.valid).toBe(true);
    });

    it('should handle all game stages except Waiting', () => {
      const stages = [
        GameStage.PreFlop,
        GameStage.Flop,
        GameStage.Turn,
        GameStage.River,
        GameStage.Showdown,
        GameStage.Finished,
      ];

      stages.forEach(stage => {
        const game = createMockGame({ stage });
        const player = PublicKey.unique();
        const buyIn = 5000;

        const result = PlayerJoin.validateJoin(game, buyIn, player);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('started');
      });
    });
  });
});
