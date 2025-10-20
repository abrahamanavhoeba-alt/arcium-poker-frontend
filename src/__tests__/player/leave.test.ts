/**
 * Tests for player/leave.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PlayerLeave } from '../../lib/player/leave';
import { Game, PlayerState, GameStage, PlayerStatus } from '../../lib/shared/types';

const createMockGame = (overrides?: Partial<Game>): Game => ({
  authority: PublicKey.unique(),
  gameId: new BN(123),
  stage: GameStage.Waiting,
  smallBlind: new BN(10),
  bigBlind: new BN(20),
  minBuyIn: new BN(1000),
  maxBuyIn: new BN(50000),
  maxPlayers: 6,
  playerCount: 2,
  players: Array(6).fill(PublicKey.default),
  activePlayers: Array(6).fill(false),
  dealerPosition: 0,
  currentPlayerIndex: 0,
  pot: new BN(0),
  currentBet: new BN(0),
  playersActed: Array(6).fill(false),
  communityCards: [0, 0, 0, 0, 0],
  communityCardsRevealed: 0,
  encryptedDeck: Array(32).fill(0),
  deckInitialized: false,
  startedAt: new BN(0),
  lastActionAt: new BN(0),
  shuffleSessionId: Array(32).fill(0),
  bump: 0,
  ...overrides,
});

const createMockPlayerState = (overrides?: Partial<PlayerState>): PlayerState => ({
  player: PublicKey.unique(),
  game: PublicKey.unique(),
  seatIndex: 0,
  status: PlayerStatus.Active,
  chipStack: new BN(5000),
  currentBet: new BN(0),
  totalBetThisHand: new BN(0),
  encryptedHoleCards: [0, 0],
  hasCards: false,
  hasFolded: false,
  isAllIn: false,
  joinedAt: new BN(Date.now()),
  lastActionAt: new BN(Date.now()),
  bump: 0,
  ...overrides,
});

describe('PlayerLeave', () => {
  describe('Validation', () => {
    it('should allow leave in Waiting stage', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(true);
    });

    it('should reject leave after game has started', () => {
      const game = createMockGame({ stage: GameStage.PreFlop });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('started');
    });

    it('should reject leave in Flop stage', () => {
      const game = createMockGame({ stage: GameStage.Flop });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(false);
    });

    it('should reject leave in Turn stage', () => {
      const game = createMockGame({ stage: GameStage.Turn });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(false);
    });

    it('should reject leave in River stage', () => {
      const game = createMockGame({ stage: GameStage.River });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(false);
    });

    it('should reject leave in Showdown stage', () => {
      const game = createMockGame({ stage: GameStage.Showdown });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(false);
    });

    it('should reject leave when player has no chips', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      const playerState = createMockPlayerState({ chipStack: new BN(0) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no chips');
    });

    it('should allow leave with any chip amount', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      const chipAmounts = [1, 100, 1000, 5000, 10000];

      chipAmounts.forEach(amount => {
        const playerState = createMockPlayerState({ chipStack: new BN(amount) });
        const result = PlayerLeave.validateLeave(game, playerState);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Refund Calculation', () => {
    it('should calculate correct refund amount', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });
      const refund = PlayerLeave.getRefundAmount(playerState);
      expect(refund.toNumber()).toBe(5000);
    });

    it('should return zero for player with no chips', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(0) });
      const refund = PlayerLeave.getRefundAmount(playerState);
      expect(refund.toNumber()).toBe(0);
    });

    it('should handle large chip amounts', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(1000000) });
      const refund = PlayerLeave.getRefundAmount(playerState);
      expect(refund.toNumber()).toBe(1000000);
    });

    it('should return exact chip stack amount', () => {
      const amounts = [1, 50, 500, 2500, 7500];
      amounts.forEach(amount => {
        const playerState = createMockPlayerState({ chipStack: new BN(amount) });
        const refund = PlayerLeave.getRefundAmount(playerState);
        expect(refund.toNumber()).toBe(amount);
      });
    });
  });

  describe('Player Left Check', () => {
    it('should detect player has left when chips are zero', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(0) });
      expect(PlayerLeave.hasPlayerLeft(playerState)).toBe(true);
    });

    it('should detect player has not left when chips are positive', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });
      expect(PlayerLeave.hasPlayerLeft(playerState)).toBe(false);
    });

    it('should detect player has not left with minimum chips', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(1) });
      expect(PlayerLeave.hasPlayerLeft(playerState)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle player leaving immediately after joining', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      const playerState = createMockPlayerState({
        chipStack: new BN(5000),
        joinedAt: new BN(Date.now()),
      });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(true);
    });

    it('should handle minimum buy-in amount', () => {
      const game = createMockGame({ 
        stage: GameStage.Waiting,
        minBuyIn: new BN(1000)
      });
      const playerState = createMockPlayerState({ chipStack: new BN(1000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(true);
    });

    it('should handle maximum buy-in amount', () => {
      const game = createMockGame({ 
        stage: GameStage.Waiting,
        maxBuyIn: new BN(50000)
      });
      const playerState = createMockPlayerState({ chipStack: new BN(50000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(true);
    });

    it('should reject leave in Finished stage', () => {
      const game = createMockGame({ stage: GameStage.Finished });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const result = PlayerLeave.validateLeave(game, playerState);
      expect(result.valid).toBe(false);
    });
  });
});
