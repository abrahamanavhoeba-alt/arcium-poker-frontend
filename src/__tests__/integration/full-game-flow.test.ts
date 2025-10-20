/**
 * Integration Test - Full Game Flow
 * 
 * Tests complete poker game from initialization to showdown.
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GameInitializer } from '../../lib/game/initialize';
import { PlayerJoin } from '../../lib/player/join';
import { GameStarter } from '../../lib/game/start';
import { PlayerActions } from '../../lib/player/actions';
import { GameFlow } from '../../lib/game/flow';
import { GameStateManager } from '../../lib/game/state';
import { PlayerStateManager } from '../../lib/player/state';
import { GameLogic } from '../../lib/game/logic';
import { PotManager } from '../../lib/betting/pot-manager';
import { BettingInstruction } from '../../lib/betting/instruction';
import { ShowdownWinner } from '../../lib/showdown/winner';
import { ShowdownPayout } from '../../lib/showdown/payout';
import { DeckManager } from '../../lib/cards/deck';
import { HandEvaluator } from '../../lib/cards/evaluator';
import { CardDealer } from '../../lib/cards/dealing';
import { TokenConversion } from '../../lib/token/conversion';
import { Game, PlayerState, GameStage, PlayerStatus } from '../../lib/shared/types';

// Mock game and player states for integration testing
const createMockGame = (overrides?: Partial<Game>): Game => ({
  authority: PublicKey.unique(),
  gameId: new BN(1),
  stage: GameStage.Waiting,
  smallBlind: new BN(10),
  bigBlind: new BN(20),
  minBuyIn: new BN(1000),
  maxBuyIn: new BN(10000),
  maxPlayers: 6,
  playerCount: 0,
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

describe('Full Game Flow Integration', () => {
  describe('Complete Game Lifecycle', () => {
    it('should handle complete game from initialization to showdown', () => {
      // 1. Initialize game
      const game = createMockGame({
        stage: GameStage.Waiting,
        maxPlayers: 3,
        playerCount: 0,
      });

      expect(game.stage).toBe(GameStage.Waiting);
      expect(GameStateManager.isWaitingForPlayers(game)).toBe(true);

      // 2. Players join
      const player1 = PublicKey.unique();
      const player2 = PublicKey.unique();
      const player3 = PublicKey.unique();

      const playerStates = [
        createMockPlayerState({ player: player1, seatIndex: 0, chipStack: new BN(5000) }),
        createMockPlayerState({ player: player2, seatIndex: 1, chipStack: new BN(5000) }),
        createMockPlayerState({ player: player3, seatIndex: 2, chipStack: new BN(5000) }),
      ];

      game.playerCount = 3;
      game.players = [player1, player2, player3, ...Array(3).fill(PublicKey.default)];

      // 3. Validate game can start
      const canStart = GameLogic.validateGameStart(game);
      expect(canStart.valid).toBe(true);

      // 4. Start game (PreFlop)
      game.stage = GameStage.PreFlop;
      game.deckInitialized = true;
      game.startedAt = new BN(Date.now());

      expect(GameStateManager.isGameStarted(game)).toBe(true);
      expect(GameStateManager.isGameInProgress(game)).toBe(true);

      // 5. Post blinds
      playerStates[0].currentBet = game.smallBlind;
      playerStates[0].totalBetThisHand = game.smallBlind;
      playerStates[0].chipStack = playerStates[0].chipStack.sub(game.smallBlind);

      playerStates[1].currentBet = game.bigBlind;
      playerStates[1].totalBetThisHand = game.bigBlind;
      playerStates[1].chipStack = playerStates[1].chipStack.sub(game.bigBlind);

      game.pot = game.smallBlind.add(game.bigBlind);
      game.currentBet = game.bigBlind;

      expect(game.pot.toNumber()).toBe(30);

      // 6. PreFlop betting round
      game.currentPlayerIndex = 2;

      // Player 3 calls
      const callAmount = GameLogic.getCallAmount(game, playerStates[2]);
      expect(callAmount.toNumber()).toBe(20);

      playerStates[2].currentBet = game.currentBet;
      playerStates[2].totalBetThisHand = game.currentBet;
      playerStates[2].chipStack = playerStates[2].chipStack.sub(callAmount);
      game.pot = game.pot.add(callAmount);
      game.playersActed[2] = true;

      // Player 1 calls (completing small blind)
      game.currentPlayerIndex = 0;
      const player1Call = game.bigBlind.sub(game.smallBlind);
      playerStates[0].currentBet = game.currentBet;
      playerStates[0].totalBetThisHand = playerStates[0].totalBetThisHand.add(player1Call);
      playerStates[0].chipStack = playerStates[0].chipStack.sub(player1Call);
      game.pot = game.pot.add(player1Call);
      game.playersActed[0] = true;

      // Player 2 checks (big blind)
      game.currentPlayerIndex = 1;
      game.playersActed[1] = true;

      expect(game.pot.toNumber()).toBe(60);

      // 7. Check betting round complete
      const roundComplete = GameLogic.isBettingRoundComplete(game, playerStates);
      expect(roundComplete).toBe(true);

      // 8. Advance to Flop
      game.stage = GameStage.Flop;
      game.communityCardsRevealed = 3;
      game.currentBet = new BN(0);
      game.playersActed = Array(6).fill(false);
      playerStates.forEach(ps => ps.currentBet = new BN(0));

      expect(GameFlow.getCommunityCardCount(game.stage)).toBe(3);

      // 9. Flop betting - Player 1 bets
      game.currentPlayerIndex = 0;
      const betAmount = new BN(50);
      const betValidation = GameLogic.validateBetAmount(betAmount, game, playerStates[0]);
      expect(betValidation.valid).toBe(true);

      playerStates[0].currentBet = betAmount;
      playerStates[0].totalBetThisHand = playerStates[0].totalBetThisHand.add(betAmount);
      playerStates[0].chipStack = playerStates[0].chipStack.sub(betAmount);
      game.currentBet = betAmount;
      game.pot = game.pot.add(betAmount);
      game.playersActed[0] = true;

      // Player 2 raises
      game.currentPlayerIndex = 1;
      const raiseAmount = new BN(150);
      const raiseValidation = GameLogic.validateRaiseAmount(raiseAmount, game, playerStates[1]);
      expect(raiseValidation.valid).toBe(true);

      playerStates[1].currentBet = raiseAmount;
      playerStates[1].totalBetThisHand = playerStates[1].totalBetThisHand.add(raiseAmount);
      playerStates[1].chipStack = playerStates[1].chipStack.sub(raiseAmount);
      game.pot = game.pot.add(raiseAmount);
      game.currentBet = raiseAmount;
      game.playersActed[1] = true;

      // Player 3 folds
      game.currentPlayerIndex = 2;
      playerStates[2].hasFolded = true;
      game.playersActed[2] = true;

      // Player 1 calls the raise
      game.currentPlayerIndex = 0;
      const callRaise = raiseAmount.sub(betAmount);
      playerStates[0].currentBet = raiseAmount;
      playerStates[0].totalBetThisHand = playerStates[0].totalBetThisHand.add(callRaise);
      playerStates[0].chipStack = playerStates[0].chipStack.sub(callRaise);
      game.pot = game.pot.add(callRaise);

      expect(game.pot.toNumber()).toBe(360); // 60 + 50 + 150 + 100

      // 10. Advance to Turn
      game.stage = GameStage.Turn;
      game.communityCardsRevealed = 4;
      game.currentBet = new BN(0);
      game.playersActed = Array(6).fill(false);
      playerStates.forEach(ps => ps.currentBet = new BN(0));

      // Both players check
      game.playersActed[0] = true;
      game.playersActed[1] = true;

      // 11. Advance to River
      game.stage = GameStage.River;
      game.communityCardsRevealed = 5;
      game.playersActed = Array(6).fill(false);

      // Both players check again
      game.playersActed[0] = true;
      game.playersActed[1] = true;

      // Verify betting round is complete before showdown
      const riverComplete = GameLogic.isBettingRoundComplete(game, playerStates);
      expect(riverComplete).toBe(true);

      const shouldShowdown = GameLogic.shouldProceedToShowdown(game, playerStates);
      expect(shouldShowdown).toBe(true);

      // 12. Advance to Showdown
      game.stage = GameStage.Showdown;

      // 13. Determine winners
      const activePlayers = playerStates.filter(ps => !ps.hasFolded);
      expect(activePlayers.length).toBe(2);

      const winners = ShowdownWinner.determineWinners(game, activePlayers);
      expect(winners.length).toBeGreaterThan(0);

      // 14. Calculate pot distribution
      const potDist = PotManager.calculatePots(playerStates);
      // Player 1: 20 (preflop) + 50 + 100 (flop) = 170
      // Player 2: 20 (preflop) + 150 (flop) = 170
      // Player 3: 20 (preflop, then folded) = 20
      // PotManager only counts active players: 170 + 170 = 340
      expect(potDist.totalPot.toNumber()).toBe(340);

      // 15. Verify game completion
      game.stage = GameStage.Finished;
      expect(GameStateManager.isGameFinished(game)).toBe(true);
      expect(GameStateManager.getGameProgress(game)).toBe(100);
    });
  });

  describe('Multi-Player Scenarios', () => {
    it('should handle 6-player game with multiple betting rounds', () => {
      const game = createMockGame({
        stage: GameStage.PreFlop,
        maxPlayers: 6,
        playerCount: 6,
        pot: new BN(0),
      });

      const playerStates = Array.from({ length: 6 }, (_, i) =>
        createMockPlayerState({
          seatIndex: i,
          chipStack: new BN(5000),
        })
      );

      // Verify all players can act
      playerStates.forEach((ps, i) => {
        const canAct = PlayerStateManager.isPlayerActive(ps);
        expect(canAct).toBe(true);
      });

      // Simulate betting round
      let totalPot = new BN(0);
      playerStates.forEach((ps, i) => {
        const betAmount = new BN(20);
        ps.currentBet = betAmount;
        ps.totalBetThisHand = betAmount;
        ps.chipStack = ps.chipStack.sub(betAmount);
        totalPot = totalPot.add(betAmount);
      });

      game.pot = totalPot;
      expect(game.pot.toNumber()).toBe(120);

      // Verify pot calculation
      const calculatedPot = PotManager.calculateTotalPot(playerStates);
      expect(calculatedPot.toNumber()).toBe(120);
    });

    it('should handle side pots correctly', () => {
      const game = createMockGame({ stage: GameStage.River });

      const playerStates = [
        createMockPlayerState({ seatIndex: 0, totalBetThisHand: new BN(100), hasFolded: false }),
        createMockPlayerState({ seatIndex: 1, totalBetThisHand: new BN(200), hasFolded: false }),
        createMockPlayerState({ seatIndex: 2, totalBetThisHand: new BN(300), hasFolded: false }),
      ];

      const pots = PotManager.calculatePots(playerStates);

      expect(pots.totalPot.toNumber()).toBe(600);
      expect(pots.sidePots.length).toBeGreaterThan(0);
      expect(PotManager.needsSidePots(playerStates)).toBe(true);
    });
  });

  describe('Card Integration', () => {
    it('should handle complete card dealing and evaluation', () => {
      // Create deck
      const deck = DeckManager.createDeck();
      expect(deck.length).toBe(52);

      // Shuffle
      const shuffled = DeckManager.shuffleDeck(deck);
      expect(shuffled.length).toBe(52);

      // Deal game
      const dealResult = CardDealer.dealGame(3, shuffled);
      expect(dealResult.holeCards.length).toBe(3);
      expect(dealResult.communityCards.length).toBe(5);

      // Evaluate hands
      dealResult.holeCards.forEach((holeCards, i) => {
        const allCards = [...holeCards, ...dealResult.communityCards];
        const hand = HandEvaluator.evaluateHand(allCards);
        expect(hand).toBeDefined();
        expect(hand.rank).toBeGreaterThanOrEqual(0);
        expect(hand.rank).toBeLessThanOrEqual(9);
      });
    });
  });

  describe('Token Conversion', () => {
    it('should handle token conversions correctly', () => {
      const sol = 1.5;
      const lamports = TokenConversion.solToLamports(sol);
      expect(lamports.toNumber()).toBe(1_500_000_000);

      const backToSol = TokenConversion.lamportsToSol(lamports);
      expect(backToSol).toBe(1.5);

      const formatted = TokenConversion.formatSol(lamports, 2);
      expect(formatted).toBe('1.50');
    });

    it('should format chips correctly', () => {
      expect(TokenConversion.formatChips(new BN(500))).toBe('500');
      expect(TokenConversion.formatChips(new BN(1500))).toBe('1.5K');
      expect(TokenConversion.formatChips(new BN(1500000))).toBe('1.5M');
    });
  });

  describe('State Management Integration', () => {
    it('should track game state throughout lifecycle', () => {
      const game = createMockGame({ stage: GameStage.Waiting });

      // Waiting
      expect(GameStateManager.getGameProgress(game)).toBe(0);
      expect(GameStateManager.isWaitingForPlayers(game)).toBe(true);

      // PreFlop
      game.stage = GameStage.PreFlop;
      expect(GameStateManager.getGameProgress(game)).toBe(20);
      expect(GameStateManager.isGameInProgress(game)).toBe(true);

      // Flop
      game.stage = GameStage.Flop;
      expect(GameStateManager.getGameProgress(game)).toBe(40);

      // Turn
      game.stage = GameStage.Turn;
      expect(GameStateManager.getGameProgress(game)).toBe(60);

      // River
      game.stage = GameStage.River;
      expect(GameStateManager.getGameProgress(game)).toBe(80);

      // Showdown
      game.stage = GameStage.Showdown;
      expect(GameStateManager.getGameProgress(game)).toBe(90);

      // Finished
      game.stage = GameStage.Finished;
      expect(GameStateManager.getGameProgress(game)).toBe(100);
      expect(GameStateManager.isGameFinished(game)).toBe(true);
    });
  });

  describe('Betting Instruction Integration', () => {
    it('should provide correct available actions', () => {
      const game = createMockGame({
        stage: GameStage.Flop,
        currentBet: new BN(0),
      });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const actions = BettingInstruction.getAvailableActions(game, playerState);
      expect(actions).toContain('fold');
      expect(actions).toContain('check');
      expect(actions).toContain('bet');
    });

    it('should suggest appropriate bet amounts', () => {
      const game = createMockGame({ pot: new BN(1000) });
      const playerState = createMockPlayerState({ chipStack: new BN(5000) });

      const suggestions = BettingInstruction.getSuggestedBets(game, playerState);
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(amount => {
        expect(amount.lte(playerState.chipStack)).toBe(true);
      });
    });
  });
});
