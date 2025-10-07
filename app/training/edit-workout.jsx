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
  StatusBar,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useRef } from "react";
import { TrainingDataService } from "../../services/TrainingDataService";
import { supabase } from "../../services/supabase";

export default function EditWorkout() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams();
  
  // State management
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("strength");
  const [estimatedDuration, setEstimatedDuration] = useState("45");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [exercises, setExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Workout categories
  const categories = [
    { id: "strength", name: "Strength", icon: "dumbbell", color: "#3B82F6" },
    { id: "cardio", name: "Cardio", icon: "flash", color: "#EF4444" },
    { id: "hiit", name: "HIIT", icon: "zap", color: "#F59E0B" },
    { id: "yoga", name: "Flexibility", icon: "leaf", color: "#8B5CF6" },
    { id: "core", name: "Core", icon: "fitness", color: "#10B981" },
    { id: "functional", name: "Functional", icon: "body", color: "#F59E0B" }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { id: "beginner", name: "Beginner", icon: "trending-up", color: "#10B981" },
    { id: "intermediate", name: "Intermediate", icon: "flash", color: "#F59E0B" },
    { id: "advanced", name: "Advanced", icon: "flame", color: "#EF4444" }
  ];

  useEffect(() => {
    getUser();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (userId && templateId) {
      loadWorkoutData();
      loadExerciseLibrary();
    }
  }, [userId, templateId]);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        Alert.alert('Error', 'Please sign in to edit workouts');
        router.back();
      }
    } catch (error) {
      console.error('Error getting user:', error);
      Alert.alert('Error', 'Failed to get user session');
      router.back();
    }
  };

  const loadWorkoutData = async () => {
    try {
      setIsLoading(true);

      // Fetch workout template details
      const { data: template, error: templateError } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Verify user owns this workout
      if (!template.is_custom || template.created_by_user_id !== userId) {
        Alert.alert('Error', 'You can only edit your own custom workouts');
        router.back();
        return;
      }

      // Fetch exercises for this template
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index');

      if (exercisesError) throw exercisesError;

      // Get category info to map to UI category
      const { data: categoryData } = await supabase
        .from('workout_categories')
        .select('name')
        .eq('id', template.category_id)
        .single();

      // Map category name to UI category ID
      const categoryMapping = {
        'Strength Training': 'strength',
        'Cardio': 'cardio',
        'High Intensity': 'hiit',
        'Flexibility': 'yoga',
        'Core Training': 'core',
        'Functional Training': 'functional'
      };

      const categoryId = categoryMapping[categoryData?.name] || 'strength';

      // Set form data
      setWorkoutName(template.name);
      setWorkoutDescription(template.description || '');
      setSelectedCategory(categoryId);
      setEstimatedDuration(template.duration_minutes.toString());
      setDifficulty(template.difficulty.toLowerCase());

      // Transform exercises to match the format used in create-workout
      const transformedExercises = exercisesData.map((ex, index) => ({
        id: `${ex.id}_${Date.now()}_${index}`,
        exercise_id: ex.id,
        name: ex.exercise_name,
        description: ex.description || '',
        sets: ex.sets,
        reps: ex.reps,
        weight: '',
        restTime: ex.rest_seconds.toString(),
        muscle_groups: ex.muscle_groups || [],
        equipment: ex.equipment || [],
        notes: ''
      }));

      setExercises(transformedExercises);
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Error', 'Failed to load workout details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadExerciseLibrary = async () => {
    try {
      const library = await TrainingDataService.fetchExerciseLibrary(userId);
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
      Alert.alert("Missing Information", "Please enter a workout name");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("No Exercises", "Please add at least one exercise to your workout");
      return;
    }

    if (!userId || !templateId) {
      Alert.alert("Error", "Missing required information");
      return;
    }

    try {
      setIsSaving(true);
      
      const workoutData = {
        name: workoutName.trim(),
        description: workoutDescription.trim(),
        category: selectedCategory,
        duration: parseInt(estimatedDuration),
        difficulty: difficulty,
        exercises: exercises.map(ex => ({
          name: ex.name,
          description: ex.description || '',
          sets: ex.sets,
          reps: ex.reps,
          restTime: ex.restTime,
          muscle_groups: ex.muscle_groups || [],
          equipment: ex.equipment || []
        })),
      };

      await TrainingDataService.updateCustomWorkout(userId, templateId, workoutData);
      
      Alert.alert(
        "Workout Updated! 🎉", 
        `${workoutName} has been successfully updated`,
        [
          {
            text: "Done",
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error("Error updating workout:", error);
      Alert.alert("Update Failed", error.message || "Failed to update workout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A3E635" />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Workout</Text>
          <Text style={styles.headerSubtitle}>Update your custom routine</Text>
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
          <View style={[styles.stepDot, workoutName.trim() && styles.stepDotActive]}>
            <Ionicons name={workoutName.trim() ? "checkmark" : "create-outline"} size={16} color={workoutName.trim() ? "#0B0B0B" : "#71717A"} />
          </View>
          <Text style={styles.stepLabel}>Details</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.stepDot, exercises.length > 0 && styles.stepDotActive]}>
            <Ionicons name={exercises.length > 0 ? "checkmark" : "barbell-outline"} size={16} color={exercises.length > 0 ? "#0B0B0B" : "#71717A"} />
          </View>
          <Text style={styles.stepLabel}>Exercises</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={[styles.stepDot, workoutName.trim() && exercises.length > 0 && styles.stepDotActive]}>
            <Ionicons name="save-outline" size={16} color={workoutName.trim() && exercises.length > 0 ? "#0B0B0B" : "#71717A"} />
          </View>
          <Text style={styles.stepLabel}>Update</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Workout Basic Info */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#A3E635" />
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
              <Text style={styles.inputLabel}>Estimated Duration (minutes)</Text>
              <View style={styles.durationInputContainer}>
                <TouchableOpacity 
                  style={styles.durationButton}
                  onPress={() => setEstimatedDuration(Math.max(15, parseInt(estimatedDuration || 0) - 5).toString())}
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
                  onPress={() => setEstimatedDuration((parseInt(estimatedDuration || 0) + 5).toString())}
                >
                  <Ionicons name="add" size={20} color="#A3E635" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Category Selection */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={24} color="#A3E635" />
            <Text style={styles.sectionTitle}>Category</Text>
          </View>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                  <FontAwesome5 name={category.icon} size={20} color="#fff" />
                </View>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameActive
                ]}>
                  {category.name}
                </Text>
                {selectedCategory === category.id && (
                  <View style={styles.selectedCheck}>
                    <Ionicons name="checkmark-circle" size={20} color="#A3E635" />
                  </View>
                )}
              </Pressable>
            ))}
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
                  difficulty === level.id && styles.difficultyCardActive
                ]}
                onPress={() => setDifficulty(level.id)}
              >
                <Ionicons 
                  name={level.icon} 
                  size={24} 
                  color={difficulty === level.id ? level.color : "#71717A"} 
                />
                <Text style={[
                  styles.difficultyName,
                  difficulty === level.id && { color: level.color }
                ]}>
                  {level.name}
                </Text>
                {difficulty === level.id && (
                  <View style={[styles.difficultyIndicator, { backgroundColor: level.color }]} />
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
                <MaterialCommunityIcons name="dumbbell" size={48} color="#52525B" />
              </View>
              <Text style={styles.emptyStateText}>No exercises yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add exercises to your workout
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
                  <Text style={styles.emptyStateButtonText}>Add Exercise</Text>
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
                  onToggle={() => setExpandedExerciseId(expandedExerciseId === exercise.id ? null : exercise.id)}
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

        {/* Save Button */}
        {workoutName.trim() && exercises.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Pressable 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveWorkout}
              disabled={isSaving}
            >
              <LinearGradient
                colors={isSaving ? ["#52525B", "#52525B"] : ["#3B82F6", "#2563EB"]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSaving ? (
                  <>
                    <MaterialCommunityIcons name="loading" size={24} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Updating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Update Workout</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

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

// Exercise Card Component (same as create-workout)
function ExerciseCard({ exercise, index, isExpanded, onToggle, onUpdate, onRemove }) {
  return (
    <View style={exerciseCardStyles.card}>
      <Pressable onPress={onToggle}>
        <View style={exerciseCardStyles.header}>
          <View style={exerciseCardStyles.headerLeft}>
            <View style={exerciseCardStyles.indexBadge}>
              <Text style={exerciseCardStyles.indexText}>{index + 1}</Text>
            </View>
            <View style={exerciseCardStyles.headerInfo}>
              <Text style={exerciseCardStyles.exerciseName}>{exercise.name}</Text>
              <Text style={exerciseCardStyles.exerciseTarget}>
                {exercise.sets} sets × {exercise.reps} reps • {exercise.restTime}s rest
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
                  onPress={() => onUpdate(exercise.id, 'sets', Math.max(1, exercise.sets - 1))}
                >
                  <Ionicons name="remove" size={16} color="#A3E635" />
                </TouchableOpacity>
                <TextInput
                  style={exerciseCardStyles.input}
                  value={exercise.sets.toString()}
                  onChangeText={(value) => onUpdate(exercise.id, 'sets', parseInt(value) || 1)}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={exerciseCardStyles.adjustButton}
                  onPress={() => onUpdate(exercise.id, 'sets', exercise.sets + 1)}
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
                onChangeText={(value) => onUpdate(exercise.id, 'reps', value)}
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
                onChangeText={(value) => onUpdate(exercise.id, 'weight', value)}
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
                  onPress={() => onUpdate(exercise.id, 'restTime', Math.max(15, parseInt(exercise.restTime) - 15).toString())}
                >
                  <Ionicons name="remove" size={16} color="#A3E635" />
                </TouchableOpacity>
                <TextInput
                  style={exerciseCardStyles.input}
                  value={exercise.restTime}
                  onChangeText={(value) => onUpdate(exercise.id, 'restTime', value)}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={exerciseCardStyles.adjustButton}
                  onPress={() => onUpdate(exercise.id, 'restTime', (parseInt(exercise.restTime) + 15).toString())}
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
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  exerciseName: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  exerciseTarget: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0B0B0B",
    borderRadius: 8,
    padding: 12,
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#27272A",
    textAlign: "center",
  },
  inputWithButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
});

// Exercise Selection Modal Component (same as create-workout)
function ExerciseSelectionModal({ visible, onClose, exerciseLibrary, onSelectExercise }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExercises = exerciseLibrary.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exercise.category && exercise.category.toLowerCase().includes(searchQuery.toLowerCase()))
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
              <Text style={modalStyles.subtitle}>{exerciseLibrary.length} exercises available</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.searchContainer}>
            <Ionicons name="search" size={20} color="#71717A" style={modalStyles.searchIcon} />
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
                    <MaterialCommunityIcons name="dumbbell" size={24} color="#A3E635" />
                  </View>
                  <View style={modalStyles.exerciseDetails}>
                    <Text style={modalStyles.exerciseName}>{item.name}</Text>
                    <Text style={modalStyles.exerciseMeta}>
                      {item.category} {item.difficulty && `• ${item.difficulty}`}
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
                <Text style={modalStyles.emptySubtext}>Try a different search term</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  title: {
    color: "#FAFAFA",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#71717A",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FAFAFA",
    fontSize: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1C1C1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  exerciseInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(163, 230, 53, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  exerciseMeta: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(163, 230, 53, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.3)",
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#71717A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#52525B",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
});

// Main styles (same structure as create-workout)
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(163, 230, 53, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    color: "#FAFAFA",
    fontWeight: "700",
    marginBottom: 4,
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
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseCountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
  },
  progressStep: {
    alignItems: "center",
    gap: 8,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#161616",
    borderWidth: 2,
    borderColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: "#A3E635",
    borderColor: "#A3E635",
  },
  stepLabel: {
    color: "#71717A",
    fontSize: 11,
    fontWeight: "600",
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: "#27272A",
    marginBottom: 28,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FAFAFA",
    fontWeight: "700",
    flex: 1,
  },
  exerciseBadge: {
    backgroundColor: "rgba(163, 230, 53, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.3)",
  },
  exerciseBadgeText: {
    color: "#A3E635",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#A1A1AA",
    marginBottom: 8,
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "#0B0B0B",
    borderRadius: 12,
    padding: 16,
    color: "#FAFAFA",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  durationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0B0B0B",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  durationButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  durationInput: {
    flex: 1,
    color: "#FAFAFA",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  durationLabel: {
    color: "#71717A",
    fontSize: 16,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#27272A",
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
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  categoryNameActive: {
    color: "#FAFAFA",
  },
  selectedCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: 12,
  },
  difficultyCard: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#27272A",
  },
  difficultyCardActive: {
    borderColor: "#A3E635",
    backgroundColor: "rgba(163, 230, 53, 0.05)",
  },
  difficultyName: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "700",
  },
  difficultyIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: "#161616",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272A",
    borderStyle: "dashed",
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(163, 230, 53, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    color: "#FAFAFA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#71717A",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyStateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "700",
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.3)",
    borderStyle: "dashed",
  },
  addMoreText: {
    color: "#A3E635",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  bottomPadding: {
    height: 40,
  },
});
