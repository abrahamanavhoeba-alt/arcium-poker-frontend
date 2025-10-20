# 🎨 Frontend Architecture - Arcium Poker

## Overview

This document outlines the complete frontend architecture for the Arcium Poker application. The architecture follows a **feature-based component structure** where each major feature has its own isolated component tree.

---

## 📁 Directory Structure

```
src/
├── app/                          # Next.js 13+ App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home/Landing page
│   ├── lobby/
│   │   └── page.tsx            # Game lobby
│   ├── game/
│   │   └── [gameId]/
│   │       └── page.tsx        # Active game page
│   └── profile/
│       └── page.tsx            # Player profile
│
├── components/                   # Reusable components
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   │
│   ├── wallet/                  # Wallet connection
│   │   ├── WalletButton.tsx
│   │   ├── WalletModal.tsx
│   │   └── WalletProvider.tsx
│   │
│   ├── game/                    # Game-specific components
│   │   ├── PokerTable/
│   │   │   ├── PokerTable.tsx           # Main table container
│   │   │   ├── TableFelt.tsx            # Green felt background
│   │   │   ├── CommunityCards.tsx       # 5 community cards
│   │   │   ├── PotDisplay.tsx           # Pot amount display
│   │   │   └── DealerButton.tsx         # Dealer chip indicator
│   │   │
│   │   ├── PlayerSeat/
│   │   │   ├── PlayerSeat.tsx           # Individual player seat
│   │   │   ├── PlayerAvatar.tsx         # Player avatar/icon
│   │   │   ├── PlayerInfo.tsx           # Name, chips, status
│   │   │   ├── HoleCards.tsx            # Player's 2 cards
│   │   │   ├── PlayerActions.tsx        # Action indicators
│   │   │   └── BetAmount.tsx            # Current bet display
│   │   │
│   │   ├── Cards/
│   │   │   ├── Card.tsx                 # Single card component
│   │   │   ├── CardBack.tsx             # Face-down card
│   │   │   ├── CardAnimations.tsx       # Deal/flip animations
│   │   │   └── CardSuits.tsx            # Suit icons
│   │   │
│   │   ├── Actions/
│   │   │   ├── ActionPanel.tsx          # Main action controls
│   │   │   ├── FoldButton.tsx           # Fold action
│   │   │   ├── CheckButton.tsx          # Check action
│   │   │   ├── CallButton.tsx           # Call action
│   │   │   ├── BetButton.tsx            # Bet action
│   │   │   ├── RaiseButton.tsx          # Raise action
│   │   │   ├── AllInButton.tsx          # All-in action
│   │   │   └── BetSlider.tsx            # Bet amount slider
│   │   │
│   │   ├── GameInfo/
│   │   │   ├── GameStatus.tsx           # Game stage display
│   │   │   ├── TimerBar.tsx             # Action timer
│   │   │   ├── BlindInfo.tsx            # Blind amounts
│   │   │   └── HandHistory.tsx          # Recent hands
│   │   │
│   │   └── Showdown/
│   │       ├── ShowdownModal.tsx        # Showdown results
│   │       ├── WinnerDisplay.tsx        # Winner announcement
│   │       ├── HandRanking.tsx          # Hand strength display
│   │       └── PotDistribution.tsx      # Pot split display
│   │
│   ├── lobby/                   # Lobby components
│   │   ├── GameList/
│   │   │   ├── GameList.tsx             # List of active games
│   │   │   ├── GameCard.tsx             # Individual game card
│   │   │   ├── GameFilters.tsx          # Filter controls
│   │   │   └── GameSearch.tsx           # Search bar
│   │   │
│   │   ├── CreateGame/
│   │   │   ├── CreateGameModal.tsx      # Create game dialog
│   │   │   ├── GameSettings.tsx         # Blind/buy-in settings
│   │   │   └── PlayerLimit.tsx          # Max players selector
│   │   │
│   │   └── QuickJoin/
│   │       ├── QuickJoinButton.tsx      # Quick join action
│   │       └── JoinModal.tsx            # Join confirmation
│   │
│   ├── mpc/                     # Arcium MPC components
│   │   ├── MPCStatus/
│   │   │   ├── MPCStatusBadge.tsx       # MPC connection status
│   │   │   ├── ShuffleProgress.tsx      # Shuffle progress bar
│   │   │   └── EncryptionIndicator.tsx  # Encryption status
│   │   │
│   │   └── RandomnessContribution/
│   │       ├── ContributeModal.tsx      # Randomness contribution UI
│   │       └── ContributionStatus.tsx   # Player contribution status
│   │
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Slider.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Loading.tsx
│   │   └── Toast.tsx
│   │
│   └── animations/              # Animation components
│       ├── CardDeal.tsx
│       ├── ChipAnimation.tsx
│       ├── WinnerAnimation.tsx
│       └── TransitionEffects.tsx
│
├── hooks/                       # Custom React hooks
│   ├── useGame.ts              # Game state management
│   ├── usePlayer.ts            # Player state management
│   ├── useWallet.ts            # Wallet connection
│   ├── useGameActions.ts       # Player actions (fold, bet, etc)
│   ├── useMPC.ts               # MPC operations
│   ├── useSubscription.ts      # Real-time updates
│   └── useSound.ts             # Sound effects
│
├── contexts/                    # React contexts
│   ├── GameContext.tsx         # Game state context
│   ├── PlayerContext.tsx       # Player state context
│   ├── WalletContext.tsx       # Wallet context
│   └── ThemeContext.tsx        # Theme context
│
├── lib/                        # Backend logic (already implemented)
│   ├── game/
│   ├── player/
│   ├── cards/
│   ├── betting/
│   ├── arcium/
│   └── ...
│
├── styles/                     # Styling
│   ├── globals.css            # Global styles
│   ├── poker-table.css        # Table-specific styles
│   └── animations.css         # Animation styles
│
└── utils/                      # Utility functions
    ├── formatters.ts          # Number/currency formatting
    ├── validators.ts          # Input validation
    └── constants.ts           # UI constants
```

