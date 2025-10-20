/**
 * Arcium Poker - Input Validation
 * 
 * Validates user inputs and data.
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ValidationResult } from '../shared/types';

/**
 * Input Validator
 */
export class InputValidator {
  /**
   * Validate public key
   */
  static validatePublicKey(key: string): ValidationResult {
    try {
      new PublicKey(key);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid public key format' };
    }
  }

  /**
   * Validate amount
   */
  static validateAmount(amount: BN, min?: BN, max?: BN): ValidationResult {
    if (amount.lte(new BN(0))) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (min && amount.lt(min)) {
      return { valid: false, error: `Amount must be at least ${min.toString()}` };
    }

    if (max && amount.gt(max)) {
      return { valid: false, error: `Amount cannot exceed ${max.toString()}` };
    }

    return { valid: true };
  }

  /**
   * Validate player count
   */
  static validatePlayerCount(count: number, min: number, max: number): ValidationResult {
    if (count < min || count > max) {
      return { valid: false, error: `Player count must be between ${min} and ${max}` };
    }
    return { valid: true };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength: number = 100): string {
    return input.trim().slice(0, maxLength);
  }
}
