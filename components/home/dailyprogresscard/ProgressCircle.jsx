import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";

export default function ProgressCircle({ label, data, icon, colors, unit, subtitle }) {
  const progress = data.value / data.max;
  const isCompleted = progress >= 1;
  const mainColor = colors[0];

  // Determine the dynamic color for the active elements (ring and icon)
  const activeColor = isCompleted ? "#00D4AA" : mainColor;
  // Use a neutral color for the icon when there is no progress
  const iconColor = progress > 0 ? activeColor : "#777";

  return (
    <Pressable style={styles.progressCircleWrapper}>
      <View style={styles.circleContainer}>
        {/* The gradient is now transparent, removing the background */}
        <LinearGradient
          colors={["transparent", "transparent"]}
          style={styles.circleBackground}
        >
          <Progress.Circle
            size={90}
            progress={progress}
            color={activeColor} // The ring uses the active color
            unfilledColor="rgba(255,255,255,0.1)" // Kept for a subtle track
            borderWidth={0}
            thickness={6}
            strokeCap="round"
            animated={true}
            animationConfig={{ bounciness: 0 }}
          />
        </LinearGradient>

        <View style={styles.progressValueContainer}>
          <View style={styles.iconContainer}>
            {/* Pass the dynamic color to the icon render prop */}
            {icon(iconColor)}
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
      {subtitle && (
        <Text style={styles.progressSubtitle}>
          {subtitle}
        </Text>
      )}
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
  progressSubtitle: {
    fontSize: 9,
    fontWeight: "500",
    color: "#888",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 12,
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
