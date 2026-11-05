import React from 'react';
import { sounds } from '../audio/SoundEffects';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6 select-none font-mono">
      <div className="bg-[#12151be6] border border-white/20 rounded-lg max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <h2 className="text-lg font-black tracking-widest uppercase">
              FIELD OPERATION MANUAL
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-white/40 hover:text-white transition-colors cursor-pointer text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Content grid */}
        <div className="space-y-5 text-xs text-white/80">
          <div>
            <h3 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] mb-2">
              1. BASIC CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded border border-white/5">
              <div>
                <span className="text-white/40">WASD</span> — Move
              </div>
              <div>
                <span className="text-white/40">MOUSE</span> — Aim Direction
              </div>
              <div>
                <span className="text-white/40">LEFT CLICK</span> — Shoot
              </div>
              <div>
                <span className="text-white/40">R</span> — Tactical Reload
              </div>
              <div>
                <span className="text-white/40">SPACE</span> — Jump
              </div>
              <div>
                <span className="text-white/40">SHIFT</span> — Sprint (Fast)
              </div>
              <div>
                <span className="text-white/40">ESC</span> — Pause / Release
              </div>
              <div>
                <span className="text-white/40">CLICK SCREEN</span> — Lock Aim
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] mb-2">
              2. BALLISTICS & CRITICAL HITBOXES
            </h3>
            <p className="leading-relaxed text-white/70">
              Hostiles take <strong className="text-white">25 damage</strong> per body shot.
              Target the glowing red visor on their heads for a{' '}
              <strong className="text-amber-400">100 damage critical headshot</strong> (+150 bonus score).
            </p>
          </div>

          <div>
            <h3 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] mb-2">
              3. TACTICAL ARENA SURVIVAL
            </h3>
            <p className="leading-relaxed text-white/70">
              Enemies swarm continuously in escalating waves. Use concrete barriers and crate
              clusters to break line-of-sight and prevent being surrounded. If your magazine runs dry,
              fall back while reloading.
            </p>
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase px-6 py-2.5 rounded transition-colors cursor-pointer"
          >
            ACKNOWLEDGE & DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
