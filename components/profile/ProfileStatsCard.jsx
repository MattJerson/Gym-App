import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export default function ProfileStatsCard({ userStats }) {
  if (!userStats) return null;
  
  return (
    <View style={styles.primaryStatsContainer}>
      <View style={styles.primaryStatItem}>
        <View style={[styles.primaryStatIcon, { borderColor: "#FF6B35" }]}>
          <FontAwesome5 name="fire" size={16} color="#FF6B35" />
        </View>
        <Text style={styles.primaryStatValue}>{userStats.current_streak || 0}</Text>
        <Text style={styles.primaryStatLabel}>STREAK</Text>
      </View>
      
      <View style={styles.primaryStatItem}>
        <View style={[styles.primaryStatIcon, { borderColor: "#00D4AA" }]}>
          <MaterialCommunityIcons name="dumbbell" size={16} color="#00D4AA" />
        </View>
        <Text style={styles.primaryStatValue}>{userStats.total_workouts || 0}</Text>
        <Text style={styles.primaryStatLabel}>WORKOUTS</Text>
      </View>
      
      <View style={styles.primaryStatItem}>
        <View style={[styles.primaryStatIcon, { borderColor: "#5B86E5" }]}>
          <Ionicons name="trophy" size={16} color="#5B86E5" />
        </View>
        <Text style={styles.primaryStatValue}>{userStats.total_points || 0}</Text>
        <Text style={styles.primaryStatLabel}>POINTS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  primaryStatItem: {
    alignItems: "center",
    flex: 1,
  },
  primaryStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
    borderWidth: 1.5,
  },
  primaryStatValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  primaryStatLabel: {
    fontSize: 9,
    color: "#aaa",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: "uppercase",
  },
});
