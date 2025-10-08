import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FoodTags({
  foodInput,
  setFoodInput,
  foods,
  addFood,
  removeFood,
  error,
  onHapticFeedback,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Favorite Foods</Text>
      
      <View style={styles.inputRow}>
        <TextInput
          style={styles.foodInput}
          value={foodInput}
          onChangeText={setFoodInput}
          placeholder="Enter a favorite food"
          placeholderTextColor="#999"
          returnKeyType="done"
          onSubmitEditing={addFood}
        />
        <Pressable
          style={[styles.addButton, !foodInput.trim() && styles.addButtonDisabled]}
          onPress={() => {
            if (foodInput.trim()) {
              onHapticFeedback?.();
              addFood();
            }
          }}
          disabled={!foodInput.trim()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {foods.length > 0 && (
        <View style={styles.tagsContainer}>
          {foods.map((food, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{food}</Text>
              <Pressable
                onPress={() => {
                  onHapticFeedback?.();
                  removeFood(index);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color="#999" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  width: "100%",
  marginVertical: 8,
  },
  label: {
    fontSize: 16,
    color: "#fff",
  marginBottom: 8,
  marginTop: 4,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  foodInput: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  addButton: {
    backgroundColor: "#1b56a3ff",
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: "rgba(31, 86, 158, 0.5)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 8,
    gap: 6,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#fff",
  },
});
