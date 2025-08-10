import {
  Text,
  View,
  Image,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function GenerateRoutine() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Navigate to home screen
  const handleSkip = () => {
    router.push("/page/home");
  };

  // Navigate to subscription packages screen
  const handleSubscription = () => {
    router.push("/features/subscriptionpackages");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView style={styles.scrollContent}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              {/* Main content wrapper */}
              <View style={{ alignItems: "center" }}>
                {/* Back Button */}
                <View style={styles.backRow}>
                  <Pressable onPress={() => router.push("/register")}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                  </Pressable>
                </View>

                <Text style={styles.title}>Generating Routine</Text>

                {/* Logo Image */}
                <Image
                  source={require("../../assets/logo.png")}
                  style={styles.logo}
                />

                {/* Container for the row of images with labels */}
                <View style={styles.imageRowContainer}>
                  <View style={styles.imageColumn}>
                    <Text style={styles.imageLabel}>Current BodyFat</Text>
                    <Image
                      source={require("../../assets/bodygoal.jpeg")}
                      style={styles.transformImage}
                    />
                  </View>
                  <View style={styles.imageColumn}>
                    <Text style={styles.imageLabel}>BodyFat Goal</Text>
                    <Image
                      source={require("../../assets/bodygoal.jpeg")}
                      style={styles.transformImage}
                    />
                  </View>
                </View>
                <Text style={styles.normalText}>
                  You can use the app for free with limited functions, or become
                  a premium user to unlock all features.
                </Text>
                <Text style={styles.normalText}>
                  Get a free trial of premium features for 7 days.
                </Text>

                <Pressable style={styles.toggle} onPress={handleSubscription}>
                  <Text style={styles.textHighlight}>Free Trial</Text>
                </Pressable>

                <Pressable style={styles.toggle} onPress={handleSkip}>
                  <Text style={styles.normalText}>
                    Use the free version.{" "}
                    <Text style={styles.textHighlightSmall}>Skip Now</Text>
                  </Text>
                </Pressable>
              </View>

              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                <View
                  style={[styles.paginationDot, styles.paginationDotActive]}
                />
                <View style={styles.paginationDot} />
              </View>
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1, // Changed to flex: 1 to use space-between
  },
  content: {
    flex: 1, // Make content view take available space
    width: "100%",
    paddingTop: 60,
    paddingBottom: 20, // Padding at the bottom
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "space-between", // Pushes content to top and pagination to bottom
  },
  backRow: {
    top: 0, // Adjusted to align with new padding context
    left: 0,
    zIndex: 10,
    position: "absolute",
  },
  title: {
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 20,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: "contain",
  },
  imageRowContainer: {
    width: "100%",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  imageColumn: {
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  transformImage: {
    borderRadius: 20,
    width: Dimensions.get("window").width * 0.4,
    height: Dimensions.get("window").width * 0.4 * 1.25,
  },
  normalText: {
    fontSize: 16, // Slightly smaller for better fit
    marginTop: 15, // Adjusted margin
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 10, // Added padding
  },
  textHighlight: {
    fontSize: 21,
    marginTop: 15,
    color: "#ff4d4d",
    fontWeight: "bold", // Bolder
    textAlign: "center",
  },
  textHighlightSmall: {
    fontSize: 16,
    color: "#ff4d4d",
    fontWeight: "bold",
  },
  toggle: {
    marginTop: 10,
  },
  // Styles for the new pagination dots
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 8,
    backgroundColor: "#555", // Inactive color
  },
  paginationDotActive: {
    backgroundColor: "#ff4d4d", // Active color
  },
});
