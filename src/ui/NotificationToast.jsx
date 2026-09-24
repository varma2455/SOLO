import React from 'react';
import { useGameStore } from '../store/gameStore';

export const NotificationToast = () => {
  const notifications = useGameStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 100,
        pointerEvents: 'none'
      }}
    >
      {notifications.map((item) => {
        const isLevel = item.type === 'level';
        const isShadow = item.type === 'shadow';
        const isDanger = item.type === 'danger';

        const borderColor = isLevel ? '#f59e0b' : isShadow ? '#c084fc' : isDanger ? '#ef4444' : '#38bdf8';
        const titleColor = isLevel ? '#fbbf24' : isShadow ? '#e9d5ff' : isDanger ? '#f87171' : '#7dd3fc';

        return (
          <div
            key={item.id}
            className="glass-panel"
            style={{
              padding: '10px 24px',
              minWidth: 320,
              maxWidth: 480,
              border: `1px solid ${borderColor}`,
              boxShadow: `0 0 20px ${borderColor}44`,
              textAlign: 'center',
              animation: 'fadeInDown 0.3s ease-out'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: '2px',
                color: titleColor
              }}
            >
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: '#e5e7eb', marginTop: 2 }}>
              {item.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
};
