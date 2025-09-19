import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  StatusBar,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutSessionService } from "../../services/WorkoutSessionService";
import WorkoutTimer from "../../components/workout/WorkoutTimer";
import ExerciseDetailModal from "../../components/workout/ExerciseDetailModal";
import ExerciseCard from "../../components/workout/ExerciseCard";

export default function WorkoutSession() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  
  const [workout, setWorkout] = useState(null);
  const [session, setSession] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      console.log('Loading workout with ID:', workoutId); // Debug log
      
      // Check if there's an existing session
      const existingSession = await WorkoutSessionService.getCurrentSession();
      
      if (existingSession && existingSession.workoutId === workoutId) {
        // Resume existing session
        const workoutData = await WorkoutSessionService.getWorkoutById(workoutId);
        console.log('Resumed workout data:', workoutData); // Debug log
        if (!workoutData) {
          console.error('Failed to load workout data for existing session');
          Alert.alert("Error", "Workout not found");
          router.back();
          return;
        }
        setWorkout(workoutData);
        setSession(existingSession);
        setWorkoutStartTime(new Date(existingSession.startTime));
        setCurrentExerciseIndex(existingSession.currentExerciseIndex || 0);
      } else {
        // Start new session
        const workoutData = await WorkoutSessionService.getWorkoutById(workoutId);
        console.log('New workout data:', workoutData); // Debug log
        if (!workoutData) {
          console.error('Failed to load workout data:', workoutId);
          Alert.alert("Error", "Workout not found - ID: " + workoutId);
          router.back();
          return;
        }
        
        const newSession = await WorkoutSessionService.startWorkoutSession(workoutId);
        console.log('New session created:', newSession); // Debug log
        setWorkout(workoutData);
        setSession(newSession);
        setWorkoutStartTime(new Date());
      }
    } catch (error) {
      console.error("Error loading workout:", error);
      Alert.alert("Error", "Failed to load workout: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExercisePress = (exercise, index) => {
    setSelectedExercise({ ...exercise, index });
    setShowExerciseModal(true);
  };

  const handleSetComplete = async (exerciseIndex, setIndex, data) => {
    try {
      const updatedSession = await WorkoutSessionService.updateExerciseProgress(
        session.id,
        exerciseIndex,
        setIndex,
        data
      );
      setSession(updatedSession);

      // Show a brief success feedback
      console.log(`Set ${setIndex + 1} completed for exercise ${exerciseIndex + 1}`);
    } catch (error) {
      console.error("Error updating set:", error);
      Alert.alert("Error", "Failed to save progress");
    }
  };

  const handleWorkoutComplete = () => {
    Alert.alert(
      "Complete Workout?",
      "Are you sure you want to finish this workout? Your progress will be saved.",
      [
        { text: "Continue Workout", style: "cancel" },
        { 
          text: "Finish Workout", 
          style: "destructive",
          onPress: async () => {
            try {
              await WorkoutSessionService.completeWorkout(session.id);
              
              Alert.alert(
                "Workout Complete! 🎉",
                `Great job completing ${workout.name}! Your progress has been saved.`,
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (error) {
              console.error("Error completing workout:", error);
              Alert.alert("Error", "Failed to save workout completion");
            }
          }
        }
      ]
    );
  };

  const handlePauseResume = () => {
    setIsWorkoutPaused(!isWorkoutPaused);
  };

  const handleQuitWorkout = () => {
    Alert.alert(
      "Quit Workout?",
      "Your progress will be saved and you can resume later.",
      [
        { text: "Continue", style: "cancel" },
        { text: "Save & Quit", onPress: () => router.back() }
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!workout || !session) {
    return (
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load workout</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const completedExercises = session.exerciseProgress.filter(ex => ex.completed).length;
  const totalExercises = workout.exercises.length;
  const progressPercentage = (completedExercises / totalExercises) * 100;

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={handleQuitWorkout}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          <Text style={styles.workoutSubtitle}>
            {completedExercises}/{totalExercises} exercises • {Math.round(progressPercentage)}% complete
          </Text>
        </View>
        
        <Pressable style={styles.headerButton} onPress={handlePauseResume}>
          <Ionicons 
            name={isWorkoutPaused ? "play" : "pause"} 
            size={24} 
            color="#fff" 
          />
        </Pressable>
      </View>

      {/* Workout Timer */}
      <WorkoutTimer 
        startTime={workoutStartTime}
        isPaused={isWorkoutPaused}
        estimatedDuration={workout.estimatedDuration}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={["#74b9ff", "#0984e3"]}
            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>

      {/* Exercise List */}
      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {workout.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={index}
            session={session}
            onExercisePress={() => handleExercisePress(exercise, index)}
            onSetComplete={handleSetComplete}
            isActive={index === currentExerciseIndex}
          />
        ))}
        
        {/* Complete Workout Button */}
        {completedExercises === totalExercises && (
          <LinearGradient
            colors={["#00D4AA", "#00E676"]}
            style={styles.completeButton}
          >
            <Pressable 
              style={styles.completeButtonInner}
              onPress={handleWorkoutComplete}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.completeButtonText}>Complete Workout</Text>
            </Pressable>
          </LinearGradient>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          visible={showExerciseModal}
          exercise={selectedExercise}
          onClose={() => setShowExerciseModal(false)}
        />
      )}
    </LinearGradient>
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
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#74b9ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  workoutTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  workoutSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  completeButton: {
    marginTop: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  completeButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  bottomPadding: {
    height: 40,
  },
});
