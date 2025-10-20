# 🏗️ Arcium Poker Frontend - Modular Architecture

## Overview
This document outlines the modular architecture for the Arcium Poker frontend integration, mirroring the smart contract's structure for consistency and maintainability.

---

## 📁 Project Structure

```
src/
├── lib/                          # Core library modules
│   ├── connection/               # Blockchain connection layer
│   │   ├── program.ts           # Anchor program initialization
│   │   ├── wallet.ts            # Wallet adapter integration
│   │   ├── rpc.ts               # RPC connection management
│   │   └── mod.ts               # Module exports
│   │
│   ├── game/                     # Game lifecycle management
│   │   ├── initialize.ts        # Game creation & initialization
│   │   ├── start.ts             # Game start & deck shuffle
│   │   ├── flow.ts              # Stage transitions (PreFlop→Flop→Turn→River)
│   │   ├── logic.ts             # Game logic & rules
│   │   ├── state.ts             # Game state queries
│   │   └── mod.ts               # Module exports
│   │
│   ├── player/                   # Player management
│   │   ├── join.ts              # Player join game
│   │   ├── leave.ts             # Player leave game
│   │   ├── actions.ts           # Player action handler (fold/check/call/bet/raise/allin)
│   │   ├── state.ts             # Player state queries
│   │   └── mod.ts               # Module exports
│   │
│   ├── betting/                  # Betting system
│   │   ├── instruction.ts       # Betting instruction builders
│   │   ├── pot-manager.ts       # Pot & side pot calculations
│   │   ├── validator.ts         # Bet validation logic
│   │   ├── state.ts             # Betting state queries
│   │   └── mod.ts               # Module exports
│   │
│   ├── cards/                    # Card management
│   │   ├── deck.ts              # Deck representation & utilities
│   │   ├── dealing.ts           # Card dealing logic
│   │   ├── evaluator.ts         # Hand evaluation (poker hands)
│   │   ├── reveal.ts            # Card reveal logic
│   │   └── mod.ts               # Module exports
│   │
│   ├── showdown/                 # Showdown & winner determination
│   │   ├── instruction.ts       # Showdown instruction builders
│   │   ├── winner.ts            # Winner determination logic
│   │   ├── payout.ts            # Pot distribution logic
│   │   └── mod.ts               # Module exports
│   │
│   ├── arcium/                   # Arcium MPC integration
│   │   ├── integration.ts       # MPC integration layer
│   │   ├── mpc-shuffle.ts       # Encrypted deck shuffle
│   │   ├── mpc-deal.ts          # Encrypted card dealing
│   │   ├── mpc-reveal.ts        # Encrypted card reveal
│   │   └── mod.ts               # Module exports
│   │
│   ├── security/                 # Security & validation
│   │   ├── validation.ts        # Input validation
│   │   ├── integrity.ts         # State integrity checks
│   │   ├── zkp.ts               # Zero-knowledge proof utilities
│   │   └── mod.ts               # Module exports
│   │
│   ├── token/                    # Token/escrow management
│   │   ├── escrow.ts            # Escrow account management
│   │   ├── conversion.ts        # Token conversion utilities
│   │   ├── withdrawal.ts        # Withdrawal logic
│   │   └── mod.ts               # Module exports
│   │
│   ├── shared/                   # Shared utilities
│   │   ├── constants.ts         # Constants (program ID, defaults, etc.)
│   │   ├── errors.ts            # Error types & handling
│   │   ├── types.ts             # TypeScript types from IDL
│   │   ├── utils.ts             # Utility functions
│   │   └── mod.ts               # Module exports
│   │
│   └── index.ts                  # Main library export
│
├── __tests__/                    # Test suite (mirrors lib structure)
│   ├── game/
│   │   ├── initialize.test.ts
│   │   ├── start.test.ts
│   │   └── flow.test.ts
│   ├── player/
│   │   ├── join.test.ts
│   │   ├── leave.test.ts
│   │   └── actions.test.ts
│   ├── betting/
│   │   ├── actions.test.ts
│   │   ├── pot-manager.test.ts
│   │   └── side-pots.test.ts
│   ├── cards/
│   │   ├── deck.test.ts
│   │   └── dealing.test.ts
│   ├── showdown/
│   │   ├── winner.test.ts
│   │   └── payout.test.ts
│   └── integration/
│       ├── full-game-flow.test.ts
│       └── edge-cases.test.ts
│
├── components/                   # React components
│   ├── game/
│   ├── player/
│   └── ui/
│
├── hooks/                        # React hooks
│   ├── useGame.ts
│   ├── usePlayer.ts
│   └── useBetting.ts
│
└── arcium_poker.json            # IDL file

```

