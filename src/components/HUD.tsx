import React from 'react';
import { GameHUDData } from '../game/GameManager';
import { Crosshair } from './Crosshair';

interface HUDProps {
  data: GameHUDData;
}

export const HUD: React.FC<HUDProps> = ({ data }) => {
  const healthRatio = Math.max(0, Math.min(1, data.health / data.maxHealth));
  const healthPercent = Math.round(healthRatio * 100);

  // Health color classification
  let healthColor = 'text-emerald-400';
  let healthBarBg = 'bg-emerald-500';
  if (data.health <= 30) {
    healthColor = 'text-red-500';
    healthBarBg = 'bg-red-600';
  } else if (data.health <= 60) {
    healthColor = 'text-yellow-400';
    healthBarBg = 'bg-yellow-500';
  }

  const isLowAmmo = data.magazineAmmo <= 8 && !data.isReloading && data.magazineAmmo > 0;
  const isOutOfAmmo = data.magazineAmmo === 0 && !data.isReloading;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-mono">
      {/* Damage Vignette Edge Flash */}
      <div
        className={`absolute inset-0 transition-opacity duration-150 pointer-events-none ${
          data.damageVignette ? 'opacity-80' : 'opacity-0'
        }`}
        style={{
          boxShadow: 'inset 0 0 100px 30px rgba(220, 38, 38, 0.75)',
        }}
      />

      {/* Critical Health Persistent Pulse Vignette */}
      {data.health <= 25 && data.health > 0 && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            boxShadow: 'inset 0 0 80px 20px rgba(185, 28, 28, 0.45)',
          }}
        />
      )}

      {/* Centered Crosshair */}
      <Crosshair hitmarker={data.hitmarker} />

      {/* TOP BAR / PERIMETER CLUSTER */}
      <div className="absolute top-4 inset-x-6 flex items-start justify-between">
        {/* Top-Left: Operational Status & Controls Hint */}
        <div className="bg-[#12151be6] border border-white/10 px-4 py-2.5 rounded text-xs text-white/70 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold tracking-wider text-white/90 uppercase">COMBAT ARENA</span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-white/50 text-[11px] hidden sm:inline">ESC — PAUSE</span>
        </div>

        {/* Top-Center: Wave & Score Cluster */}
        <div className="flex flex-col items-center">
          <div className="bg-[#12151be6] border border-white/10 px-6 py-2 rounded-t flex items-center gap-8">
            <div className="text-center">
              <div className="text-[10px] tracking-widest text-white/40 uppercase">WAVE</div>
              <div className="text-2xl font-black text-amber-400 tabular-nums leading-none mt-0.5">
                {data.wave}
              </div>
            </div>

            <div className="h-7 w-[1px] bg-white/10" />

            <div className="text-center">
              <div className="text-[10px] tracking-widest text-white/40 uppercase">SCORE</div>
              <div className="text-2xl font-black text-white tabular-nums leading-none mt-0.5">
                {data.score.toLocaleString()}
              </div>
            </div>

            <div className="h-7 w-[1px] bg-white/10" />

            <div className="text-center">
              <div className="text-[10px] tracking-widest text-white/40 uppercase">HIGH SCORE</div>
              <div className="text-sm font-bold text-white/70 tabular-nums leading-none mt-1">
                {data.highScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Intermission Notice */}
          {data.waveIntermission > 0 && (
            <div className="bg-amber-500/20 border border-amber-500/60 px-5 py-1.5 rounded-b text-center text-xs font-bold text-amber-300 tracking-wider uppercase animate-bounce">
              WAVE CLEARED · NEXT WAVE IN {data.waveIntermission.toFixed(1)}S
            </div>
          )}
        </div>

        {/* Top-Right: Enemies Remaining */}
        <div className="bg-[#12151be6] border border-white/10 px-4 py-2.5 rounded flex items-center gap-3">
          <svg
            className="w-5 h-5 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="10" r="2" />
            <circle cx="15" cy="10" r="2" />
            <path d="M10 16h4" />
            <path d="M12 2a9 9 0 0 0-9 9c0 3.2 1.7 6 4.2 7.6V21a1 1 0 0 0 1 1h7.6a1 1 0 0 0 1-1v-2.4C18.3 17 20 14.2 20 11a9 9 0 0 0-8-9z" />
          </svg>
          <div>
            <div className="text-[10px] tracking-widest text-white/40 uppercase">TARGETS</div>
            <div className="text-xl font-black text-red-400 tabular-nums leading-none">
              {data.enemiesRemaining}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM-LEFT: Health Gauge Cluster */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1.5">
        <div className="bg-[#12151be6] border border-white/10 px-5 py-3 rounded w-64 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 ${healthColor}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-[11px] font-bold tracking-widest text-white/60 uppercase">
                HEALTH
              </span>
            </div>
            <div className={`text-2xl font-black tabular-nums ${healthColor}`}>
              {healthPercent}
              <span className="text-xs text-white/30 font-normal"> / 100</span>
            </div>
          </div>

          {/* Segmented-style Health Bar */}
          <div className="w-full h-3 bg-black/60 rounded-sm overflow-hidden p-0.5 border border-white/5">
            <div
              className={`h-full rounded-xs transition-all duration-150 ${healthBarBg}`}
              style={{ width: `${healthRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: Weapon & Ammunition Cluster */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
        {/* Status Alert Pills (Reloading / Low Ammo / Empty) */}
        {data.isReloading && (
          <div className="bg-amber-500 text-black px-4 py-1.5 rounded font-black text-xs tracking-wider uppercase animate-pulse shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            RELOADING...
          </div>
        )}

        {isOutOfAmmo && (
          <div className="bg-red-600 text-white px-4 py-1.5 rounded font-black text-xs tracking-wider uppercase animate-bounce shadow-lg">
            OUT OF AMMO · PRESS [R] TO RELOAD
          </div>
        )}

        {isLowAmmo && (
          <div className="bg-yellow-500/90 text-black px-3 py-1 rounded font-bold text-xs tracking-wider uppercase">
            LOW AMMO [R]
          </div>
        )}

        {/* Tactical Magazine Readout */}
        <div className="bg-[#12151be6] border border-white/10 px-5 py-3 rounded shadow-xl flex items-center gap-6">
          <div className="text-left">
            <div className="text-[10px] tracking-widest text-white/40 uppercase">WEAPON</div>
            <div className="text-sm font-bold text-white/80 tracking-wide mt-0.5">
              AR-24 RIFLE
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-4xl font-black tabular-nums leading-none ${
                data.magazineAmmo <= 5 ? 'text-red-500' : 'text-white'
              }`}
            >
              {data.magazineAmmo}
            </span>
            <span className="text-lg font-bold text-white/30 tabular-nums">/</span>
            <span className="text-lg font-bold text-white/50 tabular-nums">
              {data.reserveAmmo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
