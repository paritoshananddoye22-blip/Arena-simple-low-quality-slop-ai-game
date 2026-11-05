import React from 'react';

interface CrosshairProps {
  hitmarker: { visible: boolean; isHeadshot: boolean };
}

export const Crosshair: React.FC<CrosshairProps> = ({ hitmarker }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none z-20">
      {/* Dynamic Reticle Lines */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Top line */}
        <div
          className={`absolute top-0 w-[2px] h-[7px] transition-colors duration-75 ${
            hitmarker.visible
              ? hitmarker.isHeadshot
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              : 'bg-white/80'
          }`}
        />
        {/* Bottom line */}
        <div
          className={`absolute bottom-0 w-[2px] h-[7px] transition-colors duration-75 ${
            hitmarker.visible
              ? hitmarker.isHeadshot
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              : 'bg-white/80'
          }`}
        />
        {/* Left line */}
        <div
          className={`absolute left-0 h-[2px] w-[7px] transition-colors duration-75 ${
            hitmarker.visible
              ? hitmarker.isHeadshot
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              : 'bg-white/80'
          }`}
        />
        {/* Right line */}
        <div
          className={`absolute right-0 h-[2px] w-[7px] transition-colors duration-75 ${
            hitmarker.visible
              ? hitmarker.isHeadshot
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              : 'bg-white/80'
          }`}
        />

        {/* Center dot */}
        <div
          className={`w-[3px] h-[3px] rounded-full ${
            hitmarker.visible
              ? hitmarker.isHeadshot
                ? 'bg-amber-300'
                : 'bg-red-400'
              : 'bg-white/70'
          }`}
        />

        {/* Hitmarker X diagonal ticks */}
        {hitmarker.visible && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg
              className={`w-6 h-6 animate-pulse ${
                hitmarker.isHeadshot ? 'text-amber-400' : 'text-red-500'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="6" y1="6" x2="9" y2="9" />
              <line x1="18" y1="6" x2="15" y2="9" />
              <line x1="6" y1="18" x2="9" y2="15" />
              <line x1="18" y1="18" x2="15" y2="15" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
