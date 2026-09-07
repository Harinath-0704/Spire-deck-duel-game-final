export interface Character {
  id: string;
  name: string;
  title: string;
  role: string;
  stats: {
    constitution: number;
    attack: number;
    ability: number;
    difficulty: number;
  };
  price: number;
  isStarter: boolean;
  imageUrl: string;
}

export const CHARACTERS: Record<string, Character> = {
  arthur: {
    id: 'arthur',
    name: 'Arthur',
    title: 'The Chosen',
    role: 'Warrior',
    stats: {
      constitution: 80,
      attack: 75,
      ability: 30,
      difficulty: 20
    },
    price: 0,
    isStarter: true,
    imageUrl: '/assets/characters/arthur.jpg' // We will generate this
  },
  thane: {
    id: 'thane',
    name: 'Thane',
    title: 'The Protector',
    role: 'Tank',
    stats: {
      constitution: 95,
      attack: 40,
      ability: 50,
      difficulty: 40
    },
    price: 1500,
    isStarter: false,
    imageUrl: '/assets/characters/thane.jpg' // We will generate this
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    title: 'Pistol Assassin',
    role: 'Marksman',
    stats: {
      constitution: 40,
      attack: 90,
      ability: 60,
      difficulty: 70
    },
    price: 2000,
    isStarter: false,
    imageUrl: '/assets/characters/violet.jpg'
  },
  krixi: {
    id: 'krixi',
    name: 'Krixi',
    title: 'Forest Pixie',
    role: 'Mage',
    stats: {
      constitution: 30,
      attack: 20,
      ability: 95,
      difficulty: 50
    },
    price: 1800,
    isStarter: false,
    imageUrl: '/assets/characters/krixi.jpg'
  },
  zanis: {
    id: 'zanis',
    name: 'Zanis',
    title: 'The Dragoon',
    role: 'Warrior',
    stats: {
      constitution: 70,
      attack: 85,
      ability: 40,
      difficulty: 30
    },
    price: 2200,
    isStarter: false,
    imageUrl: '/assets/characters/zanis.jpg'
  },
  maloch: {
    id: 'maloch',
    name: 'Maloch',
    title: 'The Demon King',
    role: 'Tank',
    stats: {
      constitution: 100,
      attack: 60,
      ability: 30,
      difficulty: 60
    },
    price: 2500,
    isStarter: false,
    imageUrl: '/assets/characters/maloch.jpg'
  },
  tulen: {
    id: 'tulen',
    name: 'Tulen',
    title: 'Thunder God',
    role: 'Mage',
    stats: {
      constitution: 40,
      attack: 30,
      ability: 100,
      difficulty: 80
    },
    price: 2500,
    isStarter: false,
    imageUrl: '/assets/characters/tulen.jpg'
  }
};
