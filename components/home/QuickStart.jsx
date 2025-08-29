import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function QuickStart() {
  const workouts = ["Push Day", "Pull Day", "Leg Day"];
  const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];

  const [todayWorkout, setTodayWorkout] = useState("");
  const [todayMeal, setTodayMeal] = useState("");

  useEffect(() => {
    setTodayWorkout(workouts[Math.floor(Math.random() * workouts.length)]);
    setTodayMeal(meals[Math.floor(Math.random() * meals.length)]);
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Start Workout */}
        <Pressable style={styles.half} onPress={() => {}}>
          <LinearGradient
            colors={["#6EE7B7", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.textContainer}>
              <Text style={styles.title}>Workout</Text>
              <Text style={styles.subtitle}>{todayWorkout}</Text>
            </View>
            <Ionicons
              name="barbell"
              size={64}
              color="#fff"
              style={[styles.icon, { transform: [{ rotate: "-45deg" }] }]} // rotated 45deg
            />
          </LinearGradient>
        </Pressable>

        {/* Log Meal */}
        <Pressable style={styles.half} onPress={() => {}}>
          <LinearGradient
            colors={["#f6d365", "#fda085"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.textContainer}>
              <Text style={styles.title}>Meal</Text>
              <Text style={styles.subtitle}>{todayMeal}</Text>
            </View>
            <MaterialCommunityIcons
              name="food"
              size={64}
              color="#fff"
              style={styles.icon}
            />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: 20,
    paddingBottom: 35,
    borderRadius: 16,
    justifyContent: "flex-start", // keep content at top
  },
  textContainer: {
    alignItems: "flex-start", // text aligned to top-left
    paddingBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 17,
    color: "#eee",
  },
  icon: {
    position: "absolute",
    right: 10,
    bottom: 10,
    opacity: 0.9,
  },
});
