'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey) {
      // Fetch balance
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / 1_000_000_000); // Convert lamports to SOL
      });
    } else {
      setBalance(null);
    }
  }, [publicKey, connection]);

  return (
    <header className="border-b border-gray-800 bg-[#0f1419]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            Degen <span className="text-[#00ff88]">Poker</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/lobby" className="text-gray-400 hover:text-white transition-colors">
            Lobby
          </Link>
          <Link href="#" className="text-gray-400 hover:text-white transition-colors">
            How it works
          </Link>
          <Link href="https://docs.arcium.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            Docs
          </Link>
        </nav>

        {/* Wallet Info & Button */}
        <div className="flex items-center gap-4">
          {publicKey && balance !== null && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg border border-gray-800">
              <span className="text-sm text-gray-400">Balance:</span>
              <span className="text-sm font-bold text-[#00ff88]">{balance.toFixed(4)} SOL</span>
            </div>
          )}
          <WalletMultiButton className="!bg-[#00ff88] !text-black hover:!bg-[#00dd77] !rounded-lg !font-bold !text-sm !px-6 !py-3 !transition-colors" />
        </div>
      </div>
    </header>
  );
}
