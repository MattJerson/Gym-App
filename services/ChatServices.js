import { supabase } from "./supabase";

// Fetch channels
export const fetchChannels = async () => {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .order("category", { ascending: true });

  return { data, error };
};

// Fetch channel messages
export const fetchChannelMessages = async (channelId, limit = 50) => {
  const { data, error } = await supabase
    .from("channel_messages")
    .select(
      `
      *,
      chats:user_id (username, avatar, is_online),
      message_reactions (emoji, user_id)
    `
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return { data, error };
};

// Send channel message
export const sendChannelMessage = async (channelId, content, userId) => {
  const { data, error } = await supabase
    .from("channel_messages")
    .insert({
      channel_id: channelId,
      user_id: userId,
      content,
    })
    .select(
      `
      *,
      chats:user_id (username, avatar, is_online)
    `
    )
    .single();

  return { data, error };
};

// Subscribe to channel messages
export const subscribeToChannelMessages = (channelId, callback) => {
  return supabase
    .channel(`channel:${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "channel_messages",
        filter: `channel_id=eq.${channelId}`,
      },
      callback
    )
    .subscribe();
};

// Fetch or create DM conversation
export const getOrCreateConversation = async (user1Id, user2Id) => {
  // Try to find existing conversation
  const { data: existing, error: fetchError } = await supabase
    .from("dm_conversations")
    .select("*")
    .or(
      `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
    )
    .single();

  if (existing) return { data: existing, error: null };

  // Create new conversation
  const { data, error } = await supabase
    .from("dm_conversations")
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
    })
    .select()
    .single();

  return { data, error };
};

// Fetch DM messages
export const fetchDirectMessages = async (conversationId, limit = 50) => {
  const { data, error } = await supabase
    .from("direct_messages")
    .select(
      `
      *,
      chats:sender_id (username, avatar, is_online)
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return { data, error };
};

// Send direct message
export const sendDirectMessage = async (conversationId, senderId, content) => {
  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select(
      `
      *,
      chats:sender_id (username, avatar, is_online)
    `
    )
    .single();

  return { data, error };
};

// Subscribe to DM messages
export const subscribeToDirectMessages = (conversationId, callback) => {
  return supabase
    .channel(`dm:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
};

// Fetch user's DM conversations
export const fetchUserConversations = async (userId) => {
  const { data, error } = await supabase
    .from("dm_conversations")
    .select(
      `
      *,
      user1:user1_id (id, username, avatar, is_online),
      user2:user2_id (id, username, avatar, is_online),
      direct_messages (content, created_at, is_read, sender_id)
    `
    )
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  return { data, error };
};

// Update user online status
export const updateOnlineStatus = async (userId, isOnline) => {
  const { error } = await supabase
    .from("chats")
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString(),
    })
    .eq("id", userId);

  return { error };
};

// Subscribe to user presence
export const subscribeToPresence = (callback) => {
  return supabase
    .channel("presence")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chats",
      },
      callback
    )
    .subscribe();
};
