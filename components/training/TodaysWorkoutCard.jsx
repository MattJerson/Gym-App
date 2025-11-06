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
  categoryColor = "#A3E635",
  categoryIcon = "dumbbell",
  scheduledDay = "Tuesday",
  onContinue = () => {},
}) {
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
        <View style={styles.cardInner}>
          {/* Color accent stripe */}
          <View style={[styles.colorAccent, { backgroundColor: categoryColor }]} />
          
          {/* Main content */}
          <View style={styles.content}>
            {/* Left side - Start button */}
            <View style={styles.leftSection}>
              <Pressable 
                style={[styles.startButton, { backgroundColor: categoryColor }]}
                onPress={onContinue}
              >
                <Ionicons name="play" size={24} color="#000" />
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
    backgroundColor: "rgba(163, 230, 53, 0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.25)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A3E635",
  },
  todayText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#A3E635",
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  colorAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  content: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 20,
    gap: 16,
    minHeight: 140,
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
    elevation: 4,
    shadowColor: "#A3E635",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontWeight: "600",
    color: "#A1A1AA",
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  difficultyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  difficultyText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 23,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  metricNum: {
    fontWeight: "800",
    fontSize: 15,
  },
  metricLabel: {
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "500",
  },
  metricDivider: {
    width: 1,
    height: 14,
  },
});