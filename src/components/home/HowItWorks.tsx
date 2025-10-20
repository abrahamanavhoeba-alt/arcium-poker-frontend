'use client';

export default function HowItWorks() {
  return (
    <section className="py-16 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          How it works
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00ff88] text-black font-bold text-lg rounded-full flex items-center justify-center">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Connect Wallet</h3>
              <p className="text-gray-400 text-sm">
                Connect your Solana wallet (Phantom, Backpack, etc.)
              </p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00ff88] text-black font-bold text-lg rounded-full flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Join or Create</h3>
              <p className="text-gray-400 text-sm">
                Jump into an existing game or create your own table
              </p>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00ff88] text-black font-bold text-lg rounded-full flex items-center justify-center">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Play & Win</h3>
              <p className="text-gray-400 text-sm">
                Cards are dealt encrypted. Play your hand. Win the pot.
              </p>
            </div>
          </div>
        </div>
        
        {/* Arcium MPC Explainer */}
        <div className="mt-16 max-w-3xl mx-auto bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4 text-center">
            Powered by <span className="text-[#00ff88]">Arcium MPC</span>
          </h3>
          <p className="text-gray-400 text-center mb-6 text-sm">
            Multi-Party Computation ensures no single party can cheat
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl mb-2">🎲</div>
              <div className="font-semibold text-sm">Encrypted Shuffle</div>
            </div>
            <div>
              <div className="text-3xl mb-2">🃏</div>
              <div className="font-semibold text-sm">Hidden Cards</div>
            </div>
            <div>
              <div className="text-3xl mb-2">✅</div>
              <div className="font-semibold text-sm">Verifiable Fair</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
