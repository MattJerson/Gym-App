import {
  Text,
  View,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
    router.push("/page/home");
  };

  const handleFreeTrial = () => {
    console.log("Free Trial Pressed");
    // Navigate or start free trial flow
    router.push("/page/home");
  };

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
                  <Text style={styles.header}>
                    You're not subscribed to any plan yet.
                  </Text>

                  <Text style={styles.featureText}>
                    Please subscribe to a plan to use all the features:
                  </Text>
                  <Text style={styles.featureItem}>
                    ✓ Get your workout plan & track records!
                  </Text>
                  <Text style={styles.featureItem}>
                    ✓ Get your meal plan & control diets!
                  </Text>

                  {/* Subscription Cards in a 2x2 Grid */}
                  <View style={styles.cardGridContainer}>
                    {/* First Row */}
                    <View style={styles.cardRow}>
                      <Pressable
                        style={[styles.card, styles.monthlyCard]}
                        onPress={() => handleJoin("Monthly")}
                      >
                        <Text style={styles.cardTitle}>Monthly</Text>
                        <Text style={styles.cardPrice}>$9.99</Text>
                        <Text style={styles.pricePer}>/month</Text>
                        <Text style={styles.cardDescription}>
                          Billed monthly.
                        </Text>
                        <View style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join Now</Text>
                        </View>
                      </Pressable>
                      <Pressable
                        style={[styles.card, styles.threeMonthCard]}
                        onPress={() => handleJoin("3 Months")}
                      >
                        <Text style={[styles.cardTitle, { color: "#fff" }]}>
                          3 Months
                        </Text>
                        <Text style={[styles.cardPrice, { color: "#fff" }]}>
                          $24.99
                        </Text>
                        <Text style={[styles.pricePer, { color: "#eee" }]}>
                          /quarter
                        </Text>
                        <Text
                          style={[styles.cardDescription, { color: "#eee" }]}
                        >
                          Save 15%.
                        </Text>
                        <View
                          style={[
                            styles.joinButton,
                            { backgroundColor: "#fff" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.joinButtonText,
                              { color: "#ff4d4d" },
                            ]}
                          >
                            Join Now
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                    {/* Second Row */}
                    <View style={styles.cardRow}>
                      <Pressable
                        style={[styles.card, styles.annualCard]}
                        onPress={() => handleJoin("Annual")}
                      >
                        <Text style={styles.cardTitle}>Annual</Text>
                        <Text style={styles.cardPrice}>$79.99</Text>
                        <Text style={styles.pricePer}>/year</Text>
                        <Text style={styles.cardDescription}>Save 30%.</Text>
                        <View style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join Now</Text>
                        </View>
                      </Pressable>
                      <Pressable
                        style={[styles.card, styles.lifetimeCard]}
                        onPress={() => handleJoin("Lifetime")}
                      >
                        <Text style={styles.cardTitle}>Lifetime</Text>
                        <Text style={styles.cardPrice}>$149.99</Text>
                        <Text style={styles.pricePer}>one-time</Text>
                        <Text style={styles.cardDescription}>
                          Forever access.
                        </Text>
                        <View style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join Now</Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>

                  {/* Free Trial Section */}
                  <Text style={styles.normalText}>
                    Get a free trial of premium features for 7 days.
                  </Text>
                  <Pressable onPress={handleFreeTrial}>
                    <Text style={styles.textHighlight}>Free Trial</Text>
                  </Pressable>

                  {/* Coupon Section */}
                  <Text style={styles.normalText}>
                    Are you a member of{" "}
                    <Text style={styles.gymName}>Gimnasio Escorpión</Text>?
                  </Text>
                  <Text style={styles.couponText}>
                    Use coupon to join the app
                  </Text>
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
    flex: 1,
  },
  content: {
    flex: 1,
    width: "100%",
  },
  mainContent: {
    flex: 1,
    paddingBottom: 20, // Add padding at the bottom of scroll content
    alignItems: "center",
    paddingHorizontal: 10,
  },
  backRow: {
    top: 40,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  title: {
    fontSize: 22,
    marginTop: 35, // Space below back button
    marginBottom: 10,
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 1.5,
    textAlign: "center",
    textTransform: "uppercase",
  },
  header: {
    fontSize: 19,
    color: "#ccc",
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  featureText: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  featureItem: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 5,
    textAlign: "center",
  },
  cardGridContainer: {
    marginTop: 20,
    width: "100%",
  },
  cardRow: {
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    padding: 15,
    width: "48%", // Adjusted for 2 cards per row
    borderWidth: 1,
    minHeight: 180, // Ensure cards have same height
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthlyCard: {
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  threeMonthCard: {
    borderColor: "#ff4d4d",
    backgroundColor: "#ff4d4d",
    transform: [{ scale: 1.02 }],
  },
  annualCard: {
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  lifetimeCard: {
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cardPrice: {
    fontSize: 24,
    color: "#fff",
    marginVertical: 5,
    fontWeight: "bold",
  },
  pricePer: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "normal",
  },
  cardDescription: {
    fontSize: 13,
    color: "#ccc",
    textAlign: "center",
    marginVertical: 10,
  },
  joinButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ff4d4d",
  },
  joinButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "bold",
  },
  normalText: {
    fontSize: 15,
    marginTop: 5,
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  textHighlight: {
    fontSize: 20,
    marginTop: 5,
    color: "#ff4d4d",
    marginBottom: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  gymName: {
    color: "#ff4d4d",
    fontWeight: "bold",
  },
  couponText: {
    fontSize: 14,
    marginTop: 5,
    color: "#ccc",
    textAlign: "center",
  },
  button: {
    elevation: 5,
    marginTop: 15,
    borderRadius: 25,
    shadowRadius: 3.84,
    paddingVertical: 15,
    shadowOpacity: 0.25,
    alignSelf: "center",
    alignItems: "center",
    shadowColor: "#000",
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
