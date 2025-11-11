import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

export default function TodaysWorkoutCard({
  workoutName = "Heavy Compound Day",
  workoutType = "Strength",
  totalExercises = 7,
  estimatedDuration = 45,
  difficulty = "Intermediate",
  categoryColor = "#5082B4",
  categoryIcon = "dumbbell",
  targetMuscles = [],
  calories = 0,
  onContinue = () => {},
}) {
  // Get current day dynamically based on user's local timezone
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    return days[today.getDay()];
  };

  const scheduledDay = getCurrentDay();

  // Difficulty badge colors
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "Beginner": return "#10B981";
      case "Intermediate": return "#F59E0B";
      case "Advanced": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const difficultyColor = getDifficultyColor(difficulty);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Today's Workout</Text>
        <View style={styles.todayBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.todayText}>SCHEDULED</Text>
        </View>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]} 
        onPress={onContinue}
      >
        <LinearGradient
          colors={[`${categoryColor}50`, `${categoryColor}28`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          
          {/* Main content */}
          <View style={styles.content}>
            {/* Left side - Start button */}
            <View style={styles.leftSection}>
              <Pressable 
                style={[styles.startButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
                onPress={onContinue}
              >
                <Ionicons name="play" size={28} color="rgba(255, 255, 255, 0.95)" />
              </Pressable>
            </View>

            {/* Right side - Workout info */}
            <View style={styles.rightSection}>
              {/* Scheduled day and badges */}
              <View style={styles.topInfo}>
                <Text style={styles.scheduledDay}>{scheduledDay}</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.typeBadge, { 
                    backgroundColor: `${categoryColor}12`,
                    borderColor: `${categoryColor}25`,
                  }]}>
                    <Text style={[styles.typeText, { color: categoryColor }]}>
                      {workoutType.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.difficultyBadge, { 
                    backgroundColor: `${difficultyColor}20`, 
                    borderColor: difficultyColor 
                  }]}>
                    <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
                    <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                      {difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Workout name */}
              <Text style={styles.workoutName} numberOfLines={2}>
                {workoutName}
              </Text>

              {/* Metrics */}
              <View style={[styles.metricsRow, {
                backgroundColor: `${categoryColor}08`,
                borderColor: `${categoryColor}15`,
              }]}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNum, { color: categoryColor }]}>
                    {totalExercises}
                  </Text>
                  <Text style={styles.metricLabel}>ex</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: `${categoryColor}25` }]} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNum, { color: categoryColor }]}>
                    {estimatedDuration}
                  </Text>
                  <Text style={styles.metricLabel}>min</Text>
                </View>
                {calories > 0 && (
                  <>
                    <View style={[styles.metricDivider, { backgroundColor: `${categoryColor}25` }]} />
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricNum, { color: categoryColor }]}>
                        {calories}
                      </Text>
                      <Text style={styles.metricLabel}>cal</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Target muscles */}
              {targetMuscles && targetMuscles.length > 0 && (
                <View style={styles.musclesRow}>
                  <Ionicons name="body-outline" size={11} color="rgba(255, 255, 255, 0.65)" />
                  <Text style={styles.musclesText} numberOfLines={1}>
                    {targetMuscles.slice(0, 3).join(', ')}
                    {targetMuscles.length > 3 && ` +${targetMuscles.length - 3}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
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
    marginBottom: 12,
  },
  header: { 
    color: "#FAFAFA", 
    fontSize: 15, 
    fontWeight: "700", 
    letterSpacing: 0.3,
  },
  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  todayText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.95)",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  cardInner: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    padding: 18,
    paddingTop: 22,
    gap: 18,
    minHeight: 150,
  },
  leftSection: {
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  rightSection: {
    flex: 1,
    justifyContent: "space-between",
  },
  topInfo: {
    marginBottom: 8,
  },
  scheduledDay: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  typeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: 'rgba(255, 255, 255, 0.95)',
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.95)",
    letterSpacing: 0.2,
    lineHeight: 23,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  metricNum: {
    fontWeight: "800",
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 10,
    fontWeight: "500",
  },
  metricDivider: {
    width: 1,
    height: 14,
  },
  musclesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  musclesText: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 0.2,
    flex: 1,
  },
});