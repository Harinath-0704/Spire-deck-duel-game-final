import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeck, saveDeck } from '../services/supabase/deckService';
import { getOwnedCards, purchaseCard } from '../services/supabase/shopService';
import { getProfile } from '../services/supabase/profileService';
import { CARD_DATABASE } from '../data/cards';
import { ensureSession } from '../services/supabase/client';
import { CardView } from '../components/cards/CardView';

export const DeckBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [deck, setDeck] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [equippedSkins, setEquippedSkins] = useState<Record<string, string>>({});
  const [ownedCards, setOwnedCards] = useState<string[]>([]);
  const [coins, setCoins] = useState<number>(0);

  // For Step 2, we display the fixed 10 cards in the collection
  const availableCards = Object.values(CARD_DATABASE);

  useEffect(() => {
    const fetchDeck = async () => {
      setLoading(true);
      const id = await ensureSession();
      setUserId(id);
      
      if (!id) {
        setLoading(false);
        return;
      }
      
      const savedDeck = await getDeck(id);
      if (savedDeck.length > 0) {
        setDeck(savedDeck);
      } else {
        // Default deck
        setDeck(Object.keys(CARD_DATABASE));
      }
      
      const storedSkins = localStorage.getItem('equipped_skins');
      if (storedSkins) {
        try {
          setEquippedSkins(JSON.parse(storedSkins));
        } catch (e) {}
      }
      
      const profile = await getProfile(id);
      if (profile) setCoins(profile.coins);
      
      const cards = await getOwnedCards(id);
      setOwnedCards(cards);

      setLoading(false);
    };
    fetchDeck();
  }, []);

  const deckCounts = {
    ATTACK: deck.filter(id => CARD_DATABASE[id]?.type === 'ATTACK').length,
    DEFENSE: deck.filter(id => CARD_DATABASE[id]?.type === 'DEFENSE').length,
    SPECIAL: deck.filter(id => CARD_DATABASE[id]?.type === 'SPECIAL').length,
    TOTAL: deck.length
  };

  const limits = {
    ATTACK: 4,
    DEFENSE: 3,
    SPECIAL: 3,
    TOTAL: 10
  };

  const handleAdd = (cardId: string) => {
    setError(null);
    setSuccess(null);
    const card = CARD_DATABASE[cardId];
    if (!card) return;

    if (deckCounts[card.type] >= limits[card.type]) {
      setError(`Maximum ${limits[card.type]} ${card.type} cards allowed.`);
      return;
    }
    if (deck.length >= limits.TOTAL) {
      setError(`Maximum ${limits.TOTAL} cards allowed.`);
      return;
    }

    setDeck(prev => [...prev, cardId]);
  };

  const handleRemove = (cardId: string) => {
    setError(null);
    setSuccess(null);
    setDeck(prev => {
      const idx = prev.indexOf(cardId);
      if (idx === -1) return prev;
      const newDeck = [...prev];
      newDeck.splice(idx, 1);
      return newDeck;
    });
  };

  const handleSave = async () => {
    if (!userId) return;
    setError(null);
    setSuccess(null);
    
    if (deckCounts.ATTACK !== limits.ATTACK) {
      setError(`You need exactly ${limits.ATTACK} ATTACK cards.`);
      return;
    }
    if (deckCounts.DEFENSE !== limits.DEFENSE) {
      setError(`You need exactly ${limits.DEFENSE} DEFENSE cards.`);
      return;
    }
    if (deckCounts.SPECIAL !== limits.SPECIAL) {
      setError(`You need exactly ${limits.SPECIAL} SPECIAL cards.`);
      return;
    }
    if (deck.length !== limits.TOTAL) {
      setError(`Deck must be exactly ${limits.TOTAL} cards.`);
      return;
    }

    setSaving(true);
    const ok = await saveDeck(userId, deck);
    setSaving(false);
    
    if (ok) {
      setSuccess("Deck saved successfully!");
    } else {
      setError("Failed to save deck.");
    }
  };

  const handleBuy = async (cardId: string, price: number) => {
    if (!userId) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    const result = await purchaseCard(userId, cardId, price);
    if (result.success) {
      setSuccess(result.message || 'Card purchased!');
      setOwnedCards(prev => [...prev, cardId]);
      setCoins(prev => prev - price);
    } else {
      setError(result.message || 'Failed to purchase card.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-white">Loading deck...</div>;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-white">
      {/* Header */}
      <div className="sticky top-0 p-4 bg-gray-800 shadow-md flex items-center justify-between z-50 shrink-0">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white p-2">
          ← Back
        </button>
        <h1 className="text-xl font-bold tracking-wider text-amber-500 flex flex-col items-center">
          DECK BUILDER
          <span className="text-xs text-yellow-400 mt-1 flex items-center gap-1"><span className="text-[10px]">🪙</span> {coins}</span>
        </h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded font-bold uppercase tracking-wider text-sm transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Deck'}
        </button>
      </div>

      <div className="flex-1 pb-20">
        <div className="p-4 space-y-6 max-w-lg mx-auto">

          {/* Status Messages */}
          {error && <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm text-center font-medium animate-pulse">{error}</div>}
          {success && <div className="p-3 bg-green-900/50 border border-green-500 text-green-200 rounded text-sm text-center font-medium">{success}</div>}

          {/* Deck Stats */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <h2 className="text-lg font-bold text-gray-200">MY DECK</h2>
              <span className={`font-bold ${deck.length === 10 ? 'text-green-400' : 'text-amber-400'}`}>
                {deck.length} / 10
              </span>
            </div>
            
            <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-red-900/30 rounded p-2 border border-red-900/50">
                <div className="text-red-400 mb-1">⚔️ ATTACK</div>
                <div className={`font-bold ${deckCounts.ATTACK === 4 ? 'text-green-400' : 'text-gray-400'}`}>{deckCounts.ATTACK} / 4</div>
              </div>
              <div className="bg-blue-900/30 rounded p-2 border border-blue-900/50">
                <div className="text-blue-400 mb-1">🛡️ DEFENSE</div>
                <div className={`font-bold ${deckCounts.DEFENSE === 3 ? 'text-green-400' : 'text-gray-400'}`}>{deckCounts.DEFENSE} / 3</div>
              </div>
              <div className="bg-purple-900/30 rounded p-2 border border-purple-900/50">
                <div className="text-purple-400 mb-1">✨ SPECIAL</div>
                <div className={`font-bold ${deckCounts.SPECIAL === 3 ? 'text-green-400' : 'text-gray-400'}`}>{deckCounts.SPECIAL} / 3</div>
              </div>
            </div>
          </div>

          {/* Collection */}
          <div>
            <h2 className="text-lg font-bold text-gray-200 mb-4 px-2">MY COLLECTION</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
              {availableCards.map(card => {
                const inDeckCount = deck.filter(id => id === card.id).length;
                const isMaxedOut = deckCounts[card.type] >= limits[card.type] || deck.length >= limits.TOTAL;
                const activeSkinId = equippedSkins[card.id] || 'default';
                const isOwned = card.isStarter || ownedCards.includes(card.id);
                
                return (
                  <div key={card.id} className="flex flex-col items-center gap-2 w-full max-w-[140px]">
                    <div className={`transform scale-90 sm:scale-100 transform-origin-top transition-all ${!isOwned ? 'opacity-50 grayscale' : ''}`}>
                      <CardView 
                        card={card}
                        isDisplayOnly={true}
                        skinId={activeSkinId}
                      />
                    </div>
                    
                    {!isOwned ? (
                      <button 
                        onClick={() => handleBuy(card.id, card.price || 999)}
                        disabled={saving || coins < (card.price || 999)}
                        className="w-full py-1.5 px-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:hover:bg-yellow-600 text-white rounded text-xs font-bold transition flex justify-center items-center gap-1"
                      >
                        BUY ({card.price || 999} 🪙)
                      </button>
                    ) : inDeckCount > 0 ? (
                      <button 
                        onClick={() => handleRemove(card.id)}
                        className="w-full py-1.5 px-2 bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-300 hover:border-red-800 rounded text-xs font-bold transition border border-transparent"
                      >
                        ✓ IN DECK
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAdd(card.id)}
                        disabled={isMaxedOut}
                        className="w-full py-1.5 px-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-gray-700 text-white rounded text-xs font-bold transition"
                      >
                        ADD TO DECK
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
