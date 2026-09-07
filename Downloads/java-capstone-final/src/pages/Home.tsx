import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Gift, Coins, Loader2, Library, Store } from 'lucide-react';
import { Sparkles, Sword, Star, Shield, Zap, User, Settings } from 'lucide-react';
import { ensureSession } from '../services/supabase/client';
import { getProfile } from '../services/supabase/profileService';
import type { PlayerProfile } from '../services/supabase/profileService';
import { useTranslation } from '../hooks/useTranslation';
import { AudioService } from '../services/audio';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const AVATAR_MAP: Record<string, any> = {
    'arcane': { icon: Sparkles, color: 'text-purple-400' },
    'warrior': { icon: Sword, color: 'text-red-400' },
    'mystic': { icon: Star, color: 'text-blue-400' },
    'void': { icon: Zap, color: 'text-indigo-400' },
    'celestial': { icon: Shield, color: 'text-amber-400' },
  };

  useEffect(() => {
    AudioService.playMenuMusic();
    const init = async () => {
      const id = await ensureSession();
      if (id) {
        const p = await getProfile(id);
        setProfile(p);
      }
      setLoading(false);
    };
    init();
  }, []);
  
  const playClick = () => AudioService.playCardSelect();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-blue-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center p-6 overflow-y-auto overflow-x-hidden">
      {/* Background Effects */}
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>

      {/* Profile & Settings Header */}
      <div className="w-full max-w-md flex justify-between items-center z-50 mb-6 mt-2 md:mt-4 px-2">
        <Link
          to="/settings"
          onClick={playClick}
          className="glass-panel p-2 rounded-full border border-blue-500/30 hover:bg-slate-800/80 transition-colors cursor-pointer text-slate-300 hover:text-white flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          <span className="font-bold tracking-widest uppercase text-sm">{t('settings.title')}</span>
        </Link>

        {profile && (
          <Link 
            to="/profile" 
            onClick={playClick}
            className="glass-panel px-3 py-1.5 flex items-center gap-3 rounded-full border border-blue-500/30 hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="flex flex-col items-end justify-center">
              <span className="font-bold text-sm text-white leading-none">{profile.display_name}</span>
              <div className="flex items-center gap-1 mt-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="font-bold text-xs text-yellow-400 leading-none">{profile.coins}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
              {profile.avatar && profile.avatar.startsWith('http') ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : profile.avatar && AVATAR_MAP[profile.avatar] ? (() => {
                const Icon = AVATAR_MAP[profile.avatar].icon;
                return <Icon className={`w-4 h-4 ${AVATAR_MAP[profile.avatar].color}`} />;
              })() : <User className="w-4 h-4 text-slate-400" />}
            </div>
          </Link>
        )}
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 md:p-6 gap-4 md:gap-6 w-full max-w-md mx-auto">
        
        {/* PLAY VS COMPUTER */}
        <button
          onClick={() => {
            AudioService.playCardSelect();
            navigate('/battle?mode=computer');
          }}
          className="w-full relative group overflow-hidden rounded-2xl border border-orange-500/40 bg-slate-900/80 backdrop-blur-md p-8 shadow-[0_0_20px_rgba(234,88,12,0.15)] hover:shadow-[0_0_40px_rgba(234,88,12,0.4)] hover:border-orange-400 transition-all duration-300 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-950/80 flex items-center justify-center border border-orange-500/40 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
              <Sword className="w-8 h-8 text-orange-400 drop-shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-white tracking-widest uppercase mb-1 drop-shadow-md">{t('home.play')}</h2>
              <p className="text-orange-300/60 text-sm tracking-widest uppercase font-bold">{t('home.vs_computer')}</p>
            </div>
          </div>
        </button>

        {/* ONLINE PVP */}
        <div className="w-full grid grid-cols-2 gap-2 md:gap-4">
          <button
            onClick={() => {
              AudioService.playCardSelect();
              navigate('/create-room');
            }}
            className="relative group overflow-hidden rounded-xl border border-amber-500/30 bg-slate-900/80 backdrop-blur-md p-6 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:border-amber-400 transition-all duration-300 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-950/80 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-amber-100 tracking-widest uppercase text-center">{t('room.create')}</h2>
            </div>
          </button>
          
          <button
            onClick={() => {
              AudioService.playCardSelect();
              navigate('/join-room');
            }}
            className="relative group overflow-hidden rounded-xl border border-amber-500/30 bg-slate-900/80 backdrop-blur-md p-6 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:border-amber-400 transition-all duration-300 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-950/80 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-amber-100 tracking-widest uppercase text-center">{t('room.join')}</h2>
            </div>
          </button>
        </div>

        {/* DECK & CHARACTERS BUILDER */}
        <div className="w-full mt-2 grid grid-cols-2 gap-4">
          <Link to="/deck" onClick={() => AudioService.playCardSelect()} className="w-full bg-slate-900/80 backdrop-blur-md p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 group border border-orange-500/20 hover:border-orange-500/50 shadow-[0_0_10px_rgba(234,88,12,0.1)]">
            <Library className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-widest uppercase text-xs text-orange-100">DECK BUILDER</span>
          </Link>
          <Link to="/characters" onClick={() => AudioService.playCardSelect()} className="w-full bg-slate-900/80 backdrop-blur-md p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 group border border-amber-500/20 hover:border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            <User className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-widest uppercase text-xs text-amber-100">CHARACTERS</span>
          </Link>
        </div>

        {/* SECONDARY ACTIONS */}
        <div className="w-full grid grid-cols-2 gap-4 mt-2">
          <Link to="/collection" onClick={() => AudioService.playCardSelect()} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 group border border-red-500/20 hover:border-red-500/50">
            <div className="w-10 h-10 rounded-full bg-slate-950/80 flex items-center justify-center border border-red-500/30 group-hover:scale-110 transition-transform">
              <Library className="w-5 h-5 text-red-400" />
            </div>
            <span className="font-bold tracking-widest uppercase text-xs text-red-100">{t('home.collection')}</span>
          </Link>
          <Link to="/shop" onClick={() => AudioService.playCardSelect()} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 group border border-yellow-500/20 hover:border-yellow-500/50">
            <div className="w-10 h-10 rounded-full bg-slate-950/80 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform">
              <Store className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="font-bold tracking-widest uppercase text-xs text-yellow-100">{t('home.shop')}</span>
          </Link>
        </div>

        <div className="w-full mt-2">
          <Link to="/rewards" onClick={() => AudioService.playCardSelect()} className="w-full bg-slate-900/80 backdrop-blur-md p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 group border border-orange-500/30 hover:border-orange-500/60 shadow-[0_0_15px_rgba(234,88,12,0.1)]">
            <Gift className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-widest uppercase text-sm text-orange-100">{t('home.rewards')}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
