import {
  View,
  Text,
  Alert,
  Image,
  Modal,
  Animated,
  StatusBar,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../services/supabase";
import { useState, useEffect, useRef, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { WorkoutSessionServiceV2 } from "../../services/WorkoutSessionServiceV2";

export default function WorkoutSession() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();

  // State management
  const [template, setTemplate] = useState(null);
  const [session, setSession] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Modal states
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [difficultyRating, setDifficultyRating] = useState(3);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef(null);

  // Get user on mount
  useEffect(() => {
    getUser();
  }, []);

  // Load workout when user is set
  useEffect(() => {
    if (userId && workoutId) {
      initializeWorkout();
    }
  }, [userId, workoutId]);

  // Timer effect - stop when completed or paused
  useEffect(() => {
    if (session && !isPaused && session.status === "in_progress" && !showCompleteModal) {
      timerInterval.current = setInterval(() => {
        const started = new Date(session.started_at);
        const now = new Date();
        const diff =
          Math.floor((now - started) / 1000) -
          (session.total_pause_duration || 0);
        setElapsedTime(diff > 0 ? diff : 0);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [session, isPaused, showCompleteModal]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Calculate progress based on template exercises, not session.completed_exercises
  // Memoize to prevent unnecessary re-renders - MUST be before early returns
  const completedExercisesCount = useMemo(() => {
    if (!template || !session) return 0;
    
    return template.exercises.filter((exercise, idx) => {
      const exerciseSets = session.sets?.filter(
        (s) => s.exercise_index === idx && s.is_completed
      ) || [];
      const targetSets = exercise.sets || 3;
      return exerciseSets.length >= targetSets;
    }).length;
  }, [template, session?.sets]);

  const progressPercentage = useMemo(() => {
    if (!template || template.exercises.length === 0) return 0;
    return (completedExercisesCount / template.exercises.length) * 100;
  }, [completedExercisesCount, template]);

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
      Alert.alert("Error", "Failed to get user session");
    }
  };

  const initializeWorkout = async () => {
    try {
      setLoading(true);
      console.log('=== INITIALIZING WORKOUT ===');
      console.log('User ID:', userId);
      console.log('Workout ID:', workoutId);

      // Check if there's an existing active session for THIS workout
      const existingSession = await WorkoutSessionServiceV2.getActiveSession(userId);
      console.log('Existing session:', existingSession);

      if (existingSession) {
        // Check if the existing session is for THIS workout
        const sessionTemplateId = existingSession.workout_template_id || existingSession.template_id;
        
        if (sessionTemplateId === workoutId) {
          // Resume existing session for this workout
          console.log('Resuming existing session for this workout...');
          const templateData = await WorkoutSessionServiceV2.getWorkoutTemplate(workoutId);
          console.log('Template data:', JSON.stringify(templateData, null, 2));
          console.log('Template exercises count:', templateData?.exercises?.length || 0);
          
          setTemplate(templateData);
          setSession(existingSession);
          setCurrentExerciseIndex(existingSession.current_exercise_index || 0);
          setIsPaused(existingSession.status === "paused");

          // Calculate elapsed time
          const started = new Date(existingSession.started_at);
          const now = new Date();
          const diff = Math.floor((now - started) / 1000) - (existingSession.total_pause_duration || 0);
          setElapsedTime(diff > 0 ? diff : 0);
        } else {
          // This shouldn't happen if the check is done properly in training page
          // But handle it anyway
          console.log('Session mismatch - creating new session');
          await createNewSession();
        }
      } else {
        // No existing active session - create new one
        await createNewSession();
      }
    } catch (error) {
      console.error("Error initializing workout:", error);
      Alert.alert("Error", "Failed to load workout. Please try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      console.log('Creating new session...');
      const templateData = await WorkoutSessionServiceV2.getWorkoutTemplate(
        workoutId
      );
      console.log('Template data:', JSON.stringify(templateData, null, 2));
      console.log('Template exercises count:', templateData?.exercises?.length || 0);
      
      if (!templateData) {
        console.error('Template data is null/undefined');
        Alert.alert("Error", "Workout not found");
        router.back();
        return;
      }

      if (!templateData.exercises || templateData.exercises.length === 0) {
        console.error('Template has no exercises');
        Alert.alert("Error", "This workout has no exercises");
        router.back();
        return;
      }

      setTemplate(templateData);
      const newSession = await WorkoutSessionServiceV2.createSession(
        userId,
        workoutId
      );
      console.log('New session created:', newSession);
      setSession(newSession);
      setElapsedTime(0);
      setLoading(false); // Turn off loading when done
    } catch (error) {
      console.error('Error in createNewSession:', error);
      setLoading(false);
      throw error; // Re-throw so the caller can handle it
    }
  };

  const handleSetComplete = async (exerciseIndex, setNumber, setData) => {
    try {
      const exercise = template.exercises[exerciseIndex];
      const exerciseSession = session.exercises.find(
        (e) => e.exercise_index === exerciseIndex
      );

      // Extract exercise name from new structure
      const exerciseName = exercise.exercise?.name || exercise.exercise_name || 'Unknown Exercise';

      // Parse target_reps - handle strings like "8-10" or "10"
      let targetReps = 10; // default
      if (exercise.reps) {
        const repsStr = exercise.reps.toString();
        if (repsStr.includes("-")) {
          // Take the first number from range like "8-10" -> 8
          targetReps = parseInt(repsStr.split("-")[0]);
        } else {
          targetReps = parseInt(repsStr);
        }
      }

      await WorkoutSessionServiceV2.logSet(
        session.id,
        userId,
        exerciseIndex,
        setNumber,
        {
          exercise_name: exerciseName,
          actual_reps: setData.reps,
          weight_kg: setData.weight || 0,
          target_reps: targetReps,
          is_completed: true,
          rpe: setData.rpe || null,
        }
      );

      // Refresh session
      const updatedSession = await WorkoutSessionServiceV2.getSession(
        session.id
      );
      setSession(updatedSession);

      // Check if all exercises are complete - compare against template exercises
      // Count how many template exercises have all their sets completed
      const templateExerciseCount = template.exercises.length;
      const completedExercisesCount = template.exercises.filter((exercise, idx) => {
        const exerciseSets = updatedSession.sets?.filter(
          (s) => s.exercise_index === idx && s.is_completed
        ) || [];
        const targetSets = exercise.sets || 3;
        return exerciseSets.length >= targetSets;
      }).length;

      if (completedExercisesCount === templateExerciseCount) {
        setShowCompleteModal(true);
      }
    } catch (error) {
      console.error("Error completing set:", error);
      Alert.alert("Error", "Failed to save set. Please try again.");
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await WorkoutSessionServiceV2.resumeSession(session.id);
        setIsPaused(false);
      } else {
        await WorkoutSessionServiceV2.pauseSession(session.id);
        setIsPaused(true);
      }
      const updatedSession = await WorkoutSessionServiceV2.getSession(
        session.id
      );
      setSession(updatedSession);
    } catch (error) {
      console.error("Error pausing/resuming:", error);
      Alert.alert("Error", "Failed to update session");
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      console.log('Starting workout completion...');
      // Complete the session
      const completedSession = await WorkoutSessionServiceV2.completeSession(
        session.id,
        difficultyRating,
        completionNotes
      );
      console.log('Workout completed successfully, session status:', completedSession?.status);

      // Close modal and navigate to training page
      setShowCompleteModal(false);
      
      // Small delay to allow modal to close before navigating
      setTimeout(() => {
        router.push("/page/training");
      }, 300);
    } catch (error) {
      console.error("Error completing workout:", error);
      Alert.alert("Error", "Failed to complete workout. Please try again.");
      // Don't close modal on error so user can retry
    }
  };

  const handleQuitWorkout = () => {
    Alert.alert(
      "Quit Workout?",
      "Your progress will be saved and you can resume later.",
      [
        { text: "Continue", style: "cancel" },
        {
          text: "Save & Quit",
          onPress: async () => {
            try {
              await WorkoutSessionServiceV2.pauseSession(session.id);
              router.push("/page/training");
            } catch (error) {
              router.push("/page/training");
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="dumbbell" size={48} color="#74B9FF" />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </View>
    );
  }

  if (!template || !session) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load workout</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Pressable style={styles.headerButton} onPress={handleQuitWorkout}>
          <Ionicons name="close" size={24} color="#FAFAFA" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {template.name}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="time-outline" size={14} color="#74B9FF" />
              <Text style={styles.statText}>{formatTime(elapsedTime)}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color="#74B9FF"
              />
              <Text style={styles.statText}>
                {completedExercisesCount}/{template.exercises.length}
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.headerButton} onPress={handlePauseResume}>
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={24}
            color="#FAFAFA"
          />
        </Pressable>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% Complete
        </Text>
      </View>

      {/* Exercise List */}
      <ScrollView
        style={styles.exerciseList}
        contentContainerStyle={styles.exerciseListContent}
        showsVerticalScrollIndicator={false}
      >
        {template.exercises.map((exercise, index) => {
          const exerciseSession = session.exercises.find(
            (e) => e.exercise_index === index
          );
          const exerciseSets =
            session.sets?.filter((s) => s.exercise_index === index) || [];
          const isActive = index === currentExerciseIndex;
          const isCompleted = exerciseSession?.is_completed || false;

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={index}
              exerciseSession={exerciseSession}
              sets={exerciseSets}
              isActive={isActive}
              isCompleted={isCompleted}
              userId={userId}
              session={session}
              onSetComplete={handleSetComplete}
              onSessionUpdate={setSession}
              onExercisePress={() => {
                setSelectedExercise(exercise);
                setShowExerciseDetail(true);
              }}
              onStartExercise={async () => {
                await WorkoutSessionServiceV2.startExercise(session.id, index);
                setCurrentExerciseIndex(index);
              }}
            />
          );
        })}

        {/* Complete Workout Button */}
        {progressPercentage === 100 && (
          <Pressable
            style={styles.completeButton}
            onPress={() => setShowCompleteModal(true)}
          >
            <LinearGradient
              colors={["#74B9FF", "#1E3A5F"]}
              style={styles.completeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FAFAFA" />
              <Text style={styles.completeButtonText}>Complete Workout</Text>
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        visible={showExerciseDetail}
        exercise={selectedExercise}
        onClose={() => setShowExerciseDetail(false)}
      />

      {/* Complete Workout Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completeModal}>
            <View style={styles.completeModalHeader}>
              <MaterialCommunityIcons name="trophy" size={48} color="#74B9FF" />
              <Text style={styles.completeModalTitle}>Workout Complete!</Text>
              <Text style={styles.completeModalSubtitle}>
                Great job on completing {template.name}
              </Text>
            </View>

            <View style={styles.completeModalStats}>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#74B9FF" />
                <Text style={styles.statCardValue}>
                  {formatTime(elapsedTime)}
                </Text>
                <Text style={styles.statCardLabel}>Duration</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="barbell" size={24} color="#74B9FF" />
                <Text style={styles.statCardValue}>
                  {session.total_sets_completed}
                </Text>
                <Text style={styles.statCardLabel}>Total Sets</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={24} color="#74B9FF" />
                <Text style={styles.statCardValue}>
                  {session.estimated_calories_burned || 0}
                </Text>
                <Text style={styles.statCardLabel}>Calories</Text>
              </View>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                How difficult was this workout?
              </Text>
              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      difficultyRating === rating && styles.ratingButtonActive,
                    ]}
                    onPress={() => setDifficultyRating(rating)}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        difficultyRating === rating &&
                          styles.ratingButtonTextActive,
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this workout (optional)"
              placeholderTextColor="#71717A"
              multiline
              numberOfLines={3}
              value={completionNotes}
              onChangeText={setCompletionNotes}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCompleteWorkout}
              >
                <LinearGradient
                  colors={["#74B9FF", "#1E3A5F"]}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Finish</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    gap: 16,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#FAFAFA",
    fontWeight: "600",
  },
  errorContainer: {
    gap: 16,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FAFAFA",
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#A3E635",
  },
  retryButtonText: {
    fontSize: 16,
    color: "#0B0B0B",
    fontWeight: "700",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    justifyContent: "space-between",
    borderBottomColor: "rgba(116, 185, 255, 0.2)",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#161616",
    borderColor: "rgba(116, 185, 255, 0.3)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  workoutTitle: {
    fontSize: 18,
    marginBottom: 6,
    color: "#FAFAFA",
    fontWeight: "700",
    textAlign: "center",
  },
  statsRow: {
    gap: 12,
    flexDirection: "row",
  },
  statBadge: {
    gap: 4,
    borderRadius: 12,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(116, 185, 255, 0.15)",
  },
  statText: {
    fontSize: 12,
    color: "#74B9FF",
    fontWeight: "700",
  },
  progressContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
    backgroundColor: "#161616",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#74B9FF",
  },
  progressText: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
    textAlign: "center",
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  completeButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  completeButtonGradient: {
    gap: 12,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonText: {
    fontSize: 18,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  bottomPadding: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  completeModal: {
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: "#161616",
    borderColor: "rgba(116, 185, 255, 0.3)",
  },
  completeModalHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  completeModalTitle: {
    fontSize: 24,
    marginTop: 12,
    marginBottom: 8,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  completeModalSubtitle: {
    fontSize: 14,
    color: "#A1A1AA",
    fontWeight: "500",
    textAlign: "center",
  },
  completeModalStats: {
    gap: 12,
    marginBottom: 24,
    flexDirection: "row",
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    borderColor: "rgba(116, 185, 255, 0.2)",
  },
  statCardValue: {
    fontSize: 20,
    marginTop: 8,
    marginBottom: 4,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  statCardLabel: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    marginBottom: 12,
    color: "#FAFAFA",
    fontWeight: "600",
  },
  ratingButtons: {
    gap: 8,
    flexDirection: "row",
  },
  ratingButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderColor: "#27272A",
    backgroundColor: "#0B0B0B",
  },
  ratingButtonActive: {
    borderColor: "#A3E635",
    backgroundColor: "#A3E635",
  },
  ratingButtonText: {
    fontSize: 16,
    color: "#71717A",
    fontWeight: "700",
  },
  ratingButtonTextActive: {
    color: "#0B0B0B",
  },
  notesInput: {
    padding: 16,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    marginBottom: 24,
    color: "#FAFAFA",
    borderRadius: 12,
    borderColor: "#27272A",
    textAlignVertical: "top",
    backgroundColor: "#0B0B0B",
  },
  modalActions: {
    gap: 12,
    flexDirection: "row",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalButtonSecondary: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272A",
  },
  modalButtonPrimary: {
    overflow: "hidden",
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    color: "#FAFAFA",
    fontWeight: "700",
  },
});

// Exercise Card Component
function ExerciseCard({
  exercise,
  exerciseIndex,
  exerciseSession,
  sets,
  isActive,
  isCompleted,
  userId,
  session,
  onSetComplete,
  onSessionUpdate,
  onExercisePress,
  onStartExercise,
}) {
  const router = useRouter();
  const [expandedSets, setExpandedSets] = useState(false);
  const [currentSetData, setCurrentSetData] = useState({});
  const [previousSetData, setPreviousSetData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Function to capitalize each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Extract exercise data from new structure
  const exerciseName = capitalizeWords(exercise.exercise?.name || exercise.exercise_name || 'Unknown Exercise');
  const exerciseGif = exercise.exercise?.gif_url;
  const exerciseDescription = exercise.exercise?.description || '';
  const exerciseInstructions = exercise.exercise?.instructions || [];
  const exerciseMetValue = exercise.exercise?.met_value || 5;
  
  // Handle target_muscles - it might be an array of objects with nested muscle.name structure
  let targetMuscles = '';
  if (exercise.exercise?.target_muscles) {
    if (Array.isArray(exercise.exercise.target_muscles)) {
      targetMuscles = exercise.exercise.target_muscles
        .map(tm => {
          // Handle both direct name and nested muscle.name structures
          if (typeof tm === 'string') return tm;
          if (tm.muscle?.name) return tm.muscle.name;
          if (tm.name) return tm.name;
          return '';
        })
        .filter(Boolean)
        .join(', ');
    }
  }

  const targetSets = exerciseSession?.target_sets || exercise.sets || 3;
  const completedSets = sets.filter((s) => s.is_completed).length;
  const targetReps = exercise.reps || '10-12';
  const restSeconds = exercise.rest_seconds || 60;

  // Load previous workout data when exercise is expanded
  useEffect(() => {
    if (expandedSets && !previousSetData && userId) {
      loadPreviousWorkoutData();
    }
  }, [expandedSets]);

  const loadPreviousWorkoutData = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await WorkoutSessionServiceV2.getExerciseHistory(
        userId,
        exerciseName,
        1
      );

      if (history && history.length > 0) {
        // Get the most recent workout data
        const lastWorkout = history[0];
        setPreviousSetData({
          reps: lastWorkout.actual_reps,
          weight: lastWorkout.weight_kg,
        });

        // Pre-fill all sets with previous data
        const prefilledData = {};
        for (let i = 1; i <= targetSets; i++) {
          prefilledData[`${i}_reps`] =
            lastWorkout.actual_reps?.toString() || "";
          prefilledData[`${i}_weight`] =
            lastWorkout.weight_kg?.toString() || "";
        }
        setCurrentSetData(prefilledData);
      } else {
        // No previous data, use target reps from template
        const targetRepsStr = exercise.reps || "10";
        const targetReps = targetRepsStr.includes("-")
          ? targetRepsStr.split("-")[0]
          : targetRepsStr;

        const prefilledData = {};
        for (let i = 1; i <= targetSets; i++) {
          prefilledData[`${i}_reps`] = targetReps;
          prefilledData[`${i}_weight`] = "";
        }
        setCurrentSetData(prefilledData);
      }
    } catch (error) {
      console.error("Error loading previous workout data:", error);
      // Still pre-fill with target reps on error
      const targetRepsStr = exercise.reps || "10";
      const targetReps = targetRepsStr.includes("-")
        ? targetRepsStr.split("-")[0]
        : targetRepsStr;

      const prefilledData = {};
      for (let i = 1; i <= targetSets; i++) {
        prefilledData[`${i}_reps`] = targetReps;
        prefilledData[`${i}_weight`] = "";
      }
      setCurrentSetData(prefilledData);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSetInput = (setNumber, field, value) => {
    setCurrentSetData((prev) => ({
      ...prev,
      [`${setNumber}_${field}`]: value,
    }));
  };

  const handleCompleteSet = async (setNumber) => {
    const reps = parseInt(currentSetData[`${setNumber}_reps`]) || 0;
    const weight = parseFloat(currentSetData[`${setNumber}_weight`]) || 0;

    if (reps === 0) {
      Alert.alert("Invalid Input", "Please enter number of reps");
      return;
    }

    await onSetComplete(exerciseIndex, setNumber, { reps, weight });

    // Auto-fill next set with same values for convenience
    const nextSetNumber = setNumber + 1;
    if (nextSetNumber <= targetSets) {
      setCurrentSetData((prev) => ({
        ...prev,
        [`${nextSetNumber}_reps`]: currentSetData[`${setNumber}_reps`],
        [`${nextSetNumber}_weight`]: currentSetData[`${setNumber}_weight`],
      }));
    }
  };

  const handleUndoSet = async (setNumber) => {
    try {
      // Call service to mark set as not completed
      await WorkoutSessionServiceV2.undoSet(
        session.id,
        exerciseIndex,
        setNumber
      );

      // Refresh session data
      const updatedSession = await WorkoutSessionServiceV2.getSession(
        session.id
      );
      // Update parent component's session state
      if (onSessionUpdate) {
        onSessionUpdate(updatedSession);
      }
    } catch (error) {
      console.error("Error undoing set:", error);
      Alert.alert("Error", "Failed to undo set");
    }
  };

  // Parse reps to get max value
  const maxReps = targetReps.toString().includes('-') 
    ? targetReps.toString().split('-')[1] 
    : targetReps.toString();

  const progressPercent = Math.round((completedSets / targetSets) * 100);
  
  // For paused GIF effect - we'll use a static image URL if available, otherwise add #.gif to pause it
  const pausedGifUrl = exerciseGif ? `${exerciseGif.split('?')[0]}?t=0.001` : null;

  return (
    <View
      style={[
        exerciseCardStyles.card,
        isActive && exerciseCardStyles.cardActive,
        isCompleted && exerciseCardStyles.cardCompleted,
      ]}
    >
      {/* Exercise Image/Icon */}
      <Pressable onPress={() => {
        // Navigate to exercise detail page
        const exerciseData = {
          name: exerciseName,
          gif_url: exerciseGif,
          description: exerciseDescription,
          instructions: exerciseInstructions,
          met_value: exerciseMetValue,
          target_muscles: targetMuscles,
          body_parts: exercise.exercise?.body_parts || [],
          equipments: exercise.exercise?.equipments || [],
        };
        router.push({
          pathname: '/workout/exercise-detail',
          params: {
            exerciseData: JSON.stringify(exerciseData),
          },
        });
      }}>
        <View style={exerciseCardStyles.imageContainer}>
          {pausedGifUrl ? (
            <Image
              source={{ uri: pausedGifUrl }}
              style={exerciseCardStyles.exerciseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={exerciseCardStyles.placeholderImage}>
              <Ionicons name="barbell" size={40} color="#74B9FF" />
            </View>
          )}
          {isCompleted && (
            <View style={exerciseCardStyles.completedOverlay}>
              <Ionicons name="checkmark-circle" size={32} color="#74B9FF" />
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={exerciseCardStyles.exerciseName}>
          {exerciseName}
        </Text>

        {/* Description */}
        <View style={exerciseCardStyles.descriptionContainer}>
          {targetMuscles && (
            <Text style={exerciseCardStyles.descriptionText}>
              🎯 {targetMuscles}
            </Text>
          )}
          <Text style={exerciseCardStyles.descriptionText}>
            {targetSets} sets × {maxReps} reps • {restSeconds}s rest
          </Text>
        </View>

        {/* Info Icon */}
        <View style={exerciseCardStyles.infoIconContainer}>
          <Ionicons name="information-circle" size={20} color="#74B9FF" />
        </View>
      </Pressable>

      {/* Progress Bar - Bigger with % */}
      {!isCompleted && (
        <View style={exerciseCardStyles.progressSection}>
          <View style={exerciseCardStyles.progressBarLarge}>
            <View
              style={[
                exerciseCardStyles.progressFillLarge,
                { width: `${progressPercent}%` },
              ]}
            />
            <Text style={exerciseCardStyles.progressPercentText}>
              {progressPercent}%
            </Text>
          </View>
          <Pressable
            style={exerciseCardStyles.expandButton}
            onPress={() => {
              if (!expandedSets && !isActive) {
                onStartExercise();
              }
              setExpandedSets(!expandedSets);
            }}
          >
            <Text style={exerciseCardStyles.expandButtonText}>
              {expandedSets ? "Hide Sets" : "Start Exercise"}
            </Text>
            <Ionicons
              name={expandedSets ? "chevron-up" : "chevron-down"}
              size={18}
              color="#74B9FF"
            />
          </Pressable>
        </View>
      )}

      {isCompleted && (
        <View style={exerciseCardStyles.progressSection}>
          <View style={exerciseCardStyles.progressBarLarge}>
            <View
              style={[
                exerciseCardStyles.progressFillLarge,
                { width: "100%" },
              ]}
            />
            <Text style={exerciseCardStyles.progressPercentText}>
              100%
            </Text>
          </View>
        </View>
      )}

      {expandedSets && !isCompleted && (
        <View style={exerciseCardStyles.setsContainer}>
          {/* Previous Workout Indicator */}
          {previousSetData && (
            <View style={exerciseCardStyles.previousDataBanner}>
              <Ionicons name="trending-up" size={14} color="#74B9FF" />
              <Text style={exerciseCardStyles.previousDataText}>
                Last: {previousSetData.reps} reps × {previousSetData.weight}kg
              </Text>
            </View>
          )}

          {Array.from({ length: targetSets }).map((_, setIndex) => {
            const setNumber = setIndex + 1;
            const existingSet = sets.find((s) => s.set_number === setNumber);
            const isSetCompleted = existingSet?.is_completed;

            return (
              <View key={setIndex} style={exerciseCardStyles.setRow}>
                <View style={exerciseCardStyles.setNumberBadge}>
                  <Text style={exerciseCardStyles.setNumberText}>{setNumber}</Text>
                </View>

                {isSetCompleted ? (
                  <View style={exerciseCardStyles.setCompleted}>
                    <Text style={exerciseCardStyles.setCompletedText}>
                      {existingSet.actual_reps} reps × {existingSet.weight_kg}kg
                    </Text>
                    <TouchableOpacity
                      style={exerciseCardStyles.editSetButton}
                      onPress={() => {
                        setCurrentSetData((prev) => ({
                          ...prev,
                          [`${setNumber}_reps`]:
                            existingSet.actual_reps?.toString() || "",
                          [`${setNumber}_weight`]:
                            existingSet.weight_kg?.toString() || "",
                        }));
                        handleUndoSet(setNumber);
                      }}
                    >
                      <Ionicons name="pencil" size={14} color="#74B9FF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={exerciseCardStyles.setInputsCompact}>
                      {/* Reps */}
                      <View style={exerciseCardStyles.inputGroup}>
                        <Text style={exerciseCardStyles.inputLabel}>Reps</Text>
                        <View style={exerciseCardStyles.repsControl}>
                          <TouchableOpacity
                            style={exerciseCardStyles.repsButton}
                            onPress={() => {
                              const currentValue =
                                parseInt(currentSetData[`${setNumber}_reps`]) ||
                                parseInt(targetReps.toString().split('-')[0]) || 0;
                              handleSetInput(
                                setNumber,
                                "reps",
                                Math.max(0, currentValue - 1).toString()
                              );
                            }}
                          >
                            <Ionicons name="remove" size={14} color="#74B9FF" />
                          </TouchableOpacity>
                          
                          <Text style={exerciseCardStyles.repsDisplay}>
                            {currentSetData[`${setNumber}_reps`] || maxReps}
                          </Text>
                          
                          <TouchableOpacity
                            style={exerciseCardStyles.repsButton}
                            onPress={() => {
                              const currentValue =
                                parseInt(currentSetData[`${setNumber}_reps`]) ||
                                parseInt(targetReps.toString().split('-')[0]) || 0;
                              handleSetInput(
                                setNumber,
                                "reps",
                                (currentValue + 1).toString()
                              );
                            }}
                          >
                            <Ionicons name="add" size={14} color="#74B9FF" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Weight */}
                      <View style={exerciseCardStyles.inputGroup}>
                        <Text style={exerciseCardStyles.inputLabel}>Weight</Text>
                        <View style={exerciseCardStyles.weightControl}>
                          <TextInput
                            style={exerciseCardStyles.weightInput}
                            placeholder="0"
                            placeholderTextColor="#52525B"
                            keyboardType="decimal-pad"
                            value={currentSetData[`${setNumber}_weight`] || ""}
                            onChangeText={(value) =>
                              handleSetInput(setNumber, "weight", value)
                            }
                          />
                          <Text style={exerciseCardStyles.weightUnit}>kg</Text>
                        </View>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={exerciseCardStyles.completeSetButton}
                      onPress={() => handleCompleteSet(setNumber)}
                    >
                      <Ionicons name="checkmark" size={18} color="#0B0B0B" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const exerciseCardStyles = StyleSheet.create({
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 16,
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  cardActive: {
    borderLeftWidth: 4,
    borderColor: "#74B9FF",
  },
  cardCompleted: {
    opacity: 0.8,
    borderColor: "#27272A",
  },
  
  // Image/Icon at top
  imageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#0B0B0B",
    position: "relative",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A5F",
  },
  completedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  
  // Title
  exerciseName: {
    fontSize: 20,
    marginBottom: 12,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  
  // Description
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 4,
  },
  
  // Info Icon
  infoIconContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  
  // Progress Section
  progressSection: {
    marginTop: 8,
  },
  progressBarLarge: {
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#27272A",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  progressFillLarge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: "#1E3A5F",
  },
  progressPercentText: {
    fontSize: 14,
    color: "#FAFAFA",
    fontWeight: "700",
    zIndex: 1,
  },
  
  // Expand Button
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#27272A",
  },
  expandButtonText: {
    fontSize: 14,
    color: "#74B9FF",
    fontWeight: "600",
  },
  
  // Sets Container - Compact
  setsContainer: {
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
  },
  previousDataBanner: {
    gap: 8,
    marginBottom: 8,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(30, 58, 95, 0.3)",
  },
  previousDataText: {
    fontSize: 12,
    color: "#74B9FF",
    fontWeight: "600",
  },
  
  // Set Row - Compact
  setRow: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0B0B",
  },
  setNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A5F",
  },
  setNumberText: {
    fontSize: 13,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  
  // Compact Input Layout
  setInputsCompact: {
    flex: 1,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    color: "#71717A",
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  
  // Reps Control - Compact
  repsControl: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  repsButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A5F",
  },
  repsDisplay: {
    fontSize: 14,
    color: "#FAFAFA",
    fontWeight: "700",
    minWidth: 30,
    textAlign: "center",
  },
  
  // Weight Control - Compact
  weightControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  weightInput: {
    flex: 1,
    fontSize: 14,
    color: "#FAFAFA",
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 2,
  },
  weightUnit: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
  },
  
  // Complete Set Button
  completeSetButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#74B9FF",
  },
  
  // Set Completed State
  setCompleted: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  setCompletedText: {
    flex: 1,
    fontSize: 14,
    color: "#A1A1AA",
    fontWeight: "600",
  },
  editSetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272A",
  },
});

// Exercise Detail Modal Component
function ExerciseDetailModal({ visible, exercise, onClose }) {
  if (!exercise) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{exercise.exercise_name}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={modalStyles.content}
            showsVerticalScrollIndicator={false}
          >
            {exercise.description && (
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>Description</Text>
                <Text style={modalStyles.sectionText}>
                  {exercise.description}
                </Text>
              </View>
            )}

            {exercise.tips &&
              Array.isArray(exercise.tips) &&
              exercise.tips.length > 0 && (
                <View style={modalStyles.section}>
                  <Text style={modalStyles.sectionTitle}>Tips</Text>
                  {exercise.tips.map((tip, index) => (
                    <View key={index} style={modalStyles.tipRow}>
                      <Ionicons name="bulb" size={16} color="#A3E635" />
                      <Text style={modalStyles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

            {exercise.muscle_groups &&
              Array.isArray(exercise.muscle_groups) &&
              exercise.muscle_groups.length > 0 && (
                <View style={modalStyles.section}>
                  <Text style={modalStyles.sectionTitle}>Target Muscles</Text>
                  <View style={modalStyles.muscleGrid}>
                    {exercise.muscle_groups.map((muscle, index) => (
                      <View key={index} style={modalStyles.muscleBadge}>
                        <Text style={modalStyles.muscleText}>{muscle}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  container: {
    borderWidth: 1,
    maxHeight: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#161616",
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  header: {
    padding: 20,
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    fontSize: 20,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272A",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#FAFAFA",
    marginBottom: 12,
    fontWeight: "700",
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  tipRow: {
    gap: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#A1A1AA",
    fontWeight: "500",
  },
  muscleGrid: {
    gap: 8,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  muscleBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderColor: "rgba(116, 185, 255, 0.3)",
    backgroundColor: "rgba(30, 58, 95, 0.3)",
  },
  muscleText: {
    fontSize: 12,
    color: "#74B9FF",
    fontWeight: "700",
  },
});
