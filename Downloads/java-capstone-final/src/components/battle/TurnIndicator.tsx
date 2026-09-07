import { motion, AnimatePresence } from 'framer-motion';

interface TurnIndicatorProps {
  currentTurn: 'PLAYER' | 'OPPONENT';
  phase: string;
  timeRemaining: number;
}

export function TurnIndicator({ currentTurn, phase, timeRemaining }: TurnIndicatorProps) {
  if (phase !== 'PLAYER_TURN' && phase !== 'OPPONENT_TURN') return null;

  const isPlayer = currentTurn === 'PLAYER';
  const text = isPlayer ? 'YOUR TURN' : 'ENEMY TURN';
  const colorClass = isPlayer ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]';

  const timerWarning = isPlayer && timeRemaining <= 5;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTurn}
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.9], y: [0, 0, 0, -50] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
          className={`absolute text-4xl min-[400px]:text-5xl md:text-7xl font-serif uppercase tracking-[0.2em] font-bold text-center w-full px-2 break-words leading-tight ${colorClass}`}
        >
          {text}
        </motion.div>
      </AnimatePresence>

      {/* Persistent subtle indicator at the top after the main banner fades */}
      <motion.div 
        className="absolute top-20 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <span className={`text-xs font-bold tracking-widest uppercase ${isPlayer ? 'text-blue-300' : 'text-red-400'}`}>
          {isPlayer ? 'Player Turn' : 'Opponent Turn'}
        </span>
        {isPlayer && (
          <motion.div 
            animate={timerWarning ? { scale: [1, 1.1, 1], color: ['#fff', '#ef4444', '#fff'] } : {}}
            transition={{ repeat: timerWarning ? Infinity : 0, duration: 0.5 }}
            className={`font-mono text-lg mt-1 px-3 py-1 rounded-full bg-slate-900/80 border ${timerWarning ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-slate-700'}`}
          >
            00:{timeRemaining.toString().padStart(2, '0')}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
