export const RARITIES = {
  common: { name: 'Common', color: '#9ca3af', border: '#4b5563', bg: 'rgba(75, 85, 99, 0.2)' },
  uncommon: { name: 'Uncommon', color: '#4ade80', border: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
  rare: { name: 'Rare', color: '#38bdf8', border: '#0284c7', bg: 'rgba(2, 132, 199, 0.2)' },
  epic: { name: 'Epic', color: '#c084fc', border: '#9333ea', bg: 'rgba(147, 51, 234, 0.25)' },
  legendary: { name: 'Legendary', color: '#fbbf24', border: '#d97706', bg: 'rgba(217, 119, 6, 0.25)' },
  mythic: { name: 'Mythic', color: '#f43f5e', border: '#e11d48', bg: 'rgba(225, 29, 72, 0.3)' }
};

export const ITEMS_DATABASE = [
  // Weapons
  {
    id: 'wpn_hunter_dagger',
    name: "Initiate's Dagger",
    category: 'weapon',
    rarity: 'common',
    level: 1,
    attack: 8,
    critChance: 2,
    description: 'Standard issue awakened hunter blade. Worn but reliable.',
    icon: 'Sword'
  },
  {
    id: 'wpn_shadow_fang',
    name: 'Shadow Fang Daggers',
    category: 'weapon',
    rarity: 'rare',
    level: 3,
    attack: 28,
    critChance: 6,
    speed: 1,
    description: 'Blades forged from hardened crypt crystals. Echoes with quiet darkness.',
    icon: 'Sword'
  },
  {
    id: 'wpn_abyss_cleaver',
    name: 'Void Edge Greatsword',
    category: 'weapon',
    rarity: 'epic',
    level: 5,
    attack: 65,
    critChance: 12,
    description: 'A heavy blade that pulses with abyssal resonance, carving void rifts with every strike.',
    icon: 'Sword'
  },
  {
    id: 'wpn_umbral_reaper',
    name: 'Umbral Sovereign Scythe',
    category: 'weapon',
    rarity: 'legendary',
    level: 8,
    attack: 110,
    critChance: 20,
    critDamage: 35,
    description: 'The pinnacle of dark weaponry. Feeds on the souls of extracted foes.',
    icon: 'Sword'
  },

  // Armor
  {
    id: 'arm_scout_tunic',
    name: 'Scout Leather Garb',
    category: 'armor',
    rarity: 'common',
    level: 1,
    defense: 6,
    maxHp: 30,
    description: 'Lightweight leather armor suitable for low-rank hunter missions.',
    icon: 'Shield'
  },
  {
    id: 'arm_crypt_mail',
    name: 'Crypt Walker Mail',
    category: 'armor',
    rarity: 'rare',
    level: 3,
    defense: 22,
    maxHp: 120,
    description: 'Reinforced chainmail salvaged from forgotten crypt sentinels.',
    icon: 'Shield'
  },
  {
    id: 'arm_shadow_plate',
    name: 'Duskfall Cuirass',
    category: 'armor',
    rarity: 'epic',
    level: 6,
    defense: 48,
    maxHp: 280,
    description: 'Dark-infused plate armor that absorbs incoming physical shocks into the void.',
    icon: 'Shield'
  },

  // Accessories
  {
    id: 'acc_shadow_ring',
    name: 'Band of the Eclipsed',
    category: 'accessory',
    rarity: 'uncommon',
    level: 2,
    maxMana: 40,
    critChance: 4,
    description: 'A dark silver ring that expands the wearer’s mana reservoir.',
    icon: 'Disc'
  },
  {
    id: 'acc_abyss_amulet',
    name: 'Heart of the Void Core',
    category: 'accessory',
    rarity: 'epic',
    level: 5,
    attack: 18,
    maxMana: 80,
    critDamage: 25,
    description: 'An ancient talisman radiating with Ascension Core dark energy.',
    icon: 'Flame'
  },

  // Consumables
  {
    id: 'con_hp_potion',
    name: 'Elixir of Restoration',
    category: 'consumable',
    rarity: 'common',
    level: 1,
    healAmount: 120,
    description: 'Restores 120 HP instantly.',
    icon: 'Heart'
  },
  {
    id: 'con_mp_potion',
    name: 'Starlight Mana Draft',
    category: 'consumable',
    rarity: 'common',
    level: 1,
    manaAmount: 90,
    description: 'Replenishes 90 MP instantly.',
    icon: 'Sparkles'
  },
  {
    id: 'con_shadow_core',
    name: 'Ascension Essence Shard',
    category: 'consumable',
    rarity: 'rare',
    level: 1,
    description: 'Purified shadow matter used to level up and evolve your Shadow Army.',
    icon: 'Gem'
  }
];

export const getRandomLoot = (enemyType) => {
  const roll = Math.random();
  const loot = [];

  if (roll < 0.45) {
    loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'con_hp_potion'), count: 1 });
  }
  if (roll < 0.35) {
    loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'con_mp_potion'), count: 1 });
  }

  // Equipment drops
  if (enemyType === 'cryptGuardian') {
    if (Math.random() < 0.7) {
      loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'wpn_shadow_fang') });
    }
    if (Math.random() < 0.6) {
      loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'arm_crypt_mail') });
    }
  } else if (enemyType === 'abyssWarden') {
    loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'wpn_abyss_cleaver') });
    loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'acc_abyss_amulet') });
    loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'con_shadow_core'), count: 5 });
  } else if (roll < 0.15) {
    loot.push({ ...ITEMS_DATABASE.find(i => i.id === 'acc_shadow_ring') });
  }

  return loot;
};
