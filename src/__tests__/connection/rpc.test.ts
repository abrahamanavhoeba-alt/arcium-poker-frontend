/**
 * Tests for connection/rpc.ts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Connection, PublicKey } from '@solana/web3.js';
import { RPCClient } from '../../lib/connection/rpc';
import { RPC_ENDPOINT, COMMITMENT } from '../../lib/shared/constants';

describe('RPCClient', () => {
  afterEach(() => {
    // Reset connection after each test
    RPCClient.reset();
  });

  describe('Initialization', () => {
    it('should initialize connection with default endpoint', () => {
      const connection = RPCClient.initialize();
      
      expect(connection).toBeInstanceOf(Connection);
      expect(RPCClient.isInitialized()).toBe(true);
    });

    it('should initialize connection with custom endpoint', () => {
      const customEndpoint = 'https://api.testnet.solana.com';
      const connection = RPCClient.initialize(customEndpoint);
      
      expect(connection).toBeInstanceOf(Connection);
      expect(connection.rpcEndpoint).toBe(customEndpoint);
    });

    it('should return same instance on multiple initializations', () => {
      const connection1 = RPCClient.initialize();
      const connection2 = RPCClient.initialize();
      
      expect(connection1).toBe(connection2);
    });

    it('should auto-initialize when getting connection', () => {
      expect(RPCClient.isInitialized()).toBe(false);
      
      const connection = RPCClient.getConnection();
      
      expect(connection).toBeInstanceOf(Connection);
      expect(RPCClient.isInitialized()).toBe(true);
    });

    it('should reset connection instance', () => {
      RPCClient.initialize();
      expect(RPCClient.isInitialized()).toBe(true);
      
      RPCClient.reset();
      expect(RPCClient.isInitialized()).toBe(false);
    });
  });

  describe('Connection Properties', () => {
    beforeEach(() => {
      RPCClient.initialize();
    });

    it('should return RPC endpoint', () => {
      const endpoint = RPCClient.getEndpoint();
      
      expect(typeof endpoint).toBe('string');
      expect(endpoint).toBe(RPC_ENDPOINT);
    });

    it('should have connection instance', () => {
      const connection = RPCClient.getConnection();
      
      expect(connection).toBeInstanceOf(Connection);
      expect(connection.rpcEndpoint).toBeDefined();
    });
  });

  describe('Account Operations', () => {
    beforeEach(() => {
      RPCClient.initialize();
    });

    it('should get account info for valid public key', async () => {
      // Using a known system program address
      const systemProgram = new PublicKey('11111111111111111111111111111111');
      
      const accountInfo = await RPCClient.getAccountInfo(systemProgram);
      
      // System program should exist
      expect(accountInfo).toBeDefined();
    });

    it('should return null for non-existent account', async () => {
      // Random public key that doesn't exist
      const randomKey = PublicKey.unique();
      
      const accountInfo = await RPCClient.getAccountInfo(randomKey);
      
      expect(accountInfo).toBeNull();
    });

    it('should get balance for account', async () => {
      const systemProgram = new PublicKey('11111111111111111111111111111111');
      
      const balance = await RPCClient.getBalance(systemProgram);
      
      expect(typeof balance).toBe('number');
      expect(balance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Blockchain Queries', () => {
    beforeEach(() => {
      RPCClient.initialize();
    });

    it('should get latest blockhash', async () => {
      const blockhash = await RPCClient.getLatestBlockhash();
      
      expect(blockhash).toBeDefined();
      expect(blockhash.blockhash).toBeDefined();
      expect(typeof blockhash.blockhash).toBe('string');
      expect(blockhash.lastValidBlockHeight).toBeDefined();
      expect(typeof blockhash.lastValidBlockHeight).toBe('number');
    });

    it('should get current slot', async () => {
      const slot = await RPCClient.getSlot();
      
      expect(typeof slot).toBe('number');
      expect(slot).toBeGreaterThan(0);
    });

    it('should get minimum balance for rent exemption', async () => {
      const dataLength = 1000; // 1KB
      
      const minBalance = await RPCClient.getMinimumBalanceForRentExemption(dataLength);
      
      expect(typeof minBalance).toBe('number');
      expect(minBalance).toBeGreaterThan(0);
    });
  });

  describe('Multiple Accounts', () => {
    beforeEach(() => {
      RPCClient.initialize();
    });

    it('should get multiple accounts info', async () => {
      const pubkeys = [
        new PublicKey('11111111111111111111111111111111'),
        PublicKey.unique(),
      ];
      
      const accountsInfo = await RPCClient.getMultipleAccountsInfo(pubkeys);
      
      expect(Array.isArray(accountsInfo)).toBe(true);
      expect(accountsInfo.length).toBe(2);
      expect(accountsInfo[0]).toBeDefined(); // System program exists
      expect(accountsInfo[1]).toBeNull(); // Random key doesn't exist
    });
  });

  describe('Subscriptions', () => {
    beforeEach(() => {
      RPCClient.initialize();
    });

    it('should subscribe to account changes', () => {
      const pubkey = PublicKey.unique();
      const callback = jest.fn();
      
      const subscriptionId = RPCClient.onAccountChange(pubkey, callback);
      
      expect(typeof subscriptionId).toBe('number');
      expect(subscriptionId).toBeGreaterThanOrEqual(0);
    });

    it('should subscribe to program account changes', () => {
      const programId = new PublicKey('11111111111111111111111111111111');
      const callback = jest.fn();
      
      const subscriptionId = RPCClient.onProgramAccountChange(programId, callback);
      
      expect(typeof subscriptionId).toBe('number');
      expect(subscriptionId).toBeGreaterThanOrEqual(0);
    });
  });
});
