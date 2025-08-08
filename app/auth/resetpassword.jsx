import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

export default function ResetPassword() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#fff" />
            </Pressable>
            <View style={styles.formContainer}>
              <Image
                source={require('../assets/logo.png')} // Make sure you have a logo asset at this path
                style={styles.logo}
              />
              <Text style={styles.title}>
                Reset Password
              </Text>
              <Text style={styles.subtitle}>
                Please create a new password.
              </Text>

              {/* === PASSWORD INPUT FIELDS === */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-check-outline" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter Password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              {/* === CONFIRM BUTTON === */}
              <Pressable
                style={[styles.button, { width: '100%' }]}
                onPress={() => router.push('/register')}
              >
                <Text style={styles.buttonText}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
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
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
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
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#cc3f3f',
  },
  icon: {
    fontSize: 22,
    color: '#ccc',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
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
