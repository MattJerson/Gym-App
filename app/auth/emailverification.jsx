import {
  View,
  Text,
  Image,
  Platform,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export default function EmailVerification() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <Text style={styles.title}>Email Verification</Text>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>

          <View style={styles.formContainer}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
            />
            <Text style={styles.subtitle}>
              Enter your email to receive a One-Time Password.
            </Text>

            {/* === EMAIL FIELD === */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                style={styles.icon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* === SUBMIT BUTTON === */}
            <Pressable
              style={[styles.button, { width: "100%" }]}
              onPress={() => router.push("/auth/codeverification")}
            >
              <Text style={styles.buttonText}>Send OTP</Text>
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
  keyboardAvoidingView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  formContainer: {
    alignItems: "center",
    width: Dimensions.get("window").width * 0.85,
  },
  backButton: {
    left: 20,
    top: -200,
    zIndex: 10,
    position: "absolute",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 16,
    marginBottom: 175,
    letterSpacing: 1.5,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 25,
    textAlign: "center",
  },
  inputContainer: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 20,
    borderColor: "#cc3f3f",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  icon: {
    fontSize: 22,
    color: "#ccc",
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    height: "100%",
  },
  button: {
    height: 50,
    elevation: 5,
    marginTop: 10,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4d4d",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
  },
});