---

## 📦 Module Breakdown

### 1. **Connection Module** (`lib/connection/`)

**Purpose**: Handle all blockchain connection concerns

#### `program.ts`
```typescript
export class ProgramClient {
  // Initialize Anchor program
  static async initialize(wallet: Wallet): Promise<Program<ArciumPoker>>
  
  // Get program instance
  static getProgram(): Program<ArciumPoker>
  
  // Derive PDAs
  static deriveGamePDA(authority: PublicKey, gameId: BN): [PublicKey, number]
  static derivePlayerStatePDA(game: PublicKey, player: PublicKey): [PublicKey, number]
}
```

#### `wallet.ts`
```typescript
export class WalletClient {
  // Get wallet adapters
  static getAdapters(): Adapter[]
  
  // Connect wallet
  static async connect(): Promise<Wallet>
  
  // Sign transaction
  static async signTransaction(tx: Transaction): Promise<Transaction>
}
```

#### `rpc.ts`
```typescript
export class RPCClient {
  // Get connection
  static getConnection(): Connection
  
  // Confirm transaction
  static async confirmTransaction(signature: string): Promise<void>
  
  // Get account info
  static async getAccountInfo(pubkey: PublicKey): Promise<AccountInfo>
}
```

**Tests**: Connection initialization, PDA derivation, transaction confirmation

---

### 2. **Game Module** (`lib/game/`)

**Purpose**: Game lifecycle and state management

#### `initialize.ts`
```typescript
export class GameInitializer {
  // Initialize new game
  async initializeGame(params: InitGameParams): Promise<InitGameResult>
  
  // Validate game parameters
  validateGameParams(params: InitGameParams): ValidationResult
}

interface InitGameParams {
  gameId: number;
  smallBlind?: number;
  bigBlind?: number;
  minBuyIn?: number;
  maxBuyIn?: number;
  maxPlayers?: number;
}
```

**Maps to**: `initialize_game` instruction
**Tests**: `test_game_initialization.ts` scenarios

#### `start.ts`
```typescript
export class GameStarter {
  // Start game (trigger shuffle)
  async startGame(gameId: string, playerEntropy: Uint8Array[]): Promise<TxResult>
  
  // Validate can start
  canStartGame(game: Game): boolean
}
```

**Maps to**: `start_game` instruction
**Tests**: `test_game_flow.ts` - start game scenarios

#### `flow.ts`
```typescript
export class GameFlow {
  // Advance to next stage
  async advanceStage(gameId: string): Promise<TxResult>
  
  // Get next stage
  getNextStage(currentStage: GameStage): GameStage
  
  // Check if betting round complete
  isBettingRoundComplete(game: Game): boolean
}
```

**Maps to**: `advance_stage` instruction
**Tests**: `test_game_flow.ts` - stage transitions

#### `logic.ts`
```typescript
export class GameLogic {
  // Determine if game should end
  shouldEndGame(game: Game): boolean
  
  // Get active player count
  getActivePlayerCount(game: Game): number
  
  // Get next player index
  getNextPlayerIndex(game: Game): number
}
```

**Tests**: Game logic validation

#### `state.ts`
```typescript
export class GameState {
  // Fetch game account
  async getGame(gameId: string): Promise<Game>
  
  // Get game stage
  async getGameStage(gameId: string): Promise<GameStage>
  
  // Get community cards
  async getCommunityCards(gameId: string): Promise<number[]>
  
  // Subscribe to game updates
  subscribeToGame(gameId: string, callback: (game: Game) => void): number
}
```

**Tests**: State queries and subscriptions

---

### 3. **Player Module** (`lib/player/`)

**Purpose**: Player actions and state management

