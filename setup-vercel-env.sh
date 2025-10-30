#!/bin/bash
# Script to set all Vercel environment variables for production
# Run this before deploying: bash setup-vercel-env.sh

echo "🚀 Setting up Vercel environment variables..."

# Solana Network Configuration
vercel env add NEXT_PUBLIC_SOLANA_NETWORK production <<< "devnet"
vercel env add NEXT_PUBLIC_RPC_ENDPOINT production <<< "https://devnet.helius-rpc.com/?api-key=ca217878-e9d4-46ab-ba1d-fb283a0a0fc9"
vercel env add NEXT_PUBLIC_WS_ENDPOINT production <<< "wss://api.devnet.solana.com"

# Smart Contract Configuration
vercel env add NEXT_PUBLIC_PROGRAM_ID production <<< "B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W"
vercel env add NEXT_PUBLIC_EXPLORER_URL production <<< "https://explorer.solana.com"

# Connection Settings
vercel env add NEXT_PUBLIC_COMMITMENT production <<< "confirmed"
vercel env add NEXT_PUBLIC_PREFLIGHT_COMMITMENT production <<< "processed"
vercel env add NEXT_PUBLIC_SKIP_PREFLIGHT production <<< "false"

# Game Configuration
vercel env add NEXT_PUBLIC_DEFAULT_SMALL_BLIND production <<< "10"
vercel env add NEXT_PUBLIC_DEFAULT_BIG_BLIND production <<< "20"
vercel env add NEXT_PUBLIC_DEFAULT_MIN_BUY_IN production <<< "1000"
vercel env add NEXT_PUBLIC_DEFAULT_MAX_BUY_IN production <<< "50000"
vercel env add NEXT_PUBLIC_DEFAULT_MAX_PLAYERS production <<< "6"

# Timeout Configuration
vercel env add NEXT_PUBLIC_PLAYER_TIMEOUT_SECONDS production <<< "30"
vercel env add NEXT_PUBLIC_TRANSACTION_TIMEOUT_MS production <<< "60000"

# Arcium MPC Configuration
vercel env add NEXT_PUBLIC_MPC_PROGRAM_ID production <<< "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
vercel env add NEXT_PUBLIC_MPC_ENABLED production <<< "false"

# Feature Flags
vercel env add NEXT_PUBLIC_ENABLE_STATISTICS production <<< "true"
vercel env add NEXT_PUBLIC_ENABLE_TOURNAMENTS production <<< "false"
vercel env add NEXT_PUBLIC_ENABLE_LEADERBOARD production <<< "false"
vercel env add NEXT_PUBLIC_ENABLE_CHAT production <<< "false"

# UI Configuration
vercel env add NEXT_PUBLIC_APP_NAME production <<< "Arcium Poker"
vercel env add NEXT_PUBLIC_APP_DESCRIPTION production <<< "Decentralized Texas Hold'em Poker with MPC"
vercel env add NEXT_PUBLIC_THEME production <<< "dark"

# Development/Debug Settings (set to false for production)
vercel env add NEXT_PUBLIC_DEBUG_MODE production <<< "false"
vercel env add NEXT_PUBLIC_SHOW_TRANSACTION_LOGS production <<< "false"
vercel env add NEXT_PUBLIC_ENABLE_DEVTOOLS production <<< "false"

# Analytics
vercel env add NEXT_PUBLIC_ENABLE_ANALYTICS production <<< "false"

# Social/Contact
vercel env add NEXT_PUBLIC_GITHUB_URL production <<< "https://github.com/ANAVHEOBA"
vercel env add NEXT_PUBLIC_TWITTER_URL production <<< "https://twitter.com/AnavheobaDEV"
vercel env add NEXT_PUBLIC_DISCORD_USERNAME production <<< "anavheoba_17"

echo "✅ All environment variables set!"
echo "📝 Note: MPC_ENABLED is set to 'false' for mock mode (recommended)"
echo "🚀 Ready to deploy! Run: vercel --prod"
