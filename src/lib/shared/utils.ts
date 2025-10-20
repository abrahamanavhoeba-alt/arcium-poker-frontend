/**
 * Arcium Poker - Utility Functions
 * 
 * Common utility functions used throughout the application.
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID, GAME_SEED, PLAYER_SEED } from './constants';

// ==============================================
// BN Conversion Utilities
// ==============================================

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number | BN): number {
  const bn = typeof lamports === 'number' ? new BN(lamports) : lamports;
  return bn.toNumber() / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): BN {
  return new BN(Math.floor(sol * 1_000_000_000));
}

/**
 * Safely convert BN to number
 * Throws if number is too large
 */
export function bnToNumber(bn: BN): number {
  if (bn.gt(new BN(Number.MAX_SAFE_INTEGER))) {
    throw new Error('Number too large to safely convert');
  }
  return bn.toNumber();
}

/**
 * Convert number or BN to BN
 */
export function ensureBN(value: number | BN): BN {
  return typeof value === 'number' ? new BN(value) : value;
}

// ==============================================
// PDA Derivation
// ==============================================

/**
 * Derive Game PDA
 * Seeds: ["game", authority, gameId]
 */
export function deriveGamePDA(
  authority: PublicKey,
  gameId: BN
): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      GAME_SEED,
      authority.toBuffer(),
      gameId.toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID
  );
  return [pda, bump];
}

/**
 * Derive PlayerState PDA
 * Seeds: ["player", game, player]
 */
export function derivePlayerStatePDA(
  game: PublicKey,
  player: PublicKey
): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      PLAYER_SEED,
      game.toBuffer(),
      player.toBuffer(),
    ],
    PROGRAM_ID
  );
  return [pda, bump];
}

// ==============================================
// Formatting Utilities
// ==============================================

/**
 * Format chips for display
 */
export function formatChips(chips: number | BN): string {
  const num = typeof chips === 'number' ? chips : chips.toNumber();
  return num.toLocaleString();
}

/**
 * Format SOL for display
 */
export function formatSol(lamports: number | BN): string {
  const sol = lamportsToSol(lamports);
  return `${sol.toFixed(4)} SOL`;
}

/**
 * Format PublicKey for display (shortened)
 */
export function formatPubkey(pubkey: PublicKey, length: number = 4): string {
  const str = pubkey.toBase58();
  return `${str.slice(0, length)}...${str.slice(-length)}`;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: BN | number): string {
  const ms = typeof timestamp === 'number' ? timestamp * 1000 : timestamp.toNumber() * 1000;
  return new Date(ms).toLocaleString();
}

/**
 * Format duration (seconds to human readable)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

// ==============================================
// Async Utilities
// ==============================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}

/**
 * Timeout wrapper for promises
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  
  return Promise.race([promise, timeout]);
}

// ==============================================
// Validation Utilities
// ==============================================

/**
 * Check if PublicKey is valid
 */
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if PublicKey is the default (all zeros)
 */
export function isDefaultPublicKey(key: PublicKey): boolean {
  return key.equals(PublicKey.default);
}

/**
 * Validate buy-in amount
 */
export function validateBuyIn(
  buyIn: BN,
  minBuyIn: BN,
  maxBuyIn: BN
): { valid: boolean; error?: string } {
  if (buyIn.lt(minBuyIn)) {
    return {
      valid: false,
      error: `Buy-in must be at least ${formatChips(minBuyIn)} chips`,
    };
  }
  
  if (buyIn.gt(maxBuyIn)) {
    return {
      valid: false,
      error: `Buy-in cannot exceed ${formatChips(maxBuyIn)} chips`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate bet amount
 */
export function validateBetAmount(
  amount: BN,
  chipStack: BN,
  minBet: BN
): { valid: boolean; error?: string } {
  if (amount.lte(new BN(0))) {
    return {
      valid: false,
      error: 'Bet amount must be greater than 0',
    };
  }
  
  if (amount.gt(chipStack)) {
    return {
      valid: false,
      error: 'Insufficient chips',
    };
  }
  
  if (amount.lt(minBet)) {
    return {
      valid: false,
      error: `Minimum bet is ${formatChips(minBet)} chips`,
    };
  }
  
  return { valid: true };
}

// ==============================================
// Array Utilities
// ==============================================

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get next index in circular array
 */
export function getNextIndex(current: number, length: number): number {
  return (current + 1) % length;
}

/**
 * Get previous index in circular array
 */
export function getPrevIndex(current: number, length: number): number {
  return (current - 1 + length) % length;
}

// ==============================================
// Crypto Utilities
// ==============================================

/**
 * Generate random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    // Fallback for Node.js
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(length);
    bytes.set(buffer);
  }
  return bytes;
}

/**
 * Generate random entropy for MPC
 */
export function generateEntropy(): Uint8Array {
  return generateRandomBytes(32);
}

// ==============================================
// Debug Utilities
// ==============================================

/**
 * Log with timestamp
 */
export function logWithTimestamp(message: string, ...args: any[]): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, ...args);
}

/**
 * Debug log (only in development)
 */
export function debugLog(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    logWithTimestamp(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Pretty print object
 */
export function prettyPrint(obj: any): void {
  console.log(JSON.stringify(obj, null, 2));
}

// ==============================================
// Comparison Utilities
// ==============================================

/**
 * Compare two BN values
 */
export function compareBN(a: BN, b: BN): number {
  if (a.lt(b)) return -1;
  if (a.gt(b)) return 1;
  return 0;
}

/**
 * Get maximum BN from array
 */
export function maxBN(values: BN[]): BN {
  if (values.length === 0) {
    throw new Error('Cannot get max of empty array');
  }
  return values.reduce((max, val) => (val.gt(max) ? val : max), values[0]);
}

/**
 * Get minimum BN from array
 */
export function minBN(values: BN[]): BN {
  if (values.length === 0) {
    throw new Error('Cannot get min of empty array');
  }
  return values.reduce((min, val) => (val.lt(min) ? val : min), values[0]);
}

/**
 * Sum array of BN values
 */
export function sumBN(values: BN[]): BN {
  return values.reduce((sum, val) => sum.add(val), new BN(0));
}
