-- Enable pgcrypto if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable Row Level Security on chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select their own full profile
CREATE POLICY "select_own_profile" ON public.chats
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to insert a profile for themselves
CREATE POLICY "insert_own_profile" ON public.chats
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their profile
CREATE POLICY "update_own_profile" ON public.chats
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a safe view that exposes only non-sensitive fields for public reads
CREATE OR REPLACE VIEW public.chats_public AS
SELECT
  encode(digest(id::text, 'sha256'), 'hex') AS id_hash,
  username,
  avatar,
  is_online
FROM public.chats;

-- Grant select on the view to authenticated role (optional depending on Supabase)
GRANT SELECT ON public.chats_public TO authenticated;

-- Optionally, ensure realtime subscriptions use the view (you can subscribe to chats_public)
-- Note: Supabase realtime listens to tables; if you want to broadcast presence via messages table,
-- consider writing a trigger that inserts presence events into the realtime.messages topic.
