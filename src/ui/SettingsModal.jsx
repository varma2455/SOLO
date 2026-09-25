import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { sound } from '../audio/soundManager';
import { X, Volume2, VolumeX, Save, RotateCcw, Trash2 } from 'lucide-react';

export const SettingsModal = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const previousScreen = useGameStore((s) => s.previousScreen);
  const saveGame = useGameStore((s) => s.saveGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality || 'high');
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);
  const autoFpsOptimization = useGameStore((s) => s.autoFpsOptimization);
  const setAutoFpsOptimization = useGameStore((s) => s.setAutoFpsOptimization);
  const cameraSettings = useGameStore((s) => s.cameraSettings) || { sensitivity: 1.0, invertY: false, cameraShake: true };
  const setCameraSetting = useGameStore((s) => s.setCameraSetting);

  const [volume, setVolumeState] = useState(sound.volume);
  const [muted, setMutedState] = useState(sound.muted);

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    sound.setVolume(val);
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    sound.setMuted(next);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(5, 4, 10, 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 640,
          border: '1px solid rgba(168, 85, 247, 0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 800, fontSize: 20, margin: 0, color: '#f3f4f6' }}>
            SYSTEM CONFIGURATION
          </h2>
          <button
            onClick={() => setScreen(previousScreen === 'settings' ? 'game' : previousScreen)}
            className="btn-rpg btn-rpg-secondary"
            style={{ padding: '6px 12px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Audio Controls */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 12, letterSpacing: '1px' }}>
              AUDIO & SOUND EFFECTS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={toggleMute}
                className="btn-rpg btn-rpg-secondary"
                style={{ padding: '8px 12px' }}
              >
                {muted ? <VolumeX size={18} color="#ef4444" /> : <Volume2 size={18} color="#4ade80" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                style={{ flex: 1, accentColor: '#a855f7', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 40, textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Graphics & Performance Settings */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 10, letterSpacing: '1px' }}>
              GRAPHICS & PERFORMANCE
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['low', 'medium', 'high', 'ultra'].map((q) => (
                <button
                  key={q}
                  onClick={() => setGraphicsQuality(q)}
                  className={`btn-rpg ${graphicsQuality === q ? 'glow-box-purple' : 'btn-rpg-secondary'}`}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderColor: graphicsQuality === q ? '#a855f7' : undefined,
                    background: graphicsQuality === q ? 'rgba(147, 51, 234, 0.3)' : undefined
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>Auto FPS Optimization</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Dynamically throttles particle & shadow LOD if frame rate drops</div>
              </div>
              <button
                onClick={() => setAutoFpsOptimization(!autoFpsOptimization)}
                className={`btn-rpg ${autoFpsOptimization ? 'glow-box-purple' : 'btn-rpg-secondary'}`}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderColor: autoFpsOptimization ? '#10b981' : '#6b7280',
                  color: autoFpsOptimization ? '#34d399' : '#9ca3af'
                }}
              >
                {autoFpsOptimization ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Third-Person Camera Settings */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 10, letterSpacing: '1px' }}>
              CAMERA CONFIGURATION
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 4 }}>
              {/* Sensitivity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#f3f4f6' }}>Camera Sensitivity</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>{cameraSettings.sensitivity?.toFixed(1) || '1.0'}x</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={cameraSettings.sensitivity || 1.0}
                  onChange={(e) => setCameraSetting('sensitivity', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
                />
              </div>

              {/* Invert Y and Camera Shake Toggles */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 4 }}>
                  <span style={{ fontSize: 12, color: '#f3f4f6' }}>Invert Y</span>
                  <button
                    onClick={() => setCameraSetting('invertY', !cameraSettings.invertY)}
                    className="btn-rpg"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderColor: cameraSettings.invertY ? '#38bdf8' : '#4b5563',
                      color: cameraSettings.invertY ? '#38bdf8' : '#9ca3af'
                    }}
                  >
                    {cameraSettings.invertY ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 4 }}>
                  <span style={{ fontSize: 12, color: '#f3f4f6' }}>Camera Shake</span>
                  <button
                    onClick={() => setCameraSetting('cameraShake', cameraSettings.cameraShake !== false ? false : true)}
                    className="btn-rpg"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderColor: cameraSettings.cameraShake !== false ? '#10b981' : '#4b5563',
                      color: cameraSettings.cameraShake !== false ? '#34d399' : '#9ca3af'
                    }}
                  >
                    {cameraSettings.cameraShake !== false ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Guide */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 10, letterSpacing: '1px' }}>
              KEYBOARD & MOUSE CONTROLS
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                fontSize: 12,
                background: 'rgba(0, 0, 0, 0.4)',
                padding: 12,
                borderRadius: 4
              }}
            >
              <div><strong style={{ color: '#fbbf24' }}>W / A / S / D</strong> &bull; Move Kael</div>
              <div><strong style={{ color: '#fbbf24' }}>Mouse Move</strong> &bull; Free Look</div>
              <div><strong style={{ color: '#fbbf24' }}>Left Click (LMB)</strong> &bull; 3-Hit Combo</div>
              <div><strong style={{ color: '#fbbf24' }}>Q</strong> &bull; Shadow Slash</div>
              <div><strong style={{ color: '#fbbf24' }}>E / Space</strong> &bull; Phantom Dash</div>
              <div><strong style={{ color: '#fbbf24' }}>R</strong> &bull; Eclipse Strike (Ult)</div>
              <div><strong style={{ color: '#fbbf24' }}>F</strong> &bull; Interact / Potion</div>
              <div><strong style={{ color: '#fbbf24' }}>TAB</strong> &bull; Target Lock (Toggle)</div>
            </div>
          </div>

          {/* Save / Load / Reset Buttons */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 10, letterSpacing: '1px' }}>
              LOCAL STORAGE SAVE DATA
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveGame}
                className="btn-rpg glow-box-purple"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}
              >
                <Save size={16} /> SAVE GAME
              </button>
              <button
                onClick={loadGame}
                className="btn-rpg btn-rpg-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}
              >
                <RotateCcw size={16} /> LOAD GAME
              </button>
              <button
                onClick={resetGame}
                className="btn-rpg btn-rpg-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, borderColor: '#ef4444', color: '#fca5a5' }}
              >
                <Trash2 size={16} /> RESET
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
