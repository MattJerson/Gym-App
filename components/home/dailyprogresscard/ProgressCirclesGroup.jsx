import { View, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import ProgressCircle from "./ProgressCircle";

export default function ProgressCirclesGroup({
  workoutData,
  stepsData,
  calorieData,
}) {
  // Combine workout and steps into a single "Activity" metric
  // Calculate combined progress: if workout is done (1/1) that's 50%, steps contribute other 50%
  const workoutProgress = workoutData.value / workoutData.max; // 0 to 1
  const stepsProgress = stepsData.value / stepsData.max; // 0 to 1
  
  // Combined: 50% from workout completion, 50% from steps
  const combinedValue = (workoutProgress * 0.5 + stepsProgress * 0.5) * 100;
  const combinedMax = 100;
  
  const activityData = {
    value: Math.round(combinedValue),
    max: combinedMax,
  };

  const progressItems = [
    {
      label: "Activity",
      colors: ["#34C759", "#00E676"],
      data: activityData,
      icon: (color) => <Ionicons name="fitness" size={28} color={color} />,
      unit: "%",
      subtitle: `${workoutData.value}/${workoutData.max} workout • ${Math.round(stepsData.value).toLocaleString()} steps`,
    },
    {
      label: "Calories",
      colors: ["#FF9500", "#FFCC00"],
      data: calorieData,
      icon: (color) => <Ionicons name="flame" size={28} color={color} />,
      unit: "kcal",
    },
  ];

  return (
    <View style={styles.progressContainer}>
      {progressItems.map((item, idx) => (
        <ProgressCircle key={idx} {...item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 20,
  },
});