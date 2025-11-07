import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import moment from "moment";

import CalendarStrip from "./dailyprogresscard/CalendarStrip";
import TotalProgressBar from "./dailyprogresscard/TotalProgressBar";
import ProgressCirclesGroup from "./dailyprogresscard/ProgressCirclesGroup";
import { TrainingProgressService } from "../../services/TrainingProgressService";
import { MealPlanDataService } from "../../services/MealPlanDataService";
import { supabase } from "../../services/supabase";
import { DailyProgressCardSkeleton } from "../skeletons/DailyProgressCardSkeleton";
import HealthKitService from "../../services/HealthKitService";

export default function DailyProgressCard() {
  // User state
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stepsTrackingEnabled, setStepsTrackingEnabled] = useState(true);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(moment());
  const [isGoalCompleted, setIsGoalCompleted] = useState(false);
  
  // Progress data
  const [totalProgress, setTotalProgress] = useState(0);
  const [workoutData, setWorkoutData] = useState({ value: 0, max: 1 });
  const [stepsData, setStepsData] = useState({ value: 0, max: 10000 });
  const [calorieData, setCalorieData] = useState({ value: 0, max: 500 });
  const [streakData, setStreakData] = useState({
    current: 0,
    goal: 7,
    lastWorkout: "No workouts yet",
    bestStreak: 0,
  });

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  // Check steps tracking status
  useEffect(() => {
    checkStepsTracking();
  }, []);

  const checkStepsTracking = async () => {
    try {
      const hasPermission = await HealthKitService.checkPermission();
      setStepsTrackingEnabled(hasPermission);
    } catch (error) {
      console.error('Error checking steps tracking:', error);
      setStepsTrackingEnabled(false);
    }
  };

  // Load progress data when user changes or date changes
  useEffect(() => {
    if (userId) {
      loadProgressData();
    }
  }, [userId, selectedDate]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      const dateToFetch = selectedDate.toDate();
      
      // Fetch workout/steps progress from training service
      const progressData = await TrainingProgressService.getTodayProgress(userId, dateToFetch);
      
      // Fetch calorie data from meal plan service (same as mealplan page)
      const macroProgress = await MealPlanDataService.fetchMacroProgress(userId, dateToFetch);
      
      setWorkoutData(progressData.workoutData);
      setStepsData(progressData.stepsData);
      
      // Use calorie data from meal plan service
      setCalorieData({
        value: macroProgress.calories?.current || 0,
        max: macroProgress.calories?.target || 2200,
      });
      
      // Calculate total progress based on steps tracking status
      const workoutPercent = (progressData.workoutData.value / progressData.workoutData.max) * 100;
      const stepsPercent = (progressData.stepsData.value / progressData.stepsData.max) * 100;
      const caloriePercent = (macroProgress.calories.current / macroProgress.calories.target) * 100;
      
      let calculatedProgress;
      if (stepsTrackingEnabled) {
        // Average of all three: workouts, steps, and calories
        calculatedProgress = (workoutPercent + stepsPercent + caloriePercent) / 3;
      } else {
        // Average of workouts and calories only (steps excluded)
        calculatedProgress = (workoutPercent + caloriePercent) / 2;
      }
      
      setTotalProgress(Math.round(calculatedProgress));
      
      // Fetch streak data from user stats
      await loadStreakData();
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStreakData = async () => {
    try {
      // Fetch user stats for streak information
      const { data, error } = await supabase
        .from('user_stats')
        .select('current_streak, longest_streak, last_workout_date')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Ignore "not found" error
          throw error;
        }
        return; // No stats yet, keep defaults
      }

      if (data) {
        setStreakData({
          current: data.current_streak || 0,
          goal: 7,
          lastWorkout: data.last_workout_date 
            ? moment(data.last_workout_date).fromNow()
            : "No workouts yet",
          bestStreak: data.longest_streak || 0,
        });
      }
    } catch (error) {
      console.error("Error loading streak data:", error);
    }
  };

  // Use streak data
  const currentStreak = streakData.current;
  const streakGoal = streakData.goal;

  // Check if today's goals are completed
  useEffect(() => {
    const workoutComplete = workoutData?.value >= workoutData?.max;
    const stepsComplete = stepsData?.value >= stepsData?.max;
    const caloriesComplete = calorieData?.value >= calorieData?.max;
    setIsGoalCompleted(workoutComplete && stepsComplete && caloriesComplete);
  }, [workoutData, stepsData, calorieData]);

  // Show loading state
  if (isLoading) {
    return <DailyProgressCardSkeleton />;
  }

  return (
    <View style={[styles.card, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]}>
      {/* Enhanced Header with Streak */}
      <View style={styles.headerSection}>
        <View style={styles.dateSection}>
          <Text style={styles.todayLabel}>Today</Text>
          <Text style={styles.dateText}>{moment().format("MMM D, YYYY")}</Text>
        </View>
        
        <View style={styles.streakSection}>
          <View
            style={[styles.streakBadge, {
              backgroundColor: currentStreak >= 3 ? "#FF6B35" : "#666",
            }]}
          >
            <Ionicons 
              name="flame" 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.streakNumber}>{currentStreak}</Text>
          </View>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Motivational Message */}
      <View style={styles.motivationSection}>
        {isGoalCompleted && (
          <View style={styles.motivationCompleted}>
            <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
            <Text style={styles.motivationText}>Amazing! All goals completed! 🎉</Text>
          </View>
        )}
      </View>

      <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      <TotalProgressBar totalProgress={totalProgress} currentStreak={currentStreak} />

      <ProgressCirclesGroup
        workoutData={workoutData}
        stepsData={stepsData}
        calorieData={calorieData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateSection: {
    flex: 1,
  },
  todayLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 2,
  },
  streakSection: {
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  streakNumber: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  streakLabel: {
    fontSize: 10,
    color: "#ccc",
    marginTop: 4,
    fontWeight: "500",
  },
  motivationCompleted: {
    flexDirection: "row",
    alignItems: "center",
  },
  motivationText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    opacity: 0.9,
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
    fontWeight: '500',
  },
});
