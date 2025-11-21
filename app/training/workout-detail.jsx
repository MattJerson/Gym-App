import {
  View,
  Text,
  Alert,
  Image,
  Modal,
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
import { usePageCache } from "../../contexts/PageCacheContext";

export default function WorkoutDetail() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  const { invalidateCache } = usePageCache();
  const [workout, setWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

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
      console.log('🔄 Loading workout detail for ID:', workoutId);
      const data = await BrowseWorkoutsDataService.fetchWorkoutDetail(
        workoutId
      );
      console.log('✅ Workout data loaded:', {
        name: data.name,
        exerciseCount: data.exercises?.length || 0,
        hasExercises: !!data.exercises && data.exercises.length > 0
      });
      if (data.exercises && data.exercises.length > 0) {
        console.log('📝 First exercise:', data.exercises[0]);
      }
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

    // Invalidate training cache to force reload of My Workouts section
    invalidateCache('training');

    if (startNow && data && data.length > 0) {
      // Navigate to workout session if starting now
      router.push(`/workout/${workoutId}`);
    } else {
      // Navigate back to training page - cache invalidation will trigger refresh
      router.push('/page/training');
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

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleExercisePress = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseDetail(true);
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
            {workout.exercises.map((exercise, index) => {
              const exerciseName = capitalizeWords(exercise.name);
              const exerciseGif = exercise.gifUrl;
              const pausedGifUrl = exerciseGif
                ? `${exerciseGif.split("?")[0]}?t=0.001`
                : null;
              const metValue = exercise.metValue || 5;
              
              // Calculate MET calories per set (approximate)
              const avgSetDuration = 1.5; // minutes per set (including rest)
              const avgWeight = 70; // kg (average user weight)
              const caloriesPerSet = Math.round(
                (metValue * avgWeight * avgSetDuration) / 60
              );

              return (
                <Pressable
                  key={exercise.id}
                  style={styles.exerciseCard}
                  onPress={() => handleExercisePress(exercise)}
                >
                  {/* Exercise Image */}
                  <View style={styles.exerciseImageContainer}>
                    {pausedGifUrl ? (
                      <Image
                        source={{ uri: pausedGifUrl }}
                        style={styles.exerciseImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.exercisePlaceholder}>
                        <Ionicons name="barbell" size={40} color="#2e5a95ff" />
                      </View>
                    )}
                    {/* Exercise Number Badge */}
                    <View style={styles.exerciseNumberBadge}>
                      <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                    </View>
                    {/* Info Icon */}
                    <View style={styles.infoIconBadge}>
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color="#3568aaff"
                      />
                    </View>
                  </View>

                  {/* Exercise Content */}
                  <View style={styles.exerciseContent}>
                    {/* Exercise Name */}
                    <Text style={styles.exerciseName}>{exerciseName}</Text>

                    {/* Sets & Reps & Rest */}
                    <View style={styles.exerciseStats}>
                      <View style={styles.exerciseStat}>
                        <Ionicons
                          name="repeat-outline"
                          size={16}
                          color="#2e5992ff"
                        />
                        <Text style={styles.exerciseStatValue}>
                          {exercise.sets} sets
                        </Text>
                      </View>
                      <View style={styles.exerciseStatDivider} />
                      <View style={styles.exerciseStat}>
                        <Ionicons
                          name="fitness-outline"
                          size={16}
                          color="#315e98ff"
                        />
                        <Text style={styles.exerciseStatValue}>
                          {exercise.reps} reps
                        </Text>
                      </View>
                      <View style={styles.exerciseStatDivider} />
                      <View style={styles.exerciseStat}>
                        <Ionicons name="time-outline" size={16} color="#2b5892ff" />
                        <Text style={styles.exerciseStatValue}>
                          {exercise.restTime}s
                        </Text>
                      </View>
                    </View>

                    {/* MET Calories */}
                    <View style={styles.metContainer}>
                      <Ionicons name="flame" size={16} color="#EF4444" />
                      <Text style={styles.metText}>
                        ~{caloriesPerSet} kcal/set (MET: {metValue})
                      </Text>
                    </View>

                    {/* Tap to view hint */}
                    <View style={styles.tapHint}>
                      <Ionicons
                        name="hand-left-outline"
                        size={12}
                        color="#A1A1AA"
                      />
                      <Text style={styles.tapHintText}>
                        Tap to view full instructions
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Workout Structure - Only show main workout */}
        {workout.structure && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Structure</Text>
            <View style={styles.structureCard}>
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

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        visible={showExerciseDetail}
        exercise={selectedExercise}
        onClose={() => setShowExerciseDetail(false)}
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
    gap: 12,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(30, 58, 95, 0.15)",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 58, 95, 0.2)",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: "#FAFAFA",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  overviewCard: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#161616",
    borderColor: "rgba(30, 58, 95, 0.2)",
  },
  overviewHeader: {
    marginBottom: 10,
  },
  difficultyBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
    color: "#A1A1AA",
    fontWeight: "400",
  },
  statsGrid: {
    gap: 10,
    flexDirection: "row",
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    borderColor: "rgba(30, 58, 95, 0.2)",
    backgroundColor: "rgba(30, 58, 95, 0.15)",
  },
  statValue: {
    fontSize: 20,
    marginTop: 6,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    color: "#71717A",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#FAFAFA",
    marginBottom: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
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
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderColor: "rgba(30, 58, 95, 0.2)",
    backgroundColor: "rgba(30, 58, 95, 0.15)",
  },
  muscleTag: {
    borderColor: "rgba(30, 58, 95, 0.25)",
    backgroundColor: "rgba(30, 58, 95, 0.2)",
  },
  tagText: {
    fontSize: 11,
    color: "#D4D4D8",
    fontWeight: "500",
  },
  exercisesList: {
    gap: 10,
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
    backgroundColor: "#161616",
    borderColor: "rgba(30, 58, 95, 0.2)",
  },
  exerciseImageContainer: {
    width: "100%",
    height: 140,
    position: "relative",
    backgroundColor: "#0B0B0B",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exercisePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 58, 95, 0.15)",
  },
  exerciseNumberBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2d5890ff",
    borderWidth: 2,
    borderColor: "#FAFAFA",
  },
  exerciseNumberText: {
    fontSize: 13,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  infoIconBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250, 250, 250, 0.95)",
  },
  exerciseContent: {
    padding: 12,
  },
  exerciseName: {
    fontSize: 15,
    marginBottom: 10,
    color: "#FAFAFA",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  exerciseStats: {
    gap: 10,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 58, 95, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(30, 58, 95, 0.2)",
  },
  exerciseStat: {
    flex: 1,
    gap: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseStatValue: {
    fontSize: 13,
    color: "#FAFAFA",
    fontWeight: "600",
  },
  exerciseStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(30, 58, 95, 0.4)",
  },
  metContainer: {
    gap: 6,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
  },
  metText: {
    fontSize: 11,
    color: "#D4D4D8",
    fontWeight: "500",
  },
  tapHint: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tapHintText: {
    fontSize: 10,
    color: "#71717A",
    fontWeight: "500",
    fontStyle: "italic",
  },
  structureCard: {
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "#161616",
    borderColor: "rgba(30, 58, 95, 0.2)",
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
    backgroundColor: "rgba(30, 58, 95, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(30, 58, 95, 0.25)",
  },
  structureContent: {
    flex: 1,
  },
  structureTitle: {
    fontSize: 14,
    marginBottom: 3,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  structureTime: {
    fontSize: 12,
    marginBottom: 4,
    color: "#3b82f6",
    fontWeight: "600",
  },
  structureDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#A1A1AA",
    fontWeight: "400",
  },
  buttonContainer: {
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    position: "absolute",
    backgroundColor: "#0B0B0B",
    borderTopColor: "rgba(30, 58, 95, 0.2)",
  },
  startButton: {
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#305d97ff",
  },
  startButtonText: {
    fontSize: 15,
    color: "#FAFAFA",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

// Exercise Detail Modal Component
function ExerciseDetailModal({ visible, exercise, onClose }) {
  if (!exercise) return null;

  const exerciseName = exercise.name || "Unknown Exercise";
  const exerciseGif = exercise.gifUrl;
  const exerciseDescription = exercise.description || "";
  const exerciseInstructions = exercise.instructions || [];

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title} numberOfLines={2}>
              {capitalizeWords(exerciseName)}
            </Text>
            <Pressable style={modalStyles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </Pressable>
          </View>

          <ScrollView style={modalStyles.content} showsVerticalScrollIndicator={false}>
            {/* Exercise GIF */}
            {exerciseGif && (
              <View style={modalStyles.gifContainer}>
                <Image
                  source={{ uri: exerciseGif }}
                  style={modalStyles.gif}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Description */}
            {exerciseDescription && (
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>Description</Text>
                <Text style={modalStyles.sectionText}>{exerciseDescription}</Text>
              </View>
            )}

            {/* Instructions */}
            {exerciseInstructions.length > 0 && (
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>How to Perform</Text>
                {exerciseInstructions.map((instruction, index) => (
                  <View key={index} style={modalStyles.instructionRow}>
                    <View style={modalStyles.instructionNumber}>
                      <Text style={modalStyles.instructionNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={modalStyles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Workout Info */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Workout Details</Text>
              <View style={modalStyles.detailsGrid}>
                <View style={modalStyles.detailCard}>
                  <Ionicons name="repeat-outline" size={28} color="#1E3A5F" />
                  <Text style={modalStyles.detailValue}>{exercise.sets}</Text>
                  <Text style={modalStyles.detailLabel}>Sets</Text>
                </View>
                <View style={modalStyles.detailCard}>
                  <Ionicons name="fitness-outline" size={28} color="#1E3A5F" />
                  <Text style={modalStyles.detailValue}>{exercise.reps}</Text>
                  <Text style={modalStyles.detailLabel}>Reps</Text>
                </View>
                <View style={modalStyles.detailCard}>
                  <Ionicons name="time-outline" size={28} color="#1E3A5F" />
                  <Text style={modalStyles.detailValue}>{exercise.restTime}s</Text>
                  <Text style={modalStyles.detailLabel}>Rest</Text>
                </View>
              </View>
            </View>

            {/* MET Value Info */}
            <View style={modalStyles.metInfoCard}>
              <Ionicons name="flame" size={20} color="#EF4444" />
              <View style={modalStyles.metInfoText}>
                <Text style={modalStyles.metInfoTitle}>
                  MET Value: {exercise.metValue || 5.0}
                </Text>
                <Text style={modalStyles.metInfoDescription}>
                  Metabolic Equivalent of Task - measures exercise intensity
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  container: {
    borderWidth: 2,
    maxHeight: "90%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0B0B0B",
    borderColor: "rgba(30, 58, 95, 0.6)",
  },
  header: {
    padding: 20,
    paddingTop: 24,
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(30, 58, 95, 0.3)",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    fontSize: 22,
    color: "#FAFAFA",
    fontWeight: "800",
    marginRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A5F",
  },
  content: {
    padding: 20,
  },
  gifContainer: {
    width: "100%",
    height: 280,
    borderRadius: 20,
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: "#161616",
    borderWidth: 2,
    borderColor: "rgba(30, 58, 95, 0.3)",
  },
  gif: {
    width: "100%",
    height: "100%",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FAFAFA",
    marginBottom: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#D4D4D8",
    fontWeight: "500",
  },
  instructionRow: {
    gap: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A5F",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionNumberText: {
    fontSize: 13,
    color: "#FAFAFA",
    fontWeight: "800",
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#D4D4D8",
    fontWeight: "500",
  },
  detailsGrid: {
    gap: 12,
    flexDirection: "row",
  },
  detailCard: {
    flex: 1,
    padding: 18,
    borderWidth: 2,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "rgba(30, 58, 95, 0.4)",
  },
  detailValue: {
    fontSize: 24,
    marginTop: 10,
    marginBottom: 4,
    color: "#FAFAFA",
    fontWeight: "800",
  },
  detailLabel: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metInfoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  metInfoText: {
    flex: 1,
  },
  metInfoTitle: {
    fontSize: 15,
    color: "#FAFAFA",
    fontWeight: "700",
    marginBottom: 4,
  },
  metInfoDescription: {
    fontSize: 13,
    color: "#D4D4D8",
    fontWeight: "500",
    lineHeight: 18,
  },
});
