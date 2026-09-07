import { motion, AnimatePresence } from 'framer-motion';
import type { BattleLogEntry } from '../../game/types/game';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

export function BattleLog({ logs }: BattleLogProps) {
  // Only show the 3 most recent logs
  const displayLogs = logs.slice(0, 3);

  return (
    <div className="absolute top-20 left-4 w-48 pointer-events-none z-20 flex flex-col gap-1">
      <AnimatePresence>
        {displayLogs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-[10px] text-slate-300 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded px-2 py-1 shadow-sm"
          >
            {log.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
