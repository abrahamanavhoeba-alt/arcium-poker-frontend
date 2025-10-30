#!/bin/bash
# Complete deployment script for Vercel
# Usage: bash deploy.sh

set -e  # Exit on any error

echo "🚀 Arcium Poker - Vercel Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found!${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Step 1: Login check
echo "Step 1/4: Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "Please login:"
    vercel login
else
    echo -e "${GREEN}✅ Already logged in to Vercel${NC}"
fi
echo ""

# Step 2: Link project (if not already linked)
echo "Step 2/4: Linking project to Vercel..."
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}⚠️  Project not linked yet${NC}"
    echo "Linking project to Vercel..."
    vercel link
else
    echo -e "${GREEN}✅ Project already linked${NC}"
fi
echo ""

# Step 3: Set environment variables
echo "Step 3/4: Setting environment variables..."
echo -e "${YELLOW}⚠️  This will set 32 environment variables${NC}"
read -p "Do you want to proceed? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting variables..."
    bash setup-vercel-env.sh
    echo -e "${GREEN}✅ Environment variables configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped environment variable setup${NC}"
    echo "You can run it manually later: bash setup-vercel-env.sh"
fi
echo ""

# Step 4: Deploy
echo "Step 4/4: Deploying to production..."
echo -e "${YELLOW}⚠️  This will deploy your app to Vercel production${NC}"
read -p "Deploy now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying..."
    vercel --prod
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo "Your app is now live! 🚀"
    echo "Check the URL above to visit your deployed app"
else
    echo -e "${YELLOW}⚠️  Deployment skipped${NC}"
    echo "You can deploy manually later: vercel --prod"
fi
echo ""
echo "=========================================="
echo "Deployment script finished!"
