/**
 * Integration Test - Edge Cases
 * 
 * Tests edge cases and error conditions.
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GameLogic } from '../../lib/game/logic';
import { PotManager } from '../../lib/betting/pot-manager';
import { BetValidator } from '../../lib/betting/validator';
import { PlayerLeave } from '../../lib/player/leave';
import { ShowdownWinner } from '../../lib/showdown/winner';
import { IntegrityChecker } from '../../lib/security/integrity';
import { InputValidator } from '../../lib/security/validation';
import { Game, PlayerState, GameStage, PlayerStatus } from '../../lib/shared/types';

const createMockGame = (overrides?: Partial<Game>): Game => ({
  authority: PublicKey.unique(),
  gameId: new BN(1),
  stage: GameStage.PreFlop,
  smallBlind: new BN(10),
  bigBlind: new BN(20),
  minBuyIn: new BN(1000),
  maxBuyIn: new BN(10000),
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

const createMockPlayerState = (overrides?: Partial<PlayerState>): PlayerState => ({
  player: PublicKey.unique(),
  game: PublicKey.unique(),
  seatIndex: 0,
  status: PlayerStatus.Active,
  chipStack: new BN(5000),
  currentBet: new BN(0),
  totalBetThisHand: new BN(0),
  encryptedHoleCards: [0, 0],
  hasCards: true,
  hasFolded: false,
  isAllIn: false,
  joinedAt: new BN(Date.now()),
  lastActionAt: new BN(Date.now()),
  bump: 0,
  ...overrides,
});

describe('Edge Cases Integration', () => {
  describe('All-In Scenarios', () => {
    it('should handle all players going all-in', () => {
      const game = createMockGame();
      const playerStates = [
        createMockPlayerState({ chipStack: new BN(0), isAllIn: true, totalBetThisHand: new BN(1000) }),
        createMockPlayerState({ chipStack: new BN(0), isAllIn: true, totalBetThisHand: new BN(1000) }),
        createMockPlayerState({ chipStack: new BN(0), isAllIn: true, totalBetThisHand: new BN(1000) }),
      ];

      expect(GameLogic.areAllPlayersAllIn(playerStates)).toBe(true);
      expect(GameLogic.shouldProceedToShowdown(game, playerStates)).toBe(true);
    });

    it('should handle mixed all-in and folded players', () => {
      const playerStates = [
        createMockPlayerState({ chipStack: new BN(0), isAllIn: true, hasFolded: false }),
        createMockPlayerState({ chipStack: new BN(1000), isAllIn: false, hasFolded: true }),
        createMockPlayerState({ chipStack: new BN(0), isAllIn: true, hasFolded: false }),
      ];

      const activePlayers = playerStates.filter(ps => !ps.hasFolded);
      expect(activePlayers.length).toBe(2);
      expect(GameLogic.areAllPlayersAllIn(activePlayers)).toBe(true);
    });

    it('should calculate side pots with all-in players', () => {
      const playerStates = [
        createMockPlayerState({ seatIndex: 0, totalBetThisHand: new BN(50), hasFolded: false, isAllIn: true }),
        createMockPlayerState({ seatIndex: 1, totalBetThisHand: new BN(150), hasFolded: false, isAllIn: true }),
        createMockPlayerState({ seatIndex: 2, totalBetThisHand: new BN(300), hasFolded: false, isAllIn: false }),
      ];

      const pots = PotManager.calculatePots(playerStates);
      expect(pots.sidePots.length).toBeGreaterThan(0);
      expect(pots.totalPot.toNumber()).toBe(500);
    });
  });

  describe('Single Player Scenarios', () => {
    it('should handle everyone folding except one player', () => {
      const game = createMockGame();
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: true }),
        createMockPlayerState({ hasFolded: true }),
      ];

      expect(GameLogic.getActivePlayerCount(playerStates)).toBe(1);
      expect(GameLogic.shouldProceedToShowdown(game, playerStates)).toBe(true);

      const winners = ShowdownWinner.determineWinners(game, playerStates.filter(ps => !ps.hasFolded));
      expect(winners.length).toBe(1);
    });
  });

  describe('Zero/Negative Values', () => {
    it('should handle zero chip stacks', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(0) });
      expect(playerState.chipStack.toNumber()).toBe(0);
      expect(IntegrityChecker.verifyPlayerState(playerState)).toBe(true);
    });

    it('should reject negative pot', () => {
      const game = createMockGame({ pot: new BN(-100) });
      expect(IntegrityChecker.verifyGameState(game)).toBe(false);
    });

    it('should reject negative chip stack', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(-100) });
      expect(IntegrityChecker.verifyPlayerState(playerState)).toBe(false);
    });
  });

  describe('Invalid Actions', () => {
    it('should reject fold when already folded', () => {
      const game = createMockGame();
      const playerState = createMockPlayerState({ hasFolded: true });

      const validation = BetValidator.validateFold(game, playerState);
      expect(validation.valid).toBe(false);
    });

    it('should reject check when bet is required', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ currentBet: new BN(0) });

      const validation = BetValidator.validateCheck(game, playerState);
      expect(validation.valid).toBe(false);
    });

    it('should reject bet with insufficient chips', () => {
      const game = createMockGame();
      const playerState = createMockPlayerState({ chipStack: new BN(50) });

      const validation = GameLogic.validateBetAmount(new BN(100), game, playerState);
      expect(validation.valid).toBe(false);
    });

    it('should reject raise below minimum', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const validation = GameLogic.validateRaiseAmount(new BN(150), game, playerState);
      expect(validation.valid).toBe(false);
    });
  });

  describe('Game State Transitions', () => {
    it('should reject leaving after game started', () => {
      const game = createMockGame({ stage: GameStage.Flop });
      const playerState = createMockPlayerState();

      const validation = PlayerLeave.validateLeave(game, playerState);
      expect(validation.valid).toBe(false);
    });

    it('should reject starting game with insufficient players', () => {
      const game = createMockGame({ playerCount: 1, stage: GameStage.Waiting });

      const validation = GameLogic.validateGameStart(game);
      expect(validation.valid).toBe(false);
    });

    it('should reject starting already started game', () => {
      const game = createMockGame({ stage: GameStage.Flop });

      const validation = GameLogic.validateGameStart(game);
      expect(validation.valid).toBe(false);
    });
  });

  describe('Pot Integrity', () => {
    it('should verify pot matches player bets', () => {
      const game = createMockGame({ pot: new BN(300) });
      const playerStates = [
        createMockPlayerState({ totalBetThisHand: new BN(100) }),
        createMockPlayerState({ totalBetThisHand: new BN(100) }),
        createMockPlayerState({ totalBetThisHand: new BN(100) }),
      ];

      expect(IntegrityChecker.verifyPotIntegrity(game, playerStates)).toBe(true);
    });

    it('should detect pot mismatch', () => {
      const game = createMockGame({ pot: new BN(500) });
      const playerStates = [
        createMockPlayerState({ totalBetThisHand: new BN(100) }),
        createMockPlayerState({ totalBetThisHand: new BN(100) }),
      ];

      expect(IntegrityChecker.verifyPotIntegrity(game, playerStates)).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate public keys', () => {
      const valid = InputValidator.validatePublicKey(PublicKey.default.toBase58());
      expect(valid.valid).toBe(true);

      const invalid = InputValidator.validatePublicKey('invalid-key');
      expect(invalid.valid).toBe(false);
    });

    it('should validate amounts with min/max', () => {
      const amount = new BN(500);
      const min = new BN(100);
      const max = new BN(1000);

      const valid = InputValidator.validateAmount(amount, min, max);
      expect(valid.valid).toBe(true);

      const tooLow = InputValidator.validateAmount(new BN(50), min, max);
      expect(tooLow.valid).toBe(false);

      const tooHigh = InputValidator.validateAmount(new BN(2000), min, max);
      expect(tooHigh.valid).toBe(false);
    });

    it('should validate player count', () => {
      const valid = InputValidator.validatePlayerCount(4, 2, 6);
      expect(valid.valid).toBe(true);

      const invalid = InputValidator.validatePlayerCount(1, 2, 6);
      expect(invalid.valid).toBe(false);
    });
  });

  describe('Empty/No Players', () => {
    it('should handle empty player list', () => {
      const game = createMockGame({ pot: new BN(100) });
      const playerStates: PlayerState[] = [];

      const winners = ShowdownWinner.determineWinners(game, playerStates);
      expect(winners.length).toBe(0);

      const pots = PotManager.calculatePots(playerStates);
      expect(pots.totalPot.toNumber()).toBe(0);
    });
  });

  describe('Extreme Values', () => {
    it('should handle very large chip stacks', () => {
      const largeAmount = new BN('1000000000000'); // 1 trillion
      const playerState = createMockPlayerState({ chipStack: largeAmount });

      expect(playerState.chipStack.gt(new BN(0))).toBe(true);
      expect(IntegrityChecker.verifyPlayerState(playerState)).toBe(true);
    });

    it('should handle maximum players', () => {
      const game = createMockGame({ maxPlayers: 10, playerCount: 10 });
      expect(game.playerCount).toBe(game.maxPlayers);
    });
  });

  describe('Tie Scenarios', () => {
    it('should handle split pot with tied hands', () => {
      const game = createMockGame({ pot: new BN(1000) });
      const playerStates = [
        createMockPlayerState({ seatIndex: 0, hasFolded: false }),
        createMockPlayerState({ seatIndex: 1, hasFolded: false }),
      ];

      // Both players have equal bets, simulating a tie
      const winners = ShowdownWinner.determineWinners(game, playerStates);
      expect(winners.length).toBe(2);

      const distribution = PotManager.distributePot(game.pot, [0, 1]);
      expect(distribution.get(0)?.toNumber()).toBe(500);
      expect(distribution.get(1)?.toNumber()).toBe(500);
    });

    it('should handle odd chip in split pot', () => {
      const potAmount = new BN(1001);
      const distribution = PotManager.distributePot(potAmount, [0, 1]);

      const player1 = distribution.get(0)!.toNumber();
      const player2 = distribution.get(1)!.toNumber();

      expect(player1 + player2).toBe(1001);
      expect(Math.abs(player1 - player2)).toBeLessThanOrEqual(1);
    });
  });
});
