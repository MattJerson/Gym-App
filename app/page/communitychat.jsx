import {
  View,
  Text,
  Platform,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function CommunityChat() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("general");
  
  // Sample channels
  const channels = [
    { id: "general", name: "General", icon: "chat-outline", memberCount: 1247 },
    { id: "workouts", name: "Workouts", icon: "dumbbell", memberCount: 856 },
    { id: "nutrition", name: "Nutrition", icon: "food-apple-outline", memberCount: 623 },
    { id: "progress", name: "Progress", icon: "chart-line", memberCount: 445 },
    { id: "motivation", name: "Motivation", icon: "fire", memberCount: 789 },
  ];

  // Sample messages for different channels
  const channelMessages = {
    general: [
      {
        id: 1,
        user: "FitMike92",
        avatar: "👨‍💼",
        text: "Good morning everyone! Ready to crush today's workout? 💪",
        timestamp: "9:23 AM",
        isOnline: true,
      },
      {
        id: 2,
        user: "HealthyHannah",
        avatar: "👩‍🦰",
        text: "Just finished my morning run! The weather is perfect today 🌅",
        timestamp: "9:45 AM",
        isOnline: true,
      },
      {
        id: 3,
        user: "ProteinPaul",
        avatar: "🧔",
        text: "Anyone tried the new HIIT workout? Looks intense! 🔥",
        timestamp: "10:12 AM",
        isOnline: false,
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
      },
      {
        id: 2,
        user: "CardioKing",
        avatar: "🏃",
        text: "That HIIT session was brutal but so worth it! Who's joining tomorrow?",
        timestamp: "9:15 AM",
        isOnline: true,
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
      },
    ],
  };

  const currentMessages = channelMessages[activeChannel] || [];

  const sendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send to a backend
      console.log(`Sending message to #${activeChannel}: ${message}`);
      setMessage("");
    }
  };

  const renderChannel = ({ item }) => (
    <Pressable
      style={[
        styles.channelItem,
        activeChannel === item.id && styles.activeChannel
      ]}
      onPress={() => setActiveChannel(item.id)}
    >
      <View style={styles.channelContent}>
        <MaterialCommunityIcons
          name={item.icon}
          size={16}
          color={activeChannel === item.id ? "#5b86e5" : "#aaa"}
        />
        <Text style={[
          styles.channelName,
          activeChannel === item.id && styles.activeChannelName
        ]}>
          #{item.name.toLowerCase()}
        </Text>
      </View>
      <Text style={styles.memberCount}>{item.memberCount}</Text>
    </Pressable>
  );

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userAvatar}>{item.avatar}</Text>
          <Text style={styles.userName}>{item.user}</Text>
          <View style={[
            styles.onlineStatus,
            { backgroundColor: item.isOnline ? "#00ff88" : "#666" }
          ]} />
          <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
        </View>
      </View>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Community Chat</Text>
              <Text style={styles.statusText}>#{activeChannel}</Text>
            </View>
          </View>
          <Pressable style={styles.moreButton}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.mainContent}>
          {/* Sidebar with channels */}
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Channels</Text>
            <FlatList
              data={channels}
              renderItem={renderChannel}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
            
            <View style={styles.onlineSection}>
              <Text style={styles.sidebarTitle}>Online Now</Text>
              <View style={styles.onlineUsers}>
                <Text style={styles.onlineUser}>👨‍💼 FitMike92</Text>
                <Text style={styles.onlineUser}>👩‍🦰 HealthyHannah</Text>
                <Text style={styles.onlineUser}>💪 StrengthSarah</Text>
                <Text style={styles.onlineUser}>🏃 CardioKing</Text>
                <Text style={styles.moreOnline}>+42 more</Text>
              </View>
            </View>
          </View>

          {/* Chat Area */}
          <View style={styles.chatArea}>
            {/* Channel Header */}
            <View style={styles.channelHeader}>
              <View style={styles.channelInfo}>
                <MaterialCommunityIcons 
                  name={channels.find(c => c.id === activeChannel)?.icon || "chat-outline"} 
                  size={20} 
                  color="#5b86e5" 
                />
                <Text style={styles.channelTitle}>
                  #{activeChannel}
                </Text>
              </View>
              <Text style={styles.channelMemberCount}>
                {channels.find(c => c.id === activeChannel)?.memberCount || 0} members
              </Text>
            </View>

            {/* Messages */}
            <FlatList
              style={styles.messagesList}
              data={currentMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContainer}
            />

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Pressable style={styles.attachButton}>
                  <Ionicons name="add" size={20} color="#aaa" />
                </Pressable>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Message #${activeChannel}...`}
                  placeholderTextColor="#aaa"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                />
                <Pressable style={styles.emojiButton}>
                  <MaterialCommunityIcons name="emoticon-happy-outline" size={20} color="#aaa" />
                </Pressable>
                <Pressable
                  onPress={sendMessage}
                  style={[
                    styles.sendButton,
                    { opacity: message.trim() ? 1 : 0.5 }
                  ]}
                  disabled={!message.trim()}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#5b86e5",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  statusText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  
  // Sidebar Styles
  sidebar: {
    width: 120,
    backgroundColor: "#0f0f0f",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 15,
  },
  sidebarTitle: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "600",
    marginBottom: 10,
    marginHorizontal: 12,
    textTransform: "uppercase",
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    borderRadius: 6,
  },
  activeChannel: {
    backgroundColor: "rgba(91, 134, 229, 0.2)",
  },
  channelContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  channelName: {
    fontSize: 12,
    color: "#aaa",
    marginLeft: 6,
    fontWeight: "500",
  },
  activeChannelName: {
    color: "#5b86e5",
    fontWeight: "600",
  },
  memberCount: {
    fontSize: 10,
    color: "#666",
  },
  onlineSection: {
    marginTop: 20,
  },
  onlineUsers: {
    paddingHorizontal: 12,
  },
  onlineUser: {
    fontSize: 11,
    color: "#ccc",
    marginBottom: 4,
  },
  moreOnline: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },

  // Chat Area Styles
  chatArea: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  channelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  channelInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  channelTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  channelMemberCount: {
    fontSize: 12,
    color: "#aaa",
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 10,
  },
  messageContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    fontSize: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: "#5b86e5",
    fontWeight: "600",
    marginRight: 6,
  },
  onlineStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  messageTimestamp: {
    fontSize: 11,
    color: "#666",
  },
  messageText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
    marginLeft: 24,
  },

  // Input Styles
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#1a1a1a",
  },
  inputWrapper: {
    borderRadius: 24,
    paddingVertical: 8,
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  attachButton: {
    padding: 4,
    marginRight: 8,
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
    marginLeft: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5b86e5",
  },
});
