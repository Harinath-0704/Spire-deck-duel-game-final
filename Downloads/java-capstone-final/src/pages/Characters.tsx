import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { ensureSession } from '../services/supabase/client';
import { getProfile } from '../services/supabase/profileService';
import { getOwnedCharacters, getEquippedCharacter, equipCharacter, purchaseCharacter } from '../services/supabase/characterService';
import { AudioService } from '../services/audio';
import { Character } from '../components/battle/Character';

export const Characters: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [ownedChars, setOwnedChars] = useState<string[]>([]);
  const [equippedChar, setEquippedChar] = useState<string>('arthur');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [buying, setBuying] = useState(false);

  const characterList = Object.values(CHARACTERS);
  const currentChar = characterList[currentIndex];

  useEffect(() => {
    const init = async () => {
      const id = await ensureSession();
      if (!id) {
        navigate('/');
        return;
      }
      setUserId(id);
      
      const p = await getProfile(id);
      if (p) setCoins(p.coins);
      
      const owned = await getOwnedCharacters(id);
      setOwnedChars(owned);
      
      const eq = await getEquippedCharacter(id);
      setEquippedChar(eq);

      // find index of equipped char to show it first
      const idx = characterList.findIndex(c => c.id === eq);
      if (idx !== -1) setCurrentIndex(idx);

      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleNext = () => {
    AudioService.playCardSelect();
    setCurrentIndex((prev) => (prev + 1) % characterList.length);
  };

  const handlePrev = () => {
    AudioService.playCardSelect();
    setCurrentIndex((prev) => (prev - 1 + characterList.length) % characterList.length);
  };

  const handleEquip = async () => {
    if (!userId || !currentChar) return;
    AudioService.playCardSelect();
    await equipCharacter(userId, currentChar.id);
    setEquippedChar(currentChar.id);
  };

  const handleBuy = async () => {
    if (!userId || !currentChar) return;
    AudioService.playCardSelect();
    setBuying(true);
    const res = await purchaseCharacter(userId, currentChar.id, currentChar.price);
    if (res.success) {
      setCoins(prev => prev - currentChar.price);
      setOwnedChars(prev => [...prev, currentChar.id]);
    } else {
      alert(res.message);
    }
    setBuying(false);
  };

  if (loading) {
    return <div className="h-[100dvh] flex items-center justify-center bg-transparent text-white">Loading...</div>;
  }

  const isOwned = currentChar.isStarter || ownedChars.includes(currentChar.id);
  const isEquipped = equippedChar === currentChar.id;

  return (
    <div className="h-[100dvh] bg-transparent text-white overflow-y-auto overflow-x-hidden flex flex-col relative font-sans">
      
      {/* BACKGROUND CHARACTER IMAGE (Blurred) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-sm scale-110"
        style={{ backgroundImage: `url(${currentChar.imageUrl})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white p-2">
          ← Back
        </button>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 bg-gray-800/80 rounded-full px-3 py-1 border border-yellow-500/30">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{coins}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-8">
        
        {/* CHARACTER DISPLAY */}
        <div className="flex-1 flex items-center justify-center w-full max-w-sm relative">
          <button onClick={handlePrev} className="absolute left-0 z-20 p-2 bg-black/50 rounded-full text-white/50 hover:text-white hover:bg-black/80 transition-all">
            <ChevronLeft size={32} />
          </button>

          <div className="relative w-full aspect-[3/4] max-h-[45vh] md:max-h-[60vh] rounded-xl overflow-hidden border border-gray-700/50 shadow-2xl bg-slate-900/50">
            <div className="absolute inset-0">
               <Character type="player" isHit={false} isAttacking={false} imageUrl={currentChar.imageUrl} characterId={currentChar.id} />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-4 inset-x-0 text-center">
              <h2 className="text-3xl font-bold tracking-widest text-white drop-shadow-lg">{currentChar.name.toUpperCase()}</h2>
              <p className="text-amber-400 text-sm tracking-wider uppercase font-semibold">{currentChar.title}</p>
            </div>
          </div>

          <button onClick={handleNext} className="absolute right-0 z-20 p-2 bg-black/50 rounded-full text-white/50 hover:text-white hover:bg-black/80 transition-all">
            <ChevronRight size={32} />
          </button>
        </div>

        {/* STATS & ACTIONS */}
        <div className="w-full max-w-sm bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold tracking-wider">HERO INFO</h3>
            <span className="bg-blue-900/50 text-blue-300 border border-blue-700 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {currentChar.role}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <StatBar label="Constitution" value={currentChar.stats.constitution} color="bg-emerald-500" />
            <StatBar label="Attack Damage" value={currentChar.stats.attack} color="bg-red-500" />
            <StatBar label="Ability Damage" value={currentChar.stats.ability} color="bg-purple-500" />
            <StatBar label="Difficulty" value={currentChar.stats.difficulty} color="bg-amber-500" />
          </div>

          <div className="flex flex-col gap-3">
            {isOwned ? (
              <button
                onClick={handleEquip}
                disabled={isEquipped}
                className={`w-full py-4 rounded-xl font-bold tracking-wider uppercase transition-all shadow-lg ${
                  isEquipped 
                    ? 'bg-blue-600/50 text-blue-200 border border-blue-500/50 opacity-50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 hover:scale-[1.02]'
                }`}
              >
                {isEquipped ? '✓ Equipped' : 'Equip Hero'}
              </button>
            ) : (
              <button
                onClick={handleBuy}
                disabled={buying || coins < currentChar.price}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-bold tracking-wider uppercase transition-all shadow-lg border border-amber-400 flex justify-center items-center gap-2 hover:scale-[1.02]"
              >
                {buying ? 'Processing...' : `Unlock for ${currentChar.price} 🪙`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-400 font-medium tracking-wide">{label}</span>
      <span className="text-gray-300 font-bold">{value}/100</span>
    </div>
    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);
