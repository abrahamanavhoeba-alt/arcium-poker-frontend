/**
 * Arcium Poker - RPC Client
 * 
 * Manages Solana RPC connection and transaction handling.
 */

import { 
  Connection, 
  Commitment, 
  ConnectionConfig,
  PublicKey,
  Transaction,
  TransactionSignature,
  SendOptions,
  ConfirmOptions,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import { 
  RPC_ENDPOINT, 
  WS_ENDPOINT, 
  COMMITMENT, 
  TRANSACTION_TIMEOUT_MS,
  RPC_TIMEOUT_MS,
} from '../shared/constants';
import { retryWithBackoff, withTimeout } from '../shared/utils';

/**
 * RPC connection singleton
 */
let connectionInstance: Connection | null = null;

/**
 * RPC Client
 * Manages Solana connection and transaction operations
 */
export class RPCClient {
  /**
   * Initialize connection
   * @param endpoint - RPC endpoint URL (optional, uses env var by default)
   * @param commitment - Commitment level (optional, uses env var by default)
   * @returns Connection instance
   */
  static initialize(
    endpoint: string = RPC_ENDPOINT,
    commitment: Commitment = COMMITMENT
  ): Connection {
    if (!connectionInstance) {
      const config: ConnectionConfig = {
        commitment,
        wsEndpoint: WS_ENDPOINT,
        confirmTransactionInitialTimeout: TRANSACTION_TIMEOUT_MS,
      };
      connectionInstance = new Connection(endpoint, config);
    }
    return connectionInstance;
  }

  /**
   * Get connection instance
   * @throws Error if connection not initialized
   */
  static getConnection(): Connection {
    if (!connectionInstance) {
      // Auto-initialize with defaults
      return this.initialize();
    }
    return connectionInstance;
  }

  /**
   * Check if connection is initialized
   */
  static isInitialized(): boolean {
    return connectionInstance !== null;
  }

  /**
   * Reset connection (useful for testing)
   */
  static reset(): void {
    connectionInstance = null;
  }

  /**
   * Get RPC endpoint URL
   */
  static getEndpoint(): string {
    return this.getConnection().rpcEndpoint;
  }

  /**
   * Confirm transaction with timeout
   * @param signature - Transaction signature
   * @param commitment - Commitment level
   * @returns Confirmation result
   */
  static async confirmTransaction(
    signature: TransactionSignature,
    commitment: Commitment = COMMITMENT
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const connection = this.getConnection();
    
    return await withTimeout(
      connection.confirmTransaction(signature, commitment),
      TRANSACTION_TIMEOUT_MS,
      `Transaction confirmation timeout: ${signature}`
    );
  }

  /**
   * Send and confirm transaction
   * @param transaction - Transaction to send
   * @param options - Send options
   * @returns Transaction signature
   */
  static async sendAndConfirmTransaction(
    transaction: Transaction,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      async () => {
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          options
        );
        
        await this.confirmTransaction(signature);
        return signature;
      },
      3, // max retries
      1000 // base delay
    );
  }

  /**
   * Get account info with retry
   * @param pubkey - Account public key
   * @returns Account info or null
   */
  static async getAccountInfo(pubkey: PublicKey) {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      () => connection.getAccountInfo(pubkey),
      3
    );
  }

  /**
   * Get multiple accounts info
   * @param pubkeys - Array of public keys
   * @returns Array of account info
   */
  static async getMultipleAccountsInfo(pubkeys: PublicKey[]) {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      () => connection.getMultipleAccountsInfo(pubkeys),
      3
    );
  }

  /**
   * Get balance
   * @param pubkey - Account public key
   * @returns Balance in lamports
   */
  static async getBalance(pubkey: PublicKey): Promise<number> {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      () => connection.getBalance(pubkey),
      3
    );
  }

  /**
   * Get latest blockhash
   * @returns Latest blockhash
   */
  static async getLatestBlockhash() {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      () => connection.getLatestBlockhash(COMMITMENT),
      3
    );
  }

  /**
   * Get minimum balance for rent exemption
   * @param dataLength - Account data length
   * @returns Minimum balance in lamports
   */
  static async getMinimumBalanceForRentExemption(
    dataLength: number
  ): Promise<number> {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      () => connection.getMinimumBalanceForRentExemption(dataLength),
      3
    );
  }

  /**
   * Get transaction
   * @param signature - Transaction signature
   * @returns Transaction or null
   */
  static async getTransaction(signature: TransactionSignature) {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      () => connection.getTransaction(signature, {
        commitment: COMMITMENT,
        maxSupportedTransactionVersion: 0,
      }),
      3
    );
  }

  /**
   * Get signatures for address
   * @param address - Account address
   * @param limit - Maximum number of signatures to return
   * @returns Array of transaction signatures
   */
  static async getSignaturesForAddress(
    address: PublicKey,
    limit: number = 10
  ) {
    const connection = this.getConnection();
    
    return await retryWithBackoff(
      () => connection.getSignaturesForAddress(address, { limit }),
      3
    );
  }

  /**
   * Request airdrop (devnet/testnet only)
   * @param pubkey - Recipient public key
   * @param lamports - Amount in lamports
   * @returns Transaction signature
   */
  static async requestAirdrop(
    pubkey: PublicKey,
    lamports: number
  ): Promise<TransactionSignature> {
    const connection = this.getConnection();
    
    const signature = await connection.requestAirdrop(pubkey, lamports);
    await this.confirmTransaction(signature);
    return signature;
  }

  /**
   * Get slot
   * @returns Current slot
   */
  static async getSlot(): Promise<number> {
    const connection = this.getConnection();
    return await connection.getSlot();
  }

  /**
   * Get block time
   * @param slot - Slot number
   * @returns Block time or null
   */
  static async getBlockTime(slot: number): Promise<number | null> {
    const connection = this.getConnection();
    return await connection.getBlockTime(slot);
  }

  /**
   * Subscribe to account changes
   * @param pubkey - Account public key
   * @param callback - Callback function
   * @returns Subscription ID
   */
  static onAccountChange(
    pubkey: PublicKey,
    callback: (accountInfo: any, context: any) => void
  ): number {
    const connection = this.getConnection();
    return connection.onAccountChange(pubkey, callback, COMMITMENT);
  }

  /**
   * Remove account change listener
   * @param subscriptionId - Subscription ID
   */
  static async removeAccountChangeListener(
    subscriptionId: number
  ): Promise<void> {
    const connection = this.getConnection();
    await connection.removeAccountChangeListener(subscriptionId);
  }

  /**
   * Subscribe to program account changes
   * @param programId - Program ID
   * @param callback - Callback function
   * @returns Subscription ID
   */
  static onProgramAccountChange(
    programId: PublicKey,
    callback: (keyedAccountInfo: any, context: any) => void
  ): number {
    const connection = this.getConnection();
    return connection.onProgramAccountChange(programId, callback, COMMITMENT);
  }

  /**
   * Remove program account change listener
   * @param subscriptionId - Subscription ID
   */
  static async removeProgramAccountChangeListener(
    subscriptionId: number
  ): Promise<void> {
    const connection = this.getConnection();
    await connection.removeProgramAccountChangeListener(subscriptionId);
  }
}
