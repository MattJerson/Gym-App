import {
  View,
  Text,
  Platform,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
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

export default function Chatbot() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm GymBot, your fitness assistant. How can I help you today?",
      isBot: true,
      timestamp: "2:30 PM",
    },
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        isBot: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages([...messages, newMessage]);
      setMessage("");

      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: "Thanks for your message! I'm here to help with workouts, nutrition, and fitness advice.",
          isBot: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, botResponse]);
      }, 1000);
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
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
            <MaterialCommunityIcons name="robot" size={32} color="#ff4d4d" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>GymBot</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                msg.isBot ? styles.botMessage : styles.userMessage,
              ]}
            >
              {msg.isBot && (
                <View style={styles.botAvatar}>
                  <MaterialCommunityIcons
                    name="robot"
                    size={20}
                    color="#ff4d4d"
                  />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.isBot ? styles.botBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.isBot ? styles.botText : styles.userText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    msg.isBot ? styles.botTimestamp : styles.userTimestamp,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
              {!msg.isBot && (
                <View style={styles.userAvatar}>
                  <FontAwesome5 name="user" size={16} color="#fff" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me about workouts, nutrition, or fitness..."
              placeholderTextColor="#888"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={sendMessage}
              style={[styles.sendButton, { opacity: message.trim() ? 1 : 0.5 }]}
              disabled={!message.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  statusRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    marginRight: 5,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  statusText: {
    fontSize: 12,
    color: "#4CAF50",
  },
  headerAction: {
    padding: 5,
  },
  chatContainer: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 5,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  botMessage: {
    justifyContent: "flex-start",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#333",
    justifyContent: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    marginLeft: 8,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4d4d",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 20,
    marginVertical: 2,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  botBubble: {
    borderBottomLeftRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  userBubble: {
    borderBottomRightRadius: 5,
    backgroundColor: "#ff4d4d",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botText: {
    color: "#fff",
  },
  userText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
  },
  botTimestamp: {
    color: "#aaa",
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  inputWrapper: {
    borderRadius: 25,
    paddingVertical: 8,
    flexDirection: "row",
    paddingHorizontal: 15,
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    maxHeight: 100,
    paddingRight: 10,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    marginLeft: 5,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4d4d",
  },
});
