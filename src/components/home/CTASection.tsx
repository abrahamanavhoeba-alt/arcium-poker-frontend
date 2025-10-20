'use client';

export default function CTASection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
          Ready to <span className="text-[#00ff88]">play</span>?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Quick Join */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors cursor-pointer">
            <h3 className="text-xl font-bold mb-2">Quick Join</h3>
            <p className="text-gray-400 text-sm mb-4">Jump into a game instantly</p>
            <div className="text-[#00ff88] font-semibold">0.1 SOL min</div>
          </div>
          
          {/* Create Game */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors cursor-pointer">
            <h3 className="text-xl font-bold mb-2">Create Game</h3>
            <p className="text-gray-400 text-sm mb-4">Set your own stakes</p>
            <div className="text-[#00ff88] font-semibold">Custom blinds</div>
          </div>
          
          {/* High Stakes */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00ff88] transition-colors cursor-pointer">
            <h3 className="text-xl font-bold mb-2">High Stakes</h3>
            <p className="text-gray-400 text-sm mb-4">For true degens only</p>
            <div className="text-[#00ff88] font-semibold">10+ SOL</div>
          </div>
        </div>
      </div>
    </section>
  );
}
