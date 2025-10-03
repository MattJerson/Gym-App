import {
  View,
  Text,
  Platform,
  FlatList,
  Animated,
  TextInput,
  Pressable,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function CommunityChat() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeDM, setActiveDM] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState("channels"); // 'channels' or 'dms'
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSidebar ? 0 : -280,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar]);

  // Direct Messages
  const directMessages = [
    {
      id: "dm1",
      user: "FitMike92",
      avatar: "👨‍💼",
      lastMessage: "Thanks for the workout tips!",
      timestamp: "2m ago",
      isOnline: true,
      unread: 2,
    },
    {
      id: "dm2",
      user: "HealthyHannah",
      avatar: "👩‍🦰",
      lastMessage: "Did you see the new challenge?",
      timestamp: "1h ago",
      isOnline: true,
      unread: 0,
    },
    {
      id: "dm3",
      user: "ProteinPaul",
      avatar: "🧔",
      lastMessage: "Let's do a workout together tomorrow",
      timestamp: "3h ago",
      isOnline: false,
      unread: 1,
    },
  ];

  // DM conversation data
  const dmConversations = {
    dm1: [
      {
        id: 1,
        user: "FitMike92",
        avatar: "👨‍💼",
        text: "Hey! I saw your progress post, amazing work! 💪",
        timestamp: "10:30 AM",
        isMe: false,
      },
      {
        id: 2,
        user: "You",
        avatar: "😊",
        text: "Thanks so much! Been working really hard on it",
        timestamp: "10:32 AM",
        isMe: true,
      },
      {
        id: 3,
        user: "FitMike92",
        avatar: "👨‍💼",
        text: "Thanks for the workout tips!",
        timestamp: "10:35 AM",
        isMe: false,
      },
    ],
    dm2: [
      {
        id: 1,
        user: "HealthyHannah",
        avatar: "👩‍🦰",
        text: "Did you see the new challenge?",
        timestamp: "1 hour ago",
        isMe: false,
      },
    ],
    dm3: [
      {
        id: 1,
        user: "ProteinPaul",
        avatar: "🧔",
        text: "Let's do a workout together tomorrow",
        timestamp: "3 hours ago",
        isMe: false,
      },
    ],
  };

  // Channel categories
  const channelCategories = [
    {
      name: "FITNESS",
      channels: [
        { id: "general", name: "General", icon: "chat", unread: 3 },
        {
          id: "announcement",
          name: "Announcement",
          icon: "megaphone",
          unread: 0,
        },
      ],
    },
    {
      name: "WORKOUTS",
      channels: [
        { id: "workouts", name: "Workouts", icon: "dumbbell", unread: 12 },
        { id: "nutrition", name: "Nutrition", icon: "food-apple", unread: 0 },
        { id: "progress", name: "Progress", icon: "trending-up", unread: 5 },
      ],
    },
    {
      name: "COMMUNITY",
      channels: [
        { id: "motivation", name: "Motivation", icon: "fire", unread: 8 },
        { id: "off-topic", name: "Off-topic", icon: "chat-outline", unread: 0 },
      ],
    },
  ];

  const channelMessages = {
    general: [
      {
        id: 1,
        user: "FitMike92",
        avatar: "👨‍💼",
        text: "Good morning everyone! Ready to crush today's workout? 💪",
        timestamp: "9:23 AM",
        isOnline: true,
        reactions: [
          { emoji: "💪", count: 5 },
          { emoji: "🔥", count: 3 },
        ],
      },
      {
        id: 2,
        user: "HealthyHannah",
        avatar: "👩‍🦰",
        text: "Just finished my morning run! The weather is perfect today 🌅",
        timestamp: "9:45 AM",
        isOnline: true,
        reactions: [
          { emoji: "🏃‍♀️", count: 2 },
          { emoji: "☀️", count: 6 },
        ],
      },
      {
        id: 3,
        user: "ProteinPaul",
        avatar: "🧔",
        text: "Anyone tried the new HIIT workout? Looks intense! 🔥",
        timestamp: "10:12 AM",
        isOnline: false,
        reactions: [{ emoji: "🔥", count: 8 }],
      },
    ],
    workouts: [
      {
        id: 1,
        user: "StrengthSarah",
        avatar: "💪",
        text: "PRed my deadlift today! 185lbs x5 💪 Feeling amazing!",
        timestamp: "8:30 AM",
        isOnline: true,
        reactions: [
          { emoji: "💪", count: 12 },
          { emoji: "🎉", count: 8 },
        ],
      },
    ],
    nutrition: [
      {
        id: 1,
        user: "MealPrepMaster",
        avatar: "🍽️",
        text: "Sharing my weekly meal prep! High protein, low carb 📸",
        timestamp: "7:45 AM",
        isOnline: false,
        reactions: [{ emoji: "😍", count: 15 }],
      },
    ],
    progress: [
      {
        id: 1,
        user: "TransformTom",
        avatar: "📈",
        text: "6 months progress update! Down 30lbs and feeling incredible!",
        timestamp: "Yesterday",
        isOnline: false,
        reactions: [{ emoji: "🎉", count: 25 }],
      },
    ],
    motivation: [
      {
        id: 1,
        user: "MotivationMegan",
        avatar: "🔥",
        text: "Remember: You don't have to be perfect, you just have to be consistent! 💯",
        timestamp: "Yesterday",
        isOnline: true,
        reactions: [{ emoji: "💯", count: 30 }],
      },
    ],
  };

  const currentMessages = activeDM
    ? dmConversations[activeDM] || []
    : channelMessages[activeChannel] || [];

  const sendMessage = () => {
    if (message.trim()) {
      console.log(
        `Sending message to ${
          activeDM ? activeDM : `#${activeChannel}`
        }: ${message}`
      );
      setMessage("");
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  const switchToChannels = () => {
    setViewMode("channels");
    setActiveDM(null);
  };

  const switchToDMs = () => {
    setViewMode("dms");
    setActiveChannel("");
  };

  const openDM = (dmId) => {
    setActiveDM(dmId);
    setActiveChannel("");
    setViewMode("dms");
    closeSidebar();
  };

  const openChannel = (channelId) => {
    setActiveChannel(channelId);
    setActiveDM(null);
    setViewMode("channels");
    closeSidebar();
  };

  const renderChannelCategory = ({ item }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      {item.channels.map((channel) => (
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
          {channel.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{channel.unread}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderDMItem = ({ item }) => (
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
      {item.unread > 0 && (
        <View style={styles.dmUnreadBadge}>
          <Text style={styles.unreadCount}>{item.unread}</Text>
        </View>
      )}
    </Pressable>
  );

  const renderMessage = ({ item }) => {
    const isDM = activeDM !== null;
    const isMyMessage = isDM && item.isMe;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage && styles.myMessageContainer,
        ]}
      >
        <View style={[styles.messageCard, isMyMessage && styles.myMessageCard]}>
          {!isMyMessage && (
            <View style={styles.messageHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.userAvatar}>{item.avatar}</Text>
                  {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <Text style={styles.userName}>{item.user}</Text>
                <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
              </View>
            </View>
          )}
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

  const getHeaderTitle = () => {
    if (activeDM) {
      const dm = directMessages.find((d) => d.id === activeDM);
      return dm ? dm.user : "Direct Message";
    }
    return "Community Chat";
  };

  const getHeaderSubtitle = () => {
    if (activeDM) {
      const dm = directMessages.find((d) => d.id === activeDM);
      return dm?.isOnline ? "Online" : "Offline";
    }
    return `#${activeChannel}`;
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
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
          {/* Chat Area */}
          <View style={styles.chatArea}>
            <FlatList
              style={styles.messagesList}
              data={currentMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContainer}
              ListHeaderComponent={
                !activeDM && (
                  <View style={styles.channelIntro}>
                    <View style={styles.channelIconLarge}>
                      <MaterialCommunityIcons
                        name={
                          channelCategories
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

            {/* Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Pressable style={styles.attachButton}>
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={24}
                    color="#aaa"
                  />
                </Pressable>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    activeDM
                      ? `Message ${
                          directMessages.find((d) => d.id === activeDM)?.user
                        }...`
                      : `Message #${activeChannel}...`
                  }
                  placeholderTextColor="#888"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                />
                <Pressable style={styles.emojiButton}>
                  <MaterialCommunityIcons
                    name="emoticon-happy-outline"
                    size={22}
                    color="#aaa"
                  />
                </Pressable>
                <Pressable
                  onPress={sendMessage}
                  style={[
                    styles.sendButton,
                    { opacity: message.trim() ? 1 : 0.5 },
                  ]}
                  disabled={!message.trim()}
                >
                  <LinearGradient
                    colors={["#FF6B6B", "#4ECDC4"]}
                    style={styles.sendButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Discord-style Sidebar Overlay */}
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

              {/* Mode Switcher */}
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
                  {directMessages.filter((dm) => dm.unread > 0).length > 0 && (
                    <View style={styles.modeBadge}>
                      <Text style={styles.unreadCount}>
                        {directMessages.reduce((sum, dm) => sum + dm.unread, 0)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Content */}
              {viewMode === "channels" ? (
                <FlatList
                  data={channelCategories}
                  renderItem={renderChannelCategory}
                  keyExtractor={(item) => item.name}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.channelsList}
                />
              ) : (
                <FlatList
                  data={directMessages}
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

  // Discord-style Sidebar
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sidebar: {
    width: 280,
    height: "100%",
    backgroundColor: "#1a1a1a",
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
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

  // Mode Switcher
  modeSwitcher: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
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
    height: 18,
    minWidth: 18,
    borderRadius: 9,
    alignItems: "center",
    paddingHorizontal: 5,
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    marginLeft: -10,
    top: -15,
    right: -10,
  },

  channelsList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },

  // Channel Categories
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
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  dmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
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
    borderRadius: 10,
    alignItems: "center",
    paddingHorizontal: 6,
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    marginLeft: 8,
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    maxWidth: "85%",
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
  messageTimestamp: {
    fontSize: 12,
    color: "#888",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#fff",
  },
  myMessageText: {
    color: "#fff",
  },
  myMessageTimestamp: {
    fontSize: 11,
    color: "#ccc",
    marginTop: 6,
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
});
