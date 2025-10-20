/**
 * Arcium Poker - Pot Manager
 * 
 * Manages main pot and side pots.
 */

import BN from 'bn.js';
import { PlayerState } from '../shared/types';

/**
 * Side pot information
 */
export interface SidePot {
  amount: BN;
  eligiblePlayers: number[]; // Player indices
  capAmount: BN; // Max bet amount for this pot
}

/**
 * Pot distribution result
 */
export interface PotDistribution {
  mainPot: BN;
  sidePots: SidePot[];
  totalPot: BN;
}

/**
 * Pot Manager
 * Handles pot and side-pot calculations
 */
export class PotManager {
  /**
   * Calculate pot distribution including side pots
   * 
   * @param playerStates - Array of player states
   * @returns Pot distribution
   */
  static calculatePots(playerStates: PlayerState[]): PotDistribution {
    const activePlayers = playerStates.filter(ps => !ps.hasFolded);
    
    if (activePlayers.length === 0) {
      return {
        mainPot: new BN(0),
        sidePots: [],
        totalPot: new BN(0),
      };
    }

    // Sort players by total bet amount
    const sorted = [...activePlayers].sort((a, b) => 
      a.totalBetThisHand.cmp(b.totalBetThisHand)
    );

    const pots: SidePot[] = [];
    let previousCap = new BN(0);

    for (let i = 0; i < sorted.length; i++) {
      const currentCap = sorted[i].totalBetThisHand;
      
      if (currentCap.lte(previousCap)) continue;

      // Calculate pot amount for this level
      const betDiff = currentCap.sub(previousCap);
      const eligibleCount = sorted.length - i;
      const potAmount = betDiff.mul(new BN(eligibleCount));

      // Get eligible player indices
      const eligiblePlayers = sorted.slice(i).map(ps => ps.seatIndex);

      pots.push({
        amount: potAmount,
        eligiblePlayers,
        capAmount: currentCap,
      });

      previousCap = currentCap;
    }

    const mainPot = pots.length > 0 ? pots[0].amount : new BN(0);
    const sidePots = pots.slice(1);
    const totalPot = pots.reduce((sum, pot) => sum.add(pot.amount), new BN(0));

    return {
      mainPot,
      sidePots,
      totalPot,
    };
  }

  /**
   * Distribute pot to winners
   * 
   * @param potAmount - Pot amount to distribute
   * @param winnerIndices - Indices of winning players
   * @returns Amount per winner
   */
  static distributePot(potAmount: BN, winnerIndices: number[]): Map<number, BN> {
    const distribution = new Map<number, BN>();
    
    if (winnerIndices.length === 0) return distribution;

    const amountPerWinner = potAmount.div(new BN(winnerIndices.length));
    const remainder = potAmount.mod(new BN(winnerIndices.length));

    for (let i = 0; i < winnerIndices.length; i++) {
      let amount = amountPerWinner;
      // Give remainder to first winner(s)
      if (i < remainder.toNumber()) {
        amount = amount.add(new BN(1));
      }
      distribution.set(winnerIndices[i], amount);
    }

    return distribution;
  }

  /**
   * Calculate total pot from player bets
   * 
   * @param playerStates - Array of player states
   * @returns Total pot amount
   */
  static calculateTotalPot(playerStates: PlayerState[]): BN {
    return playerStates.reduce(
      (sum, ps) => sum.add(ps.totalBetThisHand),
      new BN(0)
    );
  }

  /**
   * Get eligible players for a pot
   * 
   * @param playerStates - Array of player states
   * @param maxBet - Maximum bet amount for eligibility
   * @returns Eligible player indices
   */
  static getEligiblePlayers(
    playerStates: PlayerState[],
    maxBet: BN
  ): number[] {
    return playerStates
      .filter(ps => !ps.hasFolded && ps.totalBetThisHand.gte(maxBet))
      .map(ps => ps.seatIndex);
  }

  /**
   * Check if side pots are needed
   * 
   * @param playerStates - Array of player states
   * @returns True if side pots needed
   */
  static needsSidePots(playerStates: PlayerState[]): boolean {
    const activePlayers = playerStates.filter(ps => !ps.hasFolded);
    if (activePlayers.length <= 1) return false;

    // Check if all active players have same total bet
    const firstBet = activePlayers[0].totalBetThisHand;
    return !activePlayers.every(ps => ps.totalBetThisHand.eq(firstBet));
  }
}
