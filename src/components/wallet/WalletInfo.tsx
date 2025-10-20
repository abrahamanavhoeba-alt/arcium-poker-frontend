'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export default function WalletInfo() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / 1_000_000_000);
      });
    }
  }, [publicKey, connection]);

  if (!publicKey) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-400 mb-4">Connect your wallet to get started</p>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const needsFunds = balance !== null && balance < 0.1;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">Wallet Info</h3>
      
      {/* Address */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Address</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-black/50 rounded text-sm font-mono text-[#00ff88] overflow-x-auto">
            {publicKey.toBase58()}
          </code>
          <button
            onClick={copyAddress}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-semibold transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Balance</label>
        <div className="text-2xl font-bold text-white">
          {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
        </div>
      </div>

      {/* Get Devnet SOL */}
      {needsFunds && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-500 text-sm mb-3">
            ⚠️ You need devnet SOL to create games
          </p>
          <a
            href={`https://faucet.solana.com/?address=${publicKey.toBase58()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 bg-[#00ff88] text-black text-center font-bold rounded-lg hover:bg-[#00dd77] transition-colors"
          >
            Get Devnet SOL (Free)
          </a>
        </div>
      )}

      {/* Network Info */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Network</span>
          <span className="text-[#00ff88] font-semibold">Devnet</span>
        </div>
      </div>
    </div>
  );
}
