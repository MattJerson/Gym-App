import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TotalProgressBar({ totalProgress }) {
  const isCompleted = totalProgress >= 100;
  
  return (
    <View style={styles.totalProgressWrapper}>
      <View style={styles.progressHeader}>
        <Text style={styles.totalProgressText}>
          Daily Progress
        </Text>
        <Text style={[
          styles.progressPercentage, 
          isCompleted && styles.completedPercentage
        ]}>
          {Math.round(totalProgress)}%
        </Text>
      </View>
      
      <View style={styles.totalProgressContainer}>
        <LinearGradient
          colors={["#4378beff", "#043d87ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.totalProgressBar, { width: `${Math.min(totalProgress, 100)}%` }]}
        />
        
        {/* Progress indicator dot */}
        {totalProgress > 5 && (
          <View style={[
            styles.progressDot, 
            { left: `${Math.min(totalProgress, 95)}%` }
          ]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totalProgressWrapper: { 
    marginBottom: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  totalProgressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#74b9ff",
  },
  completedPercentage: {
    color: "#00D4AA",
  },
  totalProgressContainer: {
    width: "100%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
  },
  totalProgressBar: { 
    height: "100%", 
    borderRadius: 8,
  },
  progressDot: {
    position: "absolute",
    top: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});
