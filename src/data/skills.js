export const SKILLS = {
  shadowSlash: {
    id: 'shadowSlash',
    name: 'Shadow Slash',
    key: 'Q',
    description: 'Unleash a swift crescent blade of concentrated dark essence that tears through enemies in front of you.',
    cooldown: 4.0, // seconds
    manaCost: 20,
    damageMultiplier: 2.5,
    range: 5.5,
    knockback: 3.5,
    icon: 'Sword',
    color: '#a855f7',
    colorLight: '#e9d5ff'
  },
  voidBurst: {
    id: 'voidBurst',
    name: 'Void Burst',
    key: 'E',
    description: 'Detonate a vortex of abyssal energy in an area around you, repelling and crushing surrounding foes.',
    cooldown: 6.5,
    manaCost: 35,
    damageMultiplier: 3.2,
    radius: 6.0,
    knockback: 5.0,
    icon: 'Zap',
    color: '#8b5cf6',
    colorLight: '#c4b5fd'
  },
  phantomStep: {
    id: 'phantomStep',
    name: 'Phantom Step',
    key: 'SPACE',
    description: 'Dissolve into shadows, dashing forward at high velocity with 0.6s of complete invulnerability.',
    cooldown: 2.2,
    manaCost: 15,
    invulnerableDuration: 0.6,
    dashDistance: 6.0,
    icon: 'Wind',
    color: '#06b6d4',
    colorLight: '#a5f3fc'
  },
  eclipseDominion: {
    id: 'eclipseDominion',
    name: 'Eclipse Dominion',
    key: 'R',
    description: 'Summon the true might of the Ascension Core. Smashes the ground with cataclysmic dark energy and supercharges active shadows.',
    cooldown: 20.0,
    manaCost: 60,
    damageMultiplier: 6.0,
    radius: 9.0,
    knockback: 7.0,
    icon: 'Flame',
    color: '#d946ef',
    colorLight: '#f5d0fe'
  }
};
