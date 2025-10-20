'use client';

import { useParams, useRouter } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useJoinGame } from '@/hooks/useJoinGame';
import { useStartGame } from '@/hooks/useStartGame';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const wallet = useWallet();
  const gamePDA = params.gamePDA as string;
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyInAmount, setBuyInAmount] = useState<string>('');
  const { joinGame, loading: joining, error: joinError } = useJoinGame();
  const { startGame, loading: starting, error: startError } = useStartGame();

  useEffect(() => {
    async function fetchGame() {
      try {
        setLoading(true);
        console.log('🎮 Fetching game:', gamePDA);
        
        // Initialize program with read-only provider
        const { Connection } = await import('@solana/web3.js');
        const { AnchorProvider, Program } = await import('@coral-xyz/anchor');
        const idl = (await import('@/arcium_poker.json')).default;
        
        const connection = new Connection(
          process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com',
          'confirmed'
        );
        
        const provider = new AnchorProvider(
          connection,
          {} as any,
          { commitment: 'confirmed' }
        );
        
        const program = new Program(idl as any, provider);
        
        // Fetch the game account
        const gameAccount = await program.account.game.fetch(new PublicKey(gamePDA));
        console.log('✅ Game fetched:', gameAccount);
        
        // Fetch all player states for this game
        console.log('👥 Fetching players...');
        const allPlayerStates = await program.account.playerState.all();
        const gamePlayers = allPlayerStates.filter((p: any) => 
          p.account.game.toBase58() === gamePDA
        );
        console.log(`✅ Found ${gamePlayers.length} player(s)`);
        
        setGame(gameAccount);
        setPlayers(gamePlayers);
        setError(null);
      } catch (err: any) {
        console.error('❌ Error fetching game:', err);
        setError(err.message || 'Failed to load game');
      } finally {
        setLoading(false);
      }
    }

    if (gamePDA) {
      fetchGame();
    }
  }, [gamePDA]);

  const handleJoinGame = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(buyInAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid buy-in amount');
      return;
    }

    const minBuyIn = game?.minBuyIn?.toNumber() / 1e9 || 0;
    const maxBuyIn = game?.maxBuyIn?.toNumber() / 1e9 || 0;

    if (amount < minBuyIn || amount > maxBuyIn) {
      alert(`Buy-in must be between ${minBuyIn} and ${maxBuyIn} SOL`);
      return;
    }

    const result = await joinGame(new PublicKey(gamePDA), amount);
    
    if (result.success) {
      alert('Successfully joined the game! 🎉');
      // Refresh the game data to show updated player count
      window.location.reload();
    } else {
      alert(`Failed to join game: ${result.error}`);
    }
  };

  const handleStartGame = async () => {
    if (!wallet.publicKey) {
      alert('Please connect your wallet');
      return;
    }

    if (wallet.publicKey.toBase58() !== game?.authority?.toBase58()) {
      alert('Only the game creator can start the game');
      return;
    }

    if (players.length < 2) {
      alert('Need at least 2 players to start the game');
      return;
    }

    const result = await startGame(new PublicKey(gamePDA));
    
    if (result.success) {
      alert('Game started! 🎉 Let the poker begin!');
      window.location.reload();
    } else {
      alert(`Failed to start game: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-3xl font-bold mb-2">Game Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a
            href="/lobby"
            className="inline-block px-6 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition shadow-lg shadow-[#00ff88]/20"
          >
            Back to Lobby
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/lobby"
            className="text-[#00ff88] hover:text-[#00dd77] mb-4 inline-flex items-center gap-2 transition"
          >
            <span>←</span>
            <span>Back to Lobby</span>
          </a>
          <h1 className="text-4xl font-bold text-white mb-2">
            Table #{game?.gameId?.toString() || 'Unknown'}
          </h1>
          <p className="text-gray-500 text-xs font-mono break-all">
            {gamePDA}
          </p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Status Card */}
          <div className="bg-[#1a1b1f] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
            <h2 className="text-lg font-bold text-white mb-4">Game Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-[#00ff88] font-semibold">
                  {game?.status || 'Waiting'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Players:</span>
                <span className="text-white font-semibold">
                  {game?.playerCount || 0} / {game?.maxPlayers || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Authority:</span>
                <span className="text-white text-sm font-mono truncate max-w-[200px]">
                  {game?.authority?.toBase58() || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Blinds Card */}
          <div className="bg-[#1a1b1f] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
            <h2 className="text-lg font-bold text-white mb-4">Blinds & Buy-in</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Small Blind:</span>
                <span className="text-white font-semibold">
                  {(game?.smallBlind?.toNumber() || 0) / 1e9} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Big Blind:</span>
                <span className="text-white font-semibold">
                  {(game?.bigBlind?.toNumber() || 0) / 1e9} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min Buy-in:</span>
                <span className="text-white font-semibold">
                  {(game?.minBuyIn?.toNumber() || 0) / 1e9} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Buy-in:</span>
                <span className="text-white font-semibold">
                  {(game?.maxBuyIn?.toNumber() || 0) / 1e9} SOL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-[#1a1b1f] border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">
            Players ({players.length}/{game?.maxPlayers || 0})
          </h2>
          
          {players.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No players yet. Be the first to join!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((playerData: any, index: number) => {
                const player = playerData.account;
                const isCurrentUser = wallet.publicKey?.toBase58() === player.player.toBase58();
                
                return (
                  <div
                    key={playerData.publicKey.toBase58()}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUser
                        ? 'bg-[#00ff88]/10 border-[#00ff88]/30'
                        : 'bg-[#0a0b0d] border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isCurrentUser ? 'bg-[#00ff88] text-black' : 'bg-gray-700 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">
                            {player.player.toBase58().slice(0, 4)}...{player.player.toBase58().slice(-4)}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs bg-[#00ff88] text-black px-2 py-0.5 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">
                          Seat {player.seatIndex !== null ? player.seatIndex + 1 : 'TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        {(player.chipCount?.toNumber() || 0) / 1e9} SOL
                      </p>
                      <p className="text-gray-500 text-xs">Chips</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-[#1a1b1f] border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">
            {players.some((p: any) => p.account.player.toBase58() === wallet.publicKey?.toBase58()) 
              ? 'Game Actions' 
              : 'Join Game'}
          </h2>
          
          {!wallet.connected ? (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-4">Connect your wallet to join this game</p>
            </div>
          ) : players.some((p: any) => p.account.player.toBase58() === wallet.publicKey?.toBase58()) ? (
            <div className="text-center py-8">
              <div className="text-[#00ff88] text-5xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-white mb-2">You're In!</h3>
              <p className="text-gray-400 mb-6">
                Waiting for {game?.maxPlayers - players.length} more player(s) to join...
              </p>
              {wallet.publicKey?.toBase58() === game?.authority?.toBase58() && players.length >= 2 && (
                <div className="space-y-3">
                  {startError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm">{startError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleStartGame}
                    disabled={starting}
                    className={`px-6 py-3 font-bold rounded-lg transition shadow-lg shadow-[#00ff88]/20 ${
                      starting
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-[#00ff88] text-black hover:bg-[#00dd77]'
                    }`}
                  >
                    {starting ? 'Starting...' : 'Start Game'}
                  </button>
                </div>
              )}
            </div>
          ) : game?.playerCount >= game?.maxPlayers ? (
            <div className="text-center py-4">
              <p className="text-yellow-500 mb-4">⚠️ Game is full</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Buy-in Amount (SOL)
                </label>
                <input
                  type="number"
                  value={buyInAmount}
                  onChange={(e) => setBuyInAmount(e.target.value)}
                  placeholder={`${(game?.minBuyIn?.toNumber() / 1e9 || 0)} - ${(game?.maxBuyIn?.toNumber() / 1e9 || 0)}`}
                  className="w-full px-4 py-3 bg-[#0a0b0d] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none transition"
                  min={game?.minBuyIn?.toNumber() / 1e9 || 0}
                  max={game?.maxBuyIn?.toNumber() / 1e9 || 0}
                  step="0.1"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Min: {(game?.minBuyIn?.toNumber() / 1e9 || 0)} SOL • Max: {(game?.maxBuyIn?.toNumber() / 1e9 || 0)} SOL
                </p>
              </div>

              {joinError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{joinError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleJoinGame}
                  disabled={joining || !buyInAmount}
                  className={`flex-1 px-6 py-3 font-bold rounded-lg transition ${
                    joining || !buyInAmount
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-[#00ff88] text-black hover:bg-[#00dd77] shadow-lg shadow-[#00ff88]/20'
                  }`}
                >
                  {joining ? 'Joining...' : 'Join Game'}
                </button>
                <button
                  className="px-6 py-3 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 border border-gray-700 transition"
                  onClick={() => window.open(`https://explorer.solana.com/address/${gamePDA}?cluster=devnet`, '_blank')}
                >
                  Explorer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Raw Data (Debug) */}
        <div className="bg-[#1a1b1f] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Debug Info</h2>
          <pre className="text-gray-400 text-xs overflow-auto max-h-96 bg-[#0a0b0d] p-4 rounded-lg border border-gray-800">
            {JSON.stringify(game, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
