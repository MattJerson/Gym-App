import {
  View,
  Text,
  Alert,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import MyWorkouts from "../../components/training/MyWorkouts";
import BrowseWorkouts from "../../components/training/BrowseWorkouts";
import RecentWorkouts from "../../components/training/RecentWorkouts";
import { TrainingDataService } from "../../services/TrainingDataService";
import TodaysWorkoutCard from "../../components/training/TodaysWorkoutCard";
import { WorkoutSessionService } from "../../services/WorkoutSessionService";
import WorkoutProgressBar from "../../components/training/WorkoutProgressBar";
import ContinueWorkoutCard from "../../components/training/ContinueWorkoutCard";
import { TrainingPageSkeleton } from "../../components/skeletons/TrainingPageSkeleton";

export default function Training() {
  const router = useRouter();

  // 🔄 Data-driven state management
  const [workoutProgress, setWorkoutProgress] = useState(null);
  const [continueWorkout, setContinueWorkout] = useState(null);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [workoutCategories, setWorkoutCategories] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState(0);

  // Get authenticated user
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
      Alert.alert("Error", "Failed to get user session");
    }
  };

  useEffect(() => {
    if (userId) {
      loadTrainingData();
    }
  }, [userId]);

  // Reload data when screen comes into focus (after saving workout)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadTrainingData();
      }
    }, [userId])
  );

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);

      // Fetch workout categories with template counts from Supabase
      // ONLY count admin/pre-made templates (is_custom = false OR created_by_user_id IS NULL)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("workout_categories")
        .select(`
          id,
          name,
          description,
          emoji,
          color,
          icon,
          image_url,
          is_active,
          display_order
        `)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching workout categories:", categoriesError);
        throw categoriesError;
      }

      // For each category, count only pre-made (non-custom) templates
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from("workout_templates")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("is_active", true)
            .or("is_custom.is.null,is_custom.eq.false"); // Only pre-made templates

          if (countError) {
            console.error(`Error counting templates for category ${category.id}:`, countError);
            return { ...category, workout_count: 0 };
          }

          return {
            ...category,
            workout_count: count || 0,
          };
        })
      );

      // Filter out categories with 0 templates
      const categoriesWithTemplates = categoriesWithCounts.filter(
        (category) => category.workout_count > 0
      );

      // Load other training data in parallel
      const [
        notificationsData,
        progressData,
        continueData,
        todaysData,
        recentData,
      ] = await Promise.all([
        TrainingDataService.fetchUserNotifications(userId),
        TrainingDataService.fetchWorkoutProgress(userId),
        TrainingDataService.fetchContinueWorkout(userId),
        TrainingDataService.fetchTodaysWorkout(userId),
        TrainingDataService.fetchRecentWorkouts(userId),
      ]);

      // Update state with fetched data
      setNotifications(notificationsData.count);
      setWorkoutProgress(progressData);
      setContinueWorkout(continueData);
      setTodaysWorkout(todaysData);
      setWorkoutCategories(categoriesWithTemplates);
      setRecentWorkouts(recentData);
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
        const existingSession = await WorkoutSessionService.getCurrentSession();
        if (existingSession) {
          router.push(`/workout/${existingSession.workoutId}`);
        } else {
          const session = await TrainingDataService.updateWorkoutProgress(
            userId,
            continueWorkout.id,
            { progress: continueWorkout.progress }
          );
          console.log("Continue workout:", session);
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
        router.push(`/workout/${todaysWorkout.id}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to start workout. Please try again.");
    }
  };

  const handleSelectCategory = async (categoryId) => {
    try {
      const category = workoutCategories.find((cat) => cat.id === categoryId);
      router.push({
        pathname: "/training/workout-category",
        params: {
          categoryId: categoryId,
          categoryName: category?.name || "Workouts",
          categoryColor: category?.color || "#A3E635",
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load category. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Loading State */}
        {isLoading ? (
          <TrainingPageSkeleton />
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

            {/* Continue Workout Card */}
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
                estimatedDuration={todaysWorkout.estimatedDuration}
                difficulty={todaysWorkout.difficulty}
                caloriesEstimate={todaysWorkout.caloriesEstimate}
                categoryColor={todaysWorkout.categoryColor || "#A3E635"}
                categoryIcon={todaysWorkout.categoryIcon || "dumbbell"}
                onContinue={handleStartTodaysWorkout}
              />
            )}

            {/* Browse Workout Categories */}
            <BrowseWorkouts
              categories={workoutCategories}
              onSelectCategory={handleSelectCategory}
            />

            {/* Create Custom Workout Button */}
            <Pressable
              style={styles.createWorkoutButton}
              onPress={() => {
                console.log("Navigate to create custom workout");
                router.push("/training/create-workout");
              }}
            >
              <View style={styles.createWorkoutContent}>
                <View style={styles.createWorkoutIcon}>
                  <Ionicons name="add-circle" size={28} color="#3B82F6" />
                </View>
                <View style={styles.createWorkoutText}>
                  <Text style={styles.createWorkoutTitle}>
                    Create Custom Workout
                  </Text>
                  <Text style={styles.createWorkoutSubtitle}>
                    Design your own training routine
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#71717A" />
              </View>
            </Pressable>

            {/* My Workouts Section */}
            <MyWorkouts
              onSelectWorkout={(workoutId) => {
                console.log("Selected workout:", workoutId);
                router.push(`/workout/${workoutId}`);
              }}
              onWorkoutOptions={(workoutId) => {
                console.log("Workout options:", workoutId);
                Alert.alert(
                  "Workout Options",
                  "Edit, Delete, or Share this workout"
                );
              }}
            />

            {/* Recent Workouts */}
            <RecentWorkouts workouts={recentWorkouts} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
    color: "#fff",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backRow: {
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
  createWorkoutButton: {
    borderWidth: 2,
    marginBottom: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    overflow: "hidden",
    backgroundColor: "#161616",
    borderLeftColor: "#3B82F6",
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  createWorkoutContent: {
    padding: 16,
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
    fontSize: 16,
    marginBottom: 2,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  createWorkoutSubtitle: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "500",
  },
});
