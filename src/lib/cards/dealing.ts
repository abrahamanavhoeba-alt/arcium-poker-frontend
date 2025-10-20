/**
 * Arcium Poker - Card Dealing
 * 
 * Card dealing logic for poker games.
 * Note: In production, this would use MPC for secure dealing.
 */

import { Card, DeckManager } from './deck';

/**
 * Dealing result
 */
export interface DealResult {
  holeCards: Card[][]; // Hole cards for each player
  communityCards: Card[]; // Community cards
  remainingDeck: Card[]; // Remaining cards in deck
}

/**
 * Card Dealer
 * Handles card dealing for poker games
 */
export class CardDealer {
  /**
   * Deal cards for a poker game
   * 
   * @param playerCount - Number of players
   * @param deck - Shuffled deck (optional, creates new if not provided)
   * @returns Deal result
   */
  static dealGame(playerCount: number, deck?: Card[]): DealResult {
    const gameDeck = deck || DeckManager.shuffleDeck(DeckManager.createDeck());
    let remaining = [...gameDeck];

    // Deal 2 hole cards to each player
    const holeCards: Card[][] = [];
    for (let i = 0; i < playerCount; i++) {
      const { dealt, remaining: newRemaining } = DeckManager.dealCards(remaining, 2);
      holeCards.push(dealt);
      remaining = newRemaining;
    }

    // Deal 5 community cards
    const { dealt: communityCards, remaining: finalRemaining } = DeckManager.dealCards(remaining, 5);

    return {
      holeCards,
      communityCards,
      remainingDeck: finalRemaining,
    };
  }

  /**
   * Deal hole cards to players
   * 
   * @param playerCount - Number of players
   * @param deck - Deck to deal from
   * @returns Hole cards and remaining deck
   */
  static dealHoleCards(
    playerCount: number,
    deck: Card[]
  ): { holeCards: Card[][]; remaining: Card[] } {
    let remaining = [...deck];
    const holeCards: Card[][] = [];

    for (let i = 0; i < playerCount; i++) {
      const { dealt, remaining: newRemaining } = DeckManager.dealCards(remaining, 2);
      holeCards.push(dealt);
      remaining = newRemaining;
    }

    return { holeCards, remaining };
  }

  /**
   * Deal flop (3 community cards)
   * 
   * @param deck - Deck to deal from
   * @returns Flop cards and remaining deck
   */
  static dealFlop(deck: Card[]): { flop: Card[]; remaining: Card[] } {
    // Burn one card
    const afterBurn = deck.slice(1);
    const { dealt: flop, remaining } = DeckManager.dealCards(afterBurn, 3);
    return { flop, remaining };
  }

  /**
   * Deal turn (4th community card)
   * 
   * @param deck - Deck to deal from
   * @returns Turn card and remaining deck
   */
  static dealTurn(deck: Card[]): { turn: Card; remaining: Card[] } {
    // Burn one card
    const afterBurn = deck.slice(1);
    const { dealt, remaining } = DeckManager.dealCards(afterBurn, 1);
    return { turn: dealt[0], remaining };
  }

  /**
   * Deal river (5th community card)
   * 
   * @param deck - Deck to deal from
   * @returns River card and remaining deck
   */
  static dealRiver(deck: Card[]): { river: Card; remaining: Card[] } {
    // Burn one card
    const afterBurn = deck.slice(1);
    const { dealt, remaining } = DeckManager.dealCards(afterBurn, 1);
    return { river: dealt[0], remaining };
  }
}
