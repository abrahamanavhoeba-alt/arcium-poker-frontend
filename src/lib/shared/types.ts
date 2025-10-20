/**
 * Arcium Poker - Type Definitions
 * 
 * TypeScript types derived from the smart contract IDL.
 * These types match the on-chain account structures.
 */

import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// ==============================================
// Enums
// ==============================================

/**
 * Game stage/phase (from IDL lines 1285-1314)
 */
export enum GameStage {
  Waiting = 'Waiting',
  PreFlop = 'PreFlop',
  Flop = 'Flop',
  Turn = 'Turn',
  River = 'River',
  Showdown = 'Showdown',
  Finished = 'Finished',
}

/**
 * Player status in current hand (from IDL lines 1476-1499)
 */
export enum PlayerStatus {
  Waiting = 'Waiting',
  Active = 'Active',
  Folded = 'Folded',
  AllIn = 'AllIn',
  Left = 'Left',
}

// ==============================================
// Player Action Types
// ==============================================

/**
 * Player action parameter (from IDL lines 1317-1355)
 * Unified action type for all player moves
 */
export type PlayerActionParam =
  | { fold: {} }
  | { check: {} }
  | { call: {} }
  | { bet: { amount: BN } }
  | { raise: { amount: BN } }
  | { allIn: {} };

/**
 * Helper type for action names
 */
export type PlayerActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allIn';

// ==============================================
// Account Types
// ==============================================

/**
 * Main game account (from IDL lines 1072-1282)
 * Represents the on-chain game state
 */
export interface Game {
  /** Game authority (creator) */
  authority: PublicKey;
  
  /** Unique game ID */
  gameId: BN;
  
  /** Current game stage */
  stage: GameStage;
  
  /** Small blind amount */
  smallBlind: BN;
  
  /** Big blind amount */
  bigBlind: BN;
  
  /** Minimum buy-in */
  minBuyIn: BN;
  
  /** Maximum buy-in */
  maxBuyIn: BN;
  
  /** Maximum number of players (4-6) */
  maxPlayers: number;
  
  /** Current number of players */
  playerCount: number;
  
  /** Player public keys (seats) - array of 6 */
  players: PublicKey[];
  
  /** Active player flags - array of 6 booleans */
  activePlayers: boolean[];
  
  /** Current dealer button position */
  dealerPosition: number;
  
  /** Current active player (whose turn it is) */
  currentPlayerIndex: number;
  
  /** Total pot amount */
  pot: BN;
  
  /** Current bet amount in this round */
  currentBet: BN;
  
  /** Players who have acted in current betting round */
  playersActed: boolean[];
  
  /** Community cards (encrypted indices) - array of 5 */
  communityCards: number[];
  
  /** Number of community cards revealed */
  communityCardsRevealed: number;
  
  /** Encrypted deck state (managed by Arcium MPC) - array of 32 bytes */
  encryptedDeck: number[];
  
  /** Deck initialized flag */
  deckInitialized: boolean;
  
  /** Game started timestamp */
  startedAt: BN;
  
  /** Last action timestamp */
  lastActionAt: BN;
  
  /** Shuffle session ID from Arcium MPC - array of 32 bytes */
  shuffleSessionId: number[];
  
  /** Game bump seed */
  bump: number;
}

/**
 * Player state account (from IDL lines 1357-1473)
 * PDA per player per game
 */
export interface PlayerState {
  /** Player's public key */
  player: PublicKey;
  
  /** Game this player belongs to */
  game: PublicKey;
  
  /** Player's seat index in the game */
  seatIndex: number;
  
  /** Player status */
  status: PlayerStatus;
  
  /** Player's chip stack */
  chipStack: BN;
  
  /** Current bet in this round */
  currentBet: BN;
  
  /** Total contribution to pot this hand */
  totalBetThisHand: BN;
  
  /** Encrypted hole cards (indices in deck) - array of 2 */
  encryptedHoleCards: number[];
  
  /** Has cards been dealt to this player */
  hasCards: boolean;
  
  /** Player folded in current hand */
  hasFolded: boolean;
  
  /** Player is all-in */
  isAllIn: boolean;
  
  /** Timestamp when player joined */
  joinedAt: BN;
  
  /** Last action timestamp */
  lastActionAt: BN;
  
  /** Bump seed for PDA */
  bump: number;
}

// ==============================================
// Helper Types
// ==============================================

/**
 * Game initialization parameters
 */
export interface InitGameParams {
  gameId: number | BN;
  smallBlind?: number | BN;
  bigBlind?: number | BN;
  minBuyIn?: number | BN;
  maxBuyIn?: number | BN;
  maxPlayers?: number;
}

/**
 * Join game parameters
 */
export interface JoinGameParams {
  gameId: string;
  buyIn: number | BN;
}

/**
 * Transaction result
 */
export interface TxResult {
  signature: string;
  success: boolean;
  error?: Error;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Side pot information
 */
export interface SidePot {
  amount: BN;
  eligiblePlayers: PublicKey[];
}

/**
 * Winner information
 */
export interface Winner {
  player: PublicKey;
  handRank: HandRank;
  winAmount: BN;
}

/**
 * Payout information
 */
export interface Payout {
  player: PublicKey;
  amount: BN;
}

/**
 * Hand rank for poker evaluation
 */
export enum HandRank {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

/**
 * Hand evaluation result
 */
export interface HandEvaluation {
  rank: HandRank;
  value: number;
  description: string;
}

/**
 * Pot information
 */
export interface PotInfo {
  mainPot: BN;
  sidePots: SidePot[];
  totalPot: BN;
}

/**
 * Game statistics
 */
export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: BN;
  biggestPot: BN;
  handsPlayed: number;
}

/**
 * Player action history
 */
export interface ActionHistory {
  player: PublicKey;
  action: PlayerActionType;
  amount?: BN;
  timestamp: BN;
  stage: GameStage;
}

// ==============================================
// Type Guards
// ==============================================

/**
 * Check if value is a valid GameStage
 */
export function isGameStage(value: any): value is GameStage {
  return Object.values(GameStage).includes(value);
}

/**
 * Check if value is a valid PlayerStatus
 */
export function isPlayerStatus(value: any): value is PlayerStatus {
  return Object.values(PlayerStatus).includes(value);
}

/**
 * Check if value is a valid HandRank
 */
export function isHandRank(value: any): value is HandRank {
  return Object.values(HandRank).includes(value);
}

// ==============================================
// Type Conversion Helpers
// ==============================================

/**
 * Convert number to BN
 */
export function toBN(value: number | BN): BN {
  return typeof value === 'number' ? new BN(value) : value;
}

/**
 * Convert BN to number (safe for display)
 */
export function fromBN(value: BN): number {
  return value.toNumber();
}

/**
 * Convert PublicKey to string
 */
export function pubkeyToString(pubkey: PublicKey): string {
  return pubkey.toBase58();
}

/**
 * Convert string to PublicKey
 */
export function stringToPubkey(str: string): PublicKey {
  return new PublicKey(str);
}
