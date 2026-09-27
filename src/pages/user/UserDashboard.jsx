// -------------------------------------------------------------
// SHADOW ASCENSION - USER DASHBOARD
// Central hub for awakened hunters to review stats and enter 3D dungeon.
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomAuth, authFetch } from '../../context/CustomAuthContext';
import { UserNav } from './UserNav';
import {
  Swords,
  Shield,
  Ghost,
  Coins,
  Scroll,
  Backpack,
  Activity,
  Award,
  ChevronRight,
  Flame,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useCustomAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await authFetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setProfileData(data);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const progress = profileData?.progress || {};
  const shadows = profileData?.shadows || [];
  const inventory = profileData?.inventory || [];
  const quests = profileData?.quests || [];

  const level = progress.level || 1;
  const xp = progress.xp || 0;
  const maxXp = progress.maxXp || 100;
  const hp = progress.hp || 560;
  const maxHp = progress.maxHp || 560;
  const mp = progress.mp || 270;
  const maxMp = progress.maxMp || 270;
  const gold = progress.gold || 100;
  const shadowCores = progress.shadowCores || 3;
  const monstersDefeated = progress.monstersDefeated || 0;
  const dungeonsCompleted = progress.dungeonsCompleted || 0;

  const xpPercentage = Math.min(100, Math.round((xp / (maxXp || 1)) * 100));

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#07070b',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <UserNav />

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Welcome Banner */}
        <div
          className="glass-panel"
          style={{
            position: 'relative',
            padding: '36px 32px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(24, 16, 48, 0.85) 0%, rgba(13, 9, 26, 0.95) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.15)',
            marginBottom: 32,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-5%',
              top: '-30%',
              width: '380px',
              height: '380px',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid #a855f7',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#c084fc',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  RANK {level > 10 ? 'S' : level > 7 ? 'A' : level > 4 ? 'B' : 'E'} AWAKENED
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Account ID: {user?.id}</span>
              </div>

              <h1
                id="hunter-welcome-title"
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: 32,
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: '1.5px',
                  color: '#ffffff',
                  textShadow: '0 0 25px rgba(168, 85, 247, 0.5)'
                }}
              >
                WELCOME BACK, {user?.displayName ? user.displayName.toUpperCase() : 'AWAKENED HUNTER'}
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#cbd5e1', fontSize: 14 }}>
                The Shadow Monarch's legacy pulses within your core. Ready to descend into the Forgotten Crypt?
              </p>
            </div>

            {/* Big CTA: ENTER 3D DUNGEON */}
            <Link
              id="enter-3d-dungeon-btn"
              to="/user/game"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
                border: '1px solid #c084fc',
                borderRadius: 8,
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 900,
                fontSize: 15,
                letterSpacing: '2px',
                boxShadow: '0 0 35px rgba(168, 85, 247, 0.5)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 45px rgba(168, 85, 247, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(168, 85, 247, 0.5)';
              }}
            >
              <Swords size={20} />
              <span>ENTER 3D DUNGEON</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              <span style={{ color: '#c084fc' }}>EXPERIENCE (LEVEL {level})</span>
              <span style={{ color: '#94a3b8' }}>
                {xp} / {maxXp} XP ({xpPercentage}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 10,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 5,
                overflow: 'hidden',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              <div
                style={{
                  width: `${xpPercentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #a855f7 0%, #38bdf8 100%)',
                  boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}
        >
          {/* Health */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 20px',
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f87171', letterSpacing: '1px' }}>HEALTH</span>
              <Activity size={16} color="#ef4444" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
              {hp} <span style={{ fontSize: 13, color: '#94a3b8' }}>/ {maxHp}</span>
            </div>
          </div>

          {/* Mana */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 20px',
              borderRadius: 8,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', letterSpacing: '1px' }}>MANA (MP)</span>
              <Zap size={16} color="#3b82f6" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
              {mp} <span style={{ fontSize: 13, color: '#94a3b8' }}>/ {maxMp}</span>
            </div>
          </div>

          {/* Gold */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 20px',
              borderRadius: 8,
              border: '1px solid rgba(234, 179, 8, 0.3)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#facc15', letterSpacing: '1px' }}>GOLD</span>
              <Coins size={16} color="#eab308" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
              {gold.toLocaleString()} <span style={{ fontSize: 12, color: '#94a3b8' }}>G</span>
            </div>
          </div>

          {/* Shadows */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 20px',
              borderRadius: 8,
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#c084fc', letterSpacing: '1px' }}>SHADOW ARMY</span>
              <Ghost size={16} color="#a855f7" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
              {shadows.length} <span style={{ fontSize: 12, color: '#94a3b8' }}>SOLDIERS</span>
            </div>
          </div>

          {/* Monsters Defeated */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 20px',
              borderRadius: 8,
              border: '1px solid rgba(34, 197, 94, 0.3)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', letterSpacing: '1px' }}>ENEMIES SLAIN</span>
              <Target size={16} color="#22c55e" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
              {monstersDefeated} <span style={{ fontSize: 12, color: '#94a3b8' }}>TOTAL</span>
            </div>
          </div>
        </div>

        {/* Feature Navigation Cards */}
        <h2
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: 16,
            color: '#e2e8f0'
          }}
        >
          HUNTER SYSTEMS
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20
          }}
        >
          {/* Card: Shadows */}
          <Link
            to="/user/shadows"
            className="glass-panel"
            style={{
              padding: 24,
              borderRadius: 10,
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: 'linear-gradient(135deg, rgba(20, 14, 40, 0.6) 0%, rgba(10, 8, 20, 0.7) 100%)',
              textDecoration: 'none',
              color: '#f8fafc',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#a855f7';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(168, 85, 247, 0.2)' }}>
                  <Ghost size={20} color="#c084fc" />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '0.8px' }}>SHADOW ARMY</h3>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                Inspect your extracted shadows ({shadows.length} extracted). Review their combat roles, summon costs, and abilities.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 18, color: '#c084fc', fontSize: 12, fontWeight: 700 }}>
              <span>VIEW SHADOWS</span>
              <ChevronRight size={14} />
            </div>
          </Link>

          {/* Card: Inventory */}
          <Link
            to="/user/inventory"
            className="glass-panel"
            style={{
              padding: 24,
              borderRadius: 10,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'linear-gradient(135deg, rgba(12, 20, 40, 0.6) 0%, rgba(8, 12, 24, 0.7) 100%)',
              textDecoration: 'none',
              color: '#f8fafc',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Backpack size={20} color="#60a5fa" />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '0.8px' }}>HUNTER INVENTORY</h3>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                Manage equipped blades, runes, and crypt relics ({inventory.length} items). Enhance your combat power.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 18, color: '#60a5fa', fontSize: 12, fontWeight: 700 }}>
              <span>VIEW INVENTORY</span>
              <ChevronRight size={14} />
            </div>
          </Link>

          {/* Card: Quests */}
          <Link
            to="/user/quests"
            className="glass-panel"
            style={{
              padding: 24,
              borderRadius: 10,
              border: '1px solid rgba(234, 179, 8, 0.3)',
              background: 'linear-gradient(135deg, rgba(30, 24, 10, 0.6) 0%, rgba(18, 14, 6, 0.7) 100%)',
              textDecoration: 'none',
              color: '#f8fafc',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#eab308';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.3)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(234, 179, 8, 0.2)' }}>
                  <Scroll size={20} color="#facc15" />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '0.8px' }}>ASCENSION QUESTS</h3>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                Track active objectives: The Awakening, Daily Cleansing, and Shadow Commander rewards.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 18, color: '#facc15', fontSize: 12, fontWeight: 700 }}>
              <span>VIEW QUESTS</span>
              <ChevronRight size={14} />
            </div>
          </Link>

          {/* Card: Profile */}
          <Link
            to="/user/profile"
            className="glass-panel"
            style={{
              padding: 24,
              borderRadius: 10,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              background: 'linear-gradient(135deg, rgba(10, 30, 20, 0.6) 0%, rgba(6, 18, 12, 0.7) 100%)',
              textDecoration: 'none',
              color: '#f8fafc',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)' }}>
                  <Award size={20} color="#34d399" />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '0.8px' }}>HUNTER ATTRIBUTES</h3>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                Review Strength, Agility, Vitality, Intelligence, and progression milestones.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 18, color: '#34d399', fontSize: 12, fontWeight: 700 }}>
              <span>VIEW ATTRIBUTES</span>
              <ChevronRight size={14} />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
