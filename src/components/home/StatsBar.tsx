'use client';

export default function StatsBar() {
  return (
    <div className="border-y border-gray-800 py-3 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between overflow-x-auto gap-8 text-sm">
          <div className="flex items-center gap-2 whitespace-nowrap text-gray-400">
            <span>Biggest pot:</span>
            <span className="text-white font-semibold">69,420 SOL</span>
          </div>
          
          <div className="flex items-center gap-2 whitespace-nowrap text-gray-400">
            <span>Last winner:</span>
            <span className="text-[#00ff88] font-semibold">Degen...xYz</span>
          </div>
          
          <div className="flex items-center gap-2 whitespace-nowrap text-gray-400">
            <span>Hands played:</span>
            <span className="text-white font-semibold">42,069</span>
          </div>
        </div>
      </div>
    </div>
  );
}
