'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { DeckManager } from '@/lib/cards/deck';

interface Player {
  publicKey: string;
  account: any;
  seatIndex: number;
}

interface PokerTableProps {
  game: any;
  players: Player[];
  currentUserPublicKey?: string;
  isMyTurn: boolean;
}

export function PokerTable({ game, players, currentUserPublicKey, isMyTurn }: PokerTableProps) {
  const maxPlayers = game?.maxPlayers || 6;
  const currentPot = (game?.pot?.toNumber() || 0) / 1e9;
  const communityCards = game?.communityCards || [];
  const communityCardsRevealed = game?.communityCardsRevealed || 0;

  // Calculate player positions in a circle/ellipse around the table
  const getPlayerPosition = (seatIndex: number) => {
    const angle = (seatIndex / maxPlayers) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radiusX = 42; // Horizontal radius (percentage)
    const radiusY = 35; // Vertical radius (percentage)
    const x = 50 + radiusX * Math.cos(angle);
    const y = 50 + radiusY * Math.sin(angle);
    return { x, y, angle };
  };

  // Create array of seats (some may be empty)
  const seats = Array.from({ length: maxPlayers }, (_, seatIndex) => {
    const player = players.find(p => p.account.seatIndex === seatIndex);
    return { seatIndex, player };
  });

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Poker Table */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-[#0f5132] via-[#146c43] to-[#0f5132] rounded-[50%] border-[12px] border-[#8B4513] shadow-2xl">
        {/* Inner Table Surface with Felt Texture */}
        <div className="absolute inset-4 bg-gradient-to-br from-[#1a7a47] to-[#0f5132] rounded-[50%] shadow-inner">
          {/* Table Rail (inner border) */}
          <div className="absolute inset-0 rounded-[50%] border-4 border-[#0a3d24] opacity-30"></div>

          {/* Center Area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {/* Community Cards */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2">
                  <AnimatePresence>
                    {communityCardsRevealed > 0 ? (
                      communityCards.slice(0, communityCardsRevealed).map((cardIndex: number, index: number) => {
                        const cardInfo = DeckManager.getCardInfoFromIndex(cardIndex);
                        return (
                          <motion.div
                            key={`${cardIndex}-${index}`}
                            initial={{ rotateY: 180, scale: 0, y: -100 }}
                            animate={{ rotateY: 0, scale: 1, y: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                              delay: index * 0.15,
                            }}
                            className="relative"
                          >
                            <div className="w-14 h-20 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform">
                              <span className={`text-xl font-bold ${cardInfo.color === 'red' ? 'text-red-500' : 'text-gray-800'}`}>
                                {cardInfo.display}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/30 text-sm italic"
                      >
                        Community Cards
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Pot Display */}
              <AnimatePresence mode="wait">
                {currentPot > 0 && (
                  <motion.div
                    key={currentPot}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-block"
                  >
                    <div className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/50 rounded-full px-6 py-3 shadow-lg">
                      <div className="text-yellow-400 text-xs font-semibold mb-1">POT</div>
                      <div className="text-white text-2xl font-bold flex items-center gap-2">
                        <span className="text-yellow-500">💰</span>
                        {currentPot.toFixed(3)} SOL
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stage Indicator */}
              {!game?.stage?.waiting && game?.stage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs font-semibold text-white/50 uppercase tracking-wider"
                >
                  {Object.keys(game.stage)[0].replace(/([A-Z])/g, ' $1').trim()}
                </motion.div>
              )}
            </div>
          </div>

          {/* Players positioned around the table */}
          {seats.map(({ seatIndex, player }) => {
            const position = getPlayerPosition(seatIndex);
            const isCurrentUser = player && currentUserPublicKey === player.account.player.toBase58();
            const isCurrentTurn = player && !game?.stage?.waiting && game?.currentPlayerIndex === player.account.seatIndex;
            const isFolded = player && player.account.hasFolded;
            const chipStack = player ? (player.account.chipStack?.toNumber() || 0) / 1e9 : 0;
            const currentBet = player ? (player.account.currentBet?.toNumber() || 0) / 1e9 : 0;

            return (
              <div
                key={seatIndex}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                {player ? (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: seatIndex * 0.1 }}
                    className="relative"
                  >
                    {/* Player Card */}
                    <div
                      className={`
                        relative bg-gradient-to-br from-gray-900 to-gray-800
                        border-2 rounded-xl px-4 py-3 shadow-xl min-w-[140px]
                        transition-all duration-300
                        ${isCurrentTurn
                          ? 'border-yellow-400 shadow-yellow-400/50 scale-105 animate-pulse'
                          : isCurrentUser
                          ? 'border-[#00ff88] shadow-[#00ff88]/30'
                          : 'border-gray-700'
                        }
                        ${isFolded ? 'opacity-40 grayscale' : ''}
                      `}
                    >
                      {/* Turn Indicator Glow */}
                      {isCurrentTurn && (
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-yellow-400/20"
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}

                      {/* Player Info */}
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCurrentUser ? 'bg-[#00ff88] text-black' : 'bg-gray-700 text-white'
                          }`}>
                            {seatIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">
                              {player.account.player.toBase58().slice(0, 4)}...
                              {player.account.player.toBase58().slice(-3)}
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex gap-1 mb-2">
                          {isCurrentUser && (
                            <span className="text-[9px] bg-[#00ff88] text-black px-1.5 py-0.5 rounded font-bold">
                              YOU
                            </span>
                          )}
                          {isCurrentTurn && (
                            <span className="text-[9px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold">
                              TURN
                            </span>
                          )}
                          {isFolded && (
                            <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">
                              FOLDED
                            </span>
                          )}
                        </div>

                        {/* Chip Stack */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Chips:</span>
                          <span className="text-white font-bold">{chipStack.toFixed(2)}</span>
                        </div>

                        {/* Current Bet */}
                        {currentBet > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-1 flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-400">Bet:</span>
                            <span className="text-yellow-400 font-bold">{currentBet.toFixed(2)}</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Dealer Button */}
                      {game?.dealerIndex === seatIndex && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center shadow-lg font-bold text-black text-xs"
                        >
                          D
                        </motion.div>
                      )}
                    </div>

                    {/* Hole Cards (positioned below player card) */}
                    {isCurrentUser && player.account.encryptedHoleCards && (
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 10, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute left-1/2 transform -translate-x-1/2 flex gap-1"
                      >
                        {[0, 1].map((cardIdx) => (
                          <motion.div
                            key={cardIdx}
                            initial={{ rotateY: 180 }}
                            animate={{ rotateY: 0 }}
                            transition={{ delay: 0.5 + cardIdx * 0.2, duration: 0.5 }}
                            className="w-10 h-14 bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center"
                          >
                            <span className="text-lg">🂠</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  // Empty Seat
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="w-32 h-20 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center"
                  >
                    <span className="text-white/30 text-xs">Seat {seatIndex + 1}</span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Arcium MPC Badge */}
        {game?.deckInitialized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 right-2"
          >
            <div className="bg-purple-600/90 backdrop-blur-sm border border-purple-400 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg">
              <span className="text-white text-lg">🔐</span>
              <div className="text-xs">
                <div className="text-white font-bold">Arcium MPC</div>
                <div className="text-purple-200 text-[10px]">Encrypted</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
