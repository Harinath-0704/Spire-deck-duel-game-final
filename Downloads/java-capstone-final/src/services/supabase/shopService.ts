import { getSupabaseClient } from './client';
import { spendCoins } from './profileService';

export const getOwnedSkins = async (playerId: string): Promise<string[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('player_skins')
    .select('skin_id')
    .eq('player_id', playerId);

  if (error) {
    console.error('Error fetching owned skins:', error);
    return [];
  }

  return data.map((row: any) => row.skin_id);
};

export const purchaseSkin = async (playerId: string, skinId: string, cost: number): Promise<{ success: boolean; message?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'No Supabase client' };

  // Check if already owned
  const ownedSkins = await getOwnedSkins(playerId);
  if (ownedSkins.includes(skinId)) {
    return { success: false, message: 'Skin already owned' };
  }

  // Spend coins
  const spendSuccess = await spendCoins(playerId, cost);
  if (!spendSuccess) {
    return { success: false, message: 'Insufficient coins' };
  }

  // Grant skin
  const { error } = await supabase
    .from('player_skins')
    .insert({
      player_id: playerId,
      skin_id: skinId
    });

  if (error) {
    console.error('Error unlocking skin:', error);
    // Note: In a production app, we would use a Postgres transaction to avoid losing coins if this fails
    return { success: false, message: 'Database error unlocking skin' };
  }

  return { success: true, message: 'Skin purchased!' };
};

export const getOwnedCards = async (playerId: string): Promise<string[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('player_cards')
    .select('card_id')
    .eq('player_id', playerId);

  if (error) {
    console.error('Error fetching owned cards:', error);
    return [];
  }

  return data.map((row: any) => row.card_id);
};

export const purchaseCard = async (playerId: string, cardId: string, cost: number): Promise<{ success: boolean; message?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'No Supabase client' };

  // Check if already owned
  const ownedCards = await getOwnedCards(playerId);
  if (ownedCards.includes(cardId)) {
    return { success: false, message: 'Card already owned' };
  }

  // Spend coins
  const spendSuccess = await spendCoins(playerId, cost);
  if (!spendSuccess) {
    return { success: false, message: 'Insufficient coins' };
  }

  // Grant card
  const { error } = await supabase
    .from('player_cards')
    .insert({
      player_id: playerId,
      card_id: cardId
    });

  if (error) {
    console.error('Error unlocking card:', error);
    return { success: false, message: 'Database error unlocking card' };
  }

  return { success: true, message: 'Card purchased!' };
};
