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
  const [showSidebar, setShowSidebar] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Channel categories matching your app's style
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

  const currentMessages = channelMessages[activeChannel] || [];

  const sendMessage = () => {
    if (message.trim()) {
      console.log(`Sending message to #${activeChannel}: ${message}`);
      setMessage("");
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
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
          onPress={() => setActiveChannel(channel.id)}
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

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageCard}>
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
        <Text style={styles.messageText}>{item.text}</Text>
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

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header matching your app's style */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Community Chat</Text>
              <Text style={styles.headerSubtitle}>#{activeChannel}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={toggleSidebar} style={styles.headerButton}>
              <MaterialCommunityIcons
                name={showSidebar ? "menu-open" : "menu"}
                size={24}
                color="#fff"
              />
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {/* Sidebar */}
          {showSidebar && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <MaterialCommunityIcons name="forum" size={20} color="#fff" />
                <Text style={styles.sidebarTitle}>Channels</Text>
              </View>
              <FlatList
                data={channelCategories}
                renderItem={renderChannelCategory}
                keyExtractor={(item) => item.name}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.channelsList}
              />
            </View>
          )}

          {/* Chat Area */}
          <View style={styles.chatArea}>
            {/* Messages */}
            <FlatList
              style={styles.messagesList}
              data={currentMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContainer}
              ListHeaderComponent={
                <View style={styles.channelIntro}>
                  <View style={styles.channelIconLarge}>
                    <MaterialCommunityIcons
                      name={
                        channelCategories
                          .flatMap((c) => c.channels)
                          .find((ch) => ch.id === activeChannel)?.icon || "chat"
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
              }
            />

            {/* Input matching your app's style */}
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
                  placeholder={`Message #${activeChannel}...`}
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
    flexDirection: "row",
  },

  sidebar: {
    width: 180,
    padding: 15,
    marginLeft: 20,
    marginRight: 10,
    borderRadius: 32,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  sidebarHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  sidebarTitle: {
    fontSize: 18,
    color: "#fff",
    marginLeft: 10,
    fontWeight: "bold",
  },
  channelsList: {
    paddingBottom: 10,
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
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  activeChannelItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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

  // Messages matching your card style
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 10,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
