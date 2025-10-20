/**
 * Tests for connection/wallet.ts
 */

import { describe, it, expect } from '@jest/globals';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletClient } from '../../lib/connection/wallet';

describe('WalletClient', () => {
  describe('Network Configuration', () => {
    it('should get network from environment', () => {
      const network = WalletClient.getNetwork();
      
      expect(network).toBeDefined();
      expect(Object.values(WalletAdapterNetwork)).toContain(network);
    });

    it('should return devnet for devnet environment', () => {
      // Environment is set to devnet in jest.setup.js
      const network = WalletClient.getNetwork();
      
      expect(network).toBe(WalletAdapterNetwork.Devnet);
    });
  });

  describe('Wallet Adapters', () => {
    it('should get available wallet adapters', () => {
      const adapters = WalletClient.getAdapters();
      
      expect(Array.isArray(adapters)).toBe(true);
      expect(adapters.length).toBeGreaterThan(0);
    });

    it('should include Phantom wallet adapter', () => {
      const adapters = WalletClient.getAdapters();
      
      const hasPhantom = adapters.some(adapter => adapter.name === 'Phantom');
      expect(hasPhantom).toBe(true);
    });

    it('should include Solflare wallet adapter', () => {
      const adapters = WalletClient.getAdapters();
      
      const hasSolflare = adapters.some(adapter => adapter.name === 'Solflare');
      expect(hasSolflare).toBe(true);
    });

    it('should include Torus wallet adapter', () => {
      const adapters = WalletClient.getAdapters();
      
      const hasTorus = adapters.some(adapter => adapter.name === 'Torus');
      expect(hasTorus).toBe(true);
    });
  });

  describe('Wallet State', () => {
    it('should check if wallet is connected (null adapter)', () => {
      const isConnected = WalletClient.isConnected(null);
      
      expect(isConnected).toBe(false);
    });

    it('should get public key from null adapter', () => {
      const publicKey = WalletClient.getPublicKey(null);
      
      expect(publicKey).toBeNull();
    });

    it('should get wallet name from null adapter', () => {
      const name = WalletClient.getWalletName(null);
      
      expect(name).toBe('Unknown');
    });

    it('should check feature support on null adapter', () => {
      const supports = WalletClient.supportsFeature(null, 'signTransaction');
      
      expect(supports).toBe(false);
    });
  });

  describe('Wallet Adapter Properties', () => {
    it('should get wallet name from adapter', () => {
      const adapters = WalletClient.getAdapters();
      const adapter = adapters[0];
      
      const name = WalletClient.getWalletName(adapter);
      
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      expect(name).not.toBe('Unknown');
    });

    it('should check connection state of adapter', () => {
      const adapters = WalletClient.getAdapters();
      const adapter = adapters[0];
      
      const isConnected = WalletClient.isConnected(adapter);
      
      expect(typeof isConnected).toBe('boolean');
      // Should be false since we haven't connected
      expect(isConnected).toBe(false);
    });

    it('should get public key from disconnected adapter', () => {
      const adapters = WalletClient.getAdapters();
      const adapter = adapters[0];
      
      const publicKey = WalletClient.getPublicKey(adapter);
      
      // Should be null when not connected
      expect(publicKey).toBeNull();
    });
  });

  describe('Feature Detection', () => {
    it('should detect signTransaction feature', () => {
      const adapters = WalletClient.getAdapters();
      const adapter = adapters[0];
      
      const supports = WalletClient.supportsFeature(adapter, 'signTransaction');
      
      expect(typeof supports).toBe('boolean');
    });

    it('should detect signAllTransactions feature', () => {
      const adapters = WalletClient.getAdapters();
      const adapter = adapters[0];
      
      const supports = WalletClient.supportsFeature(adapter, 'signAllTransactions');
      
      expect(typeof supports).toBe('boolean');
    });

    it('should return false for non-existent feature', () => {
      const adapters = WalletClient.getAdapters();
      const adapter = adapters[0];
      
      const supports = WalletClient.supportsFeature(adapter, 'nonExistentFeature123');
      
      expect(supports).toBe(false);
    });
  });
});
