import type { GameState, PlayerState } from '../types/game';
import type { Card } from '../types/card';

let logIdCounter = 0;

export function addLog(state: GameState, message: string) {
  state.battleLog.unshift({
    id: `log-${logIdCounter++}`,
    message,
    timestamp: Date.now()
  });
  if (state.battleLog.length > 50) {
    state.battleLog.pop();
  }
}

export function drawCards(player: PlayerState, count: number) {
  for (let i = 0; i < count; i++) {
    if (player.deck.length === 0) {
      if (player.discardPile.length > 0) {
        player.deck = [...player.discardPile].sort(() => Math.random() - 0.5);
        player.discardPile = [];
      } else {
        break; // No cards left at all
      }
    }
    const card = player.deck.shift()!;
    player.hand.push(card);
  }
}

export function applyDamage(target: PlayerState, damage: number, state: GameState, targetName: string) {
  if (damage <= 0) return;
  
  let remainingDamage = damage;
  
  if (target.block > 0) {
    if (target.block >= remainingDamage) {
      target.block -= remainingDamage;
      addLog(state, `${targetName} blocked ${remainingDamage} damage.`);
      remainingDamage = 0;
    } else {
      const blocked = target.block;
      remainingDamage -= target.block;
      target.block = 0;
      addLog(state, `${targetName} blocked ${blocked} damage.`);
    }
  }
  
  if (remainingDamage > 0) {
    target.hp = Math.max(0, target.hp - remainingDamage);
    addLog(state, `${targetName} took ${remainingDamage} damage.`);
  }
}

export function resolveCardEffect(
  state: GameState,
  card: Card,
  sourceId: 'player' | 'opponent'
) {
  const source = sourceId === 'player' ? state.player : state.opponent;
  const target = sourceId === 'player' ? state.opponent : state.player;
  const sourceName = sourceId === 'player' ? 'Player' : 'Opponent';
  const targetName = sourceId === 'player' ? 'Opponent' : 'Player';

  addLog(state, `${sourceName} used ${card.name}.`);

  // Process damage
  if (card.damage) {
    applyDamage(target, card.damage, state, targetName);
  }

  // Process block
  if (card.block) {
    source.block += card.block;
    addLog(state, `${sourceName} gained ${card.block} block.`);
  }

  // Process healing
  if (card.healing) {
    const healAmount = Math.min(source.maxHp - source.hp, card.healing);
    source.hp += healAmount;
    if (healAmount > 0) {
      addLog(state, `${sourceName} healed ${healAmount} HP.`);
    }
  }

  // Process special effects
  if (card.specialEffect === 'DRAW_1') {
    drawCards(source, 1);
    addLog(state, `${sourceName} drew a card.`);
  }
}
