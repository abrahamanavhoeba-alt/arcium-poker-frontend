/**
 * Arcium Poker - Player Leave
 * 
 * Handles player leaving a game.
 * Maps to: leave_game instruction (IDL lines 285-343)
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
  PlayerState,
  GameStage,
} from '../shared/types';
import { ErrorCode, PokerError } from '../shared/errors';

/**
 * Result of leaving a game
 */
export interface LeaveGameResult extends TxResult {
  refundAmount?: BN;
}

/**
 * Player Leave
 * Handles players leaving games
 */
export class PlayerLeave {
  /**
   * Leave a game
   * 
   * @param gamePDA - Game account public key
   * @param provider - Anchor provider with wallet
   * @returns Leave result with transaction signature
   */
  static async leaveGame(
    gamePDA: PublicKey,
    provider: AnchorProvider
  ): Promise<LeaveGameResult> {
    try {
      // Get program instance
      const program = ProgramClient.getProgram();
      const player = provider.wallet.publicKey;

      // Derive player state PDA
      const [playerStatePDA] = ProgramClient.derivePlayerStatePDA(gamePDA, player);

      // Fetch game and player state to validate
      const [game, playerState] = await Promise.all([
        ProgramClient.fetchGame(gamePDA),
        ProgramClient.fetchPlayerState(playerStatePDA),
      ]);

      if (!game || !playerState) {
        throw new PokerError(ErrorCode.PlayerNotInGame, 'Game or player state not found');
      }

      // Validate leave
      const validation = this.validateLeave(game, playerState);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidAction, validation.error);
      }

      // Calculate refund amount
      const refundAmount = playerState.chipStack;

      // Build and send transaction
      const tx = await program.methods
        .leaveGame()
        .accounts({
          game: gamePDA,
          playerState: playerStatePDA,
          player: player,
        })
        .rpc();

      // Confirm transaction
      await RPCClient.confirmTransaction(tx);

      return {
        signature: tx,
        success: true,
        refundAmount,
      };
    } catch (error: any) {
      console.error('Error leaving game:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidAction,
          error.message || 'Failed to leave game',
          error
        ),
      };
    }
  }

  /**
   * Validate player can leave game
   * 
   * @param game - Game account
   * @param playerState - Player state
   * @returns Validation result
   */
  static validateLeave(
    game: Game,
    playerState: PlayerState
  ): ValidationResult {
    // Check if game has started
    if (game.stage !== GameStage.Waiting) {
      return {
        valid: false,
        error: 'Cannot leave game after it has started',
      };
    }

    // Check if player has already left
    if (playerState.chipStack.lte(new BN(0))) {
      return {
        valid: false,
        error: 'Player has no chips (already left)',
      };
    }

    return { valid: true };
  }

  /**
   * Check if player can leave game
   * 
   * @param gamePDA - Game PDA
   * @param player - Player public key
   * @returns True if player can leave
   */
  static async canLeaveGame(
    gamePDA: PublicKey,
    player: PublicKey
  ): Promise<boolean> {
    try {
      const [game, playerState] = await Promise.all([
        ProgramClient.fetchGame(gamePDA),
        ProgramClient.fetchPlayerState(
          ProgramClient.derivePlayerStatePDA(gamePDA, player)[0]
        ),
      ]);

      if (!game || !playerState) return false;

      const validation = this.validateLeave(game, playerState);
      return validation.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate refund amount for player
   * 
   * @param playerState - Player state
   * @returns Refund amount
   */
  static getRefundAmount(playerState: PlayerState): BN {
    return playerState.chipStack;
  }

  /**
   * Check if player has left game
   * 
   * @param playerState - Player state
   * @returns True if player has left
   */
  static hasPlayerLeft(playerState: PlayerState): boolean {
    return playerState.chipStack.lte(new BN(0));
  }
}
