import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CircularProgress } from "react-native-circular-progress";

export default function CalorieGoalCard({ macroGoals }) {
  if (!macroGoals) return null;

  const caloriePercentage = (macroGoals.calories.current / macroGoals.calories.goal) * 100;
  const remaining = Math.max(0, macroGoals.calories.goal - macroGoals.calories.current);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Daily Calorie Goal</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.circularProgress}>
          <CircularProgress
            size={140}
            width={12}
            fill={Math.min(caloriePercentage, 100)}
            tintColor={caloriePercentage >= 100 ? "#00D4AA" : "#5B86E5"}
            backgroundColor="rgba(255, 255, 255, 0.1)"
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.progressCenter}>
                <Text style={styles.calorieValue}>
                  {macroGoals.calories.current}
                </Text>
                <Text style={styles.calorieLabel}>/ {macroGoals.calories.goal}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
            )}
          </CircularProgress>
        </View>

        <View style={styles.macroBreakdown}>
          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: "#FF6B35" }]} />
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {macroGoals.protein.current}g / {macroGoals.protein.goal}g
            </Text>
          </View>

          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: "#FFA500" }]} />
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {macroGoals.carbs.current}g / {macroGoals.carbs.goal}g
            </Text>
          </View>

          <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: "#00D4AA" }]} />
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroValue}>
              {macroGoals.fats.current}g / {macroGoals.fats.goal}g
            </Text>
          </View>
        </View>
      </View>

      {remaining > 0 && (
        <View style={styles.remainingBanner}>
          <Text style={styles.remainingText}>
            {remaining} kcal remaining for today
          </Text>
        </View>
      )}
      {caloriePercentage >= 100 && (
        <View style={[styles.remainingBanner, { backgroundColor: 'rgba(0, 212, 170, 0.15)' }]}>
          <Text style={[styles.remainingText, { color: '#00D4AA' }]}>
            ✓ Daily goal achieved!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  circularProgress: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressCenter: {
    alignItems: "center",
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginTop: -2,
  },
  calorieUnit: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    marginTop: 2,
  },
  macroBreakdown: {
    flex: 1,
    gap: 12,
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "600",
    width: 55,
  },
  macroValue: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
    flex: 1,
  },
  remainingBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(91, 134, 229, 0.15)",
    alignItems: "center",
  },
  remainingText: {
    fontSize: 13,
    color: "#5B86E5",
    fontWeight: "700",
  },
});
