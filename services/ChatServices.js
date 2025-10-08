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
  // Fetch raw messages
  const { data: messages, error: msgErr } = await supabase
    .from("channel_messages")
    .select(`*, message_reactions (emoji, user_id)`)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (msgErr) return { data: null, error: msgErr };

  // Collect unique user ids to fetch public profiles
  const userIds = Array.from(new Set(messages.map((m) => m.user_id).filter(Boolean)));

  let profilesById = {};
  if (userIds.length) {
    const { data: profiles, error: profileErr } = await supabase
      .from("chats_public_with_id")
      .select("id, username, avatar, is_online")
      .in("id", userIds);

    if (!profileErr && profiles) {
      profilesById = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    } else if (profileErr) {
      console.warn("[ChatServices] failed to fetch profiles:", profileErr);
    }
  }

  // Enrich messages with profile data
  const enriched = messages.map((msg) => ({
    ...msg,
    chats: profilesById[msg.user_id] || { username: 'unknown', avatar: '?', is_online: false },
  }));

  return { data: enriched, error: null };
};

// Send channel message
export const sendChannelMessage = async (channelId, content, userId) => {
  try {
    console.log(`[ChatServices] sendChannelMessage start`, {
      channelId,
      userId,
      preview: content?.slice(0, 120),
    });

    const { data, error } = await supabase
      .from("channel_messages")
      .insert({
        channel_id: channelId,
        user_id: userId,
        content,
      })
      // Return the inserted row only; join queries can fail depending on DB aliases
      .select("*")
      .single();

    if (error) {
      console.error("[ChatServices] sendChannelMessage error:", error);
      return { data: null, error };
    }

    console.log("[ChatServices] sendChannelMessage success", {
      id: data?.id,
      channelId: data?.channel_id,
    });

    // Enrich with public profile if possible
    try {
      const { data: profile } = await supabase
        .from("chats_public_with_id")
        .select("id, username, avatar, is_online")
        .eq("id", userId)
        .single();

      const enriched = { ...data, chats: profile || { username: 'unknown', avatar: '?', is_online: false } };
      return { data: enriched, error: null };
    } catch (err) {
      console.warn('[ChatServices] failed to fetch profile after insert', err);
      return { data, error: null };
    }
  } catch (err) {
    console.error("[ChatServices] sendChannelMessage unexpected error:", err);
    return { data: null, error: err };
  }
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
      async (payload) => {
        try {
          // Fetch the inserted row and its public profile
          const { data: row } = await supabase
            .from("channel_messages")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          const { data: profile } = await supabase
            .from("chats_public_with_id")
            .select("id, username, avatar, is_online")
            .eq("id", row.user_id)
            .single();

          const enriched = { new: { ...row, chats: profile || { username: 'unknown', avatar: '?', is_online: false } } };
          callback(enriched);
        } catch (err) {
          console.warn("[ChatServices] realtime enrichment failed:", err);
          callback(payload);
        }
      }
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
  const { data: messages, error: msgErr } = await supabase
    .from("direct_messages")
    .select(`*`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (msgErr) return { data: null, error: msgErr };

  const userIds = Array.from(new Set(messages.map((m) => m.sender_id).filter(Boolean)));

  let profilesById = {};
  if (userIds.length) {
    const { data: profiles, error: profileErr } = await supabase
      .from("chats_public_with_id")
      .select("id, username, avatar, is_online")
      .in("id", userIds);

    if (!profileErr && profiles) {
      profilesById = profiles.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    } else if (profileErr) {
      console.warn("[ChatServices] failed to fetch profiles:", profileErr);
    }
  }

  const enriched = messages.map((msg) => ({
    ...msg,
    chats: profilesById[msg.sender_id] || { username: 'unknown', avatar: '?', is_online: false },
  }));

  return { data: enriched, error: null };
};

// Send direct message
export const sendDirectMessage = async (conversationId, senderId, content) => {
  try {
    console.log(`[ChatServices] sendDirectMessage start`, {
      conversationId,
      senderId,
      preview: content?.slice(0, 120),
    });

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      // Return the inserted row only; joined selects can break if aliases differ
      .select("*")
      .single();

    if (error) {
      console.error("[ChatServices] sendDirectMessage error:", error);
      return { data: null, error };
    }

    console.log("[ChatServices] sendDirectMessage success", {
      id: data?.id,
      conversationId: data?.conversation_id,
    });

    try {
      const { data: profile } = await supabase
        .from("chats_public_with_id")
        .select("id, username, avatar, is_online")
        .eq("id", senderId)
        .single();

      const enriched = { ...data, chats: profile || { username: 'unknown', avatar: '?', is_online: false } };
      return { data: enriched, error: null };
    } catch (err) {
      console.warn('[ChatServices] failed to fetch profile after insert', err);
      return { data, error: null };
    }
  } catch (err) {
    console.error("[ChatServices] sendDirectMessage unexpected error:", err);
    return { data: null, error: err };
  }
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
      async (payload) => {
        try {
          const { data: row } = await supabase
            .from("direct_messages")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          const { data: profile } = await supabase
            .from("chats_public_with_id")
            .select("id, username, avatar, is_online")
            .eq("id", row.sender_id)
            .single();

          const enriched = { new: { ...row, chats: profile || { username: 'unknown', avatar: '?', is_online: false } } };
          callback(enriched);
        } catch (err) {
          console.warn("[ChatServices] realtime enrichment failed:", err);
          callback(payload);
        }
      }
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
