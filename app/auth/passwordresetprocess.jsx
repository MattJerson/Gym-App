import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const stepsConfig = [
  {
    title: "Email Verification",
    subtitle: "Enter your email to receive a verification code",
    buttonText: "Send Code",
    displayIcon: "email-outline",
    fields: [
      { name: "email", placeholder: "Email Address", icon: "email-outline", keyboardType: "email-address" },
    ],
  },
  {
    title: "Verify Code",
    subtitle: "Enter the 6-digit code sent to your email",
    buttonText: "Verify Code",
    displayIcon: "shield-check-outline",
    fields: [{ name: "otp", type: "otp", length: 6 }],
  },
  {
    title: "Reset Password",
    subtitle: "Create a new secure password for your account",
    buttonText: "Reset Password",
    displayIcon: "lock-reset",
    fields: [
      { name: "password", placeholder: "New Password", icon: "lock-outline", secure: true },
      { name: "confirmPassword", placeholder: "Confirm New Password", icon: "lock-check-outline", secure: true },
    ],
  },
];

export default function ForgotPasswordFlow() {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const [step, setStep] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    otp: Array(stepsConfig[1].fields[0].length).fill(""),
  });

  const otpInputs = useRef([]);

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

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...formData.otp];
    newOtp[index] = text;
    setFormData(prev => ({ ...prev, otp: newOtp }));


    if (text && index < otpInputs.current.length - 1) {
      otpInputs.current[index + 1].focus();
    }
  };
  
  const handleBackspace = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !formData.otp[index] && index > 0) {
        otpInputs.current[index - 1].focus();
    }
  };
  const handleNextStep = async () => {
    setIsLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (step < stepsConfig.length - 1) {
      setStep(prev => prev + 1);
    } else {
      console.log("Final Data:", formData);
      router.replace("/auth/loginregister");
    }
    setIsLoading(false);
  };

  const handlePreviousStep = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const currentStep = stepsConfig[step];

  const renderFields = () => {
    return currentStep.fields.map((field) => {
      if (field.type === "otp") {
        return (
          <View key="otp-container" style={styles.otpContainer}>
            {formData.otp.map((_, i) => (
              <TextInput
                key={i}
                ref={el => (otpInputs.current[i] = el)}
                style={[
                  styles.otpInput,
                  formData.otp[i] && styles.otpInputFilled
                ]}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={text => handleOtpChange(text, i)}
                onKeyPress={e => handleBackspace(e, i)}
                value={formData.otp[i]}
                placeholderTextColor="#666"
              />
            ))}
          </View>
        );
      }

      const isFocused = focusedField === field.name;

      return (
        <View key={field.name} style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused
        ]}>
          <View style={styles.inputIconContainer}>
            <MaterialCommunityIcons 
              name={field.icon} 
              style={[
                styles.icon,
                isFocused && styles.iconFocused
              ]} 
            />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder={field.placeholder}
            placeholderTextColor="#666"
            secureTextEntry={field.secure || false}
            value={formData[field.name]}
            onChangeText={text => handleInputChange(field.name, text)}
            keyboardType={field.keyboardType || "default"}
            autoCapitalize="none"
            onFocus={() => setFocusedField(field.name)}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      );
    });
  };  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable 
              onPress={handlePreviousStep} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>{currentStep.title}</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{step + 1}/{stepsConfig.length}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${((step + 1) / stepsConfig.length) * 100}%` }
                ]}
              />
            </View>
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
                  name={currentStep.displayIcon} 
                  size={40} 
                  color="#fff" 
                />
              </LinearGradient>
            </View>

            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
            
            {/* Form Fields */}
            <View style={styles.formContainer}>
              {renderFields()}

              {step === 1 && (
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the code? </Text>
                  <Pressable>
                    <Text style={styles.resendButtonText}>Resend</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <Pressable
              style={[styles.submitButton, isLoading && styles.submitButtonLoading]}
              onPress={handleNextStep}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ["#666", "#888"] : ["#4A9EFF", "#6BB6FF"]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator 
                      size="small" 
                      color="#fff" 
                      style={styles.loadingSpinner} 
                    />
                    <Text style={styles.submitButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {currentStep.buttonText}
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
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingTop: Platform.OS === "ios" ? 25 : 35,
    marginTop: 15,
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center",
    flex: 1,
  },
  stepIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  stepText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4A9EFF",
    borderRadius: 2,
  },
  mainContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A9EFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
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
    borderColor: "#4A9EFF",
    backgroundColor: "rgba(74, 158, 255, 0.1)",
    shadowColor: "#4A9EFF",
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
    color: "#4A9EFF",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    height: "100%",
    paddingRight: 16,
  },
  otpContainer: {
    width: "100%",
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 24,
    color: "#fff",
    borderWidth: 1,
    borderRadius: 12,
    fontWeight: "600",
    textAlign: "center",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: "#4A9EFF",
    backgroundColor: "rgba(74, 158, 255, 0.1)",
    shadowColor: "#4A9EFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resendContainer: {
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  resendText: {
    color: "#999",
    fontSize: 14,
  },
  resendButtonText: {
    fontSize: 14,
    color: "#4A9EFF",
    fontWeight: "bold",
  },
  bottomSection: {
    paddingBottom: 30,
    paddingTop: 20,
    width: "100%",
    alignItems: "center",
  },
  submitButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4A9EFF",
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
