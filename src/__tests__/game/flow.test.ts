/**
 * Tests for game/flow.ts
 */

import { describe, it, expect } from '@jest/globals';
import { GameFlow } from '../../lib/game/flow';
import { Game, GameStage } from '../../lib/shared/types';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

const createMockGame = (overrides?: Partial<Game>): Game => ({
  authority: PublicKey.unique(),
  gameId: new BN(123),
  stage: GameStage.PreFlop,
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
  pot: new BN(0),
  currentBet: new BN(0),
  playersActed: Array(6).fill(false),
  communityCards: [0, 0, 0, 0, 0],
  communityCardsRevealed: 0,
  encryptedDeck: Array(32).fill(0),
  deckInitialized: true,
  startedAt: new BN(Date.now()),
  lastActionAt: new BN(Date.now()),
  shuffleSessionId: Array(32).fill(0),
  bump: 0,
  ...overrides,
});

describe('GameFlow', () => {
  describe('Validation', () => {
    it('should allow advance from PreFlop', () => {
      const game = createMockGame({ stage: GameStage.PreFlop });
      const result = GameFlow.validateAdvance(game);
      expect(result.valid).toBe(true);
    });

    it('should allow advance from Flop', () => {
      const game = createMockGame({ stage: GameStage.Flop });
      const result = GameFlow.validateAdvance(game);
      expect(result.valid).toBe(true);
    });

    it('should allow advance from Turn', () => {
      const game = createMockGame({ stage: GameStage.Turn });
      const result = GameFlow.validateAdvance(game);
      expect(result.valid).toBe(true);
    });

    it('should allow advance from River', () => {
      const game = createMockGame({ stage: GameStage.River });
      const result = GameFlow.validateAdvance(game);
      expect(result.valid).toBe(true);
    });

    it('should allow advance from Showdown', () => {
      const game = createMockGame({ stage: GameStage.Showdown });
      const result = GameFlow.validateAdvance(game);
      expect(result.valid).toBe(true);
    });

    it('should reject advance from Waiting', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      const result = GameFlow.validateAdvance(game);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not started');
    });

    it('should reject advance from Finished', () => {
      const game = createMockGame({ stage: GameStage.Finished });
      const result = GameFlow.validateAdvance(game);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finished');
    });
  });

  describe('Stage Progression', () => {
    it('should get correct next stage for each stage', () => {
      expect(GameFlow.getNextStage(GameStage.Waiting)).toBe(GameStage.PreFlop);
      expect(GameFlow.getNextStage(GameStage.PreFlop)).toBe(GameStage.Flop);
      expect(GameFlow.getNextStage(GameStage.Flop)).toBe(GameStage.Turn);
      expect(GameFlow.getNextStage(GameStage.Turn)).toBe(GameStage.River);
      expect(GameFlow.getNextStage(GameStage.River)).toBe(GameStage.Showdown);
      expect(GameFlow.getNextStage(GameStage.Showdown)).toBe(GameStage.Finished);
      expect(GameFlow.getNextStage(GameStage.Finished)).toBeNull();
    });
  });

  describe('Stage Descriptions', () => {
    it('should return correct stage descriptions', () => {
      expect(GameFlow.getStageDescription(GameStage.Waiting)).toContain('Waiting');
      expect(GameFlow.getStageDescription(GameStage.PreFlop)).toContain('Pre-flop');
      expect(GameFlow.getStageDescription(GameStage.Flop)).toContain('3 community');
      expect(GameFlow.getStageDescription(GameStage.Turn)).toContain('4th');
      expect(GameFlow.getStageDescription(GameStage.River)).toContain('5th');
      expect(GameFlow.getStageDescription(GameStage.Showdown)).toContain('Showdown');
      expect(GameFlow.getStageDescription(GameStage.Finished)).toContain('finished');
    });
  });

  describe('Community Card Count', () => {
    it('should return correct card count for each stage', () => {
      expect(GameFlow.getCommunityCardCount(GameStage.Waiting)).toBe(0);
      expect(GameFlow.getCommunityCardCount(GameStage.PreFlop)).toBe(0);
      expect(GameFlow.getCommunityCardCount(GameStage.Flop)).toBe(3);
      expect(GameFlow.getCommunityCardCount(GameStage.Turn)).toBe(4);
      expect(GameFlow.getCommunityCardCount(GameStage.River)).toBe(5);
      expect(GameFlow.getCommunityCardCount(GameStage.Showdown)).toBe(5);
      expect(GameFlow.getCommunityCardCount(GameStage.Finished)).toBe(5);
    });
  });

  describe('Active Stage Check', () => {
    it('should identify active stages', () => {
      expect(GameFlow.isActiveStage(GameStage.PreFlop)).toBe(true);
      expect(GameFlow.isActiveStage(GameStage.Flop)).toBe(true);
      expect(GameFlow.isActiveStage(GameStage.Turn)).toBe(true);
      expect(GameFlow.isActiveStage(GameStage.River)).toBe(true);
    });

    it('should identify inactive stages', () => {
      expect(GameFlow.isActiveStage(GameStage.Waiting)).toBe(false);
      expect(GameFlow.isActiveStage(GameStage.Showdown)).toBe(false);
      expect(GameFlow.isActiveStage(GameStage.Finished)).toBe(false);
    });
  });

  describe('Game In Progress', () => {
    it('should detect game in progress', () => {
      expect(GameFlow.isGameInProgress(createMockGame({ stage: GameStage.PreFlop }))).toBe(true);
      expect(GameFlow.isGameInProgress(createMockGame({ stage: GameStage.Flop }))).toBe(true);
      expect(GameFlow.isGameInProgress(createMockGame({ stage: GameStage.Turn }))).toBe(true);
      expect(GameFlow.isGameInProgress(createMockGame({ stage: GameStage.River }))).toBe(true);
      expect(GameFlow.isGameInProgress(createMockGame({ stage: GameStage.Showdown }))).toBe(true);
    });

    it('should detect game not in progress', () => {
      expect(GameFlow.isGameInProgress(createMockGame({ stage: GameStage.Waiting }))).toBe(false);
      expect(GameFlow.isGameInProgress(createMockGame({ stage: GameStage.Finished }))).toBe(false);
    });
  });

  describe('Stage Progress', () => {
    it('should return correct progress percentage', () => {
      expect(GameFlow.getStageProgress(GameStage.Waiting)).toBe(0);
      expect(GameFlow.getStageProgress(GameStage.PreFlop)).toBe(20);
      expect(GameFlow.getStageProgress(GameStage.Flop)).toBe(40);
      expect(GameFlow.getStageProgress(GameStage.Turn)).toBe(60);
      expect(GameFlow.getStageProgress(GameStage.River)).toBe(80);
      expect(GameFlow.getStageProgress(GameStage.Showdown)).toBe(90);
      expect(GameFlow.getStageProgress(GameStage.Finished)).toBe(100);
    });

    it('should have increasing progress through stages', () => {
      const stages = [
        GameStage.Waiting,
        GameStage.PreFlop,
        GameStage.Flop,
        GameStage.Turn,
        GameStage.River,
        GameStage.Showdown,
        GameStage.Finished,
      ];

      for (let i = 1; i < stages.length; i++) {
        const prevProgress = GameFlow.getStageProgress(stages[i - 1]);
        const currProgress = GameFlow.getStageProgress(stages[i]);
        expect(currProgress).toBeGreaterThan(prevProgress);
      }
    });
  });

  describe('Stage Names', () => {
    it('should return stage name', () => {
      expect(GameFlow.getStageName(GameStage.PreFlop)).toBe(GameStage.PreFlop);
      expect(GameFlow.getStageName(GameStage.Flop)).toBe(GameStage.Flop);
    });
  });
});
