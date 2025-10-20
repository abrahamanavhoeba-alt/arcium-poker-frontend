/**
 * Arcium Poker - Betting State
 * 
 * Tracks betting state throughout a hand.
 */

import BN from 'bn.js';
import { Game, PlayerState, GameStage } from '../shared/types';

/**
 * Betting round state
 */
export interface BettingRoundState {
  stage: GameStage;
  currentBet: BN;
  pot: BN;
  activePlayers: number;
  playersActed: boolean[];
}

/**
 * Betting State Manager
 */
export class BettingState {
  /**
   * Get current betting round state
   */
  static getCurrentState(game: Game, playerStates: PlayerState[]): BettingRoundState {
    const activePlayers = playerStates.filter(ps => !ps.hasFolded).length;
    
    return {
      stage: game.stage,
      currentBet: game.currentBet,
      pot: game.pot,
      activePlayers,
      playersActed: game.playersActed,
    };
  }

  /**
   * Check if betting round is active
   */
  static isRoundActive(game: Game): boolean {
    return [
      GameStage.PreFlop,
      GameStage.Flop,
      GameStage.Turn,
      GameStage.River,
    ].includes(game.stage);
  }
}
