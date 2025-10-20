/**
 * Arcium Poker - Bet Validator
 * 
 * Validates betting actions.
 */

import BN from 'bn.js';
import { Game, PlayerState, ValidationResult } from '../shared/types';
import { GameLogic } from '../game/logic';

/**
 * Bet Validator
 * Validates all betting actions
 */
export class BetValidator {
  /**
   * Validate fold action
   */
  static validateFold(game: Game, playerState: PlayerState): ValidationResult {
    if (playerState.hasFolded) {
      return { valid: false, error: 'Player has already folded' };
    }
    return { valid: true };
  }

  /**
   * Validate check action
   */
  static validateCheck(game: Game, playerState: PlayerState): ValidationResult {
    if (!GameLogic.canCheck(game, playerState)) {
      return { valid: false, error: 'Cannot check - must call or raise' };
    }
    return { valid: true };
  }

  /**
   * Validate call action
   */
  static validateCall(game: Game, playerState: PlayerState): ValidationResult {
    if (!GameLogic.canCall(game, playerState)) {
      return { valid: false, error: 'Cannot call' };
    }
    
    const callAmount = GameLogic.getCallAmount(game, playerState);
    if (callAmount.gt(playerState.chipStack)) {
      return { valid: false, error: 'Insufficient chips to call' };
    }
    
    return { valid: true };
  }

  /**
   * Validate bet action
   */
  static validateBet(
    amount: BN,
    game: Game,
    playerState: PlayerState
  ): ValidationResult {
    if (!GameLogic.canBet(game, playerState)) {
      return { valid: false, error: 'Cannot bet - there is already a bet' };
    }
    
    return GameLogic.validateBetAmount(amount, game, playerState);
  }

  /**
   * Validate raise action
   */
  static validateRaise(
    amount: BN,
    game: Game,
    playerState: PlayerState
  ): ValidationResult {
    if (!GameLogic.canRaise(game, playerState)) {
      return { valid: false, error: 'Cannot raise' };
    }
    
    return GameLogic.validateRaiseAmount(amount, game, playerState);
  }

  /**
   * Validate all-in action
   */
  static validateAllIn(game: Game, playerState: PlayerState): ValidationResult {
    if (playerState.chipStack.lte(new BN(0))) {
      return { valid: false, error: 'No chips to go all-in' };
    }
    
    if (playerState.isAllIn) {
      return { valid: false, error: 'Already all-in' };
    }
    
    return { valid: true };
  }
}
