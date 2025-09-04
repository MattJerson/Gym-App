import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function TodaysWorkoutCard({ 
  workoutName = "My Push Day",
  workoutType = "Custom Workout",
  totalExercises = 8,
  timeElapsed = 60,
  onContinue = () => {},
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Workout</Text>
      
      <Pressable style={styles.card} onPress={onContinue}>
        <LinearGradient
          colors={["#43cea2", "#185a9d"]} // teal → deep blue
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Background overlay icon */}
          <View style={styles.imageOverlay}>
            <MaterialIcons
              name="flash-on"
              size={90}
              color="rgba(255, 255, 255, 0.08)"
            />
          </View>
          
          <View style={styles.content}>
            {/* Workout Type Tag */}
            <View style={styles.workoutTypeTag}>
              <Text style={styles.workoutTypeText}>{workoutType}</Text>
            </View>
            
            {/* Workout Name */}
            <Text style={styles.workoutName}>{workoutName}</Text>
            
            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressInfoRow}>
                <Text style={styles.progressText}>
                  {totalExercises} Exercises
                </Text>
                <View style={styles.timeContainer}>
                  <MaterialIcons name="timer" size={14} color="#fff" />
                  <Text style={styles.timeText}>{timeElapsed} mins</Text>
                </View>
              </View>
            </View>
            
            {/* Start Button */}
            <View style={styles.buttonWrapper}>
              <Pressable style={styles.continueButton} onPress={onContinue}>
                <Ionicons name="play" size={18} color="#185a9d" />
                <Text style={styles.continueText}>Start</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginHorizontal: 0,
  },
  gradient: {
    padding: 15,
    position: "relative",
    minHeight: 160,
  },
  imageOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  workoutTypeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 15,
    marginBottom: 10,
  },
  workoutTypeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  workoutName: {
    marginTop: 40,
    marginBottom: 5,
    fontSize: 50,
    color: "#fff",
    fontWeight: "bold",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressSection: {
    width: "50%",
  },
  progressInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  buttonWrapper: {
    marginTop: 4,
    width: "50%",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "stretch",
    shadowColor: "#185a9d",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  continueText: {
    fontSize: 14,
    color: "#185a9d",
    fontWeight: "600",
    marginLeft: 6,
  },
});
