import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, LogOut, Coins, Flame, Sparkles, Sword, Star, Shield, Zap, User, Edit3, Trophy, Swords, ShieldAlert, Upload } from 'lucide-react';
import { ensureSession, signOut } from '../services/supabase/client';
import { getProfile, upsertProfile, getPlayerStats, formatCoins, uploadAvatar } from '../services/supabase/profileService';
import type { PlayerStats } from '../services/supabase/profileService';
import { getOwnedSkins } from '../services/supabase/shopService';
import type { PlayerProfile } from '../services/supabase/profileService';
import { AudioService } from '../services/audio';

const AVATARS = [
  { id: 'arcane', name: 'Arcane', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/50' },
  { id: 'warrior', name: 'Warrior', icon: Sword, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50' },
  { id: 'mystic', name: 'Mystic', icon: Star, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-500/50' },
  { id: 'void', name: 'Void', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-900/30', border: 'border-indigo-500/50' },
  { id: 'celestial', name: 'Celestial', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-500/50' },
];

const AVATAR_MAP = AVATARS.reduce((acc, a) => ({ ...acc, [a.id]: a }), {} as Record<string, typeof AVATARS[0]>);

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [skinCount, setSkinCount] = useState(0);
  const [error, setError] = useState('');

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('arcane');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const id = await ensureSession();
        if (id) {
          const p = await getProfile(id);
          if (p) {
            setProfile(p);
            setEditDisplayName(p.display_name);
            setEditUsername(p.username || '');
            setEditAvatar(p.avatar || 'arcane');
          }
          const s = await getPlayerStats(id);
          setStats(s);
          const skins = await getOwnedSkins(id);
          setSkinCount(skins.length);
        } else {
          navigate('/', { replace: true });
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleSignOut = async () => {
    AudioService.playCardSelect();
    await signOut();
    navigate('/', { replace: true });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setUploadingAvatar(true);
    setError('');
    
    try {
      const { url: publicUrl, error: uploadError } = await uploadAvatar(file, profile.id);
      if (publicUrl) {
        setEditAvatar(publicUrl);
      } else {
        setError(`Upload failed: ${uploadError}`);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during upload.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    AudioService.playCardSelect();
    
    const trimmedDisplay = editDisplayName.trim();
    const trimmedUser = editUsername.trim();
    
    if (trimmedDisplay.length < 3 || trimmedUser.length < 3) {
      setError('Names must be at least 3 characters.');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const updated = await upsertProfile(profile.id, trimmedDisplay, editAvatar, trimmedUser);
      if (updated) {
        setProfile(updated);
        setIsEditing(false);
      } else {
        setError('Failed to update profile (username might be taken).');
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-transparent text-white">
        <p>Profile not found.</p>
        <button onClick={handleSignOut} className="mt-4 px-4 py-2 bg-blue-600 rounded">Return to Login</button>
      </div>
    );
  }

  const isCustomAvatar = (avatarUrl: string | null) => avatarUrl && avatarUrl.startsWith('http');
  const displayIsCustom = isCustomAvatar(profile.avatar);
  const editIsCustom = isCustomAvatar(editAvatar);

  const avatarInfo = !displayIsCustom && profile.avatar && AVATAR_MAP[profile.avatar] 
    ? AVATAR_MAP[profile.avatar] 
    : { icon: User, color: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-700' };
  
  const AvatarIcon = avatarInfo.icon;

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center p-6 pb-24 bg-transparent text-slate-200 overflow-y-auto overflow-x-hidden font-sans relative scroll-smooth">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black pointer-events-none"></div>

      <div className="relative top-0 z-50 flex items-center gap-4 w-full max-w-md mx-auto mb-6 mt-4">
        <Link to="/home" onClick={() => AudioService.playCardSelect()} className="p-2 glass-panel rounded-full text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200 uppercase">
          Player Profile
        </h1>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {error && (
          <div className="w-full mb-6 p-4 rounded-lg bg-red-950/50 border border-red-500/30 text-red-400 text-center text-sm">
            {error}
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          {isEditing ? (
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-6 w-full">
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Choose Avatar</label>
                  
                  <div className="mb-4">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <span className="font-bold tracking-wider uppercase text-sm">Upload from Gallery</span>
                    </button>
                  </div>

                  <div className="bg-transparent/50 p-4 rounded-xl border border-slate-800 flex justify-between gap-2 overflow-x-auto">
                    {editIsCustom && (
                      <button
                        type="button"
                        className="min-w-12 h-12 w-12 rounded-xl flex shrink-0 items-center justify-center transition-all bg-slate-800 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110 overflow-hidden"
                      >
                         <img src={editAvatar} alt="Custom" className="w-full h-full object-cover" />
                      </button>
                    )}
                    {AVATARS.map((avatar) => {
                      const isSelected = editAvatar === avatar.id;
                      const Icon = avatar.icon;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setEditAvatar(avatar.id)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            isSelected 
                              ? `${avatar.bg} ${avatar.border} border-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-110` 
                              : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? avatar.color : 'text-slate-400'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Display Name</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-transparent/50 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2 block">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-transparent/50 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    maxLength={16}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest transition-all bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6 relative">
                <div className={`w-32 h-32 rounded-2xl flex items-center justify-center mb-4 ${displayIsCustom ? 'border-2 border-slate-700 shadow-[0_0_30px_rgba(255,255,255,0.05)] overflow-hidden' : `${avatarInfo.bg} ${avatarInfo.border} border-2 shadow-[0_0_30px_rgba(255,255,255,0.05)]`}`}>
                  {displayIsCustom && profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <AvatarIcon className={`w-16 h-16 ${avatarInfo.color}`} />
                  )}
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-4 -right-2 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-500 transition-colors shadow-lg"
                >
                  <Edit3 className="w-5 h-5" />
                </button>

                <h2 className="text-3xl font-serif font-bold tracking-wider text-white mb-1 uppercase">
                  {profile.display_name}
                </h2>
                <p className="text-blue-400/80 text-sm tracking-wider mb-4">@{profile.username || 'player'}</p>
                
                <div className="text-xs font-mono text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                  ID: {profile.id.substring(0, 8).toUpperCase()}
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center border-yellow-500/20">
                  <Coins className="w-8 h-8 text-yellow-400 mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                  <div className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-1">Coins</div>
                  <div className="text-2xl font-bold text-yellow-400">{formatCoins(profile.coins)}</div>
                </div>
                
                <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center border-orange-500/20">
                  <Flame className="w-8 h-8 text-orange-500 mb-2 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  <div className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-1">Daily Streak</div>
                  <div className="text-2xl font-bold text-orange-500">{profile.streak}</div>
                </div>
                
                <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center border-purple-500/20 col-span-2">
                  <Sparkles className="w-8 h-8 text-purple-400 mb-2 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                  <div className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-1">Premium Skins Owned</div>
                  <div className="text-2xl font-bold text-purple-400">{skinCount}</div>
                </div>
              </div>

              {/* Match Stats */}
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-8 w-full">
                <h3 className="text-lg font-bold text-slate-200 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Battle Statistics
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-transparent/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <Swords className="w-5 h-5 text-blue-400 mb-2" />
                    <span className="text-2xl font-bold text-white">{stats?.totalMatches || 0}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Matches</span>
                  </div>
                  
                  <div className="bg-transparent/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <Trophy className="w-5 h-5 text-green-400 mb-2" />
                    <span className="text-2xl font-bold text-green-400">{stats?.wins || 0}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Wins</span>
                  </div>
                  
                  <div className="bg-transparent/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className="w-5 h-5 text-red-400 mb-2" />
                    <span className="text-2xl font-bold text-red-400">{stats?.losses || 0}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Losses</span>
                  </div>
                  
                  <div className="bg-transparent/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <Shield className="w-5 h-5 text-slate-400 mb-2" />
                    <span className="text-2xl font-bold text-slate-400">{stats?.draws || 0}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Draws</span>
                  </div>
                  
                  <div className="col-span-2 bg-transparent/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <div className="w-5 h-5 flex items-center justify-center text-blue-400 mb-2 font-bold text-xl">%</div>
                    <span className="text-2xl font-bold text-white">{stats?.winRate || 0}%</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Win Rate</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-red-400 bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
              <p className="text-slate-500 text-xs text-center mt-4 px-8">
                Signing out will clear your session from this device. Guest accounts cannot be recovered.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
