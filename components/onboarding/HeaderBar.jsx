import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HeaderBar({
  title,
  currentStep,
  totalSteps,
  onBackPress,
  onHapticFeedback,
}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          onHapticFeedback?.();
          onBackPress();
        }}
        style={styles.backButton}
        hitSlop={12}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.stepCounter}>
        {currentStep}/{totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  stepCounter: {
    fontSize: 16,
    color: "#999",
    width: 40,
    textAlign: "right",
  },
});
