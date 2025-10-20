/**
 * Arcium Poker - Game Initialization
 * 
 * Handles game creation and initialization.
 * Maps to: initialize_game instruction (IDL lines 133-218)
 */

import { PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { ProgramClient } from '../connection/program';
import { RPCClient } from '../connection/rpc';
import {
  InitGameParams,
  TxResult,
  ValidationResult,
  Game,
} from '../shared/types';
import {
  DEFAULT_SMALL_BLIND,
  DEFAULT_BIG_BLIND,
  DEFAULT_MIN_BUY_IN,
  DEFAULT_MAX_BUY_IN,
  DEFAULT_MAX_PLAYERS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MIN_BUY_IN_BB_MULTIPLIER,
} from '../shared/constants';
import { ensureBN } from '../shared/utils';
import { ErrorCode, PokerError } from '../shared/errors';

/**
 * Result of game initialization
 */
export interface InitGameResult extends TxResult {
  gamePDA?: PublicKey;
  gameId?: BN;
  game?: Game;
}

/**
 * Game Initializer
 * Creates new poker games on-chain
 */
export class GameInitializer {
  /**
   * Initialize a new game
   * 
   * @param params - Game initialization parameters
   * @param provider - Anchor provider with wallet
   * @returns Initialization result with transaction signature and game PDA
   */
  static async initializeGame(
    params: InitGameParams,
    provider: AnchorProvider
  ): Promise<InitGameResult> {
    try {
      // Validate parameters
      const validation = this.validateGameParams(params);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidGameConfig, validation.error);
      }

      // Get program instance
      const program = ProgramClient.getProgram();
      console.log('✅ Program instance obtained:', program.programId.toBase58());

      console.log('🔵 Step 2: Deriving game PDA...');
      // Derive game PDA
      const [gamePDA, bump] = ProgramClient.deriveGamePDA(provider.wallet.publicKey, ensureBN(params.gameId));
      console.log('✅ Game PDA derived:', gamePDA.toBase58());

      console.log('🔵 Step 3: Preparing transaction...');
      console.log('Game parameters:', {
        gameId: params.gameId.toString(),
        gamePDA: gamePDA.toBase58(),
        authority: provider.wallet.publicKey.toBase58(),
        smallBlind: params.smallBlind?.toString() || 'null',
        bigBlind: params.bigBlind?.toString() || 'null',
        minBuyIn: params.minBuyIn?.toString() || 'null',
        maxBuyIn: params.maxBuyIn?.toString() || 'null',
        maxPlayers: params.maxPlayers,
      });

      console.log('🔵 Step 4: Building transaction...');
      // Call initialize_game instruction
      const txBuilder = program.methods
        .initializeGame(
          ensureBN(params.gameId),
          params.smallBlind ? ensureBN(params.smallBlind) : null,
          params.bigBlind ? ensureBN(params.bigBlind) : null,
          params.minBuyIn ? ensureBN(params.minBuyIn) : null,
          params.maxBuyIn ? ensureBN(params.maxBuyIn) : null,
          params.maxPlayers ?? null
        )
        .accounts({
          game: gamePDA,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        });
      
      console.log('✅ Transaction builder created');
      
      console.log('🔵 Step 5: Sending transaction to RPC...');
      const tx = await txBuilder.rpc();

      console.log('🔵 Step 6: Confirming transaction...');
      // Confirm transaction
      await RPCClient.confirmTransaction(tx);
      console.log('✅ Transaction confirmed');

      console.log('🔵 Step 7: Fetching created game account...');
      // Fetch created game account
      const game = await ProgramClient.fetchGame(gamePDA);
      console.log('✅ Game account fetched');

      return {
        signature: tx,
        success: true,
        gamePDA,
        gameId: ensureBN(params.gameId),
        game,
      };
    } catch (error: any) {
      console.error('Error initializing game:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidGameConfig,
          error.message || 'Failed to initialize game',
          error
        ),
      };
    }
  }

  /**
   * Validate game parameters
   * 
   * @param params - Game initialization parameters
   * @returns Validation result
   */
  static validateGameParams(params: InitGameParams): ValidationResult {
    // Validate game ID
    if (!params.gameId) {
      return {
        valid: false,
        error: 'Game ID is required',
      };
    }

    const gameIdBN = ensureBN(params.gameId);
    if (gameIdBN.lte(new BN(0))) {
      return {
        valid: false,
        error: 'Game ID must be greater than 0',
      };
    }

    // Get values with defaults
    const smallBlind = params.smallBlind !== undefined ? ensureBN(params.smallBlind) : new BN(DEFAULT_SMALL_BLIND);
    const bigBlind = params.bigBlind !== undefined ? ensureBN(params.bigBlind) : new BN(DEFAULT_BIG_BLIND);
    const minBuyIn = params.minBuyIn !== undefined ? ensureBN(params.minBuyIn) : new BN(DEFAULT_MIN_BUY_IN);
    const maxBuyIn = params.maxBuyIn !== undefined ? ensureBN(params.maxBuyIn) : new BN(DEFAULT_MAX_BUY_IN);
    const maxPlayers = params.maxPlayers ?? DEFAULT_MAX_PLAYERS;

    // Validate blinds (including explicit zero)
    if (smallBlind.lte(new BN(0))) {
      return {
        valid: false,
        error: 'Small blind must be greater than 0',
      };
    }

    if (bigBlind.lte(smallBlind)) {
      return {
        valid: false,
        error: 'Big blind must be greater than small blind',
      };
    }

    // Typically big blind should be 2x small blind
    if (!bigBlind.eq(smallBlind.mul(new BN(2)))) {
      console.warn('Big blind is not 2x small blind (recommended)');
    }

    // Validate buy-in amounts
    if (minBuyIn.lte(new BN(0))) {
      return {
        valid: false,
        error: 'Minimum buy-in must be greater than 0',
      };
    }

    if (maxBuyIn.lte(minBuyIn)) {
      return {
        valid: false,
        error: 'Maximum buy-in must be greater than minimum buy-in',
      };
    }

    // Minimum buy-in should be at least 50 big blinds
    const minRequiredBuyIn = bigBlind.mul(new BN(MIN_BUY_IN_BB_MULTIPLIER));
    if (minBuyIn.lt(minRequiredBuyIn)) {
      return {
        valid: false,
        error: `Minimum buy-in must be at least ${MIN_BUY_IN_BB_MULTIPLIER} big blinds (${minRequiredBuyIn.toString()} chips)`,
      };
    }

    // Validate max players
    if (maxPlayers < MIN_PLAYERS || maxPlayers > MAX_PLAYERS) {
      return {
        valid: false,
        error: `Max players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get default game parameters
   * 
   * @returns Default game parameters
   */
  static getDefaultParams(): Omit<InitGameParams, 'gameId'> {
    return {
      smallBlind: DEFAULT_SMALL_BLIND,
      bigBlind: DEFAULT_BIG_BLIND,
      minBuyIn: DEFAULT_MIN_BUY_IN,
      maxBuyIn: DEFAULT_MAX_BUY_IN,
      maxPlayers: DEFAULT_MAX_PLAYERS,
    };
  }

  /**
   * Generate a unique game ID based on timestamp
   * 
   * @returns Unique game ID
   */
  static generateGameId(): number {
    return Date.now();
  }

  /**
   * Check if game exists
   * 
   * @param authority - Game authority
   * @param gameId - Game ID
   * @returns True if game exists
   */
  static async gameExists(
    authority: PublicKey,
    gameId: BN | number
  ): Promise<boolean> {
    try {
      const gameIdBN = ensureBN(gameId);
      const [gamePDA] = ProgramClient.deriveGamePDA(authority, gameIdBN);
      const account = await ProgramClient.getAccount(gamePDA);
      return account !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch game by authority and game ID
   * 
   * @param authority - Game authority
   * @param gameId - Game ID
   * @returns Game account or null
   */
  static async fetchGame(
    authority: PublicKey,
    gameId: BN | number
  ): Promise<Game | null> {
    try {
      const gameIdBN = ensureBN(gameId);
      const [gamePDA] = ProgramClient.deriveGamePDA(authority, gameIdBN);
      return await ProgramClient.fetchGame(gamePDA);
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }
}
