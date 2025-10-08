import React from "react";
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function WorkoutDetailsModal({ 
  visible, 
  onClose, 
  workout,
  onDelete,
  onEdit
}) {
  if (!workout) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.workoutModal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Workout Details</Text>
          <Text style={styles.modalDate}>
            {new Date(workout.date + "T00:00:00").toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "long", 
              day: "numeric" 
            })}
          </Text>
          
          <ScrollView style={styles.detailsScrollView}>
            <View style={styles.detailsContainer}>
              {workout.type && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={[styles.detailValue, {textTransform: 'capitalize'}]}>
                    {workout.type}
                  </Text>
                </View>
              )}
              
              {workout.duration && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{workout.duration} min</Text>
                </View>
              )}
              
              {workout.type === 'cardio' && workout.distance && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Distance</Text>
                  <Text style={styles.detailValue}>{workout.distance} km</Text>
                </View>
              )}
              
              {workout.type === 'cardio' && workout.pace && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pace</Text>
                  <Text style={styles.detailValue}>{workout.pace} /km</Text>
                </View>
              )}
              
              {workout.type === 'strength' && workout.exercises && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exercises</Text>
                  <Text style={styles.detailValue}>
                    {workout.exercises.join(', ')}
                  </Text>
                </View>
              )}
              
              {workout.note && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Note</Text>
                  <Text style={styles.detailValue}>{workout.note}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <Pressable 
              style={[styles.modalButton, styles.deleteButton]} 
              onPress={() => {
                onClose();
                Alert.alert("Delete", "Delete functionality will be added soon.");
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#FF453A" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
            <Pressable 
              style={[styles.modalButton, styles.editButton]} 
              onPress={() => {
                onClose();
                Alert.alert("Edit", "Edit functionality will be added soon.");
              }}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.modalButtonText}>Edit</Text>
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
  detailsScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
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
  deleteButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    flex: 0.8,
  },
  deleteButtonText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
});
