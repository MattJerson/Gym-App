import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MultiButtonField({
  field,
  value = [],
  onChange,
  onPress,
  error,
}) {
  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.multiButtonGridWrapper}>
        <View style={styles.multiButtonGrid}>
        {field.items.map((item) => {
          const isSelected = value?.includes(item.value);
          return (
            <Pressable
              key={item.value}
              style={[
                styles.multiButton,
                isSelected && styles.multiButtonSelected
              ]}
              onPress={() => {
                if (onPress) onPress();
                const currentValues = value || [];
                const newValues = isSelected
                  ? currentValues.filter(v => v !== item.value)
                  : [...currentValues, item.value];
                onChange(newValues);
              }}
            >
              <Text 
                style={[
                  styles.multiButtonText,
                  isSelected && styles.multiButtonTextSelected
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
    marginVertical: 8,
    width: "100%",
  },
  multiButtonGridWrapper: {
    width: "100%",
    alignItems: 'center',
    marginBottom: 8,
  },
  multiButtonGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: 'center',
  },
  multiButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  multiButtonSelected: {
    borderColor: "#00D4AA",
    backgroundColor: "rgba(0, 212, 170, 0.2)",
  },
  multiButtonText: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "600",
    textAlign: "center",
  },
  multiButtonTextSelected: {
    color: "#00D4AA",
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
});
