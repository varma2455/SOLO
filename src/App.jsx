import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { GameCanvas } from './game/GameCanvas';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { CharacterScreen } from './ui/CharacterScreen';
import { InventoryScreen } from './ui/InventoryScreen';
import { ShadowArmyScreen } from './ui/ShadowArmyScreen';
import { SettingsModal } from './ui/SettingsModal';
import { GameOverScreen } from './ui/GameOverScreen';
import { NotificationToast } from './ui/NotificationToast';
import { ExtractionModal } from './ui/ExtractionModal';
import { MonsterDiscoveryModal } from './ui/MonsterDiscoveryModal';
import { SavePrepareModal } from './ui/SavePrepareModal';
import { BattleCountdown } from './ui/BattleCountdown';
import { VictoryModal } from './ui/VictoryModal';
import { SafePointModal } from './ui/SafePointModal';
import { SaveIndicator } from './ui/SaveIndicator';
import { ErrorBoundary } from './ui/ErrorBoundary';

export const App = () => {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const recalculateStats = useGameStore((s) => s.recalculateStats);

  // Initialize stats on mount
  useEffect(() => {
    recalculateStats();
  }, []);

  // Global hotkeys for menu screens
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Don't trigger if typing in an input
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;

      if (key === 'c') {
        setScreen(currentScreen === 'character' ? 'game' : 'character');
      } else if (key === 'i' || key === 'b') {
        setScreen(currentScreen === 'inventory' ? 'game' : 'inventory');
      } else if (key === 'y') {
        setScreen(currentScreen === 'shadows' ? 'game' : 'shadows');
      } else if (key === 'escape') {
        if (currentScreen !== 'game' && currentScreen !== 'menu') {
          setScreen('game');
        } else if (currentScreen === 'game') {
          setScreen('settings');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen]);

  return (
    <ErrorBoundary onReturnToMenu={() => setScreen('menu')}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#07070b' }}>
        {/* 3D Gameplay World Canvas (active when playing or browsing in-game menus) */}
        {currentScreen !== 'menu' && <GameCanvas />}

        {/* In-Game HUD (active during game mode) */}
        {currentScreen === 'game' && <HUD />}

        {/* Non-intrusive Save Indicator */}
        <SaveIndicator />

        {/* Explore-First Decision & Transition Modals */}
        <MonsterDiscoveryModal />
        <SavePrepareModal />
        <BattleCountdown />
        <VictoryModal />
        <SafePointModal />

        {/* Screen Modals & Menus */}
        {currentScreen === 'menu' && <MainMenu />}
        {currentScreen === 'character' && <CharacterScreen />}
        {currentScreen === 'inventory' && <InventoryScreen />}
        {currentScreen === 'shadows' && <ShadowArmyScreen />}
        {currentScreen === 'settings' && <SettingsModal />}
        {currentScreen === 'gameover' && <GameOverScreen />}

        {/* Notification Toast Banners */}
        <NotificationToast />

        {/* Soul Extraction Overlay Modal */}
        <ExtractionModal />
      </div>
    </ErrorBoundary>
  );
};

export default App;
