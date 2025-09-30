import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import moment from "moment";

import CalendarStrip from "./dailyprogresscard/CalendarStrip";
import TotalProgressBar from "./dailyprogresscard/TotalProgressBar";
import ProgressCirclesGroup from "./dailyprogresscard/ProgressCirclesGroup";

export default function DailyProgressCard({
  totalProgress = 60,
  workoutData,
  stepsData,
  calorieData,
  streakData = {
    current: 5,
    goal: 7,
    lastWorkout: "Yesterday",
    bestStreak: 12,
  },
}) {
  // Calendar state (changes only once/day or when user clicks a date)
  const [selectedDate, setSelectedDate] = useState(moment());
  const [isGoalCompleted, setIsGoalCompleted] = useState(false);

  // Use passed streak data or defaults
  const currentStreak = streakData.current;
  const streakGoal = streakData.goal;

  // Check if today's goals are completed
  useEffect(() => {
    const workoutComplete = workoutData?.value >= workoutData?.max;
    const stepsComplete = stepsData?.value >= stepsData?.max;
    const caloriesComplete = calorieData?.value >= calorieData?.max;
    setIsGoalCompleted(workoutComplete && stepsComplete && caloriesComplete);
  }, [workoutData, stepsData, calorieData]);

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

      <TotalProgressBar totalProgress={totalProgress} />

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
});
