// -------------------------------------------------------------
// SHADOW ASCENSION - SYSTEM SETTINGS PAGE
// Route: /admin/settings
// Global gameplay config, balance multipliers, security, and danger zone
// -------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { authFetch } from '../../context/AuthContext';
import {
  Sliders,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Zap,
  Lock,
  Flame,
  Radio,
  Power
} from 'lucide-react';

export const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [settings, setSettings] = useState({
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
    difficulty: 'Normal',
    enemyDensity: 1.0,
    bossScaling: 1.0,
    maintenanceMode: false,
    registrationOpen: true,
    pvpEnabled: false,
    shadowExtractionBonus: 10,
    auditLoggingEnabled: true,
    sessionTimeoutMinutes: 60
  });

  const loadSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authFetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings
          }));
        }
      }
    } catch (err) {
      setErrorMsg('Failed to load system settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save settings.');
      }
      setSuccessMsg('System configuration and balance settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEmergencyLock = () => {
    if (window.confirm('Enable emergency maintenance lockdown? Normal users will be temporarily locked out.')) {
      setSettings((prev) => ({ ...prev, maintenanceMode: true }));
      setSuccessMsg('Maintenance lockdown enabled. Save settings to apply.');
    }
  };

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel, serif)',
              fontSize: 26,
              fontWeight: 900,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '1px'
            }}
          >
            SYSTEM SETTINGS
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 13, letterSpacing: '0.5px' }}>
            GLOBAL GAMEPLAY, SECURITY & BALANCE &middot; MULTIPLIERS AND REALM POLICIES
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadSettings}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>RESET FORM</span>
          </button>

          <button
            id="admin-save-settings-btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 20px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: '1px solid #f87171',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'SAVING...' : 'SAVE CONFIGURATION'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            borderRadius: 6,
            color: '#4ade80',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: 13
          }}
        >
          <AlertTriangle size={16} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* SECTION 1: GAME BALANCE MULTIPLIERS */}
        <div
          style={{
            padding: '24px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Zap size={18} color="#facc15" />
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 16, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              1. GAMEPLAY & BALANCE MULTIPLIERS
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {/* XP Multiplier */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>GLOBAL XP MULTIPLIER</label>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#38bdf8' }}>{settings.xpMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={settings.xpMultiplier}
                onChange={(e) => setSettings({ ...settings, xpMultiplier: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Multiplies player experience gained from monsters & quests.
              </div>
            </div>

            {/* Gold Multiplier */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>GLOBAL GOLD MULTIPLIER</label>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#facc15' }}>{settings.goldMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={settings.goldMultiplier}
                onChange={(e) => setSettings({ ...settings, goldMultiplier: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#facc15' }}
              />
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Multiplies gold drop amounts in dungeons and bounties.
              </div>
            </div>

            {/* Enemy Density */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#cbd5e1' }}>ENEMY SPAWN DENSITY</label>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#f87171' }}>{settings.enemyDensity}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={settings.enemyDensity}
                onChange={(e) => setSettings({ ...settings, enemyDensity: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Scales monster count in dungeon rooms 1 and 2.
              </div>
            </div>

            {/* Difficulty Preset */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                DIFFICULTY PRESET
              </label>
              <select
                value={settings.difficulty}
                onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 12
                }}
              >
                <option value="Normal" style={{ background: '#0a0a14' }}>Normal (Default)</option>
                <option value="Hard" style={{ background: '#0a0a14' }}>Hard (Enhanced aggression)</option>
                <option value="Nightmare" style={{ background: '#0a0a14' }}>Nightmare (Boss scaling +50%)</option>
              </select>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Adjusts global monster HP and attack scaling.
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SYSTEM & REALM TOGGLES */}
        <div
          style={{
            padding: '24px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Radio size={18} color="#38bdf8" />
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 16, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              2. REALM POLICIES & ACCESS TOGGLES
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* Maintenance Mode Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: 8,
                background: settings.maintenanceMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${settings.maintenanceMode ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: settings.maintenanceMode ? '#f87171' : '#f8fafc' }}>
                  MAINTENANCE MODE
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Only administrators may enter the realm.
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>

            {/* Registration Open Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: 8,
                background: settings.registrationOpen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${settings.registrationOpen ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: settings.registrationOpen ? '#4ade80' : '#f8fafc' }}>
                  PUBLIC REGISTRATION
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Allow new players to create accounts at /register.
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.registrationOpen}
                onChange={(e) => setSettings({ ...settings, registrationOpen: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#22c55e', cursor: 'pointer' }}
              />
            </div>

            {/* PvP Duels Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
                  PVP DUELING ARENA
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Enable hunter vs hunter duels in the shadow domain.
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.pvpEnabled}
                onChange={(e) => setSettings({ ...settings, pvpEnabled: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#a855f7', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SECURITY & AUDIT */}
        <div
          style={{
            padding: '24px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Lock size={18} color="#ef4444" />
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 16, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              3. SECURITY & AUDIT LOGGING
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#cbd5e1', marginBottom: 6 }}>
                OVERSEER SESSION TIMEOUT (MINUTES)
              </label>
              <input
                type="number"
                min="15"
                max="720"
                value={settings.sessionTimeoutMinutes || 60}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                style={{ width: '100%', padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Enforces re-authentication after idle duration.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>STRICT AUDIT LOGGING</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Log all role switches and account status actions</div>
              </div>
              <input
                type="checkbox"
                checked={settings.auditLoggingEnabled !== false}
                onChange={(e) => setSettings({ ...settings, auditLoggingEnabled: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#22c55e', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: DANGER ZONE */}
        <div
          style={{
            padding: '24px',
            borderRadius: 10,
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: 16, fontWeight: 900, margin: 0, color: '#f87171' }}>
              4. DANGER ZONE
            </h2>
          </div>

          <p style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 16 }}>
            Actions here affect system-wide connectivity and require administrative confirmation.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleEmergencyLock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 6,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#f87171',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <Power size={14} /> EMERGENCY MAINTENANCE LOCK
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
