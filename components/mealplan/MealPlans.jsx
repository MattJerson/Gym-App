import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Meal Plan Info Component - Shows current plan details and stats
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

  // Calculate plan statistics
  const daysCompleted = activePlan.days_completed || 0;
  const durationWeeks = activePlan.duration_weeks || 8;
  const totalDays = durationWeeks * 7;
  const progressPercentage = Math.min((daysCompleted / totalDays) * 100, 100);
  
  // Format calorie adjustment
  const adjustmentPercent = activePlan.calorie_adjustment_percent 
    ? Math.round(activePlan.calorie_adjustment_percent * 100) 
    : 0;
  
  const adjustmentText = adjustmentPercent > 0 
    ? `+${adjustmentPercent}% Surplus` 
    : adjustmentPercent < 0 
    ? `${adjustmentPercent}% Deficit`
    : 'Maintenance';
  
  // Get plan type color
  const planColor = getPlanTypeColor(activePlan.plan_type);
  
  // Calculate adherence if available
  const adherence = activePlan.adherence_score || 0;

  return (
    <View style={styles.container}>
      {/* Compact Plan Card */}
      <View style={[styles.planCard, { borderLeftColor: planColor, borderLeftWidth: 3 }]}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: planColor }]} />
              <Text style={styles.statusText}>Active</Text>
            </View>
            <Text style={styles.planName}>{activePlan.plan_name}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: planColor + "20", borderColor: planColor + "30" }]}>
            <Text style={[styles.typeText, { color: planColor }]}>
              {formatPlanType(activePlan.plan_type)}
            </Text>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          {/* Calorie Target */}
          <View style={styles.quickStat}>
            <Ionicons name="flame" size={14} color="#FF6B35" />
            <View>
              <Text style={styles.quickStatValue}>{activePlan.daily_calories}</Text>
              <Text style={styles.quickStatLabel}>kcal/day</Text>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.quickStat}>
            <Ionicons name="nutrition" size={14} color="#888" />
            <View>
              <Text style={styles.quickStatValue}>
                {activePlan.daily_protein}g • {activePlan.daily_carbs}g • {activePlan.daily_fats}g
              </Text>
              <Text style={styles.quickStatLabel}>P • C • F</Text>
            </View>
          </View>
        </View>

        {/* Progress Row */}
        <View style={styles.progressRow}>
          {/* Duration */}
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Ionicons name="calendar-outline" size={12} color="#888" />
              <Text style={styles.progressLabel}>Week {Math.ceil(daysCompleted / 7)}/{durationWeeks}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: planColor }]} />
            </View>
          </View>

          {/* Adherence */}
          {adherence > 0 && (
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Ionicons name="trophy-outline" size={12} color="#888" />
                <Text style={styles.progressLabel}>
                  {Math.round(adherence)}% Adherence
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { 
                    width: `${adherence}%`, 
                    backgroundColor: adherence >= 80 ? '#00D4AA' : adherence >= 60 ? '#FFB300' : '#FF6B35' 
                  }
                ]} />
              </View>
            </View>
          )}
        </View>

        {/* Strategy Info (Compact) */}
        {activePlan.bmr && activePlan.tdee && (
          <View style={styles.strategyRow}>
            <Text style={styles.strategyText}>
              BMR {Math.round(activePlan.bmr)} → TDEE {Math.round(activePlan.tdee)} → {adjustmentText}
            </Text>
          </View>
        )}
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
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: "rgba(0, 212, 170, 0.12)",
    borderRadius: 6,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#00D4AA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  quickStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickStatValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  quickStatLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  progressRow: {
    gap: 8,
    marginBottom: 8,
  },
  progressItem: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  strategyRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  strategyText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
    textAlign: "center",
    letterSpacing: -0.2,
  },
});
