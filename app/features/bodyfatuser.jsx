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
import { LinearGradient } from "expo-linear-gradient";
import SubmitButton from "../../components/SubmitButton";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBar from "../../components/onboarding/HeaderBar";
import ProgressBar from "../../components/onboarding/ProgressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BodyFatSlider from "../../components/onboarding/BodyFatSlider";

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
  const handleConfirm = () => {
    lightHaptic();
    setShowConfirmation(false);
    console.log("Current Body Fat:", `${Math.round(currentBodyFat)}%`);
    console.log("Goal Body Fat:", `${Math.round(goalBodyFat)}%`);
    // persist bodyfat data for final onboarding
    (async () => {
      try {
        await AsyncStorage.setItem(
          "onboarding:bodyfat",
          JSON.stringify({
            currentBodyFat: Math.round(currentBodyFat),
            goalBodyFat: Math.round(goalBodyFat),
          })
        );
      } catch (e) {
        console.warn("Failed to persist bodyfat data", e);
      }
      router.push("features/subscriptionpackages");
    })();
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
    console.log("Current Body Fat:", `${Math.round(currentBodyFat)}%`);
    console.log("Goal Body Fat:", `${Math.round(goalBodyFat)}%`);

    setTimeout(() => {
      setIsLoading(false);
      router.push("features/subscriptionpackages");
    }, 1500);
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0F1419" />
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
            <ProgressBar currentStep={currentStep + 1} totalSteps={2} />{" "}
            {/* Main Content */}
            <View style={styles.mainContent}>
              {currentStep === 0 ? (
                // Current Body Fat Step
                <>
                  <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Current Body Fat</Text>
                    <Text style={styles.subtitle}>
                      Slide to select your current body fat percentage
                    </Text>
                  </View>

                  <View style={styles.imageContainer}>
                    <View style={styles.imageBorder}>
                      <Image
                        source={getBodyImage(currentBodyFat)}
                        style={styles.bodyImage}
                      />
                    </View>
                    <LinearGradient
                      colors={["transparent", "rgba(11,11,11,0.3)"]}
                      style={styles.imageOverlay}
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
                  <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Goal Body Fat</Text>
                    <Text style={styles.subtitle}>
                      Set your target body fat percentage
                    </Text>
                  </View>

                  <View style={styles.imageContainer}>
                    <View style={styles.imageBorder}>
                      <Image
                        source={getBodyImage(goalBodyFat)}
                        style={styles.bodyImage}
                      />
                    </View>
                    <LinearGradient
                      colors={["transparent", "rgba(11,11,11,0.3)"]}
                      style={styles.imageOverlay}
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
            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <Text style={styles.disclaimer}>
                You can always adjust these values later in your profile
                settings.
              </Text>

              <SubmitButton
                text={currentStep === 0 ? "Next" : "Save & Continue"}
                onPress={handleNext}
                isLoading={isLoading}
                loadingText="Loading..."
                icon="arrow-forward"
                variant="solid"
              />
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
                        name="checkmark-circle"
                        size={48}
                        color="#4A9EFF"
                      />
                    </View>
                    <Text style={styles.modalTitle}>Confirm Your Goal</Text>
                    <Text style={styles.modalSubtitle}>Your Progress Goal</Text>
                  </View>

                  <View style={styles.modalContent}>
                    <View style={styles.progressCard}>
                      <View style={styles.progressCardRow}>
                        <View style={styles.progressCardItem}>
                          <Text style={styles.progressCardLabel}>Current</Text>
                          <Text style={styles.progressCardValue}>
                            {Math.round(currentBodyFat)}%
                          </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color="#666" />
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
                        </View>
                      </View>
                      <View style={styles.progressCardDivider} />
                      <Text style={styles.modalDetailText}>
                        {currentBodyFat > goalBodyFat
                          ? `${Math.abs(
                              Math.round(currentBodyFat - goalBodyFat)
                            )}% to lose`
                          : currentBodyFat < goalBodyFat
                          ? `${Math.abs(
                              Math.round(goalBodyFat - currentBodyFat)
                            )}% to gain`
                          : "Maintain current body fat"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={handleCancel}
                      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={styles.confirmButton}
                      onPress={handleConfirm}
                      android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
                    >
                      <View style={styles.confirmButtonSolid}>
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color="#fff"
                          style={styles.confirmButtonIcon}
                        />
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                      </View>
                    </Pressable>
                  </View>
                </Animated.View>
              </Animated.View>
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainContent: {
    flex: 1,
    paddingTop: 10,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  titleSection: {
    width: "100%",
    marginBottom: 16,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 6,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
    color: "rgba(255, 255, 255, 0.6)",
  },
  imageContainer: {
    height: 220,
    width: "100%",
    borderRadius: 20,
    marginBottom: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageBorder: {
    width: "90%",
    height: "100%",
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  bodyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  imageOverlay: {
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
    position: "absolute",
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modalContainer: {
    padding: 24,
    width: "100%",
    maxWidth: 380,
    elevation: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowRadius: 24,
    shadowOpacity: 0.5,
    shadowColor: "#000",
    backgroundColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 12 },
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderRadius: 32,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(74, 158, 255, 0.3)",
    backgroundColor: "rgba(74, 158, 255, 0.15)",
  },
  modalTitle: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 6,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.5)",
  },
  modalContent: {
    marginBottom: 24,
  },
  progressCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  progressCardRow: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressCardItem: {
    flex: 1,
    alignItems: "center",
  },
  progressCardLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.5)",
  },
  progressCardValue: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -1,
  },
  progressCardValueGoal: {
    color: "#4A9EFF",
  },
  progressCardDivider: {
    height: 1,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  modalDetailText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
  },
  modalButtons: {
    gap: 12,
    width: "100%",
    flexDirection: "row",
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  confirmButton: {
    flex: 1,
    height: 52,
    elevation: 6,
    shadowRadius: 8,
    borderRadius: 16,
    shadowOpacity: 0.3,
    overflow: "hidden",
    shadowColor: "#4A9EFF",
    backgroundColor: "#4A9EFF",
    shadowOffset: { width: 0, height: 4 },
  },
  confirmButtonSolid: {
    gap: 8,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonIcon: {
    marginRight: -4,
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  bottomSection: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 10,
    color: "rgba(255, 255, 255, 0.5)",
  },
});
