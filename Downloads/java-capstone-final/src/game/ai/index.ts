import type { GameState } from '../types/game';
import type { GameAction } from '../engine/actions';
import { chooseBestAction } from './chooseAction';

export function getNextAiAction(state: GameState): GameAction | null {
  if (state.phase !== 'OPPONENT_TURN') return null;
  return chooseBestAction(state);
}
