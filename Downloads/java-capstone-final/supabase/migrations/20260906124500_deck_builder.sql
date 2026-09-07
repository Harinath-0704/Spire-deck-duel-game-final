-- Step 14: Deck Builder

CREATE TABLE IF NOT EXISTS public.player_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(player_id) -- Only one deck per player for now
);

-- RLS Policies
ALTER TABLE public.player_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deck"
    ON public.player_decks FOR SELECT
    USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own deck"
    ON public.player_decks FOR INSERT
    WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own deck"
    ON public.player_decks FOR UPDATE
    USING (auth.uid() = player_id)
    WITH CHECK (auth.uid() = player_id);
