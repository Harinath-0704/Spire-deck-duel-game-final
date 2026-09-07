import type { GameState } from '../types/game';
import type { GameAction } from '../engine/actions';
import { evaluateAvailableActions } from './evaluateState';

export function chooseBestAction(state: GameState): GameAction | null {
  const actions = evaluateAvailableActions(state);
  
  if (actions.length === 0) return null;

  const difficulty = state.aiDifficulty || 'NORMAL';
  
  // Sort descending by score
  actions.sort((a, b) => b.score - a.score);

  if (difficulty === 'HARD') {
    // Hard: Mostly pick the best action (top 1) or very rarely top 2 if scores are close
    if (actions.length > 1 && (actions[0].score - actions[1].score < 3)) {
       return Math.random() < 0.8 ? actions[0].action : actions[1].action;
    }
    return actions[0].action;
  }
  
  if (difficulty === 'NORMAL') {
    // Normal: Sometimes pick sub-optimal if it's not a lethal situation
    if (actions.length > 1 && actions[0].score < 500) {
      // Not a lethal/critical situation, maybe pick 2nd best 30% of the time
      if (Math.random() < 0.3) {
        return actions[1].action;
      }
    }
    return actions[0].action;
  }
  
  // EASY
  // Easy: Quite random among top 3, might even pick something bad
  if (actions.length > 1 && actions[0].score < 500) {
     const pool = actions.slice(0, 3);
     const randomIdx = Math.floor(Math.random() * pool.length);
     return pool[randomIdx].action;
  }
  
  return actions[0].action;
}
