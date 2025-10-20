/**
 * Tests for game/logic.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GameLogic } from '../../lib/game/logic';
import { Game, PlayerState, GameStage, PlayerStatus } from '../../lib/shared/types';

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
  players: [PublicKey.unique(), PublicKey.unique(), PublicKey.unique(), ...Array(3).fill(PublicKey.default)],
  activePlayers: [true, true, true, false, false, false],
  dealerPosition: 0,
  currentPlayerIndex: 0,
  pot: new BN(500),
  currentBet: new BN(100),
  playersActed: [false, false, false, false, false, false],
  communityCards: [0, 0, 0, 0, 0],
  communityCardsRevealed: 3,
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

describe('GameLogic', () => {
  describe('Game Start Validation', () => {
    it('should allow game start with enough players', () => {
      const game = createMockGame({ stage: GameStage.Waiting, playerCount: 2 });
      const result = GameLogic.validateGameStart(game);
      expect(result.valid).toBe(true);
    });

    it('should reject game start with insufficient players', () => {
      const game = createMockGame({ stage: GameStage.Waiting, playerCount: 1 });
      const result = GameLogic.validateGameStart(game);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should reject game start when already started', () => {
      const game = createMockGame({ stage: GameStage.PreFlop, playerCount: 3 });
      const result = GameLogic.validateGameStart(game);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already started');
    });
  });

  describe('Betting Round Complete', () => {
    it('should detect round complete when only one player left', () => {
      const game = createMockGame();
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: true }),
        createMockPlayerState({ hasFolded: true }),
      ];

      expect(GameLogic.isBettingRoundComplete(game, playerStates)).toBe(true);
    });

    it('should detect round incomplete when players haven\'t acted', () => {
      const game = createMockGame({ playersActed: [false, false, false, false, false, false] });
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: false }),
      ];

      expect(GameLogic.isBettingRoundComplete(game, playerStates)).toBe(false);
    });

    it('should detect round complete when all acted and matched', () => {
      const players = [PublicKey.unique(), PublicKey.unique()];
      const game = createMockGame({
        currentBet: new BN(100),
        playerCount: 2,
        players: [...players, ...Array(4).fill(PublicKey.default)],
        playersActed: [true, true, false, false, false, false],
      });
      const playerStates = [
        createMockPlayerState({ player: players[0], currentBet: new BN(100), hasFolded: false }),
        createMockPlayerState({ player: players[1], currentBet: new BN(100), hasFolded: false }),
      ];

      expect(GameLogic.isBettingRoundComplete(game, playerStates)).toBe(true);
    });
  });

  describe('Action Checks', () => {
    it('should allow check when bet is matched', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ currentBet: new BN(100) });

      expect(GameLogic.canCheck(game, playerState)).toBe(true);
    });

    it('should not allow check when bet is not matched', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ currentBet: new BN(0) });

      expect(GameLogic.canCheck(game, playerState)).toBe(false);
    });

    it('should allow call when there is a bet to call', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ currentBet: new BN(0), chipStack: new BN(5000) });

      expect(GameLogic.canCall(game, playerState)).toBe(true);
    });

    it('should not allow call with insufficient chips', () => {
      const game = createMockGame({ currentBet: new BN(1000) });
      const playerState = createMockPlayerState({ currentBet: new BN(0), chipStack: new BN(500) });

      expect(GameLogic.canCall(game, playerState)).toBe(false);
    });

    it('should allow bet when no current bet', () => {
      const game = createMockGame({ currentBet: new BN(0) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      expect(GameLogic.canBet(game, playerState)).toBe(true);
    });

    it('should not allow bet when there is already a bet', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      expect(GameLogic.canBet(game, playerState)).toBe(false);
    });

    it('should allow raise with sufficient chips', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      expect(GameLogic.canRaise(game, playerState)).toBe(true);
    });

    it('should not allow raise with insufficient chips', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ chipStack: new BN(150) });

      expect(GameLogic.canRaise(game, playerState)).toBe(false);
    });
  });

  describe('Amount Calculations', () => {
    it('should calculate call amount correctly', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ currentBet: new BN(20) });

      const callAmount = GameLogic.getCallAmount(game, playerState);
      expect(callAmount.toNumber()).toBe(80);
    });

    it('should calculate minimum raise', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const minRaise = GameLogic.getMinimumRaise(game);
      expect(minRaise.toNumber()).toBe(200);
    });

    it('should calculate pot odds', () => {
      const potSize = new BN(1000);
      const callAmount = new BN(100);
      const odds = GameLogic.calculatePotOdds(potSize, callAmount);

      expect(odds).toBeCloseTo(9.09, 1);
    });

    it('should return 0 pot odds for zero call', () => {
      const potSize = new BN(1000);
      const callAmount = new BN(0);
      const odds = GameLogic.calculatePotOdds(potSize, callAmount);

      expect(odds).toBe(0);
    });
  });

  describe('Bet Validation', () => {
    it('should validate correct bet amount', () => {
      const game = createMockGame({ bigBlind: new BN(20) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });
      const result = GameLogic.validateBetAmount(new BN(100), game, playerState);

      expect(result.valid).toBe(true);
    });

    it('should reject bet below big blind', () => {
      const game = createMockGame({ bigBlind: new BN(20) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });
      const result = GameLogic.validateBetAmount(new BN(10), game, playerState);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('big blind');
    });

    it('should reject bet with insufficient chips', () => {
      const game = createMockGame({ bigBlind: new BN(20) });
      const playerState = createMockPlayerState({ chipStack: new BN(50) });
      const result = GameLogic.validateBetAmount(new BN(100), game, playerState);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('Raise Validation', () => {
    it('should validate correct raise amount', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });
      const result = GameLogic.validateRaiseAmount(new BN(200), game, playerState);

      expect(result.valid).toBe(true);
    });

    it('should reject raise below minimum', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });
      const result = GameLogic.validateRaiseAmount(new BN(150), game, playerState);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('2x current bet');
    });
  });

  describe('Player Counting', () => {
    it('should count active players correctly', () => {
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: true }),
        createMockPlayerState({ hasFolded: false }),
      ];

      expect(GameLogic.getActivePlayerCount(playerStates)).toBe(2);
    });

    it('should detect all players all-in', () => {
      const playerStates = [
        createMockPlayerState({ hasFolded: false, isAllIn: true }),
        createMockPlayerState({ hasFolded: false, isAllIn: true }),
      ];

      expect(GameLogic.areAllPlayersAllIn(playerStates)).toBe(true);
    });

    it('should detect not all players all-in', () => {
      const playerStates = [
        createMockPlayerState({ hasFolded: false, isAllIn: true }),
        createMockPlayerState({ hasFolded: false, isAllIn: false }),
      ];

      expect(GameLogic.areAllPlayersAllIn(playerStates)).toBe(false);
    });
  });

  describe('Showdown Logic', () => {
    it('should proceed to showdown after River when betting complete', () => {
      const players = [PublicKey.unique(), PublicKey.unique()];
      const game = createMockGame({
        stage: GameStage.River,
        currentBet: new BN(100),
        playerCount: 2,
        players: [...players, ...Array(4).fill(PublicKey.default)],
        playersActed: [true, true, false, false, false, false],
      });
      const playerStates = [
        createMockPlayerState({ player: players[0], currentBet: new BN(100), hasFolded: false }),
        createMockPlayerState({ player: players[1], currentBet: new BN(100), hasFolded: false }),
      ];

      expect(GameLogic.shouldProceedToShowdown(game, playerStates)).toBe(true);
    });

    it('should proceed to showdown when only one player left', () => {
      const game = createMockGame({ stage: GameStage.Flop });
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: true }),
        createMockPlayerState({ hasFolded: true }),
      ];

      expect(GameLogic.shouldProceedToShowdown(game, playerStates)).toBe(true);
    });

    it('should proceed to showdown when all players all-in', () => {
      const game = createMockGame({ stage: GameStage.Flop });
      const playerStates = [
        createMockPlayerState({ hasFolded: false, isAllIn: true }),
        createMockPlayerState({ hasFolded: false, isAllIn: true }),
      ];

      expect(GameLogic.shouldProceedToShowdown(game, playerStates)).toBe(true);
    });
  });

  describe('Game Config Validation', () => {
    it('should validate correct game config', () => {
      const config = {
        smallBlind: new BN(10),
        bigBlind: new BN(20),
        minBuyIn: new BN(1000),
        maxBuyIn: new BN(50000),
        maxPlayers: 6,
      };

      const result = GameLogic.validateGameConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should reject config with invalid blinds', () => {
      const config = {
        smallBlind: new BN(20),
        bigBlind: new BN(10),
        minBuyIn: new BN(1000),
        maxBuyIn: new BN(50000),
        maxPlayers: 6,
      };

      const result = GameLogic.validateGameConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Big blind');
    });

    it('should reject config with min buy-in too low', () => {
      const config = {
        smallBlind: new BN(10),
        bigBlind: new BN(20),
        minBuyIn: new BN(500),
        maxBuyIn: new BN(50000),
        maxPlayers: 6,
      };

      const result = GameLogic.validateGameConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50 big blinds');
    });

    it('should reject config with invalid player count', () => {
      const config = {
        smallBlind: new BN(10),
        bigBlind: new BN(20),
        minBuyIn: new BN(1000),
        maxBuyIn: new BN(50000),
        maxPlayers: 1,
      };

      const result = GameLogic.validateGameConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between');
    });
  });

  describe('Next Player Logic', () => {
    it('should find next active player', () => {
      const players = [PublicKey.unique(), PublicKey.unique(), PublicKey.unique()];
      const game = createMockGame({
        currentPlayerIndex: 0,
        playerCount: 3,
        players: [...players, ...Array(3).fill(PublicKey.default)],
      });
      const playerStates = [
        createMockPlayerState({ player: players[0], hasFolded: false }),
        createMockPlayerState({ player: players[1], hasFolded: false }),
        createMockPlayerState({ player: players[2], hasFolded: false }),
      ];

      const nextIndex = GameLogic.getNextPlayerIndex(game, playerStates);
      expect(nextIndex).toBe(1);
    });

    it('should skip folded players', () => {
      const players = [PublicKey.unique(), PublicKey.unique(), PublicKey.unique()];
      const game = createMockGame({
        currentPlayerIndex: 0,
        playerCount: 3,
        players: [...players, ...Array(3).fill(PublicKey.default)],
      });
      const playerStates = [
        createMockPlayerState({ player: players[0], hasFolded: false }),
        createMockPlayerState({ player: players[1], hasFolded: true }),
        createMockPlayerState({ player: players[2], hasFolded: false }),
      ];

      const nextIndex = GameLogic.getNextPlayerIndex(game, playerStates);
      expect(nextIndex).toBe(2);
    });

    it('should return -1 when all other players are folded or all-in', () => {
      const players = [PublicKey.unique(), PublicKey.unique()];
      const game = createMockGame({
        currentPlayerIndex: 0,
        playerCount: 2,
        players: [...players, ...Array(4).fill(PublicKey.default)],
      });
      const playerStates = [
        createMockPlayerState({ player: players[0], hasFolded: false, isAllIn: true }),
        createMockPlayerState({ player: players[1], hasFolded: true }),
      ];

      // Player 0 is all-in, player 1 is folded, so no valid next player
      const nextIndex = GameLogic.getNextPlayerIndex(game, playerStates);
      expect(nextIndex).toBe(-1);
    });
  });
});
