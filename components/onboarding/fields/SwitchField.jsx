import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

export default function SwitchField({
  field,
  value,
  onChange,
}) {
  return (
    <View style={styles.plainSwitchWrapper}>
      <Text style={styles.plainSwitchLabel}>{field.label}</Text>
      <Switch 
        value={value} 
        onValueChange={onChange} 
        trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#1E3A5F" }} 
        thumbColor={value ? "#FFFFFF" : "#CCCCCC"}
        ios_backgroundColor="rgba(255, 255, 255, 0.1)"
        style={styles.switchTransform}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plainSwitchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: "100%",
    gap: 8,
  },
  plainSwitchLabel: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  switchTransform: {
    transform: [{ scale: 0.7 }],
  },
});
