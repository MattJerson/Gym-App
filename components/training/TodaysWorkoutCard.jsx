import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TodaysWorkoutCard_SteelGrind({
  workoutName = "Heavy Compound Day",
  workoutType = "Strength",
  totalExercises = 7,
  timeElapsed = 75,
  onContinue = () => {},
}) {
  // Calculate estimated calories (15 per exercise)
  const estimatedCalories = Math.round(totalExercises * 15);
  // Calculate estimated duration in minutes
  const estimatedDuration = Math.round(totalExercises * 10);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Workout</Text>
      <Pressable style={styles.card} onPress={onContinue}>
        <View style={styles.cardInner}>
          <View style={styles.contentWrapper}>
            <View style={styles.leftContent}>
              <View style={styles.topSection}>
                <View style={styles.typeBadge}>
                  <Text style={styles.type}>{workoutType.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {workoutName}
              </Text>

              <View style={styles.bottomSection}>
                <View style={styles.metrics}>
                  <View style={styles.metric}>
                    <Text style={styles.metricNum}>{estimatedCalories}</Text>
                    <Text style={styles.metricLabel}>kcal</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metric}>
                    <Text style={styles.metricNum}>{estimatedDuration}</Text>
                    <Text style={styles.metricLabel}>min</Text>
                  </View>
                </View>
                
                <Pressable 
                  style={styles.goBtn} 
                  onPress={onContinue}
                  android_ripple={{ color: 'rgba(163, 230, 53, 0.3)' }}
                >
                  <Ionicons name="play" size={18} color="#0B0B0B" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 18,
  },
  header: { 
    color: "#FAFAFA", 
    fontSize: 15, 
    fontWeight: "700", 
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardInner: {
    borderRadius: 16,
    borderWidth: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#A3E635", // Accent border on left
    borderColor: "rgba(163, 230, 53, 0.2)",
    overflow: "hidden",
    backgroundColor: "#161616", // Slightly lighter than #0B0B0B
  },
  contentWrapper: {
    flexDirection: "row",
    flex: 1,
    minHeight: 150,
  },
  leftContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  topSection: {
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: "rgba(163, 230, 53, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.25)",
    alignSelf: "flex-start",
  },
  type: { 
    color: "#A3E635", 
    fontSize: 10, 
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: { 
    color: "#FAFAFA", 
    fontSize: 20, 
    fontWeight: "800", 
    marginBottom: 12,
    lineHeight: 26,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metrics: { 
    flexDirection: "row", 
    alignItems: "center",
    backgroundColor: "rgba(163, 230, 53, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.15)",
  },
  metric: { 
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricNum: { 
    color: "#A3E635", 
    fontWeight: "800", 
    fontSize: 16,
  },
  metricLabel: { 
    color: "#A1A1AA", 
    fontSize: 11,
    fontWeight: "500",
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(163, 230, 53, 0.25)",
  },
  goBtn: {
    backgroundColor: "#A3E635",
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#A3E635",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});