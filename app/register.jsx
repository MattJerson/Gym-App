import React, { useState, useRef } from "react";
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleToggle = () => {
    Keyboard.dismiss();
    Animated.timing(formAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsRegistering((prev) => !prev);
      setEmail("");
      setPassword("");
      setFullName("");
      setConfirmPassword("");
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSubmit = () => {
    if (isRegistering) {
      console.log("Registering with:", fullName, email, password);
      router.push("/basicinfo");
    } else {
      console.log("Logging in with:", email, password);
      router.push("/home");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
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
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
              />
              <Text style={styles.title}>
                {isRegistering ? "Create Account" : "Login"}
              </Text>

              {/* === REGISTRATION FIELDS === */}
              {isRegistering && (
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="account-outline" style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor="#999"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* === COMMON FIELDS === */}
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

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" style={styles.icon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <MaterialCommunityIcons
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    style={styles.icon}
                  />
                </Pressable>
              </View>

              {isRegistering && (
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="lock-check-outline" style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword} 
                    // IMPORTANT Note: There should not be a show password option in confirming password for security.
                    secureTextEntry={!isPasswordVisible}
                />
                <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <MaterialCommunityIcons
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    style={styles.icon}
                  />
                </Pressable>
              </View>
              )}

              {/* === SUBMIT BUTTON === */}
              <Pressable
                style={[styles.button, { width: '100%' }]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>
                  {isRegistering ? "Register" : "Login"}
                </Text>
              </Pressable>

              <Pressable style={styles.toggle} onPress={handleToggle}>
                {isRegistering ? (
                  <Text style={styles.toggleText}>
                    Already have an account?{' '}
                    <Text style={styles.toggleTextHighlight}>
                      Login
                    </Text>
                  </Text>
                ) : (
                  <Text style={styles.toggleText}>
                    Need an account?{' '}
                    <Text style={styles.toggleTextHighlight}>
                      Register
                    </Text>
                  </Text>
                )}
              </Pressable>

              <Pressable style={styles.toggle} onPress={() => router.push("/emailverification")}>
                {!isRegistering && (
                <Pressable style={styles.toggle} onPress={() => router.push("/emailverification")}>
                  <Text style={styles.toggleText}>
                    <Text style={styles.toggleTextHighlight}>
                      Forgot Password? 
                    </Text>
                  </Text>
                </Pressable>
              )}
              </Pressable>
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
    marginBottom: 25,
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
  toggle: {
    marginTop: 20,
  },
  toggleText: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "500",
  },
  toggleTextHighlight: {
    color: "#ff4d4d",
    fontWeight: "700",
  },
});
