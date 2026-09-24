export const QUESTS_DATABASE = [
  {
    id: 'main_awakening',
    title: 'THE AWAKENING',
    type: 'main',
    description: 'You have awakened the Ascension Core. Prove your worth in the depths of the Forgotten Crypt.',
    objectives: [
      { id: 'defeat_monsters', text: 'Enemies defeated', current: 0, target: 10 },
      { id: 'extract_shadow', text: 'Extract a Shadow Soldier', current: 0, target: 1 },
      { id: 'defeat_boss', text: 'Defeat the Abyss Warden', current: 0, target: 1 }
    ],
    rewards: {
      xp: 500,
      gold: 150,
      item: 'wpn_shadow_fang',
      shadowCores: 3
    },
    completed: false
  },
  {
    id: 'daily_purification',
    title: 'DAILY: Crypt Cleansing',
    type: 'daily',
    description: 'Purge the wandering husks to prevent dark miasma overflow.',
    objectives: [
      { id: 'defeat_any_15', text: 'Defeat monsters', current: 0, target: 15 }
    ],
    rewards: {
      xp: 250,
      gold: 80,
      shadowCores: 2
    },
    completed: false
  },
  {
    id: 'daily_shadow_monarch',
    title: 'DAILY: Shadow Commander',
    type: 'daily',
    description: 'Exercise the power of the Ascension Core by leading your shadows into combat.',
    objectives: [
      { id: 'extract_shadows_2', text: 'Extract defeated enemies', current: 0, target: 2 }
    ],
    rewards: {
      xp: 300,
      gold: 100,
      shadowCores: 3
    },
    completed: false
  }
];
