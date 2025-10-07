import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  Animated,
  TouchableOpacity,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutSessionServiceV2 } from "../../services/WorkoutSessionServiceV2";
import { supabase } from "../../services/supabase";

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
  const [completionNotes, setCompletionNotes] = useState('');
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

  // Timer effect
  useEffect(() => {
    if (session && !isPaused && session.status === 'in_progress') {
      timerInterval.current = setInterval(() => {
        const started = new Date(session.started_at);
        const now = new Date();
        const diff = Math.floor((now - started) / 1000) - (session.total_pause_duration || 0);
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
  }, [session, isPaused]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const getUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      Alert.alert('Error', 'Failed to get user session');
    }
  };

  const initializeWorkout = async () => {
    try {
      setLoading(true);
      
      // Check if there's an existing active session
      const existingSession = await WorkoutSessionServiceV2.getActiveSession(userId);
      
      if (existingSession) {
        // Resume existing session
        const templateData = await WorkoutSessionServiceV2.getWorkoutTemplate(workoutId);
        setTemplate(templateData);
        setSession(existingSession);
        setCurrentExerciseIndex(existingSession.current_exercise_index || 0);
        setIsPaused(existingSession.status === 'paused');
        
        // Calculate elapsed time
        const started = new Date(existingSession.started_at);
        const now = new Date();
        const diff = Math.floor((now - started) / 1000) - (existingSession.total_pause_duration || 0);
        setElapsedTime(diff > 0 ? diff : 0);
      } else {
        // Create new session
        const templateData = await WorkoutSessionServiceV2.getWorkoutTemplate(workoutId);
        if (!templateData) {
          Alert.alert("Error", "Workout not found");
          router.back();
          return;
        }
        
        setTemplate(templateData);
        const newSession = await WorkoutSessionServiceV2.createSession(userId, workoutId);
        setSession(newSession);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error("Error initializing workout:", error);
      Alert.alert("Error", "Failed to load workout. Please try again.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSetComplete = async (exerciseIndex, setNumber, setData) => {
    try {
      const exercise = template.exercises[exerciseIndex];
      const exerciseSession = session.exercises.find(e => e.exercise_index === exerciseIndex);
      
      // Parse target_reps - handle strings like "8-10" or "10"
      let targetReps = 10; // default
      if (exercise.reps) {
        const repsStr = exercise.reps.toString();
        if (repsStr.includes('-')) {
          // Take the first number from range like "8-10" -> 8
          targetReps = parseInt(repsStr.split('-')[0]);
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
          exercise_name: exercise.exercise_name,
          actual_reps: setData.reps,
          weight_kg: setData.weight || 0,
          target_reps: targetReps,
          is_completed: true,
          rpe: setData.rpe || null
        }
      );

      // Refresh session
      const updatedSession = await WorkoutSessionServiceV2.getSession(session.id);
      setSession(updatedSession);

      // Check if all exercises are complete
      const allComplete = updatedSession.exercises.every(ex => ex.is_completed);
      if (allComplete) {
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
      const updatedSession = await WorkoutSessionServiceV2.getSession(session.id);
      setSession(updatedSession);
    } catch (error) {
      console.error("Error pausing/resuming:", error);
      Alert.alert("Error", "Failed to update session");
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      await WorkoutSessionServiceV2.completeSession(session.id, difficultyRating, completionNotes);
      
      Alert.alert(
        "Workout Complete! 🎉",
        `Great job completing ${template.name}!`,
        [{ text: "OK", onPress: () => router.push('/page/training') }]
      );
    } catch (error) {
      console.error("Error completing workout:", error);
      Alert.alert("Error", "Failed to complete workout");
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
              router.push('/page/training');
            } catch (error) {
              router.push('/page/training');
            }
          }
        }
      ]
    );
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="dumbbell" size={48} color="#A3E635" />
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

  const progressPercentage = session.total_exercises > 0 
    ? (session.completed_exercises / session.total_exercises) * 100 
    : 0;

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
              <Ionicons name="time-outline" size={14} color="#A3E635" />
              <Text style={styles.statText}>{formatTime(elapsedTime)}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#A3E635" />
              <Text style={styles.statText}>{session.completed_exercises}/{session.total_exercises}</Text>
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
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPercentage)}% Complete</Text>
      </View>

      {/* Exercise List */}
      <ScrollView 
        style={styles.exerciseList}
        contentContainerStyle={styles.exerciseListContent}
        showsVerticalScrollIndicator={false}
      >
        {template.exercises.map((exercise, index) => {
          const exerciseSession = session.exercises.find(e => e.exercise_index === index);
          const exerciseSets = session.sets?.filter(s => s.exercise_index === index) || [];
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
              colors={["#A3E635", "#84CC16"]}
              style={styles.completeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#0B0B0B" />
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
              <MaterialCommunityIcons name="trophy" size={48} color="#A3E635" />
              <Text style={styles.completeModalTitle}>Workout Complete!</Text>
              <Text style={styles.completeModalSubtitle}>
                Great job on completing {template.name}
              </Text>
            </View>

            <View style={styles.completeModalStats}>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#A3E635" />
                <Text style={styles.statCardValue}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.statCardLabel}>Duration</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="barbell" size={24} color="#A3E635" />
                <Text style={styles.statCardValue}>{session.total_sets_completed}</Text>
                <Text style={styles.statCardLabel}>Total Sets</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={24} color="#A3E635" />
                <Text style={styles.statCardValue}>{session.estimated_calories_burned || 0}</Text>
                <Text style={styles.statCardLabel}>Calories</Text>
              </View>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>How difficult was this workout?</Text>
              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      difficultyRating === rating && styles.ratingButtonActive
                    ]}
                    onPress={() => setDifficultyRating(rating)}
                  >
                    <Text style={[
                      styles.ratingButtonText,
                      difficultyRating === rating && styles.ratingButtonTextActive
                    ]}>
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
                  colors={["#A3E635", "#84CC16"]}
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  errorText: {
    color: "#FAFAFA",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#A3E635",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(163, 230, 53, 0.1)",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  workoutTitle: {
    color: "#FAFAFA",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(163, 230, 53, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    color: "#A3E635",
    fontSize: 12,
    fontWeight: "700",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0B0B0B",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#161616",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#A3E635",
    borderRadius: 4,
  },
  progressText: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  completeButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  completeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  completeButtonText: {
    color: "#0B0B0B",
    fontSize: 18,
    fontWeight: "700",
  },
  bottomPadding: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  completeModal: {
    backgroundColor: "#161616",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  completeModalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  completeModalTitle: {
    color: "#FAFAFA",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  completeModalSubtitle: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  completeModalStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.1)",
  },
  statCardValue: {
    color: "#FAFAFA",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  statCardLabel: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  ratingButtons: {
    flexDirection: "row",
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0B0B0B",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  ratingButtonActive: {
    backgroundColor: "#A3E635",
    borderColor: "#A3E635",
  },
  ratingButtonText: {
    color: "#71717A",
    fontSize: 16,
    fontWeight: "700",
  },
  ratingButtonTextActive: {
    color: "#0B0B0B",
  },
  notesInput: {
    backgroundColor: "#0B0B0B",
    borderRadius: 12,
    padding: 16,
    color: "#FAFAFA",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalButtonSecondary: {
    backgroundColor: "#27272A",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
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
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "700",
  },
  modalButtonTextPrimary: {
    color: "#0B0B0B",
    fontSize: 16,
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
  onStartExercise
}) {
  const [expandedSets, setExpandedSets] = useState(false);
  const [currentSetData, setCurrentSetData] = useState({});
  const [previousSetData, setPreviousSetData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const targetSets = exerciseSession?.target_sets || exercise.sets || 3;
  const completedSets = sets.filter(s => s.is_completed).length;

  // Load previous workout data when exercise is expanded
  useEffect(() => {
    if (expandedSets && !previousSetData && userId) {
      loadPreviousWorkoutData();
    }
  }, [expandedSets]);

  const loadPreviousWorkoutData = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await WorkoutSessionServiceV2.getExerciseHistory(userId, exercise.exercise_name, 1);
      
      if (history && history.length > 0) {
        // Get the most recent workout data
        const lastWorkout = history[0];
        setPreviousSetData({
          reps: lastWorkout.actual_reps,
          weight: lastWorkout.weight_kg
        });
        
        // Pre-fill all sets with previous data
        const prefilledData = {};
        for (let i = 1; i <= targetSets; i++) {
          prefilledData[`${i}_reps`] = lastWorkout.actual_reps?.toString() || '';
          prefilledData[`${i}_weight`] = lastWorkout.weight_kg?.toString() || '';
        }
        setCurrentSetData(prefilledData);
      } else {
        // No previous data, use target reps from template
        const targetRepsStr = exercise.reps || '10';
        const targetReps = targetRepsStr.includes('-') 
          ? targetRepsStr.split('-')[0] 
          : targetRepsStr;
        
        const prefilledData = {};
        for (let i = 1; i <= targetSets; i++) {
          prefilledData[`${i}_reps`] = targetReps;
          prefilledData[`${i}_weight`] = '';
        }
        setCurrentSetData(prefilledData);
      }
    } catch (error) {
      console.error('Error loading previous workout data:', error);
      // Still pre-fill with target reps on error
      const targetRepsStr = exercise.reps || '10';
      const targetReps = targetRepsStr.includes('-') 
        ? targetRepsStr.split('-')[0] 
        : targetRepsStr;
      
      const prefilledData = {};
      for (let i = 1; i <= targetSets; i++) {
        prefilledData[`${i}_reps`] = targetReps;
        prefilledData[`${i}_weight`] = '';
      }
      setCurrentSetData(prefilledData);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSetInput = (setNumber, field, value) => {
    setCurrentSetData(prev => ({
      ...prev,
      [`${setNumber}_${field}`]: value
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
      setCurrentSetData(prev => ({
        ...prev,
        [`${nextSetNumber}_reps`]: currentSetData[`${setNumber}_reps`],
        [`${nextSetNumber}_weight`]: currentSetData[`${setNumber}_weight`],
      }));
    }
  };

  const handleUndoSet = async (setNumber) => {
    try {
      // Call service to mark set as not completed
      await WorkoutSessionServiceV2.undoSet(session.id, exerciseIndex, setNumber);
      
      // Refresh session data
      const updatedSession = await WorkoutSessionServiceV2.getSession(session.id);
      // Update parent component's session state
      if (onSessionUpdate) {
        onSessionUpdate(updatedSession);
      }
    } catch (error) {
      console.error("Error undoing set:", error);
      Alert.alert("Error", "Failed to undo set");
    }
  };

  return (
    <View style={[
      exerciseCardStyles.card,
      isActive && exerciseCardStyles.cardActive,
      isCompleted && exerciseCardStyles.cardCompleted
    ]}>
      <Pressable onPress={onExercisePress}>
        <View style={exerciseCardStyles.header}>
          <View style={exerciseCardStyles.headerLeft}>
            <View style={[
              exerciseCardStyles.indexBadge,
              isCompleted && exerciseCardStyles.indexBadgeCompleted
            ]}>
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#0B0B0B" />
              ) : (
                <Text style={exerciseCardStyles.indexText}>{exerciseIndex + 1}</Text>
              )}
            </View>
            <View style={exerciseCardStyles.headerInfo}>
              <Text style={exerciseCardStyles.exerciseName}>{exercise.exercise_name}</Text>
              <Text style={exerciseCardStyles.exerciseTarget}>
                {exercise.sets} × {exercise.reps} reps
                {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rest`}
              </Text>
            </View>
          </View>
          <Ionicons name="information-circle-outline" size={20} color="#71717A" />
        </View>
      </Pressable>

      {!isCompleted && (
        <Pressable 
          style={exerciseCardStyles.expandButton}
          onPress={() => {
            if (!expandedSets && !isActive) {
              onStartExercise();
            }
            setExpandedSets(!expandedSets);
          }}
        >
          <View style={exerciseCardStyles.progressBar}>
            <View style={[
              exerciseCardStyles.progressFill, 
              { width: `${(completedSets / targetSets) * 100}%` }
            ]} />
          </View>
          <Text style={exerciseCardStyles.progressText}>
            {completedSets}/{targetSets} sets
          </Text>
          <Ionicons 
            name={expandedSets ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#A3E635" 
          />
        </Pressable>
      )}

      {expandedSets && !isCompleted && (
        <View style={exerciseCardStyles.setsContainer}>
          {/* Previous Workout Indicator */}
          {previousSetData && (
            <View style={exerciseCardStyles.previousDataBanner}>
              <Ionicons name="trending-up" size={14} color="#3B82F6" />
              <Text style={exerciseCardStyles.previousDataText}>
                Last workout: {previousSetData.reps} reps × {previousSetData.weight}kg
              </Text>
            </View>
          )}

          {isLoadingHistory && (
            <View style={exerciseCardStyles.loadingHistory}>
              <Text style={exerciseCardStyles.loadingHistoryText}>Loading previous data...</Text>
            </View>
          )}

          {Array.from({ length: targetSets }).map((_, setIndex) => {
            const setNumber = setIndex + 1;
            const existingSet = sets.find(s => s.set_number === setNumber);
            const isSetCompleted = existingSet?.is_completed;

            return (
              <View key={setIndex} style={exerciseCardStyles.setRow}>
                <Text style={exerciseCardStyles.setLabel}>Set {setNumber}</Text>
                
                {isSetCompleted ? (
                  <View style={exerciseCardStyles.setCompleted}>
                    <Text style={exerciseCardStyles.setCompletedText}>
                      {existingSet.actual_reps} reps × {existingSet.weight_kg}kg
                    </Text>
                    <TouchableOpacity 
                      style={exerciseCardStyles.editSetButton}
                      onPress={() => {
                        // Allow editing - populate the inputs with existing data
                        setCurrentSetData(prev => ({
                          ...prev,
                          [`${setNumber}_reps`]: existingSet.actual_reps?.toString() || '',
                          [`${setNumber}_weight`]: existingSet.weight_kg?.toString() || '',
                        }));
                        // Mark as not completed to show inputs
                        handleUndoSet(setNumber);
                      }}
                    >
                      <Ionicons name="pencil" size={16} color="#A3E635" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={exerciseCardStyles.setInputs}>
                      <View style={exerciseCardStyles.inputWrapper}>
                        <View style={exerciseCardStyles.inputWithButtons}>
                          <TouchableOpacity
                            style={exerciseCardStyles.incrementButton}
                            onPress={() => {
                              const currentValue = parseInt(currentSetData[`${setNumber}_reps`]) || 0;
                              handleSetInput(setNumber, 'reps', (currentValue - 1).toString());
                            }}
                          >
                            <Ionicons name="remove" size={16} color="#A3E635" />
                          </TouchableOpacity>
                          <TextInput
                            style={exerciseCardStyles.setInput}
                            placeholder="0"
                            placeholderTextColor="#52525B"
                            keyboardType="numeric"
                            value={currentSetData[`${setNumber}_reps`] || ''}
                            onChangeText={(value) => handleSetInput(setNumber, 'reps', value)}
                          />
                          <TouchableOpacity
                            style={exerciseCardStyles.incrementButton}
                            onPress={() => {
                              const currentValue = parseInt(currentSetData[`${setNumber}_reps`]) || 0;
                              handleSetInput(setNumber, 'reps', (currentValue + 1).toString());
                            }}
                          >
                            <Ionicons name="add" size={16} color="#A3E635" />
                          </TouchableOpacity>
                        </View>
                        <Text style={exerciseCardStyles.inputLabel}>reps</Text>
                      </View>
                      <View style={exerciseCardStyles.inputWrapper}>
                        <TextInput
                          style={exerciseCardStyles.setInput}
                          placeholder="Weight"
                          placeholderTextColor="#52525B"
                          keyboardType="decimal-pad"
                          value={currentSetData[`${setNumber}_weight`] || ''}
                          onChangeText={(value) => handleSetInput(setNumber, 'weight', value)}
                        />
                        <Text style={exerciseCardStyles.inputLabel}>kg</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={exerciseCardStyles.completeSetButton}
                      onPress={() => handleCompleteSet(setNumber)}
                    >
                      <Ionicons name="checkmark" size={20} color="#0B0B0B" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}

      {isCompleted && (
        <View style={exerciseCardStyles.completedBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#A3E635" />
          <Text style={exerciseCardStyles.completedText}>
            Exercise completed • {completedSets} sets
          </Text>
        </View>
      )}
    </View>
  );
}

const exerciseCardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  cardActive: {
    borderColor: "#A3E635",
    borderLeftWidth: 4,
  },
  cardCompleted: {
    borderColor: "rgba(163, 230, 53, 0.3)",
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadgeCompleted: {
    backgroundColor: "#A3E635",
  },
  indexText: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  exerciseName: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  exerciseTarget: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#27272A",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#A3E635",
    borderRadius: 3,
  },
  progressText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },
  setsContainer: {
    marginTop: 12,
    gap: 8,
  },
  previousDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  previousDataText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingHistory: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  loadingHistoryText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontStyle: 'italic',
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0B0B0B",
    borderRadius: 12,
    padding: 12,
  },
  setLabel: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "700",
    width: 50,
  },
  setInputs: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  inputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  incrementButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  setInput: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#27272A",
    textAlign: 'center',
  },
  inputLabel: {
    position: 'absolute',
    right: 12,
    top: 10,
    color: '#52525B',
    fontSize: 11,
    fontWeight: '600',
  },
  completeSetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#A3E635",
    alignItems: "center",
    justifyContent: "center",
  },
  setCompleted: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  setCompletedText: {
    color: "#71717A",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  editSetButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
  },
  completedText: {
    color: "#A3E635",
    fontSize: 14,
    fontWeight: "600",
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

          <ScrollView style={modalStyles.content} showsVerticalScrollIndicator={false}>
            {exercise.description && (
              <View style={modalStyles.section}>
                <Text style={modalStyles.sectionTitle}>Description</Text>
                <Text style={modalStyles.sectionText}>{exercise.description}</Text>
              </View>
            )}

            {exercise.tips && Array.isArray(exercise.tips) && exercise.tips.length > 0 && (
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

            {exercise.muscle_groups && Array.isArray(exercise.muscle_groups) && exercise.muscle_groups.length > 0 && (
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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  title: {
    color: "#FAFAFA",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  muscleBadge: {
    backgroundColor: "rgba(163, 230, 53, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.3)",
  },
  muscleText: {
    color: "#A3E635",
    fontSize: 12,
    fontWeight: "700",
  },
});
