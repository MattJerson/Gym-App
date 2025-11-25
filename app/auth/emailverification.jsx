import {
  View,
  Text,
  Alert,
  Platform,
  Animated,
  StatusBar,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import SubmitButton from "../../components/SubmitButton";
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Email Verification Screen
 * Used after user registration to verify their email address
 * Receives email from registration flow via route params
 */
export default function EmailVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = Dimensions.get("window");

  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [email, setEmail] = useState("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const otpInputs = useRef([]);

  // Load email from params or AsyncStorage
  useEffect(() => {
    const loadEmail = async () => {
      try {
        const emailFromParams = params?.email;
        const emailFromStorage = await AsyncStorage.getItem("pendingVerificationEmail");
        const userEmail = emailFromParams || emailFromStorage;
        
        if (userEmail) {
          setEmail(userEmail);
        } else {
          Alert.alert("Error", "No email found for verification");
          router.replace("/auth/loginregister");
        }
      } catch (error) {
        console.error("Failed to load email:", error);
      }
    };

    loadEmail();
  }, [params]);

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleOtpChange = (text, index) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < otpInputs.current.length - 1) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleBackspace = (event, index) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpInputs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      const otpCode = otp.join("");

      if (otpCode.length !== 6) {
        Alert.alert("Error", "Please enter the complete 6-digit code");
        setIsLoading(false);
        return;
      }

      if (!email) {
        Alert.alert("Error", "Email address not found");
        setIsLoading(false);
        return;
      }

      // Verify the OTP code with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: "signup",
      });

      if (error) {
        Alert.alert(
          "Invalid Code",
          "The verification code is incorrect or expired. Please try again."
        );
        setIsLoading(false);
        return;
      }

      // Clear pending email from storage
      await AsyncStorage.removeItem("pendingVerificationEmail");

      // Success! User is now verified and signed in
      Alert.alert(
        "Email Verified!",
        "Your account has been verified. Let's complete your profile.",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/features/registrationprocess"),
          },
        ]
      );
    } catch (error) {
      console.error("OTP verification error:", error);
      Alert.alert("Error", error.message || "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isLoading || !email) return;

    setIsLoading(true);

    try {
      // Resend signup confirmation email
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Code Resent", "Check your email for a new verification code");
        // Clear OTP inputs
        setOtp(Array(6).fill(""));
        if (otpInputs.current[0]) {
          otpInputs.current[0].focus();
        }
      }
    } catch (error) {
      console.error("Resend error:", error);
      Alert.alert("Error", "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Cancel Verification?",
                  "You'll need to verify your email to continue using the app.",
                  [
                    { text: "Continue Verifying", style: "cancel" },
                    {
                      text: "Go Back",
                      style: "destructive",
                      onPress: async () => {
                        await AsyncStorage.removeItem("pendingVerificationEmail");
                        router.replace("/auth/loginregister");
                      },
                    },
                  ]
                );
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Verify Email</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.mainContent}
          >
            {/* Icon Container */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#4A9EFF", "#6BB6FF"]}
                style={styles.iconGradient}
              >
                <MaterialCommunityIcons
                  name="email-check-outline"
                  size={40}
                  color="#fff"
                />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((_, i) => (
                <TextInput
                  key={i}
                  ref={(el) => (otpInputs.current[i] = el)}
                  style={[
                    styles.otpInput,
                    otp[i] && styles.otpInputFilled,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={(text) => handleOtpChange(text, i)}
                  onKeyPress={(e) => handleBackspace(e, i)}
                  value={otp[i]}
                  placeholderTextColor="#666"
                />
              ))}
            </View>

            {/* Resend Link */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?{" "}
              </Text>
              <Pressable onPress={handleResendCode} disabled={isLoading}>
                <Text style={styles.resendButtonText}>Resend</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <SubmitButton
              text="Verify Email"
              onPress={handleVerifyOtp}
              isLoading={isLoading}
              loadingText="Verifying..."
              icon="checkmark-circle"
              variant="gradient"
              gradientColors={["#4A9EFF", "#6BB6FF"]}
              loadingGradientColors={["#666", "#888"]}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    width: "100%",
    marginTop: 15,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 25 : 35,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    width: "100%",
    paddingTop: 40,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    elevation: 8,
    borderRadius: 50,
    shadowRadius: 16,
    shadowOpacity: 0.3,
    alignItems: "center",
    shadowColor: "#4A9EFF",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: 28,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    maxWidth: 320,
    color: "#999",
    lineHeight: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  emailText: {
    color: "#4A9EFF",
    fontWeight: "600",
  },
  otpContainer: {
    width: "100%",
    marginBottom: 24,
    flexDirection: "row",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 24,
    elevation: 2,
    color: "#fff",
    borderWidth: 1,
    shadowRadius: 4,
    borderRadius: 12,
    fontWeight: "600",
    shadowOpacity: 0.1,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  otpInputFilled: {
    elevation: 4,
    shadowRadius: 8,
    shadowOpacity: 0.2,
    borderColor: "#4A9EFF",
    shadowColor: "#4A9EFF",
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: "rgba(74, 158, 255, 0.1)",
  },
  resendContainer: {
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#999",
  },
  resendButtonText: {
    fontSize: 14,
    color: "#4A9EFF",
    fontWeight: "bold",
  },
  bottomSection: {
    width: "100%",
    paddingVertical: 24,
    alignItems: "center",
  },
});
