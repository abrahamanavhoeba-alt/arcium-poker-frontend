/**
 * Tests for showdown/winner.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ShowdownWinner } from '../../lib/showdown/winner';
import { Game, PlayerState, GameStage, PlayerStatus } from '../../lib/shared/types';

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

const createMockPlayerState = (overrides?: Partial<PlayerState>): PlayerState => ({
  player: PublicKey.unique(),
  game: PublicKey.unique(),
  seatIndex: 0,
  status: PlayerStatus.Active,
  chipStack: new BN(5000),
  currentBet: new BN(0),
  totalBetThisHand: new BN(100),
  encryptedHoleCards: [0, 0],
  hasCards: true,
  hasFolded: false,
  isAllIn: false,
  joinedAt: new BN(Date.now()),
  lastActionAt: new BN(Date.now()),
  bump: 0,
  ...overrides,
});

describe('ShowdownWinner', () => {
  describe('Determine Winners', () => {
    it('should determine single winner when only one active player', () => {
      const game = createMockGame({ pot: new BN(1000) });
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: true }),
        createMockPlayerState({ hasFolded: true }),
      ];

      const winners = ShowdownWinner.determineWinners(game, playerStates);
      expect(winners.length).toBe(1);
      expect(winners[0].winAmount.toNumber()).toBe(1000);
    });

    it('should split pot equally among multiple winners', () => {
      const game = createMockGame({ pot: new BN(1000) });
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: false }),
      ];

      const winners = ShowdownWinner.determineWinners(game, playerStates);
      expect(winners.length).toBe(2);
      expect(winners[0].winAmount.toNumber()).toBe(500);
      expect(winners[1].winAmount.toNumber()).toBe(500);
    });

    it('should return empty array when no active players', () => {
      const game = createMockGame();
      const playerStates = [
        createMockPlayerState({ hasFolded: true, chipStack: new BN(0), totalBetThisHand: new BN(0) }),
        createMockPlayerState({ hasFolded: true, chipStack: new BN(0), totalBetThisHand: new BN(0) }),
      ];

      const winners = ShowdownWinner.determineWinners(game, playerStates);
      expect(winners.length).toBe(0);
    });

    it('should handle three-way split', () => {
      const game = createMockGame({ pot: new BN(900) });
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: false }),
      ];

      const winners = ShowdownWinner.determineWinners(game, playerStates);
      expect(winners.length).toBe(3);
      expect(winners[0].winAmount.toNumber()).toBe(300);
    });
  });

  describe('Winner Checks', () => {
    it('should identify if player is winner', () => {
      const player = PublicKey.unique();
      const winners = [
        {
          player,
          playerState: createMockPlayerState({ player }),
          winAmount: new BN(500),
        },
      ];

      expect(ShowdownWinner.isWinner(player, winners)).toBe(true);
    });

    it('should identify if player is not winner', () => {
      const player = PublicKey.unique();
      const winners = [
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(500),
        },
      ];

      expect(ShowdownWinner.isWinner(player, winners)).toBe(false);
    });
  });

  describe('Player Winnings', () => {
    it('should return correct winnings for winner', () => {
      const player = PublicKey.unique();
      const winners = [
        {
          player,
          playerState: createMockPlayerState({ player }),
          winAmount: new BN(750),
        },
      ];

      const winnings = ShowdownWinner.getPlayerWinnings(player, winners);
      expect(winnings.toNumber()).toBe(750);
    });

    it('should return zero for non-winner', () => {
      const player = PublicKey.unique();
      const winners = [
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(750),
        },
      ];

      const winnings = ShowdownWinner.getPlayerWinnings(player, winners);
      expect(winnings.toNumber()).toBe(0);
    });
  });

  describe('Total Winnings', () => {
    it('should calculate total winnings correctly', () => {
      const winners = [
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(300),
        },
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(400),
        },
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(300),
        },
      ];

      const total = ShowdownWinner.getTotalWinnings(winners);
      expect(total.toNumber()).toBe(1000);
    });

    it('should return zero for no winners', () => {
      const total = ShowdownWinner.getTotalWinnings([]);
      expect(total.toNumber()).toBe(0);
    });
  });

  describe('Winner Count Checks', () => {
    it('should detect single winner', () => {
      const winners = [
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(1000),
        },
      ];

      expect(ShowdownWinner.hasSingleWinner(winners)).toBe(true);
      expect(ShowdownWinner.isSplitPot(winners)).toBe(false);
    });

    it('should detect split pot', () => {
      const winners = [
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(500),
        },
        {
          player: PublicKey.unique(),
          playerState: createMockPlayerState(),
          winAmount: new BN(500),
        },
      ];

      expect(ShowdownWinner.hasSingleWinner(winners)).toBe(false);
      expect(ShowdownWinner.isSplitPot(winners)).toBe(true);
    });
  });
});
