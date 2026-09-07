import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase, ensureSession } from './services/supabase/client';
import { getProfile, upsertProfile } from './services/supabase/profileService';

import Home from './pages/Home';
import Battle from './pages/Battle';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Rewards from './pages/Rewards';
import Shop from './pages/Shop';
import Collection from './pages/Collection';
import { Characters } from './pages/Characters';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { DeckBuilder } from './pages/DeckBuilder';
import { ArenaBackground } from './components/battle/ArenaBackground';

// Placeholder for missing pages
function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-200">
      <h1 className="text-2xl font-serif text-blue-400 mb-4">{title}</h1>
      <p className="text-slate-400 text-center mb-8">This feature will be implemented in a future step.</p>
      <a href="/" className="btn-primary">Return Home</a>
    </div>
  );
}

function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const id = await ensureSession();
        if (id) {
          let profile = await getProfile(id);
          
          // Auto-create profile for Google/Guest if missing
          if (!profile) {
            const { data: { user } } = await supabase!.auth.getUser();
            if (user && (user.app_metadata?.provider === 'google' || user.is_anonymous)) {
              const baseName = user.app_metadata?.provider === 'google' 
                ? (user.user_metadata?.full_name || 'Player') 
                : `Player${Math.floor(Math.random() * 10000)}`;
              
              const username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
              profile = await upsertProfile(id, baseName, 'arcane', username);
            }
          }

          if (mounted) {
            setSession(id);
            setHasProfile(!!profile?.display_name && profile.display_name !== 'Player');
          }
        } else {
          if (mounted) {
            setSession(null);
            setHasProfile(false);
          }
        }
      } catch (e) {
        console.error('initAuth error:', e);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };
    initAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        const id = newSession?.user?.id;
        if (id && mounted) {
          setSession(id);
          let profile = await getProfile(id);
          
          // Auto-create profile for Google/Guest if missing
          if (!profile) {
             const user = newSession?.user;
             if (user && (user.app_metadata?.provider === 'google' || user.is_anonymous)) {
               const baseName = user.app_metadata?.provider === 'google' 
                 ? (user.user_metadata?.full_name || 'Player') 
                 : `Player${Math.floor(Math.random() * 10000)}`;
               
               const username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
               profile = await upsertProfile(id, baseName, 'arcane', username);
             }
          }

          if (mounted) {
            setHasProfile(!!profile?.display_name && profile.display_name !== 'Player');
          }
        } else if (mounted) {
          setSession(null);
          setHasProfile(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-950">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-4xl md:text-5xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-blue-300 via-blue-100 to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] mb-8 uppercase text-center">
            Spire Deck
            <br />
            Duel
          </div>
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-500/30 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          </div>
          <div className="mt-6 text-blue-400 font-serif tracking-widest animate-pulse text-sm uppercase">Checking session...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="relative min-h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <ArenaBackground />
        </div>
        <div className="relative z-10 w-full h-full">
          <Routes>
        <Route 
          path="/" 
          element={session && hasProfile ? <Navigate to="/home" replace /> : <Login initialSession={session} />} 
        />
        
        {/* Protected Routes */}
        <Route path="/home" element={session ? <Home /> : <Navigate to="/" replace />} />
        <Route path="/battle" element={session ? <Battle /> : <Navigate to="/" replace />} />
        <Route path="/create-room" element={session ? <CreateRoom /> : <Navigate to="/" replace />} />
        <Route path="/join-room" element={session ? <JoinRoom /> : <Navigate to="/" replace />} />
        <Route path="/deck" element={session ? <DeckBuilder /> : <Navigate to="/" replace />} />
        <Route path="/collection" element={session ? <Collection /> : <Navigate to="/" replace />} />
        <Route path="/characters" element={session ? <Characters /> : <Navigate to="/" replace />} />
        <Route path="/rewards" element={session ? <Rewards /> : <Navigate to="/" replace />} />
        <Route path="/shop" element={session ? <Shop /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" replace />} />
        
        <Route path="/history" element={session ? <Placeholder title="Battle History" /> : <Navigate to="/" replace />} />
        <Route path="/leaderboard" element={session ? <Placeholder title="Leaderboard" /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={session ? <Settings /> : <Navigate to="/" replace />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
