/**
 * Arcium Poker - Manual Transaction Game Initialization
 * 
 * Alternative implementation that manually constructs transactions
 * with fresh blockhashes to avoid devnet blockhash expiration issues.
 */

import { 
  PublicKey, 
  SystemProgram, 
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { ProgramClient } from '../connection/program';
import {
  InitGameParams,
  TxResult,
  Game,
} from '../shared/types';
import { ensureBN } from '../shared/utils';
import { ErrorCode, PokerError } from '../shared/errors';
import { InitGameResult, GameInitializer } from './initialize';

/**
 * Manual Transaction Game Initializer
 * Uses manual transaction construction with fresh blockhashes
 */
export class ManualTxGameInitializer {
  /**
   * Initialize a new game with manual transaction construction
   * This avoids blockhash expiration issues on devnet
   * 
   * @param params - Game initialization parameters
   * @param provider - Anchor provider with wallet
   * @returns Initialization result
   */
  static async initializeGame(
    params: InitGameParams,
    provider: AnchorProvider
  ): Promise<InitGameResult> {
    try {
      console.log('🎮 Using MANUAL TRANSACTION mode for devnet...');
      
      // Validate parameters
      const validation = GameInitializer.validateGameParams(params);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidGameConfig, validation.error);
      }

      // Get program instance
      const program = ProgramClient.getProgram();
      console.log('✅ Program instance obtained:', program.programId.toBase58());

      // Derive game PDA
      const [gamePDA, bump] = ProgramClient.deriveGamePDA(
        provider.wallet.publicKey, 
        ensureBN(params.gameId)
      );
      console.log('✅ Game PDA derived:', gamePDA.toBase58());

      // Get FRESH blockhash right before building transaction
      // Use 'processed' for the absolute latest blockhash that wallets can validate
      console.log('🔥 Getting FRESH blockhash with PROCESSED commitment (latest possible)...');
      const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash('processed');
      console.log('✅ Fresh blockhash:', blockhash);
      console.log('✅ Valid until block:', lastValidBlockHeight);
      
      // Also verify blockhash is valid
      console.log('🔍 Verifying blockhash is valid...');
      const isValid = await provider.connection.isBlockhashValid(blockhash, { commitment: 'processed' });
      console.log('✅ Blockhash valid:', isValid.value);

      // Build instruction using Anchor
      console.log('🔨 Building instruction...');
      const instruction = await program.methods
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
        })
        .instruction();
      
      console.log('✅ Instruction created');

      // Create transaction manually with fresh blockhash
      console.log('📝 Creating transaction manually...');
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = provider.wallet.publicKey;
      transaction.add(instruction);
      
      console.log('✅ Transaction created with fresh blockhash');

      // Try using VersionedTransaction for better wallet compatibility
      console.log('✍️ Requesting wallet signature (using VersionedTransaction)...');
      console.log('📋 Transaction details:', {
        feePayer: provider.wallet.publicKey.toBase58(),
        recentBlockhash: blockhash,
        instructionCount: 1,
      });
      
      let signature: string;
      try {
        // Create versioned transaction (v0) - better for modern wallets
        const messageV0 = new TransactionMessage({
          payerKey: provider.wallet.publicKey,
          recentBlockhash: blockhash,
          instructions: [instruction],
        }).compileToV0Message();
        
        const versionedTx = new VersionedTransaction(messageV0);
        console.log('✅ VersionedTransaction created');
        
        // Sign the versioned transaction
        const signedVTx = await provider.wallet.signTransaction(versionedTx);
        console.log('✅ Transaction signed');

        // Send raw transaction
        console.log('📤 Sending raw transaction...');
        signature = await provider.connection.sendRawTransaction(
          signedVTx.serialize(),
          {
            skipPreflight: true,
            preflightCommitment: 'confirmed',
            maxRetries: 3,
          }
        );
        console.log('✅ Transaction sent:', signature);
      } catch (versionedError: any) {
        console.warn('⚠️ VersionedTransaction failed, trying legacy Transaction...');
        console.error('Versioned error:', versionedError.message);
        
        // Fallback to legacy Transaction
        try {
          const legacyTx = new Transaction();
          legacyTx.recentBlockhash = blockhash;
          legacyTx.lastValidBlockHeight = lastValidBlockHeight;
          legacyTx.feePayer = provider.wallet.publicKey;
          legacyTx.add(instruction);
          
          const signedLegacyTx = await provider.wallet.signTransaction(legacyTx);
          console.log('✅ Legacy transaction signed');
          
          signature = await provider.connection.sendRawTransaction(
            signedLegacyTx.serialize(),
            {
              skipPreflight: true,
              preflightCommitment: 'confirmed',
              maxRetries: 3,
            }
          );
          console.log('✅ Legacy transaction sent:', signature);
        } catch (legacyError: any) {
          console.error('❌ Both versioned and legacy transactions failed!');
          console.error('Legacy error:', legacyError.message);
          console.error('Error details:', JSON.stringify(legacyError, null, 2));
          throw legacyError;
        }
      }

      // Confirm with blockhash context
      console.log('⏳ Confirming transaction...');
      const confirmation = await provider.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      console.log('✅ Transaction confirmed!');

      // Wait for account to propagate
      console.log('⏳ Waiting 2s for account propagation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch created game account with retry
      console.log('🔍 Fetching game account...');
      let game: Game | null = null;
      let retries = 5;
      
      while (retries > 0) {
        try {
          game = await ProgramClient.fetchGame(gamePDA);
          if (game) {
            console.log('✅ Game account fetched successfully!');
            break;
          }
        } catch (e) {
          console.log(`⚠️ Retry fetching game account... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        retries--;
      }

      if (!game) {
        console.warn('⚠️ Could not fetch game account, but transaction succeeded');
      }

      return {
        signature,
        success: true,
        gamePDA,
        gameId: ensureBN(params.gameId),
        game: game || undefined,
      };
    } catch (error: any) {
      console.error('❌ Error in manual transaction initialization:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidGameConfig,
          error.message || 'Failed to initialize game with manual transaction',
          error
        ),
      };
    }
  }
}
