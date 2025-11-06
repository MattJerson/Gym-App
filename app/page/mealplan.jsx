import {
  View,
  Text,
  Alert,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// Import components
import { supabase } from "../../services/supabase";
import MealPlans from "../../components/mealplan/MealPlans";
import TodaysMeals from "../../components/mealplan/TodaysMeals";
import RecentMeals from "../../components/mealplan/RecentMeals";
import PlanActionSheet from "../../components/mealplan/PlanActionSheet";
import { MealPlanDataService } from "../../services/MealPlanDataService";
import MacroProgressSummary from "../../components/mealplan/MacroProgressSummary";
import { MealPlanPageSkeleton } from "../../components/skeletons/MealPlanPageSkeleton";

const router = useRouter();

export default function Mealplan() {
  // 🔄 Data-driven state management
  const [macroGoals, setMacroGoals] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [recentMeals, setRecentMeals] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [dailyProgress, setDailyProgress] = useState(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Get actual user ID from Supabase
  const [userId, setUserId] = useState(null);

  // Get user session on mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMealPlanData();
    }
  }, [userId]);

  // Reload data when screen comes into focus (e.g., after adding food)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadMealPlanData();
      }
    }, [userId, selectedDate])
  );

  const loadMealPlanData = async () => {
    try {
      setIsLoading(true);

      // Load all meal plan data in parallel
      const [
        macroData,
        weeklyData,
        mealLogsData,
        recentData,
        actionsData,
        activePlanData,
        dailyTrackingData,
      ] = await Promise.all([
        MealPlanDataService.fetchMacroProgress(userId, selectedDate),
        MealPlanDataService.fetchWeeklyPlan(userId, selectedDate),
        MealPlanDataService.getMealLogsForDate(userId, selectedDate),
        MealPlanDataService.fetchRecentMeals(userId),
        MealPlanDataService.fetchQuickActions(userId),
        MealPlanDataService.getUserActivePlan(userId),
        MealPlanDataService.getDailyTracking(userId, selectedDate),
      ]);

      // Transform meal logs to TodaysMeals format
      const transformedMeals = transformMealLogs(mealLogsData);

      // Update state with fetched data
      setMacroGoals(macroData);
      setWeeklyPlan(weeklyData);
      setTodaysMeals(transformedMeals);
      setRecentMeals(recentData);
      setQuickActions(actionsData);
      setCurrentPlan(activePlanData);
      setDailyProgress(dailyTrackingData);
    } catch (error) {
      console.error("Error loading meal plan data:", error);
      Alert.alert("Error", "Failed to load meal plan data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Transform database meal logs to TodaysMeals component format
   */
  const transformMealLogs = (mealLogs) => {
    return mealLogs.map((log) => ({
      id: log.id,
      meal: capitalizeFirst(log.meal_type), // "breakfast" -> "Breakfast"
      name: log.food.name,
      calories: Math.round(log.calories),
      protein: Math.round(log.protein * 10) / 10,
      carbs: Math.round(log.carbs * 10) / 10,
      fats: Math.round(log.fats * 10) / 10,
      time: formatTime(log.meal_time),
      serving: `${log.quantity} × ${log.serving_size}${log.serving_unit}`,
      icon: getCategoryIcon(log.food.category),
      isCompleted: true,
      brand: log.food.brand,
    }));
  };

  /**
   * Helper: Capitalize first letter
   */
  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  /**
   * Helper: Format time from 24h to 12h format
   */
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Helper: Get emoji icon for food category
   */
  const getCategoryIcon = (category) => {
    const icons = {
      protein: "🥩",
      grain: "🍚",
      vegetable: "🥦",
      fruit: "🍎",
      dairy: "🥛",
      nuts: "🥜",
      healthy_fat: "🥑",
      supplement: "💊",
      other: "🍽️",
    };
    return icons[category] || "🍽️";
  };

  const handleAddFood = async (mealType) => {
    try {
      // Navigate to food selection screen
      router.push(`/meal-plan/add-food?mealType=${mealType}`);
    } catch (error) {
      Alert.alert("Error", "Failed to add food. Please try again.");
    }
  };

  const handleDeleteFood = async (logId) => {
    try {
      const success = await MealPlanDataService.deleteMealLog(userId, logId);

      if (success) {
        // Reload meal plan data to refresh the UI
        loadMealPlanData();
      } else {
        Alert.alert("Error", "Failed to delete food. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error deleting food:", error);
      Alert.alert("Error", "Failed to delete food. Please try again.");
    }
  };

  const handleEditFood = (item) => {
    // Navigate to add-food screen with the item data pre-filled
    router.push({
      pathname: "/meal-plan/add-food",
      params: {
        mealType: item.mealType,
        editMode: true,
        logId: item.id,
        foodData: JSON.stringify({
          fdcId: item.fdcId,
          name: item.name,
          brand: item.brand || "",
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fats: item.fats,
        }),
      },
    });
  };

  const handleDaySelect = async (day) => {
    try {
      const newDate = new Date(day.date);
      setSelectedDate(newDate);

      // Load meals for selected date
      const [mealLogsData, macroData] = await Promise.all([
        MealPlanDataService.getMealLogsForDate(userId, newDate),
        MealPlanDataService.fetchMacroProgress(userId, newDate),
      ]);

      const transformedMeals = transformMealLogs(mealLogsData);

      setTodaysMeals(transformedMeals);
      setMacroGoals(macroData);

      // Update weekly plan with new active day
      setWeeklyPlan((prev) =>
        prev.map((d) => ({ ...d, active: d.date === day.date }))
      );
    } catch (error) {
      Alert.alert("Error", "Failed to load day data. Please try again.");
    }
  };

  const handleQuickAction = (action) => {
    // Navigate to appropriate screen based on action.route
    // router.push(action.route);
  };

  const handlePlanOptions = () => {
    setActionSheetVisible(true);
  };

  const handleChangePlan = () => {
    router.push("/meal-plan/browse-plans");
  };

  const handleViewDetails = () => {
    if (!currentPlan) return;

    // Build details message with personalized info if available
    let detailsMessage = `Type: ${formatPlanType(currentPlan.plan_type)}\n\n`;
    
    // Show BMR/TDEE if available (from dynamic calculation)
    if (currentPlan.bmr && currentPlan.tdee) {
      detailsMessage += `🔥 Your Metabolism:\n`;
      detailsMessage += `BMR: ${Math.round(currentPlan.bmr)} kcal\n`;
      detailsMessage += `TDEE: ${Math.round(currentPlan.tdee)} kcal\n`;
      
      if (currentPlan.calorie_adjustment_percent !== undefined) {
        const adjustmentPercent = (currentPlan.calorie_adjustment_percent * 100).toFixed(0);
        const adjustmentType = adjustmentPercent > 0 ? 'surplus' : adjustmentPercent < 0 ? 'deficit' : 'maintenance';
        detailsMessage += `Strategy: ${adjustmentPercent > 0 ? '+' : ''}${adjustmentPercent}% ${adjustmentType}\n\n`;
      }
    }
    
    detailsMessage += `Daily Targets:\n`;
    detailsMessage += `Calories: ${currentPlan.daily_calories} kcal\n`;
    detailsMessage += `Protein: ${currentPlan.daily_protein}g`;
    
    if (currentPlan.protein_percent) {
      detailsMessage += ` (${currentPlan.protein_percent}%)`;
    }
    
    detailsMessage += `\nCarbs: ${currentPlan.daily_carbs}g`;
    
    if (currentPlan.carbs_percent) {
      detailsMessage += ` (${currentPlan.carbs_percent}%)`;
    }
    
    detailsMessage += `\nFats: ${currentPlan.daily_fats}g`;
    
    if (currentPlan.fat_percent) {
      detailsMessage += ` (${currentPlan.fat_percent}%)`;
    }
    
    if (currentPlan.duration_weeks) {
      detailsMessage += `\n\nDuration: ${currentPlan.duration_weeks} weeks`;
    }
    
    if (currentPlan.progress_percentage !== undefined) {
      detailsMessage += `\nProgress: ${currentPlan.progress_percentage.toFixed(1)}%`;
    }
    
    if (currentPlan.adherence_score !== undefined) {
      detailsMessage += `\nAdherence: ${currentPlan.adherence_score.toFixed(1)}%`;
    }

    Alert.alert(
      currentPlan.plan_name,
      detailsMessage,
      [{ text: "OK" }]
    );
  };

  const handleRemovePlan = async () => {
    if (!currentPlan) return;

    Alert.alert(
      "Remove Meal Plan",
      "Are you sure you want to deactivate your current meal plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await MealPlanDataService.removeMealPlan(
                userId,
                currentPlan.user_plan_id
              );
              setCurrentPlan(null);
              Alert.alert("Success", "Meal plan removed successfully");
            } catch (error) {
              console.error("Error removing plan:", error);
              Alert.alert("Error", "Failed to remove meal plan");
            }
          },
        },
      ]
    );
  };

  const formatPlanType = (planType) => {
    return (
      planType
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || ""
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading meal plan data...</Text>
          </View>
        ) : (
          <>
            {/* Macro Progress Summary */}
            {macroGoals && (
              <MacroProgressSummary
                macroGoals={macroGoals}
                selectedDate={selectedDate}
                activePlan={currentPlan}
              />
            )}

            {/* Today's Meals Component */}
            <TodaysMeals
              meals={todaysMeals}
              onAddFood={handleAddFood}
              onDeleteFood={handleDeleteFood}
              onEditFood={handleEditFood}
            />

            {/* My Meal Plan Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Meal Plan</Text>
              {currentPlan && (
                <Pressable
                  style={styles.optionsButton}
                  onPress={handlePlanOptions}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                </Pressable>
              )}
            </View>

            {currentPlan ? (
              <MealPlans
                activePlan={currentPlan}
                dailyProgress={dailyProgress}
                isLoading={isLoading}
              />
            ) : (
              <View style={styles.noPlanCard}>
                <MaterialCommunityIcons
                  name="food-apple"
                  size={48}
                  color="#666"
                />
                <Text style={styles.noPlanTitle}>No Active Meal Plan</Text>
                <Text style={styles.noPlanText}>
                  Choose a meal plan to start tracking your nutrition goals
                </Text>
                <Pressable
                  style={styles.browsePlansButton}
                  onPress={() => router.push("/meal-plan/browse-plans")}
                >
                  <Text style={styles.browsePlansText}>Browse Meal Plans</Text>
                  <Ionicons name="arrow-forward" size={18} color="#00D4AA" />
                </Pressable>
              </View>
            )}

            {/* Recent Meals */}
            <RecentMeals meals={recentMeals} />
          </>
        )}
      </ScrollView>

      {/* Action Sheet Modal */}
      <PlanActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        onChangePlan={handleChangePlan}
        onViewDetails={handleViewDetails}
        onRemovePlan={handleRemovePlan}
        planName={currentPlan?.plan_name || "Current Plan"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
    color: "#fff",
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backRow: {
    top: 60,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  cardTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  cardHeader: {
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 14,
    color: "#999",
  },
  actionGrid: {
    gap: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  disabledActionText: {
    color: "#666",
  },
  sectionHeader: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  currentPlanCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  planColorAccent: {
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    position: "absolute",
  },
  planCardHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  planBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0, 212, 170, 0.15)",
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planCardTitle: {
    fontSize: 11,
    color: "#888",
    marginBottom: 2,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  planName: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  planMetrics: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planMetric: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  planMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBarContainer: {
    gap: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
    textAlign: "center",
  },
  noPlanCard: {
    padding: 40,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  noPlanTitle: {
    fontSize: 20,
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "700",
  },
  noPlanText: {
    fontSize: 14,
    color: "#888",
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  browsePlansButton: {
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderColor: "rgba(0, 212, 170, 0.3)",
    backgroundColor: "rgba(0, 212, 170, 0.15)",
  },
  browsePlansText: {
    fontSize: 15,
    color: "#00D4AA",
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
