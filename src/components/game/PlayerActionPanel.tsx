'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { usePlayerAction } from '@/hooks/usePlayerAction';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerActionPanelProps {
  gamePDA: string;
  game: any;
  playerState: any;
  isMyTurn: boolean;
  onActionComplete: () => void;
}

export function PlayerActionPanel({
  gamePDA,
  game,
  playerState,
  isMyTurn,
  onActionComplete,
}: PlayerActionPanelProps) {
  const { fold, check, call, bet, raise, allIn, loading, error } = usePlayerAction();
  const [raiseAmount, setRaiseAmount] = useState<string>('');
  const [showRaiseInput, setShowRaiseInput] = useState(false);

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

  if (!isMyTurn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 text-center shadow-2xl"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-4 border-4 border-gray-600 border-t-[#00ff88] rounded-full"
        />
        <p className="text-gray-400 text-lg">Waiting for other players...</p>
        <p className="text-gray-600 text-sm mt-2">Their turn to act</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-[#00ff88] rounded-2xl p-6 shadow-2xl"
    >
      {/* Pulsing Border Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-[#00ff88]/10"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="relative z-10">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4"
            >
              <p className="text-red-400 text-sm">⚠️ {error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Your Turn Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#00ff88]/20 to-yellow-500/20 border border-[#00ff88]/50 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-center gap-3">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-3xl"
            >
              👉
            </motion.span>
            <div>
              <h3 className="text-xl font-bold text-white">Your Turn!</h3>
              <p className="text-sm text-gray-400">Make your move</p>
            </div>
          </div>
        </motion.div>

        {/* Player Info Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-black/30 border border-gray-700 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Your Chips</p>
            <p className="text-white font-bold text-lg">{playerChips.toFixed(3)}</p>
          </div>
          <div className="bg-black/30 border border-gray-700 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Current Bet</p>
            <p className="text-white font-bold text-lg">{currentBet.toFixed(3)}</p>
          </div>
          {callAmount > 0 && (
            <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg p-3">
              <p className="text-[#00ff88] text-xs mb-1">To Call</p>
              <p className="text-[#00ff88] font-bold text-lg">{callAmount.toFixed(3)}</p>
            </div>
          )}
        </div>

        {/* Raise Input */}
        <AnimatePresence>
          {showRaiseInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Raise Amount (SOL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(e.target.value)}
                    placeholder={`Min: ${minRaise.toFixed(3)}`}
                    className="flex-1 px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition"
                    min={minRaise}
                    max={playerChips}
                    step="0.01"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRaise}
                    disabled={loading}
                    className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00dd77] transition disabled:opacity-50 shadow-lg"
                  >
                    {loading ? 'Raising...' : 'Confirm'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowRaiseInput(false);
                      setRaiseAmount('');
                    }}
                    className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Min: {minRaise.toFixed(3)} SOL • Max: {playerChips.toFixed(3)} SOL
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {!showRaiseInput && (
          <div className="grid grid-cols-2 gap-3">
            {/* Check */}
            {canCheck && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(() => check(new PublicKey(gamePDA)))}
                disabled={loading}
                className="px-6 py-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl mb-1 block">✓</span>
                Check
              </motion.button>
            )}

            {/* Call */}
            {canCall && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(() => call(new PublicKey(gamePDA)))}
                disabled={loading}
                className="px-6 py-4 bg-gradient-to-br from-[#00ff88] to-[#00cc6f] text-black font-bold rounded-xl hover:from-[#00dd77] hover:to-[#00bb66] transition shadow-lg shadow-[#00ff88]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl mb-1 block">📞</span>
                Call {callAmount.toFixed(3)}
              </motion.button>
            )}

            {/* Raise */}
            {canRaise && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRaiseInput(true)}
                disabled={loading}
                className="px-6 py-4 bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-500 hover:to-purple-600 transition shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl mb-1 block">📈</span>
                Raise
              </motion.button>
            )}

            {/* Fold */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(() => fold(new PublicKey(gamePDA)))}
              disabled={loading}
              className="px-6 py-4 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-500 hover:to-red-600 transition shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl mb-1 block">❌</span>
              Fold
            </motion.button>

            {/* All-In */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(() => allIn(new PublicKey(gamePDA)))}
              disabled={loading || playerChips <= 0}
              className="px-6 py-4 bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 transition shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl mb-1 block">🔥</span>
              All-In
            </motion.button>
          </div>
        )}

        {/* Action Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-4"
        >
          <p className="text-xs text-gray-500">
            💡 {canCheck ? 'You can check for free' : canCall ? `Call ${callAmount.toFixed(3)} SOL to stay in` : 'Make your move!'}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
