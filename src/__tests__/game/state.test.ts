/**
 * Tests for game/state.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GameStateManager } from '../../lib/game/state';
import { Game, GameStage } from '../../lib/shared/types';

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
  startedAt: new BN(Math.floor(Date.now() / 1000) - 300), // 5 minutes ago
  lastActionAt: new BN(Math.floor(Date.now() / 1000) - 10), // 10 seconds ago
  shuffleSessionId: Array(32).fill(0),
  bump: 0,
  ...overrides,
});

describe('GameStateManager', () => {
  describe('Game Info Conversion', () => {
    it('should convert game to game info', () => {
      const game = createMockGame();
      const info = GameStateManager.toGameInfo(game);

      expect(info.gameId.toNumber()).toBe(123);
      expect(info.stage).toBe(GameStage.PreFlop);
      expect(info.pot.toNumber()).toBe(500);
      expect(info.currentBet.toNumber()).toBe(100);
      expect(info.playerCount).toBe(3);
      expect(info.maxPlayers).toBe(6);
      expect(info.isStarted).toBe(true);
      expect(info.isFinished).toBe(false);
    });
  });

  describe('Game Status Checks', () => {
    it('should detect game has started', () => {
      const game = createMockGame({ stage: GameStage.PreFlop });
      expect(GameStateManager.isGameStarted(game)).toBe(true);
    });

    it('should detect game has not started', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      expect(GameStateManager.isGameStarted(game)).toBe(false);
    });

    it('should detect game is finished', () => {
      const game = createMockGame({ stage: GameStage.Finished });
      expect(GameStateManager.isGameFinished(game)).toBe(true);
    });

    it('should detect game is not finished', () => {
      const game = createMockGame({ stage: GameStage.PreFlop });
      expect(GameStateManager.isGameFinished(game)).toBe(false);
    });

    it('should detect game in progress', () => {
      const game = createMockGame({ stage: GameStage.Flop });
      expect(GameStateManager.isGameInProgress(game)).toBe(true);
    });

    it('should detect game not in progress when waiting', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      expect(GameStateManager.isGameInProgress(game)).toBe(false);
    });

    it('should detect game not in progress when finished', () => {
      const game = createMockGame({ stage: GameStage.Finished });
      expect(GameStateManager.isGameInProgress(game)).toBe(false);
    });

    it('should detect waiting for players', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      expect(GameStateManager.isWaitingForPlayers(game)).toBe(true);
    });
  });

  describe('Game Properties', () => {
    it('should get current stage', () => {
      const game = createMockGame({ stage: GameStage.Turn });
      expect(GameStateManager.getCurrentStage(game)).toBe(GameStage.Turn);
    });

    it('should get pot size', () => {
      const game = createMockGame({ pot: new BN(1500) });
      expect(GameStateManager.getPotSize(game).toNumber()).toBe(1500);
    });

    it('should get current bet', () => {
      const game = createMockGame({ currentBet: new BN(200) });
      expect(GameStateManager.getCurrentBet(game).toNumber()).toBe(200);
    });

    it('should get community cards count', () => {
      const game = createMockGame({ communityCardsRevealed: 5 });
      expect(GameStateManager.getCommunityCardsCount(game)).toBe(5);
    });

    it('should get dealer position', () => {
      const game = createMockGame({ dealerPosition: 2 });
      expect(GameStateManager.getDealerPosition(game)).toBe(2);
    });

    it('should get current player index', () => {
      const game = createMockGame({ currentPlayerIndex: 1 });
      expect(GameStateManager.getCurrentPlayerIndex(game)).toBe(1);
    });
  });

  describe('Current Player', () => {
    it('should get current player', () => {
      const players = [PublicKey.unique(), PublicKey.unique(), PublicKey.unique()];
      const game = createMockGame({
        currentPlayerIndex: 1,
        playerCount: 3,
        players: [...players, ...Array(3).fill(PublicKey.default)],
      });

      const currentPlayer = GameStateManager.getCurrentPlayer(game);
      expect(currentPlayer?.equals(players[1])).toBe(true);
    });

    it('should return null for invalid player index', () => {
      const game = createMockGame({ currentPlayerIndex: 10 });
      expect(GameStateManager.getCurrentPlayer(game)).toBeNull();
    });

    it('should check if it is player turn', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        currentPlayerIndex: 0,
        players: [player, ...Array(5).fill(PublicKey.default)],
      });

      expect(GameStateManager.isPlayerTurn(game, player)).toBe(true);
    });

    it('should check if it is not player turn', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        currentPlayerIndex: 1,
        players: [player, ...Array(5).fill(PublicKey.default)],
      });

      expect(GameStateManager.isPlayerTurn(game, player)).toBe(false);
    });
  });

  describe('Seat Management', () => {
    it('should get available seats', () => {
      const game = createMockGame({ maxPlayers: 6, playerCount: 3 });
      expect(GameStateManager.getAvailableSeats(game)).toBe(3);
    });

    it('should detect game is full', () => {
      const game = createMockGame({ maxPlayers: 6, playerCount: 6 });
      expect(GameStateManager.isGameFull(game)).toBe(true);
    });

    it('should detect game is not full', () => {
      const game = createMockGame({ maxPlayers: 6, playerCount: 3 });
      expect(GameStateManager.isGameFull(game)).toBe(false);
    });
  });

  describe('Game Progress', () => {
    it('should calculate progress for each stage', () => {
      expect(GameStateManager.getGameProgress(createMockGame({ stage: GameStage.Waiting }))).toBe(0);
      expect(GameStateManager.getGameProgress(createMockGame({ stage: GameStage.PreFlop }))).toBe(20);
      expect(GameStateManager.getGameProgress(createMockGame({ stage: GameStage.Flop }))).toBe(40);
      expect(GameStateManager.getGameProgress(createMockGame({ stage: GameStage.Turn }))).toBe(60);
      expect(GameStateManager.getGameProgress(createMockGame({ stage: GameStage.River }))).toBe(80);
      expect(GameStateManager.getGameProgress(createMockGame({ stage: GameStage.Showdown }))).toBe(90);
      expect(GameStateManager.getGameProgress(createMockGame({ stage: GameStage.Finished }))).toBe(100);
    });
  });

  describe('Blinds and Buy-in', () => {
    it('should get blinds', () => {
      const game = createMockGame({
        smallBlind: new BN(25),
        bigBlind: new BN(50),
      });
      const blinds = GameStateManager.getBlinds(game);

      expect(blinds.smallBlind.toNumber()).toBe(25);
      expect(blinds.bigBlind.toNumber()).toBe(50);
    });

    it('should get buy-in range', () => {
      const game = createMockGame({
        minBuyIn: new BN(2000),
        maxBuyIn: new BN(10000),
      });
      const buyInRange = GameStateManager.getBuyInRange(game);

      expect(buyInRange.minBuyIn.toNumber()).toBe(2000);
      expect(buyInRange.maxBuyIn.toNumber()).toBe(10000);
    });
  });

  describe('Deck Status', () => {
    it('should detect deck is initialized', () => {
      const game = createMockGame({ deckInitialized: true });
      expect(GameStateManager.isDeckInitialized(game)).toBe(true);
    });

    it('should detect deck is not initialized', () => {
      const game = createMockGame({ deckInitialized: false });
      expect(GameStateManager.isDeckInitialized(game)).toBe(false);
    });
  });

  describe('Time Tracking', () => {
    it('should get game age', () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
      const game = createMockGame({ startedAt: new BN(fiveMinutesAgo) });
      const age = GameStateManager.getGameAge(game);

      expect(age).toBeGreaterThanOrEqual(299);
      expect(age).toBeLessThanOrEqual(301);
    });

    it('should return null for game age when not started', () => {
      const game = createMockGame({ startedAt: new BN(0) });
      expect(GameStateManager.getGameAge(game)).toBeNull();
    });

    it('should get time since last action', () => {
      const tenSecondsAgo = Math.floor(Date.now() / 1000) - 10;
      const game = createMockGame({ lastActionAt: new BN(tenSecondsAgo) });
      const timeSince = GameStateManager.getTimeSinceLastAction(game);

      expect(timeSince).toBeGreaterThanOrEqual(9);
      expect(timeSince).toBeLessThanOrEqual(11);
    });

    it('should return 0 for time since last action when no actions', () => {
      const game = createMockGame({ lastActionAt: new BN(0) });
      expect(GameStateManager.getTimeSinceLastAction(game)).toBe(0);
    });
  });
});
