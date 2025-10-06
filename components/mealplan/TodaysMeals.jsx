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

const MealSection = ({ mealType, mealItems, onAddFood, onDeleteFood, onEditFood }) => {
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
    <View style={styles.mealSection}>
      {/* Meal Header with Color Accent */}
      <View style={[styles.colorAccent, { backgroundColor: mealColor }]} />
      
      <View style={styles.mealSectionHeader}>
        <Text style={styles.mealSectionTitle}>{mealType}</Text>
        <Pressable 
          style={[styles.addButton, { backgroundColor: `${mealColor}15`, borderColor: `${mealColor}30` }]} 
          onPress={() => onAddFood(mealType)}
        >
          <Ionicons name="add" size={20} color={mealColor} />
        </Pressable>
      </View>

      {mealItems.length > 0 && (
        <View style={styles.mealItems}>
          {mealItems.map((item, index) => (
            <SwipeableFoodItem
              key={index}
              item={item}
              mealColor={mealColor}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLast={index === mealItems.length - 1}
            />
          ))}
        </View>
      )}

      {/* Meal Summary Footer (only show if there are items) */}
      {mealItems.length > 0 && (
        <View style={[styles.mealFooter, { backgroundColor: `${mealColor}08` }]}>
          <View style={styles.footerMacro}>
            <Text style={styles.footerMacroValue}>{totalCalories}</Text>
            <Text style={styles.footerMacroLabel}>Calories</Text>
          </View>
          <View style={[styles.footerDivider, { backgroundColor: `${mealColor}20` }]} />
          <View style={styles.footerMacro}>
            <Text style={styles.footerMacroValue}>{totalCarbs}g</Text>
            <Text style={styles.footerMacroLabel}>Carbs</Text>
          </View>
          <View style={[styles.footerDivider, { backgroundColor: `${mealColor}20` }]} />
          <View style={styles.footerMacro}>
            <Text style={styles.footerMacroValue}>{totalProtein}g</Text>
            <Text style={styles.footerMacroLabel}>Protein</Text>
          </View>
          <View style={[styles.footerDivider, { backgroundColor: `${mealColor}20` }]} />
          <View style={styles.footerMacro}>
            <Text style={styles.footerMacroValue}>{totalFats}g</Text>
            <Text style={styles.footerMacroLabel}>Fats</Text>
          </View>
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

      {Object.entries(mealsByType).map(([mealType, mealItems]) => (
        <MealSection
          key={mealType}
          mealType={mealType}
          mealItems={mealItems}
          onAddFood={onAddFood}
          onDeleteFood={onDeleteFood}
          onEditFood={onEditFood}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  mealSection: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  colorAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingTop: 17,
  },
  mealSectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  mealItems: {
    backgroundColor: "transparent",
  },
  mealFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  footerMacro: {
    alignItems: "center",
    flex: 1,
  },
  footerMacroValue: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  footerMacroLabel: {
    fontSize: 9,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footerDivider: {
    width: 1,
    height: 24,
  },
});
