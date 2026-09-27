// -------------------------------------------------------------
// SHADOW ASCENSION - GAME ROUTE
// Direct 3D RPG execution with personalized player state from custom backend.
// Seamlessly loads/saves isolated player progress, shadows, and quests.
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useCustomAuth, authFetch } from '../context/CustomAuthContext';
import { GameCanvas } from '../game/GameCanvas';
import { HUD } from '../ui/HUD';
import { MainMenu } from '../ui/MainMenu';
import { CharacterScreen } from '../ui/CharacterScreen';
import { InventoryScreen } from '../ui/InventoryScreen';
import { ShadowArmyScreen } from '../ui/ShadowArmyScreen';
import { SettingsModal } from '../ui/SettingsModal';
import { GameOverScreen } from '../ui/GameOverScreen';
import { NotificationToast } from '../ui/NotificationToast';
import { ExtractionModal } from '../ui/ExtractionModal';
import { MonsterDiscoveryModal } from '../ui/MonsterDiscoveryModal';
import { SavePrepareModal } from '../ui/SavePrepareModal';
import { BattleCountdown } from '../ui/BattleCountdown';
import { VictoryModal } from '../ui/VictoryModal';
import { SafePointModal } from '../ui/SafePointModal';
import { SaveIndicator } from '../ui/SaveIndicator';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { WelcomeHunterModal } from '../components/WelcomeHunterModal';
import {
  SaveManager,
  getOrCreateGameSessionId,
  getLocalPlayerProfile,
  setLocalPlayerProfile
} from '../utils/SaveManager';
import { ArrowLeft, Home } from 'lucide-react';

export const GameRoute = () => {
  const { user } = useCustomAuth();
  const navigate = useNavigate();

  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const recalculateStats = useGameStore((s) => s.recalculateStats);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const continueGame = useGameStore((s) => s.continueGame);
  const player = useGameStore((s) => s.player);

  const [hasEnteredDungeon, setHasEnteredDungeon] = useState(false);
  const [hasExistingSave, setHasExistingSave] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // 1. Initialize session and load server or local save
  useEffect(() => {
    recalculateStats();

    const currentSessionId = getOrCreateGameSessionId();
    setSessionId(currentSessionId);

    // If logged in, fetch user's isolated data from custom backend
    if (user) {
      const activeName = (user.displayName || 'AWAKENED HUNTER').toUpperCase();
      setPlayerName(activeName);
      setLocalPlayerProfile({ name: activeName });
      setHasEnteredDungeon(true);
      setScreen('game');

      authFetch('/api/user/game')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.progress) {
            const p = data.progress;
            useGameStore.setState((state) => ({
              player: {
                ...state.player,
                name: activeName,
                level: p.level || state.player.level || 1,
                xp: p.xp !== undefined ? p.xp : state.player.xp,
                maxXp: p.maxXp || state.player.maxXp || 100,
                hp: p.hp || state.player.hp,
                maxHp: p.maxHp || state.player.maxHp,
                mana: p.mp || state.player.mana,
                maxMana: p.maxMp || state.player.maxMana,
                gold: p.gold !== undefined ? p.gold : state.player.gold,
                shadowCores: p.shadowCores !== undefined ? p.shadowCores : state.player.shadowCores
              },
              inventory: Array.isArray(data.inventory) && data.inventory.length > 0 ? data.inventory : state.inventory,
              shadows: Array.isArray(data.shadows) && data.shadows.length > 0 ? data.shadows : state.shadows,
              quests: Array.isArray(data.quests) && data.quests.length > 0 ? data.quests : state.quests
            }));
            recalculateStats();
          }
        })
        .catch((err) => console.warn('User game load failed, using store state:', err));
    } else {
      const localProfile = getLocalPlayerProfile();
      if (localProfile?.name) {
        setPlayerName(localProfile.name);
      }

      const saveRes = SaveManager.loadGame(currentSessionId);
      if (saveRes.success && saveRes.data) {
        setHasExistingSave(true);
        continueGame();
      }
    }
  }, [user]);

  // Periodic Auto-Save to Backend for logged-in user
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const st = useGameStore.getState();
      authFetch('/api/user/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: st.player,
          dungeon: {
            currentRoom: st.currentRoom || 1,
            monstersDefeated: st.monstersDefeated || 0
          },
          inventory: st.inventory,
          shadows: st.shadows,
          quests: st.quests
        })
      }).catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // 2. Global hotkeys for in-game menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.key) return;
      const tagName = e.target?.tagName ? e.target.tagName.toLowerCase() : '';
      if (['input', 'textarea'].includes(tagName)) return;

      const key = e.key.toLowerCase();

      if (key === 'c') {
        if (currentScreen === 'character') {
          setScreen('game');
        }
      } else if (key === 'u') {
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

  const handleEnterDungeon = ({ name }) => {
    if (name) {
      setPlayerName(name);
      setLocalPlayerProfile({ name });
    }
    setHasEnteredDungeon(true);
    setScreen('game');
  };

  const handleReturnToDashboard = async () => {
    if (user) {
      const st = useGameStore.getState();
      try {
        await authFetch('/api/user/game/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player: st.player,
            dungeon: {
              currentRoom: st.currentRoom || 1,
              monstersDefeated: st.monstersDefeated || 0
            },
            inventory: st.inventory,
            shadows: st.shadows,
            quests: st.quests
          })
        });
      } catch (e) {
        // Continue
      }
      navigate('/user/dashboard');
    } else {
      navigate('/');
    }
  };

  const displayName = player?.name || user?.displayName?.toUpperCase() || getLocalPlayerProfile()?.name || 'AWAKENED HUNTER';
  const effectiveLevel = player?.level || 1;

  return (
    <ErrorBoundary onReturnToMenu={() => setScreen('menu')}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#07070b' }}>
        {/* Welcome Hunter Modal (for guests) */}
        {!hasEnteredDungeon && (
          <WelcomeHunterModal
            initialName={displayName}
            level={effectiveLevel}
            hasExistingSave={hasExistingSave}
            onEnterDungeon={handleEnterDungeon}
          />
        )}

        {/* 3D Gameplay World Canvas */}
        {currentScreen !== 'menu' && <GameCanvas />}

        {/* In-Game HUD */}
        {currentScreen === 'game' && <HUD />}

        {/* Dashboard Escape Button */}
        {hasEnteredDungeon && currentScreen === 'game' && (
          <button
            onClick={handleReturnToDashboard}
            style={{
              position: 'fixed',
              top: 14,
              right: 14,
              zIndex: 90,
              padding: '8px 14px',
              backgroundColor: 'rgba(10, 10, 20, 0.75)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: 6,
              color: '#c084fc',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
              e.currentTarget.style.borderColor = '#c084fc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(10, 10, 20, 0.75)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
            }}
          >
            <Home size={14} />
            <span>PORTAL DASHBOARD</span>
          </button>
        )}

        {/* Save Indicator */}
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

export default GameRoute;
