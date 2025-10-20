/**
 * Tests for player/state.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PlayerStateManager } from '../../lib/player/state';
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
  pot: new BN(0),
  currentBet: new BN(0),
  playersActed: [false, false, false, false, false, false],
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

describe('PlayerStateManager', () => {
  describe('Player Info Conversion', () => {
    it('should convert player state to player info', () => {
      const playerState = createMockPlayerState({
        chipStack: new BN(5000),
        currentBet: new BN(100),
        totalBetThisHand: new BN(200),
      });

      const info = PlayerStateManager.toPlayerInfo(playerState);
      expect(info.chipStack.toNumber()).toBe(5000);
      expect(info.currentBet.toNumber()).toBe(100);
      expect(info.totalBetThisHand.toNumber()).toBe(200);
      expect(info.hasFolded).toBe(false);
      expect(info.isActive).toBe(true);
    });

    it('should mark folded player as inactive', () => {
      const playerState = createMockPlayerState({ hasFolded: true });
      const info = PlayerStateManager.toPlayerInfo(playerState);
      expect(info.isActive).toBe(false);
    });
  });

  describe('Player Active Check', () => {
    it('should identify active player', () => {
      const playerState = createMockPlayerState({
        hasFolded: false,
        chipStack: new BN(5000),
        status: PlayerStatus.Active,
      });

      expect(PlayerStateManager.isPlayerActive(playerState)).toBe(true);
    });

    it('should identify folded player as inactive', () => {
      const playerState = createMockPlayerState({ hasFolded: true });
      expect(PlayerStateManager.isPlayerActive(playerState)).toBe(false);
    });

    it('should identify player with no chips as inactive', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(0) });
      expect(PlayerStateManager.isPlayerActive(playerState)).toBe(false);
    });

    it('should identify inactive status player as inactive', () => {
      const playerState = createMockPlayerState({ status: PlayerStatus.Inactive });
      expect(PlayerStateManager.isPlayerActive(playerState)).toBe(false);
    });
  });

  describe('Player Index', () => {
    it('should get correct player index', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 3,
        players: [PublicKey.unique(), player, PublicKey.unique(), ...Array(3).fill(PublicKey.default)],
      });

      const index = PlayerStateManager.getPlayerIndex(game, player);
      expect(index).toBe(1);
    });

    it('should return -1 for player not in game', () => {
      const player = PublicKey.unique();
      const game = createMockGame();

      const index = PlayerStateManager.getPlayerIndex(game, player);
      expect(index).toBe(-1);
    });
  });

  describe('Chip Calculations', () => {
    it('should get total investment', () => {
      const playerState = createMockPlayerState({ totalBetThisHand: new BN(500) });
      const investment = PlayerStateManager.getTotalInvestment(playerState);
      expect(investment.toNumber()).toBe(500);
    });

    it('should get remaining chips', () => {
      const playerState = createMockPlayerState({ chipStack: new BN(3000) });
      const remaining = PlayerStateManager.getRemainingChips(playerState);
      expect(remaining.toNumber()).toBe(3000);
    });

    it('should calculate total chips', () => {
      const playerState = createMockPlayerState({
        chipStack: new BN(3000),
        currentBet: new BN(500),
      });
      const total = PlayerStateManager.getTotalChips(playerState);
      expect(total.toNumber()).toBe(3500);
    });
  });

  describe('Player Can Act', () => {
    it('should allow active player on their turn to act', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        currentPlayerIndex: 0,
        players: [player, ...Array(5).fill(PublicKey.default)],
      });
      const playerState = createMockPlayerState({
        player,
        hasFolded: false,
        chipStack: new BN(5000),
      });

      expect(PlayerStateManager.canPlayerAct(playerState, game)).toBe(true);
    });

    it('should not allow folded player to act', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        currentPlayerIndex: 0,
        players: [player, ...Array(5).fill(PublicKey.default)],
      });
      const playerState = createMockPlayerState({
        player,
        hasFolded: true,
      });

      expect(PlayerStateManager.canPlayerAct(playerState, game)).toBe(false);
    });

    it('should not allow player to act when not their turn', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        currentPlayerIndex: 1,
        players: [player, ...Array(5).fill(PublicKey.default)],
      });
      const playerState = createMockPlayerState({ player });

      expect(PlayerStateManager.canPlayerAct(playerState, game)).toBe(false);
    });
  });

  describe('Player Position', () => {
    it('should identify dealer position', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        dealerPosition: 0,
        playerCount: 6,
        players: [player, ...Array(5).fill(PublicKey.unique())],
      });
      const playerState = createMockPlayerState({ player });

      const position = PlayerStateManager.getPlayerPosition(playerState, game);
      expect(position).toBe('Dealer');
    });

    it('should identify small blind position', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        dealerPosition: 0,
        playerCount: 6,
        players: [PublicKey.unique(), player, ...Array(4).fill(PublicKey.unique())],
      });
      const playerState = createMockPlayerState({ player });

      const position = PlayerStateManager.getPlayerPosition(playerState, game);
      expect(position).toBe('Small Blind');
    });

    it('should identify big blind position', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        dealerPosition: 0,
        playerCount: 6,
        players: [PublicKey.unique(), PublicKey.unique(), player, ...Array(3).fill(PublicKey.unique())],
      });
      const playerState = createMockPlayerState({ player });

      const position = PlayerStateManager.getPlayerPosition(playerState, game);
      expect(position).toBe('Big Blind');
    });

    it('should identify cutoff position', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        dealerPosition: 0,
        playerCount: 6,
        players: [...Array(5).fill(PublicKey.unique()), player],
      });
      const playerState = createMockPlayerState({ player });

      const position = PlayerStateManager.getPlayerPosition(playerState, game);
      expect(position).toBe('Cutoff');
    });
  });

  describe('Player Collections', () => {
    it('should count active players', () => {
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: true }),
        createMockPlayerState({ hasFolded: false }),
      ];

      const count = PlayerStateManager.getActivePlayerCount(playerStates);
      expect(count).toBe(2);
    });

    it('should get non-folded players', () => {
      const playerStates = [
        createMockPlayerState({ hasFolded: false }),
        createMockPlayerState({ hasFolded: true }),
        createMockPlayerState({ hasFolded: false }),
      ];

      const nonFolded = PlayerStateManager.getNonFoldedPlayers(playerStates);
      expect(nonFolded.length).toBe(2);
    });

    it('should get all-in players', () => {
      const playerStates = [
        createMockPlayerState({ isAllIn: true }),
        createMockPlayerState({ isAllIn: false }),
        createMockPlayerState({ isAllIn: true }),
      ];

      const allIn = PlayerStateManager.getAllInPlayers(playerStates);
      expect(allIn.length).toBe(2);
    });

    it('should sort players by seat index', () => {
      const playerStates = [
        createMockPlayerState({ seatIndex: 2 }),
        createMockPlayerState({ seatIndex: 0 }),
        createMockPlayerState({ seatIndex: 1 }),
      ];

      const sorted = PlayerStateManager.sortBySeatIndex(playerStates);
      expect(sorted[0].seatIndex).toBe(0);
      expect(sorted[1].seatIndex).toBe(1);
      expect(sorted[2].seatIndex).toBe(2);
    });

    it('should find player by public key', () => {
      const targetPlayer = PublicKey.unique();
      const playerStates = [
        createMockPlayerState({ player: PublicKey.unique() }),
        createMockPlayerState({ player: targetPlayer }),
        createMockPlayerState({ player: PublicKey.unique() }),
      ];

      const found = PlayerStateManager.findPlayer(playerStates, targetPlayer);
      expect(found).toBeDefined();
      expect(found?.player.equals(targetPlayer)).toBe(true);
    });

    it('should return undefined when player not found', () => {
      const playerStates = [
        createMockPlayerState(),
        createMockPlayerState(),
      ];

      const found = PlayerStateManager.findPlayer(playerStates, PublicKey.unique());
      expect(found).toBeUndefined();
    });
  });

  describe('Player Acted Check', () => {
    it('should detect player has acted', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        players: [player, ...Array(5).fill(PublicKey.default)],
        playersActed: [true, false, false, false, false, false],
      });
      const playerState = createMockPlayerState({ player });

      expect(PlayerStateManager.hasPlayerActed(playerState, game)).toBe(true);
    });

    it('should detect player has not acted', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        players: [player, ...Array(5).fill(PublicKey.default)],
        playersActed: [false, false, false, false, false, false],
      });
      const playerState = createMockPlayerState({ player });

      expect(PlayerStateManager.hasPlayerActed(playerState, game)).toBe(false);
    });
  });
});
