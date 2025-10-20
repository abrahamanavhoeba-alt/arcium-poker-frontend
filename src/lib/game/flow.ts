/**
 * Arcium Poker - Game Flow
 * 
 * Handles game stage transitions and flow control.
 * Maps to: advance_stage instruction (IDL lines 11-38)
 */

import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
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
 * Result of advancing stage
 */
export interface AdvanceStageResult extends TxResult {
  game?: Game;
  previousStage?: GameStage;
  newStage?: GameStage;
}

/**
 * Game Flow
 * Manages game stage transitions
 */
export class GameFlow {
  /**
   * Advance game to next stage
   * 
   * @param gamePDA - Game account public key
   * @param provider - Anchor provider with wallet
   * @returns Advance result with transaction signature
   */
  static async advanceStage(
    gamePDA: PublicKey,
    provider: AnchorProvider
  ): Promise<AdvanceStageResult> {
    try {
      // Get program instance
      const program = ProgramClient.getProgram();
      const signer = provider.wallet.publicKey;

      // Fetch game to validate
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) {
        throw new PokerError(ErrorCode.InvalidGameStage, 'Game not found');
      }

      const previousStage = game.stage;

      // Validate can advance
      const validation = this.validateAdvance(game);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidGameStage, validation.error);
      }

      // Build and send transaction
      const tx = await program.methods
        .advanceStage()
        .accounts({
          game: gamePDA,
          signer: signer,
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
        previousStage,
        newStage: updatedGame?.stage,
      };
    } catch (error: any) {
      console.error('Error advancing stage:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidGameStage,
          error.message || 'Failed to advance stage',
          error
        ),
      };
    }
  }

  /**
   * Validate game can advance to next stage
   * 
   * @param game - Game account
   * @returns Validation result
   */
  static validateAdvance(game: Game): ValidationResult {
    // Check if game is in a valid stage to advance
    if (game.stage === GameStage.Waiting) {
      return {
        valid: false,
        error: 'Game has not started yet',
      };
    }

    if (game.stage === GameStage.Finished) {
      return {
        valid: false,
        error: 'Game has already finished',
      };
    }

    // Game can advance from PreFlop, Flop, Turn, River, or Showdown
    return { valid: true };
  }

  /**
   * Get next stage
   * 
   * @param currentStage - Current game stage
   * @returns Next stage
   */
  static getNextStage(currentStage: GameStage): GameStage | null {
    switch (currentStage) {
      case GameStage.Waiting:
        return GameStage.PreFlop;
      case GameStage.PreFlop:
        return GameStage.Flop;
      case GameStage.Flop:
        return GameStage.Turn;
      case GameStage.Turn:
        return GameStage.River;
      case GameStage.River:
        return GameStage.Showdown;
      case GameStage.Showdown:
        return GameStage.Finished;
      case GameStage.Finished:
        return null; // No next stage
      default:
        return null;
    }
  }

  /**
   * Check if game can advance
   * 
   * @param gamePDA - Game PDA
   * @returns True if game can advance
   */
  static async canAdvance(gamePDA: PublicKey): Promise<boolean> {
    try {
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) return false;

      const validation = this.validateAdvance(game);
      return validation.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stage name
   * 
   * @param stage - Game stage
   * @returns Stage name
   */
  static getStageName(stage: GameStage): string {
    return stage;
  }

  /**
   * Get stage description
   * 
   * @param stage - Game stage
   * @returns Stage description
   */
  static getStageDescription(stage: GameStage): string {
    switch (stage) {
      case GameStage.Waiting:
        return 'Waiting for players to join';
      case GameStage.PreFlop:
        return 'Pre-flop betting round';
      case GameStage.Flop:
        return 'Flop - 3 community cards revealed';
      case GameStage.Turn:
        return 'Turn - 4th community card revealed';
      case GameStage.River:
        return 'River - 5th community card revealed';
      case GameStage.Showdown:
        return 'Showdown - revealing hands';
      case GameStage.Finished:
        return 'Game finished';
      default:
        return 'Unknown stage';
    }
  }

  /**
   * Get number of community cards for stage
   * 
   * @param stage - Game stage
   * @returns Number of community cards
   */
  static getCommunityCardCount(stage: GameStage): number {
    switch (stage) {
      case GameStage.Waiting:
      case GameStage.PreFlop:
        return 0;
      case GameStage.Flop:
        return 3;
      case GameStage.Turn:
        return 4;
      case GameStage.River:
      case GameStage.Showdown:
      case GameStage.Finished:
        return 5;
      default:
        return 0;
    }
  }

  /**
   * Check if stage is active (betting allowed)
   * 
   * @param stage - Game stage
   * @returns True if stage is active
   */
  static isActiveStage(stage: GameStage): boolean {
    return [
      GameStage.PreFlop,
      GameStage.Flop,
      GameStage.Turn,
      GameStage.River,
    ].includes(stage);
  }

  /**
   * Check if game is in progress
   * 
   * @param game - Game account
   * @returns True if game is in progress
   */
  static isGameInProgress(game: Game): boolean {
    return game.stage !== GameStage.Waiting && game.stage !== GameStage.Finished;
  }

  /**
   * Get stage progression percentage
   * 
   * @param stage - Game stage
   * @returns Percentage (0-100)
   */
  static getStageProgress(stage: GameStage): number {
    switch (stage) {
      case GameStage.Waiting:
        return 0;
      case GameStage.PreFlop:
        return 20;
      case GameStage.Flop:
        return 40;
      case GameStage.Turn:
        return 60;
      case GameStage.River:
        return 80;
      case GameStage.Showdown:
        return 90;
      case GameStage.Finished:
        return 100;
      default:
        return 0;
    }
  }
}
