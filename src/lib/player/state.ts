/**
 * Arcium Poker - Player State Management
 * 
 * Handles player state tracking and management throughout the game.
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ProgramClient } from '../connection/program';
import { PlayerState, PlayerStatus, Game } from '../shared/types';

/**
 * Player information for UI display
 */
export interface PlayerInfo {
  publicKey: PublicKey;
  seatIndex: number;
  chipStack: BN;
  currentBet: BN;
  totalBetThisHand: BN;
  status: PlayerStatus;
  hasFolded: boolean;
  isAllIn: boolean;
  hasCards: boolean;
  isActive: boolean;
}

/**
 * Player State Manager
 * Manages player state tracking and queries
 */
export class PlayerStateManager {
  /**
   * Fetch player state
   * 
   * @param gamePDA - Game PDA
   * @param player - Player public key
   * @returns Player state or null
   */
  static async fetchPlayerState(
    gamePDA: PublicKey,
    player: PublicKey
  ): Promise<PlayerState | null> {
    try {
      const [playerStatePDA] = ProgramClient.derivePlayerStatePDA(gamePDA, player);
      return await ProgramClient.fetchPlayerState(playerStatePDA);
    } catch (error) {
      console.error('Error fetching player state:', error);
      return null;
    }
  }

  /**
   * Fetch all player states for a game
   * 
   * @param game - Game account
   * @returns Array of player states
   */
  static async fetchAllPlayerStates(
    game: Game
  ): Promise<PlayerState[]> {
    try {
      const playerStates: PlayerState[] = [];
      
      for (let i = 0; i < game.playerCount; i++) {
        const player = game.players[i];
        const state = await this.fetchPlayerState(game.authority, player);
        if (state) {
          playerStates.push(state);
        }
      }
      
      return playerStates;
    } catch (error) {
      console.error('Error fetching all player states:', error);
      return [];
    }
  }

  /**
   * Convert player state to player info for UI
   * 
   * @param playerState - Player state
   * @returns Player info
   */
  static toPlayerInfo(playerState: PlayerState): PlayerInfo {
    return {
      publicKey: playerState.player,
      seatIndex: playerState.seatIndex,
      chipStack: playerState.chipStack,
      currentBet: playerState.currentBet,
      totalBetThisHand: playerState.totalBetThisHand,
      status: playerState.status,
      hasFolded: playerState.hasFolded,
      isAllIn: playerState.isAllIn,
      hasCards: playerState.hasCards,
      isActive: this.isPlayerActive(playerState),
    };
  }

  /**
   * Check if player is active
   * 
   * @param playerState - Player state
   * @returns True if player is active
   */
  static isPlayerActive(playerState: PlayerState): boolean {
    return (
      !playerState.hasFolded &&
      playerState.chipStack.gt(new BN(0)) &&
      playerState.status === PlayerStatus.Active
    );
  }

  /**
   * Check if player has acted this round
   * 
   * @param playerState - Player state
   * @param game - Game account
   * @returns True if player has acted
   */
  static hasPlayerActed(
    playerState: PlayerState,
    game: Game
  ): boolean {
    const playerIndex = this.getPlayerIndex(game, playerState.player);
    if (playerIndex === -1) return false;
    return game.playersActed[playerIndex];
  }

  /**
   * Get player index in game
   * 
   * @param game - Game account
   * @param player - Player public key
   * @returns Player index or -1
   */
  static getPlayerIndex(game: Game, player: PublicKey): number {
    for (let i = 0; i < game.playerCount; i++) {
      if (game.players[i].equals(player)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Get player's total investment in current hand
   * 
   * @param playerState - Player state
   * @returns Total investment
   */
  static getTotalInvestment(playerState: PlayerState): BN {
    return playerState.totalBetThisHand;
  }

  /**
   * Get player's remaining chips
   * 
   * @param playerState - Player state
   * @returns Remaining chips
   */
  static getRemainingChips(playerState: PlayerState): BN {
    return playerState.chipStack;
  }

  /**
   * Calculate player's total chips (stack + current bet)
   * 
   * @param playerState - Player state
   * @returns Total chips
   */
  static getTotalChips(playerState: PlayerState): BN {
    return playerState.chipStack.add(playerState.currentBet);
  }

  /**
   * Check if player can act
   * 
   * @param playerState - Player state
   * @param game - Game account
   * @returns True if player can act
   */
  static canPlayerAct(
    playerState: PlayerState,
    game: Game
  ): boolean {
    // Player must be active
    if (!this.isPlayerActive(playerState)) {
      return false;
    }

    // Must be player's turn
    const playerIndex = this.getPlayerIndex(game, playerState.player);
    if (playerIndex !== game.currentPlayerIndex) {
      return false;
    }

    return true;
  }

  /**
   * Get player's position relative to dealer
   * 
   * @param playerState - Player state
   * @param game - Game account
   * @returns Position name
   */
  static getPlayerPosition(
    playerState: PlayerState,
    game: Game
  ): string {
    const playerIndex = this.getPlayerIndex(game, playerState.player);
    if (playerIndex === -1) return 'Unknown';

    const dealerIndex = game.dealerPosition;
    const relativePosition = (playerIndex - dealerIndex + game.playerCount) % game.playerCount;

    if (relativePosition === 0) return 'Dealer';
    if (relativePosition === 1) return 'Small Blind';
    if (relativePosition === 2) return 'Big Blind';
    if (relativePosition === game.playerCount - 1) return 'Cutoff';
    return `Position ${relativePosition}`;
  }

  /**
   * Get active players count
   * 
   * @param playerStates - Array of player states
   * @returns Number of active players
   */
  static getActivePlayerCount(playerStates: PlayerState[]): number {
    return playerStates.filter(ps => this.isPlayerActive(ps)).length;
  }

  /**
   * Get players who haven't folded
   * 
   * @param playerStates - Array of player states
   * @returns Array of non-folded player states
   */
  static getNonFoldedPlayers(playerStates: PlayerState[]): PlayerState[] {
    return playerStates.filter(ps => !ps.hasFolded);
  }

  /**
   * Get all-in players
   * 
   * @param playerStates - Array of player states
   * @returns Array of all-in player states
   */
  static getAllInPlayers(playerStates: PlayerState[]): PlayerState[] {
    return playerStates.filter(ps => ps.isAllIn);
  }

  /**
   * Sort players by seat index
   * 
   * @param playerStates - Array of player states
   * @returns Sorted array
   */
  static sortBySeatIndex(playerStates: PlayerState[]): PlayerState[] {
    return [...playerStates].sort((a, b) => a.seatIndex - b.seatIndex);
  }

  /**
   * Find player by public key
   * 
   * @param playerStates - Array of player states
   * @param player - Player public key
   * @returns Player state or undefined
   */
  static findPlayer(
    playerStates: PlayerState[],
    player: PublicKey
  ): PlayerState | undefined {
    return playerStates.find(ps => ps.player.equals(player));
  }
}
