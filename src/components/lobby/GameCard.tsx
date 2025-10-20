'use client';

import { useRouter } from 'next/navigation';

interface Game {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  pot: number;
  status: 'active' | 'waiting';
}

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const router = useRouter();

  const handleJoin = () => {
    router.push(`/game/${game.id}`);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold mb-1">{game.name}</h3>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${
              game.status === 'active' ? 'bg-[#00ff88]' : 'bg-yellow-500'
            }`} />
            <span className="text-sm text-gray-400 capitalize">{game.status}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Pot</div>
          <div className="text-lg font-bold text-[#00ff88]">{game.pot} SOL</div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Players</span>
          <span className="text-white font-semibold">
            {game.players}/{game.maxPlayers}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Blinds</span>
          <span className="text-white font-semibold">
            {game.smallBlind}/{game.bigBlind} SOL
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Min Buy-in</span>
          <span className="text-white font-semibold">{game.minBuyIn} SOL</span>
        </div>
      </div>

      {/* Join Button */}
      <button
        onClick={handleJoin}
        disabled={game.players >= game.maxPlayers}
        className={`w-full py-3 rounded-lg font-bold transition-colors ${
          game.players >= game.maxPlayers
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-[#00ff88] text-black hover:bg-[#00dd77]'
        }`}
      >
        {game.players >= game.maxPlayers ? 'Table Full' : 'Join Game'}
      </button>
    </div>
  );
}
