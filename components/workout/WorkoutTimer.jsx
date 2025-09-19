import { View, Text, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function WorkoutTimer({ startTime, isPaused, estimatedDuration }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime || isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatEstimatedTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const getProgressPercentage = () => {
    if (!estimatedDuration) return 0;
    const estimatedSeconds = estimatedDuration * 60;
    return Math.min((elapsedTime / estimatedSeconds) * 100, 100);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(116, 185, 255, 0.1)", "rgba(9, 132, 227, 0.1)"]}
        style={styles.timerCard}
      >
        <View style={styles.timerContent}>
          <View style={styles.timerRow}>
            <View style={styles.timerSection}>
              <Ionicons name="time-outline" size={20} color="#74b9ff" />
              <Text style={styles.timerLabel}>Elapsed</Text>
              <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
            </View>
            
            {estimatedDuration && (
              <View style={styles.timerSection}>
                <Ionicons name="flag-outline" size={20} color="#00D4AA" />
                <Text style={styles.timerLabel}>Target</Text>
                <Text style={styles.timerValue}>{formatEstimatedTime(estimatedDuration)}</Text>
              </View>
            )}
          </View>

          {estimatedDuration && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={["#74b9ff", "#0984e3"]}
                  style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(getProgressPercentage())}% of target time
              </Text>
            </View>
          )}

          {isPaused && (
            <View style={styles.pausedIndicator}>
              <Ionicons name="pause" size={16} color="#FFA726" />
              <Text style={styles.pausedText}>Workout Paused</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  timerCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(116, 185, 255, 0.2)",
  },
  timerContent: {
    gap: 12,
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  timerSection: {
    alignItems: "center",
    gap: 4,
  },
  timerLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  timerValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    textAlign: "center",
  },
  pausedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 167, 38, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pausedText: {
    color: "#FFA726",
    fontSize: 12,
    fontWeight: "600",
  },
});
