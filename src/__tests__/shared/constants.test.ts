/**
 * Tests for shared/constants.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  PROGRAM_ID,
  DEFAULT_SMALL_BLIND,
  DEFAULT_BIG_BLIND,
  DEFAULT_MIN_BUY_IN,
  DEFAULT_MAX_BUY_IN,
  MAX_PLAYERS,
  MIN_PLAYERS,
  getExplorerUrl,
  isDevelopment,
} from '../../lib/shared/constants';

describe('Constants', () => {
  describe('Program Configuration', () => {
    it('should have valid program ID', () => {
      expect(PROGRAM_ID).toBeDefined();
      expect(PROGRAM_ID.toBase58()).toBe('DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm');
    });
  });

  describe('Game Defaults', () => {
    it('should have correct blind values', () => {
      expect(DEFAULT_SMALL_BLIND).toBe(10);
      expect(DEFAULT_BIG_BLIND).toBe(20);
      expect(DEFAULT_BIG_BLIND).toBe(DEFAULT_SMALL_BLIND * 2);
    });

    it('should have correct buy-in values', () => {
      expect(DEFAULT_MIN_BUY_IN).toBe(1000);
      expect(DEFAULT_MAX_BUY_IN).toBe(50000);
      expect(DEFAULT_MIN_BUY_IN).toBeLessThan(DEFAULT_MAX_BUY_IN);
    });

    it('should have correct player limits', () => {
      expect(MAX_PLAYERS).toBe(6);
      expect(MIN_PLAYERS).toBe(2);
      expect(MIN_PLAYERS).toBeLessThan(MAX_PLAYERS);
    });
  });

  describe('Utility Functions', () => {
    it('should generate correct explorer URL for address', () => {
      const address = 'DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm';
      const url = getExplorerUrl(address, 'address');
      expect(url).toContain(address);
      expect(url).toContain('explorer.solana.com');
      expect(url).toContain('cluster=devnet');
    });

    it('should generate correct explorer URL for transaction', () => {
      const txSig = '5j7s6NiJS3JAkvgkoc18WVAsiSaci2pxB2A6ueCJP4tprA2TFg9wSyTLeYouxPBJEMzJinENTkpA52YStRW5Dia7';
      const url = getExplorerUrl(txSig, 'tx');
      expect(url).toContain(txSig);
      expect(url).toContain('/tx/');
    });

    it('should detect development mode', () => {
      const isDev = isDevelopment();
      expect(typeof isDev).toBe('boolean');
    });
  });
});
