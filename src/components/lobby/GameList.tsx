'use client';

import { useState, useEffect } from 'react';
import GameCard from './GameCard';

// Mock data for now - will connect to blockchain later
const mockGames = [
  {
    id: '1',
    name: 'High Stakes Table',
    players: 4,
    maxPlayers: 6,
    smallBlind: 0.1,
    bigBlind: 0.2,
    minBuyIn: 10,
    pot: 45.5,
    status: 'active',
  },
  {
    id: '2',
    name: 'Degen Table',
    players: 2,
    maxPlayers: 6,
    smallBlind: 0.01,
    bigBlind: 0.02,
    minBuyIn: 1,
    pot: 2.5,
    status: 'waiting',
  },
  {
    id: '3',
    name: 'Whale Pool',
    players: 5,
    maxPlayers: 6,
    smallBlind: 1,
    bigBlind: 2,
    minBuyIn: 100,
    pot: 250,
    status: 'active',
  },
];

export default function GameList() {
  const [games, setGames] = useState(mockGames);
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting'>('all');

  const filteredGames = games.filter(game => {
    if (filter === 'all') return true;
    return game.status === filter;
  });

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