---

## 🎯 Feature-Based Component Architecture

### **1. Poker Table Feature**

```
components/game/PokerTable/
├── PokerTable.tsx              # Main container
│   ├── Props: { gameId, onAction }
│   ├── State: table layout, animations
│   └── Children:
│       ├── <TableFelt />
│       ├── <CommunityCards />
│       ├── <PotDisplay />
│       ├── <DealerButton />
│       └── <PlayerSeat /> (x6)
```

**Responsibilities:**
- Render poker table layout
- Position player seats
- Manage table animations
- Coordinate child components

**Example:**
```tsx
<PokerTable gameId={gameId}>
  <TableFelt />
  <CommunityCards cards={communityCards} />
  <PotDisplay amount={pot} />
  <DealerButton position={dealerPosition} />
  {players.map((player, index) => (
    <PlayerSeat
      key={player.pubkey}
      player={player}
      position={index}
      isActive={currentPlayer === index}
    />
  ))}
</PokerTable>
```

---

### **2. Player Seat Feature**

```
components/game/PlayerSeat/
├── PlayerSeat.tsx              # Seat container
│   ├── Props: { player, position, isActive }
│   └── Children:
│       ├── <PlayerAvatar />
│       ├── <PlayerInfo />
│       ├── <HoleCards />
│       ├── <PlayerActions />
│       └── <BetAmount />
```

**Responsibilities:**
- Display player information
- Show hole cards (encrypted/revealed)
- Display current bet
- Show player actions/status
- Position seat around table

**Example:**
```tsx
<PlayerSeat position={0} isActive={true}>
  <PlayerAvatar address={player.pubkey} />
  <PlayerInfo
    name={player.name}
    chips={player.chipStack}
    status={player.status}
  />
  <HoleCards
    cards={player.holeCards}
    encrypted={!isShowdown}
  />
  <BetAmount amount={player.currentBet} />
</PlayerSeat>
```

---

### **3. Action Panel Feature**

```
components/game/Actions/
├── ActionPanel.tsx             # Actions container
│   ├── Props: { availableActions, onAction }
│   └── Children:
│       ├── <FoldButton />
│       ├── <CheckButton />
│       ├── <CallButton />
│       ├── <BetButton />
│       ├── <RaiseButton />
│       ├── <AllInButton />
│       └── <BetSlider />
```

**Responsibilities:**
- Show available actions
- Handle player input
- Validate bet amounts
- Submit actions to blockchain

