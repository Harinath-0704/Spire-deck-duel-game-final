import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Check, ChevronLeft, ChevronRight, Loader2, Coins, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ensureSession } from '../services/supabase/client';
import { getProfile } from '../services/supabase/profileService';
import { createRoom, getRoomPlayers, subscribeToRoom, leaveRoom } from '../services/supabase/roomService';
import type { Room, RoomPlayer } from '../services/supabase/roomService';
import { payMatchEntry, refundMatchEntry, subscribeToMatchEntries, getMatchEntriesByRoom, getMatchByRoomId } from '../services/supabase/matchService';
import RoomQRCode from '../components/multiplayer/RoomQRCode';

const ALLOWED_FEES = [10, 25, 50, 100, 200, 500, 1000, 2000];

export default function CreateRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [selectedFee, setSelectedFee] = useState<number>(50);
  const [isCreating, setIsCreating] = useState(false);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [matchEntries, setMatchEntries] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Init phase
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const uid = await ensureSession();
        if (!isMounted) return;
        if (!uid) {
          setError('Failed to authenticate.');
          setLoading(false);
          return;
        }
        setUserId(uid);

        const profile = await getProfile(uid);
        if (isMounted && profile) {
          setBalance(profile.coins);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('An unexpected error occurred.');
          setLoading(false);
        }
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  // Room Subscription (Lobby phase)
  useEffect(() => {
    if (!room?.id) return;
    
    let isMounted = true;
    const roomSub = subscribeToRoom(room.id, async (payload) => {
      if (!isMounted) return;
      if (payload?.new && payload.new.status === 'cancelled') {
        setError('Room cancelled. Opponent may have rejected the challenge.');
        setRoom(null);
        return;
      }
      if (payload?.new && payload.new.status === 'playing') {
        const matches = await getMatchEntriesByRoom(room.id);
        const m = matches.find(e => e.match_id != null);
        if (m) setMatchId(m.match_id);
      }
      const updatedPlayers = await getRoomPlayers(room.id);
      if (isMounted) setPlayers(updatedPlayers);
    });

    const entriesSub = subscribeToMatchEntries(room.id, async () => {
      if (!isMounted) return;
      const entries = await getMatchEntriesByRoom(room.id);
      if (isMounted) setMatchEntries(entries);
    });

    // initial fetch
    getRoomPlayers(room.id).then(p => isMounted && setPlayers(p));
    getMatchEntriesByRoom(room.id).then(e => isMounted && setMatchEntries(e));

    // Fallback polling every 2s in case Realtime is disconnected or not enabled
    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      const mRoom = await getMatchByRoomId(room.id);
      if (mRoom && mRoom.id) {
        setMatchId(mRoom.id);
      }
      const updatedPlayers = await getRoomPlayers(room.id);
      if (isMounted) setPlayers(updatedPlayers);
      const entries = await getMatchEntriesByRoom(room.id);
      if (isMounted) setMatchEntries(entries);
    }, 2000);

    return () => {
      isMounted = false;
      if (roomSub) roomSub.unsubscribe();
      if (entriesSub) entriesSub.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [room?.id]);

  // Match check
  useEffect(() => {
    if (players.length === 2 && room) {
      const oppEntry = matchEntries.find(e => e.player_id !== userId && e.status === 'PAID');
      if (oppEntry && countdown === null) {
        setCountdown(3);
      }
    }
  }, [players, matchEntries, userId, countdown, room]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && matchId) {
      if (players.length === 2) {
        navigate(`/battle?mode=online&room=${room?.id}&match=${matchId}`);
      }
    }
  }, [countdown, navigate, room, players.length, matchId]);

  const handleCreateChallenge = async () => {
    if (!userId) return;
    if (balance < selectedFee) {
      setError('Insufficient coins.');
      return;
    }

    setIsCreating(true);
    setError(null);

    // 1. Create Room
    const newRoom = await createRoom(userId);
    if (!newRoom) {
      setError('Failed to create room.');
      setIsCreating(false);
      return;
    }

    // 2. Pay Match Entry
    const res = await payMatchEntry(newRoom.id, userId, selectedFee);
    if (!res.success) {
      setError(res.error || 'Failed to process fee.');
      await leaveRoom(newRoom.id, userId, true);
      setIsCreating(false);
      return;
    }

    setBalance(b => b - selectedFee);
    setRoom(newRoom);
    setIsCreating(false);
  };

  const handleLeave = async () => {
    if (room && userId) {
      // Refund our entry before leaving
      await refundMatchEntry(room.id, userId);
      await leaveRoom(room.id, userId, true);
    }
    navigate('/');
  };

  const handleCopy = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!room?.room_code) return;
    const joinUrl = `${window.location.origin}/join-room?code=${room.room_code}`;
    const shareData = {
      title: 'SPIRE DECK DUEL',
      text: 'Join my SPIRE DECK DUEL battle!',
      url: joinUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        navigator.clipboard.writeText(joinUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(joinUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-blue-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-200 overflow-hidden relative">
      
      
      <header className="relative z-10 p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <button onClick={handleLeave} className="p-2 -ml-2 text-slate-400 hover:text-white hover:scale-105 active:scale-90 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="font-serif font-bold text-lg tracking-widest text-blue-100 uppercase">Create Challenge</div>
        <div className="flex items-center gap-2 font-mono font-bold text-yellow-400">
          <Coins className="w-4 h-4" />
          <span>{balance}</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center p-4 md:p-6 mt-4 w-full">
        {error && !room && (
          <div className="w-full max-w-sm p-4 mb-6 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Phase 1: Create Challenge Setup */}
        {!room && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            <div className="glass-panel w-full p-4 md:p-6 rounded-2xl border border-blue-500/30 mb-8">
              <h2 className="text-xl font-serif text-blue-100 mb-6 text-center tracking-widest uppercase">Select Entry Fee</h2>
              
              <div className="flex items-center justify-between w-full mb-8 relative px-2">
                <button 
                  onClick={() => {
                    const idx = ALLOWED_FEES.indexOf(selectedFee);
                    setSelectedFee(ALLOWED_FEES[(idx - 1 + ALLOWED_FEES.length) % ALLOWED_FEES.length]);
                  }} 
                  className="z-20 p-2 bg-slate-900/80 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <ChevronLeft size={32} />
                </button>

                <div className="flex-1 flex justify-center">
                  <div className="p-6 rounded-2xl border border-orange-500 bg-orange-500/20 text-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.3)] flex flex-col items-center gap-3 w-40 min-[400px]:w-48 transform transition-transform duration-300">
                    <Coins className="w-10 h-10 text-orange-400 drop-shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
                    <span className="font-mono font-bold text-4xl">{selectedFee}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const idx = ALLOWED_FEES.indexOf(selectedFee);
                    setSelectedFee(ALLOWED_FEES[(idx + 1) % ALLOWED_FEES.length]);
                  }} 
                  className="z-20 p-2 bg-slate-900/80 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <ChevronRight size={32} />
                </button>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl mb-6">
                <span className="text-slate-400">Prize Pool:</span>
                <div className="flex items-center gap-2 text-2xl font-bold font-mono text-emerald-400">
                  <Coins className="w-5 h-5" />
                  <span>{selectedFee * 2}</span>
                </div>
              </div>

              <button 
                onClick={handleCreateChallenge}
                disabled={isCreating || balance < selectedFee}
                className="w-full py-4 bg-gradient-to-br from-red-900 to-orange-900 hover:from-red-800 hover:to-orange-800 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 text-white font-bold rounded-xl tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)] active:scale-90 flex justify-center items-center gap-2 border border-orange-500/50 disabled:border-slate-700 disabled:shadow-none"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Challenge'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 2: Lobby */}
        {room && (
          <>
            {error && (
               <div className="w-full max-w-sm p-4 mb-6 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
                 {error}
               </div>
            )}
            
            {countdown !== null ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center mt-12"
              >
                <h2 className="text-4xl font-serif font-bold text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] mb-4">MATCH FOUND</h2>
                <p className="text-slate-300 text-lg mb-8 tracking-widest uppercase">Both Ready</p>
                <motion.div 
                  key={countdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-7xl font-bold font-serif text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                >
                  {countdown > 0 ? countdown : 'VS'}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-sm flex flex-col items-center"
              >
                <div className="text-slate-400 mb-2 uppercase tracking-widest text-sm font-semibold">Room Code</div>
                
                <div className="glass-panel w-full p-6 flex flex-col items-center rounded-2xl border border-blue-500/30 relative overflow-hidden group mb-8">
                  <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                  
                  <div className="text-5xl font-mono font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] mb-6">
                    {room?.room_code}
                  </div>
                  
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900/80 hover:bg-slate-800 text-orange-400 rounded-full transition-all border border-orange-500/30 font-medium active:scale-90 hover:border-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.1)] hover:shadow-[0_0_15px_rgba(234,88,12,0.2)]"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                    ) : (
                      <><Copy className="w-4 h-4" /><span>Copy Code</span></>
                    )}
                  </button>
                </div>

                <div className="mb-8 w-full">
                  <RoomQRCode roomCode={room.room_code} />
                  <button 
                    onClick={handleShare}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900/80 hover:bg-slate-800 text-amber-400 rounded-xl transition-all border border-amber-500/30 font-medium active:scale-90 shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    {shareCopied ? (
                      <><Check className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400">Join link copied!</span></>
                    ) : (
                      <><Share2 className="w-5 h-5" /><span>Share Room</span></>
                    )}
                  </button>
                </div>

                <div className="w-full space-y-3">
                  <div className="text-slate-500 text-xs tracking-widest font-semibold uppercase mb-4 ml-1">Players (1/2)</div>
                  
                  <div className="flex items-center justify-between p-4 glass-panel rounded-xl border border-blue-500/20 bg-blue-900/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-400/30">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="font-semibold text-blue-100">You (Host)</span>
                    </div>
                    <Check className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  </div>

                  <div className="flex items-center justify-between p-4 glass-panel rounded-xl border border-dashed border-slate-700/50 bg-slate-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                        <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                      </div>
                      <span className="font-medium text-slate-400 animate-pulse">Waiting for opponent...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
