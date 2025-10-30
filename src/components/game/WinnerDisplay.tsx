'use client';

import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';

interface WinnerDisplayProps {
  game: any;
  players: any[];
  myPublicKey?: string;
}

export function WinnerDisplay({ game, players, myPublicKey }: WinnerDisplayProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <>
      {/* Confetti for winner */}
      {isYouWinner && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500 rounded-2xl p-8 mb-6 shadow-2xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="text-8xl mb-4"
          >
            🏆
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-2"
          >
            {isYouWinner ? '🎉 You Win! 🎉' : 'Winner!'}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-yellow-400 font-bold mb-6"
          >
            {winner?.account.player.toBase58().slice(0, 4)}...
            {winner?.account.player.toBase58().slice(-4)}
            {isYouWinner && ' (YOU!)'}
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.5, stiffness: 200 }}
            className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/50 rounded-xl p-6 inline-block shadow-xl"
          >
            <p className="text-gray-400 text-sm mb-2">Final Chip Stack</p>
            <p className="text-4xl font-bold text-[#00ff88]">
              {winnerChips.toFixed(4)} SOL
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="text-2xl"
                >
                  ⭐
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-8 border-t border-yellow-500/30"
          >
            <h3 className="text-xl font-bold text-white mb-4">Final Standings</h3>
            <div className="space-y-3">
              {sortedPlayers.map((p, index) => {
                const chips = p.account.chipStack?.toNumber() / 1e9 || 0;
                const isYou = p.account.player.toBase58() === myPublicKey;

                return (
                  <motion.div
                    key={p.publicKey.toBase58()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/70 shadow-lg'
                        : 'bg-gray-800/50 border border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.1 + index * 0.1, type: "spring" }}
                        className="text-3xl"
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎖️'}
                      </motion.div>
                      <div>
                        <p className="text-white font-bold text-lg">
                          Player {index + 1}
                          {isYou && (
                            <span className="ml-2 text-xs bg-[#00ff88] text-black px-2 py-1 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {p.account.player.toBase58().slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-xl">{chips.toFixed(3)}</p>
                      <p className="text-gray-400 text-xs">SOL</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/lobby'}
              className="px-8 py-4 bg-gradient-to-r from-[#00ff88] to-[#00cc6f] text-black font-bold text-lg rounded-xl hover:from-[#00dd77] hover:to-[#00bb66] transition shadow-lg shadow-[#00ff88]/30"
            >
              🎮 Back to Lobby
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
