'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import idl from '@/arcium_poker.json';
import { ProgramClient } from '@/lib/connection/program';

export function useJoinGame() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGame = async (gamePDA: PublicKey, buyInAmount: number) => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      console.log('🎮 ========== JOIN GAME START ==========');
      console.log('📝 Game PDA:', gamePDA.toBase58());
      console.log('👛 Wallet:', wallet.publicKey.toBase58());
      console.log('💰 Buy-in amount:', buyInAmount, 'SOL');

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // Create program instance
      const program = new Program(idl as any, provider);

      // Derive PlayerState PDA
      const [playerStatePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('player'),
          gamePDA.toBuffer(),
          wallet.publicKey.toBuffer(),
        ],
        program.programId
      );

      console.log('✅ PlayerState PDA:', playerStatePDA.toBase58());

      // Build instruction
      console.log('🔨 Building join game instruction...');
      const buyInLamports = new BN(buyInAmount * 1e9);

      const instruction = await program.methods
        .joinGame(buyInLamports)
        .accounts({
          game: gamePDA,
          playerState: playerStatePDA,
          player: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      console.log('✅ Instruction built');

      // Create and sign transaction
      console.log('📝 Creating transaction...');
      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
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
      console.log('🎉 Successfully joined game!');

      return {
        success: true,
        signature,
        playerStatePDA: playerStatePDA.toBase58(),
      };
    } catch (err: any) {
      console.error('❌ Error joining game:', err);
      const errorMessage = err.message || 'Failed to join game';
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
    joinGame,
    loading,
    error,
  };
}
