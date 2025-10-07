import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const DAYS_OF_WEEK = [
  { id: null, name: "No Schedule", short: "None" },
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
  { id: 0, name: "Sunday", short: "Sun" },
];

export default function SaveWorkoutModal({
  visible,
  onClose,
  onSave,
  onSaveComplete,
  workoutName,
}) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Animation values
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(1)).current;

  const playSuccessAnimation = (result) => {
    setShowSuccessAnimation(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    successScale.setValue(0);
    successOpacity.setValue(0);
    checkmarkScale.setValue(0);

    Animated.timing(blurOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setShowSuccessAnimation(false);
          successScale.setValue(0);
          successOpacity.setValue(0);
          checkmarkScale.setValue(0);
          blurOpacity.setValue(1);
          handleClose();
          
          if (onSaveComplete && result) {
            onSaveComplete(result);
          }
        }, 600);
      });
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await onSave({
        scheduledDay: selectedDay,
        startNow: false,
      });
      
      if (result && result.success) {
        playSuccessAnimation(result);
      }
    } catch (error) {
      console.error('Save workout error:', error);
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedDay(null);
    setIsSaving(false);
    onClose();
  };

  const handleDaySelect = (dayId) => {
    setSelectedDay(dayId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="bookmark" size={22} color="#A3E635" />
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#999" />
              </Pressable>
            </View>
            <Text style={styles.title}>Save Workout</Text>
            <Text style={styles.workoutName}>{workoutName}</Text>
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, { opacity: blurOpacity }]}>
            <Text style={styles.label}>Schedule for a day</Text>
            
            {/* Day Selection Grid */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContainer}
            >
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDay === day.id;
                return (
                  <Pressable
                    key={day.id ?? 'none'}
                    style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                    onPress={() => handleDaySelect(day.id)}
                  >
                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                      {day.short}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Selected Day Display */}
            {selectedDay !== null && (
              <View style={styles.selectedDayBanner}>
                <Ionicons name="calendar" size={18} color="#A3E635" />
                <Text style={styles.selectedDayText}>
                  {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.name}
                </Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
              <Text style={styles.infoText}>
                This workout will be saved to "My Workouts" where you can access it anytime.
              </Text>
            </View>
          </Animated.View>

          {/* Actions */}
          <View style={styles.footer}>
            <Pressable style={styles.btnCancel} onPress={handleClose} disabled={isSaving}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.btnSave, isSaving && styles.btnSaveDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Text style={styles.btnSaveText}>Saving...</Text>
              ) : (
                <>
                  <Ionicons name="bookmark" size={16} color="#000" />
                  <Text style={styles.btnSaveText}>Save Workout</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Success Animation */}
          {showSuccessAnimation && (
            <View style={styles.successOverlay}>
              <Animated.View
                style={[
                  styles.successCircle,
                  {
                    opacity: successOpacity,
                    transform: [{ scale: successScale }],
                  },
                ]}
              >
                <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                  <Ionicons name="checkmark" size={50} color="#fff" />
                </Animated.View>
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#0B0B0B",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(163, 230, 53, 0.25)",
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(163, 230, 53, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    color: "#FAFAFA",
    fontWeight: "700",
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 15,
    color: "#A3E635",
    fontWeight: "600",
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 15,
    color: "#E5E5E5",
    fontWeight: "600",
    marginBottom: 12,
  },
  daysScrollContainer: {
    paddingBottom: 4,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 8,
  },
  dayChipSelected: {
    backgroundColor: "rgba(163, 230, 53, 0.15)",
    borderColor: "#A3E635",
  },
  dayChipText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  dayChipTextSelected: {
    color: "#A3E635",
  },
  selectedDayBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(163, 230, 53, 0.12)",
    borderRadius: 12,
  },
  selectedDayText: {
    fontSize: 15,
    color: "#A3E635",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.15)",
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#93C5FD",
    fontWeight: "500",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  btnCancelText: {
    fontSize: 15,
    color: "#D4D4D8",
    fontWeight: "600",
  },
  btnSave: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#A3E635",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  btnSaveDisabled: {
    backgroundColor: "#52525B",
  },
  btnSaveText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "700",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
  },
});
