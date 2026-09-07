import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coins, Loader2, Lock, Store } from 'lucide-react';
import { AudioService } from '../services/audio';
import { ensureSession } from '../services/supabase/client';
import { getProfile } from '../services/supabase/profileService';
import type { PlayerProfile } from '../services/supabase/profileService';
import { getOwnedSkins, purchaseSkin, getOwnedCards, purchaseCard } from '../services/supabase/shopService';
import { CardView } from '../components/cards/CardView';
import { CARD_DATABASE } from '../data/cards';

const SHOP_ITEMS = [
  { id: 'skin_arcane', name: 'Arcane', rarity: 'RARE', cost: 300, color: 'text-blue-400', bg: 'from-blue-900/40' },
  { id: 'skin_frost', name: 'Frost', rarity: 'RARE', cost: 300, color: 'text-cyan-400', bg: 'from-cyan-900/40' },
  { id: 'skin_inferno', name: 'Inferno', rarity: 'EPIC', cost: 700, color: 'text-red-500', bg: 'from-red-900/40' },
  { id: 'skin_void', name: 'Void', rarity: 'EPIC', cost: 700, color: 'text-purple-500', bg: 'from-purple-900/40' },
  { id: 'skin_celestial', name: 'Celestial', rarity: 'LEGENDARY', cost: 1200, color: 'text-yellow-400', bg: 'from-yellow-900/40' },
];

const PREVIEW_CARD = CARD_DATABASE['arc-slash'] || Object.values(CARD_DATABASE)[0];
const PURCHASABLE_CARDS = Object.values(CARD_DATABASE).filter(c => !c.isStarter && c.price);

