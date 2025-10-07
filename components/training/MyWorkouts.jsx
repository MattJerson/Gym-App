import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";

// Get screen dimensions
const { width } = Dimensions.get("window");

// Card dimensions - more compact
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 14;
const VISIBLE_CARDS = 1.3; // Show more of next card

const CARD_WIDTH = (width - 40 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;
const CARD_HEIGHT = 180; // Reduced from 200

// Difficulty badge colors
const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "Beginner":
      return "#10B981";
    case "Intermediate":
      return "#F59E0B";
    case "Advanced":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

// Workout Card Component - Refined design with color coding
const WorkoutCardItem = ({ item, onPress, onOptions }) => {
  const difficultyColor = getDifficultyColor(item.difficulty);
  const dayLabel = item.is_scheduled && item.scheduled_day_name 
    ? item.scheduled_day_name 
    : null;
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]} 
      onPress={onPress}
    >
      <View style={styles.cardInner}>
        {/* Color accent stripe at top */}
        <View style={[styles.colorAccent, { backgroundColor: item.category_color || item.color }]} />
        
        {/* Header with workout type badge */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { 
              backgroundColor: `${item.category_color || item.color}12`,
              borderColor: `${item.category_color || item.color}25`,
            }]}>
              <Text style={[styles.typeText, { color: item.category_color || item.color }]}>
                {item.workout_type ? item.workout_type.toUpperCase() : 'PRE-MADE'}
              </Text>
            </View>
            {dayLabel && (
              <View style={[styles.dayBadge, { 
                backgroundColor: 'rgba(163, 230, 53, 0.12)',
                borderColor: 'rgba(163, 230, 53, 0.25)',
              }]}>
                <Ionicons name="calendar-outline" size={9} color="#A3E635" />
                <Text style={[styles.dayText, { color: '#A3E635' }]}>
                  {dayLabel.substring(0, 3).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Pressable 
            style={styles.optionsButton}
            onPress={(e) => {
              e.stopPropagation();
              onOptions(item.id);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
          </Pressable>
        </View>

        {/* Workout name with icon */}
        <View style={styles.nameRow}>
          <View style={[styles.iconBadge, { backgroundColor: `${item.category_color || item.color}20` }]}>
            <MaterialCommunityIcons name={item.icon || "dumbbell"} size={20} color={item.category_color || item.color} />
          </View>
          <Text style={styles.workoutName} numberOfLines={2}>
            {item.workout_name || item.name}
          </Text>
        </View>

        {/* Difficulty badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20`, borderColor: difficultyColor }]}>
          <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>{item.difficulty}</Text>
        </View>

        {/* Metrics - TodaysWorkoutCard style */}
        <View style={[styles.metricsContainer, {
          backgroundColor: `${item.category_color || item.color}08`,
          borderColor: `${item.category_color || item.color}15`,
        }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: item.category_color || item.color }]}>
              {item.times_completed || 0}
            </Text>
            <Text style={styles.metricLabel}>done</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: `${item.category_color || item.color}25` }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: item.category_color || item.color }]}>
              {item.duration_minutes || item.duration}
            </Text>
            <Text style={styles.metricLabel}>min</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: `${item.category_color || item.color}25` }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: item.category_color || item.color }]}>
              {item.estimated_calories || item.calories}
            </Text>
            <Text style={styles.metricLabel}>kcal</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function MyWorkouts({
  onSelectWorkout = () => {},
  onWorkoutOptions = () => {},
}) {
  const [userId, setUserId] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMyWorkouts();
    }
  }, [userId]);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      setIsLoading(false);
    }
  };

  const loadMyWorkouts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_my_workouts', { 
        p_user_id: userId 
      });
      
      if (error) throw error;
      
      // Transform database response to match card format
      const transformedWorkouts = (data || []).map(workout => ({
        id: workout.id,
        workout_name: workout.workout_name,
        workout_type: workout.workout_type,
        category_color: workout.category_color,
        category_icon: workout.category_icon,
        difficulty: workout.difficulty_level,
        duration_minutes: workout.duration_minutes,
        estimated_calories: workout.estimated_calories,
        times_completed: workout.times_completed,
        is_scheduled: workout.is_scheduled,
        scheduled_day_name: workout.scheduled_day_name,
        is_favorite: workout.is_favorite,
        template_id: workout.template_id,
      }));
      
      setWorkouts(transformedWorkouts);
    } catch (error) {
      console.error('Error loading my workouts:', error);
      Alert.alert('Error', 'Failed to load your workouts');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Workouts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A3E635" />
          <Text style={styles.loadingText}>Loading your workouts...</Text>
        </View>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Workouts</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="weight-lifter" size={64} color="#444" />
          <Text style={styles.emptyTitle}>No Saved Workouts</Text>
          <Text style={styles.emptyText}>
            Browse workouts and save them to build your personal library
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>My Workouts</Text>
        <Pressable style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#A3E635" />
        </Pressable>
      </View>
      
      <FlatList
        data={workouts}
        renderItem={({ item }) => (
          <WorkoutCardItem
            item={item}
            onPress={() => onSelectWorkout(item.template_id)}
            onOptions={onWorkoutOptions}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContentContainer}
        snapToInterval={CARD_WIDTH + CARD_MARGIN_RIGHT}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#A3E635",
    fontWeight: "600",
  },
  listContentContainer: {
    paddingRight: PADDING_HORIZONTAL * 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN_RIGHT,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    overflow: 'hidden',
    // Shadow matching other components
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  colorAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  dayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  workoutName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  metricNum: {
    fontWeight: "800",
    fontSize: 14,
  },
  metricLabel: {
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "500",
  },
  metricDivider: {
    width: 1,
    height: 14,
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 9,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressCount: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    position: 'relative',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 9,
    color: "#666",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  loadingContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
