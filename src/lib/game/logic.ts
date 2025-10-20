/**
 * Arcium Poker - Game Logic
 * 
 * Game rules validation and helper functions.
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Game, PlayerState, GameStage, ValidationResult } from '../shared/types';
import { MIN_PLAYERS, MAX_PLAYERS } from '../shared/constants';

/**
 * Game Logic
 * Enforces game rules client-side
 */
export class GameLogic {
  /**
   * Validate game can start
   * 
   * @param game - Game account
   * @returns Validation result
   */
  static validateGameStart(game: Game): ValidationResult {
    if (game.stage !== GameStage.Waiting) {
      return {
        valid: false,
        error: 'Game has already started',
      };
    }

    if (game.playerCount < MIN_PLAYERS) {
      return {
        valid: false,
        error: `Need at least ${MIN_PLAYERS} players to start`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate betting round is complete
   * 
   * @param game - Game account
   * @param playerStates - Array of player states
   * @returns True if round is complete
   */
  static isBettingRoundComplete(
    game: Game,
    playerStates: PlayerState[]
  ): boolean {
    // Get active players (not folded)
    const activePlayers = playerStates.filter(ps => !ps.hasFolded);

    // If only one player left, round is complete
    if (activePlayers.length <= 1) {
      return true;
    }

    // Check if all active players have acted
    const allActed = activePlayers.every(ps => {
      const playerIndex = this.getPlayerIndex(game, ps.player);
      return playerIndex !== -1 && game.playersActed[playerIndex];
    });

    if (!allActed) {
      return false;
    }

    // Check if all active players have matched the current bet or are all-in
    const allMatched = activePlayers.every(ps => {
      return ps.currentBet.eq(game.currentBet) || ps.isAllIn;
    });

    return allMatched;
  }

  /**
   * Get next player index
   * 
   * @param game - Game account
   * @param playerStates - Array of player states
   * @returns Next player index or -1
   */
  static getNextPlayerIndex(
    game: Game,
    playerStates: PlayerState[]
  ): number {
    const startIndex = game.currentPlayerIndex;
    let nextIndex = (startIndex + 1) % game.playerCount;
    let attempts = 0;

    while (attempts < game.playerCount) {
      const playerState = playerStates.find(ps => {
        const idx = this.getPlayerIndex(game, ps.player);
        return idx === nextIndex;
      });

      // Check if player can act (not folded, has chips)
      if (playerState && !playerState.hasFolded && !playerState.isAllIn) {
        return nextIndex;
      }

      nextIndex = (nextIndex + 1) % game.playerCount;
      attempts++;
    }

    return -1; // No valid next player
  }

  /**
   * Calculate minimum raise amount
   * 
   * @param game - Game account
   * @returns Minimum raise amount
   */
  static getMinimumRaise(game: Game): BN {
    // Minimum raise is 2x the current bet
    return game.currentBet.mul(new BN(2));
  }

  /**
   * Calculate call amount for player
   * 
   * @param game - Game account
   * @param playerState - Player state
   * @returns Amount needed to call
   */
  static getCallAmount(game: Game, playerState: PlayerState): BN {
    return game.currentBet.sub(playerState.currentBet);
  }

  /**
   * Check if player can check
   * 
   * @param game - Game account
   * @param playerState - Player state
   * @returns True if player can check
   */
  static canCheck(game: Game, playerState: PlayerState): boolean {
    return playerState.currentBet.eq(game.currentBet);
  }

  /**
   * Check if player can call
   * 
   * @param game - Game account
   * @param playerState - Player state
   * @returns True if player can call
   */
  static canCall(game: Game, playerState: PlayerState): boolean {
    const callAmount = this.getCallAmount(game, playerState);
    return callAmount.gt(new BN(0)) && callAmount.lte(playerState.chipStack);
  }

  /**
   * Check if player can bet
   * 
   * @param game - Game account
   * @param playerState - Player state
   * @returns True if player can bet
   */
  static canBet(game: Game, playerState: PlayerState): boolean {
    return game.currentBet.eq(new BN(0)) && playerState.chipStack.gt(new BN(0));
  }

  /**
   * Check if player can raise
   * 
   * @param game - Game account
   * @param playerState - Player state
   * @returns True if player can raise
   */
  static canRaise(game: Game, playerState: PlayerState): boolean {
    const minRaise = this.getMinimumRaise(game);
    return game.currentBet.gt(new BN(0)) && playerState.chipStack.gte(minRaise);
  }

  /**
   * Validate bet amount
   * 
   * @param amount - Bet amount
   * @param game - Game account
   * @param playerState - Player state
   * @returns Validation result
   */
  static validateBetAmount(
    amount: BN,
    game: Game,
    playerState: PlayerState
  ): ValidationResult {
    if (amount.lte(new BN(0))) {
      return {
        valid: false,
        error: 'Bet amount must be greater than 0',
      };
    }

    if (amount.lt(game.bigBlind)) {
      return {
        valid: false,
        error: `Bet must be at least the big blind (${game.bigBlind.toString()})`,
      };
    }

    if (amount.gt(playerState.chipStack)) {
      return {
        valid: false,
        error: 'Insufficient chips',
      };
    }

    return { valid: true };
  }

  /**
   * Validate raise amount
   * 
   * @param amount - Raise amount
   * @param game - Game account
   * @param playerState - Player state
   * @returns Validation result
   */
  static validateRaiseAmount(
    amount: BN,
    game: Game,
    playerState: PlayerState
  ): ValidationResult {
    const minRaise = this.getMinimumRaise(game);

    if (amount.lt(minRaise)) {
      return {
        valid: false,
        error: `Raise must be at least ${minRaise.toString()} (2x current bet)`,
      };
    }

    if (amount.gt(playerState.chipStack)) {
      return {
        valid: false,
        error: 'Insufficient chips',
      };
    }

    return { valid: true };
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
   * Calculate pot odds for a call
   * 
   * @param potSize - Current pot size
   * @param callAmount - Amount to call
   * @returns Pot odds as a percentage
   */
  static calculatePotOdds(potSize: BN, callAmount: BN): number {
    if (callAmount.eq(new BN(0))) return 0;
    const totalPot = potSize.add(callAmount);
    return (callAmount.toNumber() / totalPot.toNumber()) * 100;
  }

  /**
   * Check if all players are all-in
   * 
   * @param playerStates - Array of player states
   * @returns True if all active players are all-in
   */
  static areAllPlayersAllIn(playerStates: PlayerState[]): boolean {
    const activePlayers = playerStates.filter(ps => !ps.hasFolded);
    if (activePlayers.length === 0) return false;
    
    return activePlayers.every(ps => ps.isAllIn || ps.chipStack.eq(new BN(0)));
  }

  /**
   * Get number of active players
   * 
   * @param playerStates - Array of player states
   * @returns Number of active players
   */
  static getActivePlayerCount(playerStates: PlayerState[]): number {
    return playerStates.filter(ps => !ps.hasFolded).length;
  }

  /**
   * Check if game should proceed to showdown
   * 
   * @param game - Game account
   * @param playerStates - Array of player states
   * @returns True if should go to showdown
   */
  static shouldProceedToShowdown(
    game: Game,
    playerStates: PlayerState[]
  ): boolean {
    // If in River stage and betting is complete
    if (game.stage === GameStage.River) {
      return this.isBettingRoundComplete(game, playerStates);
    }

    // If only one player left (others folded)
    const activeCount = this.getActivePlayerCount(playerStates);
    if (activeCount === 1) {
      return true;
    }

    // If all players are all-in
    if (this.areAllPlayersAllIn(playerStates)) {
      return true;
    }

    return false;
  }

  /**
   * Validate game configuration
   * 
   * @param config - Game configuration
   * @returns Validation result
   */
  static validateGameConfig(config: {
    smallBlind: BN;
    bigBlind: BN;
    minBuyIn: BN;
    maxBuyIn: BN;
    maxPlayers: number;
  }): ValidationResult {
    if (config.smallBlind.lte(new BN(0))) {
      return { valid: false, error: 'Small blind must be greater than 0' };
    }

    if (config.bigBlind.lte(config.smallBlind)) {
      return { valid: false, error: 'Big blind must be greater than small blind' };
    }

    if (config.minBuyIn.lt(config.bigBlind.mul(new BN(50)))) {
      return { valid: false, error: 'Minimum buy-in must be at least 50 big blinds' };
    }

    if (config.maxBuyIn.lte(config.minBuyIn)) {
      return { valid: false, error: 'Maximum buy-in must be greater than minimum' };
    }

    if (config.maxPlayers < MIN_PLAYERS || config.maxPlayers > MAX_PLAYERS) {
      return { valid: false, error: `Max players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}` };
    }

    return { valid: true };
  }
}
