import {
  View,
  Text,
  Modal,
  Alert,
  Platform,
  FlatList,
  Animated,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../services/supabase";
import { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  fetchChannels,
  sendDirectMessage,
  updateOnlineStatus,
  sendChannelMessage,
  fetchDirectMessages,
  fetchChannelMessages,
  fetchUserConversations,
  getOrCreateConversation,
  subscribeToDirectMessages,
  subscribeToChannelMessages,
  getAllUnreadCounts,
  markChannelRead,
  markDMRead,
  MAX_MESSAGE_LENGTH,
} from "../../services/ChatServices";

export default function CommunityChat() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeDM, setActiveDM] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState("channels");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Data states
  const [channels, setChannels] = useState([]);
  const [channelMessages, setChannelMessages] = useState([]);
  const [dmList, setDmList] = useState([]);
  const [dmMessages, setDmMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Unread tracking
  const [unreadCounts, setUnreadCounts] = useState({ channels: [], dms: [], totalUnread: 0 });
  const [characterCount, setCharacterCount] = useState(0);
  const [rateLimitError, setRateLimitError] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const messageSubscription = useRef(null);
  const unreadSubscription = useRef(null);
  const flatListRef = useRef(null); // Add ref for FlatList to control scrolling

  // Get current user on mount
  useEffect(() => {
    getCurrentUser();
    loadChannels();
  }, []);

  // Load unread counts when user is available
  useEffect(() => {
    if (currentUser) {
      loadUnreadCounts();
      
      // Set up real-time unread count updates
      const interval = setInterval(loadUnreadCounts, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Animate on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Sidebar animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSidebar ? 0 : -280,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar]);

  // Load messages when channel/DM changes
  useEffect(() => {
    if (activeChannel && viewMode === "channels") {
      loadChannelMessages();
      setupChannelSubscription();
    }
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
    };
  }, [activeChannel]);

  useEffect(() => {
    if (activeConversationId && viewMode === "dms") {
      loadDMMessages();
      setupDMSubscription();
    }
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
    };
  }, [activeConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && currentMessages.length > 0) {
      // Delay scroll to ensure FlatList has rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [channelMessages, dmMessages, viewMode]);

  // Update online status
  useEffect(() => {
    if (currentUser) {
      updateOnlineStatus(currentUser.id, true);

      // Update status to offline when component unmounts
      return () => {
        updateOnlineStatus(currentUser.id, false);
      };
    }
  }, [currentUser]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("[CommunityChat] getCurrentUser auth user:", user);
    if (user) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("chats")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("[CommunityChat] getCurrentUser profile:", profile);

      if (profile) {
        setCurrentUser(profile);
      } else {
        // Create minimal chats profile so joins and displays work correctly
        console.warn(
          "[CommunityChat] user profile not found in 'chats' table; creating a minimal profile"
        );

        try {
          const username =
            user.user_metadata?.nickname ||
            (user.email ? user.email.split("@")[0] : "user");

          const { data: created, error: createErr } = await supabase
            .from("chats")
            .insert({
              id: user.id,
              username,
              avatar: user.user_metadata?.avatar || "😊",
              is_online: true,
            })
            .select("*")
            .single();

          if (createErr) {
            console.error(
              "[CommunityChat] failed to create chats profile:",
              createErr
            );
            // fallback minimal object to avoid crash
            setCurrentUser({
              id: user.id,
              username,
              avatar: user.user_metadata?.avatar || "?",
              is_online: true,
            });
          } else {
            console.log("[CommunityChat] created chats profile:", created);
            setCurrentUser(created);
          }
        } catch (err) {
          console.error(
            "[CommunityChat] unexpected error creating chats profile:",
            err
          );
          setCurrentUser({
            id: user.id,
            username: user.email ? user.email.split("@")[0] : "user",
            avatar: "?",
            is_online: true,
          });
        }
      }

      loadUserConversations(user.id);
    } else {
      // Redirect to login if not authenticated
      Alert.alert("Not authenticated", "Please log in first");
      router.back();
    }
  };

  const loadChannels = async () => {
    setLoading(true);
    const { data, error } = await fetchChannels();
    if (data) {
      // Group channels by category
      const grouped = data.reduce((acc, channel) => {
        const category = acc.find((c) => c.name === channel.category);
        if (category) {
          category.channels.push({
            id: channel.id,
            name: channel.name,
            icon: channel.icon,
            unread: 0, // TODO: Calculate unread count
          });
        } else {
          acc.push({
            name: channel.category,
            channels: [
              {
                id: channel.id,
                name: channel.name,
                icon: channel.icon,
                unread: 0,
              },
            ],
          });
        }
        return acc;
      }, []);
      setChannels(grouped);
    }
    setLoading(false);
  };

  const loadChannelMessages = async () => {
    const { data, error } = await fetchChannelMessages(activeChannel);
    if (data) {
      const formattedMessages = data.map((msg) => ({
        id: msg.id,
        user: msg.chats.username,
        avatar: msg.chats.avatar,
        text: msg.content,
        timestamp: formatTimestamp(msg.created_at),
        isOnline: msg.chats.is_online,
        isMe: msg.user_id === currentUser?.id, // Check if it's my message
        userId: msg.user_id, // Add userId for DM functionality
        reactions: groupReactions(msg.message_reactions || []),
      }));
      setChannelMessages(formattedMessages);
    }
  };

  const loadUserConversations = async (userId) => {
    const { data, error } = await fetchUserConversations(userId);
    if (data) {
      const formattedDMs = data.map((conv) => {
        // Determine which user is the other person
        const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
        const messages = conv.direct_messages || [];
        const lastMsg = messages[messages.length - 1];

        // Count unread messages
        const unreadCount = messages.filter(
          (m) => !m.is_read && m.sender_id !== userId
        ).length;

        return {
          id: conv.id,
          userId: otherUser.id,
          user: otherUser.username,
          avatar: otherUser.avatar,
          lastMessage: lastMsg?.content || "Start chatting...",
          timestamp: lastMsg ? formatTimestamp(lastMsg.created_at) : "Just now",
          isOnline: otherUser.is_online,
          unread: unreadCount,
        };
      });
      setDmList(formattedDMs);
    }
  };

  const loadDMMessages = async () => {
    const { data, error } = await fetchDirectMessages(activeConversationId);
    if (data) {
      const formattedMessages = data.map((msg) => ({
        id: msg.id,
        user: msg.chats.username,
        avatar: msg.chats.avatar,
        text: msg.content,
        timestamp: formatTimestamp(msg.created_at),
        isOnline: msg.chats.is_online,
        isMe: msg.sender_id === currentUser.id,
      }));
      setDmMessages(formattedMessages);
    }
  };

  const setupChannelSubscription = () => {
    if (messageSubscription.current) {
      messageSubscription.current.unsubscribe();
    }

    messageSubscription.current = subscribeToChannelMessages(
      activeChannel,
      (payload) => {
        try {
          const data = payload.new;
          const newMessage = {
            id: data.id,
            user: data.chats?.username || "unknown",
            avatar: data.chats?.avatar || "👤",
            text: data.content,
            timestamp: formatTimestamp(data.created_at),
            isOnline: data.chats?.is_online || false,
            isMe: data.user_id === currentUser?.id,
            userId: data.user_id,
            reactions: data.message_reactions || [],
          };
          setChannelMessages((prev) => [...prev, newMessage]);
          
          // Reload unread counts for real-time badge updates
          loadUnreadCounts();
        } catch (err) {
          console.warn(
            "[CommunityChat] failed to handle channel realtime payload",
            err
          );
        }
      }
    );
  };

  const setupDMSubscription = () => {
    if (messageSubscription.current) {
      messageSubscription.current.unsubscribe();
    }

    messageSubscription.current = subscribeToDirectMessages(
      activeConversationId,
      (payload) => {
        try {
          const data = payload.new;
          const newMessage = {
            id: data.id,
            user: data.chats?.username || "unknown",
            avatar: data.chats?.avatar || "?",
            text: data.content,
            timestamp: formatTimestamp(data.created_at),
            isOnline: data.chats?.is_online || false,
            isMe: data.sender_id === currentUser.id,
          };
          setDmMessages((prev) => [...prev, newMessage]);
          
          // Reload unread counts for real-time badge updates
          loadUnreadCounts();
        } catch (err) {
          console.warn(
            "[CommunityChat] failed to handle DM realtime payload",
            err
          );
        }
      }
    );
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (sending) {
      console.warn("[CommunityChat] send ignored - already sending");
      return;
    }

    setSending(true);
    setRateLimitError(null);

    const payloadPreview = message.trim().slice(0, 140);
    if (!currentUser || !currentUser.id) {
      console.error(
        "[CommunityChat] abort send - currentUser missing",
        currentUser
      );
      Alert.alert(
        "Not ready",
        "Your user profile is not loaded yet. Try again in a moment."
      );
      setMessage("");
      setCharacterCount(0);
      setSending(false);
      return;
    }
    console.log("[CommunityChat] handleSendMessage start", {
      viewMode,
      activeChannel,
      activeConversationId,
      userId: currentUser?.id,
      preview: payloadPreview,
    });

    // Safety: ensure sending flag clears even if remote call hangs
    let cleared = false;
    const clearSending = (reason) => {
      if (!cleared) {
        cleared = true;
        setSending(false);
        console.log(`[CommunityChat] sending cleared (${reason})`);
      }
    };

    try {
      if (viewMode === "channels") {
        const { data, error } = await sendChannelMessage(
          activeChannel,
          message.trim(),
          currentUser.id
        );

        if (error) {
          console.error(
            "[CommunityChat] sendChannelMessage returned error",
            error
          );
          
          // Handle rate limit error
          if (error.code === 'RATE_LIMIT') {
            setRateLimitError(`Too many messages. Please wait ${error.waitSeconds} seconds.`);
            setTimeout(() => setRateLimitError(null), error.waitSeconds * 1000);
          } else {
            Alert.alert("Error", error.message || "Failed to send message");
          }
        } else {
          console.log("[CommunityChat] channel message sent", { id: data?.id });
          setMessage("");
          setCharacterCount(0);
        }
      } else if (activeConversationId) {
        const { data, error } = await sendDirectMessage(
          activeConversationId,
          currentUser.id,
          message.trim()
        );

        if (error) {
          console.error(
            "[CommunityChat] sendDirectMessage returned error",
            error
          );
          
          // Handle rate limit error
          if (error.code === 'RATE_LIMIT') {
            setRateLimitError(`Too many messages. Please wait ${error.waitSeconds} seconds.`);
            setTimeout(() => setRateLimitError(null), error.waitSeconds * 1000);
          } else {
            Alert.alert("Error", error.message || "Failed to send message");
          }
        } else {
          console.log("[CommunityChat] direct message sent", { id: data?.id });
          setMessage("");
          setCharacterCount(0);
        }
      } else {
        console.warn("[CommunityChat] no active target to send message to");
      }
    } catch (err) {
      console.error("[CommunityChat] unexpected error sending message", err);
      Alert.alert("Error", "An unexpected error occurred while sending");
    } finally {
      clearSending("finished");
    }

    // Fallback timeout: if sending isn't cleared for reason, force clear after 8s
    setTimeout(() => {
      if (sending) {
        console.warn(
          "[CommunityChat] sending flag still true after timeout, forcing clear"
        );
        clearSending("timeout");
      }
    }, 8000);
  };

  const startDMWithUser = async (username, userId, avatar, isOnline) => {
    // Check if conversation already exists
    const existingDM = dmList.find((dm) => dm.userId === userId);

    if (existingDM) {
      openDM(existingDM.id);
    } else {
      // Create new conversation
      const { data, error } = await getOrCreateConversation(
        currentUser.id,
        userId
      );

      if (data) {
        const newDM = {
          id: data.id,
          userId: userId,
          user: username,
          avatar: avatar,
          lastMessage: "Start chatting...",
          timestamp: "Just now",
          isOnline: isOnline,
          unread: 0,
        };

        setDmList((prev) => [newDM, ...prev]);
        openDM(data.id);
      } else {
        Alert.alert("Error", "Failed to create conversation");
      }
    }
  };

  const openDM = async (conversationId) => {
    setActiveConversationId(conversationId);
    setActiveDM(conversationId);
    setActiveChannel("");
    setViewMode("dms");
    closeSidebar();
    
    // Mark DM as read after messages load
    setTimeout(async () => {
      if (currentUser && dmMessages.length > 0) {
        const lastMsg = dmMessages[dmMessages.length - 1];
        await markDMRead(currentUser.id, conversationId, lastMsg.id);
        loadUnreadCounts();
      }
    }, 500);
  };

  const openChannel = async (channelId) => {
    setActiveChannel(channelId);
    setActiveDM(null);
    setActiveConversationId(null);
    setViewMode("channels");
    closeSidebar();
    
    // Mark channel as read after messages load
    setTimeout(async () => {
      if (currentUser && channelMessages.length > 0) {
        const lastMsg = channelMessages[channelMessages.length - 1];
        await markChannelRead(currentUser.id, channelId, lastMsg.id);
        loadUnreadCounts();
      }
    }, 500);
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);
  const closeSidebar = () => setShowSidebar(false);

  const switchToChannels = () => {
    setViewMode("channels");
    setActiveDM(null);
    setActiveConversationId(null);
  };

  const switchToDMs = () => {
    setViewMode("dms");
    setActiveChannel("");
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const groupReactions = (reactions) => {
    const grouped = {};
    reactions.forEach((r) => {
      if (grouped[r.emoji]) {
        grouped[r.emoji].count++;
      } else {
        grouped[r.emoji] = { emoji: r.emoji, count: 1 };
      }
    });
    return Object.values(grouped);
  };

  // Load unread counts for all channels and DMs
  const loadUnreadCounts = async () => {
    if (!currentUser) return;
    
    const { data, error } = await getAllUnreadCounts(currentUser.id);
    if (data && !error) {
      setUnreadCounts(data);
    }
  };

  // Get unread count for specific channel
  const getChannelUnreadCount = (channelId) => {
    const unread = unreadCounts.channels.find(c => c.channel_id === channelId);
    return unread?.unread_count || 0;
  };

  // Get unread count for specific DM
  const getDMUnreadCount = (conversationId) => {
    const unread = unreadCounts.dms.find(d => d.conversation_id === conversationId);
    return unread?.unread_count || 0;
  };

  const currentMessages = viewMode === "dms" ? dmMessages : channelMessages;

  const getHeaderTitle = () => {
    if (activeDM) {
      const dm = dmList.find((d) => d.id === activeDM);
      return dm?.user || "Direct Message";
    }
    return "Community Chat";
  };

  const getHeaderSubtitle = () => {
    if (activeDM) {
      const dm = dmList.find((d) => d.id === activeDM);
      return dm?.isOnline ? "Online" : "Offline";
    }
    return `#${activeChannel}`;
  };

  const renderChannelCategory = ({ item }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      {item.channels.map((channel) => {
        const unreadCount = getChannelUnreadCount(channel.id);
        return (
          <Pressable
            key={channel.id}
            style={[
              styles.channelItem,
              activeChannel === channel.id && styles.activeChannelItem,
            ]}
            onPress={() => openChannel(channel.id)}
          >
            <MaterialCommunityIcons
              name={channel.icon}
              size={18}
              color={activeChannel === channel.id ? "#fff" : "#aaa"}
              style={styles.channelIcon}
            />
            <Text
              style={[
                styles.channelName,
                activeChannel === channel.id && styles.activeChannelName,
              ]}
            >
              {channel.name}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  const renderDMItem = ({ item }) => {
    const unreadCount = getDMUnreadCount(item.id);
    return (
      <Pressable
        style={[styles.dmItem, activeDM === item.id && styles.activeDMItem]}
        onPress={() => openDM(item.id)}
      >
        <View style={styles.dmAvatarContainer}>
          <Text style={styles.dmAvatar}>{item.avatar}</Text>
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.dmContent}>
          <View style={styles.dmHeader}>
            <Text style={styles.dmUsername}>{item.user}</Text>
            <Text style={styles.dmTimestamp}>{item.timestamp}</Text>
          </View>
          <Text style={styles.dmLastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.dmUnreadBadge}>
            <Text style={styles.unreadCount}>{unreadCount}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderMessage = ({ item }) => {
    const isDM = viewMode === "dms";
    const isMyMessage = item.isMe; // Works for both channels and DMs now

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage && styles.myMessageContainer,
        ]}
      >
        <View style={[styles.messageCard, isMyMessage && styles.myMessageCard]}>
          <View style={styles.messageHeader}>
            <Pressable
              style={styles.userInfo}
              onPress={() => {
                if (!isDM && !isMyMessage && currentUser) {
                  // Get user ID from the message to start DM
                  startDMWithUser(
                    item.user,
                    item.userId,
                    item.avatar,
                    item.isOnline
                  );
                }
              }}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.userAvatar}>{item.avatar || '👤'}</Text>
                {item.isOnline && <View style={styles.onlineIndicator} />}
              </View>
              <Text style={styles.userName}>
                @{item.user || 'unknown'}
                {isMyMessage && (
                  <Text style={styles.youLabel}> (You)</Text>
                )}
              </Text>
              <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
            </Pressable>
          </View>
          <Text
            style={[styles.messageText, isMyMessage && styles.myMessageText]}
          >
            {item.text}
          </Text>
          {isMyMessage && (
            <Text style={styles.myMessageTimestamp}>{item.timestamp}</Text>
          )}
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((reaction, idx) => (
                <View key={idx} style={styles.reactionItem}>
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
              <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={toggleSidebar} style={styles.headerButton}>
              <MaterialCommunityIcons name="menu" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          <View style={styles.chatArea}>
            <FlatList
              ref={flatListRef}
              style={styles.messagesList}
              data={currentMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => {
                // Also scroll on content size change (when new messages added)
                flatListRef.current?.scrollToEnd({ animated: true });
              }}
              ListHeaderComponent={
                !activeDM && (
                  <View style={styles.channelIntro}>
                    <View style={styles.channelIconLarge}>
                      <MaterialCommunityIcons
                        name={
                          channels
                            .flatMap((c) => c.channels)
                            .find((ch) => ch.id === activeChannel)?.icon ||
                          "chat"
                        }
                        size={32}
                        color="#fff"
                      />
                    </View>
                    <Text style={styles.channelIntroTitle}>
                      Welcome to #{activeChannel}!
                    </Text>
                    <Text style={styles.channelIntroText}>
                      This is the start of the #{activeChannel} channel.
                    </Text>
                  </View>
                )
              }
            />

            {/* Rate Limit Error Banner */}
            {rateLimitError && (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#991b1b" />
                <Text style={styles.errorText}>{rateLimitError}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Pressable style={styles.attachButton}>
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={24}
                    color="#aaa"
                  />
                </Pressable>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      activeDM
                        ? `Message ${
                            dmList.find((d) => d.id === activeDM)?.user
                          }...`
                        : `Message #${activeChannel}...`
                    }
                    placeholderTextColor="#888"
                    value={message}
                    onChangeText={(text) => {
                      if (text.length <= MAX_MESSAGE_LENGTH) {
                        setMessage(text);
                        setCharacterCount(text.length);
                      }
                    }}
                    multiline
                    maxLength={MAX_MESSAGE_LENGTH}
                  />
                  <Text style={[
                    styles.characterCounter,
                    { color: characterCount >= MAX_MESSAGE_LENGTH ? '#ef4444' : '#9ca3af' }
                  ]}>
                    {characterCount}/{MAX_MESSAGE_LENGTH}
                  </Text>
                </View>
                <Pressable style={styles.emojiButton}>
                  <MaterialCommunityIcons
                    name="emoticon-happy-outline"
                    size={22}
                    color="#aaa"
                  />
                </Pressable>
                <Pressable
                  onPress={handleSendMessage}
                  style={[
                    styles.sendButton,
                    { opacity: message.trim() && !sending ? 1 : 0.5 },
                  ]}
                  disabled={!message.trim() || sending}
                >
                  <LinearGradient
                    colors={["#FF6B6B", "#4ECDC4"]}
                    style={styles.sendButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={18} color="#fff" />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        <Modal
          visible={showSidebar}
          transparent
          animationType="none"
          onRequestClose={closeSidebar}
        >
          <Pressable style={styles.overlay} onPress={closeSidebar}>
            <Animated.View
              style={[
                styles.sidebar,
                { transform: [{ translateX: slideAnim }] },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Fitness Community</Text>
                <Pressable onPress={closeSidebar} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.modeSwitcher}>
                <Pressable
                  style={[
                    styles.modeButton,
                    viewMode === "channels" && styles.activeModeButton,
                  ]}
                  onPress={switchToChannels}
                >
                  <MaterialCommunityIcons
                    name="forum"
                    size={20}
                    color={viewMode === "channels" ? "#fff" : "#888"}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      viewMode === "channels" && styles.activeModeButtonText,
                    ]}
                  >
                    Channels
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modeButton,
                    viewMode === "dms" && styles.activeModeButton,
                  ]}
                  onPress={switchToDMs}
                >
                  <MaterialCommunityIcons
                    name="message"
                    size={20}
                    color={viewMode === "dms" ? "#fff" : "#888"}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      viewMode === "dms" && styles.activeModeButtonText,
                    ]}
                  >
                    Messages
                  </Text>
                  {dmList.filter((dm) => dm.unread > 0).length > 0 && (
                    <View style={styles.modeBadge}>
                      <Text style={styles.unreadCount}>
                        {dmList.reduce((sum, dm) => sum + dm.unread, 0)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {viewMode === "channels" ? (
                <FlatList
                  data={channels}
                  renderItem={renderChannelCategory}
                  keyExtractor={(item) => item.name}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.channelsList}
                />
              ) : (
                <FlatList
                  data={dmList}
                  renderItem={renderDMItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dmList}
                />
              )}
            </Animated.View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    marginRight: 15,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    color: "#aaa",
    textTransform: "capitalize",
  },
  headerRight: {
    flexDirection: "row",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  mainContent: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sidebar: {
    width: 280,
    elevation: 5,
    height: "100%",
    paddingTop: 60,
    shadowRadius: 8,
    shadowOpacity: 0.8,
    shadowColor: "#000",
    backgroundColor: "#1a1a1a",
    shadowOffset: { width: 2, height: 0 },
  },
  sidebarHeader: {
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  sidebarTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  modeSwitcher: {
    gap: 10,
    padding: 15,
    flexDirection: "row",
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  activeModeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  modeButtonText: {
    fontSize: 14,
    color: "#888",
    marginLeft: 8,
    fontWeight: "600",
  },
  activeModeButtonText: {
    color: "#fff",
  },
  modeBadge: {
    top: -4,
    right: -4,
    height: 18,
    minWidth: 18,
    borderRadius: 9,
    alignItems: "center",
    paddingHorizontal: 5,
    position: "absolute",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
  },
  channelsList: {
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 11,
    color: "#888",
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    textTransform: "uppercase",
  },
  channelItem: {
    marginBottom: 4,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  activeChannelItem: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  channelIcon: {
    marginRight: 10,
  },
  channelName: {
    flex: 1,
    fontSize: 14,
    color: "#aaa",
    fontWeight: "500",
  },
  activeChannelName: {
    color: "#fff",
    fontWeight: "600",
  },
  unreadBadge: {
    height: 20,
    minWidth: 20,
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 6,
    justifyContent: "center",
    backgroundColor: "#e74c3c",
  },
  unreadCount: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "bold",
  },

  // DM List
  dmList: {
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  dmItem: {
    marginBottom: 4,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  activeDMItem: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  dmAvatarContainer: {
    marginRight: 12,
    position: "relative",
  },
  dmAvatar: {
    fontSize: 24,
  },
  dmContent: {
    flex: 1,
  },
  dmHeader: {
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dmUsername: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
  dmTimestamp: {
    fontSize: 11,
    color: "#888",
  },
  dmLastMessage: {
    fontSize: 13,
    color: "#aaa",
  },
  dmUnreadBadge: {
    height: 20,
    minWidth: 20,
    marginLeft: 8,
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 6,
    justifyContent: "center",
    backgroundColor: "#e74c3c",
  },

  // Chat Area
  chatArea: {
    flex: 1,
    marginBottom: 20,
  },

  // Channel Intro
  channelIntro: {
    paddingVertical: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  channelIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  channelIntroTitle: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "capitalize",
  },
  channelIntroText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },

  // Messages
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 10,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  messageCard: {
    padding: 16,
    borderRadius: 16,
    maxWidth: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  myMessageCard: {
    backgroundColor: "rgba(78, 205, 196, 0.2)",
  },
  messageHeader: {
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 10,
    position: "relative",
  },
  userAvatar: {
    fontSize: 20,
  },
  onlineIndicator: {
    right: 0,
    width: 10,
    bottom: 0,
    height: 10,
    borderWidth: 2,
    borderRadius: 5,
    position: "absolute",
    borderColor: "#1a1a1a",
    backgroundColor: "#00ff88",
  },
  userName: {
    fontSize: 16,
    color: "#fff",
    marginRight: 10,
    fontWeight: "600",
  },
  youLabel: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "400",
    fontStyle: "italic",
  },
  messageTimestamp: {
    fontSize: 12,
    color: "#888",
  },
  messageText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  myMessageText: {
    color: "#fff",
  },
  myMessageTimestamp: {
    fontSize: 11,
    marginTop: 6,
    color: "#ccc",
    textAlign: "right",
  },

  // Reactions
  reactionsContainer: {
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  reactionItem: {
    borderRadius: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },

  inputContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  inputWrapper: {
    borderRadius: 24,
    paddingVertical: 10,
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  attachButton: {
    padding: 4,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    maxHeight: 100,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  characterCounter: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  emojiButton: {
    padding: 4,
    marginLeft: 12,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
  },
});
