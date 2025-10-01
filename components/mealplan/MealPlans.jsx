import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Mock data - replace with actual data from props
const MOCK_MEAL_PLANS = [
  {
    id: "1",
    name: "Muscle Building",
    duration: "4 weeks",
    calories: 2800,
    type: "High Protein",
    active: true,
    color: "#FF6B35",
    icon: "dumbbell",
  },
  {
    id: "2",
    name: "Weight Loss",
    duration: "8 weeks",
    calories: 1800,
    type: "Balanced",
    active: true,
    color: "#00D4AA",
    icon: "run-fast",
  },
  {
    id: "3",
    name: "Keto Diet",
    duration: "6 weeks",
    calories: 2000,
    type: "Low Carb",
    active: false,
    color: "#8e44ad",
    icon: "food-apple",
  },
];

const MealPlanCard = ({ plan, onPress, onEdit, onDelete }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.planCard,
        pressed && styles.planCardPressed,
      ]}
      onPress={onPress}
    >
      {/* Color Accent */}
      <View style={[styles.colorAccent, { backgroundColor: plan.color }]} />

      {/* Header with Icon and Status */}
      <View style={styles.planHeader}>
        <View style={[styles.iconBadge, { backgroundColor: `${plan.color}20` }]}>
          <MaterialCommunityIcons name={plan.icon} size={24} color={plan.color} />
        </View>
        <View
          style={[
            styles.statusBadge,
            plan.active ? styles.activeStatus : styles.inactiveStatus,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: plan.active ? "#00D4AA" : "#666" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: plan.active ? "#00D4AA" : "#999" },
            ]}
          >
            {plan.active ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {/* Plan Name */}
      <Text style={styles.planName}>{plan.name}</Text>

      {/* Plan Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.detailText}>{plan.duration}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Ionicons name="flame-outline" size={14} color="#888" />
          <Text style={styles.detailText}>{plan.calories} cal/day</Text>
        </View>
      </View>

      {/* Type Badge */}
      <View style={[styles.typeBadge, { backgroundColor: `${plan.color}15` }]}>
        <Text style={[styles.typeText, { color: plan.color }]}>{plan.type}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: `${plan.color}20` }]}
          onPress={onPress}
        >
          <Text style={[styles.primaryButtonText, { color: plan.color }]}>
            View Details
          </Text>
        </Pressable>
        <View style={styles.iconActions}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: `${plan.color}15` }]}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(plan.id);
            }}
          >
            <Ionicons name="create-outline" size={16} color={plan.color} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(plan.id);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export default function MealPlans({
  mealPlans = MOCK_MEAL_PLANS,
  onSelectPlan = () => {},
  onEditPlan = () => {},
  onDeletePlan = () => {},
}) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meal Plans</Text>
          <Text style={styles.subtitle}>Manage your nutrition plans</Text>
        </View>
      </View>

      {/* Stats Overview (Based on Admin Page) */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>23</Text>
          <Text style={styles.statLabel}>Total Plans</Text>
          <Text style={styles.statSubtext}>5 new this month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#8e44ad" }]}>Weight Loss</Text>
          <Text style={styles.statLabel}>Most Popular</Text>
          <Text style={styles.statSubtext}>1,897 followers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#00D4AA" }]}>84.2%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
          <Text style={styles.statSubtext}>+5.1% vs last month</Text>
        </View>
      </View>

      {/* Meal Plans Grid */}
      <View style={styles.plansGrid}>
        {mealPlans.map((plan) => (
          <MealPlanCard
            key={plan.id}
            plan={plan}
            onPress={() => onSelectPlan(plan.id)}
            onEdit={onEditPlan}
            onDelete={onDeletePlan}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    overflow: "hidden",
  },
  planCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  colorAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  activeStatus: {
    backgroundColor: "rgba(0, 212, 170, 0.15)",
  },
  inactiveStatus: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },
  detailDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
    marginHorizontal: 10,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  iconActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
