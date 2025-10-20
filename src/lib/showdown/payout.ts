/**
 * Arcium Poker - Showdown Payout
 * 
 * Handles executing showdown and distributing winnings.
 * Maps to: execute_showdown instruction (IDL lines 71-127)
 */

import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { ProgramClient } from '../connection/program';
import { RPCClient } from '../connection/rpc';
import {
  TxResult,
  ValidationResult,
  Game,
  GameStage,
} from '../shared/types';
import { ErrorCode, PokerError } from '../shared/errors';

/**
 * Result of executing showdown
 */
export interface ShowdownResult extends TxResult {
  game?: Game;
  winAmount?: BN;
}

/**
 * Showdown Payout
 * Handles showdown execution and payout distribution
 */
export class ShowdownPayout {
  /**
   * Execute showdown for a player
   * 
   * @param gamePDA - Game account public key
   * @param provider - Anchor provider with wallet
   * @returns Showdown result with transaction signature
   */
  static async executeShowdown(
    gamePDA: PublicKey,
    provider: AnchorProvider
  ): Promise<ShowdownResult> {
    try {
      // Get program instance
      const program = ProgramClient.getProgram();
      const player = provider.wallet.publicKey;

      // Derive player state PDA
      const [playerStatePDA] = ProgramClient.derivePlayerStatePDA(gamePDA, player);

      // Fetch game to validate
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) {
        throw new PokerError(ErrorCode.InvalidGameStage, 'Game not found');
      }

      // Validate can execute showdown
      const validation = this.validateShowdown(game);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidGameStage, validation.error);
      }

      // Build and send transaction
      const tx = await program.methods
        .executeShowdown()
        .accounts({
          game: gamePDA,
          playerState: playerStatePDA,
          player: player,
        })
        .rpc();

      // Confirm transaction
      await RPCClient.confirmTransaction(tx);

      // Fetch updated game
      const updatedGame = await ProgramClient.fetchGame(gamePDA);

      return {
        signature: tx,
        success: true,
        game: updatedGame,
      };
    } catch (error: any) {
      console.error('Error executing showdown:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidGameStage,
          error.message || 'Failed to execute showdown',
          error
        ),
      };
    }
  }

  /**
   * Validate showdown can be executed
   * 
   * @param game - Game account
   * @returns Validation result
   */
  static validateShowdown(game: Game): ValidationResult {
    if (game.stage !== GameStage.Showdown) {
      return {
        valid: false,
        error: `Game must be in Showdown stage, currently in ${game.stage}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if showdown can be executed
   * 
   * @param gamePDA - Game PDA
   * @returns True if showdown can be executed
   */
  static async canExecuteShowdown(gamePDA: PublicKey): Promise<boolean> {
    try {
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) return false;

      const validation = this.validateShowdown(game);
      return validation.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate payout for player
   * 
   * @param potSize - Total pot size
   * @param winnerCount - Number of winners
   * @returns Payout amount per winner
   */
  static calculatePayout(potSize: BN, winnerCount: number): BN {
    if (winnerCount === 0) return new BN(0);
    return potSize.div(new BN(winnerCount));
  }

  /**
   * Calculate side pot distribution
   * Note: Simplified version, full implementation would handle complex side pots
   * 
   * @param mainPot - Main pot amount
   * @param sidePots - Array of side pot amounts
   * @returns Total payout
   */
  static calculateSidePots(mainPot: BN, sidePots: BN[]): BN {
    return sidePots.reduce((total, pot) => total.add(pot), mainPot);
  }
}
