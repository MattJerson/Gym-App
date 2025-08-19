import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const router = useRouter();

export default function Mealplan() {
  const todaysMeals = [
    {
      meal: "Breakfast",
      name: "Protein Oats Bowl",
      calories: 420,
      protein: 28,
      time: "8:00 AM",
      icon: "🍓",
    },
    {
      meal: "Lunch",
      name: "Grilled Chicken Salad",
      calories: 380,
      protein: 35,
      time: "1:00 PM",
      icon: "🥗",
    },
    {
      meal: "Pre-Workout",
      name: "Banana + Almond Butter",
      calories: 220,
      protein: 8,
      time: "5:30 PM",
      icon: "🍌",
    },
    {
      meal: "Dinner",
      name: "Salmon & Sweet Potato",
      calories: 480,
      protein: 38,
      time: "7:30 PM",
      icon: "🐟",
    },
  ];

  const weeklyPlan = [
    { day: "Mon", active: false },
    { day: "Tue", active: true },
    { day: "Wed", active: false },
    { day: "Thu", active: false },
    { day: "Fri", active: false },
    { day: "Sat", active: false },
    { day: "Sun", active: false },
  ];

  const macroGoals = {
    calories: { current: 1500, target: 2200 },
    protein: { current: 109, target: 140 },
    carbs: { current: 145, target: 200 },
    fats: { current: 68, target: 85 },
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.backRow}>
          <Pressable onPress={() => router.push("/auth/register")}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Meal Plan</Text>
          <Pressable>
            <MaterialIcons name="shopping-cart" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Daily Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Progress</Text>
            <Text style={styles.dateText}>Tuesday, Aug 19</Text>
          </View>

          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>
                {macroGoals.calories.current}/{macroGoals.calories.target}
              </Text>
              <Text style={styles.macroLabel}>Calories</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (macroGoals.calories.current /
                          macroGoals.calories.target) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>
                {macroGoals.protein.current}g/{macroGoals.protein.target}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (macroGoals.protein.current /
                          macroGoals.protein.target) *
                        100
                      }%`,
                      backgroundColor: "#ff6b6b",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Calendar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Plan</Text>
          <View style={styles.weekRow}>
            {weeklyPlan.map((day, index) => (
              <Pressable
                key={index}
                style={[styles.dayButton, day.active && styles.activeDayButton]}
              >
                <Text
                  style={[styles.dayText, day.active && styles.activeDayText]}
                >
                  {day.day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Today's Meals */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Meals</Text>
            <Pressable>
              <MaterialIcons name="edit" size={20} color="#4CAF50" />
            </Pressable>
          </View>

          {todaysMeals.map((meal, index) => (
            <Pressable key={index} style={styles.mealItem}>
              <View style={styles.mealLeft}>
                <Text style={styles.mealIcon}>{meal.icon}</Text>
                <View style={styles.mealDetails}>
                  <Text style={styles.mealType}>{meal.meal}</Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
              </View>
              <View style={styles.mealRight}>
                <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                <Text style={styles.mealProtein}>{meal.protein}g protein</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <Pressable style={styles.actionButton}>
              <MaterialCommunityIcons
                name="food-apple"
                size={24}
                color="#4CAF50"
              />
              <Text style={styles.actionText}>Meal Prep Guide</Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <MaterialCommunityIcons
                name="calculator"
                size={24}
                color="#2196F3"
              />
              <Text style={styles.actionText}>Macro Calculator</Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <FontAwesome5 name="history" size={24} color="#9C27B0" />
              <Text style={styles.actionText}>Meal History</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    marginTop: 60,
    paddingBottom: 10,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  backRow: {
    top: 0,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  cardTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 15,
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
  macroGrid: {
    gap: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
  },
  macroValue: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 5,
    fontWeight: "bold",
  },
  macroLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#333",
    justifyContent: "center",
  },
  activeDayButton: {
    backgroundColor: "#4CAF50",
  },
  dayText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "bold",
  },
  activeDayText: {
    color: "#fff",
  },
  mealItem: {
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    justifyContent: "space-between",
  },
  mealLeft: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  mealIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  mealDetails: {
    flex: 1,
  },
  mealType: {
    fontSize: 12,
    marginBottom: 2,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  mealName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
    fontWeight: "500",
  },
  mealTime: {
    fontSize: 12,
    color: "#999",
  },
  mealRight: {
    alignItems: "flex-end",
  },
  mealCalories: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 2,
    fontWeight: "bold",
  },
  mealProtein: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
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
    backgroundColor: "#333",
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  tipText: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
});
