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
          const textLength = item.label.length;
          // static mapping for font sizes depending on rough length
          const fontSize = textLength <= 15 ? 12 : (textLength <= 20 ? 10 : 8);
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
                  { fontSize },
                  isSelected && styles.multiButtonTextSelected
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minWidth: "30%",
    flex: 1,
    flexBasis: "30%",
    maxWidth: "32%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  multiButtonSelected: {
    backgroundColor: "#1E3A5F",
    borderColor: "#1E3A5F",
  },
  multiButtonText: {
  color: "#999",
  fontWeight: "600",
  textAlign: "center",
  lineHeight: 14,
  includeFontPadding: false,
  },
  multiButtonTextSelected: {
    color: "#fff",
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
