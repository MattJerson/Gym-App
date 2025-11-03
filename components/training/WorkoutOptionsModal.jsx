import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../services/supabase";

const DAYS_OF_WEEK = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export default function WorkoutOptionsModal({
  visible,
  workout,
  onClose,
  onUpdate,
  onEditCustom, // New prop for editing custom workouts
}) {
  const [selectedDay, setSelectedDay] = useState(
    workout?.is_scheduled ? workout.scheduled_day_of_week : null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  if (!workout) return null;

  const isCustomWorkout = workout?.is_custom === true;

  const handleUpdateDay = async () => {
    if (selectedDay === null) {
      Alert.alert("Select a Day", "Please select a day for this workout");
      return;
    }

    try {
      setIsUpdating(true);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update the user_saved_workouts table
      const { error: updateError } = await supabase
        .from('user_saved_workouts')
        .update({
          scheduled_day_of_week: selectedDay,
          is_scheduled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workout.schedule_id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      Alert.alert(
        "Success",
        `Workout scheduled for ${DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}!`,
        [{ text: "OK", onPress: () => {
          onUpdate();
          onClose();
        }}]
      );
    } catch (error) {
      console.error("Error updating workout day:", error);
      Alert.alert("Error", "Failed to update workout schedule");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveSchedule = async () => {
    try {
      setIsUpdating(true);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Remove schedule from the user_saved_workouts table
      const { error: updateError } = await supabase
        .from('user_saved_workouts')
        .update({
          scheduled_day_of_week: null,
          is_scheduled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workout.schedule_id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSelectedDay(null);

      Alert.alert(
        "Success",
        "Workout schedule removed. You can do this workout anytime!",
        [{ text: "OK", onPress: () => {
          onUpdate();
          onClose();
        }}]
      );
    } catch (error) {
      console.error("Error removing workout schedule:", error);
      Alert.alert("Error", "Failed to remove workout schedule");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWorkout = () => {
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to remove "${workout.workout_name}" from your workouts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsUpdating(true);

              // Get user
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("User not authenticated");

              // Delete from user_saved_workouts
              const { error: deleteError } = await supabase
                .from('user_saved_workouts')
                .delete()
                .eq('id', workout.schedule_id)
                .eq('user_id', user.id);

              if (deleteError) throw deleteError;

              Alert.alert(
                "Deleted",
                "Workout removed from your library",
                [{ text: "OK", onPress: () => {
                  onUpdate();
                  onClose();
                }}]
              );
            } catch (error) {
              console.error("Error deleting workout:", error);
              Alert.alert("Error", "Failed to delete workout");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: `${workout.category_color || "#A3E635"}20` },
                ]}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={workout.category_color || "#A3E635"}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.workoutName} numberOfLines={1}>
                  {workout.workout_name}
                </Text>
                <Text style={[
                  styles.workoutType,
                  isCustomWorkout && styles.customBadge
                ]}>
                  {isCustomWorkout ? 'Custom Workout' : 'Pre-made Workout'}
                </Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FAFAFA" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Edit Custom Workout Button (only for custom workouts) */}
            {isCustomWorkout && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="create-outline" size={16} color="#A3E635" />{" "}
                  Edit Workout
                </Text>
                <Text style={styles.sectionDescription}>
                  Customize all details of your custom workout
                </Text>

                <Pressable
                  style={styles.editButton}
                  onPress={() => {
                    onClose();
                    if (onEditCustom) {
                      onEditCustom(workout);
                    }
                  }}
                >
                  <LinearGradient
                    colors={["#3B82F6", "#2563EB"]}
                    style={styles.editButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="pencil" size={20} color="#FFFFFF" />
                    <Text style={styles.editButtonText}>Edit Custom Workout</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* Schedule Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="calendar-outline" size={16} color="#A3E635" />{" "}
                Schedule Workout
              </Text>
              <Text style={styles.sectionDescription}>
                Choose which day you want to perform this workout, or do it anytime
              </Text>

              <View style={styles.daysGrid}>
                {DAYS_OF_WEEK.map((day) => (
                  <Pressable
                    key={day.value}
                    style={[
                      styles.dayButton,
                      selectedDay === day.value && styles.dayButtonActive,
                    ]}
                    onPress={() => setSelectedDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDay === day.value && styles.dayButtonTextActive,
                      ]}
                    >
                      {day.label.substring(0, 3)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {selectedDay !== null ? (
                <Pressable
                  style={styles.saveButton}
                  onPress={handleUpdateDay}
                  disabled={isUpdating}
                >
                  <LinearGradient
                    colors={["#A3E635", "#84CC16"]}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isUpdating ? (
                      <Text style={styles.saveButtonText}>Updating...</Text>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#0B0B0B" />
                        <Text style={styles.saveButtonText}>Save Schedule</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              ) : workout?.is_scheduled ? (
                <Pressable
                  style={styles.removeScheduleButton}
                  onPress={handleRemoveSchedule}
                  disabled={isUpdating}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                  <Text style={styles.removeScheduleButtonText}>
                    {isUpdating ? "Removing..." : "Remove Schedule"}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.noScheduleInfo}>
                  <Ionicons name="information-circle-outline" size={20} color="#64748B" />
                  <Text style={styles.noScheduleText}>
                    No schedule set. Select a day above to schedule this workout.
                  </Text>
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Delete Section */}
            <View style={styles.section}>
              <Text style={styles.dangerSectionTitle}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />{" "}
                Remove Workout
              </Text>
              <Text style={styles.sectionDescription}>
                Remove this workout from your schedule. You can add it back anytime.
              </Text>

              <Pressable
                style={styles.deleteButton}
                onPress={handleDeleteWorkout}
                disabled={isUpdating}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.deleteButtonText}>Delete from My Workouts</Text>
              </Pressable>
            </View>

            {/* Info Note */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                {isCustomWorkout 
                  ? "Custom workouts can be fully edited. Change exercises, sets, reps, and all workout details."
                  : "Pre-made workouts cannot be customized. You can only change the scheduled day or remove them from your schedule."
                }
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#161616",
    borderRadius: 24,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: "rgba(163, 230, 53, 0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  workoutName: {
    color: "#FAFAFA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  workoutType: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
  },
  customBadge: {
    color: "#3B82F6",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionDescription: {
    color: "#A1A1AA",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  editButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dangerSectionTitle: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0B0B0B",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  dayButtonActive: {
    backgroundColor: "#A3E635",
    borderColor: "#A3E635",
  },
  dayButtonText: {
    color: "#71717A",
    fontSize: 14,
    fontWeight: "700",
  },
  dayButtonTextActive: {
    color: "#0B0B0B",
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "700",
  },
  removeScheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginTop: 12,
  },
  removeScheduleButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  noScheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
    marginTop: 12,
  },
  noScheduleText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#27272A",
    marginVertical: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
