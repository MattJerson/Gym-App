import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../services/supabase";

export default function RecentMeals() {
  const router = useRouter();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentMeals();
  }, []);

  const fetchRecentMeals = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent meal logs grouped by date and meal_type
      const { data, error } = await supabase
        .from('user_meal_logs')
        .select(`
          id,
          meal_type,
          meal_date,
          created_at,
          calories,
          protein,
          carbs,
          fats,
          food_database(name, brand)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Group meals by date and meal_type
      const mealGroups = {};
      (data || []).forEach(log => {
        const key = `${log.meal_date}_${log.meal_type}`;
        if (!mealGroups[key]) {
          mealGroups[key] = {
            id: log.id,
            meal_type: log.meal_type,
            created_at: log.created_at,
            meal_date: log.meal_date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            foods: []
          };
        }
        mealGroups[key].calories += parseFloat(log.calories || 0);
        mealGroups[key].protein += parseFloat(log.protein || 0);
        mealGroups[key].carbs += parseFloat(log.carbs || 0);
        mealGroups[key].fats += parseFloat(log.fats || 0);
        mealGroups[key].foods.push(log.food_database?.name || 'Food item');
      });

      // Convert to array and take first 4 unique meals
      const groupedMeals = Object.values(mealGroups)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);

      setMeals(groupedMeals);
    } catch (error) {
      console.error('Error fetching recent meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformMeal = (meal) => {
    const mealDate = new Date(meal.created_at);
    const now = new Date();
    const daysAgo = Math.floor((now - mealDate) / (1000 * 60 * 60 * 24));
    
    let timeAgo;
    if (daysAgo === 0) timeAgo = "Today";
    else if (daysAgo === 1) timeAgo = "Yesterday";
    else timeAgo = `${daysAgo} days ago`;

    const mealTypeDisplay = meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);
    const foodName = meal.foods[0] || mealTypeDisplay;
    const additionalItems = meal.foods.length > 1 ? ` +${meal.foods.length - 1} more` : '';
    
    return {
      id: meal.id,
      name: foodName + additionalItems,
      details: `${timeAgo} • ${mealTypeDisplay}`,
      highlight: `${Math.round(meal.calories)} cal`,
    };
  };

  const displayMeals = meals.map(transformMeal);

  const handleViewAll = () => {
    router.push("/activity?filter=nutrition");
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recent Meals</Text>
          <MaterialCommunityIcons name="history" size={18} color="#fff" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#74b9ff" size="small" />
        </View>
      </View>
    );
  }

  if (displayMeals.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recent Meals</Text>
          <MaterialCommunityIcons name="history" size={18} color="#fff" />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No meals logged yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your nutrition!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Meals</Text>
        <Pressable onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={12} color="#4ecdc4" />
        </Pressable>
      </View>

      {/* Dynamic list of recent meals */}
      {displayMeals.map((item) => (
        <Pressable key={item.id} style={styles.item}>
          {/* Left side - Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: getMealTypeColor(item.details).bg }]}>
            <View style={styles.typeDot} />
          </View>

          {/* Middle - Content */}
          <View style={styles.mealInfo}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.timeText}>{item.details.split(' • ')[0]}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.mealTypeBadge}>
                <Text style={styles.mealTypeText}>{item.details.split(' • ')[1]}</Text>
              </View>
              <View style={styles.calorieChip}>
                <Text style={styles.chipIcon}>🔥</Text>
                <Text style={styles.chipText}>{item.highlight}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// Helper function for meal type colors
const getMealTypeColor = (details) => {
  const type = details.split(' • ')[1]?.toLowerCase() || '';
  const colorMap = {
    'breakfast': { bg: 'rgba(255, 193, 7, 0.12)' },
    'lunch': { bg: 'rgba(76, 175, 80, 0.12)' },
    'dinner': { bg: 'rgba(156, 39, 176, 0.12)' },
    'snack': { bg: 'rgba(255, 107, 107, 0.12)' },
  };
  return colorMap[type] || { bg: 'rgba(78, 205, 196, 0.12)' };
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.12)",
  },
  headerRow: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: "rgba(78, 205, 196, 0.08)",
  },
  viewAllText: {
    fontSize: 11,
    color: "#4ecdc4",
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ecdc4",
  },
  mealInfo: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  mealTypeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(78, 205, 196, 0.12)",
  },
  mealTypeText: {
    fontSize: 9,
    color: "#4ecdc4",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  calorieChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 107, 107, 0.08)",
  },
  chipIcon: {
    fontSize: 9,
  },
  chipText: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 5,
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 11,
    color: "#666",
  },
});