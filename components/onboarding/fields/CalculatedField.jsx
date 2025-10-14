import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CalculatedField({ field, value, error }) {
  const displayValue = value || "—";
  const isCalculated = value && !isNaN(parseInt(value, 10));

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, styles.readOnly]}>
        <Text style={[styles.valueText, !isCalculated && styles.placeholderText]}>
          {isCalculated ? `${displayValue} cal/day` : field.placeholder}
        </Text>
      </View>
      
      {field.helpText && (
        <Text style={styles.helpText}>
          {field.helpText}
        </Text>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  inputContainer: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  readOnly: {
    backgroundColor: "rgba(100, 100, 100, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  valueText: {
    fontSize: 16,
    color: "#00D4FF",
    fontWeight: "600",
  },
  placeholderText: {
    color: "#666",
    fontWeight: "400",
  },
  helpText: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    marginLeft: 4,
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 6,
    marginLeft: 4,
  },
});
