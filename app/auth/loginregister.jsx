import {
  View,
  Text,
  Image,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  // Password strength calculation
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
      { strength: 5, text: "Strong", color: "#1E3A5F" }
    ];
    
    return levels[score];
  };

  const passwordStrength = getPasswordStrength(password);

  React.useEffect(() => {
    // Stagger animations for better visual effect
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

  const handleToggle = async () => {
    try {
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Keyboard.dismiss();
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsRegistering((prev) => !prev);
        setEmail("");
        setPassword("");
        setFullName("");
        setConfirmPassword("");
        setFocusedField(null);
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
    if (isLoading) return; // Prevent double submission

    try {
      setIsLoading(true);
      
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (isRegistering) {
        // Registration - No validation, allow empty fields
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("Registering with:", fullName, email, password);
        router.push("/features/registrationprocess");
      } else {
        // Login validation - Keep validation for login
        if (!email.trim()) {
          Alert.alert("Required Field", "Please enter your email address");
          return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          Alert.alert("Invalid Email", "Please enter a valid email address");
          return;
        }
        if (!password.trim()) {
          Alert.alert("Required Field", "Please enter your password");
          return;
        }
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log("Logging in with:", email, password);
        router.push("/page/home");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header Section */}
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
                <LinearGradient
                  colors={["#1E3A5F", "#4A90E2"]}
                  style={styles.logoGradient}
                >
                  <Image
                    source={require("../../assets/logo.png")}
                    style={styles.logo}
                  />
                </LinearGradient>
              </View>
              
              <Text style={styles.welcomeText}>
                {isRegistering ? "Create Account" : "Welcome Back"}
              </Text>
              <Text style={styles.subtitleText}>
                {isRegistering 
                  ? "Get started with your fitness journey today" 
                  : "Sign in to continue your fitness journey"
                }
              </Text>
            </Animated.View>

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
              {/* Registration Fields */}
              {isRegistering && (
                <View style={[
                  styles.inputContainer,
                  focusedField === 'fullName' && styles.inputContainerFocused
                ]}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons
                      name="person-outline"
                      style={[
                        styles.icon,
                        focusedField === 'fullName' && styles.iconFocused
                      ]}
                    />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name (Optional)"
                    placeholderTextColor="#666"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              )}

              {/* Email Input */}
              <View style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="mail-outline"
                    style={[
                      styles.icon,
                      focusedField === 'email' && styles.iconFocused
                    ]}
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder={isRegistering ? "Email Address (Optional)" : "Email Address"}
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password Input */}
              <View style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    style={[
                      styles.icon,
                      focusedField === 'password' && styles.iconFocused
                    ]}
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder={isRegistering ? "Password (Optional)" : "Password"}
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    style={styles.eyeIcon}
                  />
                </Pressable>
              </View>

              {/* Password Strength Indicator - Only show during registration and when password exists */}
              {isRegistering && password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View 
                      style={[
                        styles.passwordStrengthFill,
                        { 
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          backgroundColor: passwordStrength.color
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.text}
                  </Text>
                </View>
              )}

              {/* Confirm Password Input - Only for Registration */}
              {isRegistering && (
                <>
                  <View style={[
                    styles.inputContainer,
                    focusedField === 'confirmPassword' && styles.inputContainerFocused,
                    confirmPassword.length > 0 && password !== confirmPassword && styles.inputContainerError,
                    confirmPassword.length > 0 && password === confirmPassword && password.length > 0 && styles.inputContainerSuccess
                  ]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        style={[
                          styles.icon,
                          focusedField === 'confirmPassword' && styles.iconFocused,
                          confirmPassword.length > 0 && password !== confirmPassword && styles.iconError,
                          confirmPassword.length > 0 && password === confirmPassword && password.length > 0 && styles.iconSuccess
                        ]}
                      />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm Password (Optional)"
                      placeholderTextColor="#666"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!isPasswordVisible}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <View style={styles.validationIconContainer}>
                      {confirmPassword.length > 0 && password === confirmPassword && password.length > 0 && (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      )}
                      {confirmPassword.length > 0 && password !== confirmPassword && (
                        <Ionicons name="close-circle" size={20} color="#F44336" />
                      )}
                    </View>
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      <Ionicons
                        name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                        style={styles.eyeIcon}
                      />
                    </Pressable>
                  </View>
                  
                  {/* Password Match Feedback */}
                  {confirmPassword.length > 0 && (
                    <View style={styles.passwordMatchContainer}>
                      <Text style={[
                        styles.passwordMatchText,
                        { color: password === confirmPassword ? "#4CAF50" : "#F44336" }
                      ]}>
                        {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Submit Button */}
              <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonLoading]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ["#666", "#888"] : ["#1E3A5F", "#4A90E2"]}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <View style={styles.loadingContent}>
                      <ActivityIndicator size="small" color="#fff" style={styles.loadingSpinner} />
                      <Text style={styles.submitButtonText}>
                        {isRegistering ? "Creating Account..." : "Signing In..."}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {isRegistering ? "Create Account" : "Sign In"}
                      </Text>
                      <Ionicons 
                        name="arrow-forward" 
                        size={20} 
                        color="#fff" 
                        style={styles.submitButtonIcon}
                      />
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Toggle Between Login/Register */}
              <Pressable style={styles.toggleContainer} onPress={handleToggle}>
                <Text style={styles.toggleText}>
                  {isRegistering ? "Already have an account? " : "Don't have an account? "}
                  <Text style={styles.toggleTextHighlight}>
                    {isRegistering ? "Sign In" : "Sign Up"}
                  </Text>
                </Text>
              </Pressable>

              {/* Forgot Password - Only for Login */}
              {!isRegistering && (
                <Pressable
                  style={styles.forgotPasswordContainer}
                  onPress={() => router.push("/auth/passwordresetprocess")}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>
              )}
            </Animated.View>
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
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
    maxWidth: 400,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    tintColor: "#fff",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: "#1E3A5F",
    backgroundColor: "rgba(30, 58, 95, 0.1)",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconContainer: {
    width: 50,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 20,
    color: "#666",
  },
  iconFocused: {
    color: "#1E3A5F",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    height: "100%",
    paddingRight: 16,
  },
  eyeButton: {
    width: 44,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: {
    fontSize: 20,
    color: "#666",
  },
  submitButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 18,
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
    color: "#1E3A5F",
    fontWeight: "bold",
  },
  forgotPasswordContainer: {
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: "#1E3A5F",
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
    transition: "width 0.3s ease",
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  inputContainerError: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  inputContainerSuccess: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  iconError: {
    color: "#F44336",
  },
  iconSuccess: {
    color: "#4CAF50",
  },
  validationIconContainer: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordMatchContainer: {
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  passwordMatchText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  submitButtonLoading: {
    opacity: 0.8,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpinner: {
    marginRight: 12,
  },
});
