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

  const getMealIcon = (type) => {
    switch (type) {
      case "Breakfast": return "sunny-outline";
      case "Lunch": return "restaurant-outline";
      case "Snack": return "nutrition-outline";
      case "Dinner": return "moon-outline";
      default: return "fast-food-outline";
    }
  };

  const totalCalories = mealItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = mealItems.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = mealItems.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFats = mealItems.reduce((sum, item) => sum + (item.fats || 0), 0);
  const mealColor = getMealColor(mealType);
  const mealIcon = getMealIcon(mealType);

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
      {/* Meal Header with Icon */}
      <View style={styles.mealSectionHeader}>
        <View style={styles.mealTitleRow}>
          <View style={[styles.mealIconContainer, { backgroundColor: `${mealColor}20` }]}>
            <Ionicons name={mealIcon} size={18} color={mealColor} />
          </View>
          <View>
            <Text style={styles.mealSectionTitle}>{mealType}</Text>
            {mealItems.length > 0 && (
              <Text style={styles.itemCount}>{mealItems.length} item{mealItems.length !== 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>
        <Pressable 
          style={[styles.addButton, { backgroundColor: `${mealColor}15` }]} 
          onPress={() => onAddFood(mealType)}
        >
          <Ionicons name="add" size={22} color={mealColor} />
        </Pressable>
      </View>

      {/* Food Items */}
      {mealItems.length > 0 ? (
        <>
          <View style={styles.mealItems}>
            {mealItems.map((item, index) => (
              <SwipeableFoodItem
                key={item.id}
                item={{
                  ...item,
                  name: toTitleCase(item.name), // Convert to Title Case
                }}
                mealColor={mealColor}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLast={index === mealItems.length - 1}
              />
            ))}
          </View>

          {/* Meal Totals - Big and Bold */}
          <View style={[styles.mealTotalsContainer, { borderTopColor: `${mealColor}15` }]}>
            <View style={styles.totalsRow}>
              <View style={styles.totalItem}>
                <Text style={[styles.totalValue, { color: mealColor }]}>{totalCalories}</Text>
                <Text style={styles.totalLabel}>Calories</Text>
              </View>
              
              <View style={styles.totalDivider} />
              
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{totalProtein.toFixed(1)}g</Text>
                <Text style={styles.totalLabel}>Protein</Text>
              </View>
              
              <View style={styles.totalDivider} />
              
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{totalCarbs.toFixed(1)}g</Text>
                <Text style={styles.totalLabel}>Carbs</Text>
              </View>
              
              <View style={styles.totalDivider} />
              
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{totalFats.toFixed(1)}g</Text>
                <Text style={styles.totalLabel}>Fats</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={32} color="#333" />
          <Text style={styles.emptyText}>No foods logged yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add your first item</Text>
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
  mealSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mealSectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  itemCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mealItems: {
    paddingTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
    marginTop: 12,
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
    marginTop: 4,
  },
  mealTotalsContainer: {
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  totalItem: {
    alignItems: "center",
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  totalDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
});
