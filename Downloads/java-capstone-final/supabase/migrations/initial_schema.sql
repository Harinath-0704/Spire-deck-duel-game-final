-- Initial Schema for Spire Deck Duel

-- Extension for UUID generation if needed (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE NOT NULL,
    host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by everyone" 
ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" 
ON public.rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Host can update their room" 
ON public.rooms FOR UPDATE USING (auth.uid() = host_id);

-- ROOM PLAYERS
CREATE TABLE IF NOT EXISTS public.room_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_index INTEGER NOT NULL, -- 0 for host/player1, 1 for player2
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, player_id),
    UNIQUE(room_id, player_index)
);

ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room players are viewable by everyone" 
ON public.room_players FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" 
ON public.room_players FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can leave rooms" 
ON public.room_players FOR DELETE USING (auth.uid() = player_id);

-- MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    player_one_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    player_two_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'playing', -- playing, finished, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone" 
ON public.matches FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create matches" 
ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Players in the match can update it" 
ON public.matches FOR UPDATE USING (auth.uid() = player_one_id OR auth.uid() = player_two_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON public.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_player_id ON public.room_players(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_room_id ON public.matches(room_id);
