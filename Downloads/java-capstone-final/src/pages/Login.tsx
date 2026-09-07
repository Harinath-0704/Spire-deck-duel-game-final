import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Sparkles, User, Sword, Star, Shield, Zap, Mail, Lock, Info } from 'lucide-react';
import { supabase, createGuestSession } from '../services/supabase/client';
import { getProfile, upsertProfile } from '../services/supabase/profileService';
import { AudioService } from '../services/audio';

type AuthView = 'main' | 'email' | 'profile_setup';
type EmailMode = 'signin' | 'signup';

const AVATARS = [
  { id: 'arcane', name: 'Arcane', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/50' },
  { id: 'warrior', name: 'Warrior', icon: Sword, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50' },
  { id: 'mystic', name: 'Mystic', icon: Star, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-500/50' },
  { id: 'void', name: 'Void', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-900/30', border: 'border-indigo-500/50' },
  { id: 'celestial', name: 'Celestial', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-500/50' },
];

export default function Login({ initialSession = null }: { initialSession?: string | null }) {
  const navigate = useNavigate();
  // We no longer need an initial loader here since App.tsx handles global auth loading
  const [view, setView] = useState<AuthView>(initialSession ? 'profile_setup' : 'main');
  
  // Auth state
  const [playerId, setPlayerId] = useState<string | null>(initialSession);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Email state
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile setup state
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('arcane');

  const handleAuthenticatedUser = async (id: string) => {
    setPlayerId(id);
    const profile = await getProfile(id);
    if (profile && profile.display_name && profile.display_name !== 'Player') {
      navigate('/home', { replace: true });
    } else {
      setView('profile_setup');
    }
  };

  const handleGoogleLogin = async () => {
    AudioService.playCardSelect();
    setSubmitting(true);
    setError('');
    try {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || 'Failed to initialize Google login');
      setSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    AudioService.playCardSelect();
    setSubmitting(true);
    setError('');
    try {
      const id = await createGuestSession();
      if (id) {
        handleAuthenticatedUser(id);
      } else {
        setError('Failed to create guest session');
      }
    } catch (e: any) {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    AudioService.playCardSelect();
    
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (emailMode === 'signin') {
        const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) handleAuthenticatedUser(data.user.id);
      } else {
        const { data, error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          if (data.session) {
            handleAuthenticatedUser(data.user.id);
          } else {
            setError('Please check your email to confirm your account.');
          }
        }
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Connection error. Please try again.');
      return;
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 16) {
      setError('Username must be 16 characters or less.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const profile = await upsertProfile(playerId, trimmed, selectedAvatar);
      if (profile) {
        AudioService.playCardSelect();
        navigate('/home', { replace: true });
      } else {
        setError('Failed to create profile.');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-transparent text-slate-200 overflow-hidden font-sans relative">
      

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-blue-300 via-blue-100 to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] mb-2 uppercase">
            Spire Deck
            <br />
            Duel
          </h1>
          <p className="text-blue-400/80 text-sm tracking-[0.2em] uppercase">
            {view === 'main' && 'Enter the Arena'}
            {view === 'email' && (emailMode === 'signin' ? 'Sign In' : 'Create Account')}
            {view === 'profile_setup' && 'Create Your Identity'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mb-6 p-3 rounded-lg bg-red-950/50 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm"
            >
              <Info className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {view === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-4"
            >
              <button
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all bg-white hover:bg-slate-100 text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleGuestLogin}
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Play as Guest'}
              </button>

              <button
                onClick={() => { AudioService.playCardSelect(); setView('email'); setError(''); }}
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-slate-900/50 hover:bg-slate-800 text-blue-400 border border-blue-900/50"
              >
                Sign In / Create Account
              </button>
              
              <div className="text-center pt-4">
                <p className="text-slate-500 text-xs tracking-wider">Your progress is saved securely.</p>
              </div>
            </motion.div>
          )}

          {view === 'email' && (
            <motion.form
              key="email"
              onSubmit={handleEmailAuth}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-5"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email..."
                    className="w-full bg-slate-900/80 border border-blue-500/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  {emailMode === 'signin' && (
                    <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password..."
                    className="w-full bg-slate-900/80 border border-blue-500/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 mt-2 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (emailMode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>

              <button
                type="button"
                onClick={() => {
                  AudioService.playCardSelect();
                  setEmailMode(emailMode === 'signin' ? 'signup' : 'signin');
                  setError('');
                }}
                className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                {emailMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
              
              <button
                type="button"
                onClick={() => { AudioService.playCardSelect(); setView('main'); setError(''); }}
                className="w-full py-2 mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
              >
                Back to Options
              </button>
            </motion.form>
          )}

          {view === 'profile_setup' && (
            <motion.form
              key="profile_setup"
              onSubmit={handleProfileSetup}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter 3-16 characters..."
                    className="w-full bg-slate-900/80 border border-blue-500/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-medium"
                    maxLength={16}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Choose Avatar</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.id;
                    const Icon = avatar.icon;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                          isSelected 
                            ? `${avatar.bg} ${avatar.border} border-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-110 z-10` 
                            : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? avatar.color : 'text-slate-400'}`} />
                      </button>
                    );
                  })}
                </div>
                <div className="text-center text-sm font-medium text-slate-300 h-5">
                  {AVATARS.find(a => a.id === selectedAvatar)?.name} Class
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || !username.trim()}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  submitting || !username.trim()
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50'
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Enter the Duel
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Developer Notice for Google Auth */}
      {view === 'main' && (
        <div className="absolute bottom-4 text-[10px] text-slate-600 max-w-[300px] text-center">
          Note: Google OAuth requires configuration in Supabase Dashboard → Authentication → Providers → Google.
        </div>
      )}
    </div>
  );
}
