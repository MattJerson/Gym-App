import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  Animated,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";

export default function BodyFatInfo() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const fadeAnim = useState(new Animated.Value(0))[0];

  const [bodyfatinfo, setBodyFatInfo] = useState(20);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSubmit = () => {
    console.log("Selected Body Fat Info:", `${Math.round(bodyfatinfo)}%`);
    router.push("/bodyfatgoal");
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
                <Pressable onPress={() => router.push('/register')}>
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </Pressable>
              </View>

              <Text style={styles.title}>Body Fat Information</Text>
              
              <Text style={styles.questionLabel}>What's your Current Bodyfat?</Text>
              
              <Image
                source={require('../../assets/bodygoal.jpeg')}
                style={styles.transformImage}
                />
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={3} 
                  maximumValue={40}
                  value={bodyfatinfo}
                  onValueChange={setBodyFatInfo}
                  minimumTrackTintColor="#ff4d4d"
                  maximumTrackTintColor="#555555"
                  thumbTintColor="#ffffff"
                />
                <Text style={styles.sliderValueText}>{Math.round(bodyfatinfo)}%</Text>
              </View>

              <Text style={styles.disclaimer}>You can always fully customize your routine and diet afterwards</Text> 
              
              <Pressable
                style={[styles.button, { width: width * 0.7 }]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Next</Text>
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
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
    //justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  transformImage: {
    width: 280,
    height: 350,
    margin: 10,
    borderRadius: 25,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20, // Added horizontal padding
    paddingTop: 40,
  },
  backRow: {
    position: 'absolute',
    top: 0,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 40,
    //marginTop: 50, // Added margin to not overlap with back button
  },
  questionLabel: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
    width: Dimensions.get("window").width * 0.7,
    textAlign: 'left',
    marginBottom: 10,
  },
  imageContainer: {
    width: 280,
    height: 350,
    marginBottom: 20,
    borderRadius: 35,
  },
  sliderContainer: {
    width: Dimensions.get("window").width * 0.7,
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  disclaimer: {
    marginTop: 20, // Increased margin for better spacing
    textAlign: 'center',
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
    width: Dimensions.get("window").width * 0.7,
  },
  button: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    elevation: 5,
    shadowColor: '#000', // Added shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
