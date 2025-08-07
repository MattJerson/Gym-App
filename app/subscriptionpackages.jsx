import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function SubscriptionPackages() {
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

  const handleJoin = (plan) => {
    console.log("Joining plan:", plan);
    // Add navigation or payment logic here
  };

  const handleUseCoupon = () => {
    console.log("Use Coupon Pressed");
    // Navigate to a coupon entry screen
    router.push("/home");
  };
  
  const handleFreeTrial = () => {
    console.log("Free Trial Pressed");
    // Navigate or start free trial flow
    router.push("/home");
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              {/* Back Button */}
              <View style={styles.backRow}>
                <Pressable onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </Pressable>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.mainContent}>
                  <Text style={styles.title}>Subscription Packages</Text>
                  <Text style={styles.header}>You're not subscribed to any plan yet.</Text>

                  <Text style={styles.featureText}>Please subscribe to a plan to use all the features:</Text>
                  <Text style={styles.featureItem}>✓ Get your workout plan & track records!</Text>
                  <Text style={styles.featureItem}>✓ Get your meal plan & control diets!</Text>

                  {/* Subscription Cards in a 2x2 Grid */}
                  <View style={styles.cardGridContainer}>
                    {/* First Row */}
                    <View style={styles.cardRow}>
                      <Pressable style={[styles.card, styles.monthlyCard]} onPress={() => handleJoin('Monthly')}>
                        <Text style={styles.cardTitle}>Monthly</Text>
                        <Text style={styles.cardPrice}>$9.99</Text>
                        <Text style={styles.pricePer}>/month</Text>
                        <Text style={styles.cardDescription}>Billed monthly.</Text>
                        <View style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join Now</Text>
                        </View>
                      </Pressable>
                      <Pressable style={[styles.card, styles.threeMonthCard]} onPress={() => handleJoin('3 Months')}>
                        <Text style={[styles.cardTitle, {color: '#fff'}]}>3 Months</Text>
                        <Text style={[styles.cardPrice, {color: '#fff'}]}>$24.99</Text>
                        <Text style={[styles.pricePer, {color: '#eee'}]}>/quarter</Text>
                        <Text style={[styles.cardDescription, {color: '#eee'}]}>Save 15%.</Text>
                        <View style={[styles.joinButton, {backgroundColor: '#fff'}]}>
                          <Text style={[styles.joinButtonText, {color: '#ff4d4d'}]}>Join Now</Text>
                        </View>
                      </Pressable>
                    </View>
                    {/* Second Row */}
                    <View style={styles.cardRow}>
                      <Pressable style={[styles.card, styles.annualCard]} onPress={() => handleJoin('Annual')}>
                        <Text style={styles.cardTitle}>Annual</Text>
                        <Text style={styles.cardPrice}>$79.99</Text>
                        <Text style={styles.pricePer}>/year</Text>
                        <Text style={styles.cardDescription}>Save 30%.</Text>
                        <View style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join Now</Text>
                        </View>
                      </Pressable>
                      <Pressable style={[styles.card, styles.lifetimeCard]} onPress={() => handleJoin('Lifetime')}>
                        <Text style={styles.cardTitle}>Lifetime</Text>
                        <Text style={styles.cardPrice}>$149.99</Text>
                        <Text style={styles.pricePer}>one-time</Text>
                        <Text style={styles.cardDescription}>Forever access.</Text>
                        <View style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join Now</Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>

                  {/* Free Trial Section */}
                  <Text style={styles.normalText}>Get a free trial of premium features for 7 days.</Text>
                  <Pressable onPress={handleFreeTrial}>
                      <Text style={styles.textHighlight}>
                        Free Trial
                      </Text>
                  </Pressable>

                  {/* Coupon Section */}
                  <Text style={styles.normalText}>Are you a member of <Text style={styles.gymName}>Gimnasio Escorpión</Text>?</Text>
                  <Text style={styles.couponText}>Use coupon to join the app</Text>
                  <Pressable
                    style={[styles.button, { width: width * 0.8 }]}
                    onPress={handleUseCoupon}
                  >
                    <Text style={styles.buttonText}>Use Coupon</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: {
    flex: 1,
    width: "100%",
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 20, // Add padding at the bottom of scroll content
  },
  backRow: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 35, // Space below back button
  },
  header: {
    fontSize: 19,
    color: '#ccc',
    fontWeight:'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardGridContainer: {
    marginTop: 20,
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: '48%', // Adjusted for 2 cards per row
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 180, // Ensure cards have same height
  },
  monthlyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  threeMonthCard: {
    backgroundColor: '#ff4d4d',
    borderColor: '#ff4d4d',
    transform: [{ scale: 1.02 }],
  },
  annualCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lifetimeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  cardPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  pricePer: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#ccc',
  },
  cardDescription: {
    fontSize: 13,
    color: '#ccc',
    textAlign: 'center',
    marginVertical: 10,
  },
  joinButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  normalText: { 
    color: "#ffffff",
    fontSize: 15,
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 10,
  },
  textHighlight: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff4d4d",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 15,
  },
  gymName: {
    fontWeight: 'bold',
    color: '#ff4d4d',
  },
  couponText: {
    color: '#ccc',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 15,
    alignSelf: 'center',
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
