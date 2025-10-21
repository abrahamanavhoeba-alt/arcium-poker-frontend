import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import idl from '@/arcium_poker.json';

// Arcium constants
const MXE_PROGRAM_ID = 'FHzVm4eu5ZuuzX3W4YRD8rS6XZVrdXubrJnYTqgBYZu2'; // Our program is the MXE
const CLUSTER_OFFSET = 1078779259; // From deployment

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
      console.log('🔐 Using REAL Arcium MPC!');

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // Create program instance
      const program = new Program(idl as any, provider);

      // Fetch all player states for this game
      console.log('👥 Fetching player states...');
      const allPlayerStates = await (program.account as any).PlayerState.all();
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

      // Generate computation offset (unique ID for this shuffle)
      const computationOffset = new Uint8Array(8);
      crypto.getRandomValues(computationOffset);

      // Derive MXE accounts (same logic as smart contract)
      const programId = new PublicKey(MXE_PROGRAM_ID);

      // MXE account PDA: ["mxe", program_id]
      const [mxeAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("mxe"), programId.toBuffer()],
        programId
      );

      // Computation definition PDA: ["comp_def", program_id, comp_def_offset]
      const compDefOffset = Buffer.alloc(4);
      compDefOffset.writeUInt32LE(1, 0); // shuffle = 1
      const [compDefAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("comp_def"), programId.toBuffer(), compDefOffset],
        programId
      );

      // Mempool account PDA: ["mempool", program_id]
      const [mempoolAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("mempool"), programId.toBuffer()],
        programId
      );

      // Executing pool PDA: ["executing_pool", program_id]
      const [executingPoolAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("executing_pool"), programId.toBuffer()],
        programId
      );

      // Computation account PDA: ["computation", program_id, computation_offset]
      const [computationAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("computation"), programId.toBuffer(), computationOffset],
        programId
      );

      // Cluster account - this is on Arcium network, not a PDA
      // We'll use the cluster offset to derive it
      const clusterOffset = Buffer.alloc(8);
      clusterOffset.writeBigUInt64LE(BigInt(CLUSTER_OFFSET), 0);
      const [clusterAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("cluster"), clusterOffset],
        programId
      );

      console.log('🔐 MXE Accounts:');
      console.log('  MXE Program:', programId.toBase58());
      console.log('  MXE Account:', mxeAccount.toBase58());
      console.log('  Comp Def:', compDefAccount.toBase58());
      console.log('  Mempool:', mempoolAccount.toBase58());
      console.log('  Exec Pool:', executingPoolAccount.toBase58());
      console.log('  Computation:', computationAccount.toBase58());
      console.log('  Cluster:', clusterAccount.toBase58());

      // Build start game instruction with MXE accounts
      console.log('🔨 Building start game instruction with REAL MPC...');
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
        skipPreflight: true,
        preflightCommitment: 'confirmed',
      });

      console.log('✅ Transaction sent:', signature);
      console.log('🎉 Game started with REAL Arcium MPC!');

      // Confirm transaction
      console.log('⏳ Confirming transaction...');
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      console.log('✅ Transaction confirmed!');
      console.log('🎉 Game started successfully with Arcium MPC!');

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
