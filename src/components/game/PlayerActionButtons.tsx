'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { usePlayerAction } from '@/hooks/usePlayerAction';

interface PlayerActionButtonsProps {
  gamePDA: string;
  game: any;
  playerState: any;
  isMyTurn: boolean;
  onActionComplete: () => void;
}

export function PlayerActionButtons({
  gamePDA,
  game,
  playerState,
  isMyTurn,
  onActionComplete,
}: PlayerActionButtonsProps) {
  const { fold, check, call, bet, raise, allIn, loading, error } = usePlayerAction();
  const [raiseAmount, setRaiseAmount] = useState<string>('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);

  if (!isMyTurn) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Waiting for other players...</p>
      </div>
    );
  }

  const currentBet = game?.currentBet?.toNumber() / 1e9 || 0;
  const playerChips = playerState?.chipStack?.toNumber() / 1e9 || 0;
  const playerCurrentBet = playerState?.currentBet?.toNumber() / 1e9 || 0;
  const callAmount = currentBet - playerCurrentBet;
  const bigBlind = game?.bigBlind?.toNumber() / 1e9 || 0;

  // Determine available actions
  const canCheck = currentBet === 0 || callAmount === 0;
  const canCall = callAmount > 0 && callAmount <= playerChips;
  const canBet = currentBet === 0 && playerChips > 0;
  const canRaise = currentBet > 0 && playerChips > callAmount;
  const minRaise = currentBet > 0 ? currentBet * 2 : bigBlind;

  const handleAction = async (actionFn: () => Promise<any>) => {
    const result = await actionFn();
    if (result.success) {
      setTimeout(() => {
        onActionComplete();
      }, 1000);
    }
  };

  const handleRaise = async () => {
    const amount = parseFloat(raiseAmount);
    if (isNaN(amount) || amount < minRaise) {
      alert(`Raise must be at least ${minRaise.toFixed(4)} SOL`);
      return;
    }
    if (amount > playerChips) {
      alert('Insufficient chips');
      return;
    }
    await handleAction(() => raise(new PublicKey(gamePDA), amount));
    setShowRaiseInput(false);
    setRaiseAmount('');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Player Info */}
      <div className="bg-[#0a0b0d] border border-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Your Chips</p>
            <p className="text-white font-bold text-lg">{playerChips.toFixed(4)} SOL</p>
          </div>
          <div>
            <p className="text-gray-500">Current Bet</p>
            <p className="text-white font-bold text-lg">{currentBet.toFixed(4)} SOL</p>
          </div>
          {callAmount > 0 && (
            <>
              <div>
                <p className="text-gray-500">To Call</p>
                <p className="text-[#00ff88] font-bold text-lg">{callAmount.toFixed(4)} SOL</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Raise Input */}
        {showRaiseInput && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">
              Raise Amount (SOL)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(e.target.value)}
                placeholder={`Min: ${minRaise.toFixed(4)}`}
                className="flex-1 px-4 py-2 bg-[#0a0b0d] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-[#00ff88] focus:outline-none"
                min={minRaise}
                max={playerChips}
                step="0.01"
              />
              <button
                onClick={handleRaise}
                disabled={loading}
                className="px-6 py-2 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition disabled:opacity-50"
              >
                {loading ? 'Raising...' : 'Raise'}
              </button>
              <button
                onClick={() => {
                  setShowRaiseInput(false);
                  setRaiseAmount('');
                }}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-600">
              Min: {minRaise.toFixed(4)} SOL • Max: {playerChips.toFixed(4)} SOL
            </p>
          </div>
        )}

        {/* Primary Action Buttons */}
        {!showRaiseInput && (
          <div className="grid grid-cols-2 gap-3">
            {/* Check or Call */}
            {canCheck && (
              <button
                onClick={() => handleAction(() => check(new PublicKey(gamePDA)))}
                disabled={loading}
                className="px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : '✓ Check'}
              </button>
            )}
            
            {canCall && (
              <button
                onClick={() => handleAction(() => call(new PublicKey(gamePDA)))}
                disabled={loading}
                className="px-6 py-4 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition shadow-lg shadow-[#00ff88]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : `📞 Call ${callAmount.toFixed(4)} SOL`}
              </button>
            )}

            {/* Raise */}
            {canRaise && (
              <button
                onClick={() => setShowRaiseInput(true)}
                disabled={loading}
                className="px-6 py-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📈 Raise
              </button>
            )}

            {/* Fold */}
            <button
              onClick={() => handleAction(() => fold(new PublicKey(gamePDA)))}
              disabled={loading}
              className="px-6 py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : '❌ Fold'}
            </button>

            {/* All-In */}
            <button
              onClick={() => handleAction(() => allIn(new PublicKey(gamePDA)))}
              disabled={loading || playerChips <= 0}
              className="px-6 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '...' : '🔥 All-In'}
            </button>
          </div>
        )}
      </div>

      {/* Action Hint */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          💡 {canCheck ? 'You can check for free' : canCall ? `Call ${callAmount.toFixed(4)} SOL to stay in` : 'Make your move!'}
        </p>
      </div>
    </div>
  );
}
