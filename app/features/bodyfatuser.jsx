import {
  Text,
  View,
  Image,
  Keyboard,
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons} from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import SubmitButton from "../../components/SubmitButton";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBar from "../../components/onboarding/HeaderBar";
import ProgressBar from "../../components/onboarding/ProgressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BodyFatSlider from "../../components/onboarding/BodyFatSlider";
import { supabase } from "../../services/supabase";
import { logger } from "../../services/logger";

export default function BodyFatUser() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [currentBodyFat, setCurrentBodyFat] = useState(20);
  const [goalBodyFat, setGoalBodyFat] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = current body fat, 1 = goal body fat

  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Load existing bodyfat data from database on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userResp = await supabase.auth.getUser();
        const userId = userResp?.data?.user?.id;

        if (userId) {
          const { data: existingProfile } = await supabase
            .from("bodyfat_profiles")
            .select("current_body_fat, goal_body_fat")
            .eq("user_id", userId)
            .single();

          if (cancelled) return;

          if (existingProfile) {
            if (existingProfile.current_body_fat != null) {
              setCurrentBodyFat(existingProfile.current_body_fat);
              logger.info("Loaded current body fat from database:", existingProfile.current_body_fat);
            }
            if (existingProfile.goal_body_fat != null) {
              setGoalBodyFat(existingProfile.goal_body_fat);
              logger.info("Loaded goal body fat from database:", existingProfile.goal_body_fat);
            }
          }
        }
      } catch (e) {
        logger.warn("Failed to load bodyfat data from database", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (showConfirmation) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.9);
      modalOpacity.setValue(0);
    }
  }, [showConfirmation]);

  const lightHaptic = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const handleSliderChange = (value, isGoal = false) => {
    lightHaptic();
    if (isGoal) {
      setGoalBodyFat(value);
    } else {
      setCurrentBodyFat(value);
    }
  };
  const getBodyImage = (bodyFatPercentage) => {
    // Body fat percentage ranges based on fitness standards
    if (bodyFatPercentage >= 25) {
      // 25%+ - Higher body fat (fat.png)
      return require("../../assets/fat.png");
    } else if (bodyFatPercentage >= 18) {
      // 18-24% - Moderate body fat (semifat.png)
      return require("../../assets/semifat.png");
    } else if (bodyFatPercentage >= 12) {
      // 12-17% - Normal/healthy range (normal.png)
      return require("../../assets/normal.png");
    } else {
      // Below 12% - Athletic/toned (toned.png)
      return require("../../assets/toned.png");
    }
  };
  const handleNext = () => {
    lightHaptic();
    if (currentStep === 0) {
      setCurrentStep(1);
    } else {
      // Show confirmation dialog instead of immediately submitting
      setShowConfirmation(true);
    }
  };
  const handleConfirm = async () => {
    lightHaptic();
    setShowConfirmation(false);
    setIsLoading(true);
    
    const currentBF = Math.round(currentBodyFat);
    const goalBF = Math.round(goalBodyFat);
    try {
      // Get authenticated user
      const userResp = await supabase.auth.getUser();
      const userId = userResp?.data?.user?.id;

      if (!userId) {
        logger.warn("No authenticated user - saving to AsyncStorage only");
        await AsyncStorage.setItem(
          "onboarding:bodyfat",
          JSON.stringify({ currentBodyFat: currentBF, goalBodyFat: goalBF })
        );
        router.push("features/subscriptionpackages");
        return;
      }

      // Save to database (bodyfat_profiles table)
      logger.info("Saving bodyfat data to database for user", userId);
      const { error } = await supabase
        .from("bodyfat_profiles")
        .upsert({
          user_id: userId,
          current_body_fat: currentBF,
          goal_body_fat: goalBF,
        }, {
          onConflict: "user_id",
        });

      if (error) {
        logger.error("Failed to save bodyfat data:", error);
        // Save to AsyncStorage as fallback
        await AsyncStorage.setItem(
          "onboarding:bodyfat",
          JSON.stringify({ currentBodyFat: currentBF, goalBodyFat: goalBF })
        );
      } else {
        logger.info("Bodyfat data saved to database successfully");
        // Clear AsyncStorage since we saved to DB
        await AsyncStorage.removeItem("onboarding:bodyfat");
      }

      // Check if subscription already exists
      const { data: existingSubscription } = await supabase
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (existingSubscription) {
        logger.info("Active subscription found, skipping to workout selection");
        router.replace("../features/selectworkouts");
      } else {
        logger.info("No active subscription, routing to subscription packages");
        router.push("features/subscriptionpackages");
      }
    } catch (e) {
      logger.error("Error saving bodyfat data:", e);
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(
        "onboarding:bodyfat",
        JSON.stringify({ currentBodyFat: currentBF, goalBodyFat: goalBF })
      );
      router.push("features/subscriptionpackages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    lightHaptic();
    setShowConfirmation(false);
  };

  const handleBack = () => {
    lightHaptic();
    if (currentStep === 1) {
      setCurrentStep(0);
    } else {
      // Navigate back to the registration process page
      router.push("features/registrationprocess");
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("features/subscriptionpackages");
    }, 1500);
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <HeaderBar
              title={currentStep === 0 ? "Current Body Fat" : "Goal Body Fat"}
              currentStep={currentStep + 1}
              totalSteps={2}
              onBackPress={handleBack}
              onHapticFeedback={lightHaptic}
            />
            {/* Progress Bar */}
            <ProgressBar currentStep={currentStep + 1} totalSteps={2} />
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {currentStep === 0 
                ? "Slide to select your current body fat percentage"
                : "Set your target body fat percentage"}
            </Text>

            {/* Main Content */}
            <View style={styles.mainContent}>
                              {currentStep === 0 ? (
                // Current Body Fat Step
                <>
                  <View style={styles.imageContainer}>
                    <Image
                      source={getBodyImage(currentBodyFat)}
                      style={styles.bodyImage}
                    />
                  </View>

                  <BodyFatSlider
                    value={currentBodyFat}
                    onChange={(value) => handleSliderChange(value, false)}
                    minimumTrackTintColor="#4A9EFF"
                    thumbTintColor="#4A9EFF"
                    label="Body Fat Percentage"
                    categoryColor="#4A9EFF"
                  />
                </>
              ) : (
                // Goal Body Fat Step
                <>
                  <View style={styles.imageContainer}>
                    <Image
                      source={getBodyImage(goalBodyFat)}
                      style={styles.bodyImage}
                    />
                  </View>

                  <BodyFatSlider
                    value={goalBodyFat}
                    onChange={(value) => handleSliderChange(value, true)}
                    minimumTrackTintColor="#00D4AA"
                    thumbTintColor="#00D4AA"
                    label="Target Body Fat"
                    categoryColor="#00D4AA"
                  />
                </>
              )}
            </View>
            
            {/* Confirmation Modal */}
            {showConfirmation && (
              <Animated.View
                style={[styles.modalOverlay, { opacity: modalOpacity }]}
              >
                <Animated.View
                  style={[
                    styles.modalContainer,
                    {
                      transform: [{ scale: modalScale }],
                      opacity: modalOpacity,
                    },
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconContainer}>
                      <Ionicons
                        name="fitness"
                        size={40}
                        color="#4A9EFF"
                      />
                    </View>
                    <Text style={styles.modalTitle}>Ready to Begin?</Text>
                    <Text style={styles.modalSubtitle}>Review your body fat goals</Text>
                  </View>

                  <View style={styles.modalContent}>
                    <View style={styles.progressCard}>
                      <View style={styles.progressCardRow}>
                        <View style={styles.progressCardItem}>
                          <Text style={styles.progressCardLabel}>Current</Text>
                          <Text style={styles.progressCardValue}>
                            {Math.round(currentBodyFat)}%
                          </Text>
                          <View style={[styles.progressCardBadge, { backgroundColor: "rgba(74, 158, 255, 0.15)" }]}>
                            <Text style={[styles.progressCardBadgeText, { color: "#4A9EFF" }]}>Starting Point</Text>
                          </View>
                        </View>
                        
                        <View style={styles.arrowContainer}>
                          <Ionicons name="arrow-forward" size={28} color="#4A9EFF" />
                        </View>
                        
                        <View style={styles.progressCardItem}>
                          <Text style={styles.progressCardLabel}>Goal</Text>
                          <Text
                            style={[
                              styles.progressCardValue,
                              styles.progressCardValueGoal,
                            ]}
                          >
                            {Math.round(goalBodyFat)}%
                          </Text>
                          <View style={[styles.progressCardBadge, { backgroundColor: "rgba(0, 212, 170, 0.15)" }]}>
                            <Text style={[styles.progressCardBadgeText, { color: "#00D4AA" }]}>Target</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.progressCardDivider} />
                      
                      <View style={styles.progressInsight}>
                        <Ionicons 
                          name={currentBodyFat > goalBodyFat ? "trending-down" : currentBodyFat < goalBodyFat ? "trending-up" : "remove"} 
                          size={20} 
                          color={currentBodyFat > goalBodyFat ? "#00D4AA" : currentBodyFat < goalBodyFat ? "#4A9EFF" : "#999"}
                          style={styles.progressInsightIcon}
                        />
                        <Text style={styles.modalDetailText}>
                          {currentBodyFat > goalBodyFat
                            ? `Reduce by ${Math.abs(Math.round(currentBodyFat - goalBodyFat))}% body fat`
                            : currentBodyFat < goalBodyFat
                            ? `Increase by ${Math.abs(Math.round(goalBodyFat - currentBodyFat))}% body fat`
                            : "Maintain current body composition"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={handleCancel}
                      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                    >
                      <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: 6 }} />
                      <Text style={styles.cancelButtonText}>Go Back</Text>
                    </Pressable>
                    <Pressable
                      style={styles.confirmButton}
                      onPress={handleConfirm}
                      android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
                    >
                      <View style={styles.confirmButtonSolid}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#fff"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>Let's Go!</Text>
                      </View>
                    </Pressable>
                  </View>
                </Animated.View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Fixed Footer - Outside Animated.View */}
          <View style={styles.footer}>
            <Text style={styles.disclaimer}>
              Want to change something? You can customize everything later in your profile.
            </Text>
            <SubmitButton
              title={currentStep === 0 ? "Continue" : "Submit"}
              onPress={handleNext}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  mainContent: {
    flex: 1,
    paddingTop: 20,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "flex-start",
  },
  imageContainer: {
    height: 280,
    width: "100%",
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  footer: {
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 24,
    borderTopWidth: 1,
    paddingVertical: 16,
    position: "absolute",
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  modalOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    position: "absolute",
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  modalContainer: {
    padding: 28,
    width: "100%",
    maxWidth: 400,
    elevation: 20,
    borderRadius: 28,
    borderWidth: 1,
    shadowRadius: 30,
    shadowOpacity: 0.6,
    shadowColor: "#000",
    backgroundColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 16 },
    borderColor: "rgba(74, 158, 255, 0.2)",
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderWidth: 2,
    borderRadius: 36,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(74, 158, 255, 0.4)",
    backgroundColor: "rgba(74, 158, 255, 0.12)",
  },
  modalTitle: {
    fontSize: 26,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.5)",
  },
  modalContent: {
    marginBottom: 24,
  },
  progressCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  progressCardRow: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressCardItem: {
    flex: 1,
    alignItems: "center",
  },
  progressCardLabel: {
    fontSize: 11,
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.5)",
  },
  progressCardValue: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: -1.5,
    marginBottom: 8,
  },
  progressCardValueGoal: {
    color: "#00D4AA",
  },
  progressCardBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  progressCardBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  arrowContainer: {
    paddingHorizontal: 12,
  },
  progressCardDivider: {
    height: 1,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressInsight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  progressInsightIcon: {
    marginRight: 8,
  },
  modalDetailText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.85)",
  },
  modalButtons: {
    gap: 12,
    width: "100%",
    flexDirection: "row",
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  confirmButton: {
    flex: 1.2,
    height: 56,
    elevation: 8,
    shadowRadius: 12,
    borderRadius: 16,
    shadowOpacity: 0.4,
    overflow: "hidden",
    shadowColor: "#4A9EFF",
    backgroundColor: "#4A9EFF",
    shadowOffset: { width: 0, height: 6 },
  },
  confirmButtonSolid: {
    gap: 8,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonIcon: {
    marginRight: -2,
  },
  confirmButtonText: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
