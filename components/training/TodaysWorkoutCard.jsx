import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function TodaysWorkoutCard_SteelGrind({
  workoutName = "Heavy Compound Day",
  workoutType = "Strength",
  totalExercises = 7,
  timeElapsed = 75,
  onContinue = () => {},
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Workout</Text>

      <Pressable style={styles.card} onPress={onContinue}>
        <LinearGradient colors={["#1F2933", "#39424A"]} style={styles.gradient}>
          <View style={styles.chromeTop}>
            <Text style={styles.type}>{workoutType}</Text>
            <View style={styles.miniStats}>
              <View style={styles.mStat}><MaterialIcons name="fitness-center" size={14} color="#9CA3AF"/><Text style={styles.mStatText}>{totalExercises}</Text></View>
              <View style={styles.vDivider} />
              <View style={styles.mStat}><MaterialIcons name="timer" size={14} color="#9CA3AF"/><Text style={styles.mStatText}>{timeElapsed}m</Text></View>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>{workoutName}</Text>

          <View style={styles.bottomRow}>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricNum}>{Math.round(totalExercises * 1.2)}</Text>
                <Text style={styles.metricLabel}>Est kcal</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricNum}>{totalExercises}</Text>
                <Text style={styles.metricLabel}>Sets</Text>
              </View>
            </View>

            <Pressable style={styles.goBtn} onPress={onContinue}>
              <Ionicons name="play" size={16} color="#0B0B0B" />
            </Pressable>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  header: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
  },
  gradient: {
    padding: 14,
    minHeight: 140,
    justifyContent: "space-between",
  },
  chromeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  type: { color: "#9CA3AF", fontSize: 12, fontWeight: "700" },
  miniStats: { flexDirection: "row", alignItems: "center" },
  mStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  mStatText: { color: "#9CA3AF", marginLeft: 6, fontWeight: "700" },
  vDivider: { width: 1, height: 18, backgroundColor: "#2B2F31", marginHorizontal: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 8 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metrics: { flexDirection: "row", gap: 12 },
  metric: { alignItems: "center" },
  metricNum: { color: "#A3E635", fontWeight: "900", fontSize: 16 },
  metricLabel: { color: "#9CA3AF", fontSize: 12 },
  goBtn: {
    backgroundColor: "#A3E635",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
