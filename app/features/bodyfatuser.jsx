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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { supabase } from '../../services/supabase';
import { getNextOnboardingStep } from "../../utils/onboardingFlow";
import SubmitButton from "../../components/SubmitButton";
import HeaderBar from "../../components/onboarding/HeaderBar";
import ProgressBar from "../../components/onboarding/ProgressBar";
import BodyFatSlider from "../../components/onboarding/BodyFatSlider";

export default function BodyFatUser() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;  const [currentBodyFat, setCurrentBodyFat] = useState(20);
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
    
    // Load existing body fat data if available
    (async () => {
      try {
        const userResp = await supabase.auth.getUser();
        const userId = userResp?.data?.user?.id;
        
        if (userId) {
          const { data: profile } = await supabase
            .from('bodyfat_profiles')
            .select('current_body_fat, goal_body_fat')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (profile) {
            if (profile.current_body_fat) {
              setCurrentBodyFat(profile.current_body_fat);
            }
            if (profile.goal_body_fat) {
              setGoalBodyFat(profile.goal_body_fat);
            }
          }
        }
      } catch (error) {
        console.error('Error loading body fat data:', error);
      }
    })();
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
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };  const handleSliderChange = (value, isGoal = false) => {
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
    console.log("Current Body Fat:", `${Math.round(currentBodyFat)}%`);
    console.log("Goal Body Fat:", `${Math.round(goalBodyFat)}%`);
    
    try {
      // Save body fat data to database
      const userResp = await supabase.auth.getUser();
      const userId = userResp?.data?.user?.id;
      
      if (userId) {
        // First, try to insert into bodyfat_profiles
        const { error: insertError } = await supabase
          .from('bodyfat_profiles')
          .insert({
            user_id: userId,
            current_body_fat: Math.round(currentBodyFat),
            goal_body_fat: Math.round(goalBodyFat),
          });
        
        // If insert fails (user already exists), update instead
        if (insertError) {
          if (insertError.code === '23505') { // Unique constraint violation
            const { error: updateError } = await supabase
              .from('bodyfat_profiles')
              .update({
                current_body_fat: Math.round(currentBodyFat),
                goal_body_fat: Math.round(goalBodyFat),
              })
              .eq('user_id', userId);
            
            if (updateError) {
              console.error('Error updating body fat data:', updateError);
              Alert.alert('Error', 'Failed to save body fat data');
              setIsLoading(false);
              return;
            }
          } else {
            console.error('Error saving body fat data:', insertError);
            Alert.alert('Error', 'Failed to save body fat data');
            setIsLoading(false);
            return;
          }
        }
        
        console.log('Body fat data saved successfully to database');
        
        // Clear AsyncStorage draft
        await AsyncStorage.removeItem('onboarding:bodyfat');
        
        // Determine next step dynamically
        const nextStep = await getNextOnboardingStep('bodyfatuser', userId);
        router.replace(nextStep);
      } else {
        router.replace("features/subscriptionpackages");
      }
    } catch (error) {
      console.error('Error in handleConfirm:', error);
      Alert.alert('Error', 'Something went wrong');
      router.replace("features/subscriptionpackages");
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

  const handleSubmit = async () => {
    setIsLoading(true);
    console.log("Current Body Fat:", `${Math.round(currentBodyFat)}%`);
    console.log("Goal Body Fat:", `${Math.round(goalBodyFat)}%`);
    
    try {
      // Save body fat data to database
      const userResp = await supabase.auth.getUser();
      const userId = userResp?.data?.user?.id;
      
      if (userId) {
        // First, try to insert into bodyfat_profiles
        const { error: insertError } = await supabase
          .from('bodyfat_profiles')
          .insert({
            user_id: userId,
            current_body_fat: Math.round(currentBodyFat),
            goal_body_fat: Math.round(goalBodyFat),
          });
        
        // If insert fails (user already exists), update instead
        if (insertError) {
          if (insertError.code === '23505') { // Unique constraint violation
            await supabase
              .from('bodyfat_profiles')
              .update({
                current_body_fat: Math.round(currentBodyFat),
                goal_body_fat: Math.round(goalBodyFat),
              })
              .eq('user_id', userId);
          } else {
            console.error('Error saving body fat data:', insertError);
          }
        }
        
        // Determine next step dynamically
        const nextStep = await getNextOnboardingStep('bodyfatuser', userId);
        router.replace(nextStep);
      } else {
        router.replace("features/subscriptionpackages");
      }
    } catch (error) {
      console.error('Error saving body fat data:', error);
      router.replace("features/subscriptionpackages");
    } finally {
      setIsLoading(false);
    }
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
                transform: [{ translateY: slideAnim }]
              }
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
            <ProgressBar
              currentStep={currentStep + 1}
              totalSteps={2}
            />            {/* Main Content */}
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
                You can always adjust these values later in your profile settings.
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
                style={[
                  styles.modalOverlay,
                  { opacity: modalOpacity }
                ]}
              >
                <Animated.View 
                  style={[
                    styles.modalContainer,
                    { 
                      transform: [{ scale: modalScale }],
                      opacity: modalOpacity
                    }
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconContainer}>
                      <Ionicons name="checkmark-circle" size={48} color="#4A9EFF" />
                    </View>
                    <Text style={styles.modalTitle}>Confirm Your Goal</Text>
                    <Text style={styles.modalSubtitle}>Your Progress Goal</Text>
                  </View>
                  
                  <View style={styles.modalContent}>
                    <View style={styles.progressCard}>
                      <View style={styles.progressCardRow}>
                        <View style={styles.progressCardItem}>
                          <Text style={styles.progressCardLabel}>Current</Text>
                          <Text style={styles.progressCardValue}>{Math.round(currentBodyFat)}%</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color="#666" />
                        <View style={styles.progressCardItem}>
                          <Text style={styles.progressCardLabel}>Goal</Text>
                          <Text style={[styles.progressCardValue, styles.progressCardValueGoal]}>{Math.round(goalBodyFat)}%</Text>
                        </View>
                      </View>
                      <View style={styles.progressCardDivider} />
                      <Text style={styles.modalDetailText}>
                        {currentBodyFat > goalBodyFat 
                          ? `${Math.abs(Math.round(currentBodyFat - goalBodyFat))}% to lose`
                          : currentBodyFat < goalBodyFat
                          ? `${Math.abs(Math.round(goalBodyFat - currentBodyFat))}% to gain`
                          : 'Maintain current body fat'
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalButtons}>
                    <Pressable 
                      style={styles.cancelButton} 
                      onPress={handleCancel}
                      android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.confirmButton} 
                      onPress={handleConfirm}
                      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
                    >
                      <View style={styles.confirmButtonSolid}>
                        <Ionicons name="checkmark" size={20} color="#fff" style={styles.confirmButtonIcon} />
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
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
  },
  titleSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
    fontWeight: "500",
  },
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBorder: {
    width: "90%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    height: "30%",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(74, 158, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 158, 255, 0.3)",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalContent: {
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  progressCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  progressCardItem: {
    alignItems: "center",
    flex: 1,
  },
  progressCardLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressCardValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  progressCardValueGoal: {
    color: "#4A9EFF",
  },
  progressCardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  modalDetailText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#4A9EFF",
    shadowColor: "#4A9EFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonSolid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
    paddingBottom: 20,
    paddingTop: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
});
