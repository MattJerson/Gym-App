import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getRestrictionWarning } from "../../services/AllergenDetectionService";

/**
 * FoodItemCard Component - Compact version matching TodaysMeals.jsx style
 * 
 * Features:
 * - Proper capitalization (first letter caps, rest lowercase)
 * - No icons/images
 * - Full nutrition labels (not abbreviated)
 * - Compact vertical spacing
 * - Clean, minimal design
 * - Dietary restriction warnings with grayed-out styling
 */
export default function FoodItemCard({ 
  food, 
  onPress, 
  mode = "default", // "default", "recent", "log"
  style,
  isRestricted = false, // Whether this food violates dietary restrictions
  violations = [] // Array of restriction violations
}) {
  // Format food name with proper capitalization
  const formatFoodName = (name) => {
    if (!name) return "";
    // Split by common separators and capitalize first letter of each main word
    return name.split(/(?=[,-])/g).map(part => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }).join("");
  };

  // Format brand name
  const formatBrand = (brand) => {
    if (!brand) return null;
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  };

  const formattedName = formatFoodName(food.name);
  const formattedBrand = formatBrand(food.brand);

  // Calculate calories per serving for display
  const servingCalories = food.serving_size 
    ? Math.round((food.calories / 100) * food.serving_size)
    : Math.round(food.calories);

  // Get badge color based on mode
  const getBadgeColor = () => {
    if (mode === "recent") return "#FF9500";
    if (mode === "log") return "#00D4AA";
    return "#666";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(food)}
      style={[
        styles.container, 
        style,
        isRestricted && styles.restrictedContainer
      ]}
    >
      <View style={styles.content}>
        {/* Food Info - Left Side */}
        <View style={styles.foodInfo}>
          {/* Food Name */}
          <View style={styles.nameRow}>
            <Text style={[
              styles.foodName, 
              isRestricted && styles.restrictedText
            ]} numberOfLines={1}>
              {formattedName}
            </Text>
            {isRestricted && (
              <View style={styles.warningBadge}>
                <Ionicons name="alert-circle" size={12} color="#FF9500" />
              </View>
            )}
            {!isRestricted && mode === "recent" && (
              <View style={[styles.modeBadge, { backgroundColor: `${getBadgeColor()}15` }]}>
                <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>Recent</Text>
              </View>
            )}
            {!isRestricted && mode === "log" && (
              <View style={[styles.modeBadge, { backgroundColor: `${getBadgeColor()}15` }]}>
                <Text style={[styles.modeBadgeText, { color: getBadgeColor() }]}>Logged</Text>
              </View>
            )}
          </View>

          {/* Brand & Serving Size */}
          <View style={styles.metaRow}>
            {formattedBrand && (
              <>
                <Text style={[
                  styles.brandText,
                  isRestricted && styles.restrictedText
                ]}>{formattedBrand}</Text>
                <View style={styles.metaDot} />
              </>
            )}
            <Text style={[
              styles.servingText,
              isRestricted && styles.restrictedText
            ]}>
              {food.serving_size || 100}{food.serving_unit || "g"}
            </Text>
          </View>

          {/* Dietary Restriction Warning */}
          {isRestricted && violations.length > 0 && (
            <View style={styles.warningRow}>
              <Ionicons name="alert-circle-outline" size={12} color="#FF9500" />
              <Text style={styles.warningText}>{getRestrictionWarning(violations)}</Text>
            </View>
          )}

          {/* Nutrition Info */}
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={[
                styles.nutritionValue,
                isRestricted && styles.restrictedText
              ]}>{servingCalories}</Text>
              <Text style={[
                styles.nutritionLabel,
                isRestricted && styles.restrictedText
              ]}>calories</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={[
                styles.nutritionValue,
                isRestricted && styles.restrictedText
              ]}>{Math.round(food.protein)}</Text>
              <Text style={[
                styles.nutritionLabel,
                isRestricted && styles.restrictedText
              ]}>protein</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={[
                styles.nutritionValue,
                isRestricted && styles.restrictedText
              ]}>{Math.round(food.carbs)}</Text>
              <Text style={[
                styles.nutritionLabel,
                isRestricted && styles.restrictedText
              ]}>carbs</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={[
                styles.nutritionValue,
                isRestricted && styles.restrictedText
              ]}>{Math.round(food.fats)}</Text>
              <Text style={[
                styles.nutritionLabel,
                isRestricted && styles.restrictedText
              ]}>fats</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  restrictedContainer: {
    opacity: 0.5,
    borderColor: "rgba(255, 152, 0, 0.2)",
    backgroundColor: "rgba(255, 152, 0, 0.05)",
  },
  restrictedText: {
    opacity: 0.7,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  foodInfo: {
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    letterSpacing: 0.2,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  warningBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 152, 0, 0.15)",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  warningText: {
    fontSize: 11,
    color: "#FF9500",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
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
  servingText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  nutritionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  nutritionItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#888",
  },
  nutritionDivider: {
    width: 1,
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});
