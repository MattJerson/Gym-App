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

  // Get plan type color
  const planColor = getPlanTypeColor(activePlan.plan_type);
  
  // Calculate adherence if available
  const adherence = activePlan.adherence_score || 0;

  return (
    <View style={styles.container}>
      <View style={styles.planCard}>
        {/* Compact Header with Plan Info */}
        <View style={styles.header}>
          <View style={[styles.planDot, { backgroundColor: planColor }]} />
          <View style={styles.headerContent}>
            <View style={styles.planNameRow}>
              <Text style={styles.planName} numberOfLines={1}>{activePlan.plan_name}</Text>
              {activePlan.is_admin_assigned && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#FFB300" />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[styles.planType, { color: planColor }]}>
              {formatPlanType(activePlan.plan_type)}
            </Text>
          </View>
          {adherence > 0 && (
            <View style={styles.adherenceBadge}>
              <Ionicons 
                name={adherence >= 80 ? "checkmark-circle" : "time"} 
                size={14} 
                color={adherence >= 80 ? '#00D4AA' : '#FFB300'} 
              />
              <Text style={[styles.adherenceText, { 
                color: adherence >= 80 ? '#00D4AA' : '#FFB300' 
              }]}>
                {Math.round(adherence)}%
              </Text>
            </View>
          )}
        </View>

        {/* Targets Row - All in One Line */}
        <View style={styles.targetsRow}>
          <View style={styles.targetItem}>
            <Ionicons name="flame" size={16} color={planColor} />
            <Text style={[styles.targetValue, { color: planColor }]}>
              {activePlan.daily_calories}
            </Text>
            <Text style={styles.targetLabel}>cal</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.targetItem}>
            <Text style={styles.targetEmoji}>🥩</Text>
            <Text style={styles.targetValue}>{activePlan.daily_protein}g</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.targetItem}>
            <Text style={styles.targetEmoji}>🍞</Text>
            <Text style={styles.targetValue}>{activePlan.daily_carbs}g</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.targetItem}>
            <Text style={styles.targetEmoji}>🥑</Text>
            <Text style={styles.targetValue}>{activePlan.daily_fats}g</Text>
          </View>
        </View>

        {/* Optional Footer - Condensed */}
        {activePlan.bmr && activePlan.tdee && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              BMR: <Text style={styles.footerValue}>{Math.round(activePlan.bmr)}</Text>
              <Text style={styles.footerSep}> • </Text>
              TDEE: <Text style={styles.footerValue}>{Math.round(activePlan.tdee)}</Text>
              <Text style={styles.footerSep}> • </Text>
              <Text style={styles.footerValue}>{activePlan.duration_weeks}w</Text>
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
    marginBottom: 14,
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  planDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerContent: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  planName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(255, 179, 0, 0.15)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 179, 0, 0.3)",
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFB300",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planType: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  adherenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
  },
  adherenceText: {
    fontSize: 10,
    fontWeight: "700",
  },
  targetsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  targetItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  targetEmoji: {
    fontSize: 12,
  },
  targetValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  targetLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#888",
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  footer: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
  },
  footerText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  footerValue: {
    color: "#fff",
    fontWeight: "700",
  },
  footerSep: {
    color: "#444",
  },
});
