import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// MOCK DATA: In your app, you'll pass this data in as a prop.
const MOCK_WORKOUTS = [
  {
    id: "1",
    name: "Pull Day - Back & Biceps",
    date: "2 days ago",
    duration: "42 min",
    calories: 320,
  },
  {
    id: "2",
    name: "Leg Day - Quads & Glutes",
    date: "4 days ago",
    duration: "55 min",
    calories: 450,
  },
  {
    id: "3",
    name: "Push Day - Chest & Triceps",
    date: "6 days ago",
    duration: "38 min",
    calories: 280,
  },
];

export default function RecentWorkouts({ workouts = MOCK_WORKOUTS }) {
  const router = useRouter();

  // Transform new data structure to match component expectations
  const transformWorkout = (workout) => {
    if (workout.title) {
      // New data structure from TrainingDataService
      const daysAgo = Math.floor((new Date() - new Date(workout.completedAt)) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
      
      return {
        id: workout.id,
        name: workout.title,
        date: timeAgo,
        duration: `${workout.duration} min`,
        calories: workout.caloriesBurned || 0,
      };
    }
    // Fallback to existing structure
    return workout;
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

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Workouts</Text>
        <Ionicons name="barbell-outline" size={18} color="#fff" />
      </View>

      {/* Dynamic list of workouts */}
      {displayWorkouts.slice(0, 4).map((item, idx) => (
        <Pressable key={idx} style={styles.item}>
          <View style={styles.workoutInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>{item.date} • {item.duration}</Text>
          </View>

          <Text style={styles.highlight}>
            {getWorkoutHighlight(item)}
          </Text>
        </Pressable>
      ))}

      {/* Subtle footer with navigation */}
      <Pressable onPress={handleViewAll}>
        <Text style={styles.footer}>View full history →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    marginBottom: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  headerRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  workoutInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: "#aaa",
  },
  highlight: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  footer: {
    fontSize: 13,
    marginTop: 12,
    textAlign: "right",
    color: "#74b9ff",
    fontWeight: "500",
  },
});
