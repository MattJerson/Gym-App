import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import WorkoutProgressBar from "../../components/training/WorkoutProgressBar";
import ContinueWorkoutCard from "../../components/training/ContinueWorkoutCard";
import TodaysWorkoutCard from "../../components/training/TodaysWorkoutCard";
import BrowseWorkouts from "../../components/training/BrowseWorkouts";
import RecentWorkouts from "../../components/training/RecentWorkouts";
import NotificationBar from "../../components/NotificationBar";
import { TrainingDataService } from "../../services/TrainingDataService";
import { WorkoutSessionService } from "../../services/WorkoutSessionService";

const router = useRouter();

export default function Training() {
  // 🔄 Data-driven state management
  const [notifications, setNotifications] = useState(0);
  const [workoutProgress, setWorkoutProgress] = useState(null);
  const [continueWorkout, setContinueWorkout] = useState(null);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [browseWorkouts, setBrowseWorkouts] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [exerciseLibrary, setExerciseLibrary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Load data on component mount - Replace with actual user ID
  const userId = "user123";

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);
      
      // Load all training data in parallel
      const [
        notificationsData,
        progressData,
        continueData,
        todaysData,
        browseData,
        recentData,
        libraryData
      ] = await Promise.all([
        TrainingDataService.fetchUserNotifications(userId),
        TrainingDataService.fetchWorkoutProgress(userId),
        TrainingDataService.fetchContinueWorkout(userId),
        TrainingDataService.fetchTodaysWorkout(userId),
        TrainingDataService.fetchBrowseWorkouts(userId),
        TrainingDataService.fetchRecentWorkouts(userId),
        TrainingDataService.fetchExerciseLibrary(userId)
      ]);

      // Update state with fetched data
      setNotifications(notificationsData.count);
      setWorkoutProgress(progressData);
      setContinueWorkout(continueData);
      setTodaysWorkout(todaysData);
      setBrowseWorkouts(browseData);
      setRecentWorkouts(recentData);
      setExerciseLibrary(libraryData);
      
    } catch (error) {
      console.error("Error loading training data:", error);
      Alert.alert("Error", "Failed to load training data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWorkout = async () => {
    try {
      if (continueWorkout) {
        // Check if there's an existing session in progress
        const existingSession = await WorkoutSessionService.getCurrentSession();
        if (existingSession) {
          router.push(`/workout/${existingSession.workoutId}`);
        } else {
          const session = await TrainingDataService.updateWorkoutProgress(
            userId, 
            continueWorkout.id, 
            { progress: continueWorkout.progress }
          );
          console.log('Continue workout:', session);
          router.push(`/workout/${continueWorkout.id}`);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to continue workout. Please try again.");
    }
  };

  const handleStartTodaysWorkout = async () => {
    try {
      if (todaysWorkout) {
        // Use our workout session service to start the workout
        router.push(`/workout/${todaysWorkout.id}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to start workout. Please try again.");
    }
  };

  const handleSelectWorkout = async (workoutId) => {
    try {
      // Navigate to workout session page
      router.push(`/workout/${workoutId}`);
    } catch (error) {
      Alert.alert("Error", "Failed to start workout. Please try again.");
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Training</Text>
          <NotificationBar notifications={notifications} />
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading training data...</Text>
          </View>
        ) : (
          <>
            {/* Progress Card */}
            {workoutProgress && (
              <WorkoutProgressBar 
                workoutData={workoutProgress.workoutData}
                stepsData={workoutProgress.stepsData}
                caloriesData={workoutProgress.caloriesData}
              />
            )}

            {/* Continue Workout Card - Only show if there's an active workout */}
            {continueWorkout && (
              <ContinueWorkoutCard 
                workoutName={continueWorkout.workoutName}
                workoutType={continueWorkout.workoutType}
                completedExercises={continueWorkout.completedExercises}
                totalExercises={continueWorkout.totalExercises}
                timeElapsed={continueWorkout.timeElapsed}
                progress={continueWorkout.progress}
                onContinue={handleContinueWorkout}
              />
            )}

            {/* Today's Workout Card */}
            {todaysWorkout && (
              <TodaysWorkoutCard 
                workoutName={todaysWorkout.workoutName}
                workoutType={todaysWorkout.workoutType}
                totalExercises={todaysWorkout.totalExercises}
                timeElapsed={todaysWorkout.estimatedDuration}
                onContinue={handleStartTodaysWorkout}
              />
            )}

            {/* Browse Workouts */}
            <BrowseWorkouts 
              workouts={browseWorkouts}
              onSelectWorkout={handleSelectWorkout}
            />

            {/* Create Custom Workout Button */}
            <Pressable 
              style={styles.createWorkoutButton} 
              onPress={() => {
                console.log('Navigate to create custom workout');
                router.push('/training/create-workout');
              }}
            >
              <LinearGradient
                colors={["#1E3A5F", "#4A90E2"]}
                style={styles.createWorkoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.createWorkoutContent}>
                  <View style={styles.createWorkoutIcon}>
                    <Ionicons name="add-circle" size={28} color="#fff" />
                  </View>
                  <View style={styles.createWorkoutText}>
                    <Text style={styles.createWorkoutTitle}>Create Custom Workout</Text>
                    <Text style={styles.createWorkoutSubtitle}>Design your own training routine</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </View>
              </LinearGradient>
            </Pressable>

            {/* Exercise Library */}
            {exerciseLibrary && (
              <Pressable style={styles.card} onPress={() => {
                console.log('Navigate to exercise library');
                // router.push('/training/exercise-library');
              }}>
                <View style={styles.libraryHeader}>
                  <MaterialIcons name="library-books" size={32} color="#1E3A5F" />
                  <View style={styles.libraryInfo}>
                    <Text style={styles.cardTitle}>Exercise Library</Text>
                    <Text style={styles.cardText}>
                      {exerciseLibrary.totalExercises}+ exercises with video guides
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
              </Pressable>
            )}

            {/* Recent Workouts */}
            <RecentWorkouts workouts={recentWorkouts} />
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    // Adjusted top padding to match your original styles more closely
    paddingTop: 60, 
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backRow: {
    // Adjusted top position to align with paddingTop of scrollContent
    top: 60,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  cardTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  cardText: {
    fontSize: 14,
    color: "#ccc",
  },
  libraryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  libraryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  createWorkoutButton: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  createWorkoutGradient: {
    padding: 20,
  },
  createWorkoutContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  createWorkoutIcon: {
    marginRight: 16,
  },
  createWorkoutText: {
    flex: 1,
  },
  createWorkoutTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 2,
  },
  createWorkoutSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  // Note: Removed unused styles from the static list to keep the code clean
});

