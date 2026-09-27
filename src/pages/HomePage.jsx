// -------------------------------------------------------------
// SHADOW ASCENSION - PROFESSIONAL HOME PAGE (Requirements 1, 2, 3, 27)
// -------------------------------------------------------------

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCustomAuth } from '../context/CustomAuthContext';
import { Navbar } from '../components/Navbar';
import {
  Swords,
  Users,
  Castle,
  TrendingUp,
  Backpack,
  Cloud,
  Play,
  Shield,
  Zap,
  Sparkles,
  ChevronRight,
  Target,
  ArrowRight,
  Crown
} from 'lucide-react';

export const HomePage = () => {
  const { user, isAdmin, isUser } = useCustomAuth();
  const canvasRef = useRef(null);

  // Animated background ember particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.6,
      speedY: -(Math.random() * 0.7 + 0.3),
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.45 ? '#c084fc' : '#38bdf8'
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const features = [
    {
      icon: <Swords size={32} color="#38bdf8" />,
      title: 'REAL-TIME COMBAT',
      badge: '⚔ ACTION ENGINE',
      description: 'Fight monsters directly with high-tempo 3-hit weapon combos, phantom dashes, and devastating area skills.'
    },
    {
      icon: <Users size={32} color="#c084fc" />,
      title: 'SHADOW COMPANIONS',
      badge: '◆ SOUL EXTRACTION',
      description: 'Extract and summon your own living Shadows. Issue real-time attack and recall orders while fighting simultaneously.'
    },
    {
      icon: <Castle size={32} color="#fbbf24" />,
      title: 'DUNGEONS',
      badge: '🏰 THE CRYPT',
      description: 'Explore increasingly dangerous rooms filled with skeletal sentinels, blood lurkers, and terrifying dungeon bosses.'
    },
    {
      icon: <TrendingUp size={32} color="#10b981" />,
      title: 'CHARACTER PROGRESSION',
      badge: '📈 AWAKENING',
      description: 'Level up, allocate attribute stat points into STR, AGI, INT, and VIT, and awaken higher core rank potential.'
    },
    {
      icon: <Backpack size={32} color="#f472b6" />,
      title: 'INVENTORY & LOOT',
      badge: '🎒 EQUIPMENT',
      description: 'Collect enchanted swords, rare crypt armor, health elixirs, and shadow cores dropped from fallen foes.'
    },
    {
      icon: <Cloud size={32} color="#60a5fa" />,
      title: 'CLOUD SAVE',
      badge: '☁ MULTI-USER',
      description: 'Your character progress, shadow army, and dungeon milestones are persistently bound to your personal hunter account.'
    }
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#07070b',
        color: '#f3f4f6',
        overflowX: 'hidden',
        overflowY: 'auto',
        height: '100vh'
      }}
    >
      {/* Background Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Atmospheric Radial Glows */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.22) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: 68 }}>
        {/* HERO SECTION */}
        <section
          id="hero"
          style={{
            minHeight: 'calc(100vh - 68px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 24px',
            position: 'relative'
          }}
        >
          {/* Core Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              borderRadius: 20,
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.25)',
              marginBottom: 20
            }}
          >
            <Sparkles size={14} color="#38bdf8" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#c084fc',
                textTransform: 'uppercase'
              }}
            >
              ORIGINAL 3D ACTION RPG &bull; NEXT-GEN CORE
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: 'clamp(44px, 7vw, 92px)',
              fontWeight: 900,
              lineHeight: 1.05,
              margin: '0 0 16px 0',
              letterSpacing: '3px',
              textShadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(147, 51, 234, 0.3)'
            }}
          >
            SHADOW ASCENSION
          </h1>

          {/* Subtitle Slogan */}
          <div
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: 'clamp(18px, 3vw, 28px)',
              fontWeight: 800,
              letterSpacing: '6px',
              color: '#38bdf8',
              marginBottom: 24,
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(56, 189, 248, 0.6)'
            }}
          >
            &ldquo;AWAKEN. SUMMON. CONQUER.&rdquo;
          </div>

          {/* Description */}
          <p
            style={{
              maxWidth: 680,
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.7,
              color: '#cbd5e1',
              margin: '0 auto 40px auto',
              fontWeight: 500
            }}
          >
            Enter a dangerous world of dungeons, monsters and living shadows.
            Build your character, extract powerful Shadows and fight your way
            through increasingly dangerous rooms.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Link
              to="/game"
              className="btn-rpg glow-box-purple"
              style={{
                padding: '16px 42px',
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
                borderColor: '#c084fc',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: 6,
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)'
              }}
            >
              <Play size={20} /> PLAY GAME
            </Link>

            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                className="btn-rpg"
                style={{
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '1.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderColor: '#ef4444',
                  color: '#f87171',
                  textDecoration: 'none',
                  borderRadius: 6
                }}
              >
                <Crown size={18} /> ADMIN DASHBOARD
              </Link>
            ) : isUser ? (
              <Link
                to="/user/dashboard"
                className="btn-rpg"
                style={{
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '1.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(56, 189, 248, 0.15)',
                  borderColor: '#38bdf8',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  borderRadius: 6
                }}
              >
                <Shield size={18} /> HUNTER DASHBOARD
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-rpg btn-rpg-secondary"
                style={{
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textDecoration: 'none',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#c084fc',
                  borderColor: 'rgba(168, 85, 247, 0.35)'
                }}
              >
                LOGIN / ENTER
              </Link>
            )}
          </div>

          {/* Micro Status Footnote */}
          <div
            style={{
              marginTop: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              fontSize: 12,
              color: '#94a3b8',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}
          >
            <span>&bull; REAL-TIME THREE.JS 3D</span>
            <span>&bull; CLOUD STATE PERSISTENCE</span>
            <span>&bull; DUAL COMBAT ENGINE</span>
          </div>
        </section>

        {/* FEATURES SECTION (Requirement 3) */}
        <section
          id="features"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '80px 24px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '4px',
                color: 'var(--accent-purple-light)',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              CORE GAME SYSTEMS
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '2px',
                color: '#f8fafc'
              }}
            >
              FEATURES
            </h2>
            <div
              style={{
                width: 70,
                height: 3,
                background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
                margin: '16px auto 0 auto',
                borderRadius: 2
              }}
            />
          </div>

          {/* Features Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24
            }}
          >
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '30px 26px',
                  borderRadius: 8,
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 189, 248, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.25)';
                  e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.6)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {feat.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '1px',
                      padding: '4px 10px',
                      borderRadius: 12,
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.3)'
                    }}
                  >
                    {feat.badge}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: '1px',
                    margin: '0 0 10px 0',
                    color: '#f8fafc'
                  }}
                >
                  {feat.title}
                </h3>

                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW TO PLAY SECTION */}
        <section
          id="how-to-play"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '80px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '4px',
                color: '#38bdf8',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              COMBAT & COMMAND MATRIX
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '2px',
                color: '#f8fafc'
              }}
            >
              HOW TO PLAY
            </h2>
            <div
              style={{
                width: 70,
                height: 3,
                background: 'linear-gradient(90deg, #a855f7, #38bdf8)',
                margin: '16px auto 0 auto',
                borderRadius: 2
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20
            }}
          >
            {/* Control Card 1 */}
            <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <span className="keycap">W</span>
                <span className="keycap">A</span>
                <span className="keycap">S</span>
                <span className="keycap">D</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, color: '#f8fafc', margin: '0 0 6px 0' }}>
                HUNTER MOVEMENT
              </h4>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Navigate 3D crypt corridors. Move with directional keys and control dynamic camera orientation with mouse look.
              </p>
            </div>

            {/* Control Card 2 */}
            <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <span className="keycap" style={{ width: 'auto', padding: '0 12px' }}>LMB</span>
                <span className="keycap">SPACE</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, color: '#f8fafc', margin: '0 0 6px 0' }}>
                COMBAT & DODGE
              </h4>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Left Click triggers responsive 3-hit melee combos. Press Space or E to execute an invulnerable phantom dash.
              </p>
            </div>

            {/* Control Card 3 */}
            <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <span className="keycap" style={{ borderColor: '#38bdf8', color: '#38bdf8' }}>Z</span>
                <span className="keycap">X</span>
                <span className="keycap">C</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, color: '#f8fafc', margin: '0 0 6px 0' }}>
                SHADOW COMMANDS
              </h4>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Press <strong>Z</strong> to summon or order attacks. Press <strong>X</strong> to target hostiles. Press <strong>C</strong> to recall your soldier to formation.
              </p>
            </div>

            {/* Control Card 4 */}
            <div className="glass-panel" style={{ padding: '24px 20px', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <span className="keycap">1</span>
                <span className="keycap">2</span>
                <span className="keycap">3</span>
                <span className="keycap">4</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 17, color: '#f8fafc', margin: '0 0 6px 0' }}>
                SHADOW ABILITIES
              </h4>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Trigger Shadow Slash (1), Shadow Guard (2), Shadow Step (3), and Dark Strike (4) using independent Shadow MP.
              </p>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section
          id="about"
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '80px 24px',
            textAlign: 'center'
          }}
        >
          <div className="glass-panel" style={{ padding: '44px 36px', borderRadius: 10, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '3px', color: '#c084fc', marginBottom: 10 }}>
              DARK FANTASY EXPEDITION
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 900,
                color: '#f8fafc',
                margin: '0 0 20px 0'
              }}
            >
              ABOUT SHADOW ASCENSION
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 1.8, maxWidth: 760, margin: '0 auto 30px auto' }}>
              Built with cutting-edge WebGL 3D rendering and an authoritative multi-user cloud architecture,
              Shadow Ascension delivers an immersive dungeon crawler experience. Each hunter maintains their own
              independent rank, personal shadow army, and persistent progression.
            </p>

            <Link
              to="/game"
              className="btn-rpg glow-box-purple"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 34px',
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '1px',
                background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
                borderColor: '#c084fc',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: 6
              }}
            >
              ENTER THE DUNGEON <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '30px 24px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: 12,
            letterSpacing: '1.5px',
            backgroundColor: 'rgba(5, 5, 10, 0.9)'
          }}
        >
          <div style={{ marginBottom: 8, color: '#94a3b8', fontWeight: 700 }}>
            SHADOW ASCENSION &bull; ORIGINAL 3D ACTION RPG
          </div>
          <div>POWERED BY THREE.JS, REACT & FIREBASE MULTI-USER CLOUD ARCHITECTURE</div>
        </footer>
      </main>

      <style>{`
        .keycap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 4px;
          color: #f8fafc;
          font-family: monospace;
          font-weight: 800;
          font-size: 13px;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </div>
  );
};
