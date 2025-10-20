/**
 * Tests for shared/utils.ts
 */

import { describe, it, expect } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  lamportsToSol,
  solToLamports,
  bnToNumber,
  ensureBN,
  deriveGamePDA,
  derivePlayerStatePDA,
  formatChips,
  formatSol,
  formatPubkey,
  formatDuration,
  sleep,
  isValidPublicKey,
  isDefaultPublicKey,
  validateBuyIn,
  validateBetAmount,
  shuffleArray,
  getNextIndex,
  getPrevIndex,
  compareBN,
  maxBN,
  minBN,
  sumBN,
} from '../../lib/shared/utils';
import { PROGRAM_ID } from '../../lib/shared/constants';

describe('Utility Functions', () => {
  describe('BN Conversion', () => {
    it('should convert lamports to SOL', () => {
      expect(lamportsToSol(1_000_000_000)).toBe(1);
      expect(lamportsToSol(500_000_000)).toBe(0.5);
      expect(lamportsToSol(new BN(2_000_000_000))).toBe(2);
    });

    it('should convert SOL to lamports', () => {
      const result = solToLamports(1);
      expect(result.toNumber()).toBe(1_000_000_000);
    });

    it('should safely convert BN to number', () => {
      const bn = new BN(12345);
      expect(bnToNumber(bn)).toBe(12345);
    });

    it('should throw on unsafe BN to number conversion', () => {
      const hugeBN = new BN(Number.MAX_SAFE_INTEGER).add(new BN(1000));
      expect(() => bnToNumber(hugeBN)).toThrow();
    });

    it('should ensure BN from number or BN', () => {
      expect(ensureBN(100)).toBeInstanceOf(BN);
      const bn = new BN(200);
      expect(ensureBN(bn)).toBe(bn);
    });
  });

  describe('PDA Derivation', () => {
    it('should derive Game PDA', () => {
      const authority = PublicKey.unique();
      const gameId = new BN(12345);
      const [pda, bump] = deriveGamePDA(authority, gameId);
      
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('should derive PlayerState PDA', () => {
      const game = PublicKey.unique();
      const player = PublicKey.unique();
      const [pda, bump] = derivePlayerStatePDA(game, player);
      
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('should derive consistent PDAs', () => {
      const authority = PublicKey.unique();
      const gameId = new BN(999);
      const [pda1] = deriveGamePDA(authority, gameId);
      const [pda2] = deriveGamePDA(authority, gameId);
      
      expect(pda1.equals(pda2)).toBe(true);
    });
  });

  describe('Formatting', () => {
    it('should format chips', () => {
      expect(formatChips(1000)).toBe('1,000');
      expect(formatChips(new BN(50000))).toBe('50,000');
    });

    it('should format SOL', () => {
      const formatted = formatSol(1_000_000_000);
      expect(formatted).toContain('1.0000');
      expect(formatted).toContain('SOL');
    });

    it('should format PublicKey', () => {
      const pubkey = new PublicKey('DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm');
      const formatted = formatPubkey(pubkey);
      expect(formatted).toContain('...');
      expect(formatted.length).toBeLessThan(pubkey.toBase58().length);
    });

    it('should format duration', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(120)).toBe('2m 0s');
    });
  });

  describe('Async Utilities', () => {
    it('should sleep for specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('Validation', () => {
    it('should validate PublicKey string', () => {
      expect(isValidPublicKey('DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm')).toBe(true);
      expect(isValidPublicKey('invalid')).toBe(false);
      expect(isValidPublicKey('')).toBe(false);
    });

    it('should check if PublicKey is default', () => {
      expect(isDefaultPublicKey(PublicKey.default)).toBe(true);
      expect(isDefaultPublicKey(PublicKey.unique())).toBe(false);
    });

    it('should validate buy-in amount', () => {
      const minBuyIn = new BN(1000);
      const maxBuyIn = new BN(50000);
      
      const validResult = validateBuyIn(new BN(5000), minBuyIn, maxBuyIn);
      expect(validResult.valid).toBe(true);
      
      const tooLowResult = validateBuyIn(new BN(500), minBuyIn, maxBuyIn);
      expect(tooLowResult.valid).toBe(false);
      expect(tooLowResult.error).toBeDefined();
      
      const tooHighResult = validateBuyIn(new BN(100000), minBuyIn, maxBuyIn);
      expect(tooHighResult.valid).toBe(false);
      expect(tooHighResult.error).toBeDefined();
    });

    it('should validate bet amount', () => {
      const chipStack = new BN(5000);
      const minBet = new BN(20);
      
      const validResult = validateBetAmount(new BN(100), chipStack, minBet);
      expect(validResult.valid).toBe(true);
      
      const zeroResult = validateBetAmount(new BN(0), chipStack, minBet);
      expect(zeroResult.valid).toBe(false);
      
      const tooMuchResult = validateBetAmount(new BN(10000), chipStack, minBet);
      expect(tooMuchResult.valid).toBe(false);
      
      const tooLowResult = validateBetAmount(new BN(10), chipStack, minBet);
      expect(tooLowResult.valid).toBe(false);
    });
  });

  describe('Array Utilities', () => {
    it('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffleArray(original);
      
      expect(shuffled.length).toBe(original.length);
      expect(shuffled).toEqual(expect.arrayContaining(original));
      // Note: There's a tiny chance this could fail if shuffle returns same order
    });

    it('should get next index in circular array', () => {
      expect(getNextIndex(0, 6)).toBe(1);
      expect(getNextIndex(5, 6)).toBe(0); // Wraps around
      expect(getNextIndex(2, 6)).toBe(3);
    });

    it('should get previous index in circular array', () => {
      expect(getPrevIndex(1, 6)).toBe(0);
      expect(getPrevIndex(0, 6)).toBe(5); // Wraps around
      expect(getPrevIndex(3, 6)).toBe(2);
    });
  });

  describe('BN Comparison', () => {
    it('should compare BN values', () => {
      const a = new BN(100);
      const b = new BN(200);
      const c = new BN(100);
      
      expect(compareBN(a, b)).toBe(-1);
      expect(compareBN(b, a)).toBe(1);
      expect(compareBN(a, c)).toBe(0);
    });

    it('should find maximum BN', () => {
      const values = [new BN(100), new BN(500), new BN(200), new BN(300)];
      const max = maxBN(values);
      expect(max.toNumber()).toBe(500);
    });

    it('should find minimum BN', () => {
      const values = [new BN(100), new BN(500), new BN(200), new BN(300)];
      const min = minBN(values);
      expect(min.toNumber()).toBe(100);
    });

    it('should sum BN values', () => {
      const values = [new BN(100), new BN(200), new BN(300)];
      const sum = sumBN(values);
      expect(sum.toNumber()).toBe(600);
    });

    it('should throw on empty array for max/min', () => {
      expect(() => maxBN([])).toThrow();
      expect(() => minBN([])).toThrow();
    });
  });
});
