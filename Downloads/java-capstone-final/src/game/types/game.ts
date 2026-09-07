import type { Card } from './card';

export type BattlePhase = 'INTRO' | 'PLAYER_TURN' | 'OPPONENT_TURN' | 'RESOLVING' | 'VICTORY' | 'DEFEAT' | 'DRAW';
export type BattleResult = 'VICTORY' | 'DEFEAT' | 'DRAW' | null;

export interface PlayerState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  block: number;
  characterId?: string;
  characterImageUrl?: string;
  
  // Zones
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
  
  // Active effects
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  id: string;
  type: 'POISON' | 'SHIELD' | 'STRENGTH' | 'WEAKNESS';
  duration: number; // turns remaining
  value: number;
}

export interface BattleLogEntry {
  id: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  matchId: string;
  phase: BattlePhase;
  aiDifficulty?: 'EASY' | 'NORMAL' | 'HARD';
  currentTurn: 'PLAYER' | 'OPPONENT';
  turnNumber: number;
  turnTimeRemaining: number; // seconds remaining
  
  player: PlayerState;
  opponent: PlayerState;
  
  result: BattleResult;
  battleLog: BattleLogEntry[];
  lastActionId?: string;
  sequence: number;
}

export interface AuthoritativeMatchState {
  player1Id: string;
  player2Id: string;
  player1: PlayerState;
  player2: PlayerState;
  currentTurnPlayerId: string;
  turnNumber: number;
  turnStartedAt: number;
  phase: BattlePhase;
  status: 'playing' | 'finished';
  winnerId: string | null;
  lastActionSequence: number;
  battleLog?: BattleLogEntry[];
}