**Example:**
```tsx
<ActionPanel
  availableActions={['fold', 'call', 'raise']}
  onAction={handleAction}
>
  <FoldButton onClick={() => handleAction('fold')} />
  <CallButton
    amount={callAmount}
    onClick={() => handleAction('call', callAmount)}
  />
  <RaiseButton
    min={minRaise}
    max={maxRaise}
    onRaise={(amount) => handleAction('raise', amount)}
  />
  <BetSlider
    min={minBet}
    max={playerChips}
    onChange={setBetAmount}
  />
</ActionPanel>
```

---

### **4. Card Display Feature**

```
components/game/Cards/
├── Card.tsx                    # Single card
│   ├── Props: { rank, suit, encrypted }
│   └── Variants:
│       ├── Face up (revealed)
│       ├── Face down (encrypted)
│       └── Animated (dealing/flipping)
```

**Responsibilities:**
- Render card visuals
- Handle card animations
- Show encrypted state
- Display suit/rank

**Example:**
```tsx
<Card
  rank="A"
  suit="spades"
  encrypted={false}
  animation="deal"
/>

<CardBack /> // Encrypted card
```

---

### **5. Lobby Feature**

```
components/lobby/
├── GameList/
│   ├── GameList.tsx
│   └── GameCard.tsx
├── CreateGame/
│   └── CreateGameModal.tsx
└── QuickJoin/
    └── QuickJoinButton.tsx
```

**Responsibilities:**
- List active games
- Filter/search games
- Create new games
- Join existing games

**Example:**
```tsx
<GameList>
  {games.map(game => (
    <GameCard
      key={game.id}
      game={game}
      onJoin={() => joinGame(game.id)}
    />
  ))}
</GameList>

<CreateGameModal
  onSubmit={createGame}
/>
```

---

### **6. MPC Integration Feature**

```
components/mpc/
├── MPCStatus/
│   ├── MPCStatusBadge.tsx
│   ├── ShuffleProgress.tsx
│   └── EncryptionIndicator.tsx
└── RandomnessContribution/
    ├── ContributeModal.tsx
    └── ContributionStatus.tsx
```

**Responsibilities:**
- Show MPC connection status
- Display shuffle progress
- Handle randomness contribution
- Show encryption indicators

**Example:**
```tsx
<MPCStatusBadge status="connected" />

<ShuffleProgress
  current={3}
  total={6}
  message="Waiting for player contributions..."
/>

<ContributeModal
  onContribute={contributeRandomness}
/>
```

---

## 📱 Page Architecture

### **1. Home Page** (`app/page.tsx`)

```tsx
export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <ArciumIntegration />
      <CallToAction />
    </>
  );
}
```

**Sections:**
- Hero with wallet connect
- Feature highlights
- How poker works
- Arcium MPC explanation
- Join/Create game CTA

---

### **2. Lobby Page** (`app/lobby/page.tsx`)

```tsx
export default function LobbyPage() {
  return (
    <div className="lobby-container">
      <LobbyHeader />
      <GameFilters />
      <GameList />
      <CreateGameButton />
    </div>
  );
}
```

**Features:**
- Active games list
- Filter by stakes/players
- Create new game
- Quick join

---

### **3. Game Page** (`app/game/[gameId]/page.tsx`)

```tsx
export default function GamePage({ params }) {
  const { gameId } = params;
  
  return (
    <div className="game-container">
      <GameHeader gameId={gameId} />
      <PokerTable gameId={gameId} />
      <ActionPanel />
      <GameInfo />
      <ChatPanel />
    </div>
  );
}
```

**Features:**
- Live poker table
- Player actions
- Game information
- Chat (optional)

---

## 🎨 Component Design Patterns

### **1. Container/Presenter Pattern**

```tsx
// Container (logic)
function PlayerSeatContainer({ playerId }) {
  const player = usePlayer(playerId);
  const { fold, bet } = useGameActions();
  
  return (
    <PlayerSeatPresenter
      player={player}
      onFold={fold}
      onBet={bet}
    />
  );
}

// Presenter (UI)
function PlayerSeatPresenter({ player, onFold, onBet }) {
  return (
    <div className="player-seat">
      <PlayerAvatar {...player} />
      <PlayerInfo {...player} />
    </div>
  );
}
```

---

### **2. Compound Components Pattern**

