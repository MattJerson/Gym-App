import React, { useRef } from "react";
import { View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SwipeableFoodItem({ 
  item, 
  mealColor, 
  onEdit, 
  onDelete,
  isLast 
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeThreshold = -120; // How far to swipe to reveal actions

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative values)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, swipeThreshold));
        } else if (gestureState.dx > 0 && translateX._value < 0) {
          // Allow swiping back to close
          translateX.setValue(Math.min(gestureState.dx + translateX._value, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -60) {
          // Swipe left - reveal actions
          Animated.spring(translateX, {
            toValue: swipeThreshold,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        } else {
          // Swipe right or not enough - close
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handleEdit = () => {
    // Close swipe first
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start(() => {
      onEdit(item);
    });
  };

  const handleDelete = () => {
    onDelete(item);
  };

  return (
    <View style={[styles.container, isLast && styles.lastItem]}>
      {/* Hidden Action Buttons (behind the card) */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Food Card */}
      <Animated.View
        style={[
          styles.foodCard,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Gradient Background */}
        <LinearGradient
          colors={[`${mealColor}12`, `${mealColor}05`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBg}
        />

        {/* Left Color Accent Bar */}
        <View style={[styles.accentBar, { backgroundColor: mealColor }]} />

        {/* Food Content */}
        <View style={styles.foodContent}>
          {/* Header */}
          <View style={styles.foodHeader}>
            <Text style={styles.foodName} numberOfLines={2}>
              {item.name}
            </Text>
            <Ionicons name="chevron-back" size={14} color="#666" style={styles.swipeHint} />
          </View>

          {/* Meta Info */}
          {(item.brand || item.serving) && (
            <View style={styles.metaRow}>
              {item.brand && (
                <View style={styles.metaBadge}>
                  <Ionicons name="pricetag" size={10} color={mealColor} />
                  <Text style={[styles.brandText, { color: mealColor }]}>{item.brand}</Text>
                </View>
              )}
              {item.serving && (
                <View style={styles.metaBadge}>
                  <Ionicons name="restaurant" size={10} color="#888" />
                  <Text style={styles.servingText}>{item.serving}</Text>
                </View>
              )}
            </View>
          )}

          {/* Nutrition Info */}
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionGrid}>
              <View style={styles.macroCard}>
                <Text style={[styles.macroValue, { color: mealColor }]}>{item.calories}</Text>
                <Text style={styles.macroLabel}>calories</Text>
              </View>

              <View style={styles.macroDivider} />

              <View style={styles.macroCard}>
                <Text style={styles.macroValue}>{item.carbs}g</Text>
                <Text style={styles.macroLabel}>carbs</Text>
              </View>
                
              <View style={styles.macroDivider} />

                <View style={styles.macroCard}>
                <Text style={styles.macroValue}>{item.protein}g</Text>
                <Text style={styles.macroLabel}>protein</Text>
              </View>

              <View style={styles.macroDivider} />

              <View style={styles.macroCard}>
                <Text style={styles.macroValue}>{item.fats}g</Text>
                <Text style={styles.macroLabel}>fats</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  position: "relative",
  marginHorizontal: 16,
  marginBottom: 10,
  borderRadius: 14,
  overflow: "hidden", // clip hidden buttons
    },
  lastItem: {
    marginBottom: 5,
  },
  actionsContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 0, // Behind the card
  },
  actionButton: {
    width: 60,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  editButton: {
    backgroundColor: "#007AFF", // Fixed blue color
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  actionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
    foodCard: {
    backgroundColor: "#0B0B0B", // Solid background (same as app background)
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden", // clip content inside card
    position: "relative",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6, // Semi-transparent gradient
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  foodContent: {
    padding: 14,
    paddingLeft: 16,
  },
  foodHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
    flex: 1,
    lineHeight: 20,
  },
  swipeHint: {
    marginLeft: 8,
    opacity: 0.4,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  servingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    letterSpacing: 0.3,
  },
  nutritionContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    marginBottom: 0,
  },
  nutritionGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  macroCard: {
    alignItems: "center",
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  macroDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
