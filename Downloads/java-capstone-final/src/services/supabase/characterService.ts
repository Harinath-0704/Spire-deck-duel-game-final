import { supabase } from './client';

export async function getOwnedCharacters(playerId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('player_characters')
    .select('character_id')
    .eq('player_id', playerId);

  if (error || !data) {
    console.error('Error fetching owned characters:', error);
    return [];
  }

  return data.map(r => r.character_id);
}

export async function getEquippedCharacter(playerId: string): Promise<string> {
  if (!supabase) return 'arthur';
  const { data, error } = await supabase
    .from('profiles')
    .select('equipped_character_id')
    .eq('id', playerId)
    .single();

  if (error || !data) {
    console.error('Error fetching equipped character:', error);
    return 'arthur';
  }

  return data.equipped_character_id || 'arthur';
}

export async function equipCharacter(playerId: string, characterId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('profiles')
    .update({ equipped_character_id: characterId })
    .eq('id', playerId);

  if (error) {
    console.error('Error equipping character:', error);
    return false;
  }
  return true;
}

export async function purchaseCharacter(playerId: string, characterId: string, price: number): Promise<{success: boolean, message?: string}> {
  // 1. Check if they already own it
  const owned = await getOwnedCharacters(playerId);
  if (owned.includes(characterId)) {
    return { success: false, message: 'Character already owned.' };
  }

  // 2. Check coins
  if (!supabase) return { success: false, message: 'Supabase error' };
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', playerId)
    .single();
    
  if (profileError || !profile) return { success: false, message: 'Failed to fetch profile' };
  
  if (profile.coins < price) {
    return { success: false, message: 'Not enough coins' };
  }

  // 3. Deduct coins and add character (RPC would be better, but doing it in 2 steps for simplicity if RLS allows or client side)
  // Actually, we must do it client side for now.
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ coins: profile.coins - price })
    .eq('id', playerId);

  if (updateError) return { success: false, message: 'Transaction failed' };

  const { error: insertError } = await supabase
    .from('player_characters')
    .insert({
      player_id: playerId,
      character_id: characterId
    });

  if (insertError) {
    // Refund? (Ideally use a secure RPC for this)
    await supabase.from('profiles').update({ coins: profile.coins }).eq('id', playerId);
    return { success: false, message: 'Failed to unlock character' };
  }

  return { success: true, message: 'Character Unlocked!' };
}
