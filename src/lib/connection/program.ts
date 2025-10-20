/**
 * Arcium Poker - Program Client
 * 
 * Handles Anchor program initialization and PDA derivation.
 */

import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID } from '../shared/constants';
import { deriveGamePDA, derivePlayerStatePDA } from '../shared/utils';
import idl from '../../arcium_poker.json';

/**
 * Arcium Poker Program type
 * This will be properly typed once we generate types from IDL
 */
export type ArciumPokerProgram = Program<Idl>;

/**
 * Program client singleton
 */
let programInstance: ArciumPokerProgram | null = null;

/**
 * Program Client
 * Manages Anchor program instance and PDA derivations
 */
export class ProgramClient {
  /**
   * Initialize Anchor program
   * @param provider - Anchor provider with wallet and connection
   * @returns Initialized program instance
   */
  static initialize(provider: AnchorProvider): ArciumPokerProgram {
    if (!programInstance) {
      // Create program with IDL and provider
      // The program ID is taken from the IDL's address field
      programInstance = new Program(
        idl as any,
        provider
      );
    }
    return programInstance;
  }

  /**
   * Get program instance
   * @throws Error if program not initialized
   */
  static getProgram(): ArciumPokerProgram {
    if (!programInstance) {
      throw new Error('Program not initialized. Call ProgramClient.initialize() first.');
    }
    return programInstance;
  }

  /**
   * Check if program is initialized
   */
  static isInitialized(): boolean {
    return programInstance !== null;
  }

  /**
   * Reset program instance (useful for testing)
   */
  static reset(): void {
    programInstance = null;
  }

  /**
   * Get program ID
   */
  static getProgramId(): PublicKey {
    return PROGRAM_ID;
  }

  /**
   * Derive Game PDA
   * @param authority - Game creator's public key
   * @param gameId - Unique game ID
   * @returns [PDA, bump]
   */
  static deriveGamePDA(
    authority: PublicKey,
    gameId: BN | number
  ): [PublicKey, number] {
    const gameIdBN = typeof gameId === 'number' ? new BN(gameId) : gameId;
    return deriveGamePDA(authority, gameIdBN);
  }

  /**
   * Derive PlayerState PDA
   * @param game - Game account public key
   * @param player - Player's public key
   * @returns [PDA, bump]
   */
  static derivePlayerStatePDA(
    game: PublicKey,
    player: PublicKey
  ): [PublicKey, number] {
    return derivePlayerStatePDA(game, player);
  }

  /**
   * Get program account (Game or PlayerState)
   * @param address - Account address
   * @returns Account data or null if not found
   */
  static async getAccount(address: PublicKey): Promise<any | null> {
    const program = this.getProgram();
    try {
      const accountInfo = await program.provider.connection.getAccountInfo(address);
      if (!accountInfo) {
        return null;
      }
      return accountInfo;
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  }

  /**
   * Fetch Game account
   * @param gamePDA - Game PDA address
   * @returns Game account data
   */
  static async fetchGame(gamePDA: PublicKey): Promise<any> {
    const program = this.getProgram();
    return await program.account.game.fetch(gamePDA);
  }

  /**
   * Fetch PlayerState account
   * @param playerStatePDA - PlayerState PDA address
   * @returns PlayerState account data
   */
  static async fetchPlayerState(playerStatePDA: PublicKey): Promise<any> {
    const program = this.getProgram();
    return await program.account.playerState.fetch(playerStatePDA);
  }

  /**
   * Fetch all games for an authority
   * @param authority - Game creator's public key
   * @returns Array of game accounts
   */
  static async fetchGamesByAuthority(authority: PublicKey): Promise<any[]> {
    const program = this.getProgram();
    return await program.account.game.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: authority.toBase58(),
        },
      },
    ]);
  }

  /**
   * Fetch all player states for a game
   * @param game - Game account public key
   * @returns Array of player state accounts
   */
  static async fetchPlayerStatesByGame(game: PublicKey): Promise<any[]> {
    const program = this.getProgram();
    return await program.account.playerState.all([
      {
        memcmp: {
          offset: 8 + 32, // Discriminator + player pubkey
          bytes: game.toBase58(),
        },
      },
    ]);
  }

  /**
   * Subscribe to game account changes
   * @param gamePDA - Game PDA address
   * @param callback - Callback function when account changes
   * @returns Subscription ID
   */
  static subscribeToGame(
    gamePDA: PublicKey,
    callback: (account: any) => void
  ): number {
    const program = this.getProgram();
    return program.account.game.subscribe(gamePDA, 'confirmed').on('change', callback);
  }

  /**
   * Subscribe to player state account changes
   * @param playerStatePDA - PlayerState PDA address
   * @param callback - Callback function when account changes
   * @returns Subscription ID
   */
  static subscribeToPlayerState(
    playerStatePDA: PublicKey,
    callback: (account: any) => void
  ): number {
    const program = this.getProgram();
    return program.account.playerState.subscribe(playerStatePDA, 'confirmed').on('change', callback);
  }

  /**
   * Unsubscribe from account changes
   * @param subscriptionId - Subscription ID to cancel
   */
  static async unsubscribe(subscriptionId: number): Promise<void> {
    const program = this.getProgram();
    await program.account.game.unsubscribe(subscriptionId);
  }
}
