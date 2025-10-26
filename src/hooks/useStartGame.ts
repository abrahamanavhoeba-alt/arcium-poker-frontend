import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import idl from '@/arcium_poker.json';
import { PROGRAM_ID, MPC_PROGRAM_ID } from '@/lib/shared/constants';

// Arcium MXE Configuration - REAL MPC ENABLED! 🚀
// ✅ Program: 5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn
// ✅ MXE Init TX: 2Wx5ULzmRHPTsHhJmVADnmpz4YwELso88xtugsxT57cME4sWMsFaFMXp3QiGDuTpezoEw9D9u44pT9bxEkoUDTkK
// ✅ Cluster: 1078779259 (Arcium devnet)
// ✅ Circuits: shuffle_deck (25 MB), deal_card (1.9 MB), generate_random (1.5 MB), reveal_hole_cards (1.4 MB)
// ✅ Real MPC: ACTIVE - Cryptographically fair shuffling via Arcium network
const MXE_PROGRAM_ID = MPC_PROGRAM_ID?.toBase58() || PROGRAM_ID.toBase58();
const CLUSTER_OFFSET = 1078779259; // Arcium devnet cluster offset
const USE_REAL_MPC = true; // ✅ REAL MPC ENABLED!

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
      console.log('🔐 Mode:', USE_REAL_MPC && MXE_PROGRAM_ID ? 'REAL Arcium MPC' : 'Mock Mode (Testing)');

      // Create provider
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // Create program instance
      const programId = new PublicKey(idl.address);
      const program = new Program(idl as any, provider);

      // Fetch all player states for this game using getProgramAccounts
      console.log('👥 Fetching player states...');
      
      // PlayerState PDA seed is ["player", game, player]
      const playerSeed = Buffer.from('player');
      
      // Get all accounts that are PlayerStates for this game
      // PlayerState discriminator from IDL: [56, 3, 60, 86, 174, 16, 244, 195]
      const playerStateDiscriminator = Buffer.from([56, 3, 60, 86, 174, 16, 244, 195]);
      
      // PlayerState layout: [discriminator(8)] [player(32)] [game(32)] [...]
      // So game field is at offset 8 + 32 = 40
      const accounts = await connection.getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 0, // Check discriminator first
              bytes: bs58.encode(playerStateDiscriminator),
            }
          },
          {
            memcmp: {
              offset: 40, // After discriminator(8) + player pubkey(32)
              bytes: gamePDA.toBase58(),
            }
          }
        ]
      });
      
      console.log(`✅ Found ${accounts.length} player state(s)`);

      // Manually decode seat_index to sort (it's at offset 72, 1 byte)
      const playerStates = accounts.map(({ pubkey, account }) => {
        const seatIndex = account.data[72]; // seat_index is at byte 72
        console.log(`  Player ${pubkey.toBase58().slice(0, 8)}... seat: ${seatIndex}`);
        return {
          pubkey,
          seatIndex,
        };
      });
      
      // Sort by seat index (CRITICAL for the program)
      const sortedPlayers = playerStates.sort((a, b) => a.seatIndex - b.seatIndex);
      console.log('✅ Players sorted by seat index');

      // Build remaining accounts array (player states)
      const remainingAccounts = sortedPlayers.map((playerData: any) => ({
        pubkey: playerData.pubkey,
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

      // Derive MXE accounts (only if using real MPC)
      let mxeAccounts: any = null;
      
      if (USE_REAL_MPC && MXE_PROGRAM_ID) {
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

        mxeAccounts = {
          programId,
          mxeAccount,
          compDefAccount,
          mempoolAccount,
          executingPoolAccount,
          computationAccount,
          clusterAccount,
        };

        console.log('🔐 MXE Accounts (REAL MPC):');
        console.log('  MXE Program:', programId.toBase58());
        console.log('  MXE Account:', mxeAccount.toBase58());
        console.log('  Comp Def:', compDefAccount.toBase58());
        console.log('  Mempool:', mempoolAccount.toBase58());
        console.log('  Exec Pool:', executingPoolAccount.toBase58());
        console.log('  Computation:', computationAccount.toBase58());
        console.log('  Cluster:', clusterAccount.toBase58());
      } else {
        console.log('🔐 Using Mock Mode (no MXE accounts - deterministic shuffle)');
      }

      // Build start game instruction
      console.log('🔨 Building start game instruction...');

      // Build accounts object (MUST be done in one call!)
      const instructionAccounts: any = {
        game: gamePDA,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      };

      // Add MXE accounts only if using real MPC
      if (mxeAccounts) {
        // Use snake_case to match IDL
        instructionAccounts.mxe_program = mxeAccounts.programId;
        instructionAccounts.mxe_account = mxeAccounts.mxeAccount;
        instructionAccounts.comp_def_account = mxeAccounts.compDefAccount;
        instructionAccounts.mempool_account = mxeAccounts.mempoolAccount;
        instructionAccounts.executing_pool_account = mxeAccounts.executingPoolAccount;
        instructionAccounts.cluster_account = mxeAccounts.clusterAccount;
        instructionAccounts.computation_account = mxeAccounts.computationAccount;
      }

      const instruction = await program.methods
        .startGame(playerEntropy)
        .accounts(instructionAccounts)
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
      
      // Decode custom error codes
      let errorMessage = err.message || 'Failed to start game';
      if (err.InstructionError) {
        const [_, errorInfo] = err.InstructionError;
        if (errorInfo?.Custom === 6021) {
          errorMessage = 'Not enough players to start game (minimum 2 required)';
        } else if (errorInfo?.Custom === 6000) {
          errorMessage = 'Game already started';
        } else if (errorInfo?.Custom) {
          errorMessage = `Smart contract error ${errorInfo.Custom}`;
        }
      }
      
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
