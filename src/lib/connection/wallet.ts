/**
 * Arcium Poker - Wallet Client
 * 
 * Manages wallet adapter integration for Solana wallets.
 */

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { PublicKey } from '@solana/web3.js';
import { SOLANA_NETWORK } from '../shared/constants';

/**
 * Wallet adapter type
 */
export type WalletAdapter = 
  | PhantomWalletAdapter 
  | SolflareWalletAdapter 
  | TorusWalletAdapter;

/**
 * Wallet Client
 * Manages wallet adapters and wallet operations
 */
export class WalletClient {
  /**
   * Get network from environment
   */
  static getNetwork(): WalletAdapterNetwork {
    switch (SOLANA_NETWORK) {
      case 'mainnet-beta':
        return WalletAdapterNetwork.Mainnet;
      case 'testnet':
        return WalletAdapterNetwork.Testnet;
      case 'devnet':
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }

  /**
   * Get available wallet adapters
   * @returns Array of wallet adapters
   */
  static getAdapters(): WalletAdapter[] {
    const network = this.getNetwork();
    
    return [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ];
  }

  /**
   * Check if wallet is connected
   * @param adapter - Wallet adapter
   */
  static isConnected(adapter: WalletAdapter | null): boolean {
    return adapter?.connected ?? false;
  }

  /**
   * Get wallet public key
   * @param adapter - Wallet adapter
   * @returns Public key or null
   */
  static getPublicKey(adapter: WalletAdapter | null): PublicKey | null {
    return adapter?.publicKey ?? null;
  }

  /**
   * Connect wallet
   * @param adapter - Wallet adapter
   */
  static async connect(adapter: WalletAdapter): Promise<void> {
    if (!adapter.connected) {
      await adapter.connect();
    }
  }

  /**
   * Disconnect wallet
   * @param adapter - Wallet adapter
   */
  static async disconnect(adapter: WalletAdapter): Promise<void> {
    if (adapter.connected) {
      await adapter.disconnect();
    }
  }

  /**
   * Get wallet name
   * @param adapter - Wallet adapter
   */
  static getWalletName(adapter: WalletAdapter | null): string {
    return adapter?.name ?? 'Unknown';
  }

  /**
   * Check if wallet supports feature
   * @param adapter - Wallet adapter
   * @param feature - Feature name
   */
  static supportsFeature(
    adapter: WalletAdapter | null,
    feature: string
  ): boolean {
    if (!adapter) return false;
    return (adapter as any)[feature] !== undefined;
  }
}
