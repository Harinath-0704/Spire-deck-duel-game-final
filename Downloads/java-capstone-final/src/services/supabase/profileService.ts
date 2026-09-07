import { getSupabaseClient } from './client';
import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PlayerProfile = Profile;

/**
 * Get a profile by ID
 */
export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Upsert the current user's profile
 */
export async function upsertProfile(
  id: string, 
  displayName: string, 
  avatarUrl?: string, 
  username?: string
): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id,
      display_name: displayName,
      username: username || null,
      avatar: avatarUrl || null,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    return null;
  }

  return data;
}

// Helper to get today's date in YYYY-MM-DD
const getTodayDateString = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

/**
 * Uploads a custom avatar image to Supabase storage and returns the public URL
 */
export async function uploadAvatar(file: File, playerId: string): Promise<{ url: string | null, error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { url: null, error: 'Supabase client not initialized' };

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${playerId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return { url: null, error: uploadError.message || 'Upload failed' };
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error: any) {
    console.error('Unexpected error uploading avatar:', error);
    return { url: null, error: error.message || 'Unexpected error occurred' };
  }
}

export const formatCoins = (coins: number) => {
  return new Intl.NumberFormat().format(coins);
};

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const supabase = getSupabaseClient();
  const defaultStats = { totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
  
  if (!supabase) return defaultStats;

  try {
    // We fetch matches where player_one_id or player_two_id is this player,
    // and status is 'finished'
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, winner_id')
      .eq('status', 'finished')
      .or(`player_one_id.eq.${playerId},player_two_id.eq.${playerId}`);

    if (error) {
      console.error('Error fetching player stats:', error);
      return defaultStats;
    }

    if (!matches || matches.length === 0) {
      return defaultStats;
    }

    const totalMatches = matches.length;
    let wins = 0;
    let draws = 0;
    
    for (const match of matches) {
      if (match.winner_id === playerId) {
        wins++;
      } else if (match.winner_id === null) {
        draws++;
      }
    }
    
    const losses = totalMatches - wins - draws;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    return { totalMatches, wins, losses, draws, winRate };
  } catch (err) {
    console.error('Failed to get player stats', err);
    return defaultStats;
  }
}

export const claimDailyReward = async (playerId: string, profile: PlayerProfile): Promise<{ success: boolean; newCoins: number; newStreak: number; message?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, newCoins: profile?.coins || 0, newStreak: profile?.streak || 0, message: 'No Supabase client' };

  const today = getTodayDateString();
  
  if (profile.last_daily_claim === today) {
    return { success: false, newCoins: profile.coins, newStreak: profile.streak, message: 'Already claimed today' };
  }

  // Calculate new streak
  let newStreak = 1;
  if (profile.last_daily_claim) {
    const lastClaim = new Date(profile.last_daily_claim);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastClaim.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = profile.streak >= 7 ? 1 : profile.streak + 1;
    }
  }

  // Calculate reward
  const rewardAmounts = [100, 150, 200, 250, 300, 400, 500];
  const rewardIndex = Math.min(Math.max(newStreak - 1, 0), 6);
  const reward = rewardAmounts[rewardIndex];

  // Atomic update using Supabase
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      coins: profile.coins + reward,
      streak: newStreak,
      last_daily_claim: today
    })
    .eq('id', playerId);

  if (profileError) {
    console.error('Error updating profile for daily reward:', profileError);
    return { success: false, newCoins: profile.coins, newStreak: profile.streak, message: 'Database error' };
  }

  // Log reward
  await supabase
    .from('daily_rewards')
    .insert({
      player_id: playerId,
      reward_date: today,
      day_number: newStreak,
      coins_awarded: reward
    });

  return { success: true, newCoins: profile.coins + reward, newStreak, message: `Claimed ${reward} coins!` };
};

export const spendCoins = async (playerId: string, amount: number): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  // First fetch latest coins
  const profile = await getProfile(playerId);
  if (!profile || profile.coins < amount) {
    return false;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ coins: profile.coins - amount })
    .eq('id', playerId);

  if (error) {
    console.error('Error spending coins:', error);
    return false;
  }
  
  return true;
};

export const addCoins = async (playerId: string, amount: number): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const profile = await getProfile(playerId);
  if (!profile) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ coins: profile.coins + amount })
    .eq('id', playerId);

  if (error) {
    console.error('Error adding coins:', error);
    return false;
  }
  
  return true;
};
