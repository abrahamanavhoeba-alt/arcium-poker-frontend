import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import idl from '../src/arcium_poker.json';

const DEVNET_RPC = 'https://api.devnet.solana.com';
const GAME_PDA = '8EX7cwynfrVjRC5CNfRPyuPPkZ7iWQzQyyYHsxAg9CPi';

async function debugGameState() {
  console.log('🔍 Debugging game state...\n');
  
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
  const program = new Program(idl as any, provider);
  
  // Fetch game
  const game = await program.account.game.fetch(new PublicKey(GAME_PDA));
  console.log('📊 Game Info:');
  console.log('  Players in game:', game.playerCount);
  console.log('  Game.players array:');
  for (let i = 0; i < game.playerCount; i++) {
    console.log(`    [${i}]:`, game.players[i].toBase58());
  }
  
  // Fetch all PlayerState accounts for this game
  const allPlayerStates = await program.account.playerState.all();
  const gamePlayers = allPlayerStates.filter((p: any) => 
    p.account.game.toBase58() === GAME_PDA
  );
  
  console.log('\n👥 PlayerState Accounts:');
  gamePlayers.forEach((playerData: any) => {
    const player = playerData.account;
    console.log(`  PDA: ${playerData.publicKey.toBase58()}`);
    console.log(`    player: ${player.player.toBase58()}`);
    console.log(`    seatIndex: ${player.seatIndex}`);
    console.log(`    chipStack: ${player.chipStack ? player.chipStack.toString() : 'undefined/null'}`);
    console.log('');
  });
  
  // Sort by seat index
  const sorted = gamePlayers.sort((a: any, b: any) => 
    a.account.seatIndex - b.account.seatIndex
  );
  
  console.log('✅ Sorted PlayerState accounts (by seat):');
  sorted.forEach((playerData: any, index: number) => {
    const player = playerData.account;
    console.log(`  [${index}] Seat ${player.seatIndex}: ${player.player.toBase58().slice(0, 8)}...`);
  });
  
  // Check if they match game.players
  console.log('\n🔍 Verification:');
  for (let i = 0; i < sorted.length; i++) {
    const playerState = sorted[i].account;
    const gamePlayer = game.players[playerState.seatIndex];
    const match = playerState.player.toBase58() === gamePlayer.toBase58();
    console.log(`  Seat ${playerState.seatIndex}: ${match ? '✅' : '❌'} ${playerState.player.toBase58().slice(0, 8)}... vs ${gamePlayer.toBase58().slice(0, 8)}...`);
  }
}

debugGameState().catch(console.error);
