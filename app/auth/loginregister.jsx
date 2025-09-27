import {
  View,
  Text,
  Image,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import FormInput from "../../components/FormInput";

/* -------------------- REGISTER SCREEN -------------------- */
export default function Register() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fields
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Errors
  const [errors, setErrors] = useState({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  // Password strength
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: "", color: "#666" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const levels = [
      { strength: 0, text: "", color: "#666" },
      { strength: 1, text: "Very Weak", color: "#F44336" },
      { strength: 2, text: "Weak", color: "#FF9800" },
      { strength: 3, text: "Fair", color: "#FFC107" },
      { strength: 4, text: "Good", color: "#4CAF50" },
      { strength: 5, text: "Strong", color: "#1E3A5F" },
    ];

    return levels[score];
  };

  const passwordStrength = getPasswordStrength(password);

  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1200,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* -------------------- HANDLERS -------------------- */
  const handleToggle = async () => {
    try {
      if (Platform.OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Keyboard.dismiss();
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsRegistering((prev) => !prev);
        setNickname("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});
        Animated.timing(formAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setErrors({});
    let newErrors = {};

    if (isRegistering) {
      if (!nickname.trim()) newErrors.nickname = "Nickname is required.";
    } else {
      if (!email.trim()) newErrors.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(email))
        newErrors.email = "Invalid email format.";
      if (!password.trim()) newErrors.password = "Password is required.";
    }

    if (isRegistering) {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      if (Platform.OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isRegistering) {
        console.log("Registering:", { nickname, email, password });
        router.push("/features/registrationprocess");
      } else {
        console.log("Logging in:", { email, password });
        router.push("/page/home");
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------- RENDER -------------------- */
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <Animated.View
              style={[
                styles.headerSection,
                {
                  opacity: logoAnim,
                  transform: [
                    {
                      translateY: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../assets/logo.png")}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.welcomeText}>
                {isRegistering ? "Create Account" : "Welcome Back"}
              </Text>
              <Text style={styles.subtitleText}>
                {isRegistering
                  ? "Start your fitness journey and see your growth"
                  : "Sign in to continue your fitness journey"}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: formAnim,
                  transform: [
                    {
                      translateY: formAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {isRegistering && (
                <FormInput
                  placeholder="Nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  errorMessage={errors.nickname}
                />
              )}
              <FormInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                errorMessage={errors.email}
              />
              <FormInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                isPassword
                errorMessage={errors.password}
              />

              {/* Password Strength Bar */}
              {isRegistering && password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.passwordStrengthText,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
              {isRegistering && (
                <FormInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  errorMessage={errors.confirmPassword}
                />
              )}

              {/* Submit Button */}
              <Pressable
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <View style={styles.submitButtonSolid}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.submitButtonText}>
                        {isRegistering ? "Create Account" : "Sign In"}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#fff"
                        style={styles.submitButtonIcon}
                      />
                    </View>
                  )}
                </View>
              </Pressable>

              {/* Toggle */}
              <Pressable style={styles.toggleContainer} onPress={handleToggle}>
                <Text style={styles.toggleText}>
                  {isRegistering
                    ? "Already have an account? "
                    : "Don't have an account? "}
                  <Text style={styles.toggleTextHighlight}>
                    {isRegistering ? "Sign In" : "Sign Up"}
                  </Text>
                </Text>
              </Pressable>

              {/* Forgot Password */}
              {!isRegistering && (
                <Pressable
                  style={styles.forgotPasswordContainer}
                  onPress={() => router.push("/auth/passwordresetprocess")}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
    maxWidth: 400,
  },
  headerSection: {
    position: "absolute",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  submitButtonSolid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#356FB0", // solid middle color
  },

  subtitleText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 280,
  },
  submitButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    overflow: "hidden",
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  submitButtonIcon: {
    opacity: 0.8,
  },
  toggleContainer: {
    paddingVertical: 16,
  },
  toggleText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  toggleTextHighlight: {
    color: "#336cb8",
    fontWeight: "bold",
  },
  forgotPasswordContainer: {
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: "#336cb8",
    fontWeight: "600",
    textAlign: "center",
  },
  passwordStrengthContainer: {
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  passwordStrengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
