import type { GameState } from '../types/game';
import type { EvaluatedAction } from './types';
import type { Card } from '../types/card';

export function evaluateAvailableActions(state: GameState): EvaluatedAction[] {
  const opponent = state.opponent;
  const player = state.player;
  
  const actions: EvaluatedAction[] = [];
  
  // Base case: End turn is always an option
  actions.push({
    action: { type: 'END_TURN', playerId: 'opponent' },
    score: 0 // Base score, ending turn is neutral
  });

  // Calculate some general context
  const playerLethalThreshold = player.hp + player.block;
  const needsDefense = opponent.hp < 15;
  const criticalDefense = opponent.hp <= 5;
  
  opponent.hand.forEach((card, index) => {
    if (opponent.energy < card.energyCost) return; // Cannot afford

    let score = evaluateCard(card, state, playerLethalThreshold, needsDefense, criticalDefense);
    
    actions.push({
      action: { type: 'PLAY_CARD', playerId: 'opponent', cardIndex: index },
      score
    });
  });

  return actions;
}

function evaluateCard(
  card: Card, 
  state: GameState, 
  playerLethalThreshold: number,
  needsDefense: boolean,
  criticalDefense: boolean
): number {
  let score = 5; // Base valid card score
  
  const difficulty = state.aiDifficulty || 'NORMAL';
  
  if (card.type === 'ATTACK' && card.damage) {
    score += card.damage; // Value damage
    
    // Lethal bonus
    if (card.damage >= playerLethalThreshold) {
      score += 1000; // Almost definitely do this
    }
    
    if (difficulty === 'EASY') {
      // Easy AI tends to overvalue attacks even when low HP
      score += 5;
    } else if (difficulty === 'HARD') {
      // Hard AI is more cautious if they need defense
      if (criticalDefense) score -= 10;
    }
  }
  
  if (card.type === 'DEFENSE' && card.block) {
    score += card.block * 0.8;
    
    if (criticalDefense) {
      score += 50; // Heavily prioritize defense if dying
    } else if (needsDefense) {
      score += 15;
    }
    
    if (difficulty === 'EASY') {
      // Easy AI undervalues defense
      score -= 5;
    }
  }
  
  if (card.type === 'SPECIAL') {
    score += 8; // Arbitrary good value
    
    if (card.healing) {
      if (criticalDefense) score += 60;
      else if (needsDefense) score += 20;
      else score -= 5; // Don't heal if full HP
    }
  }
  
  // Energy efficiency (value cheaper cards slightly higher to play more cards, unless HARD which evaluates better)
  if (difficulty === 'HARD') {
    score += (3 - card.energyCost) * 2;
  }
  
  return score;
}