#### `join.ts`
```typescript
export class PlayerJoin {
  // Join game
  async joinGame(gameId: string, buyIn: number): Promise<JoinResult>
  
  // Validate buy-in
  validateBuyIn(game: Game, buyIn: number): ValidationResult
  
  // Check if game is full
  isGameFull(game: Game): boolean
}
```

**Maps to**: `join_game` instruction
**Tests**: `test_player_actions.ts` - join scenarios

#### `leave.ts`
```typescript
export class PlayerLeave {
  // Leave game
  async leaveGame(gameId: string): Promise<TxResult>
  
  // Can leave game
  canLeaveGame(game: Game, player: PlayerState): boolean
}
```

**Maps to**: `leave_game` instruction
**Tests**: `test_player_actions.ts` - leave scenarios

#### `actions.ts`
```typescript
export class PlayerActions {
  // Unified action handler
  async playerAction(gameId: string, action: PlayerActionParam): Promise<TxResult>
  
  // Individual actions
  async fold(gameId: string): Promise<TxResult>
  async check(gameId: string): Promise<TxResult>
  async call(gameId: string): Promise<TxResult>
  async bet(gameId: string, amount: number): Promise<TxResult>
  async raise(gameId: string, amount: number): Promise<TxResult>
  async allIn(gameId: string): Promise<TxResult>
  
  // Validate action
  validateAction(game: Game, player: PlayerState, action: PlayerActionParam): ValidationResult
}
```

**Maps to**: `player_action`, `player_fold`, `player_check`, etc.
**Tests**: `test_betting.ts` - all action scenarios

#### `state.ts`
```typescript
export class PlayerStateManager {
  // Get player state
  async getPlayerState(gameId: string, playerId: string): Promise<PlayerState>
  
  // Get all players
  async getAllPlayers(gameId: string): Promise<PlayerState[]>
  
  // Check if player's turn
  async isPlayerTurn(gameId: string, playerId: string): Promise<boolean>
  
  // Subscribe to player updates
  subscribeToPlayer(gameId: string, playerId: string, callback: (state: PlayerState) => void): number
}
```

**Tests**: Player state queries

---

### 4. **Betting Module** (`lib/betting/`)

**Purpose**: Betting logic, pot management, validation

#### `instruction.ts`
```typescript
export class BettingInstructions {
  // Build betting instruction
  buildBettingInstruction(
    game: PublicKey,
    player: PublicKey,
    action: PlayerActionParam
  ): TransactionInstruction
}
```

#### `pot-manager.ts`
```typescript
export class PotManager {
  // Calculate pot
  calculatePot(game: Game, players: PlayerState[]): number
  
  // Calculate side pots
  calculateSidePots(players: PlayerState[]): SidePot[]
  
  // Get pot odds
  getPotOdds(pot: number, callAmount: number): number
}
```

**Tests**: `test_side_pots.ts` - side pot scenarios

#### `validator.ts`
```typescript
export class BettingValidator {
  // Validate bet amount
  validateBetAmount(game: Game, player: PlayerState, amount: number): ValidationResult
  
  // Validate raise amount
  validateRaiseAmount(game: Game, player: PlayerState, amount: number): ValidationResult
  
  // Can check
  canCheck(game: Game, player: PlayerState): boolean
  
  // Can call
  canCall(game: Game, player: PlayerState): boolean
}
```

**Tests**: `test_betting.ts` - validation scenarios

#### `state.ts`
```typescript
export class BettingState {
  // Get current bet
  getCurrentBet(game: Game): number
  
  // Get pot info
  async getPotInfo(gameId: string): Promise<PotInfo>
  
  // Get call amount for player
  getCallAmount(game: Game, player: PlayerState): number
}
```

---

### 5. **Cards Module** (`lib/cards/`)

**Purpose**: Card representation, dealing, evaluation

#### `deck.ts`
```typescript
export class Deck {
  // Card representation
  static readonly CARDS = [...]; // 52 cards
  
  // Get card string (e.g., "As", "Kh")
  static getCardString(cardIndex: number): string
  
  // Get card rank and suit
  static getCardRank(cardIndex: number): number
  static getCardSuit(cardIndex: number): string
}
```