```tsx
<PokerTable>
  <PokerTable.Felt />
  <PokerTable.CommunityCards />
  <PokerTable.Pot />
  <PokerTable.Players>
    <PlayerSeat position={0} />
    <PlayerSeat position={1} />
  </PokerTable.Players>
</PokerTable>
```

---

### **3. Render Props Pattern**

```tsx
<GameState>
  {({ game, players, actions }) => (
    <PokerTable
      game={game}
      players={players}
      onAction={actions.performAction}
    />
  )}
</GameState>
```

---

## 🔄 State Management

### **Game State Hook**

```tsx
function useGame(gameId: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch game state
  useEffect(() => {
    fetchGameState(gameId).then(setGame);
  }, [gameId]);
  
  // Subscribe to updates
  useSubscription(gameId, (update) => {
    setGame(update.game);
    setPlayers(update.players);
  });
  
  return { game, players, loading };
}
```

---

### **Action Hook**

```tsx
function useGameActions(gameId: string) {
  const wallet = useWallet();
  
  const fold = async () => {
    await PlayerActions.fold(gameId, wallet);
  };
  
  const bet = async (amount: BN) => {
    await PlayerActions.bet(gameId, amount, wallet);
  };
  
  return { fold, bet, call, raise, check, allIn };
}
```

---

## 🎭 Animation Strategy

### **Card Dealing Animation**

```tsx
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  <Card rank="A" suit="spades" />
</motion.div>
```

---

### **Chip Animation**

```tsx
<motion.div
  animate={{
    x: [0, 100, 200],
    y: [0, -50, 0],
  }}
  transition={{ duration: 1 }}
>
  <ChipStack amount={100} />
</motion.div>
```

---

## 🎨 Styling Approach

### **Tailwind CSS + CSS Modules**

```tsx
// Component
<div className={cn(
  "poker-table",
  "relative w-full h-screen",
  "bg-gradient-to-br from-green-800 to-green-900",
  styles.pokerTable
)}>
  {children}
</div>

// CSS Module (poker-table.module.css)
.pokerTable {
  border-radius: 50%;
  box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.5);
}
```

---

## 📦 Component Library

Using **shadcn/ui** for base components:
- Button
- Modal/Dialog
- Input
- Slider
- Badge
- Tooltip
- Toast

Custom poker-specific components built on top.

---

## 🚀 Performance Optimization

1. **Code Splitting**
   ```tsx
   const GamePage = dynamic(() => import('./game/[gameId]/page'), {
     loading: () => <LoadingSpinner />
   });
   ```

2. **Memoization**
   ```tsx
   const PlayerSeat = memo(({ player }) => {
     // Only re-render if player changes
   });
   ```

3. **Virtual Scrolling** (for game list)
   ```tsx
   <VirtualList items={games} renderItem={GameCard} />
   ```

---

## 📱 Responsive Design

### **Breakpoints**
- Mobile: `< 768px` - Vertical layout
- Tablet: `768px - 1024px` - Compact table
- Desktop: `> 1024px` - Full table

### **Mobile Adaptations**
- Simplified table layout
- Bottom action panel
- Swipe gestures
- Touch-optimized buttons

---

## ✅ Implementation Checklist

### **Phase 1: Core Components** (Days 1-2)
- [ ] Layout (Header, Footer)
- [ ] Wallet connection
- [ ] Poker table container
- [ ] Player seats
- [ ] Card components
- [ ] Action panel

### **Phase 2: Game Logic** (Days 3-4)
- [ ] Game state management
- [ ] Action handlers
- [ ] MPC integration UI
- [ ] Real-time updates
- [ ] Animations

### **Phase 3: Polish** (Days 5-6)
- [ ] Lobby page
- [ ] Game list
- [ ] Responsive design
- [ ] Sound effects
- [ ] Error handling

---

## 🎯 Priority Components (Build First)

1. **PokerTable.tsx** - Main game view
2. **PlayerSeat.tsx** - Player display
3. **Card.tsx** - Card rendering
4. **ActionPanel.tsx** - Player actions
5. **WalletButton.tsx** - Wallet connection

---

This architecture provides a **scalable, maintainable, and feature-rich** frontend for your Arcium Poker game! 🎰🃏

Ready to start building? 🚀
