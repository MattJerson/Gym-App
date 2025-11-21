import {
  View,
  Text,
  Modal,
  Image,
  Alert,
  FlatList,
  Animated,
  StatusBar,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../services/supabase";
import { useState, useEffect, useRef, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { TrainingDataService } from "../../services/TrainingDataService";
import { ExerciseDataService } from "../../services/ExerciseDataService";
import { CalorieCalculator } from "../../services/CalorieCalculator";

export default function CreateWorkout() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams(); // For edit mode

  // 🔄 Workout creation/editing state
  const isEditMode = !!templateId;
  const [userId, setUserId] = useState(null);
  const [userWeight, setUserWeight] = useState(null); // User's weight for calorie calculation
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
  const [isLoading, setIsLoading] = useState(isEditMode); // Loading if in edit mode
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  
  // Filter state
  const [selectedBodyPart, setSelectedBodyPart] = useState("chest");
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);

  // 🔥 Calculate estimated calories dynamically based on exercises
  const estimatedCalories = useMemo(() => {
    if (!userWeight || exercises.length === 0) return 0;
    return CalorieCalculator.calculateWorkoutCalories(exercises, userWeight);
  }, [exercises, userWeight]);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Body part filters (based on exercises database) - REDESIGNED
  const bodyPartFilters = [
    { id: "chest", label: "Chest", icon: "body", color: "#EF4444" },
    { id: "back", label: "Back", icon: "fitness-outline", color: "#3B82F6" },
    { id: "shoulders", label: "Shoulders", icon: "fitness", color: "#F59E0B" },
    { id: "upper arms", label: "Arms", icon: "barbell", color: "#8B5CF6" },
    { id: "upper legs", label: "Legs", icon: "walk", color: "#10B981" },
    { id: "lower legs", label: "Calves", icon: "walk-outline", color: "#06B6D4" },
    { id: "cardio", label: "Cardio", icon: "heart", color: "#EC4899" },
    { id: "waist", label: "Core", icon: "body-outline", color: "#F59E0B" },
  ];

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

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load workout data if in edit mode
  useEffect(() => {
    if (userId && isEditMode && templateId) {
      loadWorkoutData();
    }
  }, [userId, isEditMode, templateId]);

  const getUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // 🔥 Fetch user weight for calorie calculations
        const weight = await CalorieCalculator.getUserWeight(user.id);
        if (weight) {
          setUserWeight(weight);
        } else {
          console.warn('⚠️ User weight not found, using default 70kg for calculations');
          setUserWeight(70); // Default fallback
        }
        
        // Load exercises after getting user
        loadExerciseLibrary();
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

  const loadWorkoutData = async () => {
    try {
      setIsLoading(true);
      
      // First, try to find in user_saved_workouts (user's personal copy)
      const { data: savedWorkout, error: savedError } = await supabase
        .from('user_saved_workouts')
        .select(`
          *,
          template:workout_templates(
            *,
            exercises:workout_template_exercises(
              *,
              exercise:exercises(
                name
              )
            )
          )
        `)
        .eq('id', templateId)
        .maybeSingle();
      
      let template = null;
      let workoutName = '';
      
      if (savedWorkout?.template) {
        // Found in user_saved_workouts
        template = savedWorkout.template;
        workoutName = savedWorkout.workout_name || template.name || '';
      } else {
        // Not in user_saved_workouts, try direct workout_templates lookup
        // This handles cases where templateId is actually a template_id
        const { data: templateData, error: templateError } = await supabase
          .from('workout_templates')
          .select(`
            *,
            exercises:workout_template_exercises(
              *,
              exercise:exercises(
                name
              )
            )
          `)
          .eq('id', templateId)
          .single();
        
        if (templateError) {
          throw new Error('Workout not found');
        }
        
        template = templateData;
        workoutName = template.name || '';
      }
      
      if (template) {
        // Pre-fill form fields
        setWorkoutName(workoutName);
        setWorkoutDescription(template.description || '');
        setEstimatedDuration((template.duration_minutes || 45).toString());
        setDifficulty(template.difficulty || 'intermediate');
        
        if (template.is_custom) {
          setSelectedColor(template.custom_color || '#3B82F6');
          setSelectedEmoji(template.custom_emoji || '💪');
        }
        
        // Load exercises with proper data structure
        if (template.exercises && template.exercises.length > 0) {
          const loadedExercises = template.exercises.map((ex, idx) => ({
            id: `${ex.id || ex.exercise_id}_${Date.now()}_${idx}`,
            original_exercise_id: ex.exercise_id,
            exercise_id: ex.exercise_id,
            name: ex.exercise?.name || ex.name,
            description: ex.description || '',
            gif_url: ex.gif_url || '',
            target_muscle: ex.target_muscle || '',
            body_part: ex.body_part || '',
            equipment: ex.equipment || [],
            muscle_groups: ex.muscle_groups || [],
            met_value: ex.met_value || 6.0,
            sets: ex.sets || 3,
            reps: ex.reps || '10-12',
            weight: ex.weight || '',
            restTime: ex.rest_time?.toString() || '60',
          }));
          setExercises(loadedExercises);
        }
      } else {
        throw new Error('Workout template not found');
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout data');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadExerciseLibrary = async () => {
    try {
      // Load featured exercises from the new 1500+ exercise database (reduced to 20)
      const featured = await ExerciseDataService.getFeaturedExercises(20);
      if (featured && featured.length > 0) {
        setExerciseLibrary(featured);
      } else {
        console.warn('⚠️ No exercises returned from database');
        // Try a direct query to verify data exists
        const { supabase } = await import('../../services/supabase');
        const { data: testData, error: testError } = await supabase
          .from('exercises')
          .select('id, name')
          .limit(5);
      }
    } catch (error) {
      console.error("Error loading exercise library:", error);
    }
  };
  
  const loadExercisesByBodyPart = async (bodyPart, loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoadingFiltered(true);
      }
      // Calculate the limit based on current exercises
      const currentCount = loadMore ? exerciseLibrary.length : 0;
      const limit = loadMore ? 20 : 20; // Load 20 more when "Load More" is clicked
      
      const exercises = await ExerciseDataService.getExercisesByBodyPart(bodyPart, currentCount + limit);
      setExerciseLibrary(exercises || []);
    } catch (error) {
      console.error("Error loading exercises by body part:", error);
      Alert.alert("Error", "Failed to load exercises for this body part");
    } finally {
      setIsLoadingFiltered(false);
    }
  };
  
  const handleBodyPartChange = (bodyPartId, loadMore = false) => {
    if (!loadMore) {
      setSelectedBodyPart(bodyPartId);
      setSearchQuery(""); // Clear search when changing body part
    }
    loadExercisesByBodyPart(bodyPartId, loadMore);
  };

  const handleAddExercise = (exercise) => {
    // Generate a truly unique ID by combining exercise.id, timestamp, and random string
    const uniqueId = `${exercise.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newExercise = {
      ...exercise,
      id: uniqueId, // Override the id AFTER spreading
      original_exercise_id: exercise.id, // Store original for reference
      sets: 3,
      reps: "10-12",
      weight: "",
      restTime: "60",
      notes: "",
      // Include MET value for calorie calculations
      met_value: exercise.met_value || 6.0, // Default to 6 if not provided
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
        duration: parseInt(estimatedDuration),
        difficulty: difficulty,
        color: selectedColor, // Save the custom color
        emoji: selectedEmoji, // Save the custom emoji
        exercises: exercises.map((ex) => ({
          exercise_id: ex.original_exercise_id || ex.exercise_id || ex.id.split('_')[0],
          name: ex.name,
          description: ex.description || "",
          sets: ex.sets,
          reps: ex.reps,
          restTime: ex.restTime,
          muscle_groups: ex.muscle_groups || [],
          equipment: ex.equipment || [],
          met_value: ex.met_value || 6.0,
        })),
        isCustom: true,
      };

      // Save using TrainingDataService with real user ID
      if (isEditMode && templateId) {
        // Update existing workout
        await TrainingDataService.updateCustomWorkout(userId, templateId, workoutData);
        Alert.alert(
          "Workout Updated! ✅",
          `${workoutName} has been updated successfully`,
          [
            {
              text: "Done",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        // Create new workout
        const savedWorkout = await TrainingDataService.createCustomWorkout(
          userId,
          workoutData
        );
        
        console.log('✅ Workout created successfully:', {
          workoutId: savedWorkout.id,
          exerciseCount: workoutData.exercises.length,
          workoutName: workoutData.name
        });
        
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
      }
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
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Workout' : 'Create Workout'}</Text>
          <Text style={styles.headerSubtitle}>{isEditMode ? 'Update your routine' : 'Build your custom routine'}</Text>
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
              color="#5082B4"
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
                  <Ionicons name="remove" size={20} color="#5082B4" />
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
                  <Ionicons name="add" size={20} color="#5082B4" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Customization Section - Color & Emoji */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={24} color="#5082B4" />
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
                {estimatedCalories > 0 && (
                  <View style={styles.previewCaloriesContainer}>
                    <Ionicons name="flame" size={14} color="#EF4444" />
                    <Text style={styles.previewCalories}>
                      ~{estimatedCalories} calories
                    </Text>
                  </View>
                )}
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
            <Ionicons name="speedometer-outline" size={24} color="#5082B4" />
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
                  size={20}
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
            <Ionicons name="barbell-outline" size={24} color="#5082B4" />
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
                <Ionicons name="add-circle-outline" size={24} color="#1E3A5F" />
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
                  {exercises.length === 0
                    ? "Add exercises to save"
                    : isEditMode
                    ? "Update Workout"
                    : "Save Custom Workout"}
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
        bodyPartFilters={bodyPartFilters}
        selectedBodyPart={selectedBodyPart}
        onBodyPartChange={handleBodyPartChange}
        isLoadingFiltered={isLoadingFiltered}
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
                  <Ionicons name="remove" size={16} color="#5082B4" />
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
                  <Ionicons name="add" size={16} color="#5082B4" />
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
                  <Ionicons name="remove" size={16} color="#5082B4" />
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
                  <Ionicons name="add" size={16} color="#5082B4" />
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
    padding: 18,
    borderWidth: 1.5,
    borderRadius: 18,
    marginBottom: 14,
    borderColor: "#27272A",
    backgroundColor: "#161616",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5082B4",
    shadowColor: "#5082B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  indexText: {
    fontSize: 15,
    color: "#0B0B0B",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    marginBottom: 4,
    color: "#FAFAFA",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  exerciseTarget: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  headerActions: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
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

// Exercise Selection Modal Component - REDESIGNED
function ExerciseSelectionModal({
  visible,
  onClose,
  exerciseLibrary,
  onSelectExercise,
  bodyPartFilters,
  selectedBodyPart,
  onBodyPartChange,
  isLoadingFiltered,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addedExerciseId, setAddedExerciseId] = useState(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);

  const filteredExercises = exerciseLibrary.filter((exercise) => {
    // If no search query, return all exercises
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesName = exercise.name.toLowerCase().includes(searchLower);
    const matchesBodyPart = exercise.body_parts?.some(bp => 
      bp.toLowerCase().includes(searchLower)
    );
    const matchesEquipment = exercise.equipments?.some(eq => 
      eq.toLowerCase().includes(searchLower)
    );
    const matchesMuscle = exercise.target_muscles?.some(m => 
      m.toLowerCase().includes(searchLower)
    );
    
    return matchesName || matchesBodyPart || matchesEquipment || matchesMuscle;
  });

  // Function to capitalize each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Skeleton Loader Component
  const SkeletonExerciseItem = () => (
    <View style={modalStyles.exerciseItem}>
      <View style={[modalStyles.exerciseGif, { backgroundColor: "#27272A" }]} />
      <View style={modalStyles.exerciseInfo}>
        <View style={modalStyles.exerciseDetails}>
          <View style={[modalStyles.skeletonText, { width: "70%", height: 16, marginBottom: 8 }]} />
          <View style={modalStyles.exerciseTags}>
            <View style={[modalStyles.skeletonText, { width: 60, height: 20, borderRadius: 10 }]} />
            <View style={[modalStyles.skeletonText, { width: 50, height: 20, borderRadius: 10, marginLeft: 6 }]} />
          </View>
        </View>
      </View>
      <View style={modalStyles.addButton}>
        <View style={[modalStyles.skeletonText, { width: 24, height: 24, borderRadius: 12 }]} />
      </View>
    </View>
  );

  const handleExerciseAdd = (item) => {
    setAddedExerciseId(item.id);
    onSelectExercise(item);
    setSearchQuery("");
    
    // Collapse the expanded item
    setExpandedExerciseId(null);
    
    // Reset feedback after animation
    setTimeout(() => {
      setAddedExerciseId(null);
    }, 600);
  };

  const toggleExpand = (exerciseId) => {
    setExpandedExerciseId(prev => prev === exerciseId ? null : exerciseId);
  };

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
                {filteredExercises.length} exercises available
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
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

          {/* Body Part Filter Grid - REDESIGNED */}
          <View style={modalStyles.filterSection}>
            <Text style={modalStyles.filterTitle}>Filter by Body Part</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={modalStyles.filterScrollContent}
            >
              {bodyPartFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    modalStyles.filterButton,
                    selectedBodyPart === filter.id && [
                      modalStyles.filterButtonActive,
                      { borderColor: filter.color, backgroundColor: `${filter.color}15` }
                    ]
                  ]}
                  onPress={() => onBodyPartChange(filter.id)}
                >
                  <Ionicons 
                    name={filter.icon} 
                    size={20} 
                    color={selectedBodyPart === filter.id ? filter.color : "#71717A"} 
                  />
                  <Text
                    style={[
                      modalStyles.filterButtonText,
                      selectedBodyPart === filter.id && { color: filter.color, fontWeight: "700" }
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isLoadingFiltered ? (
            <FlatList
              data={[1, 2, 3, 4, 5, 6, 7, 8]}
              keyExtractor={(item) => `skeleton-${item}`}
              renderItem={() => <SkeletonExerciseItem />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={modalStyles.listContent}
            />
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isAdded = addedExerciseId === item.id;
                const isExpanded = expandedExerciseId === item.id;
                return (
                  <View style={modalStyles.exerciseItemWrapper}>
                    <Pressable
                      style={modalStyles.exerciseItem}
                      onPress={() => toggleExpand(item.id)}
                    >
                      {/* Exercise GIF Thumbnail */}
                      {item.gif_url && (
                        <Image
                          source={{ uri: item.gif_url }}
                          style={modalStyles.exerciseGif}
                          resizeMode="cover"
                        />
                      )}
                      <View style={modalStyles.exerciseInfo}>
                        <View style={modalStyles.exerciseDetails}>
                          <Text style={modalStyles.exerciseName}>{capitalizeWords(item.name)}</Text>
                          <View style={modalStyles.exerciseTags}>
                            {item.body_parts && item.body_parts[0] && (
                              <View style={[modalStyles.tag, modalStyles.bodyPartTag]}>
                                <Text style={modalStyles.tagText}>{item.body_parts[0]}</Text>
                              </View>
                            )}
                            {item.equipments && item.equipments[0] && (
                              <View style={[modalStyles.tag, modalStyles.equipmentTag]}>
                                <Text style={modalStyles.tagText}>{item.equipments[0]}</Text>
                              </View>
                            )}
                            {item.target_muscles && item.target_muscles[0] && (
                              <View style={[modalStyles.tag, modalStyles.muscleTag]}>
                                <Text style={modalStyles.tagText}>{item.target_muscles[0]}</Text>
                              </View>
                            )}
                            {item.met_value && (
                              <View style={[modalStyles.tag, modalStyles.metTag]}>
                                <Text style={modalStyles.tagText}>{item.met_value} MET</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <Pressable 
                        style={[
                          modalStyles.addButton,
                          isAdded && modalStyles.addButtonSuccess
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleExerciseAdd(item);
                        }}
                      >
                        <Ionicons 
                          name={isAdded ? "checkmark" : "add"} 
                          size={24} 
                          color={isAdded ? "#FFF" : "#5082B4"} 
                        />
                      </Pressable>
                    </Pressable>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <View style={modalStyles.expandedContent}>
                        {/* Large GIF */}
                        {item.gif_url && (
                          <View style={modalStyles.expandedGifContainer}>
                            <Image
                              source={{ uri: item.gif_url }}
                              style={modalStyles.expandedGif}
                              resizeMode="contain"
                            />
                          </View>
                        )}

                        {/* Description */}
                        {item.description && (
                          <View style={modalStyles.expandedSection}>
                            <Text style={modalStyles.expandedSectionTitle}>Description</Text>
                            <Text style={modalStyles.expandedSectionText}>{item.description}</Text>
                          </View>
                        )}

                        {/* Instructions */}
                        {item.instructions && item.instructions.length > 0 && (
                          <View style={modalStyles.expandedSection}>
                            <Text style={modalStyles.expandedSectionTitle}>Instructions</Text>
                            {item.instructions.map((instruction, index) => (
                              <View key={index} style={modalStyles.instructionRow}>
                                <Text style={modalStyles.instructionNumber}>{index + 1}</Text>
                                <Text style={modalStyles.instructionText}>{instruction}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Additional Info */}
                        <View style={modalStyles.expandedInfoGrid}>
                          {item.body_parts && item.body_parts.length > 0 && (
                            <View style={modalStyles.infoItem}>
                              <Text style={modalStyles.infoLabel}>Body Parts</Text>
                              <Text style={modalStyles.infoValue}>{item.body_parts.join(', ')}</Text>
                            </View>
                          )}
                          {item.target_muscles && item.target_muscles.length > 0 && (
                            <View style={modalStyles.infoItem}>
                              <Text style={modalStyles.infoLabel}>Target Muscles</Text>
                              <Text style={modalStyles.infoValue}>{item.target_muscles.join(', ')}</Text>
                            </View>
                          )}
                          {item.equipments && item.equipments.length > 0 && (
                            <View style={modalStyles.infoItem}>
                              <Text style={modalStyles.infoLabel}>Equipment</Text>
                              <Text style={modalStyles.infoValue}>{item.equipments.join(', ')}</Text>
                            </View>
                          )}
                          {item.met_value && (
                            <View style={modalStyles.infoItem}>
                              <Text style={modalStyles.infoLabel}>Intensity</Text>
                              <Text style={modalStyles.infoValue}>{item.met_value} MET</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={modalStyles.emptyList}>
                  <Ionicons name="search" size={48} color="#52525B" />
                  <Text style={modalStyles.emptyText}>No exercises found</Text>
                  <Text style={modalStyles.emptySubtext}>
                    Try a different search term or filter
                  </Text>
                </View>
              }
              ListFooterComponent={
                !searchQuery && filteredExercises.length > 0 && filteredExercises.length % 20 === 0 ? (
                  <TouchableOpacity 
                    style={modalStyles.loadMoreButton}
                    onPress={() => onBodyPartChange(selectedBodyPart, true)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#5082B4" />
                    <Text style={modalStyles.loadMoreText}>Load More Exercises</Text>
                  </TouchableOpacity>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={modalStyles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.90)",
  },
  container: {
    borderWidth: 1,
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#0B0B0B",
    borderColor: "rgba(80, 130, 180, 0.3)",
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
    color: "#A1A1AA",
    fontWeight: "500",
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
    marginTop: 12,
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
  // REDESIGNED FILTER SECTION
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  filterTitle: {
    fontSize: 12,
    marginBottom: 12,
    color: "#5082B4",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#27272A",
    backgroundColor: "#0B0B0B",
  },
  filterButtonActive: {
    borderWidth: 2,
  },
  filterButtonText: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 15,
    color: "#71717A",
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  exerciseItemWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#27272A",
    overflow: "hidden",
  },
  exerciseItem: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseGif: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#27272A",
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    marginBottom: 6,
    color: "#FAFAFA",
    fontWeight: "700",
  },
  exerciseTags: {
    gap: 6,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  bodyPartTag: {
    backgroundColor: "rgba(80, 130, 180, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(80, 130, 180, 0.25)",
  },
  equipmentTag: {
    backgroundColor: "rgba(80, 130, 180, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(80, 130, 180, 0.2)",
  },
  muscleTag: {
    backgroundColor: "rgba(80, 130, 180, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(80, 130, 180, 0.18)",
  },
  metTag: {
    backgroundColor: "rgba(80, 130, 180, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(80, 130, 180, 0.15)",
  },
  tagText: {
    fontSize: 11,
    color: "#8BAED1",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  addButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(80, 130, 180, 0.4)",
    backgroundColor: "rgba(80, 130, 180, 0.15)",
  },
  addButtonSuccess: {
    borderColor: "#5082B4",
    backgroundColor: "#5082B4",
  },
  skeletonText: {
    backgroundColor: "#27272A",
    borderRadius: 4,
    overflow: "hidden",
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
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(80, 130, 180, 0.4)",
    backgroundColor: "rgba(80, 130, 180, 0.12)",
  },
  loadMoreText: {
    fontSize: 15,
    color: "#5082B4",
    fontWeight: "600",
  },
  // Expanded Content Styles
  expandedContent: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
    backgroundColor: "#0B0B0B",
  },
  expandedGifContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  expandedGif: {
    width: "100%",
    height: "100%",
  },
  expandedSection: {
    marginBottom: 16,
  },
  expandedSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5082B4",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expandedSectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#D4D4D8",
    fontWeight: "500",
  },
  instructionRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingRight: 8,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#5082B4",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
    flexShrink: 0,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#D4D4D8",
    fontWeight: "500",
  },
  expandedInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5082B4",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAFAFA",
    textTransform: "capitalize",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    justifyContent: "space-between",
    borderBottomColor: "rgba(163, 230, 53, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#161616",
    borderColor: "rgba(163, 230, 53, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    marginBottom: 4,
    color: "#FAFAFA",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#5082B4",
    fontWeight: "600",
    letterSpacing: 0.2,
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
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "#0B0B0B",
  },
  progressStep: {
    gap: 10,
    alignItems: "center",
  },
  stepDot: {
    width: 44,
    height: 44,
    borderWidth: 2.5,
    borderRadius: 22,
    alignItems: "center",
    borderColor: "#27272A",
    justifyContent: "center",
    backgroundColor: "#161616",
  },
  stepDotActive: {
    borderWidth: 3,
    borderColor: "#A3E635",
    backgroundColor: "#A3E635",
    shadowColor: "#A3E635",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  stepLabel: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  progressLine: {
    width: 48,
    height: 3,
    marginBottom: 32,
    backgroundColor: "#27272A",
    borderRadius: 2,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    gap: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    color: "#FAFAFA",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  exerciseBadge: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderColor: "rgba(80, 130, 180, 0.4)",
    backgroundColor: "rgba(80, 130, 180, 0.15)",
    shadowColor: "#5082B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseBadgeText: {
    fontSize: 15,
    color: "#5082B4",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 18,
    borderColor: "#27272A",
    backgroundColor: "#161616",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 10,
    color: "#5082B4",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    color: "#FAFAFA",
    fontWeight: "600",
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
  durationButtonIcon: {
    color: "#1E3A5F",
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
  previewCard: {
    padding: 18,
    borderWidth: 1.5,
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  previewColorStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  previewContent: {
    gap: 14,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewEmojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  previewEmoji: {
    fontSize: 36,
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 19,
    color: '#FAFAFA',
    fontWeight: '800',
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  previewMeta: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  previewCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  previewCalories: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
    letterSpacing: 0.2,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  colorOptionSelected: {
    borderColor: '#FAFAFA',
    borderWidth: 4,
    transform: [{ scale: 1.15 }],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  emojiGrid: {
    gap: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  emojiOption: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#27272A',
    backgroundColor: '#161616',
  },
  emojiOptionSelected: {
    borderWidth: 3,
    backgroundColor: '#1C1C1E',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emojiText: {
    fontSize: 30,
  },
  difficultyContainer: {
    gap: 12,
    flexDirection: "row",
  },
  difficultyCard: {
    gap: 10,
    flex: 1,
    padding: 18,
    borderWidth: 2,
    borderRadius: 18,
    alignItems: "center",
    borderColor: "#27272A",
    backgroundColor: "#161616",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  difficultyCardActive: {
    borderWidth: 2.5,
    borderColor: "#5082B4",
    backgroundColor: "rgba(80, 130, 180, 0.12)",
    shadowColor: "#5082B4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  difficultyName: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  difficultyIndicator: {
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    position: "absolute",
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyState: {
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 56,
    alignItems: "center",
    borderStyle: "dashed",
    paddingHorizontal: 32,
    borderColor: "rgba(80, 130, 180, 0.3)",
    backgroundColor: "rgba(80, 130, 180, 0.05)",
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(80, 130, 180, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(80, 130, 180, 0.25)",
  },
  emptyStateText: {
    fontSize: 20,
    marginBottom: 10,
    color: "#FAFAFA",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: "#A1A1AA",
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
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
    gap: 10,
    padding: 18,
    borderWidth: 2,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
    justifyContent: "center",
    backgroundColor: "rgba(80, 130, 180, 0.08)",
    borderColor: "rgba(80, 130, 180, 0.35)",
  },
  addMoreText: {
    fontSize: 17,
    color: "#5082B4",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  fixedSaveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#0B0B0B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 230, 53, 0.15)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  saveButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#A3E635",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 1,
    shadowOpacity: 0,
  },
  saveButtonGradient: {
    gap: 12,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    color: "#0B0B0B",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  saveButtonTextDisabled: {
    color: "#71717A",
  },
  bottomPadding: {
    height: 20,
  },
});