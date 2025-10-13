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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { askGemini } from "../../backend/gemini";

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

  const sendMessage = async () => {
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

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setMessage("");

      // Show temporary "typing..." message
      const typingMessage = {
        id: updatedMessages.length + 1,
        text: "Typing...",
        isBot: true,
        timestamp: "",
      };
      setMessages((prev) => [...prev, typingMessage]);

      // Ask Gemini with truncated conversation
      const reply = await askGemini(updatedMessages);

      // Replace "Typing..." with real reply
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingMessage.id
            ? {
                ...msg,
                text: reply,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : msg
        )
      );
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
              <MaterialCommunityIcons
                name="robot-outline"
                size={24}
                color="#fff"
              />
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
                  <MaterialCommunityIcons
                    name="robot-outline"
                    size={16}
                    color="#5b86e5"
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
                <View style={styles.messageAvatar}>
                  <MaterialCommunityIcons
                    name="account"
                    size={16}
                    color="#5b86e5"
                  />
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
              placeholder="Type your fitness question..."
              placeholderTextColor="#aaa"
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
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  botAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(91, 134, 229, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(91, 134, 229, 0.3)",
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
    color: "#30D158",
    fontWeight: "500",
  },
  chatContainer: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#0B0B0B",
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    marginBottom: 4,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    marginVertical: 2,
    paddingVertical: 12,
    marginHorizontal: 8,
    paddingHorizontal: 16,
  },
  botBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 6,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  userBubble: {
    backgroundColor: "rgba(78, 205, 196, 0.2)",
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.3)",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: "#fff",
  },
  userText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  botTimestamp: {
    color: "#888",
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#0B0B0B",
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 10,
    flexDirection: "row",
    paddingHorizontal: 16,
    alignItems: "flex-end",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4ecdc4",
  },
});