#### `dealing.ts`
```typescript
export class CardDealer {
  // Deal hole cards
  dealHoleCards(deck: number[], playerCount: number): number[][]
  
  // Deal community cards
  dealCommunityCards(deck: number[], count: number): number[]
}
```

#### `evaluator.ts`
```typescript
export class HandEvaluator {
  // Evaluate hand
  evaluateHand(holeCards: number[], communityCards: number[]): HandRank
  
  // Compare hands
  compareHands(hand1: HandRank, hand2: HandRank): number
  
  // Get hand name
  getHandName(rank: HandRank): string
}

enum HandRank {
  HighCard,
  OnePair,
  TwoPair,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
  RoyalFlush
}
```

#### `reveal.ts`
```typescript
export class CardRevealer {
  // Reveal cards at showdown
  async revealCards(gameId: string, playerId: string): Promise<number[]>
}
```

---

### 6. **Showdown Module** (`lib/showdown/`)

**Purpose**: Winner determination and payout

#### `instruction.ts`
```typescript
export class ShowdownInstructions {
  // Build showdown instruction
  buildShowdownInstruction(
    game: PublicKey,
    player: PublicKey
  ): TransactionInstruction
}
```

#### `winner.ts`
```typescript
export class WinnerDetermination {
  // Determine winner(s)
  determineWinners(players: PlayerState[], communityCards: number[]): Winner[]
  
  // Handle split pot
  handleSplitPot(winners: Winner[], pot: number): Payout[]
}
```

#### `payout.ts`
```typescript
export class PayoutManager {
  // Calculate payouts
  calculatePayouts(winners: Winner[], pot: number, sidePots: SidePot[]): Payout[]
  
  // Execute payout
  async executePayout(gameId: string, payouts: Payout[]): Promise<TxResult>
}
```

**Maps to**: `execute_showdown` instruction
**Tests**: Showdown and payout scenarios

---

### 7. **Arcium Module** (`lib/arcium/`)

**Purpose**: MPC integration for encrypted operations

#### `integration.ts`
```typescript
export class ArciumIntegration {
  // Check if MPC is available
  isMPCAvailable(): boolean
  
  // Get MPC program ID
  getMPCProgramId(): PublicKey | null
  
  // Initialize MPC session
  async initializeMPCSession(): Promise<string>
}
```

#### `mpc-shuffle.ts`
```typescript
export class MPCShuffle {
  // Shuffle deck with MPC
  async shuffleDeck(gameId: string, playerEntropy: Uint8Array[]): Promise<ShuffleResult>
  
  // Fallback to mock shuffle
  mockShuffle(playerEntropy: Uint8Array[]): Uint8Array
}
```

#### `mpc-deal.ts`
```typescript
export class MPCDeal {
  // Deal cards with MPC
  async dealCards(gameId: string, playerCount: number): Promise<DealResult>
}
```

#### `mpc-reveal.ts`
```typescript
export class MPCReveal {
  // Reveal cards with MPC
  async revealCards(gameId: string, playerId: string): Promise<number[]>
}
```

**Tests**: `test_mxe_integration.ts` scenarios

---

### 8. **Security Module** (`lib/security/`)

**Purpose**: Validation, integrity checks, ZKP

#### `validation.ts`
```typescript
export class SecurityValidator {
  // Validate transaction
  validateTransaction(tx: Transaction): ValidationResult
  
  // Validate account ownership
  validateAccountOwnership(account: PublicKey, owner: PublicKey): boolean
  
  // Validate PDA
  validatePDA(pda: PublicKey, seeds: Buffer[], programId: PublicKey): boolean
}
```

#### `integrity.ts`
```typescript
export class IntegrityChecker {
  // Check game state integrity
  checkGameIntegrity(game: Game, players: PlayerState[]): IntegrityResult
  
  // Verify chip conservation
  verifyChipConservation(game: Game, players: PlayerState[]): boolean
}
```

**Tests**: `test_edge_cases.ts` - chip conservation

#### `zkp.ts`
```typescript
export class ZKPUtilities {
  // Generate proof
  generateProof(data: any): Proof
  
  // Verify proof
  verifyProof(proof: Proof): boolean
}
```

