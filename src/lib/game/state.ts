/**
 * Arcium Poker - Game State Management
 * 
 * Centralized game state management for tracking game progress.
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ProgramClient } from '../connection/program';
import { Game, GameStage, PlayerState } from '../shared/types';
import { PlayerStateManager } from '../player/state';

/**
 * Game information for UI display
 */
export interface GameInfo {
  gameId: BN;
  stage: GameStage;
  pot: BN;
  currentBet: BN;
  playerCount: number;
  maxPlayers: number;
  smallBlind: BN;
  bigBlind: BN;
  dealerPosition: number;
  currentPlayerIndex: number;
  communityCardsRevealed: number;
  isStarted: boolean;
  isFinished: boolean;
}

/**
 * Complete game state with players
 */
export interface GameStateSnapshot {
  game: Game;
  playerStates: PlayerState[];
  gameInfo: GameInfo;
}

/**
 * Game State Manager
 * Manages centralized game state tracking
 */
export class GameStateManager {
  /**
   * Fetch complete game state
   * 
   * @param gamePDA - Game PDA
   * @returns Game state snapshot or null
   */
  static async fetchGameState(
    gamePDA: PublicKey
  ): Promise<GameStateSnapshot | null> {
    try {
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) return null;

      const playerStates = await PlayerStateManager.fetchAllPlayerStates(game);
      const gameInfo = this.toGameInfo(game);

      return {
        game,
        playerStates,
        gameInfo,
      };
    } catch (error) {
      console.error('Error fetching game state:', error);
      return null;
    }
  }

  /**
   * Convert game to game info for UI
   * 
   * @param game - Game account
   * @returns Game info
   */
  static toGameInfo(game: Game): GameInfo {
    return {
      gameId: game.gameId,
      stage: game.stage,
      pot: game.pot,
      currentBet: game.currentBet,
      playerCount: game.playerCount,
      maxPlayers: game.maxPlayers,
      smallBlind: game.smallBlind,
      bigBlind: game.bigBlind,
      dealerPosition: game.dealerPosition,
      currentPlayerIndex: game.currentPlayerIndex,
      communityCardsRevealed: game.communityCardsRevealed,
      isStarted: this.isGameStarted(game),
      isFinished: this.isGameFinished(game),
    };
  }

  /**
   * Check if game has started
   * 
   * @param game - Game account
   * @returns True if game has started
   */
  static isGameStarted(game: Game): boolean {
    return game.stage !== GameStage.Waiting;
  }

  /**
   * Check if game is finished
   * 
   * @param game - Game account
   * @returns True if game is finished
   */
  static isGameFinished(game: Game): boolean {
    return game.stage === GameStage.Finished;
  }

  /**
   * Check if game is in progress
   * 
   * @param game - Game account
   * @returns True if game is in progress
   */
  static isGameInProgress(game: Game): boolean {
    return this.isGameStarted(game) && !this.isGameFinished(game);
  }

  /**
   * Check if game is waiting for players
   * 
   * @param game - Game account
   * @returns True if waiting
   */
  static isWaitingForPlayers(game: Game): boolean {
    return game.stage === GameStage.Waiting;
  }

  /**
   * Get current stage name
   * 
   * @param game - Game account
   * @returns Stage name
   */
  static getCurrentStage(game: Game): string {
    return game.stage;
  }

  /**
   * Get pot size
   * 
   * @param game - Game account
   * @returns Pot size
   */
  static getPotSize(game: Game): BN {
    return game.pot;
  }

  /**
   * Get current bet amount
   * 
   * @param game - Game account
   * @returns Current bet
   */
  static getCurrentBet(game: Game): BN {
    return game.currentBet;
  }

  /**
   * Get number of community cards revealed
   * 
   * @param game - Game account
   * @returns Number of cards
   */
  static getCommunityCardsCount(game: Game): number {
    return game.communityCardsRevealed;
  }

  /**
   * Get dealer position
   * 
   * @param game - Game account
   * @returns Dealer seat index
   */
  static getDealerPosition(game: Game): number {
    return game.dealerPosition;
  }

  /**
   * Get current player index
   * 
   * @param game - Game account
   * @returns Current player index
   */
  static getCurrentPlayerIndex(game: Game): number {
    return game.currentPlayerIndex;
  }

  /**
   * Get current player public key
   * 
   * @param game - Game account
   * @returns Current player public key or null
   */
  static getCurrentPlayer(game: Game): PublicKey | null {
    if (game.currentPlayerIndex < 0 || game.currentPlayerIndex >= game.playerCount) {
      return null;
    }
    return game.players[game.currentPlayerIndex];
  }

  /**
   * Check if it's a specific player's turn
   * 
   * @param game - Game account
   * @param player - Player public key
   * @returns True if it's player's turn
   */
  static isPlayerTurn(game: Game, player: PublicKey): boolean {
    const currentPlayer = this.getCurrentPlayer(game);
    return currentPlayer ? currentPlayer.equals(player) : false;
  }

  /**
   * Get available seats
   * 
   * @param game - Game account
   * @returns Number of available seats
   */
  static getAvailableSeats(game: Game): number {
    return game.maxPlayers - game.playerCount;
  }

  /**
   * Check if game is full
   * 
   * @param game - Game account
   * @returns True if game is full
   */
  static isGameFull(game: Game): boolean {
    return game.playerCount >= game.maxPlayers;
  }

  /**
   * Get game progress percentage
   * 
   * @param game - Game account
   * @returns Progress percentage (0-100)
   */
  static getGameProgress(game: Game): number {
    switch (game.stage) {
      case GameStage.Waiting:
        return 0;
      case GameStage.PreFlop:
        return 20;
      case GameStage.Flop:
        return 40;
      case GameStage.Turn:
        return 60;
      case GameStage.River:
        return 80;
      case GameStage.Showdown:
        return 90;
      case GameStage.Finished:
        return 100;
      default:
        return 0;
    }
  }

  /**
   * Get blinds info
   * 
   * @param game - Game account
   * @returns Object with small and big blind amounts
   */
  static getBlinds(game: Game): { smallBlind: BN; bigBlind: BN } {
    return {
      smallBlind: game.smallBlind,
      bigBlind: game.bigBlind,
    };
  }

  /**
   * Get buy-in range
   * 
   * @param game - Game account
   * @returns Object with min and max buy-in
   */
  static getBuyInRange(game: Game): { minBuyIn: BN; maxBuyIn: BN } {
    return {
      minBuyIn: game.minBuyIn,
      maxBuyIn: game.maxBuyIn,
    };
  }

  /**
   * Check if deck is initialized
   * 
   * @param game - Game account
   * @returns True if deck is initialized
   */
  static isDeckInitialized(game: Game): boolean {
    return game.deckInitialized;
  }

  /**
   * Get game age (time since start)
   * 
   * @param game - Game account
   * @returns Age in seconds or null if not started
   */
  static getGameAge(game: Game): number | null {
    if (game.startedAt.eq(new BN(0))) return null;
    const now = Math.floor(Date.now() / 1000);
    return now - game.startedAt.toNumber();
  }

  /**
   * Get time since last action
   * 
   * @param game - Game account
   * @returns Seconds since last action
   */
  static getTimeSinceLastAction(game: Game): number {
    if (game.lastActionAt.eq(new BN(0))) return 0;
    const now = Math.floor(Date.now() / 1000);
    return now - game.lastActionAt.toNumber();
  }
}
