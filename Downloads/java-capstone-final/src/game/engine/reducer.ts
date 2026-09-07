import type { GameState } from '../types/game';
import type { GameAction } from './actions';
import { resolveCardEffect, drawCards, addLog } from './effects';
import { INITIAL_DECK } from '../../data/cards';

const TURN_DURATION = 20;

export function createInitialState(
  difficulty: 'EASY' | 'NORMAL' | 'HARD' = 'NORMAL',
  mode: 'ai' | 'online' = 'ai'
): GameState {
  const playerDeck = [...INITIAL_DECK].sort(() => Math.random() - 0.5);
  const opponentDeck = [...INITIAL_DECK].sort(() => Math.random() - 0.5);

  return {
    matchId: 'local-test-match',
    phase: 'INTRO',
    aiDifficulty: difficulty,
    currentTurn: 'PLAYER',
    turnNumber: 1,
    turnTimeRemaining: TURN_DURATION,
    player: {
      id: 'player-1',
      name: 'Player',
      hp: 30,
      maxHp: 30,
      energy: 3,
      maxEnergy: 3,
      block: 0,
      deck: playerDeck,
      hand: [],
      discardPile: [],
      statusEffects: []
    },
    opponent: {
      id: 'bot-1',
      name: mode === 'online' ? 'OPPONENT' : 'AI Opponent',
      hp: 30,
      maxHp: 30,
      energy: 3,
      maxEnergy: 3,
      block: 0,
      deck: opponentDeck,
      hand: [],
      discardPile: [],
      statusEffects: []
    },
    result: null,
    battleLog: [],
    sequence: 0
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Protect against duplicate remote actions
  if (action.actionId && state.lastActionId === action.actionId) {
    return state;
  }

  // We mutate a draft (or a cloned state) for simplicity, returning a new reference
  // In a real Redux setup, use Immer. For now, we deep clone.
  const nextState: GameState = JSON.parse(JSON.stringify(state));
  if (action.actionId) {
    nextState.lastActionId = action.actionId;
  }

  switch (action.type) {
    case 'SYNC_STATE': {
      const incomingState = action.state as GameState;
      if (incomingState.sequence < state.sequence) {
        return state; // Ignore older states
      }
      
      const isTransitioningFromIntro = state.phase === 'INTRO' && incomingState.phase !== 'INTRO';

      const mergedPlayer = {
        ...incomingState.player,
        hand: state.player.hand.length > 0 ? [...state.player.hand] : [...incomingState.player.hand],
        deck: state.player.hand.length > 0 ? [...state.player.deck] : [...incomingState.player.deck],
        discardPile: state.player.hand.length > 0 ? [...state.player.discardPile] : [...incomingState.player.discardPile]
      };
      
      // If the player receives the active state but hasn't drawn cards yet (and incoming hand was empty)
      if (isTransitioningFromIntro && mergedPlayer.hand.length === 0) {
        drawCards(mergedPlayer, 4);
      }

      return {
        ...incomingState,
        player: mergedPlayer
      };
    }

    case 'START_BATTLE':
      if (nextState.phase === 'INTRO') {
        drawCards(nextState.player, 4);
        drawCards(nextState.opponent, 4);
        
        // If not specified, default to PLAYER (like in vs AI)
        const isHost = action.isHost !== false; 
        
        if (isHost) {
          nextState.phase = 'PLAYER_TURN';
          nextState.currentTurn = 'PLAYER';
        } else {
          nextState.phase = 'OPPONENT_TURN';
          nextState.currentTurn = 'OPPONENT';
        }
        
        nextState.turnTimeRemaining = TURN_DURATION;
        addLog(nextState, 'Battle started.');
      }
      break;

    case 'PLAY_CARD': {
      if (nextState.result) break; // Game over
      if (nextState.phase !== 'PLAYER_TURN' && nextState.phase !== 'OPPONENT_TURN') break;
      if (nextState.currentTurn.toLowerCase() !== action.playerId) break;

      const activePlayer = action.playerId === 'player' ? nextState.player : nextState.opponent;
      const card = activePlayer.hand[action.cardIndex];

      if (!card) break;
      if (activePlayer.energy < card.energyCost) break;

      // Consume energy and remove card
      activePlayer.energy -= card.energyCost;
      activePlayer.hand.splice(action.cardIndex, 1);

      // Resolve effects
      resolveCardEffect(nextState, card, action.playerId);
      
      activePlayer.discardPile.push(card);
      
      // Replenish hand so it doesn't get stuck empty
      drawCards(activePlayer, 1);
      
      checkWinCondition(nextState);
      break;
    }

    case 'END_TURN':
    case 'TIMEOUT': {
      if (nextState.result) break;
      if (nextState.phase !== 'PLAYER_TURN' && nextState.phase !== 'OPPONENT_TURN') break;
      
      // If someone tries to end a turn that isn't theirs, ignore
      if ((action.type === 'END_TURN' || action.type === 'TIMEOUT') && nextState.currentTurn.toLowerCase() !== action.playerId) break;

      if (nextState.currentTurn === 'PLAYER') {
        // Switch to Opponent
        nextState.currentTurn = 'OPPONENT';
        nextState.phase = 'OPPONENT_TURN';
        nextState.turnTimeRemaining = TURN_DURATION;
        nextState.opponent.energy = nextState.opponent.maxEnergy; // Refresh energy
        nextState.opponent.block = 0; // Reset block at start of turn
        drawCards(nextState.opponent, 1);
        addLog(nextState, 'Opponent turn started.');
      } else {
        // Switch to Player
        nextState.currentTurn = 'PLAYER';
        nextState.phase = 'PLAYER_TURN';
        nextState.turnNumber++;
        nextState.turnTimeRemaining = TURN_DURATION;
        nextState.player.energy = nextState.player.maxEnergy; // Refresh energy
        nextState.player.block = 0; // Reset block at start of turn
        drawCards(nextState.player, 1);
        addLog(nextState, 'Player turn started.');
      }
      break;
    }

    case 'TICK':
      if (nextState.phase === 'PLAYER_TURN' && nextState.turnTimeRemaining > 0) {
        nextState.turnTimeRemaining--;
      }
      break;
      
    case 'SET_CHARACTER':
      if (action.playerId === 'player') {
        nextState.player.characterId = action.characterId;
        nextState.player.characterImageUrl = action.imageUrl;
        if (action.playerName) nextState.player.name = action.playerName;
      } else {
        nextState.opponent.characterId = action.characterId;
        nextState.opponent.characterImageUrl = action.imageUrl;
        if (action.playerName) nextState.opponent.name = action.playerName;
      }
      break;

    case 'SURRENDER':
      if (action.playerId === 'player') {
        nextState.player.hp = 0;
      } else {
        nextState.opponent.hp = 0;
      }
      checkWinCondition(nextState);
      break;
  }

  // Increment sequence for actions that mutate state (excluding TICK)
  if (action.type !== 'TICK') {
    nextState.sequence++;
  }

  return nextState;
}

function checkWinCondition(state: GameState) {
  if (state.opponent.hp <= 0 && state.player.hp <= 0) {
    state.result = 'DRAW';
    state.phase = 'DRAW';
    addLog(state, 'The battle ended in a draw!');
  } else if (state.opponent.hp <= 0) {
    state.result = 'VICTORY';
    state.phase = 'VICTORY';
    addLog(state, 'Player won the battle!');
  } else if (state.player.hp <= 0) {
    state.result = 'DEFEAT';
    state.phase = 'DEFEAT';
    addLog(state, 'Player was defeated.');
  }
}
