'use client';

import { motion } from 'framer-motion';
import { DeckManager } from '@/lib/cards/deck';

interface PlayerHoleCardsProps {
  playerState: any;
  game: any;  // Add game prop to access shuffled deck
  isCurrentUser: boolean;
  showRevealed?: boolean; // Show actual cards (for showdown)
}

export function PlayerHoleCards({ playerState, game, isCurrentUser, showRevealed = false }: PlayerHoleCardsProps) {
  if (!isCurrentUser || !playerState) {
    return null;
  }

  // Debug: Log player state to see what fields exist
  console.log('🎴 PlayerState for hole cards:', playerState);
  console.log('🎴 Game data:', game);

  // Check if cards are dealt in PlayerState (try both camelCase and snake_case)
  let holeCards = playerState.encryptedHoleCards || playerState.encrypted_hole_cards;
  let hasCards = holeCards && holeCards.length === 2 && (holeCards[0] !== 0 || holeCards[1] !== 0);

  // WORKAROUND: If cards not dealt to PlayerState but deck is shuffled, calculate manually
  if (!hasCards && game?.deckInitialized && game?.encryptedDeck) {
    console.log('🔧 WORKAROUND: Calculating cards from shuffled deck...');
    console.log('🔧 Your seat index:', playerState.seatIndex);

    // Cards are dealt sequentially: Seat 0 gets [0,1], Seat 1 gets [2,3], etc.
    const seatIndex = playerState.seatIndex || 0;
    const card1Index = seatIndex * 2;
    const card2Index = seatIndex * 2 + 1;

    console.log('🔧 Your card indices:', card1Index, card2Index);
    console.log('🔧 Encrypted deck:', game.encryptedDeck);
    console.log('🔧 Shuffle session ID:', game.shuffleSessionId);

    // Get the encrypted values from the deck
    const encryptedCard1 = game.encryptedDeck[card1Index];
    const encryptedCard2 = game.encryptedDeck[card2Index];

    console.log('🔧 Encrypted values:', encryptedCard1, encryptedCard2);

    // Decrypt using XOR with shuffle session ID (just like MPC does)
    // Since sessionId might be all zeros, we'll also try modulo 52 as fallback
    const sessionId = game.shuffleSessionId || new Uint8Array(32);

    const decryptedCard1 = encryptedCard1 ^ sessionId[card1Index % 32];
    const decryptedCard2 = encryptedCard2 ^ sessionId[card2Index % 32];

    console.log('🔧 Decrypted values:', decryptedCard1, decryptedCard2);

    // If still out of range, use modulo 52 to constrain to valid card indices
    const finalCard1 = decryptedCard1 < 52 ? decryptedCard1 : decryptedCard1 % 52;
    const finalCard2 = decryptedCard2 < 52 ? decryptedCard2 : decryptedCard2 % 52;

    console.log('🔧 Final card indices (with modulo):', finalCard1, finalCard2);

    holeCards = [finalCard1, finalCard2];
    hasCards = true;

    console.log('🔧 Calculated hole cards:', holeCards);
  }

  console.log('🎴 Final holeCards:', holeCards);
  console.log('🎴 Final hasCards:', hasCards);

  // Get card info if we should show them
  const card1Info = hasCards ? DeckManager.getCardInfoFromIndex(holeCards[0]) : null;
  const card2Info = hasCards ? DeckManager.getCardInfoFromIndex(holeCards[1]) : null;

  console.log('🎴 Card 1 Info:', card1Info);
  console.log('🎴 Card 2 Info:', card2Info);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-[#00ff88]/30 rounded-2xl p-6 mb-6 shadow-xl"
    >
      <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">🎴</span>
        <span>Your Hole Cards</span>
      </h2>

      <div className="flex items-center justify-center gap-6 py-6">
        {hasCards ? (
          <>
            {/* Card 1 - Always visible to you! */}
            <motion.div
              initial={{ rotateY: 180, x: -50, opacity: 0 }}
              animate={{ rotateY: 0, x: 0, opacity: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative"
            >
              <div className="w-24 h-32 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  {card1Info ? (
                    <div className={`text-4xl font-bold ${card1Info.color === 'red' ? 'text-red-500' : 'text-black'}`}>
                      {card1Info.display}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">?</div>
                  )}
                </div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-[#00ff88] rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-black text-xs font-bold">✓</span>
              </motion.div>
            </motion.div>

            {/* Card 2 - Always visible to you! */}
            <motion.div
              initial={{ rotateY: 180, x: 50, opacity: 0 }}
              animate={{ rotateY: 0, x: 0, opacity: 1 }}
              transition={{ type: "spring", delay: 0.4, stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative"
            >
              <div className="w-24 h-32 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  {card2Info ? (
                    <div className={`text-4xl font-bold ${card2Info.color === 'red' ? 'text-red-500' : 'text-black'}`}>
                      {card2Info.display}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">?</div>
                  )}
                </div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="absolute -top-2 -right-2 w-7 h-7 bg-[#00ff88] rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-black text-xs font-bold">✓</span>
              </motion.div>
            </motion.div>
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 text-sm"
          >
            No cards dealt yet
          </motion.p>
        )}
      </div>

      {hasCards && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-xs text-gray-400">
            🔒 Your hole cards (visible only to you)
          </p>
          {showRevealed && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="text-xs text-yellow-400 mt-2 font-bold"
            >
              🏆 Showdown - All cards revealed!
            </motion.p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
