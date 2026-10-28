import React, { useEffect, useRef } from 'react';
import { useFarmStore } from './store/useFarmStore';
import { Farm3DCanvas } from './components/Farm3DCanvas';
import { TopBar } from './components/TopBar';
import { Dock } from './components/Dock';
import { NotificationToast } from './components/NotificationToast';

// Modals
import { CowDetailModal } from './components/modals/CowDetailModal';
import { HerdManagerModal } from './components/modals/HerdManagerModal';
import { FeedingModal } from './components/modals/FeedingModal';
import { MilkingModal } from './components/modals/MilkingModal';
import { HealthModal } from './components/modals/HealthModal';
import { BarnModal } from './components/modals/BarnModal';
import { FinanceModal } from './components/modals/FinanceModal';
import { BreedEngineerModal } from './components/modals/BreedEngineerModal';
import { ReproWheelModal } from './components/modals/ReproWheelModal';
import { SettingsModal } from './components/modals/SettingsModal';

import { synthAudio } from './lib/audio/synthAudio';

export const App: React.FC = () => {
  const {
    farm,
    tick,
    setGameSpeed,
    activeModal,
    setActiveModal,
    toggleZenMode,
    setCameraPreset,
    selectedCowId,
    setSelectedCowId,
  } = useFarmStore();

  const prevTimeRef = useRef<number>(performance.now());

  // Main Simulation Loop
  useEffect(() => {
    let animId: number;

    const loop = (currentTime: number) => {
      const deltaSec = (currentTime - prevTimeRef.current) / 1000;
      prevTimeRef.current = currentTime;

      // Cap deltaSec to avoid huge leap on tab defocus
      const clampedDelta = Math.min(deltaSec, 0.2);
      tick(clampedDelta);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tick]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio unlock on user interaction
      synthAudio.userGestureUnlock();

      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setGameSpeed(farm.gameSpeed === 0 ? 1 : 0);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        const speeds = [1, 4, 12, 24, 120];
        const nextIdx = (speeds.indexOf(farm.gameSpeed) + 1) % speeds.length;
        setGameSpeed(speeds[nextIdx]);
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        toggleZenMode();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        setActiveModal(activeModal === 'none' ? 'herd' : 'none');
      } else if (e.code === 'Escape') {
        if (selectedCowId) {
          setSelectedCowId(null);
        } else if (activeModal !== 'none') {
          setActiveModal('none');
        }
      } else if (e.code === 'Digit1') {
        setCameraPreset(1);
      } else if (e.code === 'Digit2') {
        setCameraPreset(2);
      } else if (e.code === 'Digit3') {
        setCameraPreset(3);
      } else if (e.code === 'Digit4') {
        setCameraPreset(4);
      } else if (e.code === 'Digit5') {
        setCameraPreset(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [farm.gameSpeed, activeModal, selectedCowId, setGameSpeed, setActiveModal, toggleZenMode, setCameraPreset, setSelectedCowId]);

  // Unlock Web Audio on first click anywhere
  const handleUserClick = () => {
    synthAudio.userGestureUnlock();
  };

  return (
    <div
      onClick={handleUserClick}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none"
    >
      {/* 3D Farm Canvas */}
      <Farm3DCanvas />

      {/* Top Bar Stats & Controls */}
      <TopBar />

      {/* Quick Navigation Floating Dock */}
      <Dock />

      {/* Real-time Event & Alert Notifications */}
      <NotificationToast />

      {/* Modals */}
      <CowDetailModal />
      <HerdManagerModal />
      <FeedingModal />
      <MilkingModal />
      <HealthModal />
      <BarnModal />
      <FinanceModal />
      <BreedEngineerModal />
      <ReproWheelModal />
      <SettingsModal />
    </div>
  );
};

export default App;
