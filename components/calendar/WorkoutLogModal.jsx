import React from "react";
import { View, Text, Pressable, StyleSheet, Modal, TextInput, Platform, ActionSheetIOS, Alert } from "react-native";
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function WorkoutLogModal({ 
  visible, 
  onClose, 
  selectedDate,
  workoutTypes,
  selectedWorkoutType,
  setSelectedWorkoutType,
  workoutNote,
  setWorkoutNote,
  onLogWorkout
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.workoutModal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Log Workout</Text>
          <Text style={styles.modalDate}>
            {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "long", 
              day: "numeric" 
            })}
          </Text>
          
          <Text style={styles.sectionTitle}>Workout Type</Text>
          <View style={styles.workoutTypeGrid}>
            {workoutTypes.map((type) => (
              <Pressable
                key={type.key}
                style={[
                  styles.workoutTypeButton,
                  { 
                    backgroundColor: type.color,
                    opacity: selectedWorkoutType === type.key ? 1 : 0.6,
                  },
                  selectedWorkoutType === type.key && styles.selectedWorkoutType,
                ]}
                onPress={() => setSelectedWorkoutType(type.key)}
              >
                {type.key === "yoga" ? (
                  <MaterialCommunityIcons name={type.icon} size={22} color="#fff" />
                ) : type.key === "cardio" ? (
                  <MaterialIcons name={type.icon} size={22} color="#fff" />
                ) : type.key === "rest" ? (
                  <Ionicons name={type.icon} size={22} color="#fff" />
                ) : (
                  <FontAwesome5 name={type.icon} size={18} color="#fff" />
                )}
                <Text style={styles.workoutTypeText}>{type.name}</Text>
              </Pressable>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput 
            style={styles.noteInput} 
            placeholder="How was the workout?" 
            placeholderTextColor="#888" 
            value={workoutNote} 
            onChangeText={setWorkoutNote} 
            multiline 
          />
          
          <View style={styles.modalButtons}>
            <Pressable 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onLogWorkout}>
              <LinearGradient
                colors={["#2E4A6F", "#1E3A5F"]}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.modalButtonText}>Log Workout</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  workoutModal: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 15,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalDate: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 25,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#EFEFEF",
    fontWeight: "600",
    marginBottom: 12,
  },
  workoutTypeGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 25,
  },
  workoutTypeButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWorkoutType: {
    borderColor: "#fff",
  },
  workoutTypeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  noteInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 30,
    minHeight: 110,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtons: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 10 
  },
  modalButton: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 18, 
    alignItems: "center", 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 8 
  },
  cancelButton: { 
    backgroundColor: "rgba(255, 255, 255, 0.1)" 
  },
  confirmButton: {},
  modalButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
});
