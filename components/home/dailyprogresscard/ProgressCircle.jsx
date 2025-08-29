import { View, Text, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";

export default function ProgressCircle({ label, data, icon, colors, unit }) {
  const progress = data.value / data.max;
  const mainColor = colors[0];

  return (
    <View style={styles.progressCircleWrapper}>
      <View style={styles.circleContainer}>
        <Progress.Circle
          size={100}
          progress={progress}
          color={mainColor}
          unfilledColor={`${mainColor}40`}
          borderWidth={0}
          thickness={7.5}
          strokeCap="round"
        />

        <View style={styles.progressValueContainer}>
          {icon()}
          <Text style={styles.progressValueText}>{data.value}</Text>
          <Text style={styles.progressValueSubText}>
            / {data.max} {unit}
          </Text>
        </View>
      </View>
      <Text style={styles.progressLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCircleWrapper: {
    alignItems: "center",
    width: 100,
  },
  circleContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  progressValueContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  progressValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },
  progressValueSubText: {
    fontSize: 8,
    color: "#ccc",
    marginTop: 2,
  },
  progressLabel: {
    marginVertical: 12,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#fff",
  },
});
