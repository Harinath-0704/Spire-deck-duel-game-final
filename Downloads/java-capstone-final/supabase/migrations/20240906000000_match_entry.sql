-- Step 12 Match Entry Schema Migration (with reordered parameters)

CREATE TABLE IF NOT EXISTS public.match_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    entry_fee INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PAID', -- PAID, REFUNDED, REWARDED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, player_id)
);

ALTER TABLE public.match_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match entries are viewable by everyone" 
ON public.match_entries FOR SELECT USING (true);

-- Drop previous function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.pay_match_entry(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.pay_match_entry(INTEGER, UUID, UUID);

-- RPC for securely paying match entry fee
CREATE OR REPLACE FUNCTION public.pay_match_entry(
  p_fee INTEGER,
  p_player_id UUID, 
  p_room_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_coins INTEGER;
BEGIN
  -- lock the profile row to prevent race conditions (double spending)
  SELECT coins INTO v_coins 
  FROM public.profiles 
  WHERE id = p_player_id 
  FOR UPDATE;
  
  IF v_coins < p_fee THEN
     RETURN json_build_object('success', false, 'error', 'Insufficient coins');
  END IF;

  -- check if already paid for this room
  IF EXISTS (SELECT 1 FROM public.match_entries WHERE room_id = p_room_id AND player_id = p_player_id AND status = 'PAID') THEN
     RETURN json_build_object('success', false, 'error', 'Already paid');
  END IF;

  -- deduct fee
  UPDATE public.profiles SET coins = coins - p_fee WHERE id = p_player_id;

  -- insert entry
  INSERT INTO public.match_entries (room_id, player_id, entry_fee, status)
  VALUES (p_room_id, p_player_id, p_fee, 'PAID');

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop previous function if it exists
DROP FUNCTION IF EXISTS public.refund_match_entry(UUID, UUID);

-- RPC for securely refunding an entry fee
CREATE OR REPLACE FUNCTION public.refund_match_entry(
  p_player_id UUID,
  p_room_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_fee INTEGER;
BEGIN
  -- lock the entry row to prevent duplicate refunds
  SELECT entry_fee INTO v_fee 
  FROM public.match_entries 
  WHERE room_id = p_room_id AND player_id = p_player_id AND status = 'PAID'
  FOR UPDATE;

  IF NOT FOUND THEN
     RETURN json_build_object('success', false, 'error', 'Not paid or already refunded');
  END IF;

  -- mark as refunded
  UPDATE public.match_entries SET status = 'REFUNDED' WHERE room_id = p_room_id AND player_id = p_player_id;
  
  -- return coins
  UPDATE public.profiles SET coins = coins + v_fee WHERE id = p_player_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC for safely rejecting a challenge (refunds host, cancels room)
CREATE OR REPLACE FUNCTION public.reject_challenge(
  p_rejector_id UUID,
  p_room_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_host_id UUID;
  v_host_fee INTEGER;
BEGIN
  -- Get room host
  SELECT host_id INTO v_host_id FROM public.rooms WHERE id = p_room_id;

  IF v_host_id IS NOT NULL THEN
     -- Find if host paid
     SELECT entry_fee INTO v_host_fee 
     FROM public.match_entries 
     WHERE room_id = p_room_id AND player_id = v_host_id AND status = 'PAID'
     FOR UPDATE;

     IF FOUND THEN
        -- mark host entry as refunded
        UPDATE public.match_entries SET status = 'REFUNDED' WHERE room_id = p_room_id AND player_id = v_host_id AND status = 'PAID';
        -- return coins to host
        UPDATE public.profiles SET coins = coins + v_host_fee WHERE id = v_host_id;
     END IF;
  END IF;

  -- Mark room as cancelled
  UPDATE public.rooms SET status = 'cancelled' WHERE id = p_room_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop previous function if it exists
DROP FUNCTION IF EXISTS public.reward_match_winner(UUID, UUID);

-- RPC for securely awarding the winner the total prize pool of a match
CREATE OR REPLACE FUNCTION public.reward_match_winner(
  p_match_id UUID, 
  p_winner_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_total_pool INTEGER;
  v_match_status TEXT;
  v_db_winner_id UUID;
  v_room_id UUID;
BEGIN
  -- We first verify the match is actually finished and winner matches, locking it
  SELECT status, winner_id, room_id INTO v_match_status, v_db_winner_id, v_room_id
  FROM public.matches
  WHERE id = p_match_id;

  IF v_match_status != 'finished' THEN
     RETURN json_build_object('success', false, 'error', 'Match is not finished');
  END IF;

  IF v_db_winner_id != p_winner_id THEN
     RETURN json_build_object('success', false, 'error', 'Player is not the winner');
  END IF;

  -- Link the room entries to the match if they aren't already
  UPDATE public.match_entries SET match_id = p_match_id WHERE room_id = v_room_id AND match_id IS NULL;

  -- Check if already rewarded (we can tell if the match entries are still PAID but not REWARDED)
  IF EXISTS (SELECT 1 FROM public.match_entries WHERE match_id = p_match_id AND player_id = p_winner_id AND status = 'REWARDED') THEN
      RETURN json_build_object('success', false, 'error', 'Already rewarded');
  END IF;

  -- calculate total prize pool from PAID entries
  SELECT COALESCE(SUM(entry_fee), 0) INTO v_total_pool 
  FROM public.match_entries 
  WHERE match_id = p_match_id AND status IN ('PAID', 'REWARDED');

  IF v_total_pool > 0 THEN
    -- award coins
    UPDATE public.profiles SET coins = coins + v_total_pool WHERE id = p_winner_id;
    -- mark entries as REWARDED for the winner to prevent duplicate payouts
    UPDATE public.match_entries SET status = 'REWARDED' WHERE match_id = p_match_id AND player_id = p_winner_id AND status = 'PAID';
  END IF;

  RETURN json_build_object('success', true, 'awarded', v_total_pool);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
