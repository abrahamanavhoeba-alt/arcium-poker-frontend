'use client';

import { useState } from 'react';
import GameList from '@/components/lobby/GameList';
import CreateGameModal from '@/components/lobby/CreateGameModal';

export default function LobbyPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Game Lobby</h1>
            <p className="text-gray-400">Join a game or create your own table</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition-colors"
          >
            Create Game
          </button>
        </div>

        {/* Game List */}
        <GameList />
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <CreateGameModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
