import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { TrainingDataService } from "../../services/TrainingDataService";

export default function CreateWorkout() {
  const router = useRouter();
  
  // 🔄 Workout creation state
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("strength");
  const [estimatedDuration, setEstimatedDuration] = useState("45");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [exercises, setExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Workout categories
  const categories = [
    { id: "strength", name: "Strength", icon: "dumbbell", color: "#1E3A5F" },
    { id: "cardio", name: "Cardio", icon: "flash", color: "#FF5722" },
    { id: "hiit", name: "HIIT", icon: "zap", color: "#FF9800" },
    { id: "yoga", name: "Yoga", icon: "leaf", color: "#9C27B0" },
    { id: "core", name: "Core", icon: "fitness", color: "#4CAF50" },
    { id: "functional", name: "Functional", icon: "body", color: "#FFC107" }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { id: "beginner", name: "Beginner", color: "#4CAF50" },
    { id: "intermediate", name: "Intermediate", color: "#FF9800" },
    { id: "advanced", name: "Advanced", color: "#F44336" }
  ];

  useEffect(() => {
    loadExerciseLibrary();
  }, []);

  const loadExerciseLibrary = async () => {
    try {
      const library = await TrainingDataService.fetchExerciseLibrary("user123");
      setExerciseLibrary(library.featured || []);
    } catch (error) {
      console.error("Error loading exercise library:", error);
    }
  };

  const handleAddExercise = (exercise) => {
    const newExercise = {
      id: `${exercise.id}_${Date.now()}`,
      ...exercise,
      sets: 3,
      reps: "10-12",
      weight: "",
      restTime: "60",
      notes: ""
    };
    setExercises(prev => [...prev, newExercise]);
    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleUpdateExercise = (exerciseId, field, value) => {
    setExercises(prev => 
      prev.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    );
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise");
      return;
    }

    try {
      setIsLoading(true);
      
      const workoutData = {
        name: workoutName.trim(),
        description: workoutDescription.trim(),
        category: selectedCategory,
        duration: parseInt(estimatedDuration),
        difficulty: difficulty,
        exercises: exercises,
        isCustom: true
      };

      // Save using TrainingDataService
      const savedWorkout = await TrainingDataService.createCustomWorkout("user123", workoutData);
      console.log("Custom workout saved:", savedWorkout);
      
      Alert.alert(
        "Success", 
        "Custom workout created successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = exerciseLibrary.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Custom Workout</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Workout Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Workout Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Workout Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter workout name"
              placeholderTextColor="#666"
              value={workoutName}
              onChangeText={setWorkoutName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your workout..."
              placeholderTextColor="#666"
              value={workoutDescription}
              onChangeText={setWorkoutDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="45"
              placeholderTextColor="#666"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryButton,
                  { backgroundColor: category.color },
                  selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <FontAwesome5 name={category.icon} size={20} color="#fff" />
                <Text style={styles.categoryText}>{category.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Difficulty Level</Text>
          <View style={styles.difficultyRow}>
            {difficultyLevels.map((level) => (
              <Pressable
                key={level.id}
                style={[
                  styles.difficultyButton,
                  { borderColor: level.color },
                  difficulty === level.id && { backgroundColor: level.color }
                ]}
                onPress={() => setDifficulty(level.id)}
              >
                <Text style={[
                  styles.difficultyText,
                  difficulty === level.id && styles.selectedDifficultyText
                ]}>
                  {level.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Exercises Section */}
        <View style={styles.card}>
          <View style={styles.exercisesHeader}>
            <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
            <Pressable
              style={styles.addExerciseButton}
              onPress={() => setShowExerciseModal(true)}
            >
              <Ionicons name="add-circle" size={24} color="#1E3A5F" />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </Pressable>
          </View>

          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="fitness-center" size={48} color="#666" />
              <Text style={styles.emptyStateText}>No exercises added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add Exercise" to build your workout
              </Text>
            </View>
          ) : (
            exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>
                    {index + 1}. {exercise.name}
                  </Text>
                  <Pressable onPress={() => handleRemoveExercise(exercise.id)}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </Pressable>
                </View>
                
                <View style={styles.exerciseDetails}>
                  <View style={styles.exerciseInputRow}>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.exerciseInputLabel}>Sets</Text>
                      <TextInput
                        style={styles.exerciseInput}
                        value={exercise.sets.toString()}
                        onChangeText={(value) => 
                          handleUpdateExercise(exercise.id, 'sets', parseInt(value) || 1)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.exerciseInputLabel}>Reps</Text>
                      <TextInput
                        style={styles.exerciseInput}
                        value={exercise.reps}
                        onChangeText={(value) => 
                          handleUpdateExercise(exercise.id, 'reps', value)
                        }
                        placeholder="10-12"
                        placeholderTextColor="#666"
                      />
                    </View>
                    
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.exerciseInputLabel}>Weight</Text>
                      <TextInput
                        style={styles.exerciseInput}
                        value={exercise.weight}
                        onChangeText={(value) => 
                          handleUpdateExercise(exercise.id, 'weight', value)
                        }
                        placeholder="lbs/kg"
                        placeholderTextColor="#666"
                      />
                    </View>
                    
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.exerciseInputLabel}>Rest (s)</Text>
                      <TextInput
                        style={styles.exerciseInput}
                        value={exercise.restTime}
                        onChangeText={(value) => 
                          handleUpdateExercise(exercise.id, 'restTime', value)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Save Button */}
        <Pressable 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveWorkout}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ["#666", "#666"] : ["#1E3A5F", "#4A90E2"]}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? "Saving..." : "Save Custom Workout"}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exerciseModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <Pressable onPress={() => setShowExerciseModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.exerciseOption}
                  onPress={() => handleAddExercise(item)}
                >
                  <View style={styles.exerciseOptionContent}>
                    <View>
                      <Text style={styles.exerciseOptionName}>{item.name}</Text>
                      <Text style={styles.exerciseOptionCategory}>
                        {item.category} • {item.difficulty}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color="#1E3A5F" />
                  </View>
                </Pressable>
              )}
              style={styles.exerciseList}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  headerRight: {
    width: 40,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: "30%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  selectedCategory: {
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  difficultyText: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedDifficultyText: {
    color: "#fff",
  },
  exercisesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(30, 58, 95, 0.2)",
  },
  addExerciseText: {
    color: "#1E3A5F",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  exerciseItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseDetails: {
    marginTop: 8,
  },
  exerciseInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  exerciseInputGroup: {
    flex: 1,
  },
  exerciseInputLabel: {
    color: "#ccc",
    fontSize: 12,
    marginBottom: 4,
  },
  exerciseInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 8,
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    padding: 18,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  exerciseModal: {
    backgroundColor: "#252525",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  exerciseList: {
    maxHeight: 400,
  },
  exerciseOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  exerciseOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseOptionName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseOptionCategory: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 4,
  },
});
