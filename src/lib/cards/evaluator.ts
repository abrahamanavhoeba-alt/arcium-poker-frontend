/**
 * Arcium Poker - Hand Evaluator
 * 
 * Poker hand evaluation and rankings.
 */

import { Card, Rank, Suit, DeckManager } from './deck';

/**
 * Poker hand rankings
 */
export enum HandRank {
  HighCard = 0,
  Pair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

/**
 * Evaluated hand result
 */
export interface HandResult {
  rank: HandRank;
  rankName: string;
  cards: Card[]; // Best 5-card hand
  value: number; // Numeric value for comparison
  description: string;
}

/**
 * Hand Evaluator
 * Evaluates poker hands and determines winners
 */
export class HandEvaluator {
  /**
   * Evaluate a 5-7 card hand
   * 
   * @param cards - Cards to evaluate (5-7 cards)
   * @returns Hand result
   */
  static evaluateHand(cards: Card[]): HandResult {
    if (cards.length < 5) {
      throw new Error('Need at least 5 cards to evaluate');
    }

    // If more than 5 cards, find best 5-card combination
    if (cards.length > 5) {
      return this.findBestHand(cards);
    }

    // Evaluate 5-card hand
    const sorted = DeckManager.sortCards(cards);

    if (this.isRoyalFlush(sorted)) {
      return this.createHandResult(HandRank.RoyalFlush, sorted, 'Royal Flush');
    }
    if (this.isStraightFlush(sorted)) {
      return this.createHandResult(HandRank.StraightFlush, sorted, 'Straight Flush');
    }
    if (this.isFourOfAKind(sorted)) {
      return this.createHandResult(HandRank.FourOfAKind, sorted, 'Four of a Kind');
    }
    if (this.isFullHouse(sorted)) {
      return this.createHandResult(HandRank.FullHouse, sorted, 'Full House');
    }
    if (this.isFlush(sorted)) {
      return this.createHandResult(HandRank.Flush, sorted, 'Flush');
    }
    if (this.isStraight(sorted)) {
      return this.createHandResult(HandRank.Straight, sorted, 'Straight');
    }
    if (this.isThreeOfAKind(sorted)) {
      return this.createHandResult(HandRank.ThreeOfAKind, sorted, 'Three of a Kind');
    }
    if (this.isTwoPair(sorted)) {
      return this.createHandResult(HandRank.TwoPair, sorted, 'Two Pair');
    }
    if (this.isPair(sorted)) {
      return this.createHandResult(HandRank.Pair, sorted, 'Pair');
    }

    return this.createHandResult(HandRank.HighCard, sorted, 'High Card');
  }

  /**
   * Find best 5-card hand from 6-7 cards
   */
  private static findBestHand(cards: Card[]): HandResult {
    let bestHand: HandResult | null = null;

    // Generate all 5-card combinations
    const combinations = this.getCombinations(cards, 5);

    for (const combo of combinations) {
      const hand = this.evaluateHand(combo);
      if (!bestHand || hand.value > bestHand.value) {
        bestHand = hand;
      }
    }

    return bestHand!;
  }

  /**
   * Get all combinations of k cards from array
   */
  private static getCombinations(cards: Card[], k: number): Card[][] {
    const result: Card[][] = [];

    const combine = (start: number, chosen: Card[]) => {
      if (chosen.length === k) {
        result.push([...chosen]);
        return;
      }

      for (let i = start; i < cards.length; i++) {
        chosen.push(cards[i]);
        combine(i + 1, chosen);
        chosen.pop();
      }
    };

    combine(0, []);
    return result;
  }

  /**
   * Create hand result
   */
  private static createHandResult(
    rank: HandRank,
    cards: Card[],
    description: string
  ): HandResult {
    return {
      rank,
      rankName: HandRank[rank],
      cards,
      value: this.calculateHandValue(rank, cards),
      description,
    };
  }

  /**
   * Calculate numeric hand value for comparison
   */
  private static calculateHandValue(rank: HandRank, cards: Card[]): number {
    // Base value from rank (multiplied by large number)
    let value = rank * 100000000;

    // Add card values for tiebreaking
    for (let i = 0; i < cards.length; i++) {
      value += cards[i].value * Math.pow(100, 4 - i);
    }

    return value;
  }

  /**
   * Check for Royal Flush
   */
  private static isRoyalFlush(cards: Card[]): boolean {
    return this.isStraightFlush(cards) && cards[0].rank === Rank.Ace;
  }

  /**
   * Check for Straight Flush
   */
  private static isStraightFlush(cards: Card[]): boolean {
    return this.isFlush(cards) && this.isStraight(cards);
  }

  /**
   * Check for Four of a Kind
   */
  private static isFourOfAKind(cards: Card[]): boolean {
    const ranks = this.getRankCounts(cards);
    return Object.values(ranks).includes(4);
  }

  /**
   * Check for Full House
   */
  private static isFullHouse(cards: Card[]): boolean {
    const ranks = this.getRankCounts(cards);
    const counts = Object.values(ranks).sort((a, b) => b - a);
    return counts[0] === 3 && counts[1] === 2;
  }

  /**
   * Check for Flush
   */
  private static isFlush(cards: Card[]): boolean {
    const suit = cards[0].suit;
    return cards.every(card => card.suit === suit);
  }

  /**
   * Check for Straight
   */
  private static isStraight(cards: Card[]): boolean {
    const sorted = [...cards].sort((a, b) => a.value - b.value);

    // Check regular straight
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].value !== sorted[i - 1].value + 1) {
        // Check for A-2-3-4-5 (wheel)
        if (i === 4 && sorted[0].value === 2 && sorted[4].rank === Rank.Ace) {
          return true;
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Check for Three of a Kind
   */
  private static isThreeOfAKind(cards: Card[]): boolean {
    const ranks = this.getRankCounts(cards);
    return Object.values(ranks).includes(3);
  }

  /**
   * Check for Two Pair
   */
  private static isTwoPair(cards: Card[]): boolean {
    const ranks = this.getRankCounts(cards);
    const pairs = Object.values(ranks).filter(count => count === 2);
    return pairs.length === 2;
  }

  /**
   * Check for Pair
   */
  private static isPair(cards: Card[]): boolean {
    const ranks = this.getRankCounts(cards);
    return Object.values(ranks).includes(2);
  }

  /**
   * Get rank counts
   */
  private static getRankCounts(cards: Card[]): Record<Rank, number> {
    const counts: Partial<Record<Rank, number>> = {};

    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }

    return counts as Record<Rank, number>;
  }

  /**
   * Compare two hands
   * 
   * @param hand1 - First hand
   * @param hand2 - Second hand
   * @returns -1 if hand1 < hand2, 0 if equal, 1 if hand1 > hand2
   */
  static compareHands(hand1: HandResult, hand2: HandResult): number {
    if (hand1.value < hand2.value) return -1;
    if (hand1.value > hand2.value) return 1;
    return 0;
  }

  /**
   * Get hand rank name
   * 
   * @param rank - Hand rank
   * @returns Rank name
   */
  static getHandRankName(rank: HandRank): string {
    return HandRank[rank];
  }
}
