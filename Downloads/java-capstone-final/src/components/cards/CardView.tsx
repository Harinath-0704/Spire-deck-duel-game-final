import { motion } from 'framer-motion';
import type { Card } from '../../game/types/card';
import { Zap, Shield, Sparkles, Heart } from 'lucide-react';
import { AudioService } from '../../services/audio';

interface CardViewProps {
  card: Card;
  disabled?: boolean;
  onClick?: () => void;
  index?: number;
  totalCards?: number;
  isDisplayOnly?: boolean;
  skinId?: string;
  size?: 'normal' | 'large';
}

const SKIN_CONFIGS: Record<string, { border: string, bg: string, shadow: string, glow: string, inner: string }> = {
  default: {
    border: 'border-slate-600',
    bg: 'from-slate-800 to-slate-900',
    shadow: 'shadow-[0_0_10px_rgba(100,116,139,0.3)]',
    glow: 'bg-slate-500/20',
    inner: 'border-slate-500/50'
  },
  skin_arcane: {
    border: 'border-blue-400',
    bg: 'from-blue-900 via-slate-900 to-black',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]',
    glow: 'bg-blue-500/30',
    inner: 'border-blue-400/60'
  },
  skin_inferno: {
    border: 'border-red-500',
    bg: 'from-red-950 via-red-900 to-black',
    shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    glow: 'bg-red-500/30',
    inner: 'border-red-500/60'
  },
  skin_frost: {
    border: 'border-cyan-300',
    bg: 'from-cyan-900 via-blue-950 to-slate-900',
    shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.6)]',
    glow: 'bg-cyan-400/30',
    inner: 'border-cyan-300/60'
  },
  skin_void: {
    border: 'border-purple-600',
    bg: 'from-black via-purple-950 to-black',
    shadow: 'shadow-[0_0_20px_rgba(147,51,234,0.7)]',
    glow: 'bg-purple-600/30',
    inner: 'border-purple-600/60'
  },
  skin_celestial: {
    border: 'border-yellow-300',
    bg: 'from-yellow-900 via-amber-900 to-slate-900',
    shadow: 'shadow-[0_0_25px_rgba(253,224,71,0.6)]',
    glow: 'bg-yellow-400/40',
    inner: 'border-yellow-400/60'
  }
};

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'text-slate-400',
  RARE: 'text-blue-400',
  EPIC: 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]',
  LEGENDARY: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]',
};

