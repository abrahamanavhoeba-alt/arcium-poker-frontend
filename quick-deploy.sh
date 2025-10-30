#!/bin/bash
# Quick deployment script - sets essential env vars and deploys

set -e

echo "🚀 Quick Deploy to Vercel"
echo "========================"
echo ""

# Essential environment variables for the app to work
echo "Setting essential environment variables..."

# Smart Contract
vercel env add NEXT_PUBLIC_PROGRAM_ID production --yes 2>/dev/null <<< "B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W" || echo "✓ NEXT_PUBLIC_PROGRAM_ID already set"

# Network
vercel env add NEXT_PUBLIC_SOLANA_NETWORK production --yes 2>/dev/null <<< "devnet" || echo "✓ NEXT_PUBLIC_SOLANA_NETWORK already set"

# RPC
vercel env add NEXT_PUBLIC_RPC_ENDPOINT production --yes 2>/dev/null <<< "https://devnet.helius-rpc.com/?api-key=ca217878-e9d4-46ab-ba1d-fb283a0a0fc9" || echo "✓ NEXT_PUBLIC_RPC_ENDPOINT already set"

# Mock mode (disabled MPC)
vercel env add NEXT_PUBLIC_MPC_ENABLED production --yes 2>/dev/null <<< "false" || echo "✓ NEXT_PUBLIC_MPC_ENABLED already set"

echo ""
echo "✅ Essential variables configured!"
echo ""
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
