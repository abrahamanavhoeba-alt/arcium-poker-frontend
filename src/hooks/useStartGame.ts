import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import idlJson from '@/arcium_poker.json';

// Arcium constants - using same program ID means it will use mock/fallback mode
const MXE_PROGRAM_ID = 'AshR4SHHiPJAKFbPjeeCkH4TNw82bbrJwmzbP4dThQKQ';
const CLUSTER_OFFSET = 1078779259;

export function useStartGame() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = async (gamePDA: PublicKey) => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      console.log('🎮 ========== START GAME ==========');
      console.log('📝 Game PDA:', gamePDA.toBase58());
      console.log('👛 Authority:', wallet.publicKey.toBase58());

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // Create program instance
      // In Anchor 0.30+, Program constructor needs proper IDL typing
      // Cast the JSON to Idl type to ensure proper structure
      const idl = idlJson as Idl;
      const program = new Program(idl, provider);
      
      console.log('🔍 Program created:', program.programId.toBase58());
      console.log('🔍 Program.account:', program.account ? 'exists' : 'UNDEFINED');
      if (program.account) {
        console.log('🔍 Available accounts:', Object.keys(program.account));
      }

      // Fetch all player states for this game
      console.log('👥 Fetching player states...');
      
      // Check if program.account exists
      if (!program.account) {
        throw new Error('Program account namespace is undefined. Check IDL structure.');
      }
      
      // Anchor converts "PlayerState" to "playerState" (camelCase)
      const allPlayerStates = await (program.account as any).playerState.all();
      const gamePlayers = allPlayerStates.filter((p: any) => 
        p.account.game.toBase58() === gamePDA.toBase58()
      );
      console.log(`✅ Found ${gamePlayers.length} player state(s)`);

      // Sort players by seat index (CRITICAL for the program)
      const sortedPlayers = gamePlayers.sort((a: any, b: any) => 
        a.account.seatIndex - b.account.seatIndex
      );
      console.log('✅ Players sorted by seat index');

      // Build remaining accounts array (player states)
      const remainingAccounts = sortedPlayers.map((playerData: any) => ({
        pubkey: playerData.publicKey,
        isWritable: true,
        isSigner: false,
      }));

      console.log(`📝 Adding ${remainingAccounts.length} player account(s) as remaining accounts`);
      console.log('📝 Remaining accounts details:');
      remainingAccounts.forEach((acc: any, i: number) => {
        console.log(`  [${i}] ${acc.pubkey.toBase58()}`);
      });

      // Generate random entropy for each player (32 bytes each)
      const playerEntropy = sortedPlayers.map(() => {
        const entropy = new Uint8Array(32);
        crypto.getRandomValues(entropy);
        return Array.from(entropy);
      });

      console.log(`🎲 Generated entropy for ${playerEntropy.length} player(s)`);

      // Derive MXE accounts (required by smart contract even in mock mode)
      const computationOffset = new Uint8Array(8);
      crypto.getRandomValues(computationOffset);

      const programId = new PublicKey(MXE_PROGRAM_ID);

      const [mxeAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("mxe"), programId.toBuffer()],
        programId
      );

      const compDefOffset = Buffer.alloc(4);
      compDefOffset.writeUInt32LE(1, 0);
      const [compDefAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("comp_def"), programId.toBuffer(), compDefOffset],
        programId
      );

      const [mempoolAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("mempool"), programId.toBuffer()],
        programId
      );

      const [executingPoolAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("executing_pool"), programId.toBuffer()],
        programId
      );

      const [computationAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("computation"), programId.toBuffer(), computationOffset],
        programId
      );

      const clusterOffset = Buffer.alloc(8);
      clusterOffset.writeBigUInt64LE(BigInt(CLUSTER_OFFSET), 0);
      const [clusterAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("cluster"), clusterOffset],
        programId
      );

      console.log('🔐 MXE Accounts derived (mock mode)');

      console.log('🔨 Building start game instruction...');
      const instruction = await program.methods
        .startGame(playerEntropy)
        .accounts({
          game: gamePDA,
          authority: wallet.publicKey,
          mxeProgram: programId,
          mxeAccount: mxeAccount,
          compDefAccount: compDefAccount,
          mempoolAccount: mempoolAccount,
          executingPoolAccount: executingPoolAccount,
          clusterAccount: clusterAccount,
          computationAccount: computationAccount,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .instruction();

      console.log('✅ Instruction built');

      // Create and sign transaction
      console.log('📝 Creating transaction...');
      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = wallet.publicKey;

      console.log('🔐 Requesting wallet signature...');
      const signedTx = await wallet.signTransaction(transaction);

      console.log('📤 Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false, // Enable preflight to catch errors
        preflightCommitment: 'confirmed',
      });

      console.log('✅ Transaction sent:', signature);
      console.log('🔗 View on Solana Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

      // Confirm transaction
      console.log('⏳ Confirming transaction...');
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      console.log('✅ Transaction confirmation:', confirmation);
      
      // Check if transaction succeeded
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('✅ Transaction confirmed successfully!');
      console.log('🎉 Game started successfully!');

      return {
        success: true,
        signature,
        mpcSessionId: computationOffset,
      };
    } catch (err: any) {
      console.error('❌ Error starting game:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error logs:', err.logs);
      console.error('❌ Full error:', JSON.stringify(err, null, 2));
      const errorMessage = err.message || 'Failed to start game';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    startGame,
    loading,
    error,
  };
}
