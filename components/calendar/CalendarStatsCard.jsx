import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function CalendarStatsCard({ monthlyStats, currentDate }) {
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.cardTitle}>
        {currentDate.toLocaleString("default", { month: "long" })} Progress
      </Text>

      {/* Simple Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={20} color="#FF6B6B" />
          <Text style={styles.statNumber}>{monthlyStats.streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <FontAwesome5 name="dumbbell" size={18} color="#4ECDC4" />
          <Text style={styles.statNumber}>{monthlyStats.workouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <MaterialIcons name="track-changes" size={22} color="#FFD93D" />
          <Text style={styles.statNumber}>{monthlyStats.goalPercentage}%</Text>
          <Text style={styles.statLabel}>Goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statNumber: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
