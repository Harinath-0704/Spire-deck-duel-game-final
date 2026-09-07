import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';
import type { PlayerState } from '../../game/types/game';

interface HUDProps {
  player: PlayerState;
  isOpponent?: boolean;
  isThinking?: boolean;
}

export function BattleHUD({ player, isOpponent, isThinking }: HUDProps) {
  const hpPercentage = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const hpColor = hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`glass-panel p-2 md:p-3 flex flex-col gap-1 md:gap-2 min-w-[120px] md:min-w-[160px] max-w-[150px] md:max-w-[200px] border-${isOpponent ? 'red' : 'blue'}-900/30`}>
      <div className={`flex items-center justify-between w-full ${isOpponent ? 'flex-row-reverse' : ''}`}>
        <div className="flex flex-col truncate max-w-[70%]">
          <span className={`text-xs md:text-base font-black uppercase tracking-widest truncate text-${isOpponent ? 'red' : 'blue'}-400 drop-shadow-md`}>
            {player.name}
          </span>
          {isThinking && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[9px] text-slate-400 font-bold uppercase"
            >
              Thinking...
            </motion.span>
          )}
        </div>
        <div className="flex gap-1">
          <AnimatePresence>
            {player.block > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-1 text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900/50"
              >
                <Shield className="w-3 h-3" />
                <span className="text-[10px] font-bold">{player.block}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* HP Bar */}
      <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
        <motion.div 
          className={`absolute top-0 left-0 h-full ${hpColor} shadow-[0_0_10px_currentColor]`}
          initial={{ width: `${hpPercentage}%` }}
          animate={{ width: `${hpPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white drop-shadow-md">
          {player.hp} / {player.maxHp}
        </div>
      </div>

      {/* Energy Indicators (Only really relevant for Player, but safe to render) */}
      {!isOpponent && (
        <div className="flex items-center justify-between mt-1">
          <div className="flex gap-1">
            {Array.from({ length: player.maxEnergy }).map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full flex items-center justify-center transition-all ${
                  i < player.energy 
                    ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] border border-yellow-200' 
                    : 'bg-slate-800 border border-slate-700 opacity-50'
                }`}
              >
                {i < player.energy && <Zap className="w-3 h-3 text-yellow-900" />}
              </div>
            ))}
          </div>
          <span className="text-[8px] md:text-[10px] font-bold text-yellow-500">ENERGY</span>
        </div>
      )}
    </div>
  );
}
