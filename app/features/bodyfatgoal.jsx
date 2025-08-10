import {
  Text,
  View,
  Image,
  Keyboard,
  Animated,
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
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";

export default function BodyFatGoal() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const fadeAnim = useState(new Animated.Value(0))[0];

  const [bodyfatinfo, setBodyFatGoal] = useState(20);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSubmit = () => {
    console.log("Selected Body Fat Goal:", `${Math.round(bodyfatinfo)}%`);
    router.push("/features/generatingroutine");
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
              <View style={styles.backRow}>
                <Pressable onPress={() => router.push("/register")}>
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </Pressable>
              </View>

              <Text style={styles.title}>Body Fat Goal</Text>

              <Text style={styles.questionLabel}>
                What's your Bodyfat Goal?
              </Text>

              <Image
                source={require("../../assets/bodygoal.jpeg")}
                style={styles.transformImage}
              />
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={3}
                  maximumValue={40}
                  value={bodyfatinfo}
                  onValueChange={setBodyFatGoal}
                  minimumTrackTintColor="#ff4d4d"
                  maximumTrackTintColor="#555555"
                  thumbTintColor="#ffffff"
                />
                <Text style={styles.sliderValueText}>
                  {Math.round(bodyfatinfo)}%
                </Text>
              </View>

              <Text style={styles.disclaimer}>
                You can always fully customize your routine and diet afterwards
              </Text>

              <Pressable
                style={[styles.button, { width: width * 0.7 }]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Generate Routine</Text>
              </Pressable>
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
    flexGrow: 1,
    paddingVertical: 20,
    alignItems: "center",
    //justifyContent: "center",
  },
  transformImage: {
    margin: 10,
    width: 280,
    height: 350,
    borderRadius: 25,
  },
  content: {
    width: "100%",
    paddingTop: 40,
    alignItems: "center",
    paddingHorizontal: 20, // Added horizontal padding
  },
  backRow: {
    top: 0,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  title: {
    fontSize: 14,
    //marginTop: 50, // Added margin to not overlap with back button
    letterSpacing: 2,
    marginBottom: 40,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
  },
  questionLabel: {
    fontSize: 13,
    color: "#ccc",
    marginBottom: 10,
    fontWeight: "500",
    textAlign: "left",
    width: Dimensions.get("window").width * 0.7,
  },
  imageContainer: {
    width: 280,
    height: 350,
    marginBottom: 20,
    borderRadius: 35,
  },
  sliderContainer: {
    alignItems: "center",
    width: Dimensions.get("window").width * 0.7,
  },
  slider: {
    height: 40,
    width: "100%",
  },
  sliderValueText: {
    marginTop: 5,
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "bold",
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 20, // Increased margin for better spacing
    color: "#ccc",
    fontWeight: "500",
    textAlign: "center",
    width: Dimensions.get("window").width * 0.7,
  },
  button: {
    elevation: 5,
    marginTop: 20,
    borderRadius: 25,
    shadowRadius: 3.84,
    shadowOpacity: 0.25,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#000", // Added shadow for iOS
    backgroundColor: "#ff4d4d",
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
