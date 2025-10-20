/**
 * Script to verify games exist on-chain
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import idl from '../src/arcium_poker.json';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm');

async function verifyGames() {
  console.log('🔍 Connecting to Solana Devnet...');
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  
  console.log('📦 Loading program...');
  const provider = new AnchorProvider(
    connection,
    {} as any, // No wallet needed for read-only
    { commitment: 'confirmed' }
  );
  
  const program = new Program(idl as any, provider);
  
  console.log('\n🎮 Fetching all game accounts...');
  const games = await program.account.game.all();
  
  console.log(`\n✅ Found ${games.length} game(s) on-chain:\n`);
  
  games.forEach((game, index) => {
    console.log(`Game ${index + 1}:`);
    console.log(`  PDA: ${game.publicKey.toBase58()}`);
    console.log(`  Game ID: ${game.account.gameId.toString()}`);
    console.log(`  Authority: ${game.account.authority.toBase58()}`);
    console.log(`  Status: ${JSON.stringify(game.account.status)}`);
    console.log(`  Small Blind: ${game.account.smallBlind.toString()} lamports`);
    console.log(`  Big Blind: ${game.account.bigBlind.toString()} lamports`);
    console.log(`  Max Players: ${game.account.maxPlayers}`);
    console.log(`  Current Players: ${game.account.playerCount}`);
    console.log(`  Explorer: https://explorer.solana.com/address/${game.publicKey.toBase58()}?cluster=devnet`);
    console.log('');
  });
  
  // Check specific game PDA from the error message
  const specificGamePDA = '3sxWtWsNhPssnxnAonRSDq7dtvnY1VxK4Vd8usYTpFit';
  console.log(`\n🔍 Checking specific game: ${specificGamePDA}`);
  
  try {
    const gameAccount = await program.account.game.fetch(new PublicKey(specificGamePDA));
    console.log('✅ Game exists!');
    console.log('Game data:', JSON.stringify(gameAccount, null, 2));
  } catch (err: any) {
    console.log('❌ Game not found:', err.message);
  }
}

verifyGames().catch(console.error);