---

### 9. **Token Module** (`lib/token/`)

**Purpose**: Token/escrow management (future feature)

#### `escrow.ts`
```typescript
export class EscrowManager {
  // Create escrow account
  async createEscrow(gameId: string): Promise<PublicKey>
  
  // Deposit to escrow
  async deposit(escrow: PublicKey, amount: number): Promise<TxResult>
  
  // Release from escrow
  async release(escrow: PublicKey, recipient: PublicKey, amount: number): Promise<TxResult>
}
```

#### `conversion.ts`
```typescript
export class TokenConverter {
  // Convert SOL to chips
  solToChips(sol: number): number
  
  // Convert chips to SOL
  chipsToSol(chips: number): number
}
```

#### `withdrawal.ts`
```typescript
export class WithdrawalManager {
  // Withdraw winnings
  async withdraw(gameId: string, amount: number): Promise<TxResult>
}
```

---

### 10. **Shared Module** (`lib/shared/`)

**Purpose**: Common utilities, types, constants

#### `constants.ts`
```typescript
export const PROGRAM_ID = new PublicKey("DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm");
export const RPC_ENDPOINT = "https://api.devnet.solana.com";
export const NETWORK = "devnet";

export const DEFAULT_SMALL_BLIND = 10;
export const DEFAULT_BIG_BLIND = 20;
export const DEFAULT_MIN_BUY_IN = 1000;
export const DEFAULT_MAX_BUY_IN = 50000;
export const DEFAULT_MAX_PLAYERS = 6;

export const TIMEOUT_DURATION = 30; // seconds
```

#### `errors.ts`
```typescript
export class PokerError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

export const ERROR_CODES = {
  GameFull: 6000,
  NotEnoughPlayers: 6001,
  GameAlreadyStarted: 6002,
  InvalidGameStage: 6003,
  // ... all 23 error codes from IDL
};

export function parseAnchorError(error: any): PokerError {
  // Parse Anchor error and return PokerError
}
```

#### `types.ts`
```typescript
// Import and re-export types from IDL
export interface Game {
  authority: PublicKey;
  gameId: BN;
  stage: GameStage;
  // ... all fields from IDL
}

export interface PlayerState {
  player: PublicKey;
  game: PublicKey;
  seatIndex: number;
  // ... all fields from IDL
}

export enum GameStage {
  Waiting = "Waiting",
  PreFlop = "PreFlop",
  Flop = "Flop",
  Turn = "Turn",
  River = "River",
  Showdown = "Showdown",
  Finished = "Finished"
}

export enum PlayerStatus {
  Waiting = "Waiting",
  Active = "Active",
  Folded = "Folded",
  AllIn = "AllIn",
  Left = "Left"
}

export type PlayerActionParam = 
  | { fold: {} }
  | { check: {} }
  | { call: {} }
  | { bet: { amount: BN } }
  | { raise: { amount: BN } }
  | { allIn: {} };
```

#### `utils.ts`
```typescript
export class Utils {
  // Format lamports to SOL
  static lamportsToSol(lamports: number): number
  
  // Format SOL to lamports
  static solToLamports(sol: number): number
  
  // Sleep utility
  static sleep(ms: number): Promise<void>
  
  // Retry with backoff
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T>
}
```

---

## 🔄 Module Dependencies

```
connection/
  └─ (no dependencies)

shared/
  └─ connection/

game/
  ├─ connection/
  ├─ shared/
  └─ arcium/

player/
  ├─ connection/
  ├─ shared/
  └─ game/

betting/
  ├─ connection/
  ├─ shared/
  ├─ game/
  └─ player/

cards/
  ├─ shared/
  └─ arcium/

showdown/
  ├─ connection/
  ├─ shared/
  ├─ game/
  ├─ player/
  ├─ betting/
  └─ cards/

arcium/
  ├─ connection/
  └─ shared/

security/
  ├─ connection/
  └─ shared/

token/
  ├─ connection/
  └─ shared/
```

---

## 📝 Module Export Pattern

Each module has a `mod.ts` file that exports all public APIs:

```typescript
// lib/game/mod.ts
export * from './initialize';
export * from './start';
export * from './flow';
export * from './logic';
export * from './state';
```

