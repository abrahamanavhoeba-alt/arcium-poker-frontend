# 🎯 Arcium Poker Frontend Integration Flow

## Overview
This document outlines the step-by-step integration flow for connecting the Arcium Poker smart contract to the frontend, following a test-driven development (TDD) approach.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Phase 1: Foundation Setup](#phase-1-foundation-setup)
3. [Phase 2: Connection Layer](#phase-2-connection-layer)
4. [Phase 3: Service Layer Implementation](#phase-3-service-layer-implementation)
5. [Phase 4: UI Integration](#phase-4-ui-integration)
6. [Phase 5: End-to-End Testing](#phase-5-end-to-end-testing)

---

## Prerequisites

### Smart Contract Information
- **Program ID**: `DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm`
- **Network**: Solana Devnet
- **RPC Endpoint**: `https://api.devnet.solana.com`
- **IDL Location**: `/src/arcium_poker.json`

### Required Dependencies
```json
{
  "@solana/web3.js": "^1.87.0",
  "@coral-xyz/anchor": "^0.29.0",
  "@solana/wallet-adapter-base": "^0.9.23",
  "@solana/wallet-adapter-react": "^0.15.35",
  "@solana/wallet-adapter-react-ui": "^0.9.35",
  "@solana/wallet-adapter-wallets": "^0.19.32",
  "bs58": "^5.0.0",
  "jest": "^29.7.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.1.0",
  "ts-jest": "^29.1.0"
}
```

---

## Phase 1: Foundation Setup

### Step 1.1: Install Dependencies
```bash
npm install @solana/web3.js @coral-xyz/anchor @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets bs58
npm install -D jest @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

### Step 1.2: Configure Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_PROGRAM_ID=DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=devnet
```

### Step 1.3: Setup Jest Configuration
Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Step 1.4: Create TypeScript Types
**File**: `src/services/types/index.ts`

Based on the IDL, define:
- `Game` interface
- `PlayerState` interface
- `GameStage` enum
- `PlayerStatus` enum
- `PlayerActionParam` type
- Helper types for transactions

**Test First**: Write type tests to ensure IDL mapping is correct.

---

## Phase 2: Connection Layer

### Step 2.1: Solana Connection Service
**File**: `src/services/solana/connection.ts`

**Purpose**: Manage RPC connection to Solana

**Implementation**:
```typescript
- getConnection(): Connection
- getCommitment(): Commitment
- confirmTransaction(signature: string): Promise<void>
```

**Test**: `src/__tests__/services/connection.test.ts`
- ✅ Test connection initialization
- ✅ Test RPC endpoint configuration
- ✅ Test transaction confirmation

### Step 2.2: Wallet Adapter Service
**File**: `src/services/solana/wallet.ts`

**Purpose**: Handle wallet connection and signing

**Implementation**:
```typescript
- getWalletAdapters(): Adapter[]
- getWalletProvider(): WalletProvider
```

**Test**: Mock wallet for testing
- ✅ Test wallet connection
- ✅ Test signing transactions
- ✅ Test wallet disconnection

### Step 2.3: Anchor Program Service
**File**: `src/services/solana/program.ts`

**Purpose**: Initialize Anchor program with IDL

**Implementation**:
```typescript
- getProgram(wallet: Wallet): Program<ArciumPoker>
- getProgramId(): PublicKey
- derivePDA(seeds: Buffer[]): [PublicKey, number]
```

**Test**: `src/__tests__/services/program.test.ts`
- ✅ Test program initialization
- ✅ Test PDA derivation (Game PDA, PlayerState PDA)
- ✅ Test IDL loading

**Reference from tests**:
```typescript
// Game PDA: ["game", authority, gameId]
// PlayerState PDA: ["player", game, player]
```

---

## Phase 3: Service Layer Implementation

### Step 3.1: Game Service
**File**: `src/services/poker/game.service.ts`

**Methods to Implement** (based on IDL instructions):

#### 3.1.1: `initializeGame()`
**IDL Reference**: `initialize_game` instruction
```typescript
async initializeGame(params: {
  gameId: number;
  smallBlind?: number;
  bigBlind?: number;
  minBuyIn?: number;
  maxBuyIn?: number;
  maxPlayers?: number;
}): Promise<{ signature: string; gamePda: PublicKey }>
```

**Accounts Required**:
- `game` (PDA, writable)
- `authority` (signer, writable)
- `system_program`

**Test Cases** (from `test_game_initialization.ts`):
- ✅ Creates game with default parameters
- ✅ Creates game with custom parameters
- ✅ Fails when big_blind <= small_blind
- ✅ Fails when max_buy_in < min_buy_in
- ✅ Fails when max_players > 6
- ✅ Fails when min_buy_in < 50 big blinds
- ✅ Prevents duplicate game IDs

#### 3.1.2: `startGame()`
**IDL Reference**: `start_game` instruction
```typescript
async startGame(
  gameId: string,
  playerEntropy: Uint8Array[]
): Promise<{ signature: string }>
```

**Accounts Required**:
- `game` (writable)
- `authority` (signer)

**Test Cases** (from `test_game_flow.ts`):
- ✅ Starts game with minimum players (2)
- ✅ Fails when not enough players
- ✅ Fails when game already started
- ✅ Fails when non-authority tries to start
- ✅ Initializes deck and sets stage to PreFlop

#### 3.1.3: `advanceStage()`
**IDL Reference**: `advance_stage` instruction
```typescript
async advanceStage(gameId: string): Promise<{ signature: string }>
```

**Accounts Required**:
- `game` (writable)
- `signer` (any player or authority)

**Test Cases** (from `test_game_flow.ts`):
- ✅ Transitions PreFlop → Flop (reveals 3 cards)
- ✅ Transitions Flop → Turn (reveals 1 card)
- ✅ Transitions Turn → River (reveals 1 card)
- ✅ Transitions River → Showdown

#### 3.1.4: `executeShowdown()`
**IDL Reference**: `execute_showdown` instruction
```typescript
async executeShowdown(
  gameId: string,
  playerId: string
): Promise<{ signature: string }>
```

**Accounts Required**:
- `game` (writable)
- `player_state` (writable, PDA)
- `player` (signer)

**Test Cases**:
- ✅ Reveals cards at showdown
- ✅ Distributes pot to winner
- ✅ Handles side pots correctly

#### 3.1.5: `newHand()`
**IDL Reference**: `new_hand` instruction
```typescript
async newHand(gameId: string): Promise<{ signature: string }>
```

**Accounts Required**:
- `game` (writable)
- `authority` (signer)

**Test Cases** (from `test_game_flow.ts`):
- ✅ Resets game state for new hand
- ✅ Rotates dealer button
- ✅ Clears community cards
- ✅ Resets player bets

#### 3.1.6: `endGame()`
**IDL Reference**: `end_game` instruction
```typescript
async endGame(gameId: string): Promise<{ signature: string }>
```

**Accounts Required**:
- `game` (writable)
- `authority` (signer)

**Test Cases** (from `test_game_flow.ts`):
- ✅ Authority ends game
- ✅ Fails when non-authority tries to end
- ✅ Sets stage to Finished

---

### Step 3.2: Player Service
**File**: `src/services/poker/player.service.ts`

#### 3.2.1: `joinGame()`
**IDL Reference**: `join_game` instruction
```typescript
async joinGame(
  gameId: string,
  buyIn: number
): Promise<{ signature: string; playerStatePda: PublicKey }>
```

**Accounts Required**:
- `game` (writable)
- `player_state` (PDA, writable)
- `player` (signer, writable)
- `system_program`

**Test Cases** (from `test_player_actions.ts`):
- ✅ Player joins with valid buy-in
- ✅ Fails when buy-in < min_buy_in
- ✅ Fails when buy-in > max_buy_in
- ✅ Fails when game is full (6 players)
- ✅ Fails when player tries to join twice
- ✅ Increments player_count

#### 3.2.2: `leaveGame()`
**IDL Reference**: `leave_game` instruction
```typescript
async leaveGame(gameId: string): Promise<{ signature: string }>
```

**Accounts Required**:
- `game` (writable)
- `player_state` (PDA, writable)
- `player` (signer, writable)

**Test Cases** (from `test_player_actions.ts`):
- ✅ Player leaves successfully
- ✅ Returns chips to player
- ✅ Decrements player_count
- ✅ Fails when non-player tries to leave
- ✅ Fails when leaving during active hand

#### 3.2.3: `timeoutPlayer()`
**IDL Reference**: `timeout_player` instruction
```typescript
async timeoutPlayer(
  gameId: string,
  playerId: string
): Promise<{ signature: string }>
```

**Accounts Required**:
- `game` (writable)
- `player_state` (PDA, writable)
- `player` (signer, writable)

**Test Cases** (from `test_edge_cases.ts`):
- ✅ Detects player timeout
- ✅ Auto-folds timed-out player
- ✅ Advances to next player

---

### Step 3.3: Betting Service
**File**: `src/services/poker/betting.service.ts`

#### 3.3.1: `playerAction()` (Unified Handler)
**IDL Reference**: `player_action` instruction
```typescript
async playerAction(
  gameId: string,
  action: PlayerActionParam
): Promise<{ signature: string }>
```

**PlayerActionParam** (from IDL):
```typescript
type PlayerActionParam = 
  | { fold: {} }
  | { check: {} }
  | { call: {} }
  | { bet: { amount: number } }
  | { raise: { amount: number } }
  | { allIn: {} }
```

**Accounts Required**:
- `game` (writable)
- `player_state` (PDA, writable)
- `player` (signer, writable)

**Test Cases** (from `test_betting.ts`):

##### Fold Action:
- ✅ Player folds successfully
- ✅ Sets `has_folded` to true
- ✅ Fails when not player's turn
- ✅ Advances to next player

##### Check Action:
- ✅ Player checks when no bet
- ✅ Fails when there's a bet to call
- ✅ Advances to next player

##### Call Action:
- ✅ Player calls current bet
- ✅ Matches current_bet amount
- ✅ Fails when insufficient chips
- ✅ Auto all-in if chips < call amount

##### Bet Action:
- ✅ Player bets valid amount
- ✅ Sets current_bet
- ✅ Fails when bet > chip_stack
- ✅ Fails when bet < minimum (big blind)

##### Raise Action:
- ✅ Player raises valid amount
- ✅ Raise must be at least 2x current bet
- ✅ Fails when raise < minimum
- ✅ Fails when insufficient chips

##### All-In Action:
- ✅ Player goes all-in
- ✅ Sets `is_all_in` to true
- ✅ Sets `chip_stack` to 0
- ✅ All-in player cannot act again
- ✅ Creates side pots when needed

#### 3.3.2: Individual Action Methods (Optional)
These can call `playerAction()` internally:
```typescript
async fold(gameId: string): Promise<{ signature: string }>
async check(gameId: string): Promise<{ signature: string }>
async call(gameId: string): Promise<{ signature: string }>
async bet(gameId: string, amount: number): Promise<{ signature: string }>
async raise(gameId: string, amount: number): Promise<{ signature: string }>
async allIn(gameId: string): Promise<{ signature: string }>
```

**Test Cases** (from `test_side_pots.ts`):
- ✅ Creates side pots with multiple all-ins
- ✅ Handles 3-way all-in with different stacks
- ✅ Handles 4-way all-in
- ✅ Handles equal stack all-ins
- ✅ Distributes pots correctly at showdown

---

### Step 3.4: Query Service
**File**: `src/services/poker/query.service.ts`

**Purpose**: Read-only operations (no transactions)

#### 3.4.1: `getGame()`
```typescript
async getGame(gameId: string): Promise<Game>
```
**Returns**: Full game state from IDL `Game` account

**Fields** (from IDL):
- `authority`: PublicKey
- `game_id`: number
- `stage`: GameStage
- `small_blind`, `big_blind`: number
- `min_buy_in`, `max_buy_in`: number
- `max_players`, `player_count`: number
- `players`: PublicKey[] (6 seats)
- `active_players`: boolean[] (6 flags)
- `dealer_position`: number
- `current_player_index`: number
- `pot`, `current_bet`: number
- `players_acted`: boolean[] (6 flags)
- `community_cards`: number[] (5 cards)
- `community_cards_revealed`: number
- `encrypted_deck`: Uint8Array (32 bytes)
- `deck_initialized`: boolean
- `started_at`, `last_action_at`: timestamp
- `shuffle_session_id`: Uint8Array (32 bytes)

**Test Cases**:
- ✅ Fetches game by ID
- ✅ Returns null if game doesn't exist
- ✅ Parses all fields correctly

#### 3.4.2: `getPlayerState()`
```typescript
async getPlayerState(
  gameId: string,
  playerId: string
): Promise<PlayerState>
```

**Returns**: Player state from IDL `PlayerState` account

**Fields** (from IDL):
- `player`: PublicKey
- `game`: PublicKey
- `seat_index`: number
- `status`: PlayerStatus
- `chip_stack`: number
- `current_bet`: number
- `total_bet_this_hand`: number
- `encrypted_hole_cards`: number[] (2 cards)
- `has_cards`: boolean
- `has_folded`: boolean
- `is_all_in`: boolean
- `joined_at`, `last_action_at`: timestamp

**Test Cases**:
- ✅ Fetches player state by game and player ID
- ✅ Returns null if player not in game
- ✅ Parses all fields correctly

#### 3.4.3: `getAllPlayers()`
```typescript
async getAllPlayers(gameId: string): Promise<PlayerState[]>
```

**Test Cases**:
- ✅ Fetches all players in game
- ✅ Returns empty array if no players
- ✅ Orders by seat_index

#### 3.4.4: `getGameStage()`
```typescript
async getGameStage(gameId: string): Promise<GameStage>
```

**GameStage** (from IDL):
- `Waiting`
- `PreFlop`
- `Flop`
- `Turn`
- `River`
- `Showdown`
- `Finished`

**Test Cases**:
- ✅ Returns current game stage
- ✅ Handles all stage variants

#### 3.4.5: `getPotInfo()`
```typescript
async getPotInfo(gameId: string): Promise<{
  pot: number;
  currentBet: number;
  sidePots: SidePot[];
}>
```

**Test Cases**:
- ✅ Returns pot and current bet
- ✅ Calculates side pots from player states
- ✅ Handles multiple side pots

#### 3.4.6: `getCommunityCards()`
```typescript
async getCommunityCards(gameId: string): Promise<number[]>
```

**Test Cases**:
- ✅ Returns revealed community cards
- ✅ Returns empty array in PreFlop
- ✅ Returns 3 cards in Flop
- ✅ Returns 4 cards in Turn
- ✅ Returns 5 cards in River

#### 3.4.7: `isPlayerTurn()`
```typescript
async isPlayerTurn(
  gameId: string,
  playerId: string
): Promise<boolean>
```

**Test Cases**:
- ✅ Returns true if player's turn
- ✅ Returns false otherwise
- ✅ Checks current_player_index

#### 3.4.8: `getActivePlayerCount()`
```typescript
async getActivePlayerCount(gameId: string): Promise<number>
```

**Test Cases**:
- ✅ Counts active players (not folded, not left)
- ✅ Excludes all-in players from action count

---

## Phase 4: UI Integration

### Step 4.1: React Hooks
**Location**: `src/hooks/`

#### `useGame(gameId: string)`
```typescript
- Fetches game state
- Subscribes to game updates
- Returns game data and loading state
```

#### `usePlayerState(gameId: string, playerId: string)`
```typescript
- Fetches player state
- Subscribes to player updates
- Returns player data and loading state
```

#### `useGameActions(gameId: string)`
```typescript
- Returns action functions (fold, check, call, bet, raise, allIn)
- Handles transaction signing
- Shows loading/error states
```

### Step 4.2: Components
**Location**: `src/components/game/`

#### `PokerTable`
- Displays game table
- Shows community cards
- Shows pot amount
- Shows dealer button

#### `PlayerSeat`
- Shows player info (chips, bet, status)
- Shows hole cards (if player)
- Highlights current player

#### `ActionButtons`
- Fold, Check, Call, Bet, Raise, All-In buttons
- Disabled when not player's turn
- Shows valid actions only

#### `BetSlider`
- Bet/Raise amount selector
- Min/Max validation
- Shows pot odds

### Step 4.3: Wallet Integration
**Location**: `src/components/wallet/`

#### `WalletProvider`
- Wraps app with wallet context
- Configures wallet adapters

#### `WalletButton`
- Connect/Disconnect wallet
- Shows wallet address
- Shows SOL balance

---

## Phase 5: End-to-End Testing

### Step 5.1: Integration Tests
**Location**: `src/__tests__/integration/`

#### Test Full Game Flow:
1. ✅ Initialize game
2. ✅ 3 players join
3. ✅ Start game
4. ✅ Complete PreFlop betting
5. ✅ Advance to Flop
6. ✅ Complete Flop betting
7. ✅ Advance to Turn
8. ✅ Complete Turn betting
9. ✅ Advance to River
10. ✅ Complete River betting
11. ✅ Execute showdown
12. ✅ Verify winner receives pot

#### Test Edge Cases (from `test_edge_cases.ts`):
- ✅ Chip conservation throughout game
- ✅ Timeout handling
- ✅ Integer overflow/underflow prevention
- ✅ Concurrent action prevention
- ✅ State validation
- ✅ Zero/null value handling

### Step 5.2: UI Tests
**Location**: `src/__tests__/ui/`

#### Component Tests:
- ✅ PokerTable renders correctly
- ✅ PlayerSeat shows correct info
- ✅ ActionButtons enable/disable correctly
- ✅ BetSlider validates input

#### User Flow Tests:
- ✅ User can connect wallet
- ✅ User can join game
- ✅ User can make actions
- ✅ User sees updates in real-time

---

## 🔄 Development Workflow

### For Each Feature:

1. **Write Test First** (TDD)
   ```bash
   # Create test file
   touch src/__tests__/services/[feature].test.ts
   
   # Write failing tests
   npm test -- [feature].test.ts
   ```

2. **Implement Service**
   ```bash
   # Create service file
   touch src/services/poker/[feature].service.ts
   
   # Implement until tests pass
   npm test -- [feature].test.ts --watch
   ```

3. **Verify Against Smart Contract**
   ```bash
   # Test against devnet
   npm test -- [feature].test.ts --testEnvironment=devnet
   ```

4. **Create UI Component**
   ```bash
   # Create component
   touch src/components/game/[Feature].tsx
   
   # Test component
   npm test -- [Feature].test.tsx
   ```

5. **Integration Test**
   ```bash
   # Test full flow
   npm test -- integration/[feature]-flow.test.ts
   ```

---

## 📊 Progress Tracking

### Service Layer Checklist:

#### Connection Layer:
- [ ] `connection.ts` + tests
- [ ] `wallet.ts` + tests
- [ ] `program.ts` + tests

#### Game Service:
- [ ] `initializeGame()` + tests
- [ ] `startGame()` + tests
- [ ] `advanceStage()` + tests
- [ ] `executeShowdown()` + tests
- [ ] `newHand()` + tests
- [ ] `endGame()` + tests

#### Player Service:
- [ ] `joinGame()` + tests
- [ ] `leaveGame()` + tests
- [ ] `timeoutPlayer()` + tests

#### Betting Service:
- [ ] `playerAction()` + tests
- [ ] Fold action + tests
- [ ] Check action + tests
- [ ] Call action + tests
- [ ] Bet action + tests
- [ ] Raise action + tests
- [ ] All-In action + tests
- [ ] Side pot logic + tests

#### Query Service:
- [ ] `getGame()` + tests
- [ ] `getPlayerState()` + tests
- [ ] `getAllPlayers()` + tests
- [ ] `getGameStage()` + tests
- [ ] `getPotInfo()` + tests
- [ ] `getCommunityCards()` + tests
- [ ] `isPlayerTurn()` + tests
- [ ] `getActivePlayerCount()` + tests

#### UI Components:
- [ ] WalletProvider
- [ ] WalletButton
- [ ] PokerTable
- [ ] PlayerSeat
- [ ] ActionButtons
- [ ] BetSlider
- [ ] CommunityCards
- [ ] GameInfo

#### Integration Tests:
- [ ] Full game flow
- [ ] Edge cases
- [ ] Error handling
- [ ] Real-time updates

---

## 🎯 Key Principles

1. **Test-Driven Development**
   - Write tests before implementation
   - Each test maps to a smart contract test
   - Verify against actual contract on devnet

2. **Separation of Concerns**
   - Services handle blockchain logic
   - Components handle UI logic
   - Hooks bridge the two

3. **Type Safety**
   - Use TypeScript types from IDL
   - No `any` types
   - Strict null checks

4. **Error Handling**
   - Catch and parse Anchor errors
   - Show user-friendly messages
   - Log errors for debugging

5. **Real-time Updates**
   - Subscribe to account changes
   - Update UI automatically
   - Handle race conditions

---

## 📚 Reference Documentation

### Smart Contract Tests:
- `test_game_initialization.ts` - Game creation validation
- `test_game_flow.ts` - Stage transitions and game lifecycle
- `test_player_actions.ts` - Join/leave game
- `test_betting.ts` - All betting actions
- `test_side_pots.ts` - Side pot creation and distribution
- `test_edge_cases.ts` - Security and edge cases
- `test_mxe_integration.ts` - MPC integration (future)

### IDL Structure:
- **Instructions**: 16 total (game management, player actions, betting)
- **Accounts**: Game (PDA), PlayerState (PDA)
- **Types**: GameStage, PlayerStatus, PlayerActionParam
- **Errors**: 23 custom error codes

### PDA Seeds:
- **Game PDA**: `["game", authority, gameId]`
- **PlayerState PDA**: `["player", game, player]`

---

## 🚀 Next Steps

1. **Start with Connection Layer** - Get Solana connection working
2. **Implement Game Service** - Basic game initialization
3. **Add Player Service** - Join/leave functionality
4. **Build Betting Service** - All player actions
5. **Create Query Service** - Read game state
6. **Build UI Components** - Visual representation
7. **Integration Testing** - End-to-end flows
8. **Polish & Deploy** - Production ready

---

**Built with ❤️ for Arcium Poker**