export default function Shop() {
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ownedSkins, setOwnedSkins] = useState<string[]>([]);
  const [ownedCards, setOwnedCards] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [tab, setTab] = useState<'cards' | 'skins'>('cards');

  useEffect(() => {
    const init = async () => {
      const id = await ensureSession();
      setPlayerId(id);
      
      if (id) {
        const p = await getProfile(id);
        setProfile(p);
        const [skins, cards] = await Promise.all([
          getOwnedSkins(id),
          getOwnedCards(id)
        ]);
        setOwnedSkins(skins);
        setOwnedCards(cards);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handlePurchaseSkin = async (item: typeof SHOP_ITEMS[0]) => {
    if (!playerId || !profile || buyingId) return;

    if (profile.coins < item.cost) {
      setMessage({ text: 'Insufficient coins!', success: false });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setBuyingId(item.id);
    setMessage(null);
    
    const result = await purchaseSkin(playerId, item.id, item.cost);
    
    if (result.success) {
      setProfile((prev: PlayerProfile | null) => prev ? { ...prev, coins: prev.coins - item.cost } : null);
      setOwnedSkins((prev: string[]) => [...prev, item.id]);
      setMessage({ text: `${item.name} Skin Unlocked!`, success: true });
    } else {
      setMessage({ text: result.message || 'Purchase failed', success: false });
    }
    
    setBuyingId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePurchaseCard = async (card: typeof PURCHASABLE_CARDS[0]) => {
    if (!playerId || !profile || buyingId || !card.price) return;

    if (profile.coins < card.price) {
      setMessage({ text: 'Insufficient coins!', success: false });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setBuyingId(card.id);
    setMessage(null);
    
    const result = await purchaseCard(playerId, card.id, card.price);
    
    if (result.success) {
      setProfile((prev: PlayerProfile | null) => prev ? { ...prev, coins: prev.coins - card.price! } : null);
      setOwnedCards((prev: string[]) => [...prev, card.id]);
      setMessage({ text: `${card.name} Card Unlocked!`, success: true });
    } else {
      setMessage({ text: result.message || 'Purchase failed', success: false });
    }
    
    setBuyingId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="relative h-[100dvh] flex flex-col items-center p-6 bg-transparent text-slate-200 overflow-x-hidden overflow-y-auto font-sans pb-20 w-full">
      

      <div className="absolute top-4 left-4 z-50">
        <Link to="/" onClick={() => AudioService.playCardSelect()} className="p-2 glass-panel rounded-full text-slate-300 hover:text-white transition-colors block">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
      
      {profile && (
        <div className="absolute top-4 right-4 z-50 glass-panel px-4 py-2 flex items-center gap-2 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-yellow-400">{profile.coins}</span>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mt-16">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <Store className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold tracking-widest premium-text uppercase text-yellow-500">Shop</h1>
          <p className="text-slate-400 mt-2">Unlock powerful cards and exclusive cosmetic skins</p>
        </motion.div>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setTab('cards')}
            className={`px-6 py-2 rounded-full font-bold tracking-widest uppercase transition-all ${tab === 'cards' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Cards
          </button>
          <button 
            onClick={() => setTab('skins')}
            className={`px-6 py-2 rounded-full font-bold tracking-widest uppercase transition-all ${tab === 'skins' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Skins
          </button>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`fixed top-20 z-50 px-6 py-3 rounded-full border backdrop-blur-md font-bold shadow-lg ${
                message.success 
                  ? 'bg-green-900/80 border-green-500 text-green-300' 
                  : 'bg-red-900/80 border-red-500 text-red-300'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center items-center p-20 min-h-[300px]">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-yellow-500/30 animate-[spin_3s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {tab === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {PURCHASABLE_CARDS.map((card, i) => {
                  const isOwned = ownedCards.includes(card.id);
                  const canAfford = profile ? profile.coins >= (card.price || 0) : false;
                  const isBuying = buyingId === card.id;
                  
                  return (
                    <motion.div 
                      key={card.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`glass-panel p-4 rounded-xl border relative flex flex-col justify-between ${
                        isOwned ? 'border-green-500/30 bg-slate-900/50' : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="relative z-10 flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                           <span className="font-bold text-lg text-amber-200">{card.name}</span>
                           <span className="text-xs text-slate-400 uppercase font-semibold">{card.type}</span>
                        </div>
                        {isOwned && (
                          <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-bold border border-green-500/30">
                            OWNED
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 flex justify-center mb-4">
                        <div className="scale-90 origin-top">
                          <CardView card={card} isDisplayOnly={true} />
                        </div>
                      </div>

                      <div className="relative z-10 w-full mt-auto">
                        {isOwned ? (
                          <button disabled className="w-full py-2 bg-slate-800 text-slate-500 rounded border border-slate-700 cursor-not-allowed font-bold">
                            OWNED
                          </button>
                        ) : (
                          <button 
                            onClick={() => handlePurchaseCard(card)}
                            disabled={isBuying}
                            className={`w-full py-2 rounded font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                              canAfford && !isBuying
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                                : 'bg-slate-800 text-slate-400 cursor-pointer hover:bg-slate-700'
                            }`}
                          >
                            {isBuying ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                {canAfford ? 'BUY' : <Lock className="w-3 h-3 text-red-400 mr-1" />}
                                <Coins className={`w-4 h-4 ${canAfford ? 'text-yellow-400' : 'text-slate-500'}`} />
                                <span className={canAfford ? 'text-yellow-400' : ''}>{card.price}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {tab === 'skins' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {SHOP_ITEMS.map((item, i) => {
                  const isOwned = ownedSkins.includes(item.id);
                  const canAfford = profile ? profile.coins >= item.cost : false;
                  const isBuying = buyingId === item.id;
                  
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`glass-panel p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between ${
                        isOwned ? 'border-green-500/30 bg-slate-900/50' : `border-slate-700 hover:border-slate-500`
                      }`}
                    >
                      <div className={`absolute inset-0 z-0 bg-gradient-to-br ${item.bg} to-transparent opacity-20`}></div>
                      
                      <div className="relative z-10 flex justify-between items-start mb-6">
                        <div>
                          <h3 className={`text-xl font-bold uppercase tracking-wider ${item.color}`}>{item.name}</h3>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">{item.rarity} SKIN</div>
                        </div>
                        {isOwned && (
                          <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-bold border border-green-500/30">
                            OWNED
                          </div>
                        )}
                      </div>
                      
                      {/* Skin Visual Preview */}
                      <div className="relative z-10 flex justify-center mb-6">
                        <CardView 
                          card={PREVIEW_CARD} 
                          isDisplayOnly={true} 
                          skinId={item.id} 
                        />
                      </div>

                      <div className="relative z-10 w-full mt-auto">
                        {isOwned ? (
                          <button disabled className="w-full py-2 bg-slate-800 text-slate-500 rounded border border-slate-700 cursor-not-allowed font-bold">
                            ALREADY OWNED
                          </button>
                        ) : (
                          <button 
                            onClick={() => handlePurchaseSkin(item)}
                            disabled={isBuying}
                            className={`w-full py-3 rounded font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                              canAfford && !isBuying
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                : 'bg-slate-800 text-slate-400 cursor-pointer hover:bg-slate-700'
                            }`}
                          >
                            {isBuying ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                {canAfford ? 'PURCHASE FOR' : <Lock className="w-4 h-4 text-red-400 mr-1" />}
                                <Coins className={`w-4 h-4 ${canAfford ? 'text-yellow-400' : 'text-slate-500'}`} />
                                <span className={canAfford ? 'text-yellow-400' : ''}>{item.cost}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
