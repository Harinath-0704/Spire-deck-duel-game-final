import type { Card } from '../game/types/card';

export const CARD_DATABASE: Record<string, Card> = {
  // ATTACK CARDS (Need 4)
  'fire-strike': {
    id: 'fire-strike',
    name: 'Fire Strike',
    description: 'Deal 6 damage.',
    type: 'ATTACK',
    rarity: 'COMMON',
    energyCost: 1,
    damage: 6,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'shadow-hit': {
    id: 'shadow-hit',
    name: 'Shadow Hit',
    description: 'Deal 5 damage + effect.',
    type: 'ATTACK',
    rarity: 'COMMON',
    energyCost: 1,
    damage: 5,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'lightning-slash': {
    id: 'lightning-slash',
    name: 'Lightning Slash',
    description: 'Deal 7 damage.',
    type: 'ATTACK',
    rarity: 'COMMON',
    energyCost: 2,
    damage: 7,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'poison-blade': {
    id: 'poison-blade',
    name: 'Poison Blade',
    description: 'Deal 4 damage + poison.',
    type: 'ATTACK',
    rarity: 'COMMON',
    energyCost: 1,
    damage: 4,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'meteor-strike': {
    id: 'meteor-strike',
    name: 'Meteor Strike',
    description: 'Deal 10 damage.',
    type: 'ATTACK',
    rarity: 'EPIC',
    energyCost: 3,
    damage: 10,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 300
  },
  'dragon-breath': {
    id: 'dragon-breath',
    name: 'Dragon Breath',
    description: 'Deal 15 damage.',
    type: 'ATTACK',
    rarity: 'LEGENDARY',
    energyCost: 4,
    damage: 15,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 800
  },
  'void-strike': {
    id: 'void-strike',
    name: 'Void Strike',
    description: 'Deal 8 damage + drain.',
    type: 'ATTACK',
    rarity: 'EPIC',
    energyCost: 2,
    damage: 8,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 400
  },

  // DEFENSE CARDS (Need 3)
  'energy-shield': {
    id: 'energy-shield',
    name: 'Energy Shield',
    description: 'Gain 6 block.',
    type: 'DEFENSE',
    rarity: 'COMMON',
    energyCost: 1,
    block: 6,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'iron-wall': {
    id: 'iron-wall',
    name: 'Iron Wall',
    description: 'Gain 8 block.',
    type: 'DEFENSE',
    rarity: 'COMMON',
    energyCost: 2,
    block: 8,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'counter-guard': {
    id: 'counter-guard',
    name: 'Counter Guard',
    description: 'Gain 5 block + counter.',
    type: 'DEFENSE',
    rarity: 'COMMON',
    energyCost: 1,
    block: 5,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'titan-shield': {
    id: 'titan-shield',
    name: 'Titan Shield',
    description: 'Gain 12 block.',
    type: 'DEFENSE',
    rarity: 'EPIC',
    energyCost: 3,
    block: 12,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 300
  },
  'divine-aegis': {
    id: 'divine-aegis',
    name: 'Divine Aegis',
    description: 'Gain 20 block.',
    type: 'DEFENSE',
    rarity: 'LEGENDARY',
    energyCost: 4,
    block: 20,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 800
  },
  'crystal-barrier': {
    id: 'crystal-barrier',
    name: 'Crystal Barrier',
    description: 'Gain 10 block + reflect.',
    type: 'DEFENSE',
    rarity: 'EPIC',
    energyCost: 2,
    block: 10,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 400
  },

  // SPECIAL CARDS (Need 3)
  'heal': {
    id: 'heal',
    name: 'Heal',
    description: 'Restore 5 HP.',
    type: 'SPECIAL',
    rarity: 'COMMON',
    energyCost: 2,
    healing: 5,
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'freeze': {
    id: 'freeze',
    name: 'Freeze',
    description: 'Opponent loses next action.',
    type: 'SPECIAL',
    rarity: 'COMMON',
    energyCost: 2,
    specialEffect: 'FREEZE',
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'rage': {
    id: 'rage',
    name: 'Rage',
    description: 'Boost next attack.',
    type: 'SPECIAL',
    rarity: 'COMMON',
    energyCost: 1,
    specialEffect: 'RAGE',
    skins: [],
    activeSkinId: 'default',
    isStarter: true
  },
  'vampiric-drain': {
    id: 'vampiric-drain',
    name: 'Vampiric Drain',
    description: 'Deal 3 damage, heal 3 HP.',
    type: 'SPECIAL',
    rarity: 'EPIC',
    energyCost: 2,
    damage: 3,
    healing: 3,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 300
  },
  'time-warp': {
    id: 'time-warp',
    name: 'Time Warp',
    description: 'Take an extra turn.',
    type: 'SPECIAL',
    rarity: 'LEGENDARY',
    energyCost: 5,
    specialEffect: 'EXTRA_TURN',
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 1200
  },
  'soul-link': {
    id: 'soul-link',
    name: 'Soul Link',
    description: 'Heal 10 HP.',
    type: 'SPECIAL',
    rarity: 'EPIC',
    energyCost: 3,
    healing: 10,
    skins: [],
    activeSkinId: 'default',
    isStarter: false,
    price: 500
  }
};

// Valid default deck of 10 cards exactly
export const INITIAL_DECK: Card[] = [
  CARD_DATABASE['fire-strike'],
  CARD_DATABASE['shadow-hit'],
  CARD_DATABASE['lightning-slash'],
  CARD_DATABASE['poison-blade'],
  CARD_DATABASE['energy-shield'],
  CARD_DATABASE['iron-wall'],
  CARD_DATABASE['counter-guard'],
  CARD_DATABASE['heal'],
  CARD_DATABASE['freeze'],
  CARD_DATABASE['rage']
];