Main library export (`lib/index.ts`):
```typescript
// Re-export all modules
export * as Connection from './connection/mod';
export * as Game from './game/mod';
export * as Player from './player/mod';
export * as Betting from './betting/mod';
export * as Cards from './cards/mod';
export * as Showdown from './showdown/mod';
export * as Arcium from './arcium/mod';
export * as Security from './security/mod';
export * as Token from './token/mod';
export * as Shared from './shared/mod';
```

Usage in application:
```typescript
import { Game, Player, Betting } from '@/lib';

// Initialize game
const result = await Game.GameInitializer.initializeGame({...});

// Join game
await Player.PlayerJoin.joinGame(gameId, buyIn);

// Make action
await Betting.PlayerActions.fold(gameId);
```

---

## 🧪 Testing Strategy

### Unit Tests
Each module has corresponding unit tests:
- Test individual functions in isolation
- Mock dependencies
- Cover edge cases

### Integration Tests
Test module interactions:
- `full-game-flow.test.ts` - Complete game from start to finish
- `edge-cases.test.ts` - Edge cases and error scenarios

### Test Mapping to Smart Contract Tests

| Frontend Test | Smart Contract Test | Coverage |
|--------------|---------------------|----------|
| `game/initialize.test.ts` | `test_game_initialization.ts` | Game creation validation |
| `game/start.test.ts` | `test_game_flow.ts` | Game start scenarios |
| `game/flow.test.ts` | `test_game_flow.ts` | Stage transitions |
| `player/join.test.ts` | `test_player_actions.ts` | Join game scenarios |
| `player/leave.test.ts` | `test_player_actions.ts` | Leave game scenarios |
| `player/actions.test.ts` | `test_betting.ts` | Player actions |
| `betting/actions.test.ts` | `test_betting.ts` | Betting validation |
| `betting/side-pots.test.ts` | `test_side_pots.ts` | Side pot logic |
| `integration/edge-cases.test.ts` | `test_edge_cases.ts` | Security & edge cases |

---

## 🚀 Implementation Order

### Phase 1: Foundation (Week 1)
1. ✅ Setup project structure
2. `shared/` module (constants, types, errors, utils)
3. `connection/` module (program, wallet, rpc)
4. Write tests for foundation

### Phase 2: Core Game Logic (Week 2)
5. `game/initialize.ts` + tests
6. `game/start.ts` + tests
7. `game/flow.ts` + tests
8. `game/state.ts` + tests
9. `game/logic.ts` + tests

### Phase 3: Player Management (Week 3)
10. `player/join.ts` + tests
11. `player/leave.ts` + tests
12. `player/state.ts` + tests
13. `player/actions.ts` + tests

### Phase 4: Betting System (Week 4)
14. `betting/validator.ts` + tests
15. `betting/instruction.ts` + tests
16. `betting/pot-manager.ts` + tests
17. `betting/state.ts` + tests

### Phase 5: Cards & Showdown (Week 5)
18. `cards/deck.ts` + tests
19. `cards/dealing.ts` + tests
20. `cards/evaluator.ts` + tests
21. `showdown/winner.ts` + tests
22. `showdown/payout.ts` + tests

### Phase 6: Advanced Features (Week 6)
23. `arcium/` module (MPC integration)
24. `security/` module (validation, integrity)
25. `token/` module (escrow, future feature)

### Phase 7: Integration & Polish (Week 7)
26. Integration tests
27. UI components
28. React hooks
29. End-to-end testing
30. Documentation

---

## 🎯 Key Principles

1. **Modularity**: Each module is self-contained and testable
2. **Separation of Concerns**: Clear boundaries between modules
3. **Test-Driven**: Write tests before implementation
4. **Type Safety**: Full TypeScript coverage
5. **Mirroring**: Structure mirrors smart contract for consistency
6. **Reusability**: Modules can be used independently
7. **Maintainability**: Easy to understand and modify

---

## 📚 Documentation

Each module should have:
- **README.md**: Module overview and usage
- **API.md**: Detailed API documentation
- **EXAMPLES.md**: Usage examples

---

**Built with ❤️ for Arcium Poker**
