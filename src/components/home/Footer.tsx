'use client';

export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              Degen <span className="text-[#00ff88]">Poker</span>
            </h3>
            <p className="text-gray-400 text-sm">
              Provably fair poker powered by Arcium MPC on Solana.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Game</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-[#00ff88] transition-colors">Play Now</a></li>
              <li><a href="#" className="hover:text-[#00ff88] transition-colors">Lobby</a></li>
              <li><a href="#" className="hover:text-[#00ff88] transition-colors">Rules</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="https://docs.arcium.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ff88] transition-colors">Arcium Docs</a></li>
              <li><a href="https://github.com/ANAVHEOBA" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ff88] transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-[#00ff88] transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Community</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="https://twitter.com/AnavheobaDEV" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ff88] transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-[#00ff88] transition-colors">Discord</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 Degen Poker. Built for Arcium Cypherpunk Hackathon.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="text-gray-500 hover:text-[#00ff88] transition-colors">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-[#00ff88] transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
