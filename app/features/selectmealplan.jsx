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
import DropDownPicker from "react-native-dropdown-picker";
import { OnboardingService } from "../../services/OnboardingService";

export default function SelectMealPlan() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [mealPlans, setMealPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [userPreferences, setUserPreferences] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [progressInfo, setProgressInfo] = useState({ currentStep: 2, totalSteps: 2, percentage: 100 });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    loadMealPlans();
    checkOnboardingProgress();
  }, []);

  const checkOnboardingProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const status = await OnboardingService.checkOnboardingStatus(user.id);
        setOnboardingStatus(status);
        
        const progress = OnboardingService.calculateProgress('mealplan', status);
        setProgressInfo(progress);
      }
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    }
  };

  const loadMealPlans = async () => {
    try {
      // Load user preferences first
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userPrefs = null;
      if (user) {
        const { data: profile } = await supabase
          .from("registration_profiles")
          .select("meal_type, restrictions, favorite_foods, fitness_goal")
          .eq("user_id", user.id)
          .maybeSingle();

        userPrefs = profile;
        setUserPreferences(profile);
      }

      const { data, error } = await supabase
        .from("meal_plan_templates")
        .select("*")
        .eq("is_active", true)
        .order("plan_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // 🔥 Filter out admin-assigned private plans (only show public templates)
      const publicPlans = (data || []).filter(plan => {
        // Exclude plans that are admin-assigned to specific users only
        return !plan.is_admin_assigned && !plan.assigned_user_id;
      });
      // 🔥 Calculate personalized values for each plan using the dynamic function
      const plansWithPersonalization = await Promise.all(
        publicPlans.map(async (plan) => {
          let personalizedPlan = { ...plan };
          
          // If user is logged in and plan is dynamic, get personalized values
          if (user && plan.is_dynamic) {
            try {
              const { data: calcData, error: calcError } = await supabase
                .rpc('calculate_user_meal_plan', {
                  p_user_id: user.id,
                  p_plan_id: plan.id
                });

              if (!calcError && calcData && calcData.length > 0) {
                const personalized = calcData[0];
                // Override static values with personalized calculations
                personalizedPlan.daily_calories = personalized.daily_calories;
                personalizedPlan.daily_protein = personalized.daily_protein;
                personalizedPlan.daily_carbs = personalized.daily_carbs;
                personalizedPlan.daily_fats = personalized.daily_fats;
                personalizedPlan.bmr = personalized.bmr;
                personalizedPlan.tdee = personalized.tdee;
                personalizedPlan.is_personalized = true;
              }
            } catch (calcError) {
              console.error(`Failed to calculate personalized values for ${plan.name}:`, calcError);
              // Fall back to static values - no error shown to user
            }
          }

          return personalizedPlan;
        })
      );

      // Calculate recommendation scores for each plan
      const plansWithScores = plansWithPersonalization.map((plan) => {
        let score = 0;

        if (userPrefs) {
          // Match meal type (meal plan diet_type vs user meal_type)
          if (
            plan.diet_type &&
            userPrefs.meal_type &&
            plan.diet_type.toLowerCase() === userPrefs.meal_type.toLowerCase()
          ) {
            score += 10;
          }

          // Match restrictions (if plan avoids user's restrictions)
          if (userPrefs.restrictions && Array.isArray(userPrefs.restrictions)) {
            const planRestrictions = plan.dietary_restrictions || [];
            const matchingRestrictions = userPrefs.restrictions.filter((r) =>
              planRestrictions.includes(r)
            );
            score += matchingRestrictions.length * 5;
          }

          // Match favorite foods (if plan includes user's favorite foods)
          if (userPrefs.favorite_foods && Array.isArray(userPrefs.favorite_foods)) {
            const planIngredients = (plan.common_ingredients || []).map((i) =>
              i.toLowerCase()
            );
            const matchingFoods = userPrefs.favorite_foods.filter((food) =>
              planIngredients.some((ing) =>
                ing.includes(food.toLowerCase()) || food.toLowerCase().includes(ing)
              )
            );
            score += matchingFoods.length * 3;
          }

          // Match fitness goal to plan type
          if (userPrefs.fitness_goal) {
            const goalToPlanType = {
              lose: "weight_loss",
              gain: "bulking",
              maintain: "maintenance",
            };
            if (
              goalToPlanType[userPrefs.fitness_goal] ===
              plan.plan_type.toLowerCase()
            ) {
              score += 15;
            }
          }
        }

        return { ...plan, recommendationScore: score };
      });

      setMealPlans(plansWithScores);
      setFilteredPlans(plansWithScores);
    } catch (error) {
      console.error("Error loading meal plans:", error);
      Alert.alert("Error", "Failed to load meal plans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort meal plans
  useEffect(() => {
    let filtered = [...mealPlans];

    // Apply filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (plan) => plan.plan_type.toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    // Apply sort
    switch (sortBy) {
      case "recommended":
        filtered.sort((a, b) => b.recommendationScore - a.recommendationScore);
        break;
      case "calories_low":
        filtered.sort((a, b) => a.daily_calories - b.daily_calories);
        break;
      case "calories_high":
        filtered.sort((a, b) => b.daily_calories - a.daily_calories);
        break;
      case "protein_high":
        filtered.sort((a, b) => b.daily_protein - a.daily_protein);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredPlans(filtered);
  }, [selectedFilter, sortBy, mealPlans]);

  const getPlanTypeColor = (planType) => {
    const colors = {
      weight_loss: "#FF6B6B",
      bulking: "#00D4AA",
      cutting: "#FFA500",
      maintenance: "#4A9EFF",
    };
    return colors[planType] || "#888";
  };

  const getPlanIcon = (planType) => {
    const icons = {
      weight_loss: "trending-down",
      bulking: "trending-up",
      cutting: "flash",
      maintenance: "pause",
    };
    return icons[planType] || "restaurant";
  };

  const formatPlanType = (planType) => {
    return planType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleComplete = async () => {
    if (!selectedPlan) return;

    setIsCompleting(true);
    try {
      // Get user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "You must be signed in to complete onboarding.");
        setIsCompleting(false);
        return;
      }
      
      // Check if bodyfat data already exists in database
      const { data: existingBodyfat } = await supabase
        .from("bodyfat_profiles")
        .select("current_body_fat, goal_body_fat")
        .eq("user_id", user.id)
        .maybeSingle();

      // Get locally saved data
      const regRaw = await AsyncStorage.getItem("onboarding:registration");
      const bodyRaw = await AsyncStorage.getItem("onboarding:bodyfat");
      const workoutsRaw = await AsyncStorage.getItem(
        "onboarding:selectedWorkouts"
      );

      const registration = regRaw ? JSON.parse(regRaw) : {};
      const bodyfatFromStorage = bodyRaw ? JSON.parse(bodyRaw) : null;
      const selectedWorkouts = workoutsRaw ? JSON.parse(workoutsRaw) : [];
      // Use bodyfat from database if it exists, otherwise from AsyncStorage
      const bodyfat = existingBodyfat 
        ? {
            currentBodyFat: existingBodyfat.current_body_fat,
            goalBodyFat: existingBodyfat.goal_body_fat,
          }
        : bodyfatFromStorage;

      if (!bodyfat) {
        Alert.alert(
          "Error",
          "Missing body fat data. Please restart onboarding."
        );
        setIsCompleting(false);
        return;
      }

      // Only save registration profile if we have data (don't overwrite with empty object!)
      if (Object.keys(registration).length > 0 && registration.gender) {
        // Save registration profile
        const registrationPayload = {
          user_id: user.id,
          gender: registration.gender || null,
          age: registration.age ? parseInt(registration.age, 10) : null,
          height_cm: registration.height
            ? parseInt(registration.height, 10)
            : null,
          weight_kg: registration.weight
            ? parseFloat(registration.weight)
            : null,
          use_metric:
            registration.useMetric === undefined
              ? true
              : !!registration.useMetric,
          activity_level: registration.activityLevel || null,
          fitness_goal: registration.fitnessGoal || null,
          favorite_foods: registration.favoriteFoods || null,
          fitness_level: registration.fitnessLevel || null,
          training_location: registration.trainingLocation || null,
          training_duration: registration.trainingDuration
            ? registration.trainingDuration === "90+"
              ? 90
              : parseInt(registration.trainingDuration, 10)
            : null,
          muscle_focus: registration.muscleFocus || null,
          injuries: registration.injuries || null,
          training_frequency: registration.trainingFrequency || null,
          meal_type: registration.mealType || null,
          restrictions: registration.restrictions || null,
          meals_per_day: registration.mealsPerDay
            ? parseInt(registration.mealsPerDay, 10)
            : null,
          calorie_goal: registration.calorieGoal
            ? parseInt(registration.calorieGoal, 10)
            : null,
          details: {},
        };

        const { error: regError } = await supabase
          .from("registration_profiles")
          .upsert(registrationPayload, { onConflict: "user_id" });

        if (regError) {
          console.error("Failed to save registration:", regError);
          Alert.alert("Error", "Failed to save registration data");
          setIsCompleting(false);
          return;
        }
      } else {
      }

      // Save body fat profile
      const { error: bodyError } = await supabase
        .from("bodyfat_profiles")
        .upsert(
          {
            user_id: user.id,
            current_body_fat: bodyfat.currentBodyFat,
            goal_body_fat: bodyfat.goalBodyFat,
          },
          { onConflict: "user_id" }
        );

      if (bodyError) {
        console.error("Failed to save body fat:", bodyError);
      }

      // Assign selected meal plan to user
      const { error: mealError } = await supabase
        .from("user_meal_plans")
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          is_active: true,
        });

      if (mealError) {
        console.error("Failed to assign meal plan:", mealError);
      } // Assign selected workout templates to user (if any)
      if (selectedWorkouts.length > 0) {
        // Fetch the actual workout names from the templates
        const { data: workoutTemplates } = await supabase
          .from("workout_templates")
          .select("id, name, workout_categories(name)")
          .in("id", selectedWorkouts);

        const workoutAssignments = selectedWorkouts.map((templateId) => {
          const template = workoutTemplates?.find(t => t.id === templateId);
          return {
            user_id: user.id,
            template_id: templateId,
            workout_name: template?.name || "Workout",
            workout_type: template?.workout_categories?.name || "Pre-Made",
            is_favorite: true,
          };
        });

        // Use upsert to handle existing entries gracefully
        const { error: workoutError } = await supabase
          .from("user_saved_workouts")
          .upsert(workoutAssignments, {
            onConflict: "user_id,template_id",
            ignoreDuplicates: false, // Update existing records
          });

        if (workoutError) {
          console.error("Failed to save workout preferences:", workoutError);
        }
      }

      // Clean up local storage
      await AsyncStorage.removeItem("onboarding:registration");
      await AsyncStorage.removeItem("onboarding:bodyfat");
      await AsyncStorage.removeItem("onboarding:selectedWorkouts");

      // Mark onboarding as complete in database
      await OnboardingService.markOnboardingComplete(user.id);

      // Navigate to home
      router.replace("/page/home");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    // Complete without meal plan selection - allow graceful skip
    setIsCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be signed in.");
        setIsCompleting(false);
        return;
      }

      // Mark onboarding as complete and go to home (allow skipping meal plan)
      await OnboardingService.markOnboardingComplete(user.id);
      router.replace("/page/home");
    } catch (error) {
      console.error("Error in skip:", error);
      // Even if there's an error, let them go to home
      router.replace("/page/home");
    } finally {
      setIsCompleting(false);
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
            <Text style={styles.headerTitle}>Select Meal Plan</Text>
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
            <Text style={styles.mainTitle}>Choose Your Meal Plan</Text>
            <Text style={styles.subtitle}>
              Select a meal plan that matches your fitness goals
            </Text>
          </View>

          {/* Filter & Sort Section */}
          <View style={styles.filterSortContainer}>
            {/* Plan Type Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsContent}
              style={styles.filterTabsScroll}
            >
              <Pressable
                style={[
                  styles.filterTab,
                  selectedFilter === "all" && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter("all")}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === "all" && styles.filterTabTextActive,
                  ]}
                >
                  All Plans
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.filterTab,
                  selectedFilter === "weight_loss" && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter("weight_loss")}
              >
                <Ionicons name="trending-down" size={14} color={selectedFilter === "weight_loss" ? "#fff" : "#FF6B6B"} />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === "weight_loss" && styles.filterTabTextActive,
                  ]}
                >
                  Weight Loss
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.filterTab,
                  selectedFilter === "bulking" && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter("bulking")}
              >
                <Ionicons name="trending-up" size={14} color={selectedFilter === "bulking" ? "#fff" : "#00D4AA"} />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === "bulking" && styles.filterTabTextActive,
                  ]}
                >
                  Bulking
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.filterTab,
                  selectedFilter === "cutting" && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter("cutting")}
              >
                <Ionicons name="flash" size={14} color={selectedFilter === "cutting" ? "#fff" : "#FFA500"} />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === "cutting" && styles.filterTabTextActive,
                  ]}
                >
                  Cutting
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.filterTab,
                  selectedFilter === "maintenance" && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter("maintenance")}
              >
                <Ionicons name="pause" size={14} color={selectedFilter === "maintenance" ? "#fff" : "#4A9EFF"} />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === "maintenance" && styles.filterTabTextActive,
                  ]}
                >
                  Maintenance
                </Text>
              </Pressable>
            </ScrollView>

            {/* Sort Dropdown */}
            <View style={styles.sortContainer}>
              <Ionicons name="swap-vertical" size={16} color="#999" style={{ marginRight: 8 }} />
              <Text style={styles.sortLabel}>Sort:</Text>
              <View style={styles.sortDropdownWrapper}>
                <DropDownPicker
                  open={sortDropdownOpen}
                  value={sortBy}
                  items={[
                    { label: "Recommended", value: "recommended" },
                    { label: "Calories (Low to High)", value: "calories_low" },
                    { label: "Calories (High to Low)", value: "calories_high" },
                    { label: "Protein (High to Low)", value: "protein_high" },
                    { label: "Name (A-Z)", value: "name" },
                  ]}
                  setOpen={setSortDropdownOpen}
                  setValue={setSortBy}
                  placeholder="Select Sort"
                  style={styles.sortDropdownPicker}
                  dropDownContainerStyle={styles.sortDropdownContainer}
                  textStyle={styles.sortDropdownText}
                  placeholderStyle={styles.sortDropdownPlaceholder}
                  showArrowIcon={true}
                  arrowIconStyle={{ tintColor: "#999" }}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                  zIndex={5000}
                />
              </View>
            </View>
          </View>

          {/* Meal Plans List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A9EFF" />
                <Text style={styles.loadingText}>Loading meal plans...</Text>
              </View>
            ) : mealPlans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={64} color="#666" />
                <Text style={styles.emptyTitle}>No Meal Plans Available</Text>
                <Text style={styles.emptyText}>
                  There are no meal plans in the database yet.{"\n"}
                  Please add meal plans in Supabase or skip this step.
                </Text>
                <Pressable style={styles.emptySkipButton} onPress={handleSkip}>
                  <Text style={styles.emptySkipButtonText}>Skip This Step</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.plansContainer}>
                {filteredPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const accentColor = getPlanTypeColor(plan.plan_type);
                  const isRecommended = plan.recommendationScore > 0;

                  return (
                    <Pressable
                      key={plan.id}
                      style={[
                        styles.planCard,
                        isSelected && styles.planCardSelected,
                      ]}
                      onPress={() => handleSelectPlan(plan)}
                    >
                      <LinearGradient
                        colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.1)"]}
                        style={styles.cardGradient}
                      />

                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={28}
                            color="#00D4AA"
                          />
                        </View>
                      )}

                      <View
                        style={[
                          styles.accentBar,
                          { backgroundColor: accentColor },
                        ]}
                      />

                      <View style={styles.planHeader}>
                        <View
                          style={[
                            styles.iconBadge,
                            { backgroundColor: `${accentColor}20` },
                          ]}
                        >
                          <Ionicons
                            name={getPlanIcon(plan.plan_type)}
                            size={24}
                            color={accentColor}
                          />
                        </View>
                        <View style={styles.headerContent}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            {plan.is_personalized && (
                              <View style={styles.personalizedBadge}>
                                <Ionicons name="person" size={10} color="#00D4AA" />
                              </View>
                            )}
                          </View>
                          <View
                            style={[
                              styles.typeBadge,
                              { backgroundColor: `${accentColor}30` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeBadgeText,
                                { color: accentColor },
                              ]}
                            >
                              {formatPlanType(plan.plan_type)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.planDescription}>
                        {plan.description}
                      </Text>

                      {plan.is_personalized && plan.bmr && (
                        <View style={styles.personalizationInfo}>
                          <Ionicons name="calculator" size={14} color="#00D4AA" />
                          <Text style={styles.personalizationText}>
                            Personalized: BMR {Math.round(plan.bmr)} • TDEE {Math.round(plan.tdee)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.macroContainer}>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {plan.daily_calories}
                          </Text>
                          <Text style={styles.macroLabel}>Calories</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {plan.daily_protein}g
                          </Text>
                          <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {plan.daily_carbs}g
                          </Text>
                          <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {plan.daily_fats}g
                          </Text>
                          <Text style={styles.macroLabel}>Fats</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Complete Button */}
          <View style={styles.bottomSection}>
            <Pressable
              style={[
                styles.completeButton,
                (!selectedPlan || isCompleting) &&
                  styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={!selectedPlan || isCompleting}
            >
              <View style={styles.completeButtonContent}>
                {isCompleting ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.completeButtonText}>Completing...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.completeButtonText}>
                      Complete Setup
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
    backgroundColor: "#00D4AA",
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
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
    color: "rgba(255, 255, 255, 0.7)",
  },
  filterSortContainer: {
    marginBottom: 16,
  },
  filterTabsScroll: {
    marginBottom: 12,
  },
  filterTabsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: "#00D4AA",
    borderColor: "#00D4AA",
  },
  filterTabText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
    gap: 8,
    zIndex: 5000,
  },
  sortLabel: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },
  sortDropdownWrapper: {
    width: 200,
    zIndex: 5000,
  },
  sortDropdownPicker: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    minHeight: 36,
  },
  sortDropdownContainer: {
    backgroundColor: "#333333",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  sortDropdownText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  sortDropdownPlaceholder: {
    color: "#999",
    fontSize: 13,
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
  emptyContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    color: "#fff",
    marginTop: 20,
    marginBottom: 12,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 30,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.6)",
  },
  emptySkipButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderColor: "rgba(74, 158, 255, 0.4)",
    backgroundColor: "rgba(74, 158, 255, 0.2)",
  },
  emptySkipButtonText: {
    fontSize: 16,
    color: "#4A9EFF",
    fontWeight: "600",
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#161616",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  planCardSelected: {
    borderColor: "#00D4AA",
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  selectedBadge: {
    top: 16,
    right: 16,
    zIndex: 10,
    position: "absolute",
  },
  accentBar: {
    top: 0,
    left: 0,
    width: 4,
    bottom: 0,
    position: "absolute",
  },
  planHeader: {
    gap: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    gap: 6,
    flex: 1,
  },
  planName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  typeBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#A1A1AA",
    marginBottom: 16,
  },
  macroContainer: {
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
  },
  macroValue: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "800",
  },
  macroLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  macroDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomSection: {
    paddingVertical: 20,
  },
  completeButton: {
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#00D4AA",
  },
  completeButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#2A2A2A",
  },
  completeButtonContent: {
    gap: 8,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  personalizedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 212, 170, 0.2)",
  },
  personalizationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 212, 170, 0.1)",
  },
  personalizationText: {
    fontSize: 12,
    color: "#00D4AA",
    fontWeight: "600",
  },
});
