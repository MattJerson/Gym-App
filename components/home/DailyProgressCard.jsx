import { View, StyleSheet } from "react-native";
import { useState } from "react";
import moment from "moment";

import CalendarStrip from "./dailyprogresscard/CalendarStrip";
import TotalProgressBar from "./dailyprogresscard/TotalProgressBar";
import ProgressCirclesGroup from "./dailyprogresscard/ProgressCirclesGroup";

export default function DailyProgressCard({
  totalProgress = 60,
  workoutData,
  stepsData,
  calorieData,
}) {
  // Calendar state (changes only once/day or when user clicks a date)
  const [selectedDate, setSelectedDate] = useState(moment());

  return (
    <View style={styles.card}>
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
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 16,
  },
});
