import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

export default function ChatMonitoring() {
  const { hasPermission, userId: currentUserId } = usePermissions();
  
  const [activeTab, setActiveTab] = useState('general');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [activeTab]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Chat</h1>
        <p className="text-sm text-gray-500">Monitor and moderate community conversations</p>
      </div>

      {/* Channel Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">{activeTab === 'general' ? '💬' : '📢'}</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500">
              {activeTab === 'general' 
                ? 'Be the first to start the conversation!' 
                : 'Post an announcement to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => {
              const isOwnMessage = message.isOwnMessage;
              const isAdmin = message.user?.isAdmin;
              
              return (
                <div key={message.id} className={`group ${isOwnMessage ? 'flex justify-end' : ''}`}>
                  {isOwnMessage ? (
                    // Admin's own messages - right aligned
                    <div className="flex items-start gap-3 max-w-[80%]">
                      {/* Delete Button (left side for own messages) */}
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
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
                        onClick={() => handleDeleteMessage(message.id)}
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
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={
                  activeTab === 'announcements'
                    ? '📢 Post an announcement...'
                    : '💬 Type a message...'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1 px-1">
                <span className="text-xs text-gray-500">
                  {activeTab === 'announcements' 
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
              disabled={!newMessage.trim() || sending}
              className={`flex-shrink-0 p-3 rounded-lg font-medium transition-all ${
                newMessage.trim() && !sending
                  ? activeTab === 'announcements'
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
  );
}
