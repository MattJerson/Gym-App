import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SwipeableFoodItem from "./SwipeableFoodItem";

// Helper function to convert food names to Title Case
const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const MealSection = ({ mealType, mealItems, onAddFood, onDeleteFood, onEditFood, isLast }) => {
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
  const totalCarbs = mealItems.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFats = mealItems.reduce((sum, item) => sum + (item.fats || 0), 0);
  const mealColor = getMealColor(mealType);

  const handleEdit = (item) => {
    if (onEditFood) {
      onEditFood(item);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Remove Food",
      `Remove ${item.name} from ${mealType}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => onDeleteFood(item.id)
        }
      ]
    );
  };

  return (
    <View style={[styles.mealSection, !isLast && styles.mealSectionWithBorder]}>
      {/* Compact Meal Header with Inline Totals */}
      <View style={styles.mealSectionHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.mealSectionTitle, { color: mealColor }]}>{mealType}</Text>
          {mealItems.length > 0 && (
            <>
              <Text style={styles.compactTotal}>{totalCalories} Cal</Text>
              <View style={styles.compactTotals}>
                <Text style={styles.compactMacro}>Protein: {totalProtein.toFixed(0)}g</Text>
                <View style={styles.compactDot} />
                <Text style={styles.compactMacro}>Carbs: {totalCarbs.toFixed(0)}g</Text>
                <View style={styles.compactDot} />
                <Text style={styles.compactMacro}>Fats: {totalFats.toFixed(0)}g</Text>
              </View>
            </>
          )}
        </View>
        <Pressable 
          style={[styles.addButton, { backgroundColor: `${mealColor}15` }]} 
          onPress={() => onAddFood(mealType)}
        >
          <Ionicons name="add" size={24} color={mealColor} />
        </Pressable>
      </View>

      {/* Food Items */}
      {mealItems.length > 0 ? (
        <View style={styles.mealItems}>
          {mealItems.map((item, index) => (
            <SwipeableFoodItem
              key={item.id}
              item={{
                ...item,
                name: toTitleCase(item.name),
              }}
              mealColor={mealColor}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLast={index === mealItems.length - 1}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No foods logged</Text>
        </View>
      )}
    </View>
  );
};

export default function TodaysMeals({ 
  meals, 
  onDeleteFood, 
  onEditFood,
  onAddFood
}) {
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
      </View>

      <View style={styles.mealsContainer}>
        {Object.entries(mealsByType).map(([mealType, mealItems], index) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            mealItems={mealItems}
            onAddFood={onAddFood}
            onDeleteFood={onDeleteFood}
            onEditFood={onEditFood}
            isLast={index === Object.entries(mealsByType).length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  cardTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  mealsContainer: {
    // Container for all meal sections
  },
  mealSection: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    paddingVertical: 4,
  },
  mealSectionWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  mealSectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  compactTotals: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactTotal: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  compactMacro: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "600",
  },
  compactDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#555",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mealItems: {
    paddingTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
});
