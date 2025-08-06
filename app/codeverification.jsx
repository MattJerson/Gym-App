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
import { Ionicons } from '@expo/vector-icons';
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
                Verify Your Email
              </Text>
              <Text style={styles.subtitle}>
                Please enter the 6-digit code sent to your email.
              </Text>

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
              <Pressable onPress={() => router.push('/resetpassword')}
                style={[styles.button, { width: '100%' }]}
              >
                <Text style={styles.buttonText}>
                  Verify
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#cc3f3f',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
  },
  resendText: {
      color: '#ccc',
      fontSize: 14,
  },
  resendButtonText: {
      color: '#ff4d4d',
      fontSize: 14,
      fontWeight: 'bold',
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
