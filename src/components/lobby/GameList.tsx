'use client';

import { useState } from 'react';
import GameCard from './GameCard';
import { useGames } from '@/hooks/useGames';

export default function GameList() {
  const { games, loading, error, refetch } = useGames();
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting'>('all');

  // Transform blockchain games to display format
  const displayGames = games.map(game => ({
    id: game.publicKey.toBase58(),
    name: `Table ${game.gameId}`,
    players: game.playerCount,
    maxPlayers: game.maxPlayers,
    smallBlind: game.smallBlind,
    bigBlind: game.bigBlind,
    minBuyIn: game.minBuyIn,
    pot: game.pot,
    status: game.stage === 'Waiting' ? 'waiting' : 'active' as 'active' | 'waiting',
  }));

  const filteredGames = displayGames.filter(game => {
    if (filter === 'all') return true;
    return game.status === filter;
  });

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-[#00ff88]"></div>
        <p className="text-gray-400 mt-4">Loading games...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filter === 'all'
              ? 'bg-[#00ff88] text-black'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All Games ({games.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filter === 'active'
              ? 'bg-[#00ff88] text-black'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('waiting')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            filter === 'waiting'
              ? 'bg-[#00ff88] text-black'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Waiting
        </button>
      </div>

      {/* Games Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">No games found</p>
          <p className="text-gray-500 text-sm">Create a new game to get started</p>
        </div>
      )}
    </div>
  );
}
