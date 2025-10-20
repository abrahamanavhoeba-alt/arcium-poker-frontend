'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

export default function Header() {
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

        {/* Wallet Button */}
        <div className="flex items-center gap-4">
          <WalletMultiButton className="!bg-[#00ff88] !text-black hover:!bg-[#00dd77] !rounded-lg !font-bold !text-sm !px-6 !py-3 !transition-colors" />
        </div>
      </div>
    </header>
  );
}
