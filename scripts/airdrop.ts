/**
 * Airdrop SOL to a wallet on devnet
 * Usage: npx ts-node scripts/airdrop.ts <wallet-address> <amount>
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC_ENDPOINT = 'https://api.devnet.solana.com';

async function airdrop(walletAddress: string, amount: number = 2) {
  try {
    console.log(`\n🚀 Requesting ${amount} SOL airdrop to ${walletAddress}...\n`);
    
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const publicKey = new PublicKey(walletAddress);
    
    // Check current balance
    const balanceBefore = await connection.getBalance(publicKey);
    console.log(`💰 Current balance: ${balanceBefore / LAMPORTS_PER_SOL} SOL`);
    
    // Request airdrop
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    
    console.log(`\n⏳ Confirming transaction...`);
    console.log(`📝 Signature: ${signature}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    // Check new balance
    const balanceAfter = await connection.getBalance(publicKey);
    console.log(`\n✅ Airdrop successful!`);
    console.log(`💰 New balance: ${balanceAfter / LAMPORTS_PER_SOL} SOL`);
    console.log(`📈 Received: ${(balanceAfter - balanceBefore) / LAMPORTS_PER_SOL} SOL`);
    console.log(`\n🔗 View on Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet\n`);
    
  } catch (error: any) {
    console.error('\n❌ Airdrop failed:', error.message);
    
    if (error.message?.includes('airdrop request limit')) {
      console.log('\n⚠️  Rate limit reached. Try:');
      console.log('   1. Wait a few minutes and try again');
      console.log('   2. Use the web faucet: https://faucet.solana.com');
      console.log('   3. Use the CLI: solana airdrop 2 <your-wallet-address> --url devnet\n');
    }
    
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('\n❌ Usage: npx ts-node scripts/airdrop.ts <wallet-address> [amount]');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/airdrop.ts 7xYz...abc 2\n');
  process.exit(1);
}

const walletAddress = args[0];
const amount = args[1] ? parseFloat(args[1]) : 2;

// Validate amount (devnet has a 5 SOL limit per request)
if (amount > 5) {
  console.log('\n⚠️  Devnet airdrop limit is 5 SOL per request');
  console.log('   Using 5 SOL instead...\n');
}

airdrop(walletAddress, Math.min(amount, 5));
