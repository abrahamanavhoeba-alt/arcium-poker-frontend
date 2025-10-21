'use client';

interface WinnerDisplayProps {
  game: any;
  players: any[];
  myPublicKey?: string;
}

export function WinnerDisplay({ game, players, myPublicKey }: WinnerDisplayProps) {
  // Show winner at showdown or finished stage
  if (!game?.stage?.finished && !game?.stage?.showdown) {
    return null;
  }

  // Find the winner by comparing chip stacks
  // Winner has the most chips after showdown
  const sortedPlayers = [...players].sort((a, b) => {
    const aChips = a.account.chipStack?.toNumber() || 0;
    const bChips = b.account.chipStack?.toNumber() || 0;
    return bChips - aChips;
  });

  const winner = sortedPlayers[0];
  const winnerChips = winner?.account.chipStack?.toNumber() / 1e9 || 0;
  const isYouWinner = winner?.account.player.toBase58() === myPublicKey;

  return (
    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-xl p-8 mb-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {isYouWinner ? 'You Win!' : 'Winner!'}
        </h2>
        <div className="text-xl text-yellow-400 font-bold mb-4">
          {winner?.account.player.toBase58().slice(0, 4)}...
          {winner?.account.player.toBase58().slice(-4)}
          {isYouWinner && ' (YOU!)'}
        </div>
        
        <div className="bg-black/30 rounded-lg p-4 inline-block">
          <p className="text-gray-400 text-sm mb-1">Final Chip Stack</p>
          <p className="text-3xl font-bold text-[#00ff88]">
            {winnerChips.toFixed(4)} SOL
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-yellow-500/30">
          <h3 className="text-lg font-bold text-white mb-3">Final Standings</h3>
          <div className="space-y-2">
            {sortedPlayers.map((p, index) => {
              const chips = p.account.chipStack?.toNumber() / 1e9 || 0;
              const isYou = p.account.player.toBase58() === myPublicKey;
              
              return (
                <div
                  key={p.publicKey.toBase58()}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                    <div>
                      <p className="text-white font-medium">
                        Player {index + 1}
                        {isYou && (
                          <span className="ml-2 text-xs bg-[#00ff88] text-black px-2 py-0.5 rounded font-bold">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {p.account.player.toBase58().slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{chips.toFixed(4)} SOL</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => window.location.href = '/lobby'}
            className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition shadow-lg shadow-[#00ff88]/20"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
