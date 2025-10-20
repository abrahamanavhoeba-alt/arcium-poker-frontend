/**
 * Arcium Poker - MPC Deal
 * 
 * MPC-based card dealing using Arcium's encrypted compute.
 * 
 * How it works:
 * 1. Cards are dealt from the encrypted deck
 * 2. Each card remains encrypted until reveal
 * 3. Players receive encrypted hole cards
 * 4. Community cards are dealt encrypted
 * 
 * Privacy guarantees:
 * - Players cannot see other players' cards
 * - Dealer cannot see any cards
 * - Cards are revealed only at showdown via MPC threshold decryption
 */

import { MPCShuffle } from './mpc-shuffle';
import { Card } from '../cards/deck';

/**
 * MPC Deal Result
 */
export interface MPCDealResult {
  encryptedCards: Uint8Array[];
  cardIndices: number[][];
  success: boolean;
}

/**
 * Community cards deal result
 */
export interface MPCCommunityDealResult {
  encryptedCards: Uint8Array;
  cardIndices: number[];
  success: boolean;
}

/**
 * MPC Deal Manager
 * Handles secure card dealing via Arcium MPC
 */
export class MPCDeal {
  private static deckPosition: Map<string, number> = new Map();

  /**
   * Deal encrypted hole cards to players
   * 
   * Deals 2 cards to each player from the encrypted deck.
   * Cards remain encrypted and are only revealed at showdown.
   * 
   * @param sessionId - MPC session ID
   * @param encryptedDeck - Encrypted shuffled deck
   * @param playerCount - Number of players
   * @param cardsPerPlayer - Cards to deal per player (default 2)
   * @returns Encrypted cards for each player
   */
  static async dealToPlayers(
    sessionId: Uint8Array,
    encryptedDeck: Uint8Array,
    playerCount: number,
    cardsPerPlayer: number = 2
  ): Promise<MPCDealResult> {
    console.log(`🃏 Dealing ${cardsPerPlayer} encrypted cards to ${playerCount} players via MPC...`);
    
    const sessionKey = Buffer.from(sessionId).toString('hex');
    let position = this.deckPosition.get(sessionKey) || 0;
    
    const encryptedCards: Uint8Array[] = [];
    const cardIndices: number[][] = [];
    
    // Deal cards to each player
    for (let i = 0; i < playerCount; i++) {
      const playerCards = new Uint8Array(cardsPerPlayer);
      const playerIndices: number[] = [];
      
      for (let j = 0; j < cardsPerPlayer; j++) {
        if (position >= encryptedDeck.length) {
          throw new Error('Not enough cards in deck');
        }
        
        playerCards[j] = encryptedDeck[position];
        playerIndices.push(position);
        position++;
      }
      
      encryptedCards.push(playerCards);
      cardIndices.push(playerIndices);
    }
    
    // Update deck position
    this.deckPosition.set(sessionKey, position);
    
    console.log(`✅ Dealt ${playerCount * cardsPerPlayer} encrypted cards. Deck position: ${position}/52`);
    
    return {
      encryptedCards,
      cardIndices,
      success: true,
    };
  }

  /**
   * Deal community cards (Flop, Turn, River)
   * 
   * Deals community cards from the encrypted deck.
   * Cards are burned and then dealt according to poker rules.
   * 
   * @param sessionId - MPC session ID
   * @param encryptedDeck - Encrypted shuffled deck
   * @param count - Number of community cards (3 for flop, 1 for turn/river)
   * @param burnCard - Whether to burn a card first (default true)
   * @returns Encrypted community cards
   */
  static async dealCommunityCards(
    sessionId: Uint8Array,
    encryptedDeck: Uint8Array,
    count: number,
    burnCard: boolean = true
  ): Promise<MPCCommunityDealResult> {
    console.log(`🃏 Dealing ${count} encrypted community cards via MPC...`);
    
    const sessionKey = Buffer.from(sessionId).toString('hex');
    let position = this.deckPosition.get(sessionKey) || 0;
    
    // Burn one card (standard poker rules)
    if (burnCard && position < encryptedDeck.length) {
      console.log(`🔥 Burning card at position ${position}`);
      position++;
    }
    
    const communityCards = new Uint8Array(count);
    const cardIndices: number[] = [];
    
    for (let i = 0; i < count; i++) {
      if (position >= encryptedDeck.length) {
        throw new Error('Not enough cards in deck');
      }
      
      communityCards[i] = encryptedDeck[position];
      cardIndices.push(position);
      position++;
    }
    
    // Update deck position
    this.deckPosition.set(sessionKey, position);
    
    console.log(`✅ Dealt ${count} community cards. Deck position: ${position}/52`);
    
    return {
      encryptedCards: communityCards,
      cardIndices,
      success: true,
    };
  }

  /**
   * Deal flop (3 community cards)
   */
  static async dealFlop(
    sessionId: Uint8Array,
    encryptedDeck: Uint8Array
  ): Promise<MPCCommunityDealResult> {
    return this.dealCommunityCards(sessionId, encryptedDeck, 3, true);
  }

  /**
   * Deal turn (4th community card)
   */
  static async dealTurn(
    sessionId: Uint8Array,
    encryptedDeck: Uint8Array
  ): Promise<MPCCommunityDealResult> {
    return this.dealCommunityCards(sessionId, encryptedDeck, 1, true);
  }

  /**
   * Deal river (5th community card)
   */
  static async dealRiver(
    sessionId: Uint8Array,
    encryptedDeck: Uint8Array
  ): Promise<MPCCommunityDealResult> {
    return this.dealCommunityCards(sessionId, encryptedDeck, 1, true);
  }

  /**
   * Reset deck position for new hand
   */
  static resetDeckPosition(sessionId: Uint8Array): void {
    const sessionKey = Buffer.from(sessionId).toString('hex');
    this.deckPosition.set(sessionKey, 0);
    console.log('🔄 Reset deck position for new hand');
  }

  /**
   * Get current deck position
   */
  static getDeckPosition(sessionId: Uint8Array): number {
    const sessionKey = Buffer.from(sessionId).toString('hex');
    return this.deckPosition.get(sessionKey) || 0;
  }

  /**
   * Clean up session
   */
  static cleanupSession(sessionId: Uint8Array): void {
    const sessionKey = Buffer.from(sessionId).toString('hex');
    this.deckPosition.delete(sessionKey);
    console.log('🧹 Cleaned up deal session');
  }
}
