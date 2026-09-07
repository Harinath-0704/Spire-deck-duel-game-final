import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Check, ChevronLeft, Loader2, ArrowRight, Coins, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ensureSession } from '../services/supabase/client';
import { getProfile } from '../services/supabase/profileService';
import { joinRoom, getRoomPlayers, subscribeToRoom, leaveRoom } from '../services/supabase/roomService';
import type { Room, RoomPlayer } from '../services/supabase/roomService';
import { payMatchEntry, refundMatchEntry, subscribeToMatchEntries, getMatchEntriesByRoom, rejectChallenge, createMatch, getMatchByRoomId } from '../services/supabase/matchService';
import QRScanner from '../components/multiplayer/QRScanner';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const [balance, setBalance] = useState<number>(0);
  const [matchEntries, setMatchEntries] = useState<any[]>([]);
  const [entryFee, setEntryFee] = useState<number | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && urlCode.length === 6) {
      setCode(urlCode.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uid = await ensureSession();
      if (!uid) {
        setError('Failed to authenticate.');
        setLoading(false);
        return;
      }
      setUserId(uid);

      const result = await joinRoom(cleanCode, uid);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const profile = await getProfile(uid);
      if (profile) setBalance(profile.coins);

      setRoom(result.room);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!room?.id) return;
    let isMounted = true;
    
    const roomSub = subscribeToRoom(room.id, async (payload) => {
      if (!isMounted) return;
      if (payload?.new && payload.new.status === 'cancelled') {
        setError('Challenge cancelled by host.');
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

    getRoomPlayers(room.id).then(p => isMounted && setPlayers(p));
    getMatchEntriesByRoom(room.id).then(e => isMounted && setMatchEntries(e));

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

  useEffect(() => {
    if (!room || !userId) return;
    
    // Find host's fee
    const hostEntry = matchEntries.find(e => e.player_id === room.host_id && e.status === 'PAID');
    if (hostEntry) {
      setEntryFee(hostEntry.entry_fee);
    }

    // Did I pay?
    const mePaid = matchEntries.some(e => e.player_id === userId && e.status === 'PAID');
    setHasPaid(mePaid);

    if (players.length === 2 && hostEntry && mePaid && countdown === null) {
      setCountdown(3);
    }
  }, [players, matchEntries, userId, room, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && matchId) {
      navigate(`/battle?mode=online&room=${room?.id}&match=${matchId}`);
    }
  }, [countdown, navigate, room, matchId]);

  const handleAccept = async () => {
    if (!room || !userId || !entryFee) return;
    if (balance < entryFee) {
      setError('Insufficient coins to accept challenge.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    const res = await payMatchEntry(room.id, userId, entryFee);
    
    // Fetch latest entries to ensure we have the most up-to-date state (avoiding realtime lag)
    const latestEntries = await getMatchEntriesByRoom(room.id);
    setMatchEntries(latestEntries);
    
    if (!res.success && res.error !== 'Already paid') {
      setError(res.error || 'Failed to accept challenge.');
    } else {
      // Create match EXACTLY once here using the RPC. (Joiner is calling it, so they create it)
      const hostId = room.host_id;
      if (hostId) {
        if (res.success) setBalance(b => b - entryFee);
        console.log('[ENTRY] Joiner creating match via RPC...');
        const match = await createMatch(room.id, hostId, userId);
        if (match) {
          setMatchId(match.id);
          console.log('[ENTRY] Match created successfully:', match.id);
        }
      }
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!room || !userId) return;
    setIsProcessing(true);
    setError(null);

    const res = await rejectChallenge(room.id, userId);
    if (!res.success) {
      setError(res.error || 'Failed to reject.');
      setIsProcessing(false);
      return;
    }
    
    // Successfully rejected, clean up and go home
    setIsProcessing(false);
    navigate('/');
  };

  const handleLeave = async () => {
    if (room && userId) {
      if (hasPaid) {
        await refundMatchEntry(room.id, userId);
      }
      await leaveRoom(room.id, userId, false);
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-200 overflow-hidden relative">
      
      
      <header className="relative z-10 p-4 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <button onClick={room ? handleLeave : () => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white hover:scale-105 active:scale-90 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="font-serif font-bold text-lg tracking-widest text-emerald-100 uppercase">Join Room</div>
        {userId && (
          <div className="flex items-center gap-2 font-mono font-bold text-yellow-400">
            <Coins className="w-4 h-4" />
            <span>{balance}</span>
          </div>
        )}
        {!userId && <div className="w-10"></div>}
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center p-4 md:p-6 mt-4 w-full">
        
        {error && (
          <div className="w-full max-w-sm p-4 mb-6 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {!room ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h2 className="text-2xl font-serif text-white mb-2">Enter Room Code</h2>
            <p className="text-slate-400 text-sm text-center mb-8">Ask the host for their 6-character room code to join the lobby.</p>

            <form onSubmit={handleJoin} className="w-full space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full bg-slate-900/50 border border-slate-700 focus:border-emerald-500/50 rounded-xl p-4 text-center text-3xl font-mono font-bold tracking-[0.2em] text-white outline-none transition-colors placeholder:text-slate-700 uppercase"
                />
              </div>

              <div className="flex justify-center mb-2">
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-orange-400 rounded-full transition-all active:scale-90 border border-orange-500/30 hover:border-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.1)] text-sm font-medium"
                >
                  <Users className="w-4 h-4" />
                  Scan QR Code
                </button>
              </div>

              <button 
                type="submit"
                disabled={code.length !== 6 || loading}
                className="w-full py-4 bg-gradient-to-br from-red-900 to-orange-900 hover:from-red-800 hover:to-orange-800 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 text-white font-bold rounded-xl transition-all active:scale-90 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)] border border-orange-500/50 disabled:border-slate-700 disabled:shadow-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Join Room</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {countdown !== null ? (
              <div className="flex flex-col items-center text-center mt-12">
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
              </div>
            ) : hasPaid ? (
              <div className="flex flex-col items-center text-center mt-12">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Challenge Accepted</h2>
                <p className="text-slate-400 text-sm">Waiting for match to start...</p>
              </div>
            ) : entryFee !== null ? (
              <div className="glass-panel w-full p-6 rounded-2xl border border-emerald-500/30">
                <h2 className="text-xl font-serif text-emerald-100 mb-6 text-center tracking-widest uppercase">Incoming Challenge</h2>
                
                <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl mb-4">
                  <span className="text-slate-400">Entry Fee:</span>
                  <div className="flex items-center gap-2 text-xl font-bold font-mono text-yellow-400">
                    <Coins className="w-5 h-5" />
                    <span>{entryFee}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl mb-8">
                  <span className="text-slate-400">Prize Pool:</span>
                  <div className="flex items-center gap-2 text-2xl font-bold font-mono text-emerald-400">
                    <Coins className="w-5 h-5" />
                    <span>{entryFee * 2}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleAccept}
                    disabled={isProcessing || balance < entryFee}
                    className="w-full py-4 bg-gradient-to-br from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 text-white font-bold rounded-xl uppercase tracking-widest transition-all active:scale-90 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-500/50 disabled:border-slate-700 disabled:shadow-none"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Accept Challenge</>}
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="w-full py-3 bg-slate-900/80 hover:bg-slate-800 text-red-400 font-bold rounded-xl uppercase tracking-widest transition-all active:scale-90 flex justify-center items-center gap-2 border border-red-500/30 hover:border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.1)]"
                  >
                    <X className="w-5 h-5" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center mt-12">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                <p className="text-slate-400">Loading challenge details...</p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {showScanner && (
        <QRScanner 
          onScanSuccess={(scannedCode) => {
            setCode(scannedCode);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
