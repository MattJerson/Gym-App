import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

// MOCK DATA: In your app, you'll pass this data in as a prop.
const MOCK_WORKOUTS = [
  {
    id: "1",
    name: "Pull Day - Back & Biceps",
    details: "2 days ago • 42 mins",
    highlight: "+5 lbs",
    highlightColor: "#4ecdc4",
    IconComponent: FontAwesome5,
    iconName: "weight-lifter",
    color: ["#2193b0", "#6dd5ed"], // Blue gradient
  },
  {
    id: "2",
    name: "Leg Day - Quads & Glutes",
    details: "4 days ago • 55 mins",
    highlight: "PR!",
    highlightColor: "#ffd93d",
    IconComponent: FontAwesome5,
    iconName: "running",
    color: ["#ffd93d", "#f7b733"], // Yellow gradient
  },
  {
    id: "3",
    name: "Push Day - Chest & Triceps",
    details: "6 days ago • 38 mins",
    highlight: "Complete",
    highlightColor: "#00b894",
    IconComponent: MaterialCommunityIcons,
    iconName: "chest-expander",
    color: ["#00b894", "#42e695"], // Green gradient
  },
];

export default function RecentWorkouts({ workouts = MOCK_WORKOUTS }) {
  // Transform new data structure to match component expectations
  const transformWorkout = (workout) => {
    if (workout.title) {
      // New data structure from TrainingDataService
      const daysAgo = Math.floor((new Date() - new Date(workout.completedAt)) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
      
      return {
        id: workout.id,
        name: workout.title,
        details: `${timeAgo} • ${workout.duration} mins`,
        highlight: workout.personalRecords > 0 ? "PR!" : `${workout.completionRate}%`,
        highlightColor: workout.personalRecords > 0 ? "#ffd93d" : "#4ecdc4",
        IconComponent: FontAwesome5,
        iconName: workout.icon,
        color: workout.gradient
      };
    }
    // Fallback to existing structure
    return workout;
  };

  const displayWorkouts = workouts.map(transformWorkout);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Workouts</Text>
        <FontAwesome5 name="history" size={18} color="#fff" />
      </View>

      {/* Dynamic list of recent workouts */}
      {displayWorkouts.slice(0, 3).map((item) => (
        <Pressable key={item.id} style={styles.item}>
          <LinearGradient colors={item.color} style={styles.iconContainer}>
            <item.IconComponent name={item.iconName} size={16} color="#fff" />
          </LinearGradient>

          <View style={styles.workoutInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>{item.details}</Text>
          </View>

          <Text style={[styles.highlight, { color: item.highlightColor }]}>
            {item.highlight}
          </Text>
        </Pressable>
      ))}

      {/* Subtle footer */}
      <Pressable>
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
    backgroundColor: "rgba(255, 255, 255, 0.08)", // Matched your card style
  },
  headerRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18, // Slightly larger to match your other titles
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
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
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
  },
  footer: {
    fontSize: 13,
    marginTop: 12,
    textAlign: "right",
    color: "#74b9ff", // Matched your "See All" color
    fontWeight: "500",
  },
});
