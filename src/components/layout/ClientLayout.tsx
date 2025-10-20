'use client';

import { WalletProvider } from "@/providers/WalletProvider";
import Header from "@/components/layout/Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <Header />
      {children}
    </WalletProvider>
  );
}
