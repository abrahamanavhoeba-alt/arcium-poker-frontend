/**
 * Arcium Poker - Constants
 * 
 * All constant values used throughout the application.
 * Values are derived from the smart contract IDL and environment variables.
 */

import { PublicKey, Commitment } from '@solana/web3.js';

// ==============================================
// Blockchain Configuration
// ==============================================

/**
 * Arcium Poker Program ID (from IDL)
 * Address: Cm5y2aab75vj9dpRcyG1EeZNgeh4GZLRkN3BmmRVNEwZ
 * Network: Devnet
 * Deployed: Oct 25, 2025
 */
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'Cm5y2aab75vj9dpRcyG1EeZNgeh4GZLRkN3BmmRVNEwZ'
);

/**
 * Solana network configuration
 */
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

/**
 * RPC endpoint for Solana connection
 * Using Helius for better reliability and faster blockhash updates
 */
export const RPC_ENDPOINT = 
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://devnet.helius-rpc.com/?api-key=ca217878-e9d4-46ab-ba1d-fb283a0a0fc9';

/**
 * WebSocket endpoint for real-time updates
 */
export const WS_ENDPOINT = 
  process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://api.devnet.solana.com';

/**
 * Solana Explorer base URL
 */
export const EXPLORER_URL = 
  process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.solana.com';

/**
 * Transaction commitment level
 */
export const COMMITMENT: Commitment = 
  (process.env.NEXT_PUBLIC_COMMITMENT as Commitment) || 'confirmed';

/**
 * Preflight commitment level
 */
export const PREFLIGHT_COMMITMENT: Commitment = 
  (process.env.NEXT_PUBLIC_PREFLIGHT_COMMITMENT as Commitment) || 'processed';

/**
 * Skip preflight checks
 */
export const SKIP_PREFLIGHT = 
  process.env.NEXT_PUBLIC_SKIP_PREFLIGHT === 'true' || false;

// ==============================================
// PDA Seeds (from smart contract)
// ==============================================

/**
 * Game PDA seed
 * Derivation: ["game", authority, gameId]
 */
export const GAME_SEED = Buffer.from('game');

/**
 * PlayerState PDA seed
 * Derivation: ["player", game, player]
 */
export const PLAYER_SEED = Buffer.from('player');

// ==============================================
// Game Configuration Defaults
// ==============================================

/**
 * Default small blind amount (in chips)
 */
export const DEFAULT_SMALL_BLIND = 
  Number(process.env.NEXT_PUBLIC_DEFAULT_SMALL_BLIND) || 10;

/**
 * Default big blind amount (in chips)
 */
export const DEFAULT_BIG_BLIND = 
  Number(process.env.NEXT_PUBLIC_DEFAULT_BIG_BLIND) || 20;

/**
 * Default minimum buy-in (in chips)
 * Must be at least 50 big blinds
 */
export const DEFAULT_MIN_BUY_IN = 
  Number(process.env.NEXT_PUBLIC_DEFAULT_MIN_BUY_IN) || 1000;

/**
 * Default maximum buy-in (in chips)
 */
export const DEFAULT_MAX_BUY_IN = 
  Number(process.env.NEXT_PUBLIC_DEFAULT_MAX_BUY_IN) || 50000;

/**
 * Default maximum number of players (2-6)
 */
export const DEFAULT_MAX_PLAYERS = 
  Number(process.env.NEXT_PUBLIC_DEFAULT_MAX_PLAYERS) || 6;

/**
 * Maximum players allowed (contract constraint)
 */
export const MAX_PLAYERS = 6;

/**
 * Minimum players required to start a game
 */
export const MIN_PLAYERS = 2;

/**
 * Minimum buy-in multiplier (in big blinds)
 */
export const MIN_BUY_IN_BB_MULTIPLIER = 50;

// ==============================================
// Timeout Configuration
// ==============================================

/**
 * Player action timeout (in seconds)
 */
export const PLAYER_TIMEOUT_SECONDS = 
  Number(process.env.NEXT_PUBLIC_PLAYER_TIMEOUT_SECONDS) || 30;

/**
 * Transaction confirmation timeout (in milliseconds)
 */
export const TRANSACTION_TIMEOUT_MS = 
  Number(process.env.NEXT_PUBLIC_TRANSACTION_TIMEOUT_MS) || 60000;

/**
 * RPC request timeout (in milliseconds)
 */
export const RPC_TIMEOUT_MS = 30000;

// ==============================================
// Arcium MPC Configuration
// ==============================================

/**
 * MPC enabled flag
 * Note: Dual-mode architecture automatically falls back to mock if MXE accounts not provided
 */
