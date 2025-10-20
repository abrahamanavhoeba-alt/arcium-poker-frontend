/**
 * Arcium Poker - Betting Instructions
 * 
 * Helper functions for betting instructions.
 */

import BN from 'bn.js';
import { Game, PlayerState } from '../shared/types';
import { GameLogic } from '../game/logic';

/**
 * Betting instruction helpers
 */
export class BettingInstruction {
  /**
   * Get available actions for player
   */
  static getAvailableActions(
    game: Game,
    playerState: PlayerState
  ): string[] {
    const actions: string[] = ['fold'];

    if (GameLogic.canCheck(game, playerState)) {
      actions.push('check');
    }

    if (GameLogic.canCall(game, playerState)) {
      actions.push('call');
    }

    if (GameLogic.canBet(game, playerState)) {
      actions.push('bet');
    }

    if (GameLogic.canRaise(game, playerState)) {
      actions.push('raise');
    }

    if (playerState.chipStack.gt(new BN(0))) {
      actions.push('all-in');
    }

    return actions;
  }

  /**
   * Get suggested bet amounts
   */
  static getSuggestedBets(game: Game, playerState: PlayerState): BN[] {
    const suggestions: BN[] = [];
    const pot = game.pot;

    // 1/3 pot
    suggestions.push(pot.div(new BN(3)));
    // 1/2 pot
    suggestions.push(pot.div(new BN(2)));
    // 3/4 pot
    suggestions.push(pot.mul(new BN(3)).div(new BN(4)));
    // Full pot
    suggestions.push(pot);

    // Filter by player's chip stack
    return suggestions.filter(amount => amount.lte(playerState.chipStack));
  }
}
