import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

/**
 * Circular Progress Ring Component
 */
const CircularProgress = ({ current, target, size = 60, strokeWidth = 6, color = "#00D4AA" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((current / target) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressCenter}>
        <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

/**
 * Daily Progress Component - Shows today's progress vs plan targets
 */
export default function MealPlans({
  activePlan = null,
  dailyProgress = null,
  isLoading = false
}) {
  // If no active plan, show nothing (handled by parent)
  if (!activePlan) {
    return null;
  }

  // Get today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { 
    weekday: "short", 
    month: "short", 
    day: "numeric" 
  });

  // Calculate targets (use custom if set, otherwise use plan defaults)
  const targets = {
    calories: activePlan.daily_calories || 2000,
    protein: activePlan.daily_protein || 150,
    carbs: activePlan.daily_carbs || 200,
    fats: activePlan.daily_fats || 65
  };

  // Get current progress (from daily tracking or meal logs)
  const progress = dailyProgress || {
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.planName}>{activePlan.plan_name}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getPlanTypeColor(activePlan.plan_type) + "20" }]}>
          <Text style={[styles.typeText, { color: getPlanTypeColor(activePlan.plan_type) }]}>
            {formatPlanType(activePlan.plan_type)}
          </Text>
        </View>
      </View>

      {/* Macro Progress Cards */}
      <View style={styles.macroGrid}>
        {/* Calories */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View style={[styles.macroIconBadge, { backgroundColor: "#FF6B3520" }]}>
              <Ionicons name="flame" size={18} color="#FF6B35" />
            </View>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <CircularProgress 
            current={progress.total_calories}
            target={targets.calories}
            size={70}
            strokeWidth={7}
            color="#FF6B35"
          />
          <View style={styles.macroValues}>
            <Text style={styles.macroValue}>
              {Math.round(progress.total_calories)}
              <Text style={styles.macroUnit}> / {targets.calories}</Text>
            </Text>
            <Text style={styles.macroRemaining}>
              {Math.max(0, targets.calories - progress.total_calories)} kcal left
            </Text>
          </View>
        </View>

        {/* Protein */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View style={[styles.macroIconBadge, { backgroundColor: "#007AFF20" }]}>
              <Ionicons name="fitness" size={18} color="#007AFF" />
            </View>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <CircularProgress 
            current={progress.total_protein}
            target={targets.protein}
            size={70}
            strokeWidth={7}
            color="#007AFF"
          />
          <View style={styles.macroValues}>
            <Text style={styles.macroValue}>
              {Math.round(progress.total_protein)}
              <Text style={styles.macroUnit}> / {targets.protein}g</Text>
            </Text>
            <Text style={styles.macroRemaining}>
              {Math.max(0, targets.protein - progress.total_protein)}g left
            </Text>
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View style={[styles.macroIconBadge, { backgroundColor: "#FFB30020" }]}>
              <Ionicons name="leaf" size={18} color="#FFB300" />
            </View>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <CircularProgress 
            current={progress.total_carbs}
            target={targets.carbs}
            size={70}
            strokeWidth={7}
            color="#FFB300"
          />
          <View style={styles.macroValues}>
            <Text style={styles.macroValue}>
              {Math.round(progress.total_carbs)}
              <Text style={styles.macroUnit}> / {targets.carbs}g</Text>
            </Text>
            <Text style={styles.macroRemaining}>
              {Math.max(0, targets.carbs - progress.total_carbs)}g left
            </Text>
          </View>
        </View>

        {/* Fats */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View style={[styles.macroIconBadge, { backgroundColor: "#8E44AD20" }]}>
              <Ionicons name="water" size={18} color="#8E44AD" />
            </View>
            <Text style={styles.macroLabel}>Fats</Text>
          </View>
          <CircularProgress 
            current={progress.total_fats}
            target={targets.fats}
            size={70}
            strokeWidth={7}
            color="#8E44AD"
          />
          <View style={styles.macroValues}>
            <Text style={styles.macroValue}>
              {Math.round(progress.total_fats)}
              <Text style={styles.macroUnit}> / {targets.fats}g</Text>
            </Text>
            <Text style={styles.macroRemaining}>
              {Math.max(0, targets.fats - progress.total_fats)}g left
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Helper Functions
function getPlanTypeColor(planType) {
  const colors = {
    'weight_loss': '#00D4AA',
    'bulking': '#FF6B35',
    'cutting': '#007AFF',
    'maintenance': '#FFB300',
    'keto': '#8E44AD',
    'vegan': '#4CAF50',
  };
  return colors[planType] || '#00D4AA';
}

function formatPlanType(planType) {
  return planType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  macroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    width: "100%",
  },
  macroIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  progressCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  macroValues: {
    marginTop: 12,
    alignItems: "center",
    width: "100%",
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  macroUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  macroRemaining: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
});
