import { getSupabaseClient } from './client';
import type { Database } from './database.types';

type Match = Database['public']['Tables']['matches']['Row'];

/**
 * Basic match repository structure stub
 */
export async function getMatchByRoomId(roomId: string): Promise<Match | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('room_id', roomId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching match:', error);
    return null;
  }

  return data;
}

export async function createMatch(roomId: string | null, playerOneId: string, playerTwoId: string | null): Promise<Match | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !roomId || !playerTwoId) return null;

  const { data, error } = await (supabase as any).rpc('create_match_for_room', {
    p_room_id: roomId,
    p_player_one_id: playerOneId,
    p_player_two_id: playerTwoId
  });

  if (error || !data?.success) {
    console.error('Error creating match via RPC:', error || data);
    return null;
  }

  // Fetch and return the created match
  return await getMatchByRoomId(roomId);
}

export async function updateMatchState(matchId: string, state: any): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('matches')
    .update({ state: state as any } as any)
    .eq('id', matchId);

  if (error) {
    console.error('Error updating match state:', error);
    return false;
  }

  return true;
}

export function subscribeToMatch(matchId: string, onUpdate: (payload: any) => void): { unsubscribe: () => void } | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channelName = `match:${matchId}`;
  const channel = client.channel(channelName);
  
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'matches',
      filter: `id=eq.${matchId}`
    },
    (payload) => {
      console.log('MATCH REALTIME EVENT', payload);
      onUpdate(payload.new);
    }
  );

  channel.subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    }
  };
}

export async function finishMatch(matchId: string, winnerId: string | null): Promise<Match | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  // First check if it's already finished to avoid duplicate updates
  const { data: currentMatch } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single();

  if (currentMatch?.status === 'finished') {
    return null;
  }

  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'finished',
      winner_id: winnerId,
      finished_at: new Date().toISOString()
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Error finishing match:', error);
    return null;
  }

  // Award the winner the entry fee prize pool safely via RPC
  if (winnerId) {
    await rewardMatchWinner(matchId, winnerId);
  }

  return data;
}

// ---------------------------------------------------------------------------
// MATCH ENTRY / BETTING RPC CALLS
// ---------------------------------------------------------------------------

export async function getMatchEntriesByRoom(roomId: string): Promise<any[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from('match_entries')
    .select('*')
    .eq('room_id', roomId);

  if (error) {
    console.error('Error fetching match entries:', error);
    return [];
  }

  return data || [];
}

export async function payMatchEntry(roomId: string, playerId: string, fee: number): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database connection failed' };

  const { data, error } = await (supabase as any).rpc('pay_match_entry', {
    p_room_id: roomId,
    p_player_id: playerId,
    p_fee: fee
  });

  if (error) {
    console.error('payMatchEntry error:', error);
    return { success: false, error: error.message };
  }
  
  return data as { success: boolean; error?: string };
}

export async function refundMatchEntry(roomId: string, playerId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database connection failed' };

  const { data, error } = await (supabase as any).rpc('refund_match_entry', {
    p_room_id: roomId,
    p_player_id: playerId
  });

  if (error) {
    console.error('refundMatchEntry error:', error);
    return { success: false, error: error.message };
  }
  
  return data as { success: boolean; error?: string };
}

export async function rejectChallenge(roomId: string, rejectorId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database connection failed' };

  const { data, error } = await (supabase as any).rpc('reject_challenge', {
    p_room_id: roomId,
    p_rejector_id: rejectorId
  });

  if (error) {
    console.error('rejectChallenge error:', error);
    return { success: false, error: error.message };
  }
  
  return data as { success: boolean; error?: string };
}

export async function rewardMatchWinner(matchId: string, winnerId: string): Promise<{ success: boolean; awarded?: number; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Database connection failed' };

  const { data, error } = await (supabase as any).rpc('reward_match_winner', {
    p_match_id: matchId,
    p_winner_id: winnerId
  });

  if (error) {
    console.error('rewardMatchWinner error:', error);
    return { success: false, error: error.message };
  }
  
  return data as { success: boolean; awarded?: number; error?: string };
}

export function subscribeToMatchEntries(roomId: string, onUpdate: (payload: any) => void): { unsubscribe: () => void } | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channelName = `match_entries:${roomId}`;
  const channel = client.channel(channelName);
  
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'match_entries',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      onUpdate(payload);
    }
  );

  channel.subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    }
  };
}

