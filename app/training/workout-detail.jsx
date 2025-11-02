import {
  View,
  Text,
  Alert,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import SaveWorkoutModal from "../../components/training/SaveWorkoutModal";
import { BrowseWorkoutsDataService } from "../../services/BrowseWorkoutsDataService";
import { WorkoutDetailPageSkeleton } from "../../components/skeletons/WorkoutDetailPageSkeleton";

export default function WorkoutDetail() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  const [workout, setWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error("Error getting user:", error);
    }
  };

  useEffect(() => {
    loadWorkoutDetail();
  }, [workoutId]);

  const loadWorkoutDetail = async () => {
    try {
      setIsLoading(true);
      const data = await BrowseWorkoutsDataService.fetchWorkoutDetail(
        workoutId
      );
      setWorkout(data);
    } catch (error) {
      console.error("Error loading workout detail:", error);
      Alert.alert("Error", "Failed to load workout details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWorkout = () => {
    // Show save workout modal instead of starting directly
    setShowSaveModal(true);
  };

  const handleSaveWorkout = async ({ scheduledDay, startNow }) => {
    if (!userId) {
      Alert.alert("Error", "Please sign in to save workouts");
      return;
    }

    try {
      setIsSaving(true);

      // Call the save_workout_to_library function
      const { data, error } = await supabase.rpc("save_workout_to_library", {
        p_user_id: userId,
        p_template_id: workoutId,
        p_scheduled_day: scheduledDay,
        p_start_now: startNow,
      });

      if (error) throw error;

      // Return success - modal will handle animation
      return { success: true, data, startNow };
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
      setIsSaving(false);
      throw error; // Re-throw to prevent animation
    }
  };

  const handleSaveComplete = ({ data, startNow }) => {
    // Called after animation completes
    setIsSaving(false);

    if (startNow && data && data.length > 0) {
      // Navigate to workout session if starting now
      router.push(`/workout/${workoutId}`);
    } else {
      // Go back to training page and trigger reload
      router.back();
    }
  };

  const getDayName = (dayNumber) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayNumber] || "Unknown";
  };

  const getDifficultyColor = (difficulty) => {
    return BrowseWorkoutsDataService.getDifficultyColor(difficulty);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <WorkoutDetailPageSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Workout not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {workout.name}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
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
          </View>

          {/* Description */}
          <Text style={styles.description}>{workout.description}</Text>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={20} color="#A3E635" />
              <Text style={styles.statValue}>{workout.duration}</Text>
              <Text style={styles.statLabel}>minutes</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="flame-outline" size={20} color="#EF4444" />
              <Text style={styles.statValue}>{workout.totalCalories}</Text>
              <Text style={styles.statLabel}>calories</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="barbell-outline" size={20} color="#3B82F6" />
              <Text style={styles.statValue}>{workout.exercises.length}</Text>
              <Text style={styles.statLabel}>exercises</Text>
            </View>
          </View>
        </View>

        {/* Equipment Needed */}
        {workout.equipment && workout.equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Needed</Text>
            <View style={styles.tagContainer}>
              {workout.equipment.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Ionicons
                    name="construct-outline"
                    size={14}
                    color="#A1A1AA"
                  />
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Muscle Groups */}
        {workout.muscleGroups && workout.muscleGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Muscles</Text>
            <View style={styles.tagContainer}>
              {workout.muscleGroups.map((item, index) => (
                <View key={index} style={[styles.tag, styles.muscleTag]}>
                  <Ionicons name="fitness-outline" size={14} color="#A3E635" />
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exercises List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <View style={styles.exercisesList}>
            {workout.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                {/* Exercise Number */}
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>

                {/* Exercise Content */}
                <View style={styles.exerciseContent}>
                  {/* Exercise Name */}
                  <Text style={styles.exerciseName}>{exercise.name}</Text>

                  {/* Exercise Description */}
                  <Text style={styles.exerciseDescription}>
                    {exercise.description}
                  </Text>

                  {/* Sets & Reps */}
                  <View style={styles.exerciseStats}>
                    <View style={styles.exerciseStat}>
                      <Text style={styles.exerciseStatValue}>
                        {exercise.sets} sets
                      </Text>
                    </View>
                    <View style={styles.exerciseStatDivider} />
                    <View style={styles.exerciseStat}>
                      <Text style={styles.exerciseStatValue}>
                        {exercise.reps} reps
                      </Text>
                    </View>
                    <View style={styles.exerciseStatDivider} />
                    <View style={styles.exerciseStat}>
                      <Text style={styles.exerciseStatValue}>
                        {exercise.restTime}s rest
                      </Text>
                    </View>
                  </View>

                  {/* Calories per set */}
                  <View style={styles.caloriesPerSet}>
                    <Ionicons name="flame-outline" size={12} color="#EF4444" />
                    <Text style={styles.caloriesPerSetText}>
                      ~{exercise.caloriesPerSet} kcal per set
                    </Text>
                  </View>

                  {/* Tips */}
                  {exercise.tips && exercise.tips.length > 0 && (
                    <View style={styles.tipsContainer}>
                      <Text style={styles.tipsTitle}>Tips:</Text>
                      {exercise.tips.map((tip, tipIndex) => (
                        <View key={tipIndex} style={styles.tipItem}>
                          <Text style={styles.tipBullet}>•</Text>
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Video Available Indicator */}
                  {exercise.videoUrl && (
                    <View style={styles.videoIndicator}>
                      <Ionicons
                        name="play-circle-outline"
                        size={16}
                        color="#A3E635"
                      />
                      <Text style={styles.videoText}>
                        Video guide available
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Workout Structure */}
        {workout.structure && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Structure</Text>
            <View style={styles.structureCard}>
              <View style={styles.structureItem}>
                <View style={styles.structureIcon}>
                  <Ionicons name="fitness-outline" size={18} color="#3B82F6" />
                </View>
                <View style={styles.structureContent}>
                  <Text style={styles.structureTitle}>Warm-up</Text>
                  <Text style={styles.structureTime}>
                    {workout.structure.warmup.duration} minutes
                  </Text>
                  <Text style={styles.structureDescription}>
                    {workout.structure.warmup.activities.join(", ")}
                  </Text>
                </View>
              </View>

              <View style={styles.structureItem}>
                <View style={styles.structureIcon}>
                  <Ionicons name="barbell-outline" size={18} color="#A3E635" />
                </View>
                <View style={styles.structureContent}>
                  <Text style={styles.structureTitle}>Main Workout</Text>
                  <Text style={styles.structureTime}>
                    {workout.structure.mainWorkout.duration} minutes
                  </Text>
                  <Text style={styles.structureDescription}>
                    {workout.structure.mainWorkout.focus}
                  </Text>
                </View>
              </View>

              <View style={styles.structureItem}>
                <View style={styles.structureIcon}>
                  <Ionicons name="body-outline" size={18} color="#8B5CF6" />
                </View>
                <View style={styles.structureContent}>
                  <Text style={styles.structureTitle}>Cool-down</Text>
                  <Text style={styles.structureTime}>
                    {workout.structure.cooldown.duration} minutes
                  </Text>
                  <Text style={styles.structureDescription}>
                    {workout.structure.cooldown.activities.join(", ")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Start Button */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.startButton} onPress={handleStartWorkout}>
          <Ionicons name="bookmark" size={20} color="#0B0B0B" />
          <Text style={styles.startButtonText}>Save Workout</Text>
        </Pressable>
      </View>

      {/* Save Workout Modal */}
      <SaveWorkoutModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveWorkout}
        onSaveComplete={handleSaveComplete}
        workoutName={workout?.name || ""}
        isLoading={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#71717A",
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
    fontSize: 24,
    lineHeight: 30,
    color: "#FAFAFA",
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  overviewCard: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#161616",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  overviewHeader: {
    marginBottom: 12,
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: "#E5E5E5",
  },
  statsGrid: {
    gap: 12,
    flexDirection: "row",
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  statValue: {
    fontSize: 20,
    marginTop: 6,
    color: "#FAFAFA",
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    color: "#71717A",
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FAFAFA",
    marginBottom: 12,
    fontWeight: "700",
  },
  tagContainer: {
    gap: 8,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  tag: {
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  muscleTag: {
    borderColor: "rgba(163, 230, 53, 0.2)",
    backgroundColor: "rgba(163, 230, 53, 0.08)",
  },
  tagText: {
    fontSize: 12,
    color: "#E5E5E5",
    fontWeight: "500",
  },
  exercisesList: {
    gap: 16,
  },
  exerciseCard: {
    gap: 12,
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    backgroundColor: "#161616",
    borderLeftColor: "#A3E635",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163, 230, 53, 0.15)",
  },
  exerciseNumberText: {
    fontSize: 14,
    color: "#A3E635",
    fontWeight: "800",
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    marginBottom: 6,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  exerciseDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#A1A1AA",
    marginBottom: 10,
  },
  exerciseStats: {
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(163, 230, 53, 0.08)",
  },
  exerciseStat: {
    flex: 1,
  },
  exerciseStatValue: {
    fontSize: 12,
    color: "#E5E5E5",
    fontWeight: "600",
    textAlign: "center",
  },
  exerciseStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(163, 230, 53, 0.25)",
  },
  caloriesPerSet: {
    gap: 4,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  caloriesPerSetText: {
    fontSize: 11,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  tipsContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  tipsTitle: {
    fontSize: 12,
    marginBottom: 6,
    color: "#3B82F6",
    fontWeight: "700",
  },
  tipItem: {
    gap: 6,
    marginBottom: 4,
    flexDirection: "row",
  },
  tipBullet: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "700",
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#A1A1AA",
  },
  videoIndicator: {
    gap: 6,
    alignItems: "center",
    flexDirection: "row",
  },
  videoText: {
    fontSize: 11,
    color: "#A3E635",
    fontWeight: "600",
  },
  structureCard: {
    gap: 16,
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: "#161616",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  structureItem: {
    gap: 12,
    flexDirection: "row",
  },
  structureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  structureContent: {
    flex: 1,
  },
  structureTitle: {
    fontSize: 14,
    marginBottom: 2,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  structureTime: {
    fontSize: 12,
    marginBottom: 4,
    color: "#A3E635",
    fontWeight: "600",
  },
  structureDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: "#71717A",
  },
  buttonContainer: {
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    borderTopWidth: 1,
    position: "absolute",
    backgroundColor: "#0B0B0B",
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  startButton: {
    gap: 8,
    elevation: 8,
    shadowRadius: 8,
    borderRadius: 16,
    shadowOpacity: 0.3,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#A3E635",
    justifyContent: "center",
    backgroundColor: "#A3E635",
    shadowOffset: { width: 0, height: 4 },
  },
  startButtonText: {
    fontSize: 16,
    color: "#0B0B0B",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
