// -------------------------------------------------------------
// SHADOW ASCENSION - WELCOME HUNTER MODAL
// Anonymous player welcome & name customization modal.
// No Firebase authentication required for normal players.
// -------------------------------------------------------------

import React, { useState } from 'react';
import { Shield, Play, User, Sparkles, Hash } from 'lucide-react';
import { getOrCreateGameSessionId, getLocalPlayerProfile, setLocalPlayerProfile } from '../utils/SaveManager';

export const WelcomeHunterModal = ({ initialName, level = 1, hasExistingSave = false, onEnterDungeon }) => {
  const localProfile = getLocalPlayerProfile();
  const sessionId = getOrCreateGameSessionId();
  const [hunterName, setHunterName] = useState(localProfile?.name || initialName || 'AWAKENED HUNTER');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = hunterName.trim() || 'AWAKENED HUNTER';
    setLocalPlayerProfile({ name: cleanName });
    if (onEnterDungeon) {
      onEnterDungeon({ name: cleanName, sessionId });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9990,
        padding: 24
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '40px 36px',
          border: '2px solid rgba(168, 85, 247, 0.6)',
          boxShadow: '0 0 50px rgba(147, 51, 234, 0.4), inset 0 0 20px rgba(147, 51, 234, 0.15)',
          borderRadius: 12,
          textAlign: 'center',
          animation: 'modalSlideUp 0.35s ease-out'
        }}
      >
        {/* Core Awakening Crest */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7e22ce, #3b0764)',
              border: '2px solid #c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(168, 85, 247, 0.7)'
            }}
          >
            <Shield size={34} color="#38bdf8" />
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '4px',
            color: '#c084fc',
            textTransform: 'uppercase',
            marginBottom: 6
          }}
        >
          THE ASCENSION CORE AWAKENS
        </div>

        {/* Header */}
        <h1
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 28,
            fontWeight: 900,
            color: '#f8fafc',
            letterSpacing: '2px',
            margin: '0 0 6px 0',
            textShadow: '0 0 25px rgba(168, 85, 247, 0.6)'
          }}
        >
          WELCOME, HUNTER
        </h1>

        {/* Session ID Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '1px',
            marginBottom: 20
          }}
        >
          <Hash size={12} /> SESSION {sessionId}
        </div>

        {/* Hunter Status / Save Info */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#cbd5e1',
            marginBottom: 24
          }}
        >
          {hasExistingSave ? (
            <span style={{ color: '#38bdf8' }}>
              RESUMING MISSION &bull; LEVEL {level} AWAKENED
            </span>
          ) : (
            <span style={{ color: '#a855f7' }}>
              INITIAL RECONNAISSANCE &bull; RANK E CRYPT
            </span>
          )}
        </div>

        {/* Name Customization Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#94a3b8',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              HUNTER NAME
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="#c084fc"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={hunterName}
                onChange={(e) => setHunterName(e.target.value)}
                maxLength={24}
                required
                placeholder="Enter Hunter Name..."
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 44px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(168, 85, 247, 0.45)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c084fc';
                  e.target.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(168, 85, 247, 0.45)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.5)';
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '0.5px' }}>
              Custom in-game callsign for this device session. No account needed.
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="btn-rpg glow-box-purple"
            style={{
              marginTop: 6,
              width: '100%',
              padding: '16px',
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
              borderColor: '#c084fc',
              color: '#ffffff',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(147, 51, 234, 0.5)'
            }}
          >
            <Play size={18} />
            {hasExistingSave ? 'CONTINUE EXPEDITION' : 'ENTER DUNGEON'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeHunterModal;
