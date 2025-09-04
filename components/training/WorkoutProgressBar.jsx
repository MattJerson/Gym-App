import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";

export default function WorkoutProgressBar({ 
  workoutData = { value: 2, max: 5 }, 
  stepsData = { value: 6600, max: 4400 },
}) {
  const workoutProgress = Math.min(workoutData.value / workoutData.max, 1);
  const stepsProgress = Math.min(stepsData.value / stepsData.max, 1);
  
  // Calculate total progress percentage
  const totalProgress = Math.round(((workoutProgress + stepsProgress) / 2) * 100);
  
  // Get current date
  const currentDate = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Progress</Text>
      
      <View style={styles.circlesContainer}>
        {/* Outermost Circle - Workout (Red) */}
        <View style={styles.circleWrapper}>
          <Progress.Circle
            size={180}
            progress={workoutProgress}
            color="#ff3b30"
            unfilledColor="rgba(255, 59, 48, 0.2)"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0)"
            thickness={18}
            strokeCap="round"
          />
          {/* Fire icon at start of red circle */}
          <View style={[styles.iconAtStart, { 
            top: 2, 
            left: '52%', 
            marginLeft: -12,
             
          }]}>
            <Ionicons name="flame" size={13} color="#000000" />
          </View>
        </View>
        
        {/* Middle Circle - Steps (Green) */}
        <View style={[styles.circleWrapper, styles.middleCircle]}>
          <Progress.Circle
            size={140}
            progress={stepsProgress}
            color="#30d158"
            unfilledColor="rgba(48, 209, 88, 0.2)"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0)"
            thickness={18}
            strokeCap="round"
          />
          {/* Steps icon at start of green circle */}
          <View style={[styles.iconAtStart, { 
            top: 2, 
            left: '52%', 
            marginLeft: -12,
            
          }]}>
            <MaterialIcons name="directions-walk" size={14} color="#000000" />
          </View>
        </View>
        
        {/* Center Progress Text */}
        <View style={styles.centerProgress}>
          <Text style={styles.progressPercentage}>{totalProgress}%</Text>
          <Text style={styles.progressLabel}>Progress</Text>
        </View>
      </View>
      
      {/* Info Boxes - Equal absolute sizing */}
      <View style={styles.infoBoxesContainer}>
        {/* Workouts Box */}
        <View style={styles.infoBox}>
          <View style={styles.iconSection}>
            <Ionicons name="flame" size={40} color="#ff3b30" />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.mainValue}>{workoutData.value} / {workoutData.max}</Text>
            <Text style={styles.labelText}>Workouts</Text>
          </View>
        </View>
        
        {/* Steps Box */}
        <View style={[styles.infoBox, styles.middleBox]}>
          <View style={styles.iconSection}>
            <MaterialIcons name="directions-walk" size={40} color="#30d158" />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.mainValue}>{stepsData.value.toLocaleString()}</Text>
            <Text style={styles.subValue}>/ {stepsData.max.toLocaleString()}</Text>
            <Text style={styles.labelText}>Steps</Text>
          </View>
        </View>
        
        {/* Date Box */}
        <View style={styles.infoBox}>
          <View style={styles.iconSection}>
            <MaterialIcons name="calendar-today" size={40} color="#007aff" />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.mainValue}>{day}</Text>
            <Text style={styles.subValue}>{month}</Text>
            <Text style={styles.labelText}>{year}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    borderTopEndRadius: 16,
    borderTopLeftRadius: 16,
    marginBottom: 16,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  title: {
    fontSize: 25,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 20,
  },
  circlesContainer: {
    position: "relative",
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  circleWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  iconAtStart: {
    position: "absolute",
    zIndex: 10,
  },
  centerProgress: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentage: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "800",
  },
  progressLabel: {
    fontSize: 12,
    color: "#ccc",
    fontWeight: "500",
    marginTop: 2,
  },
  infoBoxesContainer: {
    flexDirection: "row",
    height: 90, // Fixed height for all boxes
  },
  infoBox: {
    width: 120, // Fixed width for equal sizing
    height: 90, // Fixed height
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    borderRadius: 0,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  iconSection: {
    width: 40,
    alignItems: "left",
  },
  textSection: {
    flex: 1,
    marginLeft: 6,
    justifyContent: "center",
  },
  mainValue: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
  },
  subValue: {
    fontSize: 10,
    color: "#ccc",
    fontWeight: "400",
    lineHeight: 18,
    alignItems: "center",
  },
  labelText: {
    marginBottom: 2,
    fontSize: 9,
    color: "#999",
    fontWeight: "500",
  },
});