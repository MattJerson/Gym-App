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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
export default function BodyFatUser() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;  const [currentBodyFat, setCurrentBodyFat] = useState(20);
  const [goalBodyFat, setGoalBodyFat] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = current body fat, 1 = goal body fat

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
  }, [fadeAnim, slideAnim]);  const handleSliderChange = (value, isGoal = false) => {
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
    if (currentStep === 0) {
      setCurrentStep(1);
    } else {
      // Show confirmation dialog instead of immediately submitting
      setShowConfirmation(true);
    }
  };
  const handleConfirm = () => {
    setShowConfirmation(false);
    console.log("Current Body Fat:", `${Math.round(currentBodyFat)}%`);
    console.log("Goal Body Fat:", `${Math.round(goalBodyFat)}%`);
    router.push("features/subscriptionpackages");
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    console.log("Current Body Fat:", `${Math.round(currentBodyFat)}%`);
    console.log("Goal Body Fat:", `${Math.round(goalBodyFat)}%`);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push("features/subscriptionpackages");
    }, 1500);
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient 
        colors={["#0F1419", "#1a1a1a", "#2d2d2d"]} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0F1419" />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View 
            style={[
              styles.content, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable 
                onPress={handleBack}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </Pressable>
              <Text style={styles.headerTitle}>
                {currentStep === 0 ? "Current Body Fat" : "Goal Body Fat"}
              </Text>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>{currentStep + 1}/2</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: currentStep === 0 ? '50%' : '100%' }
                  ]}
                />
              </View>
            </View>            {/* Main Content */}
            <View style={styles.mainContent}>
              {currentStep === 0 ? (
                // Current Body Fat Step
                <>                  <Text style={styles.subtitle}>
                    What's your current body fat percentage?
                  </Text>

                  <View style={styles.imageContainer}>
                    <Image
                      source={getBodyImage(currentBodyFat)}
                      style={styles.bodyImage}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.4)"]}
                      style={styles.imageOverlay}
                    />
                  </View>

                  <View style={styles.sliderSection}>
                    <View style={styles.valueDisplay}>
                      <Text style={styles.valueText}>
                        {Math.round(currentBodyFat)}%
                      </Text>
                      <Text style={styles.valueLabel}>Current</Text>
                    </View>
                      <Slider
                      style={styles.slider}
                      minimumValue={3}
                      maximumValue={40}
                      value={currentBodyFat}
                      onValueChange={(value) => handleSliderChange(value, false)}
                      minimumTrackTintColor="#4A9EFF"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbTintColor="#ffffff"
                      thumbStyle={styles.sliderThumb}
                    />
                  </View>
                </>
              ) : (
                // Goal Body Fat Step
                <>                  <Text style={styles.subtitle}>
                    What's your target body fat percentage?
                  </Text>

                  <View style={styles.imageContainer}>
                    <Image
                      source={getBodyImage(goalBodyFat)}
                      style={styles.bodyImage}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.4)"]}
                      style={styles.imageOverlay}
                    />
                  </View>

                  <View style={styles.sliderSection}>
                    <View style={styles.valueDisplay}>
                      <Text style={styles.valueText}>
                        {Math.round(goalBodyFat)}%
                      </Text>
                      <Text style={styles.valueLabel}>Goal</Text>
                    </View>
                      <Slider
                      style={styles.slider}
                      minimumValue={3}
                      maximumValue={40}
                      value={goalBodyFat}
                      onValueChange={(value) => handleSliderChange(value, true)}
                      minimumTrackTintColor="#FF6B6B"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbTintColor="#ffffff"                      thumbStyle={styles.sliderThumb}
                    />
                  </View>
                </>
              )}
            </View>

                        {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <Text style={styles.disclaimer}>
                You can always adjust these values later in your profile settings.
              </Text>

              <Pressable
                style={styles.submitButton}
                onPress={handleNext}
                disabled={isLoading}
              >
                <View style={styles.submitButtonSolid}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.submitButtonText}>
                        {currentStep === 0 ? "Next" : "Save & Continue"}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#fff"
                        style={styles.submitButtonIcon}
                      />
                    </View>
                  )}
                </View>
              </Pressable>
            </View>


            {/* Confirmation Modal */}
            {showConfirmation && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Confirm Your Goal</Text>
                  <Text style={styles.modalSubtitle}>Your Progress Goal</Text>
                  <Text style={styles.modalProgressText}>
                    From {Math.round(currentBodyFat)}% to {Math.round(goalBodyFat)}%
                  </Text>
                  <Text style={styles.modalDetailText}>
                    {currentBodyFat > goalBodyFat 
                      ? `${Math.abs(Math.round(currentBodyFat - goalBodyFat))}% to lose`
                      : `${Math.abs(Math.round(goalBodyFat - currentBodyFat))}% to gain`
                    }
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <Pressable style={styles.cancelButton} onPress={handleCancel}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                      <LinearGradient
                        colors={["#4A9EFF", "#356FB0"]}
                        style={styles.confirmButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,

  },
  stepIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  stepText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4A9EFF",
    borderRadius: 2,
  },  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
  },  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: "500",
  },  imageContainer: {
    width: "100%",
    height: 280,
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  bodyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },  sliderSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  valueDisplay: {
    alignItems: "center",
    marginBottom: 20,
  },
  valueText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },  slider: {
    width: "100%",
    height: 60,
    marginBottom: 10,
  },
  sliderThumb: {
    width: 28,
    height: 28,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,    elevation: 6,
  },  
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  modalContainer: {
    backgroundColor: "#0B0B0B",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  modalProgressText: {
    fontSize: 20,
    color: "#4A9EFF",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDetailText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.37)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
  },
  confirmButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },  bottomSection: {
    paddingBottom: 20,
    paddingTop: 20,
  },
  disclaimer: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 25,
    marginTop: 15,
    paddingHorizontal: 10,
    fontStyle: "italic",
  },nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 10,
  },
  nextButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  nextButtonLoading: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
    opacity: 0.9,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpinner: {
    marginRight: 12,
  },
  submitButton: {
  width: "100%",
  height: 56,
  borderRadius: 16,
  overflow: "hidden",
},
submitButtonSolid: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 24,
  backgroundColor: "#356FB0", // solid color (same as Register)
},
submitButtonText: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#fff",
  marginRight: 8,
},
submitButtonIcon: {
  opacity: 0.8,
},

});
