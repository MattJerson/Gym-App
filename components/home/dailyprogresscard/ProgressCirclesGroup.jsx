import { View, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import ProgressCircle from "./ProgressCircle";

export default function ProgressCirclesGroup({
  workoutData,
  stepsData,
  calorieData,
}) {
  const progressItems = [
    {
      label: "Workout",
      colors: ["#FF3B30", "#FF6B6B"],
      data: workoutData,
      icon: () => <Ionicons name="barbell" size={28} color="#fff" />,
      unit: "Done",
    },
    {
      label: "Steps",
      colors: ["#34C759", "#00E676"],
      data: stepsData,
      icon: () => <FontAwesome5 name="walking" size={28} color="#fff" />,
      unit: "steps",
    },
    {
      label: "Cal",
      colors: ["#FF9500", "#FFCC00"],
      data: calorieData,
      icon: () => <Ionicons name="flame" size={28} color="#fff" />,
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
    justifyContent: "space-between",
  },
});
