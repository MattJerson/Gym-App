import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const MealSection = ({ mealType, mealItems, onAddFood }) => {
  const getMealIcon = (type) => {
    switch (type) {
      case "Breakfast": return "breakfast";
      case "Lunch": return "restaurant";
      case "Snack": return "local-cafe";
      case "Dinner": return "dinner-dining";
      default: return "restaurant";
    }
  };

  const getMealColor = (type) => {
    switch (type) {
      case "Breakfast": return "#FF9500";
      case "Lunch": return "#34C759";
      case "Snack": return "#AF52DE";
      case "Dinner": return "#007AFF";
      default: return "#4CAF50";
    }
  };

  const totalCalories = mealItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = mealItems.reduce((sum, item) => sum + item.protein, 0);

  return (
    <View style={styles.mealSection}>
      <View style={styles.mealSectionHeader}>
        <View style={styles.mealTitleRow}>
          <View style={[styles.mealIconContainer, { backgroundColor: getMealColor(mealType) }]}>
            <MaterialIcons name={getMealIcon(mealType)} size={20} color="#fff" />
          </View>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealSectionTitle}>{mealType}</Text>
            {mealItems.length > 0 && (
              <Text style={styles.mealSummary}>
                {totalCalories} calories, {totalProtein}g protein
              </Text>
            )}
          </View>
        </View>
        <Pressable style={styles.addButton} onPress={() => onAddFood(mealType)}>
          <Ionicons name="add" size={22} color="#007AFF" />
        </Pressable>
      </View>

      {mealItems.length === 0 ? (
        <Pressable style={styles.emptyMealContainer} onPress={() => onAddFood(mealType)}>
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.emptyMealText}>Add Food</Text>
        </Pressable>
      ) : (
        <View style={styles.mealItems}>
          {mealItems.map((item, index) => (
            <Pressable key={index} style={[styles.mealItem, index === mealItems.length - 1 && styles.lastMealItem]}>
              <View style={styles.mealItemLeft}>
                <Text style={styles.foodIcon}>{item.icon}</Text>
                <View style={styles.mealItemDetails}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodTime}>{item.time}</Text>
                </View>
              </View>
              <View style={styles.mealItemRight}>
                <Text style={styles.foodCalories}>{item.calories}</Text>
                <Text style={styles.caloriesLabel}>cal</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default function TodaysMeals({ meals, onAddFood, onEditMeal }) {
  // Group meals by type
  const mealsByType = {
    Breakfast: meals.filter(meal => meal.meal === "Breakfast"),
    Lunch: meals.filter(meal => meal.meal === "Lunch"),
    Snack: meals.filter(meal => meal.meal === "Snack" || meal.meal === "Pre-Workout"),
    Dinner: meals.filter(meal => meal.meal === "Dinner"),
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Today's Meals</Text>
        <Pressable onPress={onEditMeal}>
          <MaterialIcons name="edit" size={20} color="#4CAF50" />
        </Pressable>
      </View>

      {Object.entries(mealsByType).map(([mealType, mealItems]) => (
        <MealSection
          key={mealType}
          mealType={mealType}
          mealItems={mealItems}
          onAddFood={onAddFood}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
  },
  mealSection: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginHorizontal: 0,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  mealTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  mealIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealSectionTitle: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 2,
  },
  mealSummary: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyMealContainer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  emptyMealText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 8,
  },
  mealItems: {
    backgroundColor: "transparent",
  },
  mealItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  lastMealItem: {
    borderBottomWidth: 0,
  },
  mealItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  foodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  mealItemDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 4,
  },
  foodTime: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
  },
  mealItemRight: {
    alignItems: "flex-end",
    flexDirection: "row",
    alignItems: "baseline",
  },
  foodCalories: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "600",
  },
  caloriesLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    marginLeft: 2,
  },
});
