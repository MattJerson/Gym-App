import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
// Import components
import MacroProgressSummary from "../../components/mealplan/MacroProgressSummary";
import TodaysMeals from "../../components/mealplan/TodaysMeals";
import RecentMeals from "../../components/mealplan/RecentMeals";
import MealPlans from "../../components/mealplan/MealPlans";
import PlanActionSheet from "../../components/mealplan/PlanActionSheet";
import NotificationBar from "../../components/NotificationBar";
import { MealPlanDataService } from "../../services/MealPlanDataService";
import { supabase } from "../../services/supabase";

const router = useRouter();

export default function Mealplan() {
  // 🔄 Data-driven state management
  const [notifications, setNotifications] = useState(0);
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
      const { data: { user } } = await supabase.auth.getUser();
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
        notificationsData,
        macroData,
        weeklyData,
        mealLogsData,
        recentData,
        actionsData,
        activePlanData,
        dailyTrackingData
      ] = await Promise.all([
        MealPlanDataService.fetchUserNotifications(userId),
        MealPlanDataService.fetchMacroProgress(userId, selectedDate),
        MealPlanDataService.fetchWeeklyPlan(userId, selectedDate),
        MealPlanDataService.getMealLogsForDate(userId, selectedDate),
        MealPlanDataService.fetchRecentMeals(userId),
        MealPlanDataService.fetchQuickActions(userId),
        MealPlanDataService.getUserActivePlan(userId),
        MealPlanDataService.getDailyTracking(userId, selectedDate)
      ]);

      // Transform meal logs to TodaysMeals format
      const transformedMeals = transformMealLogs(mealLogsData);

      // Update state with fetched data
      setNotifications(notificationsData.count);
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
    return mealLogs.map(log => ({
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
      brand: log.food.brand
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
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
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
      other: "🍽️"
    };
    return icons[category] || "🍽️";
  };

  const handleAddFood = async (mealType) => {
    try {
      console.log(`Add food to ${mealType}`);
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
        MealPlanDataService.fetchMacroProgress(userId, newDate)
      ]);
      
      const transformedMeals = transformMealLogs(mealLogsData);
      
      setTodaysMeals(transformedMeals);
      setMacroGoals(macroData);
      
      // Update weekly plan with new active day
      setWeeklyPlan(prev => 
        prev.map(d => ({ ...d, active: d.date === day.date }))
      );
    } catch (error) {
      Alert.alert("Error", "Failed to load day data. Please try again.");
    }
  };

  const handleQuickAction = (action) => {
    console.log(`Quick action: ${action.title}`);
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
    
    Alert.alert(
      currentPlan.plan_name,
      `Type: ${formatPlanType(currentPlan.plan_type)}\n\n` +
      `Calories: ${currentPlan.daily_calories} kcal\n` +
      `Protein: ${currentPlan.daily_protein}g\n` +
      `Carbs: ${currentPlan.daily_carbs}g\n` +
      `Fats: ${currentPlan.daily_fats}g\n\n` +
      `Duration: ${currentPlan.duration_weeks} weeks\n` +
      `Progress: ${currentPlan.progress_percentage?.toFixed(1)}%\n` +
      `Adherence: ${currentPlan.adherence_score?.toFixed(1)}%`,
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
              await MealPlanDataService.removeMealPlan(userId, currentPlan.user_plan_id);
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
    return planType
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || '';
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Meal Plan</Text>
          <NotificationBar notifications={notifications} />
        </View>

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
                <MaterialCommunityIcons name="food-apple" size={48} color="#666" />
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
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  currentPlanCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    marginBottom: 20,
  },
  planColorAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  planMetrics: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  planMetric: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
  },
  noPlanTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  noPlanText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  browsePlansButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 212, 170, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.3)",
  },
  browsePlansText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#00D4AA",
    letterSpacing: -0.3,
  },
});
