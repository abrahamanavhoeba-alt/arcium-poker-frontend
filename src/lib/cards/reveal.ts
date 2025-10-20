/**
 * Arcium Poker - Card Reveal
 * 
 * Card reveal logic for showdown.
 * Note: In production, this would use MPC for secure reveals.
 */

import { Card } from './deck';
import { HandEvaluator, HandResult } from './evaluator';

/**
 * Player hand reveal
 */
export interface PlayerHandReveal {
  playerIndex: number;
  holeCards: Card[];
  bestHand: HandResult;
}

/**
 * Card Reveal Manager
 * Handles card reveals at showdown
 */
export class CardReveal {
  /**
   * Reveal and evaluate all player hands
   * 
   * @param holeCards - Hole cards for each player
   * @param communityCards - Community cards
   * @param activePlayers - Indices of active (non-folded) players
   * @returns Array of player hand reveals
   */
  static revealHands(
    holeCards: Card[][],
    communityCards: Card[],
    activePlayers: number[]
  ): PlayerHandReveal[] {
    const reveals: PlayerHandReveal[] = [];

    for (const playerIndex of activePlayers) {
      const playerHoleCards = holeCards[playerIndex];
      const allCards = [...playerHoleCards, ...communityCards];
      const bestHand = HandEvaluator.evaluateHand(allCards);

      reveals.push({
        playerIndex,
        holeCards: playerHoleCards,
        bestHand,
      });
    }

    return reveals;
  }

  /**
   * Determine winners from revealed hands
   * 
   * @param reveals - Player hand reveals
   * @returns Indices of winning players
   */
  static determineWinners(reveals: PlayerHandReveal[]): number[] {
    if (reveals.length === 0) return [];
    if (reveals.length === 1) return [reveals[0].playerIndex];

    // Find best hand value
    let bestValue = reveals[0].bestHand.value;
    for (const reveal of reveals) {
      if (reveal.bestHand.value > bestValue) {
        bestValue = reveal.bestHand.value;
      }
    }

    // Get all players with best hand (handles ties)
    const winners: number[] = [];
    for (const reveal of reveals) {
      if (reveal.bestHand.value === bestValue) {
        winners.push(reveal.playerIndex);
      }
    }

    return winners;
  }

  /**
   * Get reveal for specific player
   * 
   * @param reveals - All reveals
   * @param playerIndex - Player index
   * @returns Player reveal or undefined
   */
  static getPlayerReveal(
    reveals: PlayerHandReveal[],
    playerIndex: number
  ): PlayerHandReveal | undefined {
    return reveals.find(r => r.playerIndex === playerIndex);
  }

  /**
   * Sort reveals by hand strength (best first)
   * 
   * @param reveals - Player hand reveals
   * @returns Sorted reveals
   */
  static sortByHandStrength(reveals: PlayerHandReveal[]): PlayerHandReveal[] {
    return [...reveals].sort((a, b) => b.bestHand.value - a.bestHand.value);
  }
}
