import { supabase } from "./supabase";

// ============================================
// SECURITY & VALIDATION
// ============================================

export const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_MAX = 10; // messages per window
const RATE_LIMIT_WINDOW = 1; // minutes

// Client-side profanity check with robust pattern matching
const profanityPatterns = [
  // Base words with common variations
  { pattern: /s[p@]a*m+/i, word: 'spam' },
  { pattern: /sc[a@]m+/i, word: 'scam' },
  { pattern: /h[a@]t[e3]/i, word: 'hate' },
  { pattern: /[i1!][d]?[i1!][o0][t+]/i, word: 'idiot' },
  { pattern: /st[u\*][p]+[i1!]d/i, word: 'stupid' },
  { pattern: /d[u\*]m+b*/i, word: 'dumb' },
  { pattern: /f[@\*u]c*k+/i, word: 'fuck' },
  { pattern: /sh[i1!@\*]t+/i, word: 'shit' },
  { pattern: /[a@]s+[s\*]+/i, word: 'ass' },
  { pattern: /b[i1!]t+c*h+/i, word: 'bitch' },
  { pattern: /n[i1!]g+[e3]r/i, word: 'racial slur' },
  { pattern: /f[a@]g+[o0]*t*/i, word: 'slur' },
  { pattern: /r[e3]t[a@]rd/i, word: 'retard' },
  { pattern: /wh[o0]r[e3]/i, word: 'whore' },
  { pattern: /sl[u\*]t+/i, word: 'slut' },
  { pattern: /c[u\*]nt+/i, word: 'cunt' },
  { pattern: /d[i1!]ck+/i, word: 'dick' },
  { pattern: /p[u\*]ss[y\*]/i, word: 'pussy' },
  { pattern: /k[i1!]ll\s+(your)?self/i, word: 'self harm' },
  { pattern: /k[y\*]s/i, word: 'kys' },
];

// Normalize text to catch leetspeak and special character substitutions
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces (f u c k -> fuck)
    .replace(/[^a-z0-9]/g, (char) => {
      // Common substitutions
      const subs = {
        '@': 'a', '4': 'a', '∆': 'a',
        '8': 'b', '€': 'e', '3': 'e',
        '1': 'i', '!': 'i', '|': 'i',
        '0': 'o', '$': 's', '5': 's',
        '7': 't', '+': 't', '*': '', '.': ''
      };
      return subs[char] || char;
    });
};

export const validateMessage = (content) => {
  const errors = [];
  
  // Check length
  if (!content || content.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (content.length > MAX_MESSAGE_LENGTH) {
    errors.push(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  }
  
  // Check for suspicious patterns
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlPattern);
  if (urls && urls.length > 2) {
    errors.push('Too many links in message');
  }
  
  // Check for spam patterns (repeated characters)
  const repeatedChars = /(.)\1{10,}/;
  if (repeatedChars.test(content)) {
    errors.push('Message contains spam patterns');
  }
  
  // Robust profanity check
  const normalized = normalizeText(content);
  const foundProfanity = [];
  
  // Check against pattern list
  for (const { pattern, word } of profanityPatterns) {
    if (pattern.test(content) || pattern.test(normalized)) {
      foundProfanity.push(word);
    }
  }
  
  if (foundProfanity.length > 0) {
    errors.push('Message contains inappropriate language');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    characterCount: content.length,
    hasProfanity: foundProfanity.length > 0,
    flaggedWords: foundProfanity
  };
};

// Check rate limit before sending
export const checkRateLimit = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_max_messages: RATE_LIMIT_MAX,
      p_window_minutes: RATE_LIMIT_WINDOW
    });
    
    if (error) {
      console.error('[ChatServices] Rate limit check failed:', error);
      return { allowed: true, waitSeconds: 0 }; // Fail open for UX
    }
    
    return {
      allowed: data[0]?.allowed || false,
      currentCount: data[0]?.current_count || 0,
      waitSeconds: data[0]?.wait_seconds || 0
    };
  } catch (err) {
    console.error('[ChatServices] Rate limit error:', err);
    return { allowed: true, waitSeconds: 0 };
  }
};

// ============================================
// UNREAD MESSAGE TRACKING
// ============================================

