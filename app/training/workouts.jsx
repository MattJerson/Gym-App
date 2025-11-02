import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutsPageSkeleton } from "../../components/skeletons/WorkoutsPageSkeleton";

// Mock Data for the page
const myWorkouts = [
  {
    id: "1",
    name: "Morning Pump",
    details: "5 Exercises • Chest, Shoulders",
    icon: "chest-expander",
  },
  {
    id: "2",
    name: "Leg Day Annihilation",
    details: "7 Exercises • Quads, Glutes, Hams",
    icon: "trophy",
  },
];

const templates = [
  {
    id: "1",
    name: "Full Body Strength",
    details: "Beginner • 8 Exercises",
    icon: "dumbbell",
  },
  {
    id: "2",
    name: "Upper Body Hypertrophy",
    details: "Intermediate • 6 Exercises",
    icon: "barbell",
  },
  {
    id: "3",
    name: "Core & Cardio Blast",
    details: "All Levels • 30 mins",
    icon: "flame",
  },
];

export default function MyWorkouts() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <WorkoutsPageSkeleton />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Custom Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.headerText}>My Workouts</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Create New Workout Button */}
          <Pressable>
            <LinearGradient
              colors={["#4ecdc4", "#55efc4"]}
              style={styles.createButton}
            >
              <FontAwesome5 name="plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create New Workout</Text>
            </LinearGradient>
          </Pressable>

          {/* My Custom Workouts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Custom Workouts</Text>
            {myWorkouts.map((workout) => (
              <Pressable key={workout.id} style={styles.card}>
                <MaterialCommunityIcons
                  name={workout.icon}
                  size={32}
                  color="#ffd93d"
                />
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutDetails}>{workout.details}</Text>
                </View>
                <Ionicons name="ellipsis-vertical" size={22} color="#777" />
              </Pressable>
            ))}
          </View>

          {/* Workout Templates Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Templates</Text>
            {templates.map((template) => (
              <Pressable key={template.id} style={styles.card}>
                <FontAwesome5 name={template.icon} size={28} color="#ff6b6b" />
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{template.name}</Text>
                  <Text style={styles.workoutDetails}>{template.details}</Text>
                </View>
                <Pressable style={styles.startBtn}>
                  <Text style={styles.startBtnText}>Start</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 },
  headerRow: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { zIndex: 10 },
  headerText: { fontSize: 28, color: "#fff", fontWeight: "bold" },
  createButton: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: 18,
    color: "#fff",
    marginLeft: 12,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 16,
    fontWeight: "600",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  workoutInfo: {
    flex: 1,
    marginLeft: 16,
  },
  workoutName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  workoutDetails: {
    fontSize: 14,
    marginTop: 4,
    color: "#ccc",
  },
  startBtn: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  startBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
