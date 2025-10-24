import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";

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

      // Fetch ONLY pre-made workouts (not custom user workouts)
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .or("is_custom.is.null,is_custom.eq.false") // Only admin/pre-made templates
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading workouts:", error);
        throw error;
      }

      setWorkouts(data || []);
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
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading workouts...</Text>
          </View>
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
                      <Ionicons name="time-outline" size={14} color="#71717A" />
                      <Text style={styles.statText}>
                        {workout.duration_minutes} min
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="barbell-outline"
                        size={14}
                        color="#71717A"
                      />
                      <Text style={styles.statText}>
                        {workout.muscle_groups?.length || 0} muscle groups
                      </Text>
                    </View>
                  </View>

                  {/* Calories & Start Button */}
                  <View style={styles.bottomRow}>
                    <View style={styles.caloriesContainer}>
                      <Ionicons
                        name="flame-outline"
                        size={16}
                        color={categoryColor || "#A3E635"}
                      />
                      <Text
                        style={[
                          styles.caloriesText,
                          { color: categoryColor || "#A3E635" },
                        ]}
                      >
                        {workout.estimated_calories || 0}
                      </Text>
                      <Text style={styles.caloriesLabel}>kcal</Text>
                    </View>
                    <Pressable
                      style={[
                        styles.startButton,
                        { backgroundColor: categoryColor || "#A3E635" },
                      ]}
                      onPress={() => handleWorkoutPress(workout.id)}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={18}
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
    gap: 16,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    marginBottom: 4,
    color: "#FAFAFA",
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#71717A",
    fontWeight: "500",
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#71717A",
  },
  workoutGrid: {
    gap: 16,
  },
  workoutCard: {
    marginBottom: 0,
  },
  cardInner: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    borderLeftWidth: 4,
    backgroundColor: "#161616",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  difficultyBadge: {
    borderRadius: 6,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  workoutName: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
    color: "#FAFAFA",
    fontWeight: "800",
  },
  workoutDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  statsRow: {
    gap: 16,
    marginBottom: 14,
    flexDirection: "row",
  },
  statItem: {
    gap: 6,
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
    justifyContent: "space-between",
  },
  caloriesContainer: {
    gap: 4,
    flexDirection: "row",
    alignItems: "baseline",
  },
  caloriesText: {
    fontSize: 18,
    fontWeight: "800",
  },
  caloriesLabel: {
    fontSize: 11,
    color: "#71717A",
    fontWeight: "600",
  },
  startButton: {
    width: 44,
    height: 44,
    elevation: 4,
    shadowRadius: 4,
    borderRadius: 22,
    shadowOpacity: 0.3,
    shadowColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
  },
});
