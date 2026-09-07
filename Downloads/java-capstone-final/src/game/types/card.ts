export type CardType = 'ATTACK' | 'DEFENSE' | 'SPECIAL';
export type CardRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface CardSkin {
  id: string;
  name: string;
  artworkUrl: string;
  animationUrl?: string;
  rarity: CardRarity;
}

export interface Card {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  energyCost: number;
  damage?: number;
  block?: number;
  healing?: number;
  specialEffect?: string;
  
  // Presentation layer
  skins: CardSkin[];
  activeSkinId: string;
  soundEffectUrl?: string;
  isStarter?: boolean;
  price?: number;
}