export function CardView({ card, disabled = false, onClick, index = 0, totalCards = 1, isDisplayOnly = false, skinId, size = 'normal' }: CardViewProps) {
  if (!card) return null;
  
  const isAttack = card.type === 'ATTACK';
  const isDefense = card.type === 'DEFENSE';
  const isSpecial = card.type === 'SPECIAL';
  
  const activeSkinId = skinId || card.activeSkinId || 'default';
  const skin = SKIN_CONFIGS[activeSkinId] || SKIN_CONFIGS.default;

  // Calculate fan spread for mobile portrait vs laptop
  let rotation = 0;
  let yOffset = 0;
  
  if (!isDisplayOnly) {
    const middleIndex = (totalCards - 1) / 2;
    const offset = index - middleIndex;
    
    // Check if on mobile (rough estimate) to tighten the fan
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const rotScale = isMobile ? 5 : 8;
    const yOffScale = isMobile ? 8 : 15;
    
    rotation = offset * rotScale; // degrees
    yOffset = Math.abs(offset) * yOffScale;
  }

  const handleClick = () => {
    if (!disabled && onClick) {
      if (!isDisplayOnly) AudioService.playCardSelect();
      onClick();
    }
  };

  const isLarge = size === 'large';
  
  // Base dimensions - significantly scaled down for small mobiles (w-20/w-24) to fit up to 10 cards
  const dims = isLarge 
    ? "w-48 h-72 md:w-56 md:h-80" 
    : "w-[4.5rem] h-24 min-[400px]:w-24 min-[400px]:h-36 md:w-32 md:h-48";
    
  const textTitle = isLarge ? "text-sm md:text-base" : "text-[8px] min-[400px]:text-[10px] md:text-xs";
  const textDesc = isLarge ? "text-xs md:text-sm" : "text-[6px] min-[400px]:text-[7px] md:text-[9px]";

  const initialAnim = isDisplayOnly ? {} : { y: 50, opacity: 0 };
  const animateAnim = isDisplayOnly ? { opacity: 1 } : { y: yOffset, rotate: rotation, opacity: 1 };
  const hoverAnim = disabled || isDisplayOnly ? {} : { 
    y: -30, 
    scale: 1.15,
    rotate: 0,
    zIndex: 50,
    boxShadow: "0 20px 40px rgba(0,0,0,0.8)"
  };
  const tapAnim = disabled || isDisplayOnly ? {} : { scale: 0.90 };

  return (
    <motion.div
      onClick={handleClick}
      initial={initialAnim}
      animate={animateAnim}
      whileHover={hoverAnim}
      whileTap={tapAnim}
      className={`relative ${dims} rounded-xl border-2 flex flex-col items-center p-2 transition-colors ${
        !disabled && onClick ? 'cursor-pointer' : ''
      } ${
        disabled && !isDisplayOnly ? 'opacity-50 grayscale cursor-not-allowed border-slate-700 bg-slate-800' : 
        `${skin.border} bg-gradient-to-br ${skin.bg} ${skin.shadow}`
      }`}
      style={!isDisplayOnly ? { 
        zIndex: index, 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      } : {}}
    >
      {/* Top Bar: Energy & Type */}
      <div className="w-full flex justify-between items-start z-10">
        <div className={`rounded-full bg-slate-950 flex items-center justify-center font-black text-blue-300 border border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.5)] ${isLarge ? 'w-8 h-8 text-lg' : 'w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 text-xs min-[400px]:text-sm'}`}>
          {card.energyCost}
        </div>
        <div className={`bg-slate-950/80 rounded-full border border-slate-700/50 ${isLarge ? 'p-1.5' : 'p-0.5 min-[400px]:p-1'}`}>
          {isAttack && <Zap className={`${isLarge ? 'w-5 h-5' : 'w-3 h-3 min-[400px]:w-4 min-[400px]:h-4'} text-red-400`} />}
          {isDefense && <Shield className={`${isLarge ? 'w-5 h-5' : 'w-3 h-3 min-[400px]:w-4 min-[400px]:h-4'} text-emerald-400`} />}
          {isSpecial && <Sparkles className={`${isLarge ? 'w-5 h-5' : 'w-3 h-3 min-[400px]:w-4 min-[400px]:h-4'} text-purple-400`} />}
        </div>
      </div>
      
      {/* Artwork Area */}
      <div className={`relative flex-1 w-full min-h-0 ${isLarge ? 'my-2' : 'my-1'} rounded-lg bg-black/60 overflow-hidden flex flex-col justify-center items-center border ${skin.inner}`}>
         {/* Inner Glow based on Skin */}
         <div className={`absolute inset-0 ${skin.glow} blur-2xl`}></div>
         
         {/* Icon based on card effect */}
         <div className="relative z-10 flex gap-1 min-[400px]:gap-2">
            {card.damage && (
                <div className="flex flex-col items-center">
                    <Zap className={`${isLarge ? 'w-10 h-10' : 'w-4 h-4 min-[400px]:w-6 min-[400px]:h-6'} text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]`} />
                    <span className={`font-black text-red-400 ${isLarge ? 'text-lg' : 'text-[10px] min-[400px]:text-xs'} drop-shadow-md`}>{card.damage}</span>
                </div>
            )}
            {card.block && (
                <div className="flex flex-col items-center">
                    <Shield className={`${isLarge ? 'w-10 h-10' : 'w-4 h-4 min-[400px]:w-6 min-[400px]:h-6'} text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]`} />
                    <span className={`font-black text-emerald-400 ${isLarge ? 'text-lg' : 'text-[10px] min-[400px]:text-xs'} drop-shadow-md`}>{card.block}</span>
                </div>
            )}
            {card.healing && (
                <div className="flex flex-col items-center">
                    <Heart className={`${isLarge ? 'w-10 h-10' : 'w-4 h-4 min-[400px]:w-6 min-[400px]:h-6'} text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]`} />
                    <span className={`font-black text-pink-400 ${isLarge ? 'text-lg' : 'text-[10px] min-[400px]:text-xs'} drop-shadow-md`}>{card.healing}</span>
                </div>
            )}
         </div>

         {/* Particles for certain skins */}
         {activeSkinId === 'skin_void' && (
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 to-transparent"></div>
         )}
         {activeSkinId === 'skin_celestial' && (
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-300/20 to-transparent"></div>
         )}
         
         {/* Rarity Label Overlay */}
         <span className={`absolute bottom-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest ${RARITY_COLORS[card.rarity]}`}>
            {card.rarity}
         </span>
      </div>

      {/* Card Info Bottom */}
      <div className={`mt-auto z-10 text-center w-full bg-slate-950/90 rounded px-1 py-1 border border-white/10 backdrop-blur-sm shrink-0 ${isLarge ? 'mb-1' : ''}`}>
        <h3 className={`${textTitle} font-bold text-white uppercase tracking-tight leading-tight drop-shadow-md truncate`}>{card.name}</h3>
        <p className={`${textDesc} text-slate-300 mt-0.5 leading-tight line-clamp-2`}>{card.description}</p>
      </div>
      
      {/* Foil overlay for Epic/Legendary */}
      {(!disabled || isDisplayOnly) && (card.rarity === 'EPIC' || card.rarity === 'LEGENDARY') && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none mix-blend-overlay rounded-xl"></div>
      )}
    </motion.div>
  );
}