export const getChannelUnreadCount = async (userId, channelId) => {
  try {
    const { data, error } = await supabase.rpc('get_channel_unread_count', {
      p_user_id: userId,
      p_channel_id: channelId
    });
    
    if (error) throw error;
    return data || 0;
  } catch (err) {
    console.error('[ChatServices] Failed to get channel unread count:', err);
    return 0;
  }
};

export const markChannelRead = async (userId, channelId, lastMessageId = null) => {
  try {
    const { error } = await supabase.rpc('mark_channel_read', {
      p_user_id: userId,
      p_channel_id: channelId,
      p_last_message_id: lastMessageId
    });
    
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[ChatServices] Failed to mark channel read:', err);
    return { success: false, error: err };
  }
};

export const getDMUnreadCount = async (userId, conversationId) => {
  try {
    const { data, error } = await supabase.rpc('get_dm_unread_count', {
      p_user_id: userId,
      p_conversation_id: conversationId
    });
    
    if (error) throw error;
    return data || 0;
  } catch (err) {
    console.error('[ChatServices] Failed to get DM unread count:', err);
    return 0;
  }
};

export const markDMRead = async (userId, conversationId, lastMessageId = null) => {
  try {
    const { error } = await supabase.rpc('mark_dm_read', {
      p_user_id: userId,
      p_conversation_id: conversationId,
      p_last_message_id: lastMessageId
    });
    
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[ChatServices] Failed to mark DM read:', err);
    return { success: false, error: err };
  }
};

// Get all unread counts for a user
export const getAllUnreadCounts = async (userId) => {
  try {
    // Get all channels user has access to
    const { data: channels } = await fetchChannels();
    
    const channelUnreads = await Promise.all(
      (channels || []).map(async (channel) => ({
        channelId: channel.id,
        unread: await getChannelUnreadCount(userId, channel.id)
      }))
    );
    
    // Get DM unreads from conversations
    const { data: conversations } = await fetchUserConversations(userId);
    
    const dmUnreads = await Promise.all(
      (conversations || []).map(async (conv) => ({
        conversationId: conv.id,
        unread: await getDMUnreadCount(userId, conv.id)
      }))
    );
    
    return {
      channels: channelUnreads,
      dms: dmUnreads,
      totalUnread: [
        ...channelUnreads,
        ...dmUnreads
      ].reduce((sum, item) => sum + item.unread, 0)
    };
  } catch (err) {
    console.error('[ChatServices] Failed to get all unread counts:', err);
    return { channels: [], dms: [], totalUnread: 0 };
  }
};

// ============================================
// ORIGINAL FUNCTIONS (ENHANCED)
// ============================================

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
  // Fetch raw messages (exclude deleted)
  const { data: messages, error: msgErr } = await supabase
    .from("channel_messages")
    .select(`*, message_reactions (emoji, user_id)`)
    .eq("channel_id", channelId)
    .eq("is_deleted", false)
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

