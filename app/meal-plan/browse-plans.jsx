import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MealPlanDataService } from "../../services/MealPlanDataService";
import { supabase } from "../../services/supabase";

export default function BrowsePlans() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const templates = await MealPlanDataService.getMealPlanTemplates();
      setPlans(templates);
    } catch (error) {
      console.error("Error loading meal plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    if (!userId) {
      alert("Please log in to select a meal plan");
      return;
    }

    try {
      // Enroll user in the selected plan
      await MealPlanDataService.enrollInMealPlan(userId, plan.id);
      
      // Navigate back to meal plan page
      router.back();
    } catch (error) {
      console.error("Error enrolling in plan:", error);
      alert("Failed to select plan. Please try again.");
    }
  };

  const getPlanTypeColor = (planType) => {
    const colors = {
      weight_loss: "#00D4AA",
      bulking: "#FF6B35",
      cutting: "#007AFF",
      maintenance: "#FFB300",
      keto: "#8E44AD",
      vegan: "#4CAF50",
    };
    return colors[planType] || "#00D4AA";
  };

  const getPlanIcon = (planType) => {
    const icons = {
      weight_loss: "trending-down",
      bulking: "trending-up",
      cutting: "fitness",
      maintenance: "analytics",
      keto: "nutrition",
      vegan: "leaf",
    };
    return icons[planType] || "nutrition";
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: "#4CAF50",
      intermediate: "#FFB300",
      advanced: "#EF4444",
    };
    return colors[difficulty] || "#4CAF50";
  };

  const formatPlanType = (planType) => {
    return planType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filters = [
    { id: "all", name: "All Plans" },
    { id: "weight_loss", name: "Weight Loss" },
    { id: "bulking", name: "Muscle Gain" },
    { id: "cutting", name: "Cutting" },
    { id: "maintenance", name: "Maintenance" },
  ];

  const filteredPlans =
    selectedFilter === "all"
      ? plans
      : plans.filter((plan) => plan.plan_type === selectedFilter);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Browse Meal Plans</Text>
          <Text style={styles.headerSubtitle}>
            {filteredPlans.length} plans available
          </Text>
        </View>
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.filterContainer}
      >
        {filters.map((filter) => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterPill,
              selectedFilter === filter.id && styles.filterPillActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Plans List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Loading meal plans...</Text>
          </View>
        ) : (
          <View style={styles.plansGrid}>
            {filteredPlans.map((plan) => (
              <Pressable
                key={plan.id}
                style={({ pressed }) => [
                  styles.planCard,
                  pressed && styles.planCardPressed,
                ]}
                onPress={() => handleSelectPlan(plan)}
              >
                {/* Gradient Background */}
                <LinearGradient
                  colors={[`${getPlanTypeColor(plan.plan_type)}12`, `${getPlanTypeColor(plan.plan_type)}05`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBg}
                />

                {/* Left Color Accent Bar */}
                <View
                  style={[
                    styles.accentBar,
                    { backgroundColor: getPlanTypeColor(plan.plan_type) },
                  ]}
                />

                {/* Content */}
                <View style={styles.cardContent}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                      <Text style={styles.planName} numberOfLines={1}>
                        {plan.name}
                      </Text>
                      <View style={styles.badges}>
                        <View
                          style={[
                            styles.typeBadge,
                            {
                              backgroundColor:
                                getPlanTypeColor(plan.plan_type) + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              { color: getPlanTypeColor(plan.plan_type) },
                            ]}
                          >
                            {formatPlanType(plan.plan_type)}
                          </Text>
                        </View>
                        {plan.difficulty_level && (
                          <View
                            style={[
                              styles.difficultyBadge,
                              {
                                backgroundColor:
                                  getDifficultyColor(plan.difficulty_level) +
                                  "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.difficultyText,
                                {
                                  color: getDifficultyColor(
                                    plan.difficulty_level
                                  ),
                                },
                              ]}
                            >
                              {plan.difficulty_level.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={getPlanTypeColor(plan.plan_type)}
                    />
                  </View>

                  {/* Description */}
                  {plan.description && (
                    <Text style={styles.planDescription} numberOfLines={2}>
                      {plan.description}
                    </Text>
                  )}

                  {/* Meta Info */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={12} color="#888" />
                      <Text style={styles.metaText}>
                        {plan.duration_weeks}w
                      </Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="restaurant-outline"
                        size={12}
                        color="#888"
                      />
                      <Text style={styles.metaText}>
                        {plan.meals_per_day} meals
                      </Text>
                    </View>
                  </View>

                  {/* Macros Grid */}
                  <View style={styles.macroContainer}>
                    <View style={styles.macroGrid}>
                      <View style={styles.macroItem}>
                        <Text
                          style={[
                            styles.macroValue,
                            { color: getPlanTypeColor(plan.plan_type) },
                          ]}
                        >
                          {plan.daily_calories}
                        </Text>
                        <Text style={styles.macroLabel}>cal</Text>
                      </View>

                      <View style={styles.macroDivider} />

                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {plan.daily_protein}g
                        </Text>
                        <Text style={styles.macroLabel}>protein</Text>
                      </View>

                      <View style={styles.macroDivider} />

                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {plan.daily_carbs}g
                        </Text>
                        <Text style={styles.macroLabel}>carbs</Text>
                      </View>

                      <View style={styles.macroDivider} />

                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>
                          {plan.daily_fats}g
                        </Text>
                        <Text style={styles.macroLabel}>fats</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    color: "#FAFAFA",
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#71717A",
    fontWeight: "500",
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingBottom: 10,
  },
  filterScroll: {
    gap: 8,
  },
filterPill: {
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderRadius: 20,
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.1)",
  justifyContent: "center", // ensures vertical centering
  alignItems: "center",
  minHeight: 34, // <- ensures enough space for full text rendering
},
filterPillActive: {
  backgroundColor: "#00D4AA20",
  borderColor: "#00D4AA",
},
filterText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#888",
  lineHeight: 17, // match +1 to fontSize to avoid cropping
  textAlignVertical: "center", // Android specific fix
},
filterTextActive: {
  color: "#00D4AA",
  fontWeight: "700",
},
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  plansGrid: {
    gap: 12,
  },
  planCard: {
    position: "relative",
    backgroundColor: "#0B0B0B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    marginBottom: 0,
  },
  planCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    padding: 14,
    paddingLeft: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
    marginBottom: 6,
    lineHeight: 20,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  planDescription: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "500",
    lineHeight: 16,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#666",
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    letterSpacing: 0.3,
  },
  macroContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
  },
  macroGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  macroItem: {
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
