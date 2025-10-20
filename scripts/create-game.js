const anchor = require('@coral-xyz/anchor');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Load IDL
const idl = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/arcium_poker.json'), 'utf8'));

// Configuration
const PROGRAM_ID = new PublicKey('DmthLucwUx2iM7VoFUv14PHfVqfqGxHKLMVXzUb8vvMm');
const RPC_URL = 'https://api.devnet.solana.com';

async function createGame() {
  console.log('🎮 Creating poker game on devnet...\n');

  // Setup connection
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Load wallet from Solana CLI config
  const walletPath = process.env.HOME + '/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
  );
  
  console.log('Wallet:', walletKeypair.publicKey.toBase58());
  
  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log('Balance:', balance / 1e9, 'SOL\n');

  // Setup wallet and provider
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    skipPreflight: true,
  });
  anchor.setProvider(provider);

  // Create program instance using NEW Anchor 0.32+ syntax
  const program = new anchor.Program(idl, provider);

  console.log('Program ID:', program.programId.toBase58());
  console.log('Available methods:', Object.keys(program.methods));

  // Generate game ID
  const gameId = new anchor.BN(Math.floor(Math.random() * 1000000));
  console.log('Game ID:', gameId.toString());

  // Derive game PDA (seeds: "game" + authority + game_id)
  const [gamePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('game'),
      walletKeypair.publicKey.toBuffer(),
      gameId.toArrayLike(Buffer, 'le', 8)
    ],
    program.programId
  );

  console.log('Game PDA:', gamePDA.toBase58());

  // Game parameters
  const params = {
    gameId,
    smallBlind: new anchor.BN(10_000_000), // 0.01 SOL
    bigBlind: new anchor.BN(20_000_000),   // 0.02 SOL
    minBuyIn: new anchor.BN(1_000_000_000), // 1 SOL
    maxBuyIn: new anchor.BN(100_000_000_000), // 100 SOL
    maxPlayers: 6,
  };

  console.log('\nGame Parameters:');
  console.log('- Small Blind:', params.smallBlind.toNumber() / 1e9, 'SOL');
  console.log('- Big Blind:', params.bigBlind.toNumber() / 1e9, 'SOL');
  console.log('- Min Buy-in:', params.minBuyIn.toNumber() / 1e9, 'SOL');
  console.log('- Max Buy-in:', params.maxBuyIn.toNumber() / 1e9, 'SOL');
  console.log('- Max Players:', params.maxPlayers);

  try {
    console.log('\n⏳ Building transaction...');
    
    // Build the transaction
    const txBuilder = program.methods
      .initializeGame(
        params.gameId,
        params.smallBlind,
        params.bigBlind,
        params.minBuyIn,
        params.maxBuyIn,
        params.maxPlayers
      )
      .accounts({
        game: gamePDA,
        authority: walletKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      });
    
    console.log('Transaction built successfully');
    
    // First, try to simulate
    console.log('Simulating transaction...');
    try {
      const simResult = await txBuilder.simulate();
      console.log('✅ Simulation successful!');
      console.log('Simulation result:', simResult);
    } catch (simError) {
      console.error('❌ Simulation failed:', simError);
    }
    
    console.log('\nSending transaction...');
    
    // Send the transaction
    const tx = await txBuilder.rpc();

    console.log('\n✅ Game created successfully!');
    console.log('Transaction signature:', tx);
    console.log('Game PDA:', gamePDA.toBase58());
    console.log('\nView on Solana Explorer:');
    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    console.log(`https://explorer.solana.com/address/${gamePDA.toBase58()}?cluster=devnet`);

  } catch (error) {
    console.error('\n❌ Error creating game:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.error || error.code);
    
    if (error.logs) {
      console.error('\nProgram logs:');
      error.logs.forEach(log => console.error(log));
    }
    
    // Try to decode Anchor error
    if (error.error && typeof error.error === 'object') {
      const errorCode = error.error.errorCode || error.error.code;
      console.error('\nAnchor error code:', errorCode);
      console.error('Full error:', JSON.stringify(error.error, null, 2));
    }
    
    console.error('\nFull error object:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

createGame().catch(console.error);
