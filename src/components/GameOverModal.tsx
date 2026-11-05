import React from 'react';
import { sounds } from '../audio/SoundEffects';

interface GameOverModalProps {
  score: number;
  highScore: number;
  wave: number;
  totalKills: number;
  timeSurvived: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  wave,
  totalKills,
  timeSurvived,
  onPlayAgain,
  onMainMenu,
}) => {
  const isNewHighScore = score > 0 && score >= highScore;

  const minutes = Math.floor(timeSurvived / 60);
  const seconds = Math.floor(timeSurvived % 60);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 z-40 bg-black/85 flex items-center justify-center p-6 select-none font-mono">
      <div className="bg-[#12151be6] border border-red-500/30 rounded-lg max-w-md w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center text-white">
        {/* Skull Icon & Title */}
        <div className="mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-500 shadow-[0_0_20px_#ef4444]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="10" r="2" />
              <circle cx="15" cy="10" r="2" />
              <path d="M10 16h4" />
              <path d="M12 2a9 9 0 0 0-9 9c0 3.2 1.7 6 4.2 7.6V21a1 1 0 0 0 1 1h7.6a1 1 0 0 0 1-1v-2.4C18.3 17 20 14.2 20 11a9 9 0 0 0-8-9z" />
            </svg>
          </div>

          <h2 className="text-3xl font-black tracking-widest uppercase text-red-500">
            GAME OVER
          </h2>
          <p className="text-xs text-white/50 tracking-wider mt-1 uppercase">
            OPERATIVE STATUS: K.I.A. IN COMBAT ARENA
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-black/50 p-4 rounded-lg border border-white/10 mb-6 text-left">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              FINAL SCORE
            </div>
            <div className="text-2xl font-black text-white tabular-nums flex items-center gap-2">
              {score.toLocaleString()}
              {isNewHighScore && (
                <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">
                  NEW RECORD
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              RECORD SCORE
            </div>
            <div className="text-xl font-bold text-amber-400 tabular-nums">
              {highScore.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              WAVE REACHED
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              WAVE {wave}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              HOSTILES ELIMINATED
            </div>
            <div className="text-xl font-bold text-red-400 tabular-nums">
              {totalKills}
            </div>
          </div>

          <div className="col-span-2 border-t border-white/5 pt-2 flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">
              TIME SURVIVED
            </span>
            <span className="text-sm font-bold text-white/90 tabular-nums">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-widest uppercase py-4 rounded transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-red-400/50"
          >
            PLAY AGAIN
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onMainMenu();
            }}
            className="w-full bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs tracking-wider uppercase py-3 rounded transition-colors cursor-pointer border border-white/10"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
