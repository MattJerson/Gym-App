import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// MOCK DATA: In your app, you'll pass this data in as a prop.
const MOCK_MEALS = [
  {
    id: "1",
    name: "Grilled Salmon Bowl",
    details: "Yesterday • Dinner",
    highlight: "485 cal",
  },
  {
    id: "2",
    name: "Protein Smoothie Bowl",
    details: "2 days ago • Breakfast",
    highlight: "320 cal",
  },
  {
    id: "3",
    name: "Quinoa Power Salad",
    details: "3 days ago • Lunch",
    highlight: "380 cal",
  },
  {
    id: "4",
    name: "Greek Yogurt Parfait",
    details: "4 days ago • Snack",
    highlight: "245 cal",
  },
];

export default function RecentMeals({ meals = MOCK_MEALS }) {
  const router = useRouter();

  // Transform new data structure to match component expectations
  const transformMeal = (meal) => {
    if (meal.title) {
      // New data structure from MealPlanDataService
      const daysAgo = Math.floor((new Date() - new Date(meal.completedAt)) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
      
      return {
        id: meal.id,
        name: meal.title,
        details: `${timeAgo} • ${meal.subtitle}`,
        highlight: `${meal.calories} cal`,
      };
    }
    // Fallback to existing structure
    return meal;
  };

  const displayMeals = meals.map(transformMeal);

  const handleViewAll = () => {
    router.push("/activity?filter=nutrition");
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Meals</Text>
        <MaterialCommunityIcons name="history" size={18} color="#fff" />
      </View>

      {/* Dynamic list of recent meals */}
      {displayMeals.slice(0, 4).map((item) => (
        <Pressable key={item.id} style={styles.item}>
          <View style={styles.mealInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>{item.details}</Text>
          </View>

          <Text style={styles.highlight}>
            {item.highlight}
          </Text>
        </Pressable>
      ))}

      {/* Subtle footer with navigation */}
      <Pressable onPress={handleViewAll}>
        <Text style={styles.footer}>View full history →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    marginBottom: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)"
  },
  headerRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  mealInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: "#aaa",
  },
  highlight: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  footer: {
    fontSize: 13,
    marginTop: 12,
    textAlign: "right",
    color: "#74b9ff",
    fontWeight: "500",
  },
});