import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "../../services/supabase";
import WorkoutOptionsModal from "./WorkoutOptionsModal";
import { MyWorkoutsSkeleton } from "../skeletons/MyWorkoutsSkeleton";

// Get screen dimensions
const { width } = Dimensions.get("window");

// Card dimensions - more compact
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 14;
const VISIBLE_CARDS = 1.3; // Show more of next card

const CARD_WIDTH = (width - 40 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;
const CARD_HEIGHT = 220; // Increased for better spacing

// Difficulty badge colors
const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "Beginner":
      return "#10B981";
    case "Intermediate":
      return "#F59E0B";
    case "Advanced":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

// Workout Card Component - Redesigned with category glows
const WorkoutCardItem = ({ item, onPress, onOptions }) => {
  const difficultyColor = getDifficultyColor(item.difficulty);
  const dayLabel = item.is_scheduled && item.scheduled_day_name 
    ? item.scheduled_day_name 
    : null;
  
  // Determine if custom workout
  const isCustom = item.is_custom === true;
  
  // Use custom color/emoji if available, otherwise use category defaults
  const cardColor = isCustom && item.custom_color 
    ? item.custom_color 
    : (item.category_color || item.color || '#3B82F6');
  
  const cardIcon = isCustom && item.custom_emoji 
    ? null // We'll render emoji as text
    : (item.category_icon || item.icon || 'dumbbell');
    
  const cardEmoji = isCustom && item.custom_emoji 
    ? item.custom_emoji 
    : null;
  
  // Get workout type label with safe fallbacks
  const workoutTypeLabel = item.is_assigned 
    ? 'ASSIGNED' 
    : (isCustom ? 'CUSTOM' : (item.workout_type ? item.workout_type.toUpperCase() : 'PRE-MADE'));

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]} 
      onPress={onPress}
    >
      <View style={[styles.cardInner, { backgroundColor: `${cardColor}18` }]}>
        {/* Color accent stripe */}
        <View style={[styles.colorStripe, { backgroundColor: cardColor }]} />
        
        {/* Header: Type badge and options */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { 
              backgroundColor: `${cardColor}25`,
              borderColor: `${cardColor}50`,
            }]}>
              <Text style={[styles.typeText, { color: '#FFF' }]}>
                {workoutTypeLabel}
              </Text>
            </View>
            {dayLabel && (
              <View style={styles.dayBadge}>
                <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.8)" />
                <Text style={styles.dayText}>
                  {dayLabel.substring(0, 3).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Pressable 
            style={styles.optionsButton}
            onPress={(e) => {
              e.stopPropagation();
              onOptions(item.id);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        {/* Workout name with icon */}
        <View style={styles.nameRow}>
          <View style={[styles.iconBadge, { backgroundColor: `${cardColor}30` }]}>
            {cardEmoji ? (
              <Text style={styles.emojiIcon}>{cardEmoji}</Text>
            ) : (
              <MaterialCommunityIcons name={cardIcon} size={20} color="#FFF" />
            )}
          </View>
          <Text style={styles.workoutName} numberOfLines={2}>
            {item.workout_name || item.name}
          </Text>
        </View>

        {/* Description (if exists) */}
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Difficulty & Duration Row */}
        <View style={styles.metaRow}>
          <View style={[styles.difficultyBadge, { borderColor: `${difficultyColor}50` }]}>
            <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
            <Text style={styles.difficultyText}>
              {item.difficulty}
            </Text>
          </View>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.durationText}>{item.duration_minutes}min</Text>
          </View>
        </View>

        {/* Stats Row - Exercises & Completions */}
        <View style={[styles.statsRow, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="dumbbell" size={13} color="#A3E635" />
            <Text style={styles.statText}>
              {item.exercise_count || 0} exercises
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-done" size={13} color="#60A5FA" />
            <Text style={styles.statText}>
              {item.times_completed || 0} completed
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function MyWorkouts({
  onSelectWorkout = () => {},
  onWorkoutOptions = () => {},
  onScheduleChange = () => {},
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMyWorkouts();
    }
  }, [userId]);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      setIsLoading(false);
    }
  };

  const loadMyWorkouts = async () => {
    try {
      setIsLoading(true);
      
      // Load both saved workouts and assigned workouts
      const [savedResult, assignedResult] = await Promise.all([
        // Saved workouts (includes public/template workouts user has saved)
        supabase
          .from('user_saved_workouts')
          .select(`
            id,
            template_id,
            workout_name,
            workout_type,
            scheduled_day_of_week,
            is_scheduled,
            times_completed,
            last_completed_at,
            total_time_spent,
            total_calories_burned,
            is_favorite,
            custom_notes,
            created_at,
            template:workout_templates(
              id,
              name,
              description,
              difficulty,
              duration_minutes,
              estimated_calories,
              is_custom,
              custom_color,
              custom_emoji,
              equipment,
              muscle_groups,
              assignment_type,
              created_by_user_id,
              category:workout_categories(
                name,
                color,
                icon
              ),
              exercises:workout_template_exercises(
                id,
                sets,
                reps,
                order_index,
                exercise:exercises(
                  name
                )
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        
        // Assigned workouts from coach/manager (explicit assignments only)
        supabase.rpc('get_user_assigned_workouts', { p_user_id: userId })
      ]);
      
      const { data: savedData, error: savedError } = savedResult;
      const { data: assignedData, error: assignedError } = assignedResult;
      
      if (savedError) throw savedError;

      // Day of week names
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // For saved workouts with 0 exercises in workout_template_exercises,
      // check if they have exercises in workout_exercises table (for assigned/custom workouts)
      const workoutsWithNoExercises = (savedData || []).filter(w => 
        !w.template?.exercises || w.template.exercises.length === 0
      );
      
      if (workoutsWithNoExercises.length > 0) {
        const templateIds = workoutsWithNoExercises.map(w => w.template_id);
        const { data: customExercises } = await supabase
          .from('workout_exercises')
          .select('template_id, id, sets, reps, rest_seconds, order_index, exercise_name')
          .in('template_id', templateIds);
        
        // Merge custom exercises into the templates
        if (customExercises && customExercises.length > 0) {
          workoutsWithNoExercises.forEach(workout => {
            const exercises = customExercises.filter(ex => ex.template_id === workout.template_id);
            if (exercises.length > 0 && workout.template) {
              workout.template.exercises = exercises.map(ex => ({
                id: ex.id,
                sets: ex.sets,
                reps: ex.reps,
                rest_seconds: ex.rest_seconds,
                order_index: ex.order_index,
                exercise: { name: ex.exercise_name }
              }));
            }
          });
        }
      }
      
      // Transform saved workouts (includes all saved workouts: custom, public/template)
      const transformedSavedWorkouts = (savedData || []).map(workout => {
        const template = workout.template;
        const exerciseCount = template?.exercises?.length || 0;
        
        // Calculate total sets
        const totalSets = template?.exercises?.reduce((sum, ex) => sum + (ex.sets || 0), 0) || 0;
        
        // Get equipment list (unique values)
        const equipmentList = template?.equipment || [];
        
        // Get muscle groups
        const muscleGroups = template?.muscle_groups || [];
        
        // Calculate average completion time if workout has been done
        const avgTimePerCompletion = workout.times_completed > 0 
          ? Math.round(workout.total_time_spent / workout.times_completed) 
          : template?.duration_minutes || 0;

        return {
          id: workout.id,
          schedule_id: workout.id,
          workout_name: workout.workout_name || template?.name || 'Untitled Workout',
          description: template?.description || '',
          workout_type: workout.workout_type || 'Pre-Made',
          category_color: template?.category?.color || '#A3E635',
          category_icon: template?.category?.icon || '💪',
          custom_color: template?.custom_color,
          custom_emoji: template?.custom_emoji,
          difficulty: template?.difficulty || 'Intermediate',
          duration_minutes: template?.duration_minutes || 30,
          times_completed: workout.times_completed || 0,
          is_scheduled: workout.is_scheduled || false,
          scheduled_day_name: workout.scheduled_day_of_week !== null ? dayNames[workout.scheduled_day_of_week] : null,
          scheduled_day_of_week: workout.scheduled_day_of_week,
          is_favorite: workout.is_favorite || false,
          template_id: workout.template_id,
          is_custom: template?.is_custom || false,
          exercise_count: exerciseCount,
          total_sets: totalSets,
          equipment: equipmentList,
          muscle_groups: muscleGroups,
          last_completed_at: workout.last_completed_at,
          total_calories_burned: workout.total_calories_burned || 0,
          avg_time_per_completion: avgTimePerCompletion,
          estimated_calories: template?.estimated_calories || 0,
          is_assigned: false,
          source_type: null,
        };
      });
      
      // Transform assigned workouts
      const transformedAssignedWorkouts = (assignedData || []).map(workout => ({
        id: `assigned_${workout.workout_id}`,
        schedule_id: `assigned_${workout.workout_id}`,
        workout_name: workout.workout_name || 'Assigned Workout',
        description: workout.workout_description || '',
        workout_type: 'Assigned by Coach',
        category_color: workout.category_name ? '#8B5CF6' : '#A3E635', // Purple for assigned
        category_icon: '🎯',
        custom_color: null,
        custom_emoji: null,
        difficulty: workout.difficulty || 'Intermediate',
        duration_minutes: workout.duration_minutes || 30,
        times_completed: 0,
        is_scheduled: false,
        scheduled_day_name: null,
        scheduled_day_of_week: null,
        is_favorite: false,
        template_id: workout.workout_id,
        is_custom: false,
        exercise_count: workout.exercise_count || 0,
        total_sets: 0,
        equipment: [],
        muscle_groups: [],
        last_completed_at: null,
        total_calories_burned: 0,
        avg_time_per_completion: workout.duration_minutes || 0,
        estimated_calories: 0,
        is_assigned: true,
        source_type: workout.source_type || 'assigned',
        assigned_by: workout.assigned_by,
      }));
      
      // Combine both lists, with assigned workouts first
      const combinedWorkouts = [...transformedAssignedWorkouts, ...transformedSavedWorkouts];
      
      setWorkouts(combinedWorkouts);
    } catch (error) {
      console.error('Error loading my workouts:', error);
      Alert.alert('Error', 'Failed to load your workouts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkoutOptions = (workoutId) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      setSelectedWorkout(workout);
      setShowOptionsModal(true);
    }
  };

  const handleModalClose = () => {
    setShowOptionsModal(false);
    setSelectedWorkout(null);
  };

  const handleWorkoutUpdate = () => {
    // Reload workouts after update
    loadMyWorkouts();
    // Notify parent to refresh (for Today's Workout section)
    onScheduleChange();
  };

  const handleEditCustomWorkout = async (workout) => {
    // Navigate to create-workout page in edit mode with workout data
    if (workout.template_id) {
      router.push(`/training/create-workout?templateId=${workout.template_id}`);
    } else if (workout.id) {
      router.push(`/training/create-workout?templateId=${workout.id}`);
    } else {
      Alert.alert("Error", "Unable to edit this workout");
    }
  };

  if (isLoading) {
    return <MyWorkoutsSkeleton />;
  }

  // Always show placeholder card - if empty, show only placeholder; if has workouts, add at end
  const workoutsWithPlaceholder = workouts.length === 0 
    ? [{ id: 'create-placeholder', isPlaceholder: true }]
    : [...workouts, { id: 'create-placeholder', isPlaceholder: true }];

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>My Workouts</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => router.push("/training/create-workout")}
        >
          <Ionicons name="add" size={24} color="#A3E635" />
        </Pressable>
      </View>
      
      <FlatList
        data={workoutsWithPlaceholder}
        renderItem={({ item }) => {
          if (item.isPlaceholder) {
            return (
              <Pressable 
                style={styles.card}
                onPress={() => router.push("/training/create-workout")}
              >
                <View style={styles.placeholderCard}>
                  <View style={styles.placeholderIconContainer}>
                    <Ionicons name="add-circle" size={48} color="#A3E635" />
                  </View>
                  <Text style={styles.placeholderTitle}>Create Workout</Text>
                  <Text style={styles.placeholderSubtitle}>Design your own routine</Text>
                </View>
              </Pressable>
            );
          }
          return (
            <WorkoutCardItem
              item={item}
              onPress={() => onSelectWorkout(item.template_id)}
              onOptions={handleWorkoutOptions}
            />
          );
        }}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContentContainer}
        snapToInterval={CARD_WIDTH + CARD_MARGIN_RIGHT}
        decelerationRate="fast"
        snapToAlignment="start"
      />

      {/* Workout Options Modal */}
      <WorkoutOptionsModal
        visible={showOptionsModal}
        workout={selectedWorkout}
        onClose={handleModalClose}
        onUpdate={handleWorkoutUpdate}
        onEditCustom={handleEditCustomWorkout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163, 230, 53, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(163, 230, 53, 0.3)",
    shadowColor: "#A3E635",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  listContentContainer: {
    paddingRight: PADDING_HORIZONTAL * 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN_RIGHT,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardInner: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  colorStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  placeholderCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 230, 53, 0.05)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(163, 230, 53, 0.25)',
  },
  placeholderIconContainer: {
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 16,
    color: '#FAFAFA',
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  placeholderSubtitle: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  typeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  dayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dayText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  optionsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  workoutName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: 'rgba(255, 255, 255, 0.9)',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  durationText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 0,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statDivider: {
    width: 1,
    height: 14,
  },
  equipmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  equipmentText: {
    flex: 1,
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.65)",
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 17,
    marginBottom: 10,
  },
  loadingContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
