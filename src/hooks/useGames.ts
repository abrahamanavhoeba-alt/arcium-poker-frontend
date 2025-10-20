'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { GameStateManager } from '@/lib/game/state';
import { PROGRAM_ID } from '@/lib/shared/constants';
import idl from '@/arcium_poker.json';

export interface GameInfo {
  publicKey: PublicKey;
  authority: PublicKey;
  gameId: string;
  stage: string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
  playerCount: number;
  pot: number;
  startedAt: number;
}

export function useGames() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, [connection, wallet.publicKey]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize program client if wallet is connected
      if (wallet.publicKey && wallet.signTransaction) {
        const { AnchorProvider } = await import('@coral-xyz/anchor');
        const { ProgramClient } = await import('@/lib/connection/program');
        
        const anchorWallet = {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions!,
        };
        
        const provider = new AnchorProvider(
          connection,
          anchorWallet as any,
          { commitment: 'confirmed' }
        );
        
        ProgramClient.initialize(provider);
      }

      // Get all game accounts
      const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          {
            dataSize: 1000, // Approximate size of Game account
          },
        ],
      });

      console.log(`Found ${accounts.length} game accounts`);

      const gameInfos: GameInfo[] = [];

      for (const account of accounts) {
        try {
          // Decode account data
          const gameData = account.account.data;
          
          // Parse game data (simplified - you'll need proper deserialization)
          const gameInfo: GameInfo = {
            publicKey: account.pubkey,
            authority: account.account.owner,
            gameId: account.pubkey.toBase58().slice(0, 8),
            stage: 'Waiting', // Parse from data
            smallBlind: 0.01, // Parse from data
            bigBlind: 0.02, // Parse from data
            minBuyIn: 1, // Parse from data
            maxBuyIn: 100, // Parse from data
            maxPlayers: 6, // Parse from data
            playerCount: 0, // Parse from data
            pot: 0, // Parse from data
            startedAt: Date.now(),
          };

          gameInfos.push(gameInfo);
        } catch (err) {
          console.error('Error parsing game account:', err);
        }
      }

      setGames(gameInfos);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchGames();
  };

  return {
    games,
    loading,
    error,
    refetch,
  };
}
