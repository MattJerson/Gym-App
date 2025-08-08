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
import { Ionicons } from "@expo/vector-icons";

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
    router.push("/home");
  };

  // Navigate to subscription packages screen
  const handleSubscription = () => {
    router.push("/subscriptionpackages");
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
              <View style={{alignItems: 'center'}}>
                {/* Back Button */}
                <View style={styles.backRow}>
                  <Pressable onPress={() => router.push('/register')}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                  </Pressable>
                </View>

                <Text style={styles.title}>Generating Routine</Text>
                
                {/* Logo Image */}
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                />

                {/* Container for the row of images with labels */}
                <View style={styles.imageRowContainer}>
                  <View style={styles.imageColumn}>
                    <Text style={styles.imageLabel}>Current BodyFat</Text>
                    <Image
                      source={require('../assets/bodygoal.jpeg')}
                      style={styles.transformImage}
                    />
                  </View>
                  <View style={styles.imageColumn}>
                    <Text style={styles.imageLabel}>BodyFat Goal</Text>
                    <Image
                      source={require('../assets/bodygoal.jpeg')}
                      style={styles.transformImage}
                    />
                  </View>
                </View>
                <Text style={styles.normalText}>You can use the app for free with limited functions, or become a premium user to unlock all features.</Text>
                <Text style={styles.normalText}>Get a free trial of premium features for 7 days.</Text>
                
                <Pressable style={styles.toggle} onPress={handleSubscription}>
                    <Text style={styles.textHighlight}>
                      Free Trial
                    </Text>
                </Pressable>
                
                <Pressable style={styles.toggle} onPress={handleSkip}>
                  <Text style={styles.normalText}>Use the free version. <Text style={styles.textHighlightSmall}>Skip Now</Text></Text>
                </Pressable>
              </View>

              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                <View style={[styles.paginationDot, styles.paginationDotActive]} />
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
    flex: 1 
  },
  scrollContent: {
    flex: 1, // Changed to flex: 1 to use space-between
  },
  content: {
    flex: 1, // Make content view take available space
    width: "100%",
    justifyContent: 'space-between', // Pushes content to top and pagination to bottom
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20, // Padding at the bottom
  },
  backRow: {
    position: 'absolute',
    top: 0, // Adjusted to align with new padding context
    left: 0,
    zIndex: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  imageRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  imageColumn: {
    alignItems: 'center',
  },
  imageLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 10,
  },
  transformImage: {
    width: Dimensions.get('window').width * 0.4,
    height: (Dimensions.get('window').width * 0.4) * 1.25,
    borderRadius: 20,
  },
  normalText: { 
    color: "#ffffff",
    fontSize: 16, // Slightly smaller for better fit
    textAlign: "center",
    marginTop: 15, // Adjusted margin
    paddingHorizontal: 10, // Added padding
  },
  textHighlight: {
    fontSize: 21,
    fontWeight: "bold", // Bolder
    color: "#ff4d4d",
    textAlign: "center",
    marginTop: 15,
  },
  textHighlightSmall: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff4d4d",
  },
  toggle: {
    marginTop: 10,
  },
  // Styles for the new pagination dots
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#555', // Inactive color
    marginHorizontal: 8,
  },
  paginationDotActive: {
    backgroundColor: '#ff4d4d', // Active color
  },
});
