'use client';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main headline */}
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
          <span className="text-white">DEGEN</span>
          <br />
          <span className="text-[#00ff88]">POKER</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Provably fair poker powered by Arcium MPC.
          <br />
          <span className="text-[#00ff88]">Trust math, not the house.</span>
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button className="px-8 py-4 bg-[#00ff88] text-black font-bold text-lg rounded-lg hover:bg-[#00dd77] transition-colors w-full sm:w-auto">
            Create coin
          </button>
          
          <button className="px-8 py-4 bg-transparent border border-gray-700 text-white font-bold text-lg rounded-lg hover:border-[#00ff88] transition-colors w-full sm:w-auto">
            Log in
          </button>
        </div>
        
        {/* Live stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">$420K</div>
            <div className="text-sm text-gray-500">Total Pot</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">69</div>
            <div className="text-sm text-gray-500">Active Games</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">1,337</div>
            <div className="text-sm text-gray-500">Players</div>
          </div>
        </div>
      </div>
    </section>
  );
}
