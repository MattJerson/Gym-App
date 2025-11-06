import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function CalendarStatsCard({ monthlyStats, currentDate }) {
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return Math.round(num).toString();
  };

  const formatDuration = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.cardTitle}>
        {currentDate.toLocaleString("default", { month: "long" })} Analytics
      </Text>

      {/* First Row */}
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={20} color="#FF6B6B" />
          <Text style={styles.statNumber}>{monthlyStats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
          <Text style={styles.statSubtext}>Consecutive days</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <FontAwesome5 name="dumbbell" size={18} color="#4ECDC4" />
          <Text style={styles.statNumber}>{monthlyStats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
          <Text style={styles.statSubtext}>Sessions completed</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Ionicons name="calendar" size={20} color="#FFD93D" />
          <Text style={styles.statNumber}>{monthlyStats.daysActive}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
          <Text style={styles.statSubtext}>Days with workouts</Text>
        </View>
      </View>

      {/* Second Row */}
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Ionicons name="trending-up-outline" size={20} color="#BF5AF2" />
          <Text style={styles.statNumber}>{monthlyStats.completionRate}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statSubtext}>Month completion</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="trophy-outline" size={20} color="#FFD93D" />
          <Text style={styles.statNumber}>{formatNumber(monthlyStats.totalPoints)}</Text>
          <Text style={styles.statLabel}>Points</Text>
          <Text style={styles.statSubtext}>Total earned</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="repeat" size={20} color="#0A84FF" />
          <Text style={styles.statNumber}>{monthlyStats.workoutsPerWeek.toFixed(1)}x</Text>
          <Text style={styles.statLabel}>Frequency</Text>
          <Text style={styles.statSubtext}>Workouts per week</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginBottom: 4,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "800",
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    opacity: 0.9,
  },
  statSubtext: {
    fontSize: 9,
    color: "#999",
    fontWeight: "500",
    textAlign: "center",
    marginTop: -2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
