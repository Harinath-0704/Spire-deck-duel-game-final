import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameEngine } from '../hooks/useGameEngine';
import { CardView } from '../components/cards/CardView';
import { BattleLog } from '../components/battle/BattleLog';
import { Character } from '../components/battle/Character';
import { BattleHUD } from '../components/battle/BattleHUD';
import { TurnIndicator } from '../components/battle/TurnIndicator';
import { CombatEffects } from '../components/battle/CombatEffects';
import { AudioService } from '../services/audio';
import { useEffect, useState, useRef } from 'react';
import { ensureSession } from '../services/supabase/client';
import { getRoomPlayers, subscribeToRoom } from '../services/supabase/roomService';
import { getMatchByRoomId, createMatch, finishMatch } from '../services/supabase/matchService';
import { addCoins } from '../services/supabase/profileService';

interface BattleArenaProps {
  roomId: string | null;
  matchId: string | null;
  isHost: boolean;
  player1Id: string | null;
  player2Id: string | null;
  localPlayerId: string | null;
  mode: 'ai' | 'online';
}

function BattleArena({ roomId, matchId, isHost, player1Id, player2Id, localPlayerId, mode }: BattleArenaProps) {
  const { state, dispatch, isAiThinking } = useGameEngine(mode, roomId, matchId, isHost, player1Id, player2Id, localPlayerId);
  const [animatingCard, setAnimatingCard] = useState<number | null>(null);
  const matchSavedRef = useRef(false);

  useEffect(() => {
    // Phase sync tracking if needed
  }, [mode, state.phase, state.player.hand.length]);

  // Trigger audio on turn change
  useEffect(() => {
    if (state.phase === 'PLAYER_TURN' || state.phase === 'OPPONENT_TURN') {
      AudioService.playTurnChange();
    }
  }, [state.phase]);

  // Handle Battle Music Lifecycle
  useEffect(() => {
    AudioService.playBattleMusic();
    
    return () => {
      AudioService.clearContext();
    };
  }, []);

  // Trigger audio on result
  useEffect(() => {
    if (state.phase === 'VICTORY') {
      AudioService.stopMusic();
      AudioService.playVictory();
    }
    if (state.phase === 'DEFEAT') {
      AudioService.stopMusic();
      AudioService.playDefeat();
    }
    if (state.phase === 'DRAW') {
      AudioService.stopMusic();
    }

    // Save Match Result
    if ((state.phase === 'VICTORY' || state.phase === 'DEFEAT' || state.phase === 'DRAW') && !matchSavedRef.current) {
      matchSavedRef.current = true;
      const handleMatchEnd = async () => {
        let winnerId: string | null = null;
        if (state.phase === 'VICTORY') winnerId = localPlayerId;
        else if (state.phase === 'DEFEAT') {
           winnerId = isHost ? player2Id : player1Id; 
        }
        
        if (matchId) {
          if (isHost || mode === 'ai') {
            await finishMatch(matchId, winnerId || null);
          }
        }

        // Award Coins (Only for AI matches; online matches are rewarded via secure backend RPC in finishMatch)
        if (localPlayerId && mode === 'ai') {
          const reward = state.phase === 'VICTORY' ? 100 : (state.phase === 'DRAW' ? 50 : 25);
          await addCoins(localPlayerId, reward);
        }
      };
      handleMatchEnd();
    }
  }, [state.phase, matchId, localPlayerId, isHost, player1Id, player2Id, mode]);

  const handlePlayCard = (index: number) => {
    const card = state.player.hand[index];

    setAnimatingCard(index);
    
    if (card.type === 'ATTACK') AudioService.playAttack();
    else if (card.type === 'DEFENSE') AudioService.playDefend();
    else AudioService.playSpecial();

    // Delay the actual game state update slightly so the card animation has time to start
    setTimeout(() => {
      dispatch({ type: 'PLAY_CARD', playerId: 'player', cardIndex: index });
      setAnimatingCard(null);
    }, 300);
  };

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN', playerId: 'player' });
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col bg-transparent overflow-hidden touch-none select-none font-sans">
      
      {/* LAYER 1 & 2: Background & Atmospherics */}
      {/* Background is now globally provided by App.tsx */}

      {/* Battle Log Overlay (Z-index high but pointer events handled) */}
      <div className="absolute top-16 right-4 z-50">
        <BattleLog logs={state.battleLog} />
      </div>

      {/* Top Header / Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Link to="/" className="p-2 glass-panel rounded-full text-slate-300 hover:text-white hover:scale-105 active:scale-90 transition-all block shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* LAYER 3: Opponent Layer */}
      <div className="relative z-10 w-full pt-8 flex flex-col items-center mt-12">
        <Character type="opponent" isHit={false} isAttacking={false} imageUrl={state.opponent.characterImageUrl} characterId={state.opponent.characterId} />
      </div>

      {/* LAYER 4: Battlefield Combat FX */}
      <CombatEffects state={state} />

      {/* LAYER 5: Player Layer */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-end pb-48">
        <Character type="player" isHit={false} isAttacking={false} imageUrl={state.player.characterImageUrl} characterId={state.player.characterId} />
      </div>

      {/* NEW LAYER: Premium Top HUDs */}
      <div className="absolute top-[68px] left-2 md:top-4 md:left-16 z-50">
         <BattleHUD player={state.player} />
      </div>
      <div className="absolute top-[68px] right-2 md:top-4 md:right-4 z-50">
         <BattleHUD player={state.opponent} isOpponent isThinking={isAiThinking} />
      </div>

      {/* LAYER 6: Battle HUD / Central Screens */}
      <TurnIndicator currentTurn={state.currentTurn} phase={state.phase} timeRemaining={state.turnTimeRemaining} />

      {/* Center Screen Overlays (Intro, Victory, Defeat) */}
      <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {state.phase === 'INTRO' && (
            <motion.div 
              key="intro"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-serif text-white uppercase tracking-widest text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
            >
              DUEL STARTING
            </motion.div>
          )}

          {state.phase === 'VICTORY' && (
            <motion.div 
              key="victory"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 p-8 glass-panel border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)] pointer-events-auto backdrop-blur-md bg-transparent/80"
            >
              <h2 className="text-5xl font-serif text-yellow-400 uppercase tracking-widest font-bold drop-shadow-[0_0_15px_rgba(250,204,21,1)]">VICTORY</h2>
              <p className="text-slate-300">Opponent Defeated</p>
              <p className="text-yellow-400 font-bold mt-2">+100 🪙</p>
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary mt-4 py-2 px-8 bg-yellow-600 hover:bg-yellow-500 text-white border border-yellow-400 shadow-[0_0_15px_rgba(202,138,4,0.5)]"
              >
                Play Again
              </button>
              <Link to="/" className="btn-primary mt-2 py-2 px-8 bg-slate-800 border border-slate-700 hover:bg-slate-700">Return to Menu</Link>
            </motion.div>
          )}

          {(state.phase === 'DEFEAT' || state.phase === 'DRAW') && (
            <motion.div 
              key="defeat"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 p-8 glass-panel border-red-900/50 pointer-events-auto backdrop-blur-md bg-transparent/80"
            >
              <h2 className="text-5xl font-serif text-red-500 uppercase tracking-widest font-bold drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
                {state.phase === 'DRAW' ? 'DRAW' : 'DEFEAT'}
              </h2>
              <p className="text-slate-400">
                {state.phase === 'DRAW' ? 'Battle ended in a tie' : 'Battle Lost'}
              </p>
              <p className="text-yellow-500 font-bold mt-2">
                +{state.phase === 'DRAW' ? 50 : 25} 🪙
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary mt-4 py-2 px-8 bg-red-900 hover:bg-red-800 text-white border border-red-700 shadow-[0_0_15px_rgba(153,27,27,0.5)]"
              >
                Play Again
              </button>
              <Link to="/" className="btn-primary mt-2 py-2 px-8 bg-slate-800 border border-slate-700 hover:bg-slate-700">Return to Menu</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LAYER 7: Card Hand & Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none pb-12 md:pb-8 px-2 flex flex-col justify-end">
        
        {/* End Turn Button */}
        <div className="flex justify-end px-4 mb-4">
          <AnimatePresence>
            {state.phase === 'PLAYER_TURN' && (
              <motion.button 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.90 }}
                onClick={handleEndTurn}
                className="pointer-events-auto bg-slate-800/80 backdrop-blur-sm border border-slate-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-slate-700 hover:border-blue-400 transition-colors uppercase tracking-wider"
              >
                End Turn
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Cards */}
        <div className="relative w-full max-w-full px-1 h-[120px] min-[400px]:h-[140px] md:h-[180px] flex justify-center items-end gap-0 min-[400px]:gap-0.5 md:gap-1 perspective-1000 pointer-events-auto overflow-visible">
          <AnimatePresence>
            {state.player.hand.map((card, index) => {
              const canPlay = state.phase === 'PLAYER_TURN' && state.player.energy >= card.energyCost;
              const isAnimating = animatingCard === index;
              
              return (
                <motion.div
                  key={`${card.id}-${index}`}
                  animate={isAnimating ? { y: -300, scale: 0.5, opacity: 0 } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <CardView
                    card={card}
                    index={index}
                    totalCards={state.player.hand.length}
                    disabled={!canPlay || isAnimating}
                    onClick={() => handlePlayCard(index)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

export default function Battle() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode') === 'online' ? 'online' : 'ai';
  const roomId = params.get('room');
  const urlMatchId = params.get('match');
  
  const [isOnlineReady, setIsOnlineReady] = useState(false);
  const [isHost, setIsHost] = useState(true);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [player1Id, setPlayer1Id] = useState<string | null>(null);
  const [player2Id, setPlayer2Id] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (mode !== 'online') {
      const initAiMatch = async () => {
        const currentUserId = await ensureSession();
        setLocalPlayerId(currentUserId);
        if (currentUserId) {
          const match = await createMatch(null, currentUserId, null);
          if (match) setMatchId(match.id);
        }
        setIsOnlineReady(true);
      };
      initAiMatch();
      return;
    }
    
    if (!roomId) return;

    let isMounted = true;
    let channel: { unsubscribe: () => void } | null = null;

    const init = async () => {
      const currentUserId = await ensureSession();
      if (!isMounted) return;
      setLocalPlayerId(currentUserId);

      const fetchPlayers = async () => {
        if (!isMounted) return;
        const players = await getRoomPlayers(roomId);
        if (!isMounted) return;
        if (players.length === 2) {
          const hostPlayer = players.find(p => p.player_index === 0);
          const isHostCheck = hostPlayer?.player_id === currentUserId;
          setIsHost(isHostCheck);
          
          let match = null;
          if (urlMatchId) {
            match = await getMatchByRoomId(roomId);
          } else {
            match = await getMatchByRoomId(roomId);
            if (!match && isHostCheck) {
              match = await createMatch(roomId, hostPlayer!.player_id, players.find(p => p.player_index === 1)!.player_id);
            }
          }
          
          if (match) {
            setMatchId(match.id);
            setPlayer1Id(match.player_one_id);
            setPlayer2Id(match.player_two_id);
            setIsOnlineReady(true);
          } else if (!isHostCheck) {
            // Joiner waits for host to create match if not provided in URL
            const pollInterval = setInterval(async () => {
              const m = await getMatchByRoomId(roomId);
              if (m) {
                clearInterval(pollInterval);
                setMatchId(m.id);
                setPlayer1Id(m.player_one_id);
                setPlayer2Id(m.player_two_id);
                setIsOnlineReady(true);
              }
            }, 1000);
            return () => clearInterval(pollInterval);
          }
        } else {
          setIsOnlineReady(false);
        }
      };
      
      await fetchPlayers();
      if (!isMounted) return;

      channel = subscribeToRoom(roomId, async () => {
        await fetchPlayers();
      });
    };

    init();

    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, [mode, roomId]);

  if (mode === 'online' && !isOnlineReady) {
    return (
      <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-500/30 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-serif text-blue-300 uppercase tracking-widest text-center mt-8 mb-8 animate-pulse">
          Connecting to Spire...
        </h2>
        <button 
          onClick={() => navigate('/create-room')} 
          className="btn-primary py-3 px-8 text-sm"
        >
          CANCEL
        </button>
      </div>
    );
  }

  return <BattleArena roomId={roomId} matchId={matchId} isHost={isHost} player1Id={player1Id} player2Id={player2Id} localPlayerId={localPlayerId} mode={mode} />;
}
