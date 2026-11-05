/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameManager, GameHUDData } from './game/GameManager';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { sounds } from './audio/SoundEffects';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameManagerRef = useRef<GameManager | null>(null);

  const [hudData, setHudData] = useState<GameHUDData>({
    gameState: 'MENU',
    health: 100,
    maxHealth: 100,
    magazineAmmo: 30,
    reserveAmmo: 120,
    isReloading: false,
    score: 0,
    highScore: 0,
    wave: 1,
    enemiesRemaining: 0,
    waveIntermission: 0,
    hitmarker: { visible: false, isHeadshot: false },
    damageVignette: false,
    timeSurvived: 0,
    totalKills: 0,
  });

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.0022);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const gm = new GameManager(canvasRef.current);
    gameManagerRef.current = gm;
    (window as unknown as { __gameManager: GameManager }).__gameManager = gm;

    gm.onHUDUpdate = (data) => {
      setHudData((prev) => {
        // Fast shallow comparison to prevent unnecessary React renders
        if (
          prev.gameState === data.gameState &&
          prev.health === data.health &&
          prev.magazineAmmo === data.magazineAmmo &&
          prev.reserveAmmo === data.reserveAmmo &&
          prev.isReloading === data.isReloading &&
          prev.score === data.score &&
          prev.highScore === data.highScore &&
          prev.wave === data.wave &&
          prev.enemiesRemaining === data.enemiesRemaining &&
          Math.abs(prev.waveIntermission - data.waveIntermission) < 0.1 &&
          prev.hitmarker.visible === data.hitmarker.visible &&
          prev.damageVignette === data.damageVignette &&
          Math.floor(prev.timeSurvived) === Math.floor(data.timeSurvived) &&
          prev.totalKills === data.totalKills
        ) {
          return prev;
        }
        return { ...data };
      });
    };

    return () => {
      gm.destroy();
      gameManagerRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    gameManagerRef.current?.startGame();
  };

  const handleResume = () => {
    gameManagerRef.current?.resumeGame();
  };

  const handleRestart = () => {
    gameManagerRef.current?.restartGame();
  };

  const handleMainMenu = () => {
    gameManagerRef.current?.goToMainMenu();
  };

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    if (gameManagerRef.current) {
      gameManagerRef.current.player.mouseSensitivity = val;
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    sounds.setVolume(val);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#12151b] select-none">
      {/* 3D WebGL Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair focus:outline-none"
      />

      {/* Active In-Game HUD (During PLAYING or PAUSED) */}
      {(hudData.gameState === 'PLAYING' || hudData.gameState === 'PAUSED') && (
        <HUD data={hudData} />
      )}

      {/* Main Menu Overlay */}
      {hudData.gameState === 'MENU' && (
        <MainMenu
          highScore={hudData.highScore}
          onPlay={handleStartGame}
          onHowToPlay={() => setShowHowToPlay(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Pause Menu Modal */}
      {hudData.gameState === 'PAUSED' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          sensitivity={sensitivity}
          onSensitivityChange={handleSensitivityChange}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {hudData.gameState === 'GAMEOVER' && (
        <GameOverModal
          score={hudData.score}
          highScore={hudData.highScore}
          wave={hudData.wave}
          totalKills={hudData.totalKills}
          timeSurvived={hudData.timeSurvived}
          onPlayAgain={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Tactical Operation Manual (How to Play) */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}
