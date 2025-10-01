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
// Import components
import MacroProgressSummary from "../../components/mealplan/MacroProgressSummary";
import TodaysMeals from "../../components/mealplan/TodaysMeals";
import RecentMeals from "../../components/mealplan/RecentMeals";
import NotificationBar from "../../components/NotificationBar";
import { MealPlanDataService } from "../../services/MealPlanDataService";

const router = useRouter();

export default function Mealplan() {
  // 🔄 Data-driven state management
  const [notifications, setNotifications] = useState(0);
  const [macroGoals, setMacroGoals] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [recentMeals, setRecentMeals] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Load data on component mount - Replace with actual user ID
  const userId = "user123";

  useEffect(() => {
    loadMealPlanData();
  }, []);

  const loadMealPlanData = async () => {
    try {
      setIsLoading(true);
      
      // Load all meal plan data in parallel
      const [
        notificationsData,
        macroData,
        weeklyData,
        mealsData,
        recentData,
        actionsData
      ] = await Promise.all([
        MealPlanDataService.fetchUserNotifications(userId),
        MealPlanDataService.fetchMacroProgress(userId, selectedDate),
        MealPlanDataService.fetchWeeklyPlan(userId, selectedDate),
        MealPlanDataService.fetchTodaysMeals(userId, selectedDate),
        MealPlanDataService.fetchRecentMeals(userId),
        MealPlanDataService.fetchQuickActions(userId)
      ]);

      // Update state with fetched data
      setNotifications(notificationsData.count);
      setMacroGoals(macroData);
      setWeeklyPlan(weeklyData);
      setTodaysMeals(mealsData);
      setRecentMeals(recentData);
      setQuickActions(actionsData);
      
    } catch (error) {
      console.error("Error loading meal plan data:", error);
      Alert.alert("Error", "Failed to load meal plan data. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

  const handleEditMeal = async () => {
    try {
      console.log("Edit meals");
      // Navigate to meal editing screen
      // router.push('/meal-plan/edit');
    } catch (error) {
      Alert.alert("Error", "Failed to edit meal. Please try again.");
    }
  };

  const handleDaySelect = async (day) => {
    try {
      const newDate = new Date(day.date);
      setSelectedDate(newDate);
      
      // Load meals for selected date
      const [mealsData, macroData] = await Promise.all([
        MealPlanDataService.fetchTodaysMeals(userId, newDate),
        MealPlanDataService.fetchMacroProgress(userId, newDate)
      ]);
      
      setTodaysMeals(mealsData);
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
            {/* Macro Progress Summary with Date Header and Weekly Calendar */}
            {macroGoals && (
              <View style={styles.macroSection}>
                <MacroProgressSummary 
                  macroGoals={macroGoals} 
                  selectedDate={selectedDate}
                />
                
                {/* Weekly Calendar Strip */}
                <View style={styles.weeklyStrip}>
                  <View style={styles.weekRow}>
                    {weeklyPlan.map((day, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.dayButton, 
                          day.active && styles.activeDayButton,
                          day.isCompleted && styles.completedDayButton
                        ]}
                        onPress={() => handleDaySelect(day)}
                      >
                        <Text
                          style={[
                            styles.dayText, 
                            day.active && styles.activeDayText,
                            day.isCompleted && styles.completedDayText
                          ]}
                        >
                          {day.day}
                        </Text>
                        {day.mealsPlanned > 0 && (
                          <View style={styles.mealIndicator}>
                            <Text style={styles.mealCount}>{day.mealsPlanned}</Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Today's Meals Component */}
            <TodaysMeals 
              meals={todaysMeals}
              onAddFood={handleAddFood}
              onEditMeal={handleEditMeal}
            />

            {/* Quick Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                {quickActions.map((action, index) => {
                  const IconComponent = action.iconLibrary === 'FontAwesome5' 
                    ? FontAwesome5 
                    : MaterialCommunityIcons;
                  
                  return (
                    <Pressable 
                      key={action.id}
                      style={styles.actionButton}
                      onPress={() => handleQuickAction(action)}
                      disabled={!action.isAvailable}
                    >
                      <IconComponent
                        name={action.icon}
                        size={24}
                        color={action.isAvailable ? action.color : "#666"}
                      />
                      <Text style={[
                        styles.actionText,
                        !action.isAvailable && styles.disabledActionText
                      ]}>
                        {action.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Recent Meals */}
            <RecentMeals meals={recentMeals} />
          </>
        )}
      </ScrollView>
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
  macroSection: {
    marginBottom: 20,
  },
  weeklyStrip: {
    paddingHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activeDayButton: {
    backgroundColor: "#8e44ad",
    borderColor: "#8e44ad",
  },
  completedDayButton: {
    backgroundColor: "#00D4AA",
    borderColor: "#00D4AA",
  },
  dayText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "700",
  },
  activeDayText: {
    color: "#fff",
  },
  completedDayText: {
    color: "#fff",
  },
  mealIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ff9f43",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0B0B0B",
  },
  mealCount: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "800",
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
});
