import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

export default function ChatMonitoring() {
  const { hasPermission, userId: currentUserId } = usePermissions();
  
  const [viewMode, setViewMode] = useState('channels'); // 'channels' or 'dms'
  const [activeTab, setActiveTab] = useState('general');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // DM-related state
  const [dmList, setDmList] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (viewMode === 'channels') {
      loadMessages();
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    } else if (viewMode === 'dms' && activeConversation) {
      loadDMMessages();
      const unsubscribe = subscribeToDMMessages();
      return unsubscribe;
    }
  }, [activeTab, viewMode, activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channel_messages')
        .select(`
          id, 
          content, 
          created_at, 
          is_flagged, 
          flag_reason, 
          is_deleted, 
          user_id
        `)
        .eq('channel_id', activeTab)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      
      // Fetch user profiles - Use profiles table directly to get nickname
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(msg => msg.user_id))];
        
        // Get profiles with nickname and avatar emoji
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url, avatar_emoji')
          .in('id', userIds);
        
        // Get chats table for avatar emoji fallback
        const { data: chats } = await supabase
          .from('chats')
          .select('id, avatar')
          .in('id', userIds);
        
        // Get registration profiles to check if user is admin and avatar emoji
        const { data: regProfiles } = await supabase
          .from('registration_profiles')
          .select('user_id, role, avatar_emoji')
          .in('user_id', userIds);
        
        const profileMap = {};
        const chatsMap = {};
        const roleMap = {};
        
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }
        
        if (chats) {
          chats.forEach(chat => {
            chatsMap[chat.id] = chat;
          });
        }
        
        if (regProfiles) {
          regProfiles.forEach(reg => {
            roleMap[reg.user_id] = reg.role;
          });
        }
        
        const enrichedMessages = data.map(msg => {
          const profile = profileMap[msg.user_id];
          const chat = chatsMap[msg.user_id];
          const regProfile = regProfiles?.find(rp => rp.user_id === msg.user_id);
          
          // Priority: profiles.avatar_emoji > registration_profiles.avatar_emoji > chats.avatar > default
          const avatarEmoji = profile?.avatar_emoji || regProfile?.avatar_emoji || chat?.avatar || '😊';
          
          return {
            ...msg,
            user: {
              id: msg.user_id,
              username: profile?.nickname || 'User',
              avatar: avatarEmoji,
              isAdmin: regProfile?.role === 'admin' || regProfile?.role === 'community_manager'
            },
            isOwnMessage: msg.user_id === currentUserId
          };
        });
        
        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('admin-chat-'+activeTab)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_messages',
        filter: `channel_id=eq.${activeTab}`
      }, () => {
        loadMessages();
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await supabase.rpc('admin_post_message', {
        p_channel_id: activeTab,
        p_content: newMessage.trim()
      });
      
      if (error) throw error;
      
      // Log announcement if posted to announcements channel
      if (activeTab === 'announcements') {
        await supabase.rpc('log_admin_activity', {
          p_activity_type: 'announcement_posted',
          p_activity_category: 'admin',
          p_title: 'Announcement Posted',
          p_description: 'Admin posted an announcement to the community',
          p_metadata: {
            channel_id: activeTab,
            content_preview: newMessage.trim().substring(0, 100)
          }
        });
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message? This will replace the content with [DELETED].')) return;
    
    try {
      const { error } = await supabase
        .from('channel_messages')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message: ' + error.message);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // ============================================
  // DM-RELATED FUNCTIONS
  // ============================================

  const loadUsersList = async () => {
    setLoadingUsers(true);
    try {
      // Load existing conversations for the admin user
      const { data: conversations, error: convError } = await supabase
        .from('dm_conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (convError) throw convError;

      if (!conversations || conversations.length === 0) {
        console.log('No existing conversations found');
        setDmList([]);
        setLoadingUsers(false);
        return;
      }

      // Get all other user IDs (not the admin)
      const otherUserIds = conversations.map(conv => 
        conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id
      ).filter(id => id && id !== currentUserId);

      if (otherUserIds.length === 0) {
        setDmList([]);
        setLoadingUsers(false);
        return;
      }

      // Fetch profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_emoji')
        .in('id', otherUserIds);

      if (profileError) throw profileError;

      // Fetch subscription info (optional, use left join)
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('user_id, status, plan_name')
        .in('user_id', otherUserIds)
        .eq('status', 'active');

      // Create maps for quick lookup
      const profileMap = {};
      const subMap = {};

      if (profiles) {
        profiles.forEach(profile => {
          profileMap[profile.id] = profile;
        });
      }

      if (subscriptions) {
        subscriptions.forEach(sub => {
          subMap[sub.user_id] = sub;
        });
      }

      // Enrich conversations with user info
      const enrichedUsers = otherUserIds.map(userId => {
        const profile = profileMap[userId];
        const subscription = subMap[userId];
        const conversation = conversations.find(c => 
          c.user1_id === userId || c.user2_id === userId
        );

        return {
          id: userId,
          conversationId: conversation?.id,
          username: profile?.nickname || 'User',
          avatar: profile?.avatar_emoji || '👤',
          subscriptionPlan: subscription?.plan_name || 'Free',
          subscriptionStatus: subscription?.status || 'none',
        };
      });

      setDmList(enrichedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setDmList([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadDMMessages = async () => {
    if (!activeConversation) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          content,
          created_at,
          is_deleted,
          sender_id
        `)
        .eq('conversation_id', activeConversation.conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch sender profiles
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(msg => msg.sender_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_emoji')
          .in('id', senderIds);

        const profileMap = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }

        const enrichedMessages = data.map(msg => ({
          ...msg,
          user: {
            id: msg.sender_id,
            username: profileMap[msg.sender_id]?.nickname || 'User',
            avatar: profileMap[msg.sender_id]?.avatar_emoji || '👤',
            isAdmin: msg.sender_id === currentUserId
          },
          isOwnMessage: msg.sender_id === currentUserId
        }));

        setDmMessages(enrichedMessages);
      } else {
        setDmMessages([]);
      }
    } catch (error) {
      console.error('Error loading DM messages:', error);
      setDmMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDMMessages = () => {
    if (!activeConversation) return () => {};

    const subscription = supabase
      .channel(`admin-dm-${activeConversation.conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${activeConversation.conversationId}`
      }, () => {
        loadDMMessages();
      })
      .subscribe();
    
    return () => { subscription.unsubscribe(); };
  };

  const getOrCreateConversation = async (userId) => {
    try {
      // Check if conversation already exists
      const { data: existing, error: fetchError } = await supabase
        .from('dm_conversations')
        .select('*')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUserId})`)
        .single();

      if (existing) {
        return { data: existing, error: null };
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('dm_conversations')
        .insert({
          user1_id: currentUserId,
          user2_id: userId
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const openDM = async (user) => {
    // If user already has conversationId (from existing conversation), use it
    if (user.conversationId) {
      setActiveConversation({
        conversationId: user.conversationId,
        user: user
      });
      setViewMode('dms');
      return;
    }

    // Otherwise, create new conversation
    const { data: conversation, error } = await getOrCreateConversation(user.id);
    
    if (error || !conversation) {
      console.error('Error creating conversation:', error);
      alert('Failed to open conversation');
      return;
    }

    setActiveConversation({
      conversationId: conversation.id,
      user: user
    });
    setViewMode('dms');
  };

  const handleSendDM = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeConversation) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: activeConversation.conversationId,
          sender_id: currentUserId,
          content: newMessage.trim()
        });
      
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending DM:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteDM = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting DM:', error);
      alert('Failed to delete message: ' + error.message);
    }
  };

  // Load users when switching to DMs
  useEffect(() => {
    if (viewMode === 'dms' && dmList.length === 0) {
      loadUsersList();
    }
  }, [viewMode]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for DM user list */}
      {viewMode === 'dms' && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <p className="text-sm text-gray-500 mt-1">Select a user to message</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading users...</div>
              </div>
            ) : dmList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {dmList.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => openDM(user)}
                    className={`w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      activeConversation?.user.id === user.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl flex-shrink-0">
                      {user.avatar}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-gray-900 truncate">{user.username}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {user.subscriptionPlan} Plan
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Chat</h1>
          <p className="text-sm text-gray-500">Monitor and moderate community conversations</p>
        </div>

        {/* View Mode Switcher + Channel/DM Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex items-center gap-6">
            {/* View Mode Toggle */}
            <div className="flex gap-2 border-r border-gray-200 pr-6">
              <button
                onClick={() => {
                  setViewMode('channels');
                  setActiveConversation(null);
                }}
                className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                  viewMode === 'channels'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💬 Channels
              </button>
              <button
                onClick={() => setViewMode('dms')}
                className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                  viewMode === 'dms'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="inline-block w-4 h-4 mr-1" />
                Direct Messages
              </button>
            </div>

            {/* Channel Tabs (only show in channels mode) */}
            {viewMode === 'channels' && (
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'general'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  💬 General
                </button>
                {hasPermission('community_chat', 'all_channels') && (
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'announcements'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📢 ANNOUNCEMENTS
                  </button>
                )}
              </div>
            )}

            {/* Active Conversation Info (in DM mode) */}
            {viewMode === 'dms' && activeConversation && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-lg">
                  {activeConversation.user.avatar}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {activeConversation.user.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeConversation.user.subscriptionPlan} Plan
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : viewMode === 'dms' && !activeConversation ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Select a user to start messaging
            </h3>
            <p className="text-gray-500">
              Choose a user from the sidebar to send direct messages
            </p>
          </div>
        ) : (viewMode === 'channels' ? messages : dmMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">
              {viewMode === 'dms' ? '💬' : activeTab === 'general' ? '💬' : '📢'}
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500">
              {viewMode === 'dms'
                ? 'Start the conversation with this user'
                : activeTab === 'general' 
                  ? 'Be the first to start the conversation!' 
                  : 'Post an announcement to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {(viewMode === 'channels' ? messages : dmMessages).map((message) => {
              const isOwnMessage = message.isOwnMessage;
              const isAdmin = message.user?.isAdmin;
              
              return (
                <div key={message.id} className={`group ${isOwnMessage ? 'flex justify-end' : ''}`}>
                  {isOwnMessage ? (
                    // Admin's own messages - right aligned
                    <div className="flex items-start gap-3 max-w-[80%]">
                      {/* Delete Button (left side for own messages) */}
                      <button
                        onClick={() => viewMode === 'channels' ? handleDeleteMessage(message.id) : handleDeleteDM(message.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-600"
                        title="Delete message"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1 justify-end">
                          {message.is_flagged && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Flagged
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                          <span className="font-semibold text-gray-900">
                            You
                          </span>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg px-4 py-2.5 shadow-sm">
                          <p className="text-white text-sm leading-relaxed break-words">
                            {message.is_deleted ? '[DELETED]' : message.content}
                          </p>
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl border-2 border-blue-300">
                          {message.user?.avatar || '😊'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Other users' messages - left aligned
                    <div className="flex items-start gap-3 max-w-[80%]">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                          isAdmin 
                            ? 'bg-gradient-to-br from-orange-400 to-red-500 border-2 border-orange-300' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {message.user?.avatar || '😊'}
                        </div>
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`font-semibold ${isAdmin ? 'text-orange-600' : 'text-gray-900'}`}>
                            {message.user?.username || 'Unknown'}
                          </span>
                          {isAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Admin
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                          {message.is_flagged && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Flagged
                            </span>
                          )}
                        </div>
                        <div className={`rounded-lg px-4 py-2.5 shadow-sm border ${
                          message.is_deleted
                            ? 'bg-gray-100 border-gray-300'
                            : isAdmin 
                              ? 'bg-orange-50 border-orange-200' 
                              : 'bg-white border-gray-200'
                        }`}>
                          <p className={`text-sm leading-relaxed break-words ${
                            message.is_deleted ? 'text-gray-500 italic' : 'text-gray-800'
                          }`}>
                            {message.is_deleted ? '[DELETED]' : message.content}
                          </p>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => viewMode === 'channels' ? handleDeleteMessage(message.id) : handleDeleteDM(message.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-600"
                        title="Delete message"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={viewMode === 'channels' ? handleSendMessage : handleSendDM} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    viewMode === 'channels' ? handleSendMessage(e) : handleSendDM(e);
                  }
                }}
                placeholder={
                  viewMode === 'dms' && !activeConversation
                    ? 'Select a user to start messaging...'
                    : viewMode === 'dms'
                      ? `💬 Message ${activeConversation?.user.username}...`
                      : activeTab === 'announcements'
                        ? '📢 Post an announcement...'
                        : '💬 Type a message...'
                }
                disabled={viewMode === 'dms' && !activeConversation}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:text-gray-400"
                rows="2"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1 px-1">
                <span className="text-xs text-gray-500">
                  {viewMode === 'dms'
                    ? 'Press Enter to send, Shift+Enter for new line'
                    : activeTab === 'announcements' 
                      ? 'Announcements are visible to all users' 
                      : 'Press Enter to send, Shift+Enter for new line'}
                </span>
                <span className="text-xs text-gray-500">
                  {newMessage.length}/500
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || (viewMode === 'dms' && !activeConversation)}
              className={`flex-shrink-0 p-3 rounded-lg font-medium transition-all ${
                newMessage.trim() && !sending && (viewMode === 'channels' || activeConversation)
                  ? activeTab === 'announcements' && viewMode === 'channels'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}
