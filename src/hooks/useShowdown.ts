'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import idl from '@/arcium_poker.json';

export function useShowdown() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeShowdown = async (gamePDA: PublicKey, playerStatePDAs: PublicKey[]) => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      console.log('🏆 ========== EXECUTE SHOWDOWN ==========');
      console.log('📝 Game PDA:', gamePDA.toBase58());
      console.log('📝 Player State PDAs:', playerStatePDAs.map(p => p.toBase58()));
      console.log('👛 Player:', wallet.publicKey.toBase58());

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // Create program instance
      const program = new Program(idl as any, provider);

      console.log('🔨 Building execute showdown instruction...');

      // Use first player state for the main account (required by IDL)
      const mainPlayerState = playerStatePDAs[0];

      // Build instruction with remaining accounts for all players
      const remainingAccounts = playerStatePDAs.map(pda => ({
        pubkey: pda,
        isWritable: true,
        isSigner: false,
      }));

      console.log('📝 Adding', remainingAccounts.length, 'player accounts as remaining accounts');

      // Build instruction
      const instruction = await program.methods
        .executeShowdown()
        .accounts({
          game: gamePDA,
          playerState: mainPlayerState,
          player: wallet.publicKey,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();

      console.log('✅ Instruction built');

      // Create and sign transaction
      console.log('📝 Creating transaction...');
      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = wallet.publicKey;

      console.log('🔐 Requesting wallet signature...');
      const signedTx = await wallet.signTransaction(transaction);

      console.log('📤 Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
      });

      console.log('✅ Transaction sent:', signature);

      // Confirm transaction
      console.log('⏳ Confirming transaction...');
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      console.log('✅ Transaction confirmed!');
      console.log('🎉 Showdown executed successfully!');

      return {
        success: true,
        signature,
      };
    } catch (err: any) {
      console.error('❌ Error executing showdown:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error logs:', err.logs);
      const errorMessage = err.message || 'Failed to execute showdown';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    executeShowdown,
    loading,
    error,
  };
}
