-- Add authoritative state to matches for robust online synchronization
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS state JSONB;
