import { getSupabaseClient } from './client';
import type { Database } from './database.types';

export type Room = Database['public']['Tables']['rooms']['Row'];
export type RoomPlayer = Database['public']['Tables']['room_players']['Row'];

/**
 * Generate a random 6-character uppercase alphanumeric code
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 1, 0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getRoomByCode(roomCode: string): Promise<Room | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedCode = roomCode.toUpperCase().trim();
  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) return null;

  const { data, error } = await client
    .from('rooms')
    .select('*')
    .eq('room_code', normalizedCode)
    .maybeSingle();

  if (error) {
    console.error('Error fetching room:', error);
    return null;
  }

  return data;
}

export async function getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('player_index', { ascending: true });

  if (error) {
    console.error('Error fetching room players:', error);
    return [];
  }

  return data || [];
}

export async function createRoom(hostId: string): Promise<Room | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  let roomCode = '';
  let isUnique = false;
  let attempts = 0;

  // Try to generate a unique code
  while (!isUnique && attempts < 5) {
    roomCode = generateRoomCode();
    const existing = await getRoomByCode(roomCode);
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    console.error('Failed to generate a unique room code.');
    return null;
  }

  // Insert room
  const { data: room, error: roomError } = await client
    .from('rooms')
    .insert({
      host_id: hostId,
      room_code: roomCode,
      status: 'waiting'
    })
    .select()
    .single();

  if (roomError || !room) {
    console.error('Error creating room:', roomError);
    return null;
  }

  // Insert host as player 1
  const { error: playerError } = await client
    .from('room_players')
    .insert({
      room_id: room.id,
      player_id: hostId,
      player_index: 0
    });

  if (playerError) {
    console.error('Error adding host to room:', playerError);
    return null;
  }

  return room;
}

export async function joinRoom(roomCode: string, playerId: string): Promise<{ room: Room | null, error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { room: null, error: 'Database not connected' };

  // Get room
  const room = await getRoomByCode(roomCode);
  if (!room) {
    return { room: null, error: 'Room not found' };
  }

  if (room.status !== 'waiting') {
    return { room: null, error: 'Room is already in progress' };
  }

  // Get current players
  const players = await getRoomPlayers(room.id);
  
  if (players.some(p => p.player_id === playerId)) {
    // Player already in room
    return { room };
  }

  if (players.length >= 2) {
    return { room: null, error: 'Room is full' };
  }

  // Determine index
  const usedIndices = players.map(p => p.player_index);
  const playerIndex = usedIndices.includes(0) ? 1 : 0;

  // Join room
  const { error: joinError } = await client
    .from('room_players')
    .insert({
      room_id: room.id,
      player_id: playerId,
      player_index: playerIndex
    });

  if (joinError) {
    console.error('JOIN ROOM RESULT: FAILED', {
      roomId: room.id,
      roomCode: room.room_code,
      userId: playerId,
      message: joinError.message,
      code: joinError.code,
      details: joinError.details,
      hint: joinError.hint
    });
    return { room: null, error: 'Failed to join room' };
  }

  console.log('JOIN ROOM RESULT: SUCCESS', {
    roomId: room.id,
    roomCode: room.room_code,
    userId: playerId,
    inserted: true
  });

  return { room };
}

export async function leaveRoom(roomId: string, playerId: string, isHost: boolean): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  if (isHost) {
    // Cancel the room if host leaves before match starts
    await client
      .from('rooms')
      .update({ status: 'cancelled' })
      .eq('id', roomId);
  }

  // Remove player
  await client
    .from('room_players')
    .delete()
    .eq('room_id', roomId)
    .eq('player_id', playerId);
}

export function subscribeToRoom(roomId: string, onUpdate: (payload?: any) => void): { unsubscribe: () => void } | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channelName = `room:${roomId}`;
  
  // Prevent duplicate channels in strict mode or overlapping calls
  const existingChannel = client.getChannels().find(c => c.topic === channelName);
  if (existingChannel) {
    client.removeChannel(existingChannel);
  }

  const channel = client.channel(channelName);
  
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'room_players',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      console.log('ROOM REALTIME EVENT (room_players)', payload);
      onUpdate(payload);
    }
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rooms',
      filter: `id=eq.${roomId}`
    },
    (payload) => {
      console.log('ROOM REALTIME EVENT (rooms)', payload);
      onUpdate(payload);
    }
  );

  channel.subscribe((status, err) => {
    console.log('ROOM REALTIME STATUS', status, err || '');
  });

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    }
  };
}

export async function broadcastGameAction(roomId: string, action: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const channelName = `room:${roomId}`;
  const channel = client.channel(channelName);
  
  // Realtime Broadcast payload
  const resp = await channel.send({
    type: 'broadcast',
    event: 'game_action',
    payload: action
  });

  return resp === 'ok';
}

export function subscribeToGameActions(roomId: string, onAction: (payload: any) => void) {
  const client = getSupabaseClient();
  if (!client) return { unsubscribe: () => {} };

  const channelName = `room:${roomId}`;
  const channel = client.channel(channelName);
  
  channel.on(
    'broadcast',
    { event: 'game_action' },
    (payload) => {
      console.log('[ONLINE REMOTE ACTION] Received', payload);
      onAction(payload.payload); // the nested payload
    }
  );

  channel.subscribe();

  return {
    unsubscribe: () => {
      client.removeChannel(channel);
    }
  };
}
