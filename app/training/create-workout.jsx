import {
  View,
  Text,
  Modal,
  Alert,
  FlatList,
  Animated,
  StatusBar,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../services/supabase";
import { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { TrainingDataService } from "../../services/TrainingDataService";

export default function CreateWorkout() {
  const router = useRouter();

  // 🔄 Workout creation state
  const [userId, setUserId] = useState(null);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6"); // Default blue
  const [selectedEmoji, setSelectedEmoji] = useState("💪"); // Default emoji
  const [estimatedDuration, setEstimatedDuration] = useState("45");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [exercises, setExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Card colors for custom workouts
  const cardColors = [
    { id: "blue", color: "#3B82F6", name: "Ocean Blue" },
    { id: "red", color: "#EF4444", name: "Sunset Red" },
    { id: "orange", color: "#F59E0B", name: "Energetic Orange" },
    { id: "purple", color: "#8B5CF6", name: "Royal Purple" },
    { id: "green", color: "#10B981", name: "Fresh Green" },
    { id: "pink", color: "#EC4899", name: "Power Pink" },
    { id: "teal", color: "#14B8A6", name: "Ocean Teal" },
    { id: "indigo", color: "#6366F1", name: "Deep Indigo" },
    { id: "yellow", color: "#FBBF24", name: "Sunny Yellow" },
    { id: "lime", color: "#84CC16", name: "Lime Green" },
  ];

  // Emojis for custom workouts
  const workoutEmojis = [
    "💪", "🏋️", "🔥", "⚡", "💥", "🎯", 
    "🚀", "⭐", "🏆", "💯", "🎪", "🌟",
    "🦾", "⚔️", "🎖️", "🥇", "👊", "🤸",
  ];

  // Difficulty levels with updated colors
  const difficultyLevels = [
    { id: "beginner", name: "Beginner", icon: "trending-up", color: "#10B981" },
    {
      id: "intermediate",
      name: "Intermediate",
      icon: "flash",
      color: "#F59E0B",
    },
    { id: "advanced", name: "Advanced", icon: "flame", color: "#EF4444" },
  ];

  useEffect(() => {
    getUser();
    loadExerciseLibrary();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const getUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        Alert.alert("Error", "Please sign in to create workouts");
        router.back();
      }
    } catch (error) {
      console.error("Error getting user:", error);
      Alert.alert("Error", "Failed to get user session");
      router.back();
    }
  };

  const loadExerciseLibrary = async () => {
    try {
      if (!userId) return;
      const library = await TrainingDataService.fetchExerciseLibrary(userId);
      setExerciseLibrary(library.featured || []);
    } catch (error) {
      console.error("Error loading exercise library:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadExerciseLibrary();
    }
  }, [userId]);

  const handleAddExercise = (exercise) => {
    const newExercise = {
      id: `${exercise.id}_${Date.now()}`,
      ...exercise,
      sets: 3,
      reps: "10-12",
      weight: "",
      restTime: "60",
      notes: "",
    };
    setExercises((prev) => [...prev, newExercise]);
    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleUpdateExercise = (exerciseId, field, value) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Missing Information", "Please enter a workout name");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert(
        "No Exercises",
        "Please add at least one exercise to your workout"
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        "Authentication Error",
        "User session not found. Please sign in again."
      );
      return;
    }

    try {
      setIsLoading(true);

      const workoutData = {
        name: workoutName.trim(),
        description: workoutDescription.trim(),
        category: "custom", // All custom workouts use 'custom' category
        duration: parseInt(estimatedDuration),
        difficulty: difficulty,
        color: selectedColor, // Save the custom color
        emoji: selectedEmoji, // Save the custom emoji
        exercises: exercises.map((ex) => ({
          name: ex.name,
          description: ex.description || "",
          sets: ex.sets,
          reps: ex.reps,
          restTime: ex.restTime,
          muscle_groups: ex.muscle_groups || [],
          equipment: ex.equipment || [],
        })),
        isCustom: true,
      };

      // Save using TrainingDataService with real user ID
      const savedWorkout = await TrainingDataService.createCustomWorkout(
        userId,
        workoutData
      );
      console.log("Custom workout saved:", savedWorkout);

      Alert.alert(
        "Workout Created! 🎉",
        `${workoutName} has been saved to My Workouts`,
        [
          {
            text: "View Workouts",
            onPress: () => router.push("/page/training"),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert(
        "Save Failed",
        error.message || "Failed to save workout. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = exerciseLibrary.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Create Workout</Text>
          <Text style={styles.headerSubtitle}>Build your custom routine</Text>
        </View>
        <View style={styles.headerRight}>
          {exercises.length > 0 && (
            <View style={styles.exerciseCountBadge}>
              <Text style={styles.exerciseCountText}>{exercises.length}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View
            style={[styles.stepDot, workoutName.trim() && styles.stepDotActive]}
          >
            <Ionicons
              name={workoutName.trim() ? "checkmark" : "create-outline"}
              size={16}
              color={workoutName.trim() ? "#0B0B0B" : "#71717A"}
            />
          </View>
          <Text style={styles.stepLabel}>Details</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View
            style={[
              styles.stepDot,
              exercises.length > 0 && styles.stepDotActive,
            ]}
          >
            <Ionicons
              name={exercises.length > 0 ? "checkmark" : "barbell-outline"}
              size={16}
              color={exercises.length > 0 ? "#0B0B0B" : "#71717A"}
            />
          </View>
          <Text style={styles.stepLabel}>Exercises</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Basic Info */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={24}
              color="#A3E635"
            />
            <Text style={styles.sectionTitle}>Workout Details</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Workout Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Full Body Blast"
                placeholderTextColor="#52525B"
                value={workoutName}
                onChangeText={setWorkoutName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your workout goals and focus..."
                placeholderTextColor="#52525B"
                value={workoutDescription}
                onChangeText={setWorkoutDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Estimated Duration (minutes)
              </Text>
              <View style={styles.durationInputContainer}>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() =>
                    setEstimatedDuration(
                      Math.max(
                        15,
                        parseInt(estimatedDuration || 0) - 5
                      ).toString()
                    )
                  }
                >
                  <Ionicons name="remove" size={20} color="#A3E635" />
                </TouchableOpacity>
                <TextInput
                  style={styles.durationInput}
                  value={estimatedDuration}
                  onChangeText={setEstimatedDuration}
                  keyboardType="numeric"
                />
                <Text style={styles.durationLabel}>min</Text>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() =>
                    setEstimatedDuration(
                      (parseInt(estimatedDuration || 0) + 5).toString()
                    )
                  }
                >
                  <Ionicons name="add" size={20} color="#A3E635" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Customization Section - Color & Emoji */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={24} color="#A3E635" />
            <Text style={styles.sectionTitle}>Customize Appearance</Text>
          </View>

          {/* Preview Card */}
          <View style={[styles.previewCard, { backgroundColor: `${selectedColor}15` }]}>
            <View style={[styles.previewColorStripe, { backgroundColor: selectedColor }]} />
            <View style={styles.previewContent}>
              <View style={[styles.previewEmojiContainer, { backgroundColor: `${selectedColor}30` }]}>
                <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {workoutName || "Your Workout"}
                </Text>
                <Text style={styles.previewMeta}>
                  {exercises.length} exercises • {estimatedDuration} min
                </Text>
              </View>
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.customizeGroup}>
            <Text style={styles.customizeLabel}>Card Color</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorScrollContent}
            >
              {cardColors.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: item.color },
                    selectedColor === item.color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(item.color)}
                >
                  {selectedColor === item.color && (
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Emoji Picker */}
          <View style={styles.customizeGroup}>
            <Text style={styles.customizeLabel}>Icon</Text>
            <View style={styles.emojiGrid}>
              {workoutEmojis.map((emoji, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected,
                    selectedEmoji === emoji && { borderColor: selectedColor },
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Difficulty Selection */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer-outline" size={24} color="#A3E635" />
            <Text style={styles.sectionTitle}>Difficulty Level</Text>
          </View>
          <View style={styles.difficultyContainer}>
            {difficultyLevels.map((level) => (
              <Pressable
                key={level.id}
                style={[
                  styles.difficultyCard,
                  difficulty === level.id && styles.difficultyCardActive,
                ]}
                onPress={() => setDifficulty(level.id)}
              >
                <Ionicons
                  name={level.icon}
                  size={24}
                  color={difficulty === level.id ? level.color : "#71717A"}
                />
                <Text
                  style={[
                    styles.difficultyName,
                    difficulty === level.id && { color: level.color },
                  ]}
                >
                  {level.name}
                </Text>
                {difficulty === level.id && (
                  <View
                    style={[
                      styles.difficultyIndicator,
                      { backgroundColor: level.color },
                    ]}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Exercises Section */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="barbell-outline" size={24} color="#A3E635" />
            <Text style={styles.sectionTitle}>Exercises</Text>
            <View style={styles.exerciseBadge}>
              <Text style={styles.exerciseBadgeText}>{exercises.length}</Text>
            </View>
          </View>

          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={48}
                  color="#52525B"
                />
              </View>
              <Text style={styles.emptyStateText}>No exercises yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start building your workout by adding exercises
              </Text>
              <Pressable
                style={styles.emptyStateButton}
                onPress={() => setShowExerciseModal(true)}
              >
                <LinearGradient
                  colors={["#A3E635", "#84CC16"]}
                  style={styles.emptyStateButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add-circle" size={20} color="#0B0B0B" />
                  <Text style={styles.emptyStateButtonText}>
                    Add First Exercise
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <>
              {exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  isExpanded={expandedExerciseId === exercise.id}
                  onToggle={() =>
                    setExpandedExerciseId(
                      expandedExerciseId === exercise.id ? null : exercise.id
                    )
                  }
                  onUpdate={handleUpdateExercise}
                  onRemove={handleRemoveExercise}
                />
              ))}

              <Pressable
                style={styles.addMoreButton}
                onPress={() => setShowExerciseModal(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#A3E635" />
                <Text style={styles.addMoreText}>Add Another Exercise</Text>
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* Bottom padding to account for fixed save button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Save Button at Bottom - Always Visible */}
      <Animated.View style={[styles.fixedSaveContainer, { opacity: fadeAnim }]}>
        <Pressable
          style={[
            styles.saveButton,
            (!workoutName.trim() || exercises.length === 0 || isLoading) && 
              styles.saveButtonDisabled,
          ]}
          onPress={handleSaveWorkout}
          disabled={!workoutName.trim() || exercises.length === 0 || isLoading}
        >
          <LinearGradient
            colors={
              !workoutName.trim() || exercises.length === 0 || isLoading
                ? ["#27272A", "#27272A"] 
                : ["#A3E635", "#84CC16"]
            }
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <>
                <MaterialCommunityIcons
                  name="loading"
                  size={24}
                  color={exercises.length > 0 ? "#0B0B0B" : "#71717A"}
                />
                <Text style={[
                  styles.saveButtonText,
                  exercises.length === 0 && styles.saveButtonTextDisabled
                ]}>
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={exercises.length > 0 ? "checkmark-circle" : "lock-closed"}
                  size={24}
                  color={exercises.length > 0 ? "#0B0B0B" : "#71717A"}
                />
                <Text style={[
                  styles.saveButtonText,
                  exercises.length === 0 && styles.saveButtonTextDisabled
                ]}>
                  {exercises.length > 0 
                    ? "Save Custom Workout" 
                    : "Add exercises to save"}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        exerciseLibrary={exerciseLibrary}
        onSelectExercise={handleAddExercise}
      />
    </View>
  );
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
}) {
  return (
    <View style={exerciseCardStyles.card}>
      <Pressable onPress={onToggle}>
        <View style={exerciseCardStyles.header}>
          <View style={exerciseCardStyles.headerLeft}>
            <View style={exerciseCardStyles.indexBadge}>
              <Text style={exerciseCardStyles.indexText}>{index + 1}</Text>
            </View>
            <View style={exerciseCardStyles.headerInfo}>
              <Text style={exerciseCardStyles.exerciseName}>
                {exercise.name}
              </Text>
              <Text style={exerciseCardStyles.exerciseTarget}>
                {exercise.sets} sets × {exercise.reps} reps •{" "}
                {exercise.restTime}s rest
              </Text>
            </View>
          </View>
          <View style={exerciseCardStyles.headerActions}>
            <TouchableOpacity
              style={exerciseCardStyles.deleteButton}
              onPress={() => onRemove(exercise.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#71717A"
            />
          </View>
        </View>
      </Pressable>

      {isExpanded && (
        <View style={exerciseCardStyles.expandedContent}>
          <View style={exerciseCardStyles.inputRow}>
            <View style={exerciseCardStyles.inputWrapper}>
              <Text style={exerciseCardStyles.inputLabel}>Sets</Text>
              <View style={exerciseCardStyles.inputWithButtons}>
                <TouchableOpacity
                  style={exerciseCardStyles.adjustButton}
                  onPress={() =>
                    onUpdate(
                      exercise.id,
                      "sets",
                      Math.max(1, exercise.sets - 1)
                    )
                  }
                >
                  <Ionicons name="remove" size={16} color="#A3E635" />
                </TouchableOpacity>
                <TextInput
                  style={exerciseCardStyles.input}
                  value={exercise.sets.toString()}
                  onChangeText={(value) =>
                    onUpdate(exercise.id, "sets", parseInt(value) || 1)
                  }
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={exerciseCardStyles.adjustButton}
                  onPress={() =>
                    onUpdate(exercise.id, "sets", exercise.sets + 1)
                  }
                >
                  <Ionicons name="add" size={16} color="#A3E635" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={exerciseCardStyles.inputWrapper}>
              <Text style={exerciseCardStyles.inputLabel}>Reps</Text>
              <TextInput
                style={exerciseCardStyles.input}
                value={exercise.reps}
                onChangeText={(value) => onUpdate(exercise.id, "reps", value)}
                placeholder="10-12"
                placeholderTextColor="#52525B"
              />
            </View>
          </View>

          <View style={exerciseCardStyles.inputRow}>
            <View style={exerciseCardStyles.inputWrapper}>
              <Text style={exerciseCardStyles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={exerciseCardStyles.input}
                value={exercise.weight}
                onChangeText={(value) => onUpdate(exercise.id, "weight", value)}
                placeholder="Optional"
                placeholderTextColor="#52525B"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={exerciseCardStyles.inputWrapper}>
              <Text style={exerciseCardStyles.inputLabel}>Rest (seconds)</Text>
              <View style={exerciseCardStyles.inputWithButtons}>
                <TouchableOpacity
                  style={exerciseCardStyles.adjustButton}
                  onPress={() =>
                    onUpdate(
                      exercise.id,
                      "restTime",
                      Math.max(15, parseInt(exercise.restTime) - 15).toString()
                    )
                  }
                >
                  <Ionicons name="remove" size={16} color="#A3E635" />
                </TouchableOpacity>
                <TextInput
                  style={exerciseCardStyles.input}
                  value={exercise.restTime}
                  onChangeText={(value) =>
                    onUpdate(exercise.id, "restTime", value)
                  }
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={exerciseCardStyles.adjustButton}
                  onPress={() =>
                    onUpdate(
                      exercise.id,
                      "restTime",
                      (parseInt(exercise.restTime) + 15).toString()
                    )
                  }
                >
                  <Ionicons name="add" size={16} color="#A3E635" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const exerciseCardStyles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272A",
  },
  indexText: {
    fontSize: 14,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    marginBottom: 2,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  exerciseTarget: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
  },
  headerActions: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  expandedContent: {
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
  },
  inputRow: {
    gap: 12,
    flexDirection: "row",
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
    color: "#A1A1AA",
    fontWeight: "600",
  },
  input: {
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
    color: "#FAFAFA",
    fontWeight: "600",
    textAlign: "center",
    borderColor: "#27272A",
    backgroundColor: "#0B0B0B",
  },
  inputWithButtons: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    borderColor: "#27272A",
    justifyContent: "center",
    backgroundColor: "#1C1C1E",
  },
});

// Exercise Selection Modal Component
function ExerciseSelectionModal({
  visible,
  onClose,
  exerciseLibrary,
  onSelectExercise,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExercises = exerciseLibrary.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exercise.category &&
        exercise.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.title}>Add Exercise</Text>
              <Text style={modalStyles.subtitle}>
                {exerciseLibrary.length} exercises available
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#71717A"
              style={modalStyles.searchIcon}
            />
            <TextInput
              style={modalStyles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#52525B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#71717A" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={modalStyles.exerciseItem}
                onPress={() => {
                  onSelectExercise(item);
                  setSearchQuery("");
                }}
              >
                <View style={modalStyles.exerciseInfo}>
                  <View style={modalStyles.exerciseIconContainer}>
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={24}
                      color="#A3E635"
                    />
                  </View>
                  <View style={modalStyles.exerciseDetails}>
                    <Text style={modalStyles.exerciseName}>{item.name}</Text>
                    <Text style={modalStyles.exerciseMeta}>
                      {item.category}{" "}
                      {item.difficulty && `• ${item.difficulty}`}
                    </Text>
                  </View>
                </View>
                <View style={modalStyles.addButton}>
                  <Ionicons name="add" size={24} color="#A3E635" />
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={modalStyles.emptyList}>
                <Ionicons name="search" size={48} color="#52525B" />
                <Text style={modalStyles.emptyText}>No exercises found</Text>
                <Text style={modalStyles.emptySubtext}>
                  Try a different search term
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  container: {
    borderWidth: 1,
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#161616",
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  header: {
    padding: 20,
    flexDirection: "row",
    borderBottomWidth: 1,
    alignItems: "flex-start",
    borderBottomColor: "#27272A",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    color: "#71717A",
    fontWeight: "600",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272A",
  },
  searchContainer: {
    marginTop: 16,
    borderWidth: 1,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderColor: "#27272A",
    backgroundColor: "#0B0B0B",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FAFAFA",
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  exerciseItem: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#27272A",
    backgroundColor: "#1C1C1E",
    justifyContent: "space-between",
  },
  exerciseInfo: {
    gap: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163, 230, 53, 0.1)",
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    marginBottom: 2,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  exerciseMeta: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(163, 230, 53, 0.3)",
    backgroundColor: "rgba(163, 230, 53, 0.1)",
  },
  emptyList: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    color: "#71717A",
    fontWeight: "700",
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: "#52525B",
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    justifyContent: "space-between",
    borderBottomColor: "rgba(163, 230, 53, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#161616",
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    marginBottom: 4,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  exerciseCountBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A3E635",
  },
  exerciseCountText: {
    fontSize: 14,
    color: "#0B0B0B",
    fontWeight: "700",
  },
  progressContainer: {
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "#0B0B0B",
  },
  progressStep: {
    gap: 8,
    alignItems: "center",
  },
  stepDot: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderRadius: 18,
    alignItems: "center",
    borderColor: "#27272A",
    justifyContent: "center",
    backgroundColor: "#161616",
  },
  stepDotActive: {
    borderColor: "#A3E635",
    backgroundColor: "#A3E635",
  },
  stepLabel: {
    fontSize: 11,
    color: "#71717A",
    fontWeight: "600",
  },
  progressLine: {
    width: 40,
    height: 2,
    marginBottom: 28,
    backgroundColor: "#27272A",
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100, // Extra padding for fixed button
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    gap: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  exerciseBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderColor: "rgba(163, 230, 53, 0.3)",
    backgroundColor: "rgba(163, 230, 53, 0.1)",
  },
  exerciseBadgeText: {
    fontSize: 14,
    color: "#A3E635",
    fontWeight: "700",
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#A1A1AA",
    fontWeight: "600",
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    color: "#FAFAFA",
    borderColor: "#27272A",
    backgroundColor: "#0B0B0B",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  durationInputContainer: {
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#27272A",
    backgroundColor: "#0B0B0B",
  },
  durationButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    borderColor: "#27272A",
    justifyContent: "center",
    backgroundColor: "#161616",
  },
  durationInput: {
    flex: 1,
    fontSize: 24,
    color: "#FAFAFA",
    fontWeight: "700",
    textAlign: "center",
  },
  durationLabel: {
    fontSize: 16,
    color: "#71717A",
    fontWeight: "600",
  },
  // Customization styles
  previewCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderColor: "#27272A",
  },
  previewColorStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  previewContent: {
    gap: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 18,
    color: '#FAFAFA',
    fontWeight: '700',
    marginBottom: 4,
  },
  previewMeta: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '600',
  },
  customizeGroup: {
    marginBottom: 16,
  },
  customizeLabel: {
    fontSize: 14,
    marginBottom: 12,
    color: "#A1A1AA",
    fontWeight: "600",
  },
  colorScrollContent: {
    gap: 12,
    paddingVertical: 4,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  colorOptionSelected: {
    borderColor: '#FAFAFA',
    transform: [{ scale: 1.1 }],
  },
  emojiGrid: {
    gap: 8,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#27272A',
    backgroundColor: '#161616',
  },
  emojiOptionSelected: {
    borderWidth: 3,
    backgroundColor: '#1C1C1E',
  },
  emojiText: {
    fontSize: 28,
  },
  // Remove old category styles
  categoryGrid: {
    gap: 12,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  categoryCard: {
    gap: 12,
    flex: 1,
    padding: 16,
    borderWidth: 2,
    minWidth: "30%",
    borderRadius: 16,
    alignItems: "center",
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  categoryCardActive: {
    borderColor: "#A3E635",
    backgroundColor: "rgba(163, 230, 53, 0.05)",
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "700",
    textAlign: "center",
  },
  categoryNameActive: {
    color: "#FAFAFA",
  },
  selectedCheck: {
    top: 8,
    right: 8,
    position: "absolute",
  },
  difficultyContainer: {
    gap: 12,
    flexDirection: "row",
  },
  difficultyCard: {
    gap: 8,
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    alignItems: "center",
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  difficultyCardActive: {
    borderColor: "#A3E635",
    backgroundColor: "rgba(163, 230, 53, 0.05)",
  },
  difficultyName: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "700",
  },
  difficultyIndicator: {
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    position: "absolute",
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: "center",
    borderStyle: "dashed",
    paddingHorizontal: 32,
    borderColor: "#27272A",
    backgroundColor: "#161616",
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163, 230, 53, 0.05)",
  },
  emptyStateText: {
    fontSize: 18,
    marginBottom: 8,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#71717A",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyStateButtonGradient: {
    gap: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    fontSize: 16,
    color: "#0B0B0B",
    fontWeight: "700",
  },
  addMoreButton: {
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
    justifyContent: "center",
    backgroundColor: "#161616",
    borderColor: "rgba(163, 230, 53, 0.3)",
  },
  addMoreText: {
    fontSize: 16,
    color: "#A3E635",
    fontWeight: "700",
  },
  // Fixed save button at bottom
  fixedSaveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0B0B0B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 230, 53, 0.1)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 1, // Keep full opacity, color change handled by gradient
  },
  saveButtonGradient: {
    gap: 12,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    color: "#0B0B0B",
    fontWeight: "700",
  },
  saveButtonTextDisabled: {
    color: "#71717A",
  },
  bottomPadding: {
    height: 20,
  },
});
