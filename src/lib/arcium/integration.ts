/**
 * Arcium Poker - MPC Integration
 * 
 * Main integration module for Arcium MPC functionality.
 * Note: This is a stub implementation. Full MPC integration pending.
 */

import { MPCShuffle } from './mpc-shuffle';
import { MPCDeal } from './mpc-deal';
import { MPCReveal } from './mpc-reveal';
import { Card } from '../cards/deck';

/**
 * Arcium MPC Integration
 * Coordinates all MPC operations
 */
export class ArciumMPC {
  /**
   * Initialize a new MPC poker game
   * 
   * @param playerCount - Number of players
   * @returns MPC session ID
   */
  static async initializeGame(playerCount: number): Promise<Uint8Array> {
    console.log(`Initializing Arcium MPC game for ${playerCount} players`);
    return await MPCShuffle.initializeShuffleSession(playerCount);
  }

  /**
   * Perform complete MPC shuffle and deal
   * 
   * @param sessionId - MPC session ID
   * @param playerCount - Number of players
   * @returns Success status
   */
  static async shuffleAndDeal(
    sessionId: Uint8Array,
    playerCount: number
  ): Promise<boolean> {
    try {
      // Shuffle deck
      const shuffleResult = await MPCShuffle.shuffleDeck(sessionId, []);
      if (!shuffleResult.success) return false;

      // Verify shuffle
      const verified = await MPCShuffle.verifyShuffle(
        sessionId,
        shuffleResult.encryptedDeck
      );
      if (!verified) return false;

      // Deal to players
      const dealResult = await MPCDeal.dealToPlayers(sessionId, playerCount, 2);
      if (!dealResult.success) return false;

      // Deal community cards
      await MPCDeal.dealCommunityCards(sessionId, 5);

      return true;
    } catch (error) {
      console.error('MPC shuffle and deal failed:', error);
      return false;
    }
  }

  /**
   * Reveal cards at showdown
   * 
   * @param sessionId - MPC session ID
   * @param playerIndices - Indices of players to reveal
   * @returns Revealed cards for each player
   */
  static async revealShowdown(
    sessionId: Uint8Array,
    playerIndices: number[]
  ): Promise<Map<number, Card[]>> {
    const reveals = new Map<number, Card[]>();

    for (const playerIndex of playerIndices) {
      const cards = await MPCReveal.revealHoleCards(
        sessionId,
        playerIndex,
        new Uint8Array(2)
      );
      reveals.set(playerIndex, cards);
    }

    return reveals;
  }

  /**
   * Check if MPC is available
   * 
   * @returns True if MPC is available
   */
  static isAvailable(): boolean {
    // TODO: Check if Arcium MPC is properly configured
    console.log('Checking Arcium MPC availability...');
    return false; // Not yet integrated
  }

  /**
   * Get MPC configuration status
   * 
   * @returns Configuration status
   */
  static getStatus(): {
    available: boolean;
    configured: boolean;
    message: string;
  } {
    return {
      available: false,
      configured: false,
      message: 'Arcium MPC integration pending. Using client-side shuffle for development.',
    };
  }
}

// Re-export MPC modules
export { MPCShuffle } from './mpc-shuffle';
export { MPCDeal } from './mpc-deal';
export { MPCReveal } from './mpc-reveal';
