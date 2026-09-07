import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { GameState } from '../../game/types/game';
import { AudioService } from '../../services/audio';
import { SettingsService } from '../../services/settingsService';

interface CombatEffectsProps {
  state: GameState;
}

interface EffectInstance {
  id: number;
  type: 'damage' | 'heal' | 'block' | 'attack_vfx';
  value?: number;
  target: 'player' | 'opponent';
}

export function CombatEffects({ state }: CombatEffectsProps) {
  const [effects, setEffects] = useState<EffectInstance[]>([]);
  
  // Track previous state to detect changes
  const [prevHp, setPrevHp] = useState({ player: state.player.hp, opponent: state.opponent.hp });
  const [prevBlock, setPrevBlock] = useState({ player: state.player.block, opponent: state.opponent.block });

  useEffect(() => {
    const settings = SettingsService.getSettings();
    if (!settings.battleAnimationsEnabled) {
      setPrevHp({ player: state.player.hp, opponent: state.opponent.hp });
      setPrevBlock({ player: state.player.block, opponent: state.opponent.block });
      return;
    }

    const newEffects: EffectInstance[] = [];
    const idBase = Date.now();

    // Check Opponent Damage
    if (state.opponent.hp < prevHp.opponent) {
      newEffects.push({ id: idBase + 1, type: 'attack_vfx', target: 'opponent' });
      newEffects.push({ id: idBase + 2, type: 'damage', value: prevHp.opponent - state.opponent.hp, target: 'opponent' });
      AudioService.playHit();
    }
    
    // Check Player Damage
    if (state.player.hp < prevHp.player) {
      newEffects.push({ id: idBase + 3, type: 'attack_vfx', target: 'player' });
      newEffects.push({ id: idBase + 4, type: 'damage', value: prevHp.player - state.player.hp, target: 'player' });
      AudioService.playHit();
    }

    // Check Blocks
    if (state.player.block > prevBlock.player) {
      newEffects.push({ id: idBase + 5, type: 'block', value: state.player.block - prevBlock.player, target: 'player' });
    }
    if (state.opponent.block > prevBlock.opponent) {
      newEffects.push({ id: idBase + 6, type: 'block', value: state.opponent.block - prevBlock.opponent, target: 'opponent' });
    }

    if (newEffects.length > 0) {
      setEffects(prev => [...prev, ...newEffects]);
      
      // Cleanup effects after animation
      setTimeout(() => {
        setEffects(prev => prev.filter(e => !newEffects.find(ne => ne.id === e.id)));
      }, 1500);
    }

    setPrevHp({ player: state.player.hp, opponent: state.opponent.hp });
    setPrevBlock({ player: state.player.block, opponent: state.opponent.block });
  }, [state.player.hp, state.opponent.hp, state.player.block, state.opponent.block]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <AnimatePresence>
        {effects.map((effect) => {
          // Position based on target
          const positionClass = effect.target === 'opponent' 
            ? 'top-[20%] left-1/2 -translate-x-1/2' 
            : 'bottom-[30%] left-1/2 -translate-x-1/2';

          if (effect.type === 'damage') {
            return (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 1, 1], y: -50 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className={`absolute ${positionClass} text-4xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]`}
              >
                -{effect.value}
              </motion.div>
            );
          }

          if (effect.type === 'block') {
            return (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 1.5] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={`absolute ${positionClass} w-32 h-32 rounded-full border-4 border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.5)] flex items-center justify-center`}
              >
                <span className="text-2xl font-bold text-emerald-300">+{effect.value}</span>
              </motion.div>
            );
          }

          if (effect.type === 'attack_vfx') {
            // A simple slash effect
            return (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, scale: 0, rotate: -45 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 2.5] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`absolute ${positionClass} w-48 h-2 bg-white shadow-[0_0_20px_rgba(255,255,255,1)]`}
              />
            );
          }

          return null;
        })}
      </AnimatePresence>
    </div>
  );
}
