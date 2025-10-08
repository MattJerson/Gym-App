-- Safe public view exposing id (for internal joins), username, avatar, is_online
CREATE OR REPLACE VIEW public.chats_public_with_id AS
SELECT
  id,
  username,
  avatar,
  is_online
FROM public.chats;

GRANT SELECT ON public.chats_public_with_id TO authenticated;
