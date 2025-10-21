'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import idl from '@/arcium_poker.json';

export function useAdvanceStage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advanceStage = async (gamePDA: PublicKey) => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      console.log('🎲 ========== ADVANCE STAGE ==========');
      console.log('📝 Game PDA:', gamePDA.toBase58());
      console.log('👛 Signer:', wallet.publicKey.toBase58());

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // Create program instance
      const program = new Program(idl as any, provider);

      console.log('🔨 Building advance stage instruction...');

      // Build instruction
      const instruction = await program.methods
        .advanceStage()
        .accounts({
          game: gamePDA,
          signer: wallet.publicKey,
        })
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
      console.log('🎉 Stage advanced successfully!');

      return {
        success: true,
        signature,
      };
    } catch (err: any) {
      console.error('❌ Error advancing stage:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error logs:', err.logs);
      const errorMessage = err.message || 'Failed to advance stage';
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
    advanceStage,
    loading,
    error,
  };
}
