import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

export default function EmailVerification() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>

          <View style={styles.formContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.title}>Email Verification</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive a One-Time Password.
            </Text>

            {/* === EMAIL FIELD === */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" style={styles.icon} />
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
              style={[styles.button, { width: '100%' }]}
              onPress={() => router.push('/codeverification')}
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
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: '100%',
    alignItems: "center",
  },
  formContainer: {
    width: Dimensions.get("window").width * 0.85,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: -40,
    left: 20,
    zIndex: 10,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 50,
    borderWidth: 1,
    borderColor: '#cc3f3f',
  },
  icon: {
    fontSize: 22,
    color: '#ccc',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    height: '100%',
  },
  button: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    elevation: 5,
    marginTop: 10,
    height: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
