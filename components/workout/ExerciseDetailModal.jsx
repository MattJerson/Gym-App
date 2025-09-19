import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

export default function ExerciseDetailModal({ visible, exercise, onClose }) {
  if (!exercise) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#00D4AA';
      case 'Intermediate': return '#FFA726';
      case 'Advanced': return '#FF5722';
      default: return '#74b9ff';
    }
  };

  const getEquipmentIcon = (equipment) => {
    const equipmentIcons = {
      'Pull-up Bar': 'fitness-outline',
      'Barbell': 'barbell-outline',
      'Cable Machine': 'hardware-chip-outline',
      'Dumbbells': 'fitness-outline',
      'Resistance Band': 'extension-puzzle-outline',
    };
    return equipmentIcons[equipment] || 'fitness-outline';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#1a1a1a", "#2d2d2d"]}
          style={styles.modalContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.exerciseTitle}>{exercise.name}</Text>
              <View style={styles.headerDetails}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
                  <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
                </View>
                <Text style={styles.exerciseNumber}>Exercise {exercise.index + 1}</Text>
              </View>
            </View>
            
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Video Placeholder */}
            <View style={styles.videoContainer}>
              <LinearGradient
                colors={["rgba(116, 185, 255, 0.2)", "rgba(9, 132, 227, 0.2)"]}
                style={styles.videoPlaceholder}
              >
                <Ionicons name="play-circle" size={60} color="#74b9ff" />
                <Text style={styles.videoText}>Exercise Demonstration</Text>
                <Text style={styles.videoSubtext}>Tap to play video</Text>
              </LinearGradient>
            </View>

            {/* Exercise Info */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Exercise Details</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Ionicons name="body-outline" size={20} color="#74b9ff" />
                  <Text style={styles.infoLabel}>Target Muscles</Text>
                  <Text style={styles.infoValue}>{exercise.targetMuscles.join(', ')}</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <MaterialIcons name="fitness-center" size={20} color="#00D4AA" />
                  <Text style={styles.infoLabel}>Sets × Reps</Text>
                  <Text style={styles.infoValue}>{exercise.sets} × {exercise.reps}</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <Ionicons name={getEquipmentIcon(exercise.equipment)} size={20} color="#FFA726" />
                  <Text style={styles.infoLabel}>Equipment</Text>
                  <Text style={styles.infoValue}>{exercise.equipment}</Text>
                </View>
                
                {exercise.restTime && (
                  <View style={styles.infoCard}>
                    <Ionicons name="time-outline" size={20} color="#FF5722" />
                    <Text style={styles.infoLabel}>Rest Time</Text>
                    <Text style={styles.infoValue}>{exercise.restTime}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <View style={styles.instructionsContainer}>
                {exercise.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tips */}
            {exercise.tips && exercise.tips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pro Tips</Text>
                <View style={styles.tipsContainer}>
                  {exercise.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Ionicons name="bulb" size={16} color="#FFA726" />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Common Mistakes */}
            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Avoid These Mistakes</Text>
                <View style={styles.mistakesContainer}>
                  {exercise.commonMistakes.map((mistake, index) => (
                    <View key={index} style={styles.mistakeItem}>
                      <Ionicons name="warning" size={16} color="#FF5722" />
                      <Text style={styles.mistakeText}>{mistake}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Muscles Worked */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Muscles Worked</Text>
              <View style={styles.musclesContainer}>
                <View style={styles.muscleGroup}>
                  <Text style={styles.muscleGroupTitle}>Primary</Text>
                  {exercise.targetMuscles.map((muscle, index) => (
                    <View key={index} style={styles.muscleItem}>
                      <View style={[styles.muscleDot, { backgroundColor: '#00D4AA' }]} />
                      <Text style={styles.muscleText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
                
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                  <View style={styles.muscleGroup}>
                    <Text style={styles.muscleGroupTitle}>Secondary</Text>
                    {exercise.secondaryMuscles.map((muscle, index) => (
                      <View key={index} style={styles.muscleItem}>
                        <View style={[styles.muscleDot, { backgroundColor: '#74b9ff' }]} />
                        <Text style={styles.muscleText}>{muscle}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  exerciseTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  exerciseNumber: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  videoContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  videoPlaceholder: {
    height: 200,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  videoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  videoSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  infoValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  instructionsContainer: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: "row",
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#74b9ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  instructionNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  instructionText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    lineHeight: 24,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255, 167, 38, 0.1)",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FFA726",
  },
  tipText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  mistakesContainer: {
    gap: 12,
  },
  mistakeItem: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255, 87, 34, 0.1)",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FF5722",
  },
  mistakeText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  musclesContainer: {
    gap: 16,
  },
  muscleGroup: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
  },
  muscleGroupTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  muscleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  muscleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  muscleText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  bottomPadding: {
    height: 40,
  },
});
