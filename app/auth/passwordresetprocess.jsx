import {
  View,
  Text,
  Platform,
  Animated,
  StatusBar,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import SubmitButton from "../../components/SubmitButton";
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const stepsConfig = [
  {
    title: "Email Verification",
    subtitle: "Enter your email to receive a verification code",
    buttonText: "Send Code",
    displayIcon: "email-outline",
    fields: [
      {
        name: "email",
        placeholder: "Email Address",
        icon: "email-outline",
        keyboardType: "email-address",
      },
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
      {
        name: "password",
        placeholder: "New Password",
        icon: "lock-outline",
        secure: true,
      },
      {
        name: "confirmPassword",
        placeholder: "Confirm New Password",
        icon: "lock-check-outline",
        secure: true,
      },
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...formData.otp];
    newOtp[index] = text;
    setFormData((prev) => ({ ...prev, otp: newOtp }));

    if (text && index < otpInputs.current.length - 1) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleBackspace = (event, index) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      !formData.otp[index] &&
      index > 0
    ) {
      otpInputs.current[index - 1].focus();
    }
  };
  const handleNextStep = async () => {
    setIsLoading(true);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (step < stepsConfig.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      console.log("Final Data:", formData);
      router.replace("/auth/loginregister");
    }
    setIsLoading(false);
  };

  const handlePreviousStep = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
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
                ref={(el) => (otpInputs.current[i] = el)}
                style={[
                  styles.otpInput,
                  formData.otp[i] && styles.otpInputFilled,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(text) => handleOtpChange(text, i)}
                onKeyPress={(e) => handleBackspace(e, i)}
                value={formData.otp[i]}
                placeholderTextColor="#666"
              />
            ))}
          </View>
        );
      }

      const isFocused = focusedField === field.name;

      return (
        <View
          key={field.name}
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
          ]}
        >
          <View style={styles.inputIconContainer}>
            <MaterialCommunityIcons
              name={field.icon}
              style={[styles.icon, isFocused && styles.iconFocused]}
            />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder={field.placeholder}
            placeholderTextColor="#666"
            secureTextEntry={field.secure || false}
            value={formData[field.name]}
            onChangeText={(text) => handleInputChange(field.name, text)}
            keyboardType={field.keyboardType || "default"}
            autoCapitalize="none"
            onFocus={() => setFocusedField(field.name)}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      );
    });
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
            <Pressable onPress={handlePreviousStep} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>{currentStep.title}</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>
                {step + 1}/{stepsConfig.length}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${((step + 1) / stepsConfig.length) * 100}%` },
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
                  <Text style={styles.resendText}>
                    Didn't receive the code?{" "}
                  </Text>
                  <Pressable>
                    <Text style={styles.resendButtonText}>Resend</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <SubmitButton
              text={currentStep.buttonText}
              onPress={handleNextStep}
              isLoading={isLoading}
              loadingText="Processing..."
              icon="arrow-forward"
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
  },
  safeArea: {
    flex: 1,
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
  stepIndicator: {
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#4A9EFF",
  },
  mainContent: {
    flex: 1,
    width: "100%",
    paddingTop: 20,
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
  subtitle: {
    fontSize: 16,
    maxWidth: 320,
    color: "#999",
    lineHeight: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
  },
  inputContainer: {
    height: 56,
    elevation: 2,
    width: "100%",
    borderWidth: 1,
    shadowRadius: 4,
    borderRadius: 16,
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  inputContainerFocused: {
    elevation: 4,
    shadowRadius: 8,
    shadowOpacity: 0.2,
    borderColor: "#4A9EFF",
    shadowColor: "#4A9EFF",
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: "rgba(74, 158, 255, 0.1)",
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
