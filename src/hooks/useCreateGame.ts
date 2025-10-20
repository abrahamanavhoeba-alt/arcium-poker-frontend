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

      console.log('Creating game with params:', params);

      // Generate random game ID
      const gameId = new BN(Math.floor(Math.random() * 1000000));

      // Convert to lamports (SOL to lamports)
      const smallBlindLamports = new BN(params.smallBlind * 1_000_000_000);
      const bigBlindLamports = new BN(params.bigBlind * 1_000_000_000);
      const minBuyInLamports = new BN(params.minBuyIn * 1_000_000_000);
      const maxBuyInLamports = new BN(params.maxBuyIn * 1_000_000_000);

      // Create provider
      const provider = {
        connection,
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      };

      // Initialize game
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

      console.log('Game created successfully:', result);

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
