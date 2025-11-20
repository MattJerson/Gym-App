import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useRouter } from "expo-router";

/**
 * Component to display workouts assigned by Community Managers
 * Shows custom workouts assigned specifically to the user (Standard plan subscribers)
 */
export default function AssignedWorkouts({ userId, onSelectWorkout }) {
  const router = useRouter();
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAssignedWorkouts();
    }
  }, [userId]);

  const loadAssignedWorkouts = async () => {
    try {
      setLoading(true);

      // Use the database function to get assigned workouts
      const { data, error } = await supabase.rpc("get_user_assigned_workouts", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error loading assigned workouts:", error);
        return;
      }

      console.log("[AssignedWorkouts] Loaded workouts:", data);
      console.log("[AssignedWorkouts] Exercise counts:", data?.map(w => ({
        name: w.workout_name,
        exercises: w.exercise_count
      })));

      setAssignedWorkouts(data || []);
    } catch (error) {
      console.error("Error in loadAssignedWorkouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = (workoutId) => {
    if (onSelectWorkout) {
      onSelectWorkout(workoutId);
    } else {
      router.push(`/workout/${workoutId}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="account-star" size={24} color="#0A84FF" />
          <Text style={styles.title}>Assigned by Coach</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (assignedWorkouts.length === 0) {
    return null; // Don't show section if no assigned workouts
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-star" size={24} color="#0A84FF" />
        <Text style={styles.title}>Assigned by Coach</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{assignedWorkouts.length}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Personalized workouts from your community manager
      </Text>

      {/* Workouts List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {assignedWorkouts.map((workout) => (
          <Pressable
            key={workout.workout_id}
            style={styles.workoutCard}
            onPress={() => handleStartWorkout(workout.workout_id)}
          >
            {/* Header with assigned badge */}
            <View style={styles.cardHeader}>
              <View style={styles.assignedBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#FFA500" />
                <Text style={styles.assignedBadgeText}>Assigned</Text>
              </View>
              
              {workout.category_name && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{workout.category_name}</Text>
                </View>
              )}
            </View>

            {/* Workout Name */}
            <Text style={styles.workoutName} numberOfLines={2}>
              {workout.workout_name}
            </Text>

            {/* Description */}
            {workout.workout_description && (
              <Text style={styles.workoutDescription} numberOfLines={2}>
                {workout.workout_description}
              </Text>
            )}

            {/* Workout Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#A1A1AA" />
                <Text style={styles.detailText}>{workout.duration_minutes} min</Text>
              </View>

              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="dumbbell" size={16} color="#A1A1AA" />
                <Text style={styles.detailText}>{workout.exercise_count || 0} exercises</Text>
              </View>

              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="chart-line" size={16} color="#A1A1AA" />
                <Text style={styles.detailText}>{workout.difficulty}</Text>
              </View>
            </View>

            {/* Assigned By */}
            {workout.assigned_by && (
              <View style={styles.coachInfo}>
                <MaterialCommunityIcons name="account-circle" size={14} color="#71717A" />
                <Text style={styles.coachText}>by {workout.assigned_by}</Text>
              </View>
            )}

            {/* Start Button */}
            <View style={styles.startButtonContainer}>
              <MaterialCommunityIcons name="play-circle" size={20} color="#0A84FF" />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Notes */}
      {assignedWorkouts.some(w => w.notes) && (
        <View style={styles.notesContainer}>
          <MaterialCommunityIcons name="information" size={16} color="#0A84FF" />
          <Text style={styles.notesText}>
            Tap any workout to view coach notes and get started
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FAFAFA",
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(10, 132, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0A84FF",
  },
  subtitle: {
    fontSize: 14,
    color: "#A1A1AA",
    marginBottom: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#71717A",
    fontSize: 14,
  },
  scrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  workoutCard: {
    width: 280,
    backgroundColor: "#161616",
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: "rgba(10, 132, 255, 0.3)",
    shadowColor: "#0A84FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  assignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 165, 0, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 165, 0, 0.3)",
  },
  assignedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFA500",
  },
  categoryBadge: {
    backgroundColor: "rgba(161, 161, 170, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FAFAFA",
    marginBottom: 8,
    lineHeight: 24,
  },
  workoutDescription: {
    fontSize: 13,
    color: "#A1A1AA",
    marginBottom: 12,
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  coachInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(161, 161, 170, 0.2)",
  },
  coachText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#71717A",
    fontStyle: "italic",
  },
  startButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.3)",
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A84FF",
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(10, 132, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.2)",
  },
  notesText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "500",
    flex: 1,
  },
});
