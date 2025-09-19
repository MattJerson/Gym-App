import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function ExerciseCard({ 
  exercise, 
  exerciseIndex, 
  session, 
  onExercisePress, 
  onSetComplete,
  isActive 
}) {
  const exerciseProgress = session.exerciseProgress[exerciseIndex] || {
    completed: false,
    sets: Array(exercise.sets).fill({ completed: false })
  };

  const completedSets = exerciseProgress.sets.filter(set => set.completed).length;
  const isExerciseComplete = exerciseProgress.completed;

  const handleCompleteSet = (setIndex) => {
    // Simply mark the set as complete without requiring input
    onSetComplete(exerciseIndex, setIndex, { completed: true });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#00D4AA';
      case 'Intermediate': return '#FFA726';
      case 'Advanced': return '#FF5722';
      default: return '#74b9ff';
    }
  };

  const getMuscleGroupIcon = (muscle) => {
    const muscleIcons = {
      'Lats': 'fitness-outline',
      'Rhomboids': 'body-outline',
      'Rear Delts': 'body-outline',
      'Biceps': 'body-outline',
      'Middle Traps': 'body-outline',
      'Lower Traps': 'body-outline',
    };
    return muscleIcons[muscle] || 'body-outline';
  };

  return (
    <View style={[styles.container, isActive && styles.activeContainer]}>
      <LinearGradient
        colors={
          isExerciseComplete 
            ? ["rgba(0, 212, 170, 0.1)", "rgba(0, 230, 118, 0.1)"]
            : isActive
            ? ["rgba(116, 185, 255, 0.1)", "rgba(9, 132, 227, 0.1)"]
            : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
        }
        style={styles.card}
      >
        {/* Exercise Header */}
        <Pressable style={styles.exerciseHeader} onPress={onExercisePress}>
          <View style={styles.exerciseInfo}>
            <View style={styles.exerciseTitleRow}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {isExerciseComplete && (
                <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
              )}
            </View>
            
            <View style={styles.exerciseDetails}>
              <View style={styles.exerciseDetailItem}>
                <Ionicons 
                  name={getMuscleGroupIcon(exercise.targetMuscles[0])} 
                  size={14} 
                  color="rgba(255,255,255,0.6)" 
                />
                <Text style={styles.exerciseDetailText}>
                  {exercise.targetMuscles.join(', ')}
                </Text>
              </View>
              
              <View style={styles.exerciseDetailItem}>
                <MaterialIcons name="fitness-center" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.exerciseDetailText}>
                  {exercise.sets} sets × {exercise.reps} reps
                </Text>
              </View>
              
              <View style={styles.exerciseDetailItem}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
                  <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.progressIndicator}>
              <Text style={styles.progressText}>
                {completedSets}/{exercise.sets} sets completed
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={isExerciseComplete ? ["#00D4AA", "#00E676"] : ["#74b9ff", "#0984e3"]}
                  style={[styles.progressFill, { width: `${(completedSets / exercise.sets) * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
        </Pressable>

        {/* Sets List */}
        <View style={styles.setsContainer}>
          {Array.from({ length: exercise.sets }, (_, setIndex) => {
            const setData = exerciseProgress.sets[setIndex];
            const isSetCompleted = setData?.completed || false;
            
            return (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                
                <View style={styles.setInfo}>
                  <Text style={styles.setTarget}>
                    {exercise.reps} reps
                  </Text>
                </View>
                
                <Pressable
                  style={[styles.completeButton, isSetCompleted && styles.completedButton]}
                  onPress={() => !isSetCompleted && handleCompleteSet(setIndex)}
                  disabled={isSetCompleted}
                >
                  <Ionicons 
                    name={isSetCompleted ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={24} 
                    color={isSetCompleted ? "#00D4AA" : "rgba(255,255,255,0.6)"} 
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Rest Timer Info */}
        {exercise.restTime && (
          <View style={styles.restInfo}>
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.restText}>Rest {exercise.restTime} between sets</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  activeContainer: {
    transform: [{ scale: 1.02 }],
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  exerciseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  exerciseDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  exerciseDetailText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  progressIndicator: {
    gap: 4,
  },
  progressText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  setsContainer: {
    gap: 12,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  setNumber: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    width: 30,
    textAlign: "center",
  },
  setInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  setTarget: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  completeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  completedButton: {
    backgroundColor: "rgba(0, 212, 170, 0.2)",
  },
  restInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  restText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
});
