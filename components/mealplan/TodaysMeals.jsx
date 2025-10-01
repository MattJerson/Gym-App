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
  const totalCarbs = mealItems.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFats = mealItems.reduce((sum, item) => sum + (item.fats || 0), 0);
  const mealColor = getMealColor(mealType);

  return (
    <View style={styles.mealSection}>
      {/* Meal Header with Color Accent */}
      <View style={[styles.colorAccent, { backgroundColor: mealColor }]} />
      
      <View style={styles.mealSectionHeader}>
        <View style={styles.mealTitleRow}>
          <View style={[styles.mealIconBadge, { backgroundColor: `${mealColor}20` }]}>
            <MaterialIcons name={getMealIcon(mealType)} size={24} color={mealColor} />
          </View>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealSectionTitle}>{mealType}</Text>
            {mealItems.length > 0 && (
              <View style={styles.macroRow}>
                <Text style={[styles.macroText, { color: mealColor }]}>
                  {totalCalories} cal
                </Text>
                <View style={styles.macroDivider} />
                <Text style={styles.macroText}>{totalProtein}g protein</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable 
          style={[styles.addButton, { backgroundColor: `${mealColor}15`, borderColor: `${mealColor}30` }]} 
          onPress={() => onAddFood(mealType)}
        >
          <Ionicons name="add" size={20} color={mealColor} />
        </Pressable>
      </View>

      {mealItems.length === 0 ? (
        <Pressable style={styles.emptyMealContainer} onPress={() => onAddFood(mealType)}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${mealColor}15` }]}>
            <Ionicons name="add-circle-outline" size={24} color={mealColor} />
          </View>
          <Text style={styles.emptyMealText}>Add your first food</Text>
        </Pressable>
      ) : (
        <View style={styles.mealItems}>
          {mealItems.map((item, index) => (
            <Pressable 
              key={index} 
              style={[
                styles.mealItem, 
                index === mealItems.length - 1 && styles.lastMealItem
              ]}
            >
              <View style={styles.mealItemLeft}>
                <View style={styles.foodIconCircle}>
                  <Text style={styles.foodIcon}>{item.icon}</Text>
                </View>
                <View style={styles.mealItemDetails}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <View style={styles.foodMetaRow}>
                    <Text style={styles.foodTime}>{item.time}</Text>
                    {item.serving && (
                      <>
                        <View style={styles.metaDot} />
                        <Text style={styles.foodServing}>{item.serving}</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.mealItemRight}>
                <Text style={styles.foodCalories}>{item.calories}</Text>
                <Text style={styles.caloriesLabel}>cal</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" style={styles.chevron} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Meal Summary Footer (only show if there are items) */}
      {mealItems.length > 0 && (
        <View style={[styles.mealFooter, { backgroundColor: `${mealColor}08` }]}>
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
  mealTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  mealIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealSectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  macroText: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "600",
  },
  macroDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emptyMealContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyMealText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  mealItems: {
    backgroundColor: "transparent",
  },
  mealItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  lastMealItem: {
    borderBottomWidth: 0,
  },
  mealItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  foodIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  foodIcon: {
    fontSize: 20,
  },
  mealItemDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  foodMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  foodTime: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
  },
  foodServing: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  mealItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  foodCalories: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  caloriesLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
  chevron: {
    marginLeft: 4,
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
  },
  footerMacroValue: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  footerMacroLabel: {
    fontSize: 10,
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
