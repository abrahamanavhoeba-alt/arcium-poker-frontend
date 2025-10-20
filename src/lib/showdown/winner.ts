/**
 * Arcium Poker - Showdown Winner
 * 
 * Handles winner determination at showdown.
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Game, PlayerState } from '../shared/types';

/**
 * Winner information
 */
export interface Winner {
  player: PublicKey;
  playerState: PlayerState;
  winAmount: BN;
  handRank?: number;
}

/**
 * Showdown Winner
 * Determines winners and calculates payouts
 */
export class ShowdownWinner {
  /**
   * Determine winners from active players
   * 
   * @param game - Game account
   * @param playerStates - All player states
   * @returns Array of winners
   */
  static determineWinners(
    game: Game,
    playerStates: PlayerState[]
  ): Winner[] {
    // Filter active players who haven't folded
    const activePlayers = playerStates.filter(
      (ps) => !ps.hasFolded && (ps.chipStack.gt(new BN(0)) || ps.totalBetThisHand.gt(new BN(0)))
    );

    if (activePlayers.length === 0) {
      return [];
    }

    // If only one player remains, they win
    if (activePlayers.length === 1) {
      return [
        {
          player: activePlayers[0].player,
          playerState: activePlayers[0],
          winAmount: game.pot,
        },
      ];
    }

    // In a real implementation, this would evaluate poker hands
    // For now, we'll split the pot equally among active players
    const winAmount = game.pot.div(new BN(activePlayers.length));

    return activePlayers.map((ps) => ({
      player: ps.player,
      playerState: ps,
      winAmount,
    }));
  }

  /**
   * Check if player is winner
   * 
   * @param player - Player public key
   * @param winners - Array of winners
   * @returns True if player is a winner
   */
  static isWinner(player: PublicKey, winners: Winner[]): boolean {
    return winners.some((w) => w.player.equals(player));
  }

  /**
   * Get player's winnings
   * 
   * @param player - Player public key
   * @param winners - Array of winners
   * @returns Win amount or zero
   */
  static getPlayerWinnings(player: PublicKey, winners: Winner[]): BN {
    const winner = winners.find((w) => w.player.equals(player));
    return winner ? winner.winAmount : new BN(0);
  }

  /**
   * Get total winnings distributed
   * 
   * @param winners - Array of winners
   * @returns Total amount
   */
  static getTotalWinnings(winners: Winner[]): BN {
    return winners.reduce((sum, w) => sum.add(w.winAmount), new BN(0));
  }

  /**
   * Check if there's a single winner
   * 
   * @param winners - Array of winners
   * @returns True if single winner
   */
  static hasSingleWinner(winners: Winner[]): boolean {
    return winners.length === 1;
  }

  /**
   * Check if pot is split
   * 
   * @param winners - Array of winners
   * @returns True if pot is split
   */
  static isSplitPot(winners: Winner[]): boolean {
    return winners.length > 1;
  }
}
