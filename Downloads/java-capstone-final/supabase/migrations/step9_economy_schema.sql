-- Step 9 Economy Schema Migration

-- Add new columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_claim DATE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- PLAYER SKINS TABLE
CREATE TABLE IF NOT EXISTS public.player_skins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skin_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, skin_id)
);

ALTER TABLE public.player_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player skins are viewable by everyone" 
ON public.player_skins FOR SELECT USING (true);

CREATE POLICY "Users can insert their own skins" 
ON public.player_skins FOR INSERT WITH CHECK (auth.uid() = player_id);

-- DAILY REWARDS TABLE
CREATE TABLE IF NOT EXISTS public.daily_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_date DATE NOT NULL,
    day_number INTEGER NOT NULL,
    coins_awarded INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, reward_date)
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily rewards are viewable by owner" 
ON public.daily_rewards FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own rewards" 
ON public.daily_rewards FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_skins_player_id ON public.player_skins(player_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_player_id ON public.daily_rewards(player_id);
