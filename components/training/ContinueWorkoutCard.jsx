import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ContinueWorkoutCard({ 
  workoutName = "Push Day",
  workoutType = "Custom Workout",
  completedExercises = 4,
  totalExercises = 6,
  progressPercentage = null, // Use database value if provided
  timeElapsed = 15,
  categoryColor = "#FCD34D",
  onContinue = () => {},
}) {
  // Use progressPercentage from database if provided, otherwise calculate from completed exercises
  const progressPercent = progressPercentage !== null && progressPercentage !== undefined
    ? progressPercentage
    : (totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Continue Workout</Text>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>IN PROGRESS</Text>
        </View>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]} 
        onPress={onContinue}
      >
        <View style={styles.cardInner}>
          {/* Color accent stripe */}
          <View style={[styles.colorAccent, { backgroundColor: categoryColor }]} />
          
          {/* Main content */}
          <View style={styles.content}>
            {/* Left side - Continue button */}
            <View style={styles.leftSection}>
              <Pressable 
                style={[styles.continueButton, { backgroundColor: categoryColor }]}
                onPress={onContinue}
              >
                <Ionicons name="play" size={24} color="#000" />
              </Pressable>
            </View>

            {/* Right side - Workout info */}
            <View style={styles.rightSection}>
              {/* Top badges */}
              <View style={styles.topInfo}>
                <View style={[styles.typeBadge, { 
                  backgroundColor: `${categoryColor}12`,
                  borderColor: `${categoryColor}25`,
                }]}>
                  <Text style={[styles.typeText, { color: categoryColor }]}>
                    {workoutType.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Workout name */}
              <Text style={styles.title} numberOfLines={2}>
                {workoutName}
              </Text>

              {/* Progress section */}
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    {completedExercises} of {totalExercises} exercises
                  </Text>
                  <Text style={[styles.progressPercent, { color: categoryColor }]}>
                    {progressPercent}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { 
                  backgroundColor: `${categoryColor}15`,
                  borderColor: `${categoryColor}25`,
                }]}>
                  <View style={[
                    styles.progressBarFill, 
                    { width: `${progressPercent}%`, backgroundColor: categoryColor }
                  ]} />
                </View>
              </View>

              {/* Bottom metrics */}
              <View style={styles.bottomInfo}>
                <View style={styles.metricItem}>
                  <Ionicons name="time-outline" size={14} color="#A1A1AA" />
                  <Text style={styles.metricText}>{timeElapsed} min elapsed</Text>
                </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: { 
    color: "#FAFAFA", 
    fontSize: 15, 
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(252, 211, 77, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(252, 211, 77, 0.25)",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FCD34D",
  },
  statusText: {
    color: "#FCD34D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardInner: {
    backgroundColor: "#161616",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272A",
    overflow: "hidden",
  },
  colorAccent: {
    height: 4,
    width: "100%",
  },
  content: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  leftSection: {
    justifyContent: "center",
  },
  continueButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  rightSection: {
    flex: 1,
    gap: 8,
  },
  topInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: { 
    color: "#FAFAFA", 
    fontSize: 18, 
    fontWeight: "800",
    lineHeight: 24,
  },
  progressSection: {
    gap: 6,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  bottomInfo: {
    flexDirection: "row",
    gap: 16,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },
});

