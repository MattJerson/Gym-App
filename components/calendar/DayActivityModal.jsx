import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Comprehensive modal showing all activities for a specific day
 * Displays: Workouts, Meals, Steps, Weight measurements, Calorie balance
 */
export default function DayActivityModal({ visible, onClose, dayData, date }) {
  if (!dayData) return null;

  const { workouts, meals, steps, weight, calorieBalance } = dayData;
  
  // Debug log
  console.log('🔍 DayActivityModal rendering:', { 
    visible, 
    date,
    workoutsCount: workouts?.length || 0,
    mealsCount: meals?.length || 0,
    stepsCount: steps?.count || 0,
    hasWeight: !!weight 
  });
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMealIcon = (mealType) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'partly-sunny-outline';
      case 'dinner': return 'moon-outline';
      case 'snack': return 'fast-food-outline';
      default: return 'restaurant-outline';
    }
  };

  const totalMealCalories = meals?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
  const calorieDeficit = (calorieBalance?.calories_burned || 0) - totalMealCalories;
  const isDeficit = calorieDeficit > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{formatDate(date)}</Text>
              <Text style={styles.headerSubtitle}>Daily Activity Summary</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Calorie Balance Card */}
            {calorieBalance && (
              <View style={styles.calorieCard}>
                <View style={styles.calorieHeader}>
                  <Ionicons name="flame" size={24} color="#FF9500" />
                  <Text style={styles.calorieTitle}>Calorie Balance</Text>
                </View>
                <View style={styles.calorieStats}>
                  <View style={styles.calorieRow}>
                    <Text style={styles.calorieLabel}>Consumed</Text>
                    <Text style={styles.calorieValue}>{totalMealCalories} cal</Text>
                  </View>
                  <View style={styles.calorieRow}>
                    <Text style={styles.calorieLabel}>Burned</Text>
                    <Text style={styles.calorieValue}>{calorieBalance.calories_burned} cal</Text>
                  </View>
                  <View style={[styles.calorieRow, styles.calorieTotalRow]}>
                    <Text style={styles.calorieTotalLabel}>
                      {isDeficit ? 'Deficit' : 'Surplus'}
                    </Text>
                    <Text style={[
                      styles.calorieTotalValue,
                      isDeficit ? styles.deficitValue : styles.surplusValue
                    ]}>
                      {Math.abs(calorieDeficit)} cal
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Workouts Section */}
            {workouts && workouts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="barbell" size={20} color="#0A84FF" />
                  <Text style={styles.sectionTitle}>Workouts ({workouts.length})</Text>
                </View>
                {workouts.map((workout, index) => (
                  <View key={index} style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutName}>{workout.workout_name}</Text>
                      {workout.duration_minutes && (
                        <Text style={styles.workoutDuration}>
                          {workout.duration_minutes} min
                        </Text>
                      )}
                    </View>
                    {workout.exercises && workout.exercises.length > 0 && (
                      <View style={styles.exercisesList}>
                        {workout.exercises.map((exercise, exIndex) => (
                          <View key={exIndex} style={styles.exerciseRow}>
                            <Text style={styles.exerciseName}>
                              {typeof exercise === 'string' ? exercise : (exercise.exercise_name || exercise.name || 'Exercise')}
                            </Text>
                            {typeof exercise === 'object' && (exercise.sets || exercise.reps) && (
                              <Text style={styles.exerciseStats}>
                                {exercise.sets || 0} sets × {exercise.reps || 0} reps
                                {exercise.weight && ` @ ${exercise.weight} kg`}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    {workout.calories_burned > 0 && (
                      <View style={styles.workoutFooter}>
                        <Ionicons name="flame-outline" size={14} color="#FF9500" />
                        <Text style={styles.caloriesBurned}>
                          {workout.calories_burned} cal burned
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Meals Section */}
            {meals && meals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="restaurant" size={20} color="#34C759" />
                  <Text style={styles.sectionTitle}>Meals ({meals.length})</Text>
                  <Text style={styles.sectionSubtitle}>{totalMealCalories} cal</Text>
                </View>
                {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                  const mealItems = meals.filter(m => m.meal_type === mealType);
                  if (mealItems.length === 0) return null;
                  
                  const mealTotal = mealItems.reduce((sum, m) => sum + (m.calories || 0), 0);
                  
                  return (
                    <View key={mealType} style={styles.mealTypeCard}>
                      <View style={styles.mealTypeHeader}>
                        <View style={styles.mealTypeTitle}>
                          <Ionicons name={getMealIcon(mealType)} size={18} color="#34C759" />
                          <Text style={styles.mealTypeName}>
                            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                          </Text>
                        </View>
                        <Text style={styles.mealTypeCalories}>{mealTotal} cal</Text>
                      </View>
                      {mealItems.map((meal, index) => (
                        <View key={index} style={styles.mealItem}>
                          <View style={styles.mealItemContent}>
                            <Text style={styles.mealItemName}>{meal.food_name || 'Unknown'}</Text>
                            <View style={styles.mealMacros}>
                              {meal.protein > 0 && (
                                <Text style={styles.macroText}>P: {meal.protein}g</Text>
                              )}
                              {meal.carbs > 0 && (
                                <Text style={styles.macroText}>C: {meal.carbs}g</Text>
                              )}
                              {meal.fats > 0 && (
                                <Text style={styles.macroText}>F: {meal.fats}g</Text>
                              )}
                            </View>
                          </View>
                          <Text style={styles.mealItemCalories}>{meal.calories} cal</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Steps Section */}
            {steps && steps.count > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="footsteps" size={20} color="#FF9500" />
                  <Text style={styles.sectionTitle}>Steps</Text>
                </View>
                <View style={styles.stepsCard}>
                  <View style={styles.stepsContent}>
                    <Text style={styles.stepsCount}>{steps.count.toLocaleString()}</Text>
                    <Text style={styles.stepsLabel}>steps</Text>
                  </View>
                  {steps.calories_burned > 0 && (
                    <View style={styles.stepsCalories}>
                      <Ionicons name="flame-outline" size={16} color="#FF9500" />
                      <Text style={styles.stepsCaloriesText}>
                        {steps.calories_burned} cal
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Weight Section */}
            {weight && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="scale" size={20} color="#AF52DE" />
                  <Text style={styles.sectionTitle}>Weight</Text>
                </View>
                <View style={styles.weightCard}>
                  <Text style={styles.weightValue}>{weight.weight_kg} kg</Text>
                  {weight.notes && (
                    <Text style={styles.weightNotes}>{weight.notes}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Empty State */}
            {(!workouts || workouts.length === 0) &&
             (!meals || meals.length === 0) &&
             (!steps || steps.count === 0) &&
             !weight && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#666" />
                <Text style={styles.emptyTitle}>No Activity Logged</Text>
                <Text style={styles.emptyMessage}>
                  No workouts, meals, steps, or weight measurements were recorded on this day.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  calorieCard: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  calorieTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
  },
  calorieStats: {
    gap: 10,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calorieLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.7)',
  },
  calorieValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  calorieTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 149, 0, 0.3)',
  },
  calorieTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  calorieTotalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  deficitValue: {
    color: '#34C759',
  },
  surplusValue: {
    color: '#FF453A',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
    marginLeft: 'auto',
  },
  workoutCard: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A84FF',
    flex: 1,
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  exercisesList: {
    gap: 8,
  },
  exerciseRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseStats: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  workoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10, 132, 255, 0.2)',
  },
  caloriesBurned: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  mealTypeCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  mealTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  mealTypeCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34C759',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  mealItemContent: {
    flex: 1,
    marginRight: 12,
  },
  mealItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 10,
  },
  macroText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  mealItemCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  stepsCard: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  stepsContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  stepsCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF9500',
  },
  stepsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.7)',
  },
  stepsCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepsCaloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  weightCard: {
    backgroundColor: 'rgba(175, 82, 222, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(175, 82, 222, 0.3)',
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#AF52DE',
    marginBottom: 8,
  },
  weightNotes: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(235, 235, 245, 0.7)',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(235, 235, 245, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