// Send channel message (with validation and rate limiting)
export const sendChannelMessage = async (channelId, content, userId) => {
  try {
    // Validate message
    const validation = validateMessage(content);
    if (!validation.isValid) {
      return { 
        data: null, 
        error: { message: validation.errors.join(', ') }
      };
    }
    
    // Check rate limit
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return {
        data: null,
        error: { 
          message: `Too many messages. Please wait ${rateLimit.waitSeconds} seconds.`,
          code: 'RATE_LIMIT',
          waitSeconds: rateLimit.waitSeconds
        }
      };
    }
    const { data, error } = await supabase
      .from("channel_messages")
      .insert({
        channel_id: channelId,
        user_id: userId,
        content: content.trim(),
        character_count: validation.characterCount,
        is_flagged: validation.hasProfanity,
        flag_reason: validation.hasProfanity ? `Auto-flagged: ${validation.flaggedWords.join(', ')}` : null
      })
      .select("*")
      .single();

    if (error) {
      console.error("[ChatServices] sendChannelMessage error:", error);
      return { data: null, error };
    }
    // Enrich with public profile
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
    .eq("is_deleted", false)
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

// Send direct message (with validation and rate limiting)
export const sendDirectMessage = async (conversationId, senderId, content) => {
  try {
    // Validate message
    const validation = validateMessage(content);
    if (!validation.isValid) {
      return { 
        data: null, 
        error: { message: validation.errors.join(', ') }
      };
    }
    
    // Check rate limit
    const rateLimit = await checkRateLimit(senderId);
    if (!rateLimit.allowed) {
      return {
        data: null,
        error: { 
          message: `Too many messages. Please wait ${rateLimit.waitSeconds} seconds.`,
          code: 'RATE_LIMIT',
          waitSeconds: rateLimit.waitSeconds
        }
      };
    }
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
        character_count: validation.characterCount,
        is_flagged: validation.hasProfanity,
        flag_reason: validation.hasProfanity ? `Auto-flagged: ${validation.flaggedWords.join(', ')}` : null
      })
      .select("*")
      .single();

    if (error) {
      console.error("[ChatServices] sendDirectMessage error:", error);
      return { data: null, error };
    }
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

// ============================================
// ADMIN MODERATION FUNCTIONS
// ============================================

// Fetch flagged messages for admin review
export const fetchFlaggedMessages = async () => {
  const { data, error } = await supabase
    .from("admin_flagged_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
};

// Fetch chat statistics for admin dashboard
export const fetchChatStatistics = async () => {
  const { data, error } = await supabase
    .from("admin_chat_statistics")
    .select("*")
    .single();

  return { data, error };
};

// Delete a message (soft delete - sets is_deleted = true)
export const deleteMessage = async (messageId, messageType, adminId) => {
  const table = messageType === 'channel' ? 'channel_messages' : 'direct_messages';
  
  const { error } = await supabase
    .from(table)
    .update({
      is_deleted: true,
      deleted_by: adminId,
      deleted_at: new Date().toISOString()
    })
    .eq("id", messageId);

  // Log the moderation action
  if (!error) {
    await supabase
      .from("message_moderation_log")
      .insert({
        message_id: messageId,
        message_type: messageType,
        action: 'deleted',
        moderator_id: adminId,
        reason: 'Admin deleted message'
      });
  }

  return { error };
};

// Unflag a message (mark as reviewed/safe)
export const unflagMessage = async (messageId, messageType, adminId) => {
  const table = messageType === 'channel' ? 'channel_messages' : 'direct_messages';
  
  const { error } = await supabase
    .from(table)
    .update({
      is_flagged: false,
      flag_reason: null
    })
    .eq("id", messageId);

  // Log the moderation action
  if (!error) {
    await supabase
      .from("message_moderation_log")
      .insert({
        message_id: messageId,
        message_type: messageType,
        action: 'unflagged',
        moderator_id: adminId,
        reason: 'Admin reviewed and cleared flag'
      });
  }

  return { error };
};

// Flag a message manually (for admin to mark suspicious content)
export const flagMessage = async (messageId, messageType, adminId, reason) => {
  const table = messageType === 'channel' ? 'channel_messages' : 'direct_messages';
  
  const { error } = await supabase
    .from(table)
    .update({
      is_flagged: true,
      flag_reason: reason,
      flagged_by: adminId,
      flagged_at: new Date().toISOString()
    })
    .eq("id", messageId);

  // Log the moderation action
  if (!error) {
    await supabase
      .from("message_moderation_log")
      .insert({
        message_id: messageId,
        message_type: messageType,
        action: 'flagged',
        moderator_id: adminId,
        reason: reason
      });
  }

  return { error };
};

// Fetch all channel messages for admin view
export const fetchAllChannelMessagesAdmin = async (filters = {}) => {
  let query = supabase
    .from("admin_channel_messages")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply optional filters
  if (filters.channelId) {
    query = query.eq("channel_id", filters.channelId);
  }
  if (filters.isFlagged !== undefined) {
    query = query.eq("is_flagged", filters.isFlagged);
  }
  if (filters.isDeleted !== undefined) {
    query = query.eq("is_deleted", filters.isDeleted);
  }
  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query;
  return { data, error };
};

// Subscribe to new flagged messages for admin real-time alerts
export const subscribeToFlaggedMessages = (callback) => {
  return supabase
    .channel("flagged_messages")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "channel_messages",
        filter: "is_flagged=eq.true",
      },
      (payload) => callback({ ...payload, messageType: 'channel' })
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "direct_messages",
        filter: "is_flagged=eq.true",
      },
      (payload) => callback({ ...payload, messageType: 'dm' })
    )
    .subscribe();
};
