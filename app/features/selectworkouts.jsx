import {
  View,
  Text,
  Alert,
  Image,
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingService } from "../../services/OnboardingService";

const { width } = Dimensions.get("window");

// Import workout images
const WORKOUT_IMAGES = {
  image1: require("../../assets/browseworkout1.jpg"),
  image2: require("../../assets/browseworkout2.jpg"),
  image3: require("../../assets/browseworkout3.jpg"),
  image4: require("../../assets/browseworkout4.jpg"),
  image5: require("../../assets/browseworkout5.jpg"),
};

export default function SelectWorkouts() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [categories, setCategories] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [progressInfo, setProgressInfo] = useState({ currentStep: 1, totalSteps: 2, percentage: 50 });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    loadWorkouts();
    checkOnboardingProgress();
  }, []);

  const checkOnboardingProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const status = await OnboardingService.checkOnboardingStatus(user.id);
        setOnboardingStatus(status);
        
        const progress = OnboardingService.calculateProgress('workouts', status);
        setProgressInfo(progress);
      }
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    }
  };

  const loadWorkouts = async () => {
    try {
      // Load categories first
      const { data: categoriesData, error: catError } = await supabase
        .from("workout_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (catError) throw catError;

      // Load workout templates (admin-created only, not user-created)
      const { data: workoutsData, error: workError } = await supabase
        .from("workout_templates")
        .select(
          `
          *,
          category:workout_categories(id, name, emoji, color)
        `
        )
        .eq("is_active", true)
        .is("created_by_user_id", null) // Only show admin templates (not user-created)
        .order("name");

      if (workError) throw workError;

      // Map images to categories
      const categoriesWithImages = categoriesData.map((cat, index) => ({
        ...cat,
        localImage: WORKOUT_IMAGES[`image${(index % 5) + 1}`],
      }));

      // Group workouts by category
      const workoutsWithImages = workoutsData.map((workout) => {
        const categoryIndex = categoriesWithImages.findIndex(
          (c) => c.id === workout.category_id
        );
        return {
          ...workout,
          localImage: WORKOUT_IMAGES[`image${(categoryIndex % 5) + 1}`],
        };
      });

      setCategories(categoriesWithImages);
      setWorkouts(workoutsWithImages);
      setFilteredWorkouts(workoutsWithImages); // Initially show all
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter workouts when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredWorkouts(workouts);
    } else {
      setFilteredWorkouts(
        workouts.filter((w) => w.category_id === selectedCategory)
      );
    }
  }, [selectedCategory, workouts]);

  const toggleWorkout = (workoutId) => {
    setSelectedWorkouts((prev) => {
      if (prev.includes(workoutId)) {
        return prev.filter((id) => id !== workoutId);
      } else {
        // Limit to 3 selections
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, workoutId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedWorkouts.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Error getting user:", userError);
        Alert.alert("Error", "Please log in to continue");
        setIsSaving(false);
        return;
      }

      // Save selected workouts to database
      // Get workout details for the selected workouts
      const selectedWorkoutData = workouts.filter(w => selectedWorkouts.includes(w.id));
      
      const workoutInserts = selectedWorkoutData.map(workout => ({
        user_id: user.id,
        template_id: workout.id,
        workout_name: workout.name,
        workout_type: 'Pre-Made',
      }));

      const { error: insertError } = await supabase
        .from("user_saved_workouts")
        .insert(workoutInserts);

      if (insertError) {
        console.error("Error saving workouts:", insertError);
        Alert.alert("Error", "Failed to save workout selections");
        setIsSaving(false);
        return;
      }

      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem(
        "onboarding:selectedWorkouts",
        JSON.stringify(selectedWorkouts)
      );
      // Check if meal plan step is already complete
      const updatedStatus = await OnboardingService.checkOnboardingStatus(user.id);
      
      if (updatedStatus.hasMealPlan) {
        // Meal plan already selected - mark onboarding complete and go to home
        await OnboardingService.markOnboardingComplete(user.id);
        router.replace("/page/home");
      } else {
        // Navigate to meal plan selection
        router.replace("/features/selectmealplan");
      }
    } catch (error) {
      console.error("Error saving selections:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if meal plan is already complete
        const status = await OnboardingService.checkOnboardingStatus(user.id);
        
        if (status.hasMealPlan) {
          // Meal plan already selected - mark onboarding complete and go to home
          await OnboardingService.markOnboardingComplete(user.id);
          router.replace("/page/home");
        } else {
          // Navigate to meal plan selection (allow skipping)
          router.replace("/features/selectmealplan");
        }
      } else {
        router.replace("/features/selectmealplan");
      }
    } catch (error) {
      console.error('Error in skip:', error);
      router.replace("/features/selectmealplan");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Select Workouts</Text>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressInfo.percentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Step {progressInfo.currentStep} of {progressInfo.totalSteps}
            </Text>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Choose Your Starting Workouts</Text>
            <Text style={styles.subtitle}>
              Select 2-3 workout templates to get started
            </Text>
            <Text style={styles.selectionCount}>
              {selectedWorkouts.length}/3 selected
            </Text>
          </View>

          {/* Category Filter Tabs */}
          <View style={styles.categoryTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsContent}
            >
              <Pressable
                style={[
                  styles.categoryTab,
                  selectedCategory === "all" && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory("all")}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === "all" &&
                      styles.categoryTabTextActive,
                  ]}
                >
                  All
                </Text>
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === cat.id && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryTabEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === cat.id &&
                        styles.categoryTabTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Workouts Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A9EFF" />
                <Text style={styles.loadingText}>Loading workouts...</Text>
              </View>
            ) : (
              <View style={styles.categoriesGrid}>
                {filteredWorkouts.map((workout) => {
                  const isSelected = selectedWorkouts.includes(workout.id);
                  return (
                    <Pressable
                      key={workout.id}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected,
                      ]}
                      onPress={() => toggleWorkout(workout.id)}
                    >
                      <Image
                        source={workout.localImage}
                        style={styles.categoryImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.7)"]}
                        style={styles.gradientOverlay}
                      />

                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#00D4AA"
                          />
                        </View>
                      )}

                      <View style={styles.categoryContent}>
                        <View style={styles.workoutHeader}>
                          <Text style={styles.categoryEmoji}>
                            {workout.category?.emoji || "💪"}
                          </Text>
                          <View
                            style={[
                              styles.difficultyBadge,
                              {
                                backgroundColor:
                                  workout.category?.color || "#4A9EFF",
                              },
                            ]}
                          >
                            <Text style={styles.difficultyText}>
                              {workout.difficulty}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.categoryName}>{workout.name}</Text>
                        <View style={styles.workoutMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color="rgba(255,255,255,0.9)"
                            />
                            <Text style={styles.metaText}>
                              {workout.duration_minutes} min
                            </Text>
                          </View>
                          {workout.estimated_calories && (
                            <View style={styles.metaItem}>
                              <Ionicons
                                name="flame-outline"
                                size={14}
                                color="rgba(255,255,255,0.9)"
                              />
                              <Text style={styles.metaText}>
                                {workout.estimated_calories} cal
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.bottomSection}>
            <Pressable
              style={[
                styles.continueButton,
                (selectedWorkouts.length === 0 || isSaving) &&
                  styles.continueButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={selectedWorkouts.length === 0 || isSaving}
            >
              <View style={styles.continueButtonContent}>
                {isSaving ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.continueButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
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
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 10 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    color: "#4A9EFF",
    fontWeight: "600",
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#4A9EFF",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.6)",
  },
  titleSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 26,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 12,
    fontWeight: "500",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
  },
  selectionCount: {
    fontSize: 14,
    color: "#4A9EFF",
    borderRadius: 20,
    fontWeight: "700",
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "rgba(74, 158, 255, 0.15)",
  },
  categoryTabsContainer: {
    marginBottom: 16,
  },
  categoryTabsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: "#4A9EFF",
    borderColor: "#4A9EFF",
  },
  categoryTabEmoji: {
    fontSize: 16,
  },
  categoryTabText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  categoryTabTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  categoriesGrid: {
    gap: 12,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  categoryCard: {
    height: 200,
    borderWidth: 2,
    borderRadius: 16,
    overflow: "hidden",
    width: (width - 52) / 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  categoryCardSelected: {
    borderWidth: 2,
    borderColor: "#00D4AA",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  selectedBadge: {
    top: 12,
    right: 12,
    padding: 2,
    borderRadius: 20,
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  categoryContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  categoryEmoji: {
    fontSize: 28,
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  categoryName: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "700",
    textShadowRadius: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
  },
  workoutMeta: {
    gap: 12,
    flexDirection: "row",
  },
  metaItem: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    textShadowRadius: 4,
    color: "rgba(255, 255, 255, 0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
  },
  workoutCount: {
    fontSize: 12,
    fontWeight: "600",
    textShadowRadius: 4,
    color: "rgba(255, 255, 255, 0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
  },
  bottomSection: {
    paddingVertical: 20,
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#356FB0",
  },
  continueButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#2A2A2A",
  },
  continueButtonContent: {
    gap: 8,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
});
