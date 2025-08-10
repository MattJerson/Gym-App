import {
  View,
  Text,
  Image,
  Keyboard,
  Animated,
  Platform,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function OtpVerification() {
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
          <Text style={styles.title}>Verify Your Email</Text>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </Pressable>
            <View style={styles.formContainer}>
              <Image
                source={require("../../assets/logo.png")} // Make sure you have a logo asset at this path
                style={styles.logo}
              />

              {/* === OTP INPUT FIELDS === */}
              <View style={styles.otpContainer}>
                {[...Array(6)].map((_, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>

              {/* === RESEND OTP === */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't get the code? </Text>
                <Pressable>
                  <Text style={styles.resendButtonText}>Resend</Text>
                </Pressable>
              </View>

              {/* === VERIFY BUTTON === */}
              <Pressable
                onPress={() => router.push("/auth/resetpassword")}
                style={[styles.button, { width: "100%" }]}
              >
                <Text style={styles.buttonText}>Verify</Text>
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
  otpContainer: {
    width: "100%",
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  otpInput: {
    width: 45,
    height: 55,
    fontSize: 22,
    color: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    fontWeight: "600",
    textAlign: "center",
    borderColor: "#cc3f3f",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  resendContainer: {
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
  },
  resendText: {
    color: "#ccc",
    fontSize: 14,
  },
  resendButtonText: {
    fontSize: 14,
    color: "#ff4d4d",
    fontWeight: "bold",
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
