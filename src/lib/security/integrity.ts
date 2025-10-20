/**
 * Arcium Poker - Data Integrity
 * 
 * Data integrity checks and verification.
 */

import { Game, PlayerState } from '../shared/types';
import BN from 'bn.js';

/**
 * Integrity Checker
 */
export class IntegrityChecker {
  /**
   * Verify game state integrity
   */
  static verifyGameState(game: Game): boolean {
    // Check player count
    if (game.playerCount < 0 || game.playerCount > game.maxPlayers) {
      return false;
    }

    // Check pot is non-negative
    if (game.pot.lt(new BN(0))) {
      return false;
    }

    // Check current bet is non-negative
    if (game.currentBet.lt(new BN(0))) {
      return false;
    }

    return true;
  }

  /**
   * Verify player state integrity
   */
  static verifyPlayerState(playerState: PlayerState): boolean {
    // Check chip stack is non-negative
    if (playerState.chipStack.lt(new BN(0))) {
      return false;
    }

    // Check current bet is non-negative
    if (playerState.currentBet.lt(new BN(0))) {
      return false;
    }

    return true;
  }

  /**
   * Verify pot matches player bets
   */
  static verifyPotIntegrity(
    game: Game,
    playerStates: PlayerState[]
  ): boolean {
    const totalBets = playerStates.reduce(
      (sum, ps) => sum.add(ps.totalBetThisHand),
      new BN(0)
    );

    return game.pot.eq(totalBets);
  }
}
