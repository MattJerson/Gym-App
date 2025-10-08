import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../services/supabase";

export default function RecentWorkouts() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentWorkouts();
  }, []);

  const fetchRecentWorkouts = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent completed workouts
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_name,
          workout_type,
          completed_at,
          total_duration_seconds,
          total_exercises,
          estimated_calories_burned,
          workout_categories(name, color)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformWorkout = (workout) => {
    const completedDate = new Date(workout.completed_at);
    const now = new Date();
    const daysAgo = Math.floor((now - completedDate) / (1000 * 60 * 60 * 24));
    
    let timeAgo;
    if (daysAgo === 0) timeAgo = "Today";
    else if (daysAgo === 1) timeAgo = "Yesterday";
    else timeAgo = `${daysAgo} days ago`;
    
    const durationMins = Math.round(workout.total_duration_seconds / 60);
    
    return {
      id: workout.id,
      name: workout.workout_name,
      date: timeAgo,
      duration: `${durationMins} min`,
      calories: workout.estimated_calories_burned || 0,
    };
  };

  const displayWorkouts = workouts.map(transformWorkout);

  const getWorkoutHighlight = (workout) => {
    const parts = [];
    if (workout.calories) parts.push(`${workout.calories} cal`);
    if (workout.duration) parts.push(workout.duration);
    return parts.join(" • ");
  };

  const handleViewAll = () => {
    router.push("/activity?filter=workout");
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recent Workouts</Text>
          <Ionicons name="barbell-outline" size={18} color="#fff" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#74b9ff" size="small" />
        </View>
      </View>
    );
  }

  if (displayWorkouts.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recent Workouts</Text>
          <Ionicons name="barbell-outline" size={18} color="#fff" />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No workouts completed yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your workouts!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Workouts</Text>
        <Pressable onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={12} color="#74b9ff" />
        </Pressable>
      </View>

      {/* Dynamic list of workouts */}
      {displayWorkouts.map((item, idx) => (
        <Pressable key={idx} style={styles.item}>
          {/* Left - Type Badge */}
          <View style={styles.typeBadge}>
            <View style={styles.typeDot} />
          </View>

          {/* Middle - Content */}
          <View style={styles.workoutInfo}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.timeText}>{item.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.statChip}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statText}>{item.calories}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statIcon}>⏱</Text>
                <Text style={styles.statText}>{item.duration}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(116, 185, 255, 0.12)",
    borderWidth: 1,
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
    backgroundColor: "rgba(116, 185, 255, 0.08)",
  },
  viewAllText: {
    fontSize: 11,
    color: "#74b9ff",
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
    backgroundColor: "rgba(116, 185, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#74b9ff",
  },
  workoutInfo: {
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
    gap: 5,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  statIcon: {
    fontSize: 9,
  },
  statText: {
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
