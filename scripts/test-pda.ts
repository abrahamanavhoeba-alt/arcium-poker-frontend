import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

const PROGRAM_ID = new PublicKey('FHzVm4eu5ZuuzX3W4YRD8rS6XZVrdXubrJnYTqgBYZu2');
const authority = new PublicKey('A7beseUd1EFwHDYePF2XB7VSdSafF19xEbRfx3oxU1YK');
const gameId = new BN(545058);

console.log('Testing PDA derivation...');
console.log('Program ID:', PROGRAM_ID.toBase58());
console.log('Authority:', authority.toBase58());
console.log('Game ID:', gameId.toString());

const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('game'),
    authority.toBuffer(),
    gameId.toArrayLike(Buffer, 'le', 8),
  ],
  PROGRAM_ID
);

console.log('\nDerived PDA:', pda.toBase58());
console.log('Bump:', bump);

// Expected by program
console.log('\nExpected by program: 3fD7KmYSWYp3fLb6d37Xf6UDvFWU76dZgRPyPfob3Ux7');
console.log('Sent by frontend:    8j8ZExyfbMfnexzx5etDPWYbJjRts7D8WqgrwrDSvNN7');
console.log('Matches expected?', pda.toBase58() === '3fD7KmYSWYp3fLb6d37Xf6UDvFWU76dZgRPyPfob3Ux7');
