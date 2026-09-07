import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { getOwnedSkins } from '../services/supabase/shopService';
import { ensureSession } from '../services/supabase/client';
import { CARD_DATABASE } from '../data/cards';
import type { Card } from '../game/types/card';
import { CardView } from '../components/cards/CardView';

// Available skins mapping
const AVAILABLE_SKINS = [
  { id: 'default', name: 'Default', bg: 'bg-slate-800' },
  { id: 'skin_arcane', name: 'Arcane', bg: 'bg-blue-900' },
  { id: 'skin_frost', name: 'Frost', bg: 'bg-cyan-900' },
  { id: 'skin_inferno', name: 'Inferno', bg: 'bg-red-900' },
  { id: 'skin_void', name: 'Void', bg: 'bg-purple-900' },
  { id: 'skin_celestial', name: 'Celestial', bg: 'bg-yellow-900' },
];

export default function Collection() {
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['default']);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  // Storing equipped skins in localStorage: { [cardId]: skinId }
  const [equippedSkins, setEquippedSkins] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      const id = await ensureSession();
      if (id) {
        const skins = await getOwnedSkins(id);
        setOwnedSkins(['default', ...skins]);
      }
      
      const stored = localStorage.getItem('equipped_skins');
      if (stored) {
        try {
          setEquippedSkins(JSON.parse(stored));
        } catch (e) {}
      }
    };
    init();
  }, []);

  const handleEquipSkin = (cardId: string, skinId: string) => {
    const next = { ...equippedSkins, [cardId]: skinId };
    setEquippedSkins(next);
    localStorage.setItem('equipped_skins', JSON.stringify(next));
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col p-6 bg-transparent text-slate-200 overflow-x-hidden font-sans">
      

      <div className="relative z-50 flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 glass-panel rounded-full text-slate-300 hover:text-white transition-colors block">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-purple-400 flex items-center gap-3">
          <Trophy className="w-6 h-6" /> Card Collection
        </h1>
      </div>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pb-20 justify-items-center">
        {Object.values(CARD_DATABASE).map((card: Card) => {
          const activeSkinId = equippedSkins[card.id] || 'default';
          
          return (
            <motion.div 
              key={card.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CardView 
                 card={card} 
                 isDisplayOnly={true} 
                 skinId={activeSkinId} 
                 onClick={() => setSelectedCard(card)} 
              />
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-panel rounded-2xl border border-purple-500/30 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">{selectedCard.name}</h2>
                <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="p-6 flex flex-col items-center overflow-y-auto">
                <div className="mb-6">
                  <CardView 
                     card={selectedCard} 
                     isDisplayOnly={true} 
                     skinId={equippedSkins[selectedCard.id] || 'default'} 
                     size="large"
                  />
                </div>

                <div className="w-full">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Equipped Skin</h3>
                  <div className="flex flex-col gap-2">
                    {AVAILABLE_SKINS.map(skin => {
                      const isOwned = ownedSkins.includes(skin.id);
                      const isEquipped = (equippedSkins[selectedCard.id] || 'default') === skin.id;
                      
                      if (!isOwned && skin.id !== 'default') return null;
                      
                      return (
                        <button
                          key={skin.id}
                          onClick={() => handleEquipSkin(selectedCard.id, skin.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isEquipped 
                              ? 'bg-purple-900/40 border-purple-500/50' 
                              : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded ${skin.bg} border border-slate-600`}></div>
                            <span className={`font-bold ${isEquipped ? 'text-purple-300' : 'text-slate-300'}`}>{skin.name}</span>
                          </div>
                          {isEquipped && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                  {ownedSkins.length === 1 && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg text-center">
                      <p className="text-sm text-slate-400 mb-2">You don't own any premium skins yet.</p>
                      <Link to="/shop" className="text-blue-400 text-sm font-bold hover:text-blue-300 flex items-center justify-center gap-1">
                        Visit Shop <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
