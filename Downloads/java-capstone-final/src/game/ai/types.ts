import type { GameAction } from '../engine/actions';

export type AiDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface EvaluatedAction {
  action: GameAction;
  score: number;
}
