import React from 'react';
import { sounds } from '../audio/SoundEffects';

interface MainMenuProps {
  highScore: number;
  onPlay: () => void;
  onHowToPlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  highScore,
  onPlay,
  onHowToPlay,
  isMuted,
  onToggleMute,
}) => {
  // Listen for Enter or Space to quickly start
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        sounds.playClick();
        onPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlay]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 sm:p-12 select-none font-mono">
      {/* Top Header: Brand Tag & Mute Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]" />
          <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
            MILITARY SIMULATION // DEV-SECTOR 04
          </span>
        </div>

        <div className="flex items-center gap-4">
          {highScore > 0 && (
            <div className="bg-[#12151be6] border border-white/10 px-4 py-1.5 rounded text-xs text-white/80">
              <span className="text-white/40 mr-2 uppercase tracking-wider">RECORD</span>
              <span className="font-bold text-amber-400 tabular-nums">
                {highScore.toLocaleString()} PTS
              </span>
            </div>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            className="bg-[#12151be6] hover:bg-white/10 border border-white/10 p-2.5 rounded text-white/80 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke Title Lockup */}
      <div className="max-w-xl my-auto">
        {/* Custom Inline SVG Title Graphic */}
        <div className="mb-4">
          <svg className="w-full max-w-lg h-auto" viewBox="0 0 460 70" fill="none">
            {/* Target Reticle Accent */}
            <circle cx="28" cy="35" r="18" stroke="#ef4444" strokeWidth="2.5" />
            <circle cx="28" cy="35" r="8" stroke="#ef4444" strokeWidth="1.5" />
            <line x1="28" y1="10" x2="28" y2="60" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="3" y1="35" x2="53" y2="35" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />

            {/* Title Typographic Path */}
            <text
              x="62"
              y="48"
              fill="white"
              fontFamily="monospace"
              fontWeight="900"
              fontSize="40"
              letterSpacing="3"
            >
              3D FPS ARENA
            </text>
          </svg>
        </div>

        <p className="text-sm font-semibold tracking-[0.25em] text-red-400 uppercase mb-8 pl-1">
          SURVIVE. SHOOT. REPEAT.
        </p>

        <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-8 max-w-md pl-1">
          Enclosed tactical survival combat. Engage hostiles with your standard-issue
          assault rifle, hold chokepoints, aim for precision headshots, and endure relentless waves.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pl-1">
          <button
            onClick={() => {
              sounds.playClick();
              onPlay();
            }}
            className="group relative bg-red-600 hover:bg-red-500 text-white font-black text-sm tracking-widest uppercase px-8 py-4 rounded shadow-[0_0_24px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center justify-center gap-3 border border-red-400/50"
          >
            <svg
              className="w-4 h-4 fill-current transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>ENTER ARENA [ENTER / SPACE]</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onHowToPlay();
            }}
            className="bg-[#12151be6] hover:bg-white/10 border border-white/20 text-white/90 font-bold text-xs tracking-wider uppercase px-6 py-4 rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>TACTICAL BRIEFING</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-white/50 tracking-wider">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>WASD Move</span>
          <span>·</span>
          <span>Mouse Aim</span>
          <span>·</span>
          <span>Left Click Shoot</span>
          <span>·</span>
          <span>R Reload</span>
          <span>·</span>
          <span>Space Jump</span>
          <span>·</span>
          <span>Shift Sprint</span>
          <span>·</span>
          <span>Esc Pause</span>
        </div>

        <div className="mt-2 sm:mt-0 text-white/30 text-[10px]">
          POWERED BY THREE.JS · 60 FPS PBR SIMULATION
        </div>
      </div>
    </div>
  );
};
