-- Unlockable Cards Schema Migration

-- PLAYER CARDS TABLE
CREATE TABLE IF NOT EXISTS public.player_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, card_id)
);

ALTER TABLE public.player_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player cards are viewable by everyone" 
ON public.player_cards FOR SELECT USING (true);

CREATE POLICY "Users can insert their own cards" 
ON public.player_cards FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE INDEX IF NOT EXISTS idx_player_cards_player_id ON public.player_cards(player_id);
