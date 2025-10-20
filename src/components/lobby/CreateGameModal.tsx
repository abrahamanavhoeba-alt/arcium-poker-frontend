'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface CreateGameModalProps {
  onClose: () => void;
}

export default function CreateGameModal({ onClose }: CreateGameModalProps) {
  const { publicKey, connected } = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 6,
    smallBlind: 0.01,
    bigBlind: 0.02,
    minBuyIn: 1,
    maxBuyIn: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    // TODO: Call smart contract to create game
    console.log('Creating game:', formData);
    
    // Close modal
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1419] border border-gray-800 rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create Game</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">Game Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Poker Table"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none"
              required
            />
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-semibold mb-2">Max Players</label>
            <select
              value={formData.maxPlayers}
              onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-[#00ff88] focus:outline-none"
            >
              <option value={2}>2 Players</option>
              <option value={4}>4 Players</option>
              <option value={6}>6 Players</option>
            </select>
          </div>

          {/* Blinds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Small Blind (SOL)</label>
              <input
                type="number"
                step="0.01"
                value={formData.smallBlind}
                onChange={(e) => setFormData({ ...formData, smallBlind: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Big Blind (SOL)</label>
              <input
                type="number"
                step="0.01"
                value={formData.bigBlind}
                onChange={(e) => setFormData({ ...formData, bigBlind: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Buy-in */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Min Buy-in (SOL)</label>
              <input
                type="number"
                step="0.1"
                value={formData.minBuyIn}
                onChange={(e) => setFormData({ ...formData, minBuyIn: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Max Buy-in (SOL)</label>
              <input
                type="number"
                step="0.1"
                value={formData.maxBuyIn}
                onChange={(e) => setFormData({ ...formData, maxBuyIn: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition-colors"
          >
            Create Game
          </button>
        </form>
      </div>
    </div>
  );
}
