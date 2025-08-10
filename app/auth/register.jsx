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
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleToggle = () => {
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
      router.push("/features/basicinfo");
    } else {
      console.log("Logging in with:", email, password);
      router.push("/page/home");
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
                source={require("../../assets/logo.png")}
                style={styles.logo}
              />

              {/* === REGISTRATION FIELDS === */}
              {isRegistering && (
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    style={styles.icon}
                  />
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
                <MaterialCommunityIcons
                  name="email-outline"
                  style={styles.icon}
                />
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
                <MaterialCommunityIcons
                  name="lock-outline"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <Pressable
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <MaterialCommunityIcons
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    style={styles.icon}
                  />
                </Pressable>
              </View>

              {isRegistering && (
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    // IMPORTANT Note: There should not be a show password option in confirming password for security.
                    secureTextEntry={!isPasswordVisible}
                  />
                  <Pressable
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <MaterialCommunityIcons
                      name={
                        isPasswordVisible ? "eye-off-outline" : "eye-outline"
                      }
                      style={styles.icon}
                    />
                  </Pressable>
                </View>
              )}

              {/* === SUBMIT BUTTON === */}
              <Pressable
                style={[styles.button, { width: "100%" }]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>
                  {isRegistering ? "Register" : "Login"}
                </Text>
              </Pressable>

              <Pressable style={styles.toggle} onPress={handleToggle}>
                {isRegistering ? (
                  <Text style={styles.toggleText}>
                    Already have an account?{" "}
                    <Text style={styles.toggleTextHighlight}>Login</Text>
                  </Text>
                ) : (
                  <Text style={styles.toggleText}>
                    Need an account?{" "}
                    <Text style={styles.toggleTextHighlight}>Register</Text>
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={styles.toggle}
                onPress={() => router.push("/auth/emailverification")}
              >
                {!isRegistering && (
                  <Pressable
                    style={styles.toggle}
                    onPress={() => router.push("/auth/emailverification")}
                  >
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
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    marginBottom: 25,
    letterSpacing: 1.5,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
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
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    marginLeft: 10,
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
