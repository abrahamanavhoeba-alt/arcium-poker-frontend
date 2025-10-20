/**
 * Arcium Poker - Player Join
 * 
 * Handles player joining a game.
 * Maps to: join_game instruction (IDL lines 221-283)
 */

import { PublicKey, SystemProgram } from '@solana/web3.js';
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
import { ensureBN, validateBuyIn } from '../shared/utils';
import { ErrorCode, PokerError } from '../shared/errors';

/**
 * Result of joining a game
 */
export interface JoinGameResult extends TxResult {
  playerStatePDA?: PublicKey;
  playerState?: PlayerState;
}

/**
 * Player Join
 * Handles players joining games
 */
export class PlayerJoin {
  /**
   * Join a game
   * 
   * @param gamePDA - Game account public key
   * @param buyIn - Buy-in amount in chips
   * @param provider - Anchor provider with wallet
   * @returns Join result with transaction signature and player state PDA
   */
  static async joinGame(
    gamePDA: PublicKey,
    buyIn: number | BN,
    provider: AnchorProvider
  ): Promise<JoinGameResult> {
    try {
      // Get program instance
      const program = ProgramClient.getProgram();
      const player = provider.wallet.publicKey;

      // Fetch game to validate
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) {
        throw new PokerError(ErrorCode.PlayerNotInGame, 'Game not found');
      }

      // Validate join
      const validation = this.validateJoin(game, buyIn, player);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidAction, validation.error);
      }

      // Convert buy-in to BN
      const buyInBN = ensureBN(buyIn);

      // Derive player state PDA
      const [playerStatePDA, bump] = ProgramClient.derivePlayerStatePDA(gamePDA, player);

      // Build and send transaction
      const tx = await program.methods
        .joinGame(buyInBN)
        .accounts({
          game: gamePDA,
          playerState: playerStatePDA,
          player: player,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Confirm transaction
      await RPCClient.confirmTransaction(tx);

      // Fetch created player state
      const playerState = await ProgramClient.fetchPlayerState(playerStatePDA);

      return {
        signature: tx,
        success: true,
        playerStatePDA,
        playerState,
      };
    } catch (error: any) {
      console.error('Error joining game:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidAction,
          error.message || 'Failed to join game',
          error
        ),
      };
    }
  }

  /**
   * Validate player can join game
   * 
   * @param game - Game account
   * @param buyIn - Buy-in amount
   * @param player - Player public key
   * @returns Validation result
   */
  static validateJoin(
    game: Game,
    buyIn: number | BN,
    player: PublicKey
  ): ValidationResult {
    // Check if game is full
    if (this.isGameFull(game)) {
      return {
        valid: false,
        error: 'Game is full',
      };
    }

    // Check if game has already started
    if (game.stage !== GameStage.Waiting) {
      return {
        valid: false,
        error: 'Game has already started',
      };
    }

    // Check if player is already in game
    if (this.isPlayerInGame(game, player)) {
      return {
        valid: false,
        error: 'Player already in game',
      };
    }

    // Validate buy-in amount
    const buyInBN = ensureBN(buyIn);
    const buyInValidation = validateBuyIn(buyInBN, game.minBuyIn, game.maxBuyIn);
    if (!buyInValidation.valid) {
      return buyInValidation;
    }

    return { valid: true };
  }

  /**
   * Check if game is full
   * 
   * @param game - Game account
   * @returns True if game is full
   */
  static isGameFull(game: Game): boolean {
    return game.playerCount >= game.maxPlayers;
  }

  /**
   * Check if player is already in game
   * 
   * @param game - Game account
   * @param player - Player public key
   * @returns True if player is in game
   */
  static isPlayerInGame(game: Game, player: PublicKey): boolean {
    for (let i = 0; i < game.playerCount; i++) {
      if (game.players[i].equals(player)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get available seats in game
   * 
   * @param game - Game account
   * @returns Number of available seats
   */
  static getAvailableSeats(game: Game): number {
    return game.maxPlayers - game.playerCount;
  }

  /**
   * Check if player can join game
   * 
   * @param gamePDA - Game PDA
   * @param buyIn - Buy-in amount
   * @param player - Player public key
   * @returns True if player can join
   */
  static async canJoinGame(
    gamePDA: PublicKey,
    buyIn: number | BN,
    player: PublicKey
  ): Promise<boolean> {
    try {
      const game = await ProgramClient.fetchGame(gamePDA);
      if (!game) return false;

      const validation = this.validateJoin(game, buyIn, player);
      return validation.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get player's seat index in game
   * 
   * @param game - Game account
   * @param player - Player public key
   * @returns Seat index or -1 if not in game
   */
  static getPlayerSeatIndex(game: Game, player: PublicKey): number {
    for (let i = 0; i < game.playerCount; i++) {
      if (game.players[i].equals(player)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Fetch player state
   * 
   * @param gamePDA - Game PDA
   * @param player - Player public key
   * @returns Player state or null
   */
  static async fetchPlayerState(
    gamePDA: PublicKey,
    player: PublicKey
  ): Promise<PlayerState | null> {
    try {
      const [playerStatePDA] = ProgramClient.derivePlayerStatePDA(gamePDA, player);
      return await ProgramClient.fetchPlayerState(playerStatePDA);
    } catch (error) {
      console.error('Error fetching player state:', error);
      return null;
    }
  }
}
