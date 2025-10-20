/**
 * Tests for showdown/payout.ts
 */

import { describe, it, expect } from '@jest/globals';
import BN from 'bn.js';
import { ShowdownPayout } from '../../lib/showdown/payout';
import { Game, GameStage } from '../../lib/shared/types';
import { PublicKey } from '@solana/web3.js';

const createMockGame = (overrides?: Partial<Game>): Game => ({
  authority: PublicKey.unique(),
  gameId: new BN(123),
  stage: GameStage.Showdown,
  smallBlind: new BN(10),
  bigBlind: new BN(20),
  minBuyIn: new BN(1000),
  maxBuyIn: new BN(50000),
  maxPlayers: 6,
  playerCount: 3,
  players: Array(6).fill(PublicKey.default),
  activePlayers: Array(6).fill(false),
  dealerPosition: 0,
  currentPlayerIndex: 0,
  pot: new BN(1000),
  currentBet: new BN(0),
  playersActed: Array(6).fill(false),
  communityCards: [0, 0, 0, 0, 0],
  communityCardsRevealed: 5,
  encryptedDeck: Array(32).fill(0),
  deckInitialized: true,
  startedAt: new BN(Date.now()),
  lastActionAt: new BN(Date.now()),
  shuffleSessionId: Array(32).fill(0),
  bump: 0,
  ...overrides,
});

describe('ShowdownPayout', () => {
  describe('Validation', () => {
    it('should allow showdown execution in Showdown stage', () => {
      const game = createMockGame({ stage: GameStage.Showdown });
      const result = ShowdownPayout.validateShowdown(game);
      expect(result.valid).toBe(true);
    });

    it('should reject showdown execution in PreFlop stage', () => {
      const game = createMockGame({ stage: GameStage.PreFlop });
      const result = ShowdownPayout.validateShowdown(game);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Showdown stage');
    });

    it('should reject showdown execution in Waiting stage', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      const result = ShowdownPayout.validateShowdown(game);
      expect(result.valid).toBe(false);
    });

    it('should reject showdown execution in Finished stage', () => {
      const game = createMockGame({ stage: GameStage.Finished });
      const result = ShowdownPayout.validateShowdown(game);
      expect(result.valid).toBe(false);
    });
  });

  describe('Payout Calculation', () => {
    it('should calculate payout for single winner', () => {
      const potSize = new BN(1000);
      const payout = ShowdownPayout.calculatePayout(potSize, 1);
      expect(payout.toNumber()).toBe(1000);
    });

    it('should calculate payout for two winners', () => {
      const potSize = new BN(1000);
      const payout = ShowdownPayout.calculatePayout(potSize, 2);
      expect(payout.toNumber()).toBe(500);
    });

    it('should calculate payout for three winners', () => {
      const potSize = new BN(900);
      const payout = ShowdownPayout.calculatePayout(potSize, 3);
      expect(payout.toNumber()).toBe(300);
    });

    it('should return zero for zero winners', () => {
      const potSize = new BN(1000);
      const payout = ShowdownPayout.calculatePayout(potSize, 0);
      expect(payout.toNumber()).toBe(0);
    });

    it('should handle large pot sizes', () => {
      const potSize = new BN(1000000);
      const payout = ShowdownPayout.calculatePayout(potSize, 4);
      expect(payout.toNumber()).toBe(250000);
    });
  });

  describe('Side Pot Calculation', () => {
    it('should calculate total with no side pots', () => {
      const mainPot = new BN(1000);
      const sidePots: BN[] = [];
      const total = ShowdownPayout.calculateSidePots(mainPot, sidePots);
      expect(total.toNumber()).toBe(1000);
    });

    it('should calculate total with one side pot', () => {
      const mainPot = new BN(1000);
      const sidePots = [new BN(500)];
      const total = ShowdownPayout.calculateSidePots(mainPot, sidePots);
      expect(total.toNumber()).toBe(1500);
    });

    it('should calculate total with multiple side pots', () => {
      const mainPot = new BN(1000);
      const sidePots = [new BN(500), new BN(300), new BN(200)];
      const total = ShowdownPayout.calculateSidePots(mainPot, sidePots);
      expect(total.toNumber()).toBe(2000);
    });

    it('should handle zero main pot', () => {
      const mainPot = new BN(0);
      const sidePots = [new BN(500), new BN(300)];
      const total = ShowdownPayout.calculateSidePots(mainPot, sidePots);
      expect(total.toNumber()).toBe(800);
    });
  });
});
