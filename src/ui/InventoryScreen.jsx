import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RARITIES } from '../data/items';
import { X, Sword, Shield, Heart, Sparkles, Gem, Disc } from 'lucide-react';

export const InventoryScreen = () => {
  const inventory = useGameStore((s) => s.inventory);
  const player = useGameStore((s) => s.player);
  const equipItem = useGameStore((s) => s.equipItem);
  const useConsumable = useGameStore((s) => s.useConsumable);
  const setScreen = useGameStore((s) => s.setScreen);
  const previousScreen = useGameStore((s) => s.previousScreen);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(inventory[0] || null);

  const tabs = [
    { id: 'all', label: 'ALL' },
    { id: 'weapon', label: 'WEAPONS' },
    { id: 'armor', label: 'ARMOR' },
    { id: 'accessory', label: 'ACCESSORIES' },
    { id: 'consumable', label: 'CONSUMABLES' }
  ];

  const filteredItems = inventory.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'weapon': return <Sword size={16} />;
      case 'armor': return <Shield size={16} />;
      case 'accessory': return <Disc size={16} />;
      default: return <Sparkles size={16} />;
    }
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
          maxWidth: 980,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(168, 85, 247, 0.4)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-purple-light)', letterSpacing: '2px' }}>
                DIMENSIONAL STORAGE
              </div>
              <h2 style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 800, fontSize: 24, margin: 0, color: '#f3f4f6' }}>
                INVENTORY
              </h2>
            </div>
            {/* Currency displays */}
            <div style={{ display: 'flex', gap: 16, background: 'rgba(0, 0, 0, 0.4)', padding: '6px 14px', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
                <span>GOLD:</span> <span>{player.gold}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c084fc', fontSize: 13, fontWeight: 700 }}>
                <span>ESSENCE:</span> <span>{player.shadowCores}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setScreen(previousScreen === 'inventory' ? 'game' : previousScreen)}
            className="btn-rpg btn-rpg-secondary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <X size={16} /> CLOSE
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'btn-rpg' : 'btn-rpg btn-rpg-secondary'}
              style={{ padding: '6px 16px', fontSize: 12 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, padding: 24, overflowY: 'auto' }}>
          {/* Inventory Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 10,
              alignContent: 'start'
            }}
          >
            {filteredItems.map((item, idx) => {
              const rarity = RARITIES[item.rarity] || RARITIES.common;
              const isSelected = selectedItem === item;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    aspectRatio: '1',
                    background: rarity.bg,
                    border: `2px solid ${isSelected ? '#ffffff' : rarity.border}`,
                    borderRadius: 6,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 14px rgba(255, 255, 255, 0.4)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ color: rarity.color, alignSelf: 'flex-start' }}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#f3f4f6', wordBreak: 'break-word', lineHeight: 1.2 }}>
                    {item.name}
                  </div>
                  {item.count && item.count > 1 && (
                    <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 10, fontWeight: 800, color: '#fbbf24' }}>
                      x{item.count}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: '#6b7280' }}>
                No items in this category.
              </div>
            )}
          </div>

          {/* Item Details Panel */}
          {selectedItem ? (
            <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: RARITIES[selectedItem.rarity]?.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {RARITIES[selectedItem.rarity]?.name} {selectedItem.category}
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>LVL {selectedItem.level || 1}</span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 800, fontSize: 20, color: '#f3f4f6', marginBottom: 12 }}>
                  {selectedItem.name}
                </h3>

                <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5, marginBottom: 18 }}>
                  {selectedItem.description}
                </p>

                {/* Stat Bonuses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                  {selectedItem.attack && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#f87171' }}>
                      <span>Attack Power</span>
                      <span style={{ fontWeight: 700 }}>+{selectedItem.attack}</span>
                    </div>
                  )}
                  {selectedItem.defense && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#60a5fa' }}>
                      <span>Defense</span>
                      <span style={{ fontWeight: 700 }}>+{selectedItem.defense}</span>
                    </div>
                  )}
                  {selectedItem.maxHp && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4ade80' }}>
                      <span>Health Points (HP)</span>
                      <span style={{ fontWeight: 700 }}>+{selectedItem.maxHp}</span>
                    </div>
                  )}
                  {selectedItem.critChance && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#fbbf24' }}>
                      <span>Critical Chance</span>
                      <span style={{ fontWeight: 700 }}>+{selectedItem.critChance}%</span>
                    </div>
                  )}
                  {selectedItem.healAmount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4ade80' }}>
                      <span>Restores Health</span>
                      <span style={{ fontWeight: 700 }}>+{selectedItem.healAmount} HP</span>
                    </div>
                  )}
                  {selectedItem.manaAmount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#38bdf8' }}>
                      <span>Restores Mana</span>
                      <span style={{ fontWeight: 700 }}>+{selectedItem.manaAmount} MP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {['weapon', 'armor', 'accessory'].includes(selectedItem.category) && (
                  <button
                    onClick={() => equipItem(selectedItem)}
                    className="btn-rpg glow-box-purple"
                    style={{ flex: 1, padding: '10px 18px', fontSize: 14 }}
                  >
                    EQUIP
                  </button>
                )}
                {selectedItem.category === 'consumable' && (
                  <button
                    onClick={() => useConsumable(selectedItem)}
                    className="btn-rpg"
                    style={{ flex: 1, padding: '10px 18px', fontSize: 14 }}
                  >
                    USE ITEM
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
              Select an item to view attributes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
