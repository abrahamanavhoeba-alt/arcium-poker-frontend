/**
 * Arcium Poker - Token Conversion
 * 
 * Token conversion utilities.
 */

import BN from 'bn.js';

/**
 * Token Conversion Manager
 */
export class TokenConversion {
  // Lamports per SOL
  private static readonly LAMPORTS_PER_SOL = new BN(1_000_000_000);

  /**
   * Convert SOL to lamports
   */
  static solToLamports(sol: number): BN {
    return new BN(Math.floor(sol * 1_000_000_000));
  }

  /**
   * Convert lamports to SOL
   */
  static lamportsToSol(lamports: BN): number {
    return lamports.toNumber() / 1_000_000_000;
  }

  /**
   * Format lamports as SOL string
   */
  static formatSol(lamports: BN, decimals: number = 4): string {
    const sol = this.lamportsToSol(lamports);
    return sol.toFixed(decimals);
  }

  /**
   * Format chips for display
   */
  static formatChips(chips: BN): string {
    const value = chips.toNumber();
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
  }
}
