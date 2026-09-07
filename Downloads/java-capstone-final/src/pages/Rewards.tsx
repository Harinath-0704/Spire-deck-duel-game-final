import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, Check, Loader2, Coins } from 'lucide-react';
import { AudioService } from '../services/audio';
import { ensureSession } from '../services/supabase/client';
import { getProfile, claimDailyReward } from '../services/supabase/profileService';
import type { PlayerProfile } from '../services/supabase/profileService';

const REWARD_AMOUNTS = [100, 150, 200, 250, 300, 400, 500];

export default function Rewards() {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    const init = async () => {
      const id = await ensureSession();
      setPlayerId(id);
      
      if (id) {
        const p = await getProfile(id);
        setProfile(p);
        
        if (p) {
          const today = new Date().toISOString().split('T')[0];
          setCanClaim(p.last_daily_claim !== today);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleClaim = async () => {
    if (!playerId || !profile || !canClaim || claiming) return;

    setClaiming(true);
    setClaimMessage(null);
    
    const result = await claimDailyReward(playerId, profile);
    
    setClaimMessage({ text: result.message || '', success: result.success });
    
    if (result.success) {
      setProfile((prev: PlayerProfile | null) => prev ? { 
        ...prev, 
        coins: result.newCoins, 
        streak: result.newStreak,
        last_daily_claim: new Date().toISOString().split('T')[0]
      } : null);
      setCanClaim(false);
    }
    
    setClaiming(false);
  };

  // Determine current display streak (1-7)
  const currentStreak = profile ? profile.streak : 0;
  // If we can claim today, the highlighted day is currentStreak + 1
  // (unless currentStreak >= 7, then it wraps to 1). 
  // If we already claimed, the highlighted day is currentStreak.
  let highlightDay = 1;
  if (profile) {
    if (canClaim) {
      // Missing a day logic
      let diffDays = 0;
      if (profile.last_daily_claim) {
        const lastClaim = new Date(profile.last_daily_claim);
        const today = new Date(new Date().toISOString().split('T')[0]);
        const diffTime = Math.abs(today.getTime() - lastClaim.getTime());
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      if (diffDays === 1) {
         highlightDay = currentStreak >= 7 ? 1 : currentStreak + 1;
      } else {
         highlightDay = 1; // Missed a day or first time
      }
    } else {
      highlightDay = currentStreak === 0 ? 1 : currentStreak;
      // Handle edge case where it's > 7
      if (highlightDay > 7) {
          highlightDay = highlightDay % 7;
          if (highlightDay === 0) highlightDay = 7;
      }
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center p-6 bg-transparent text-slate-200 overflow-hidden font-sans">
      

      <div className="absolute top-4 left-4 z-50">
        <Link to="/" onClick={() => AudioService.playCardSelect()} className="p-2 glass-panel rounded-full text-slate-300 hover:text-white transition-colors block">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
      
      {profile && (
        <div className="absolute top-4 right-4 z-50 glass-panel px-4 py-2 flex items-center gap-2 rounded-full border border-yellow-500/30">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-yellow-400">{profile.coins}</span>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full max-w-md mt-16">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Gift className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold tracking-widest premium-text uppercase">Daily Rewards</h1>
          <p className="text-slate-400 mt-2">Return every day to claim bonus coins!</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center p-20 min-h-[300px]">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-500/30 animate-[spin_3s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            
            <div className="grid grid-cols-4 gap-3">
              {REWARD_AMOUNTS.slice(0, 4).map((amount, idx) => {
                const day = idx + 1;
                const isPast = !canClaim && day < highlightDay;
                const isToday = day === highlightDay;
                const isClaimedToday = !canClaim && isToday;
                
                return (
                  <RewardBox 
                    key={day} 
                    day={day} 
                    amount={amount} 
                    isPast={isPast} 
                    isToday={isToday} 
                    isClaimedToday={isClaimedToday} 
                  />
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {REWARD_AMOUNTS.slice(4, 7).map((amount, idx) => {
                const day = idx + 5;
                const isPast = !canClaim && day < highlightDay;
                const isToday = day === highlightDay;
                const isClaimedToday = !canClaim && isToday;
                
                return (
                  <RewardBox 
                    key={day} 
                    day={day} 
                    amount={amount} 
                    isPast={isPast} 
                    isToday={isToday} 
                    isClaimedToday={isClaimedToday} 
                    isLarge={day === 7}
                  />
                );
              })}
            </div>

            <AnimatePresence>
              {claimMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-center py-2 mt-4 font-bold ${claimMessage.success ? 'text-green-400' : 'text-red-400'}`}
                >
                  {claimMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={canClaim ? { scale: 1.02 } : {}}
              whileTap={canClaim ? { scale: 0.98 } : {}}
              onClick={handleClaim}
              disabled={!canClaim || claiming}
              className={`mt-6 py-4 w-full rounded-xl font-bold uppercase tracking-widest transition-all ${
                canClaim && !claiming
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {claiming ? (
                <Loader2 className="w-5 h-5 mx-auto animate-spin" />
              ) : canClaim ? (
                'Claim Reward'
              ) : (
                'Come back tomorrow'
              )}
            </motion.button>
            
          </div>
        )}
      </div>
    </div>
  );
}

function RewardBox({ day, amount, isPast, isToday, isClaimedToday, isLarge = false }: { day: number, amount: number, isPast: boolean, isToday: boolean, isClaimedToday: boolean, isLarge?: boolean }) {
  
  let bgClass = "bg-slate-800/50 border-slate-700/50";
  if (isPast || isClaimedToday) {
    bgClass = "bg-green-900/20 border-green-500/30";
  } else if (isToday) {
    bgClass = "bg-blue-900/40 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)]";
  }

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border glass-panel transition-all ${bgClass} ${isLarge ? 'col-span-1 py-6' : ''}`}>
      <div className={`text-xs font-bold mb-2 ${isToday && !isClaimedToday ? 'text-blue-400' : 'text-slate-400'}`}>DAY {day}</div>
      
      {isPast || isClaimedToday ? (
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-1">
          <Check className="w-5 h-5" />
        </div>
      ) : (
        <Coins className={`w-6 h-6 mb-2 ${isLarge ? 'w-8 h-8' : ''} ${isToday ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-slate-500'}`} />
      )}
      
      <div className={`font-bold ${isPast || isClaimedToday ? 'text-green-400' : isToday ? 'text-yellow-400' : 'text-slate-300'}`}>
        {amount}
      </div>
    </div>
  );
}
