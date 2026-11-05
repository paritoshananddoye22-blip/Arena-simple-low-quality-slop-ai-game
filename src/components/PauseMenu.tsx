import React from 'react';
import { sounds } from '../audio/SoundEffects';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  sensitivity,
  onSensitivityChange,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-6 select-none font-mono">
      <div className="bg-[#12151be6] border border-white/20 rounded-lg max-w-sm w-full p-6 sm:p-8 shadow-2xl text-center text-white">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] tracking-widest uppercase font-bold mb-3">
            TACTICAL SIMULATION SUSPENDED
          </div>
          <h2 className="text-2xl font-black tracking-widest uppercase text-white">
            GAME PAUSED
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-8">
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-widest uppercase py-3.5 rounded transition-all cursor-pointer shadow-lg border border-emerald-400/40"
          >
            RESUME OPERATION [ESC]
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onRestart();
            }}
            className="w-full bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs tracking-wider uppercase py-3 rounded transition-colors cursor-pointer border border-red-500/40"
          >
            RESTART MISSION
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onMainMenu();
            }}
            className="w-full bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs tracking-wider uppercase py-3 rounded transition-colors cursor-pointer border border-white/10"
          >
            ABORT TO MAIN MENU
          </button>
        </div>

        {/* Tactical Controls & Audio Settings */}
        <div className="border-t border-white/10 pt-5 space-y-4 text-left">
          {/* Mouse Sensitivity */}
          <div>
            <div className="flex justify-between text-[11px] text-white/60 mb-1.5 uppercase">
              <span>Aim Sensitivity</span>
              <span className="font-bold text-white">
                {(sensitivity * 1000).toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.005"
              step="0.0002"
              value={sensitivity}
              onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-black/60 rounded"
            />
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between text-[11px] text-white/60 mb-1.5 uppercase">
              <span>Master Volume</span>
              <span className="font-bold text-white">
                {isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={isMuted}
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-black/60 rounded disabled:opacity-30"
              />
              <button
                onClick={() => {
                  sounds.playClick();
                  onToggleMute();
                }}
                className="text-[10px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded uppercase font-bold text-white/80 cursor-pointer"
              >
                {isMuted ? 'UNMUTE' : 'MUTE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
