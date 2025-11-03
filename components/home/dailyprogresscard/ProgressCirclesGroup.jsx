import { View, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import ProgressCircle from "./ProgressCircle";
import { useState, useEffect } from "react";
import HealthKitService from "../../../services/HealthKitService";

export default function ProgressCirclesGroup({
  workoutData,
  stepsData,
  calorieData,
}) {
  const [stepsTrackingEnabled, setStepsTrackingEnabled] = useState(true);

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

  // Calculate progress based on steps tracking status
  const workoutProgress = workoutData.value / workoutData.max; // 0 to 1
  const stepsProgress = stepsData.value / stepsData.max; // 0 to 1
  
  // Combined: if steps enabled, 50% from workout + 50% from steps, otherwise 100% from workout
  let combinedValue;
  if (stepsTrackingEnabled) {
    combinedValue = (workoutProgress * 0.5 + stepsProgress * 0.5) * 100;
  } else {
    combinedValue = workoutProgress * 100;
  }
  
  const activityData = {
    value: Math.round(combinedValue),
    max: 100,
  };

  const progressItems = [
    {
      label: "Activity",
      colors: ["#34C759", "#00E676"],
      data: activityData,
      icon: (color) => <Ionicons name="fitness" size={28} color={color} />,
      unit: "%",
      subtitle: stepsTrackingEnabled 
        ? `${workoutData.value}/${workoutData.max} workout • ${Math.round(stepsData.value).toLocaleString()} steps`
        : `${workoutData.value}/${workoutData.max} workout`,
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