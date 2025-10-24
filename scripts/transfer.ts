/**
 * Transfer SOL from your wallet to another address
 * Usage: npx ts-node scripts/transfer.ts <to-address> <amount>
 */

import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const RPC_ENDPOINT = 'https://api.devnet.solana.com';

async function transfer(toAddress: string, amount: number, keypairPath?: string) {
  try {
    console.log(`\n💸 Transferring ${amount} SOL to ${toAddress}...\n`);
    
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const toPubkey = new PublicKey(toAddress);
    
    // Load keypair
    let fromKeypair: Keypair | null = null;
    
    if (keypairPath) {
      // Load from provided path
      const keypairFile = fs.readFileSync(keypairPath, 'utf-8');
      const keypairData = JSON.parse(keypairFile);
      fromKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    } else {
      // Try default locations
      const defaultPaths = [
        path.join(process.env.HOME || '', '.config/solana/id.json'),
        path.join(process.cwd(), 'wallet.json'),
      ];
      
      for (const defaultPath of defaultPaths) {
        if (fs.existsSync(defaultPath)) {
          console.log(`📁 Using wallet: ${defaultPath}`);
          const keypairFile = fs.readFileSync(defaultPath, 'utf-8');
          const keypairData = JSON.parse(keypairFile);
          fromKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
          break;
        }
      }
    }
    
    if (!fromKeypair) {
      throw new Error('No wallet found. Please provide --keypair path or set up Solana CLI wallet');
    }
    
    const fromPubkey = fromKeypair.publicKey;
    console.log(`👛 From: ${fromPubkey.toBase58()}`);
    console.log(`📬 To: ${toAddress}`);
    
    // Check balance
    const balance = await connection.getBalance(fromPubkey);
    const balanceInSol = balance / LAMPORTS_PER_SOL;
    console.log(`💰 Current balance: ${balanceInSol} SOL`);
    
    if (balanceInSol < amount) {
      throw new Error(`Insufficient balance. You have ${balanceInSol} SOL but trying to send ${amount} SOL`);
    }
    
    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    
    console.log(`\n⏳ Sending transaction...`);
    
    // Send and confirm
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      {
        commitment: 'confirmed',
      }
    );
    
    // Check new balances
    const newBalance = await connection.getBalance(fromPubkey);
    const recipientBalance = await connection.getBalance(toPubkey);
    
    console.log(`\n✅ Transfer successful!`);
    console.log(`📝 Signature: ${signature}`);
    console.log(`\n💰 Your new balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`💰 Recipient balance: ${recipientBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`\n🔗 View on Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet\n`);
    
  } catch (error: any) {
    console.error('\n❌ Transfer failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\n❌ Usage: npx ts-node scripts/transfer.ts <to-address> <amount> [--keypair <path>]');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/transfer.ts 7xYz...abc 1.5');
  console.log('  npx ts-node scripts/transfer.ts 7xYz...abc 1.5 --keypair ./wallet.json\n');
  process.exit(1);
}

const toAddress = args[0];
const amount = parseFloat(args[1]);
const keypairIndex = args.indexOf('--keypair');
const keypairPath = keypairIndex !== -1 ? args[keypairIndex + 1] : undefined;

transfer(toAddress, amount, keypairPath);
