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
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const stepsConfig = [
  {
    title: "Email Verification",
    subtitle: "Enter your email to receive a One-Time Password.",
    buttonText: "Send OTP",
    displayIcon: "email-send-outline",
    fields: [
      { name: "email", placeholder: "Email", icon: "email-outline", keyboardType: "email-address" },
    ],
  },
  {
    title: "Verify Your Email",
    subtitle: "Enter the 6-digit code sent to your email.",
    buttonText: "Verify",
    displayIcon: "cellphone-key",
    fields: [{ name: "otp", type: "otp", length: 6 }],
  },
  {
    title: "Reset Password",
    subtitle: "Please create a new password.",
    buttonText: "Confirm",
    displayIcon: "lock-reset",
    fields: [
      { name: "password", placeholder: "Enter Password", icon: "lock-outline", secure: true },
      { name: "confirmPassword", placeholder: "Re-enter Password", icon: "lock-check-outline", secure: true },
    ],
  },
];

export default function ForgotPasswordFlow() {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    otp: Array(stepsConfig[1].fields[0].length).fill(""),
  });


  const otpInputs = useRef([]);

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

  const handleNextStep = () => {
    if (step < stepsConfig.length - 1) {
      setStep(prev => prev + 1);
    } else {

      console.log("Final Data:", formData);
      router.replace("/auth/register");
    }
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
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={text => handleOtpChange(text, i)}
                onKeyPress={e => handleBackspace(e, i)}
                value={formData.otp[i]}
              />
            ))}
          </View>
        );
      }

      return (
        <View key={field.name} style={styles.inputContainer}>
          <MaterialCommunityIcons name={field.icon} style={styles.icon} />
          <TextInput
            style={styles.textInput}
            placeholder={field.placeholder}
            placeholderTextColor="#999"
            secureTextEntry={field.secure || false}
            value={formData[field.name]}
            onChangeText={text => handleInputChange(field.name, text)}
            keyboardType={field.keyboardType || "default"}
            autoCapitalize="none"
          />
        </View>
      );
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.header}>
              <Pressable onPress={handlePreviousStep} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.title}>{currentStep.title}</Text>
          </View>
        
          <View style={[styles.content, { width: width * 0.85 }]}>
            <MaterialCommunityIcons 
              name={currentStep.displayIcon} 
              style={styles.displayIcon} 
            />
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
            {renderFields()}

            {step === 1 && (
                 <View style={styles.resendContainer}>
                   <Text style={styles.resendText}>Didn't get the code? </Text>
                   <Pressable>
                       <Text style={styles.resendButtonText}>Resend</Text>
                   </Pressable>
                 </View>
            )}

            <Pressable
              style={[styles.button, { width: "100%" }]}
              onPress={handleNextStep}
            >
              <Text style={styles.buttonText}>{currentStep.buttonText}</Text>
            </Pressable>
          </View>
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
    justifyContent: "flex-start",
    paddingTop: 120,
  },
  header: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: -5,
  },
  title: {
    fontSize: 16,
    letterSpacing: 1.5,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
  },
  content: {
    alignItems: "center",
  },
  displayIcon: {
    fontSize: 200,
    color: '#ff4d4d',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  inputContainer: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderRadius: 25,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderColor: "#cc3f3f",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  icon: {
    fontSize: 22,
    color: "#ccc",
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
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
  otpContainer: {
    width: "100%",
    marginBottom: 20,
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
});
