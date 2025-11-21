import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { WorkoutCategoryPageSkeleton } from "../../components/skeletons/WorkoutCategoryPageSkeleton";

export default function WorkoutCategory() {
  const router = useRouter();
  const { categoryId, categoryName, categoryColor } = useLocalSearchParams();
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategoryWorkouts();
  }, [categoryId]);

  const loadCategoryWorkouts = async () => {
    try {
      setIsLoading(true);

      // Fetch ONLY pre-made workouts with exercise counts
      const { data, error } = await supabase
        .from("workout_templates")
        .select(`
          *,
          workout_template_exercises (
            id
          )
        `)
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .or("is_custom.is.null,is_custom.eq.false") // Only admin/pre-made templates
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading workouts:", error);
        throw error;
      }

      // Add exercise count to each workout
      const workoutsWithCounts = (data || []).map(workout => ({
        ...workout,
        exercise_count: workout.workout_template_exercises?.length || 0
      }));

      setWorkouts(workoutsWithCounts);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkoutPress = (workoutId) => {
    router.push(`/training/workout-detail?workoutId=${workoutId}`);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Beginner: "#10B981",
      Intermediate: "#F59E0B",
      Advanced: "#EF4444",
    };
    return colors[difficulty] || "#10B981";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            {workouts.length} workouts available
          </Text>
        </View>
      </View>

      {/* Workouts List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <WorkoutCategoryPageSkeleton />
        ) : (
          <View style={styles.workoutGrid}>
            {workouts.map((workout) => (
              <Pressable
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => handleWorkoutPress(workout.id)}
              >
                <View
                  style={[
                    styles.cardInner,
                    { borderLeftColor: categoryColor || "#A3E635" },
                  ]}
                >
                  {/* Difficulty Badge */}
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          getDifficultyColor(workout.difficulty) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(workout.difficulty) },
                      ]}
                    >
                      {workout.difficulty.toUpperCase()}
                    </Text>
                  </View>

                  {/* Workout Info */}
                  <Text style={styles.workoutName} numberOfLines={2}>
                    {workout.name}
                  </Text>
                  <Text style={styles.workoutDescription} numberOfLines={2}>
                    {workout.description}
                  </Text>

                  {/* Stats Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={16} color="#8BA3C4" />
                      <Text style={styles.statText}>
                        {workout.duration_minutes} min
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="fitness-outline"
                        size={16}
                        color="#8BA3C4"
                      />
                      <Text style={styles.statText}>
                        {workout.exercise_count || 0} exercises
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Row - Start Button */}
                  <View style={styles.bottomRow}>
                    <Pressable
                      style={[
                        styles.startButton,
                        { 
                          backgroundColor: categoryColor || "#A3E635",
                          borderColor: categoryColor ? `${categoryColor}80` : "#A3E63580",
                        },
                      ]}
                      onPress={() => handleWorkoutPress(workout.id)}
                    >
                      <Text style={styles.startButtonText}>Start Workout</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#0B0B0B"
                      />
                    </Pressable>
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
    gap: 12,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(100, 130, 165, 0.15)",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 130, 165, 0.15)",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 2,
    color: "#FAFAFA",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "500",
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#D4D4D8",
    fontWeight: "600",
  },
  workoutGrid: {
    gap: 12,
  },
  workoutCard: {
    marginBottom: 0,
  },
  cardInner: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    borderLeftWidth: 3,
    backgroundColor: "#161616",
    borderColor: "rgba(100, 130, 165, 0.2)",
  },
  difficultyBadge: {
    borderRadius: 6,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  workoutName: {
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 6,
    color: "#FAFAFA",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  workoutDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    color: "#A1A1AA",
    fontWeight: "400",
  },
  statsRow: {
    gap: 14,
    marginBottom: 12,
    flexDirection: "row",
  },
  statItem: {
    gap: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  startButton: {
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    fontSize: 13,
    color: "#0B0B0B",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
