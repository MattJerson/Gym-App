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
import { useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ResetPassword() {
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
          <Text style={styles.title}>Reset Password</Text>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </Pressable>
            <View style={styles.formContainer}>
              <Image
                source={require("../../assets/logo.png")} // Make sure you have a logo asset at this path
                style={styles.logo}
              />

              {/* === PASSWORD INPUT FIELDS === */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter Password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              {/* === CONFIRM BUTTON === */}
              <Pressable
                style={[styles.button, { width: "100%" }]}
                onPress={() => router.push("/register")}
              >
                <Text style={styles.buttonText}>Confirm</Text>
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
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 30,
    textAlign: "center",
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
});
