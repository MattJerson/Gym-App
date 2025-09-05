import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";

export default function ProgressCircle({ label, data, icon, colors, unit }) {
  const progress = data.value / data.max;
  const isCompleted = progress >= 1;
  const mainColor = colors[0];

  return (
    <Pressable style={styles.progressCircleWrapper}>
      <View style={styles.circleContainer}>
        {/* Background circle with gradient border effect */}
        <LinearGradient
          colors={isCompleted ? ["#00D4AA", "#00B894"] : [mainColor + "40", mainColor + "20"]}
          style={styles.circleBackground}
        >
          <Progress.Circle
            size={90}
            progress={progress}
            color={isCompleted ? "#00D4AA" : mainColor}
            unfilledColor="rgba(255,255,255,0.1)"
            borderWidth={0}
            thickness={6}
            strokeCap="round"
            animated={true}
            animationConfig={{ bounciness: 0 }}
          />
        </LinearGradient>

        <View style={styles.progressValueContainer}>
          <View style={[
            styles.iconContainer,
            isCompleted && styles.iconContainerCompleted
          ]}>
            {icon()}
          </View>
          <Text style={[
            styles.progressValueText,
            isCompleted && styles.progressValueTextCompleted
          ]}>
            {data.value}
          </Text>
          <Text style={styles.progressValueSubText}>
            {unit === "Done" ? (isCompleted ? "✓" : `/${data.max}`) : `/${data.max}`}
          </Text>
        </View>
        
        {/* Completion badge */}
        {isCompleted && (
          <View style={styles.completionBadge}>
            <Text style={styles.completionBadgeText}>✓</Text>
          </View>
        )}
      </View>
      
      <Text style={[
        styles.progressLabel,
        isCompleted && styles.progressLabelCompleted
      ]}>
        {label}
      </Text>
    </Pressable>
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
    marginBottom: 8,
  },
  circleBackground: {
    borderRadius: 50,
    padding: 5,
  },
  progressValueContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 2,
    opacity: 0.9,
  },
  iconContainerCompleted: {
    opacity: 1,
  },
  progressValueText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
  },
  progressValueTextCompleted: {
    color: "#00D4AA",
  },
  progressValueSubText: {
    fontSize: 9,
    color: "#ccc",
    marginTop: 1,
    fontWeight: "500",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#ccc",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  progressLabelCompleted: {
    color: "#00D4AA",
  },
  completionBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#00D4AA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1a1a1a",
  },
  completionBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
});
