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

      // Create a minimal provider for read-only access
      const provider = new AnchorProvider(
        connection,
        {} as any,
        { commitment: 'confirmed' }
      );

      // Create program instance
      const program = new Program(idl as any, provider);

      // Fetch all game accounts using Anchor's built-in method
      const gameAccounts = await program.account.game.all();
      
      console.log(`Found ${gameAccounts.length} game accounts`);

      const gameInfos: GameInfo[] = gameAccounts.map((gameAccount: any) => {
        const game = gameAccount.account;
        
        return {
          publicKey: gameAccount.publicKey,
          authority: game.authority,
          gameId: game.gameId?.toString() || '0',
          stage: game.stage ? JSON.stringify(game.stage) : 'Waiting',
          smallBlind: game.smallBlind?.toNumber() / 1e9 || 0,
          bigBlind: game.bigBlind?.toNumber() / 1e9 || 0,
          minBuyIn: game.minBuyIn?.toNumber() / 1e9 || 0,
          maxBuyIn: game.maxBuyIn?.toNumber() / 1e9 || 0,
          maxPlayers: game.maxPlayers || 6,
          playerCount: game.playerCount || 0,
          pot: game.pot?.toNumber() / 1e9 || 0,
          startedAt: game.startedAt?.toNumber() || Date.now() / 1000,
        };
      });

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
