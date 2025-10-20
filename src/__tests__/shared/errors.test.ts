/**
 * Tests for shared/errors.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  ErrorCode,
  PokerError,
  parseAnchorError,
  isPokerError,
  getErrorMessage,
  ERROR_MESSAGES,
} from '../../lib/shared/errors';

describe('Error Handling', () => {
  describe('ErrorCode enum', () => {
    it('should have all 23 error codes', () => {
      const errorCodes = Object.values(ErrorCode).filter(v => typeof v === 'number');
      expect(errorCodes.length).toBe(23);
    });

    it('should start at 6000', () => {
      expect(ErrorCode.GameFull).toBe(6000);
    });

    it('should end at 6022', () => {
      expect(ErrorCode.GameNotFinished).toBe(6022);
    });
  });

  describe('PokerError class', () => {
    it('should create error with code and message', () => {
      const error = new PokerError(ErrorCode.GameFull);
      expect(error.code).toBe(ErrorCode.GameFull);
      expect(error.message).toBe('Game is full, cannot join');
      expect(error.name).toBe('PokerError');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Custom error message';
      const error = new PokerError(ErrorCode.GameFull, customMessage);
      expect(error.message).toBe(customMessage);
    });

    it('should get user-friendly message', () => {
      const error = new PokerError(ErrorCode.NotEnoughPlayers);
      expect(error.getUserMessage()).toBe('Not enough players to start game');
    });

    it('should check if error is specific type', () => {
      const error = new PokerError(ErrorCode.InvalidBetAmount);
      expect(error.is(ErrorCode.InvalidBetAmount)).toBe(true);
      expect(error.is(ErrorCode.GameFull)).toBe(false);
    });

    it('should convert to JSON', () => {
      const error = new PokerError(ErrorCode.InsufficientChips);
      const json = error.toJSON();
      expect(json.name).toBe('PokerError');
      expect(json.code).toBe(ErrorCode.InsufficientChips);
      expect(json.message).toBeDefined();
    });
  });

  describe('parseAnchorError', () => {
    it('should return PokerError as-is', () => {
      const originalError = new PokerError(ErrorCode.GameFull);
      const parsed = parseAnchorError(originalError);
      expect(parsed).toBe(originalError);
    });

    it('should parse Anchor error structure', () => {
      const anchorError = {
        error: {
          errorCode: {
            code: ErrorCode.NotPlayerTurn,
            message: 'Not player\'s turn',
          },
        },
      };
      const parsed = parseAnchorError(anchorError);
      expect(parsed).toBeInstanceOf(PokerError);
      expect(parsed.code).toBe(ErrorCode.NotPlayerTurn);
    });

    it('should handle generic errors', () => {
      const genericError = new Error('Something went wrong');
      const parsed = parseAnchorError(genericError);
      expect(parsed).toBeInstanceOf(PokerError);
      expect(parsed.message).toContain('Something went wrong');
    });
  });

  describe('isPokerError', () => {
    it('should identify PokerError', () => {
      const error = new PokerError(ErrorCode.GameFull);
      expect(isPokerError(error)).toBe(true);
    });

    it('should identify specific PokerError code', () => {
      const error = new PokerError(ErrorCode.BuyInTooLow);
      expect(isPokerError(error, ErrorCode.BuyInTooLow)).toBe(true);
      expect(isPokerError(error, ErrorCode.BuyInTooHigh)).toBe(false);
    });

    it('should reject non-PokerError', () => {
      const error = new Error('Regular error');
      expect(isPokerError(error)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should get message from PokerError', () => {
      const error = new PokerError(ErrorCode.InvalidAction);
      const message = getErrorMessage(error);
      expect(message).toBe(ERROR_MESSAGES[ErrorCode.InvalidAction]);
    });

    it('should get message from regular Error', () => {
      const error = new Error('Test error');
      const message = getErrorMessage(error);
      expect(message).toBe('Test error');
    });

    it('should return default message for unknown error', () => {
      const message = getErrorMessage({});
      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have message for every error code', () => {
      const errorCodes = Object.values(ErrorCode).filter(v => typeof v === 'number');
      errorCodes.forEach(code => {
        expect(ERROR_MESSAGES[code as ErrorCode]).toBeDefined();
        expect(ERROR_MESSAGES[code as ErrorCode].length).toBeGreaterThan(0);
      });
    });
  });
});
