import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";

export default function ContinueWorkoutCard({ 
  workoutName = "Push Day",
  workoutType = "Custom Workout",
  completedExercises = 4,
  totalExercises = 6,
  timeElapsed = 15,
  progress = 0.66,
  onContinue = () => {},
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Continue Workout</Text>
      
      <Pressable style={styles.card} onPress={onContinue}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Background workout image overlay */}
          <View style={styles.imageOverlay}>
            <MaterialIcons name="fitness-center" size={90} color="rgba(255, 255, 255, 0.08)" />
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
              {/* Progress Info Row */}
              <View style={styles.progressInfoRow}>
                <Text style={styles.progressText}>
                  {completedExercises}/{totalExercises} exercises done
                </Text>
                <View style={styles.timeContainer}>
                  <MaterialIcons name="timer" size={14} color="#fff" />
                  <Text style={styles.timeText}>{timeElapsed} mins</Text>
                </View>
              </View>
              
              {/* Progress Bar (restricted to left side) */}
              <View style={styles.progressBarContainer}>
                <Progress.Bar
                  progress={progress}
                  width={null}
                  height={6}
                  color="#fff"
                  unfilledColor="rgba(255, 255, 255, 0.3)"
                  borderWidth={0}
                  borderRadius={4}
                  style={styles.progressBar}
                />
              </View>
            </View>
            
            {/* Continue Button (restricted to left side) */}
            <View style={styles.buttonWrapper}>
              <Pressable style={styles.continueButton} onPress={onContinue}>
                <Ionicons name="play" size={18} color="#667eea" />
                <Text style={styles.continueText}>Continue</Text>
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginHorizontal: 0,
  },
  gradient: {
    padding: 15,
    position: "relative",
    minHeight: 135, // reduced height
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    marginBottom: 8,
  },
  workoutTypeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  workoutName: {
    marginTop: 2,
    marginBottom: 4,
    fontSize: 28, // slightly smaller
    color: "#fff",
    fontWeight: "bold",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressSection: {
    marginBottom: 4,
    width: "50%",
  },
  progressInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
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
  progressBarContainer: {
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
  },
  buttonWrapper: {
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
  },
  continueText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
    marginLeft: 6,
  },
});
