/**
 * Arcium Poker - Game Start
 * 
 * Handles starting a game and triggering deck shuffle.
 * Maps to: start_game instruction (IDL lines 822-861)
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
import { generateEntropy } from '../shared/utils';
import { ErrorCode, PokerError } from '../shared/errors';
import { MIN_PLAYERS } from '../shared/constants';

/**
 * Result of starting a game
 */
export interface StartGameResult extends TxResult {
  game?: Game;
}

/**
 * Game Starter
 * Handles starting games and triggering deck shuffle
 */
export class GameStarter {
  /**
   * Start a game
   * 
   * @param gamePDA - Game account public key
   * @param provider - Anchor provider with wallet
   * @param playerEntropy - Optional array of entropy from each player (for MPC shuffle)
   * @returns Start result with transaction signature
   */
  static async startGame(
    gamePDA: PublicKey,
    provider: AnchorProvider,
    playerEntropy?: Uint8Array[]
  ): Promise<StartGameResult> {
    try {
      // Get program instance
      const program = ProgramClient.getProgram();
      const authority = provider.wallet.publicKey;

      // Fetch game to validate
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) {
        throw new PokerError(ErrorCode.InvalidGameStage, 'Game not found');
      }

      // Validate can start
      const validation = this.validateStart(game, authority);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidGameStage, validation.error);
      }

      // Generate entropy for each player if not provided
      const entropy = playerEntropy || this.generatePlayerEntropy(game.playerCount);

      // Build and send transaction
      const tx = await program.methods
        .startGame(entropy)
        .accounts({
          game: gamePDA,
          authority: authority,
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
      console.error('Error starting game:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidGameStage,
          error.message || 'Failed to start game',
          error
        ),
      };
    }
  }

  /**
   * Validate game can be started
   * 
   * @param game - Game account
   * @param authority - Authority public key
   * @returns Validation result
   */
  static validateStart(
    game: Game,
    authority: PublicKey
  ): ValidationResult {
    // Check if caller is game authority
    if (!game.authority.equals(authority)) {
      return {
        valid: false,
        error: 'Only game authority can start the game',
      };
    }

    // Check if game is in Waiting stage
    if (game.stage !== GameStage.Waiting) {
      return {
        valid: false,
        error: `Game cannot be started from ${game.stage} stage`,
      };
    }

    // Check if enough players have joined
    if (!this.hasEnoughPlayers(game)) {
      return {
        valid: false,
        error: `Need at least ${MIN_PLAYERS} players to start (current: ${game.playerCount})`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if game has enough players to start
   * 
   * @param game - Game account
   * @returns True if enough players
   */
  static hasEnoughPlayers(game: Game): boolean {
    return game.playerCount >= MIN_PLAYERS;
  }

  /**
   * Check if game can be started
   * 
   * @param gamePDA - Game PDA
   * @param authority - Authority public key
   * @returns True if game can be started
   */
  static async canStartGame(
    gamePDA: PublicKey,
    authority: PublicKey
  ): Promise<boolean> {
    try {
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) return false;

      const validation = this.validateStart(game, authority);
      return validation.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate entropy for each player
   * Used for MPC shuffle randomness
   * 
   * @param playerCount - Number of players
   * @returns Array of entropy (32 bytes each)
   */
  static generatePlayerEntropy(playerCount: number): Uint8Array[] {
    const entropy: Uint8Array[] = [];
    for (let i = 0; i < playerCount; i++) {
      entropy.push(generateEntropy());
    }
    return entropy;
  }

  /**
   * Generate single entropy value
   * 
   * @returns 32 bytes of random entropy
   */
  static generateSingleEntropy(): Uint8Array {
    return generateEntropy();
  }

  /**
   * Validate entropy array
   * 
   * @param entropy - Array of entropy values
   * @param expectedCount - Expected number of entropy values
   * @returns Validation result
   */
  static validateEntropy(
    entropy: Uint8Array[],
    expectedCount: number
  ): ValidationResult {
    if (entropy.length !== expectedCount) {
      return {
        valid: false,
        error: `Expected ${expectedCount} entropy values, got ${entropy.length}`,
      };
    }

    for (let i = 0; i < entropy.length; i++) {
      if (entropy[i].length !== 32) {
        return {
          valid: false,
          error: `Entropy at index ${i} must be 32 bytes, got ${entropy[i].length}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check if game has started
   * 
   * @param game - Game account
   * @returns True if game has started
   */
  static hasGameStarted(game: Game): boolean {
    return game.stage !== GameStage.Waiting;
  }

  /**
   * Get game stage name
   * 
   * @param game - Game account
   * @returns Stage name
   */
  static getGameStage(game: Game): string {
    return game.stage;
  }
}
