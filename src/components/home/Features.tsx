'use client';

export default function Features() {
  return (
    <section className="py-16 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          Why <span className="text-[#00ff88]">Arcium</span> Poker?
        </h2>
        <p className="text-center text-gray-400 mb-12">
          Not your average poker site
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Feature 1 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors">
            <h3 className="text-lg font-bold mb-2">🔐 Encrypted Cards</h3>
            <p className="text-gray-400 text-sm">
              Your cards stay hidden via Arcium MPC.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors">
            <h3 className="text-lg font-bold mb-2">🎲 Fair Shuffle</h3>
            <p className="text-gray-400 text-sm">
              Provably random. Every player contributes.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors">
            <h3 className="text-lg font-bold mb-2">⚡ Instant Payouts</h3>
            <p className="text-gray-400 text-sm">
              Win the pot, get paid instantly.
            </p>
          </div>
          
          {/* Feature 4 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors">
            <h3 className="text-lg font-bold mb-2">🛡️ No Rugs</h3>
            <p className="text-gray-400 text-sm">
              Smart contract controlled. Math &gt; Trust.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