export const MPC_ENABLED = 
  process.env.NEXT_PUBLIC_MPC_ENABLED === 'true' || false;

/**
 * Arcium MXE Program ID (for real MPC computation)
 * In Arcium's architecture, your Solana program IS the MXE
 * 
 * Status: ✅ DEPLOYED on Devnet
 * - MXE Account initialized: 5ZX1gbRCpPmzMbrNU3s8NTZe1BueYCndbsctQtkurPEKVjpZdoRaRjpHz6gqj5b9n2pfYrPARNzdzUWtvq4YoZET
 * - Cluster offset: 1078779259 (Arcium devnet cluster)
 * - Computation definitions: [1] (shuffle_deck circuit)
 * 
 * The smart contract has dual-mode support:
 * - With MXE accounts: Uses real Arcium MPC network ✅ AVAILABLE NOW
 * - Without MXE accounts: Uses deterministic mock (for testing)
 */
export const MPC_PROGRAM_ID = process.env.NEXT_PUBLIC_MPC_PROGRAM_ID
  ? new PublicKey(process.env.NEXT_PUBLIC_MPC_PROGRAM_ID)
  : PROGRAM_ID; // Same as poker program - your program IS the MXE!

/**
 * MPC callback URL for receiving computation results
 */
export const MPC_CALLBACK_URL = 
  process.env.NEXT_PUBLIC_MPC_CALLBACK_URL || '';

// ==============================================
// Card Configuration
// ==============================================

/**
 * Total number of cards in a deck
 */
export const DECK_SIZE = 52;

/**
 * Number of hole cards per player
 */
export const HOLE_CARDS_COUNT = 2;

/**
 * Number of community cards
 */
export const COMMUNITY_CARDS_COUNT = 5;

/**
 * Cards revealed at Flop
 */
export const FLOP_CARDS_COUNT = 3;

/**
 * Cards revealed at Turn
 */
export const TURN_CARDS_COUNT = 1;

/**
 * Cards revealed at River
 */
export const RIVER_CARDS_COUNT = 1;

// ==============================================
// Feature Flags
// ==============================================

/**
 * Enable statistics tracking
 */
export const ENABLE_STATISTICS = 
  process.env.NEXT_PUBLIC_ENABLE_STATISTICS === 'true' || true;

/**
 * Enable tournament mode
 */
export const ENABLE_TOURNAMENTS = 
  process.env.NEXT_PUBLIC_ENABLE_TOURNAMENTS === 'true' || false;

/**
 * Enable leaderboard
 */
export const ENABLE_LEADERBOARD = 
  process.env.NEXT_PUBLIC_ENABLE_LEADERBOARD === 'true' || false;

/**
 * Enable chat
 */
export const ENABLE_CHAT = 
  process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true' || false;

// ==============================================
// UI Configuration
// ==============================================

/**
 * Application name
 */
export const APP_NAME = 
  process.env.NEXT_PUBLIC_APP_NAME || 'Arcium Poker';

/**
 * Application description
 */
export const APP_DESCRIPTION = 
  process.env.NEXT_PUBLIC_APP_DESCRIPTION || 
  'Decentralized Texas Hold\'em Poker with MPC';

/**
 * Default theme
 */
export const DEFAULT_THEME = 
  process.env.NEXT_PUBLIC_THEME || 'dark';

// ==============================================
// Development/Debug Settings
// ==============================================

/**
 * Debug mode flag
 */
export const DEBUG_MODE = 
  process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || false;

/**
 * Show transaction logs
 */
export const SHOW_TRANSACTION_LOGS = 
  process.env.NEXT_PUBLIC_SHOW_TRANSACTION_LOGS === 'true' || false;

/**
 * Enable dev tools
 */
export const ENABLE_DEVTOOLS = 
  process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true' || false;

// ==============================================
// Social/Contact
// ==============================================

/**
 * GitHub repository URL
 */
export const GITHUB_URL = 
  process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/ANAVHEOBA';

/**
 * Twitter profile URL
 */
export const TWITTER_URL = 
  process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/AnavheobaDEV';

/**
 * Discord username
 */
export const DISCORD_USERNAME = 
  process.env.NEXT_PUBLIC_DISCORD_USERNAME || 'anavheoba_17';

// ==============================================
// Utility Functions
// ==============================================

/**
 * Get explorer URL for an address
 */
export function getExplorerUrl(address: string, type: 'address' | 'tx' = 'address'): string {
  return `${EXPLORER_URL}/${type}/${address}?cluster=${SOLANA_NETWORK}`;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
