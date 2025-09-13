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
      text: "Hello! I'm your virtual fitness assistant. I can help you with workouts, nutrition, and training questions. What would you like to know?",
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
          text: "Thank you for your question. I'm here to help with your fitness journey. Let me provide you with some guidance on that topic.",
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
            <View style={styles.botAvatar}>
              <MaterialCommunityIcons name="robot-outline" size={24} color="#fff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Virtual Assistant</Text>
              <Text style={styles.statusText}>Online</Text>
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
                <View style={styles.messageAvatar}>
                  <MaterialCommunityIcons name="robot-outline" size={16} color="#5b86e5" />
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
                <View style={styles.messageAvatar}>
                  <MaterialCommunityIcons name="account" size={16} color="#5b86e5" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}              placeholder="Type your fitness question..."
              placeholderTextColor="#aaa"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
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
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  },  chatContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  botMessage: {
    justifyContent: "flex-start",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    marginVertical: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },  botBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userBubble: {
    backgroundColor: "#5b86e5",
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 15,
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
    marginTop: 4,
  },  botTimestamp: {
    color: "#aaa",
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
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
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    maxHeight: 100,
    paddingRight: 12,
    paddingVertical: 8,
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
