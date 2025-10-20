Looking at your directory structure, you have **235 passing tests** and a solid foundation. Here are the **remaining modules** to implement for a complete poker frontend:

## 🎯 **Next Priority Implementations**

### **1. Player Leave** (High Priority)
- **File:** `player/leave.ts` (empty)
- **Test:** `__tests__/player/leave.test.ts` (empty)
- **Purpose:** Handle players leaving games
- **IDL Instruction:** `leave_game`
- **Why:** Essential for game lifecycle management

### **2. Player State Management** (High Priority)
- **File:** `player/state.ts` (empty)
- **Purpose:** Track and manage player state throughout game
- **Why:** Needed for UI to display player info, chip counts, etc.

### **3. Game State Management** (Medium Priority)
- **File:** `game/state.ts` (empty)
- **Purpose:** Centralized game state management
- **Why:** Makes it easier to track game progress in UI

### **4. Game Logic** (Medium Priority)
- **File:** `game/logic.ts` (empty)
- **Purpose:** Game rules validation and helper functions
- **Why:** Ensures game rules are enforced client-side

---

## 🃏 **Card-Related Modules** (Lower Priority - MPC Dependent)

These depend on Arcium MPC integration:

### **5. Cards Module**
- `cards/deck.ts` - Deck management
- `cards/dealing.ts` - Card dealing logic
- `cards/evaluator.ts` - Hand evaluation (poker hand rankings)
- `cards/reveal.ts` - Card reveal logic

### **6. Arcium MPC Integration**
- `arcium/mpc-shuffle.ts` - MPC deck shuffle
- `arcium/mpc-deal.ts` - MPC card dealing
- `arcium/mpc-reveal.ts` - MPC card reveal
- `arcium/integration.ts` - Main MPC integration

---

## 💰 **Betting & Pot Management** (Medium Priority)

### **7. Betting Module**
- `betting/pot-manager.ts` - Pot and side-pot management
- `betting/validator.ts` - Bet validation
- `betting/state.ts` - Betting state tracking
- `betting/instruction.ts` - Betting instructions

---

## 🔐 **Security & Token Modules** (Lower Priority)

### **8. Security**
- `security/validation.ts` - Input validation
- `security/integrity.ts` - Data integrity checks
- `security/zkp.ts` - Zero-knowledge proof integration

### **9. Token Management**
- `token/escrow.ts` - Token escrow for buy-ins
- `token/withdrawal.ts` - Withdraw winnings
- `token/conversion.ts` - Token conversions

---

## 🧪 **Integration Tests** (Important!)

### **10. Integration Tests**
- `__tests__/integration/full-game-flow.test.ts` - End-to-end game test
- `__tests__/integration/edge-cases.test.ts` - Edge case testing

---

## 📋 **Recommended Implementation Order**

**Phase 1 - Core Completion (Next):**
1. ✅ `player/leave.ts` + tests
2. ✅ `player/state.ts` + tests
3. ✅ `game/state.ts` + tests
4. ✅ `game/logic.ts` + tests

**Phase 2 - Betting:**
5. ✅ `betting/pot-manager.ts` + tests
6. ✅ `betting/validator.ts` + tests

**Phase 3 - Cards (if not using full MPC):**
7. ✅ `cards/evaluator.ts` + tests (hand rankings)
8. ✅ `cards/deck.ts` + tests

**Phase 4 - Integration:**
9. ✅ Full game flow integration test
10. ✅ Edge cases test

---

## 🚀 **My Recommendation**

**Start with Phase 1** - the core player and game state management. This will give you:
- Complete player lifecycle (join → play → leave)
- Full game state tracking
- Better foundation for UI development

Would you like me to implement **Phase 1** (player/leave, player/state, game/state, game/logic) next?