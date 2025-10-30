# 🚀 Vercel Deployment Guide - Arcium Poker

## Quick Deploy (3 Steps)

### Step 1: Login to Vercel
```bash
vercel login
```

### Step 2: Set Environment Variables
```bash
bash setup-vercel-env.sh
```

This will configure all 32 environment variables needed for the app.

### Step 3: Deploy to Production
```bash
vercel --prod
```

---

## Alternative: Manual Environment Variable Setup

If you prefer to set variables manually or the script doesn't work, use this command format:

```bash
# Example for each variable:
vercel env add NEXT_PUBLIC_PROGRAM_ID production
# Then paste the value when prompted: B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W
```

### All Variables to Set:

**Solana Network:**
- `NEXT_PUBLIC_SOLANA_NETWORK` = `devnet`
- `NEXT_PUBLIC_RPC_ENDPOINT` = `https://devnet.helius-rpc.com/?api-key=ca217878-e9d4-46ab-ba1d-fb283a0a0fc9`
- `NEXT_PUBLIC_WS_ENDPOINT` = `wss://api.devnet.solana.com`

**Smart Contract:**
- `NEXT_PUBLIC_PROGRAM_ID` = `B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W`
- `NEXT_PUBLIC_EXPLORER_URL` = `https://explorer.solana.com`

**Connection:**
- `NEXT_PUBLIC_COMMITMENT` = `confirmed`
- `NEXT_PUBLIC_PREFLIGHT_COMMITMENT` = `processed`
- `NEXT_PUBLIC_SKIP_PREFLIGHT` = `false`

**Game Config:**
- `NEXT_PUBLIC_DEFAULT_SMALL_BLIND` = `10`
- `NEXT_PUBLIC_DEFAULT_BIG_BLIND` = `20`
- `NEXT_PUBLIC_DEFAULT_MIN_BUY_IN` = `1000`
- `NEXT_PUBLIC_DEFAULT_MAX_BUY_IN` = `50000`
- `NEXT_PUBLIC_DEFAULT_MAX_PLAYERS` = `6`

**Timeouts:**
- `NEXT_PUBLIC_PLAYER_TIMEOUT_SECONDS` = `30`
- `NEXT_PUBLIC_TRANSACTION_TIMEOUT_MS` = `60000`

**Arcium MPC:**
- `NEXT_PUBLIC_MPC_PROGRAM_ID` = `BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6`
- `NEXT_PUBLIC_MPC_ENABLED` = `false` ⚠️ (Mock mode recommended)

**Features:**
- `NEXT_PUBLIC_ENABLE_STATISTICS` = `true`
- `NEXT_PUBLIC_ENABLE_TOURNAMENTS` = `false`
- `NEXT_PUBLIC_ENABLE_LEADERBOARD` = `false`
- `NEXT_PUBLIC_ENABLE_CHAT` = `false`

**UI:**
- `NEXT_PUBLIC_APP_NAME` = `Arcium Poker`
- `NEXT_PUBLIC_APP_DESCRIPTION` = `Decentralized Texas Hold'em Poker with MPC`
- `NEXT_PUBLIC_THEME` = `dark`

**Debug (Production):**
- `NEXT_PUBLIC_DEBUG_MODE` = `false`
- `NEXT_PUBLIC_SHOW_TRANSACTION_LOGS` = `false`
- `NEXT_PUBLIC_ENABLE_DEVTOOLS` = `false`

**Analytics:**
- `NEXT_PUBLIC_ENABLE_ANALYTICS` = `false`

**Social:**
- `NEXT_PUBLIC_GITHUB_URL` = `https://github.com/ANAVHEOBA`
- `NEXT_PUBLIC_TWITTER_URL` = `https://twitter.com/AnavheobaDEV`
- `NEXT_PUBLIC_DISCORD_USERNAME` = `anavheoba_17`

---

## Deployment Commands

### First Time Deploy
```bash
vercel
```

Follow the prompts to link your project to Vercel.

### Production Deploy
```bash
vercel --prod
```

### Preview Deploy (for testing)
```bash
vercel
```

---

## Post-Deployment

After deployment completes, you'll get a URL like:
```
https://arcium-poker-frontend.vercel.app
```

### Verify Deployment:
1. Visit the URL
2. Connect your Solana wallet
3. Create a game
4. Join with 2 players
5. Start the game (mock mode)

---

## Troubleshooting

### Build Fails
**Issue**: Font loading errors (Geist font)
**Solution**: These are warnings, build should still succeed

### Environment Variables Not Working
**Issue**: Variables not loaded
**Solution**: Redeploy after setting variables:
```bash
vercel --prod --force
```

### Can't Start Game
**Issue**: Transaction fails
**Solution**: Check that:
- `NEXT_PUBLIC_PROGRAM_ID` is set to `B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W`
- `NEXT_PUBLIC_MPC_ENABLED` is `false` (for mock mode)
- You have devnet SOL in your wallet

---

## Important Notes

### Mock Mode
The deployment uses **MOCK MODE** (deterministic shuffling) because:
- ✅ Full game functionality works
- ✅ No MPC network dependency
- ✅ Perfect for production demo
- ⚠️ Not cryptographically secure (don't use for real money)

### Real MPC Mode
To enable real Arcium MPC:
1. Upload circuits to Arcium devnet (see ARCIUM_DEVNET_DEPLOYMENT_SUMMARY.md)
2. Set `NEXT_PUBLIC_MPC_ENABLED=true`
3. Redeploy

---

## Commands Reference

```bash
# Login
vercel login

# Link project (first time)
vercel link

# Set single env var
vercel env add VARIABLE_NAME production

# List all env vars
vercel env ls

# Remove env var
vercel env rm VARIABLE_NAME production

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Force redeploy (clears cache)
vercel --prod --force

# Check deployment logs
vercel logs [deployment-url]
```

---

## Updating After Code Changes

```bash
git add .
git commit -m "your changes"
git push
vercel --prod
```

---

## Getting Help

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project Issues**: https://github.com/ANAVHEOBA/arcium-poker-frontend/issues
