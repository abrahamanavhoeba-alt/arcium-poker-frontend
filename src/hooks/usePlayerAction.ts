'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import BN from 'bn.js';
import idl from '@/arcium_poker.json';

export type PlayerActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allIn';

export function usePlayerAction() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async (
    gamePDA: PublicKey,
    actionType: PlayerActionType,
    amount?: number
  ) => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      console.log('🎮 ========== PLAYER ACTION ==========');
      console.log('📝 Action Type:', actionType);
      console.log('📝 Game PDA:', gamePDA.toBase58());
      console.log('👛 Player:', wallet.publicKey.toBase58());
      if (amount) console.log('💰 Amount:', amount, 'SOL');

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

      // Build action parameter
      let actionParam: any;
      switch (actionType) {
        case 'fold':
          actionParam = { fold: {} };
          break;
        case 'check':
          actionParam = { check: {} };
          break;
        case 'call':
          actionParam = { call: {} };
          break;
        case 'bet':
          if (!amount) throw new Error('Bet amount required');
          actionParam = { bet: { amount: new BN(amount * 1e9) } };
          break;
        case 'raise':
          if (!amount) throw new Error('Raise amount required');
          actionParam = { raise: { amount: new BN(amount * 1e9) } };
          break;
        case 'allIn':
          actionParam = { allIn: {} };
          break;
        default:
          throw new Error('Unknown action type');
      }

      console.log('🔨 Building player action instruction...');

      // Build instruction
      const instruction = await program.methods
        .playerAction(actionParam)
        .accounts({
          game: gamePDA,
          playerState: playerStatePDA,
          player: wallet.publicKey,
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
      console.log('🎉 Action executed successfully!');

      return {
        success: true,
        signature,
      };
    } catch (err: any) {
      console.error('❌ Error executing action:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error logs:', err.logs);
      const errorMessage = err.message || 'Failed to execute action';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Convenience methods for each action
  const fold = async (gamePDA: PublicKey) => executeAction(gamePDA, 'fold');
  const check = async (gamePDA: PublicKey) => executeAction(gamePDA, 'check');
  const call = async (gamePDA: PublicKey) => executeAction(gamePDA, 'call');
  const bet = async (gamePDA: PublicKey, amount: number) => executeAction(gamePDA, 'bet', amount);
  const raise = async (gamePDA: PublicKey, amount: number) => executeAction(gamePDA, 'raise', amount);
  const allIn = async (gamePDA: PublicKey) => executeAction(gamePDA, 'allIn');

  return {
    executeAction,
    fold,
    check,
    call,
    bet,
    raise,
    allIn,
    loading,
    error,
  };
}
