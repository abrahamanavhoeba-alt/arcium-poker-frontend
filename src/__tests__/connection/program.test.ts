/**
 * Tests for connection/program.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ProgramClient } from '../../lib/connection/program';
import { PROGRAM_ID } from '../../lib/shared/constants';

describe('ProgramClient', () => {
  afterEach(() => {
    // Reset program instance after each test
    ProgramClient.reset();
  });

  describe('Program ID', () => {
    it('should return correct program ID', () => {
      const programId = ProgramClient.getProgramId();
      expect(programId).toBeInstanceOf(PublicKey);
      expect(programId.toBase58()).toBe('DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm');
      expect(programId.equals(PROGRAM_ID)).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should not be initialized by default', () => {
      expect(ProgramClient.isInitialized()).toBe(false);
    });

    it('should reset program instance', () => {
      ProgramClient.reset();
      expect(ProgramClient.isInitialized()).toBe(false);
    });
  });

  describe('PDA Derivation', () => {
    it('should derive Game PDA with BN gameId', () => {
      const authority = PublicKey.unique();
      const gameId = new BN(12345);
      
      const [pda, bump] = ProgramClient.deriveGamePDA(authority, gameId);
      
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('should derive Game PDA with number gameId', () => {
      const authority = PublicKey.unique();
      const gameId = 99999;
      
      const [pda, bump] = ProgramClient.deriveGamePDA(authority, gameId);
      
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
    });

    it('should derive consistent Game PDAs', () => {
      const authority = PublicKey.unique();
      const gameId = new BN(555);
      
      const [pda1, bump1] = ProgramClient.deriveGamePDA(authority, gameId);
      const [pda2, bump2] = ProgramClient.deriveGamePDA(authority, gameId);
      
      expect(pda1.equals(pda2)).toBe(true);
      expect(bump1).toBe(bump2);
    });

    it('should derive different PDAs for different authorities', () => {
      const authority1 = PublicKey.unique();
      const authority2 = PublicKey.unique();
      const gameId = new BN(123);
      
      const [pda1] = ProgramClient.deriveGamePDA(authority1, gameId);
      const [pda2] = ProgramClient.deriveGamePDA(authority2, gameId);
      
      expect(pda1.equals(pda2)).toBe(false);
    });

    it('should derive different PDAs for different game IDs', () => {
      const authority = PublicKey.unique();
      const gameId1 = new BN(100);
      const gameId2 = new BN(200);
      
      const [pda1] = ProgramClient.deriveGamePDA(authority, gameId1);
      const [pda2] = ProgramClient.deriveGamePDA(authority, gameId2);
      
      expect(pda1.equals(pda2)).toBe(false);
    });

    it('should derive PlayerState PDA', () => {
      const game = PublicKey.unique();
      const player = PublicKey.unique();
      
      const [pda, bump] = ProgramClient.derivePlayerStatePDA(game, player);
      
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('should derive consistent PlayerState PDAs', () => {
      const game = PublicKey.unique();
      const player = PublicKey.unique();
      
      const [pda1, bump1] = ProgramClient.derivePlayerStatePDA(game, player);
      const [pda2, bump2] = ProgramClient.derivePlayerStatePDA(game, player);
      
      expect(pda1.equals(pda2)).toBe(true);
      expect(bump1).toBe(bump2);
    });

    it('should derive different PlayerState PDAs for different games', () => {
      const game1 = PublicKey.unique();
      const game2 = PublicKey.unique();
      const player = PublicKey.unique();
      
      const [pda1] = ProgramClient.derivePlayerStatePDA(game1, player);
      const [pda2] = ProgramClient.derivePlayerStatePDA(game2, player);
      
      expect(pda1.equals(pda2)).toBe(false);
    });

    it('should derive different PlayerState PDAs for different players', () => {
      const game = PublicKey.unique();
      const player1 = PublicKey.unique();
      const player2 = PublicKey.unique();
      
      const [pda1] = ProgramClient.derivePlayerStatePDA(game, player1);
      const [pda2] = ProgramClient.derivePlayerStatePDA(game, player2);
      
      expect(pda1.equals(pda2)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when getting uninitialized program', () => {
      expect(() => ProgramClient.getProgram()).toThrow(
        'Program not initialized. Call ProgramClient.initialize() first.'
      );
    });
  });
});
