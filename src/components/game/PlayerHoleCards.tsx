'use client';

import { DeckManager } from '@/lib/cards/deck';

interface PlayerHoleCardsProps {
  playerState: any;
  isCurrentUser: boolean;
  showRevealed?: boolean; // Show actual cards (for showdown)
}

export function PlayerHoleCards({ playerState, isCurrentUser, showRevealed = false }: PlayerHoleCardsProps) {
  if (!isCurrentUser || !playerState) {
    return null;
  }

  // Debug: Log player state to see what fields exist
  console.log('🎴 PlayerState for hole cards:', playerState);

  // Check if cards are dealt (encryptedHoleCards array exists and has 2 elements)
  const hasCards = playerState.encryptedHoleCards && 
                   playerState.encryptedHoleCards.length === 2;

  // Get card info if we should show them
  const card1Info = hasCards ? DeckManager.getCardInfoFromIndex(playerState.encryptedHoleCards[0]) : null;
  const card2Info = hasCards ? DeckManager.getCardInfoFromIndex(playerState.encryptedHoleCards[1]) : null;

  return (
    <div className="bg-[#1a1b1f] border border-gray-800 rounded-xl p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>🎴</span>
        Your Hole Cards
      </h2>
      
      <div className="flex items-center justify-center gap-4 py-6">
        {hasCards ? (
          <>
            {/* Card 1 */}
            <div className="relative">
              <div className={`w-20 h-28 rounded-lg border-2 flex items-center justify-center shadow-lg ${
                showRevealed 
                  ? 'bg-white border-gray-300' 
                  : 'bg-gradient-to-br from-purple-600 to-blue-600 border-purple-400'
              }`}>
                <div className="text-center">
                  {showRevealed && card1Info ? (
                    <div className={`text-3xl font-bold ${card1Info.color === 'red' ? 'text-red-500' : 'text-black'}`}>
                      {card1Info.display}
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl mb-1">🔒</div>
                      <div className="text-xs text-white font-bold">Card 1</div>
                    </>
                  )}
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00ff88] rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">✓</span>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="relative">
              <div className={`w-20 h-28 rounded-lg border-2 flex items-center justify-center shadow-lg ${
                showRevealed 
                  ? 'bg-white border-gray-300' 
                  : 'bg-gradient-to-br from-purple-600 to-blue-600 border-purple-400'
              }`}>
                <div className="text-center">
                  {showRevealed && card2Info ? (
                    <div className={`text-3xl font-bold ${card2Info.color === 'red' ? 'text-red-500' : 'text-black'}`}>
                      {card2Info.display}
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl mb-1">🔒</div>
                      <div className="text-xs text-white font-bold">Card 2</div>
                    </>
                  )}
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00ff88] rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">✓</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">No cards dealt yet</p>
        )}
      </div>
      
      {hasCards && (
        <div className="text-center">
          {showRevealed ? (
            <p className="text-xs text-gray-500">
              🎴 Cards revealed for showdown
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              🔐 Your cards are encrypted via Arcium MPC
            </p>
          )}
        </div>
      )}
    </div>
  );
}
