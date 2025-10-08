import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function CalendarStatsCard({ monthlyStats, currentDate }) {
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.cardTitle}>
        {currentDate.toLocaleString("default", { month: "long" })} Progress
      </Text>
      
      <View style={styles.statRow}>
        <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}>
          <FontAwesome5 name="dumbbell" size={16} color="#fff" />
        </View>
        <View style={styles.statTextContainer}>
          <Text style={styles.statLabel}>Workouts</Text>
          <Text style={styles.statValue}>{monthlyStats.workouts}</Text>
        </View>
      </View>
      
      <View style={styles.statRow}>
        <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}>
          <Ionicons name="flame" size={16} color="#fff" />
        </View>
        <View style={styles.statTextContainer}>
          <Text style={styles.statLabel}>Best Streak</Text>
          <Text style={styles.statValue}>{monthlyStats.streak} days</Text>
        </View>
      </View>
      
      <View style={styles.statRow}>
        <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}>
          <MaterialIcons name="track-changes" size={16} color="#fff" />
        </View>
        <View style={styles.statTextContainer}>
          <Text style={styles.statLabel}>Monthly Goal</Text>
          <Text style={styles.statValue}>{monthlyStats.goalPercentage}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 15,
    fontWeight: "bold",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 15,
    color: "#ccc",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
});
