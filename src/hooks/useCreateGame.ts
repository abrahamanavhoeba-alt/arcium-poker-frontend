'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { GameInitializer } from '@/lib/game/initialize';

export interface CreateGameParams {
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
}

export function useCreateGame() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (params: CreateGameParams) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎮 ========== CREATE GAME START ==========');
      console.log('📝 Input params:', params);
      console.log('👛 Wallet:', wallet.publicKey?.toBase58());
      console.log('🌐 Connection endpoint:', connection.rpcEndpoint);
      console.log('🔑 Wallet adapter:', wallet.wallet?.adapter?.name || 'Unknown');
      console.log('🔑 Wallet adapter constructor:', wallet.wallet?.adapter?.constructor?.name || 'Unknown');
      
      // Use the existing connection from the wallet context
      console.log('🔗 Using wallet context connection for consistency');

      // Generate random game ID
      const gameId = new BN(Math.floor(Math.random() * 1000000));
      console.log('🎲 Generated game ID:', gameId.toString());

      // Convert to lamports (SOL to lamports)
      const smallBlindLamports = new BN(params.smallBlind * 1_000_000_000);
      const bigBlindLamports = new BN(params.bigBlind * 1_000_000_000);
      const minBuyInLamports = new BN(params.minBuyIn * 1_000_000_000);
      const maxBuyInLamports = new BN(params.maxBuyIn * 1_000_000_000);
      
      console.log('💰 Converted to lamports:', {
        smallBlind: smallBlindLamports.toString(),
        bigBlind: bigBlindLamports.toString(),
        minBuyIn: minBuyInLamports.toString(),
        maxBuyIn: maxBuyInLamports.toString(),
      });

      // Check wallet balance
      console.log('💰 Checking wallet balance...');
      const balance = await connection.getBalance(wallet.publicKey);
      console.log('💰 Wallet balance:', (balance / 1_000_000_000).toFixed(4), 'SOL');
      
      if (balance < 10_000_000) { // Less than 0.01 SOL
        throw new Error(`Insufficient balance. You have ${(balance / 1_000_000_000).toFixed(4)} SOL. Please get some devnet SOL from https://faucet.solana.com`);
      }

      // Pre-warm the connection by getting a fresh blockhash
      console.log('🔥 Pre-warming connection...');
      const warmupBlockhash = await connection.getLatestBlockhash('confirmed');
      console.log('✅ Connection warmed up, blockhash:', warmupBlockhash.blockhash.slice(0, 8) + '...');

      // Create Anchor provider
      console.log('🔧 Creating Anchor provider...');
      const { AnchorProvider } = await import('@coral-xyz/anchor');
      
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction!,
        signAllTransactions: wallet.signAllTransactions!,
      };
      
      const provider = new AnchorProvider(
        connection,
        anchorWallet as any,
        { 
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          skipPreflight: false,  // Let Anchor handle preflight
        }
      );
      console.log('✅ Provider created with wallet connection');

      // Initialize program client first
      console.log('📦 Initializing program client...');
      const { ProgramClient } = await import('@/lib/connection/program');
      ProgramClient.initialize(provider);
      console.log('✅ Program client initialized');

      // Initialize game - Use standard Anchor method (simpler, lets wallet/Anchor handle blockhash)
      console.log('🚀 Using standard Anchor method (letting Anchor handle transaction details)...');
      const { GameInitializer } = await import('@/lib/game/initialize');
      const result = await GameInitializer.initializeGame(
        {
          gameId,
          smallBlind: smallBlindLamports,
          bigBlind: bigBlindLamports,
          minBuyIn: minBuyInLamports,
          maxBuyIn: maxBuyInLamports,
          maxPlayers: params.maxPlayers,
        },
        provider as any
      );

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create game');
      }

      console.log('✅ ========== CREATE GAME SUCCESS ==========');
      console.log('📊 Result:', result);
      console.log('🎯 Game PDA:', result.gamePDA?.toBase58());
      console.log('🔗 Explorer:', `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);

      return result;
    } catch (err: any) {
      console.error('Error creating game:', err);
      setError(err.message || 'Failed to create game');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createGame,
    loading,
    error,
  };
}
