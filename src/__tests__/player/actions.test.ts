/**
 * Tests for player/actions.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PlayerActions } from '../../lib/player/actions';
import { Game, PlayerState, GameStage, PlayerStatus } from '../../lib/shared/types';

// Helper to create game with player at current index
const createGameWithPlayer = (player: PublicKey, overrides?: Partial<Game>): Game => ({
  authority: PublicKey.unique(),
  gameId: new BN(123),
  stage: GameStage.PreFlop,
  smallBlind: new BN(10),
  bigBlind: new BN(20),
  minBuyIn: new BN(1000),
  maxBuyIn: new BN(50000),
  maxPlayers: 6,
  playerCount: 3,
  players: [player, PublicKey.unique(), PublicKey.unique(), ...Array(3).fill(PublicKey.default)],
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

// Mock game and player state
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

describe('PlayerActions', () => {
  describe('Fold Validation', () => {
    it('should always allow fold', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player);
      const playerState = createMockPlayerState({ player });
      const action = { fold: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });

    it('should allow fold even with chips', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player);
      const playerState = createMockPlayerState({ player, chipStack: new BN(10000) });
      const action = { fold: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });
  });

  describe('Check Validation', () => {
    it('should allow check when no bet', () => {
      const player = PublicKey.unique();
      const game = createMockGame({ 
        currentBet: new BN(0),
        currentPlayerIndex: 0,
        players: [player, ...Array(5).fill(PublicKey.default)]
      });
      const playerState = createMockPlayerState({ player, currentBet: new BN(0) });
      const action = { check: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });

    it('should reject check when there is a bet', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(100) });
      const playerState = createMockPlayerState({ player, currentBet: new BN(0) });
      const action = { check: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('bet to call');
    });

    it('should allow check when player has matched bet', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(100) });
      const playerState = createMockPlayerState({ player, currentBet: new BN(100) });
      const action = { check: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });
  });

  describe('Call Validation', () => {
    it('should allow call when there is a bet', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(100) });
      const playerState = createMockPlayerState({ 
        player,
        currentBet: new BN(0),
        chipStack: new BN(5000)
      });
      const action = { call: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });

    it('should reject call when no bet', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(0) });
      const playerState = createMockPlayerState({ player, currentBet: new BN(0) });
      const action = { call: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No bet');
    });

    it('should reject call with insufficient chips', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(1000) });
      const playerState = createMockPlayerState({ 
        player,
        currentBet: new BN(0),
        chipStack: new BN(500)
      });
      const action = { call: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('Bet Validation', () => {
    it('should allow valid bet', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { 
        currentBet: new BN(0),
        bigBlind: new BN(20)
      });
      const playerState = createMockPlayerState({ player, chipStack: new BN(5000) });
      const action = { bet: { amount: new BN(100) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });

    it('should reject bet when there is already a bet', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(100) });
      const playerState = createMockPlayerState({ player });
      const action = { bet: { amount: new BN(200) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('raise instead');
    });

    it('should reject bet below big blind', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { 
        currentBet: new BN(0),
        bigBlind: new BN(20)
      });
      const playerState = createMockPlayerState({ player });
      const action = { bet: { amount: new BN(10) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('big blind');
    });

    it('should reject bet with insufficient chips', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(0) });
      const playerState = createMockPlayerState({ player, chipStack: new BN(50) });
      const action = { bet: { amount: new BN(100) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('Raise Validation', () => {
    it('should allow valid raise', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(100) });
      const playerState = createMockPlayerState({ player, chipStack: new BN(5000) });
      const action = { raise: { amount: new BN(200) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });

    it('should reject raise when no bet', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(0) });
      const playerState = createMockPlayerState({ player });
      const action = { raise: { amount: new BN(100) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('bet instead');
    });

    it('should reject raise below minimum (2x current bet)', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(100) });
      const playerState = createMockPlayerState({ player });
      const action = { raise: { amount: new BN(150) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('2x current bet');
    });

    it('should allow raise of exactly 2x', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player, { currentBet: new BN(100) });
      const playerState = createMockPlayerState({ player, chipStack: new BN(5000) });
      const action = { raise: { amount: new BN(200) } };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });
  });

  describe('All-In Validation', () => {
    it('should allow all-in with chips', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player);
      const playerState = createMockPlayerState({ player, chipStack: new BN(1000) });
      const action = { allIn: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });

    it('should reject all-in with no chips', () => {
      const player = PublicKey.unique();
      const game = createGameWithPlayer(player);
      const playerState = createMockPlayerState({ player, chipStack: new BN(0) });
      const action = { allIn: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No chips');
    });
  });

  describe('Turn Validation', () => {
    it('should reject action when not player turn', () => {
      const player = PublicKey.unique();
      const game = createMockGame({ 
        currentPlayerIndex: 1,
        players: [player, PublicKey.unique(), PublicKey.unique(), ...Array(3).fill(PublicKey.default)]
      });
      const playerState = createMockPlayerState({ player });
      const action = { fold: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('turn');
    });

    it('should allow action when it is player turn', () => {
      const player = PublicKey.unique();
      const game = createMockGame({ 
        currentPlayerIndex: 0,
        players: [player, PublicKey.unique(), PublicKey.unique(), ...Array(3).fill(PublicKey.default)]
      });
      const playerState = createMockPlayerState({ player });
      const action = { fold: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(true);
    });
  });

  describe('Game Stage Validation', () => {
    it('should reject action in Waiting stage', () => {
      const game = createMockGame({ stage: GameStage.Waiting });
      const playerState = createMockPlayerState();
      const action = { fold: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not in active play');
    });

    it('should reject action in Finished stage', () => {
      const game = createMockGame({ stage: GameStage.Finished });
      const playerState = createMockPlayerState();
      const action = { fold: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
    });

    it('should allow action in active stages', () => {
      const stages = [GameStage.PreFlop, GameStage.Flop, GameStage.Turn, GameStage.River];
      const player = PublicKey.unique();

      stages.forEach(stage => {
        const game = createMockGame({ 
          stage,
          currentPlayerIndex: 0,
          players: [player, ...Array(5).fill(PublicKey.default)]
        });
        const playerState = createMockPlayerState({ player });
        const action = { fold: {} };

        const result = PlayerActions.validateAction(game, playerState, action);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Folded Player Validation', () => {
    it('should reject action from folded player', () => {
      const player = PublicKey.unique();
      const game = createMockGame({ 
        currentPlayerIndex: 0,
        players: [player, ...Array(5).fill(PublicKey.default)]
      });
      const playerState = createMockPlayerState({ 
        player,
        hasFolded: true
      });
      const action = { check: {} };

      const result = PlayerActions.validateAction(game, playerState, action);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('folded');
    });
  });

  describe('Helper Functions', () => {
    it('should calculate call amount correctly', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ currentBet: new BN(20) });

      const callAmount = PlayerActions.getCallAmount(game, playerState);
      expect(callAmount.toNumber()).toBe(80);
    });

    it('should return zero call amount when matched', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ currentBet: new BN(100) });

      const callAmount = PlayerActions.getCallAmount(game, playerState);
      expect(callAmount.toNumber()).toBe(0);
    });

    it('should get player index correctly', () => {
      const player = PublicKey.unique();
      const game = createMockGame({
        playerCount: 3,
        players: [PublicKey.unique(), player, PublicKey.unique(), ...Array(3).fill(PublicKey.default)]
      });

      const index = PlayerActions.getPlayerIndex(game, player);
      expect(index).toBe(1);
    });

    it('should return -1 for player not in game', () => {
      const player = PublicKey.unique();
      const game = createMockGame();

      const index = PlayerActions.getPlayerIndex(game, player);
      expect(index).toBe(-1);
    });
  });

  describe('Available Actions', () => {
    it('should include fold in all cases', () => {
      const game = createMockGame({ currentBet: new BN(0) });
      const playerState = createMockPlayerState();

      const actions = PlayerActions.getAvailableActions(game, playerState);
      expect(actions).toContain('fold');
    });

    it('should include check when no bet', () => {
      const game = createMockGame({ currentBet: new BN(0) });
      const playerState = createMockPlayerState({ currentBet: new BN(0) });

      const actions = PlayerActions.getAvailableActions(game, playerState);
      expect(actions).toContain('check');
      expect(actions).toContain('bet');
      expect(actions).not.toContain('call');
      expect(actions).not.toContain('raise');
    });

    it('should include call and raise when there is a bet', () => {
      const game = createMockGame({ currentBet: new BN(100) });
      const playerState = createMockPlayerState({ 
        currentBet: new BN(0),
        chipStack: new BN(5000)
      });

      const actions = PlayerActions.getAvailableActions(game, playerState);
      expect(actions).toContain('call');
      expect(actions).toContain('raise');
      expect(actions).not.toContain('check');
      expect(actions).not.toContain('bet');
    });

    it('should always include allIn when player has chips', () => {
      const game = createMockGame();
      const playerState = createMockPlayerState({ chipStack: new BN(100) });

      const actions = PlayerActions.getAvailableActions(game, playerState);
      expect(actions).toContain('allIn');
    });
  });
});
