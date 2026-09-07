import { supabase } from './client';

export const getDeck = async (playerId: string): Promise<string[]> => {
  const { data, error } = await supabase!
    .from('player_decks')
    .select('card_ids')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching deck:', error);
    return [];
  }

  if (!data) return [];
  
  return data.card_ids;
};

export const saveDeck = async (playerId: string, cardIds: string[]): Promise<boolean> => {
  const { error } = await supabase!
    .from('player_decks')
    .upsert({
      player_id: playerId,
      card_ids: cardIds,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'player_id'
    });

  if (error) {
    console.error('Error saving deck:', error);
    return false;
  }
  return true;
};
