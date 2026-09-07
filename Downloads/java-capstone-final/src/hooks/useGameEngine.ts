import { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { createInitialState, gameReducer } from '../game/engine/reducer';
import { getNextAiAction } from '../game/ai';
import { updateMatchState, subscribeToMatch, getMatchByRoomId } from '../services/supabase/matchService';
import type { GameAction } from '../game/engine/actions';
import type { GameState, AuthoritativeMatchState } from '../game/types/game';

function toAuthState(gameState: GameState, _matchId: string, player1Id: string, player2Id: string, isHost: boolean): AuthoritativeMatchState {
  return {
    player1Id,
    player2Id,
    player1: isHost ? gameState.player : gameState.opponent,
    player2: isHost ? gameState.opponent : gameState.player,
    currentTurnPlayerId: gameState.currentTurn === 'PLAYER' 
      ? (isHost ? player1Id : player2Id) 
      : (isHost ? player2Id : player1Id),
    turnNumber: gameState.turnNumber,
    turnStartedAt: Date.now() - (30 - gameState.turnTimeRemaining) * 1000,
    status: gameState.result ? 'finished' : 'playing',
    winnerId: gameState.result === 'VICTORY' 
      ? (isHost ? player1Id : player2Id) 
      : (gameState.result === 'DEFEAT' ? (isHost ? player2Id : player1Id) : null),
    lastActionSequence: gameState.sequence,
    phase: gameState.phase,
    battleLog: gameState.battleLog
  };
}

function fromAuthState(authState: AuthoritativeMatchState, localPlayerId: string): GameState {
  const isPlayer1 = localPlayerId === authState.player1Id;

  // Turn tracking
  const amIActive = String(authState.currentTurnPlayerId) === String(localPlayerId);
  const currentTurn = amIActive ? 'PLAYER' : 'OPPONENT';

  // Calculate remaining time
  const elapsed = Math.floor((Date.now() - authState.turnStartedAt) / 1000);
  const turnTimeRemaining = Math.max(0, 30 - elapsed);

  // Result and phase mapping
  let result: GameState['result'] = null;
  let phase = authState.phase;

  if (phase === 'PLAYER_TURN' || phase === 'OPPONENT_TURN') {
    phase = amIActive ? 'PLAYER_TURN' : 'OPPONENT_TURN';
  }

  if (authState.status === 'finished') {
    if (authState.winnerId === localPlayerId) {
      result = 'VICTORY';
      phase = 'VICTORY';
    }
    else if (authState.winnerId === null) {
      result = 'DRAW';
      phase = 'DRAW';
    }
    else {
      result = 'DEFEAT';
      phase = 'DEFEAT';
    }
  }

  return {
    matchId: '',
    phase,
    currentTurn,
    turnNumber: authState.turnNumber,
    turnTimeRemaining,
    player: isPlayer1 ? authState.player1 : authState.player2,
    opponent: isPlayer1 ? authState.player2 : authState.player1,
    result,
    battleLog: authState.battleLog || [], 
    sequence: authState.lastActionSequence || 0,
  };
}

export function useGameEngine(
  mode: 'ai' | 'online',
  roomId: string | null = null,
  matchId: string | null = null,
  isHost: boolean = true,
  player1Id: string | null = null,
  player2Id: string | null = null,
  localPlayerId: string | null = null
) {
  const [state, dispatchRaw] = useReducer(gameReducer, undefined, () => {
    const params = new URLSearchParams(window.location.search);
    const diff = params.get('difficulty');
    const difficulty = (diff === 'EASY' || diff === 'HARD') ? diff : 'NORMAL';
    return createInitialState(difficulty as 'EASY' | 'NORMAL' | 'HARD', mode);
  });

  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load equipped characters
  useEffect(() => {
    async function loadCharacters() {
      if (localPlayerId) {
        import('../services/supabase/characterService').then(async ({ getEquippedCharacter }) => {
          import('../data/characters').then(async ({ CHARACTERS }) => {
            import('../services/supabase/profileService').then(async ({ getProfile }) => {
              const charId = await getEquippedCharacter(localPlayerId);
              const charData = CHARACTERS[charId] || CHARACTERS['arthur'];
              const p = await getProfile(localPlayerId);
              const pName = p?.username || 'Player';
              
              dispatchRaw({ type: 'SET_CHARACTER', playerId: 'player', characterId: charId || 'arthur', imageUrl: charData.imageUrl || '', playerName: pName });
              
              if (mode === 'online' && (isHost ? player2Id : player1Id)) {
                const oppId = isHost ? player2Id! : player1Id!;
                const oppCharId = await getEquippedCharacter(oppId);
                const oppCharData = CHARACTERS[oppCharId] || CHARACTERS['arthur'];
                const opp = await getProfile(oppId);
                const oppName = opp?.username || 'Opponent';
                
                dispatchRaw({ type: 'SET_CHARACTER', playerId: 'opponent', characterId: oppCharId || 'arthur', imageUrl: oppCharData.imageUrl || '', playerName: oppName });
              } else if (mode === 'ai') {
                const aiCharId = 'thane';
                const aiCharData = CHARACTERS[aiCharId];
                dispatchRaw({ type: 'SET_CHARACTER', playerId: 'opponent', characterId: aiCharId, imageUrl: aiCharData.imageUrl || '', playerName: 'AI Opponent' });
              }
            });
          });
        });
      }
    }
    loadCharacters();
  }, [localPlayerId, player1Id, player2Id, mode, isHost]);

  // Custom dispatch that intercepts and computes the new state
  const dispatch = useCallback((action: GameAction) => {
    if (state.result && action.type !== 'SYNC_STATE' && action.type !== 'START_BATTLE') {
      return; // Game over, ignore input
    }
    
    if (mode === 'online' && isSubmittingAction && action.type !== 'SYNC_STATE' && action.type !== 'TICK') {
      console.log('[ONLINE ACTION REJECTED]', { reason: 'Already submitting an action' });
      return;
    }

    if (mode === 'online' && action.type === 'PLAY_CARD') {
      // Intentionally left blank for cleanup
    }

    const actionWithId = {
      ...action,
      actionId: action.actionId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Since we don't have access to latest `state` in this closure without breaking dependencies,
    // we use a neat trick: React reducer can't be awaited. 
    // BUT we can use `dispatchRaw` which updates the UI.
    // However, to sync to DB, we need the NEXT state immediately.
    // So we dispatch locally, AND if online, we need to push to DB.
    
    // Instead of using stale state, we rely on a useEffect that pushes state when it changes?
    // No, we only want to push when WE made the change.
    
    const nextState = gameReducer(state, actionWithId);
    dispatchRaw(actionWithId);

    const pushStateToDb = async (newState: GameState) => {
      if (mode !== 'online' || !matchId || !player1Id || !player2Id || !localPlayerId) return;
      
      setIsSubmittingAction(true);
      try {
        // Double check we're not overwriting a newer state by fetching current first
        const currentMatch = await getMatchByRoomId(roomId || '');
        if (currentMatch && (currentMatch as any).state) {
          const currentSequence = ((currentMatch as any).state as any).lastActionSequence || 0;
          if (currentSequence >= newState.sequence) {
             return;
          }
        }

        const authState = toAuthState(newState, matchId, player1Id, player2Id, isHost);
        await updateMatchState(matchId, authState);
      } finally {
        setIsSubmittingAction(false);
      }
    };

    if (actionWithId.type !== 'TICK' && actionWithId.type !== 'SYNC_STATE') {
      pushStateToDb(nextState);
    }
  }, [mode, matchId, player1Id, player2Id, localPlayerId, roomId, isHost, state, isSubmittingAction]);

  // Online Realtime Subscription + Initial Fetch
  useEffect(() => {
    if (mode === 'online' && matchId && localPlayerId && roomId) {
      let isMounted = true;
      let sub: { unsubscribe: () => void } | null = null;

      const fetchAndApplyState = async () => {
        const match = await getMatchByRoomId(roomId);
        if (isMounted && match && (match as any).state) {
          const authState = (match as any).state as unknown as AuthoritativeMatchState;
          if (authState.lastActionSequence > stateRef.current.sequence) {
            const syncedState = fromAuthState(authState, localPlayerId);
            dispatchRaw({ type: 'SYNC_STATE', state: syncedState });
          }
        }
      };

      const initRealtime = async () => {
        await fetchAndApplyState();
        if (!isMounted) return;

        sub = subscribeToMatch(matchId, (payload: any) => {
          if (!isMounted) return;
          if (payload && payload.state) {
            const authState = payload.state as AuthoritativeMatchState;
            if (authState.lastActionSequence > stateRef.current.sequence) {
              const syncedState = fromAuthState(authState, localPlayerId);
              dispatchRaw({ type: 'SYNC_STATE', state: syncedState });
            }
          }
        });
      };

      initRealtime();

      const pollInterval = setInterval(() => {
        if (isMounted) fetchAndApplyState();
      }, 1500);

      return () => {
        isMounted = false;
        if (sub) sub.unsubscribe();
        clearInterval(pollInterval);
      };
    }
  }, [mode, matchId, localPlayerId, roomId]);

  // Intro transition
  useEffect(() => {
    if (state.phase === 'INTRO') {
      if (mode === 'online' && !isHost) {
        // Joiner purely waits for authoritative state change to START_BATTLE
        return;
      }
      const timer = setTimeout(() => {
        dispatch({ type: 'START_BATTLE', isHost });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.phase, dispatch, isHost, mode]);

  // Turn Timer
  useEffect(() => {
    // Both clients tick independently to keep timers matching visually
    if ((state.phase === 'PLAYER_TURN' || state.phase === 'OPPONENT_TURN') && state.turnTimeRemaining > 0) {
      const timer = setTimeout(() => {
        dispatchRaw({ type: 'TICK' } as GameAction); // bypass broadcast wrapper
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // Only active player emits timeout
    if (state.phase === 'PLAYER_TURN' && state.turnTimeRemaining <= 0) {
      dispatch({ type: 'TIMEOUT', playerId: 'player' });
    }
  }, [state.phase, state.turnTimeRemaining, dispatch]);

  // Opponent AI
  useEffect(() => {
    if (mode === 'online') {
      setIsAiThinking(false);
      return;
    }

    if (state.phase === 'OPPONENT_TURN') {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const action = getNextAiAction(state);
        if (action) {
          dispatch(action);
        }
        setIsAiThinking(false);
      }, 1000); // 1.0 second delay between opponent actions for better UX
      
      return () => {
        clearTimeout(timer);
        setIsAiThinking(false);
      };
    }
  }, [state.phase, state.opponent.energy, state.opponent.hand.length, state.currentTurn, mode]); // React to energy/hand changes so AI plays multiple cards

  return { state, dispatch, isAiThinking, mode };
}
