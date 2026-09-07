-- 20260906184000_player_characters.sql

-- Add equipped_character_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_character_id TEXT NOT NULL DEFAULT 'arthur';

-- Create player_characters table
CREATE TABLE IF NOT EXISTS public.player_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, character_id)
);

ALTER TABLE public.player_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player characters are viewable by everyone" 
ON public.player_characters FOR SELECT USING (true);

CREATE POLICY "Users can insert their own characters" 
ON public.player_characters FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE INDEX IF NOT EXISTS idx_player_characters_player_id ON public.player_characters(player_id);
