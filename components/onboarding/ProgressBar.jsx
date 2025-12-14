import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

export default function ProgressBar({ currentStep, totalSteps }) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Calculate target progress: 0% for step 1, 50% for step 2, 100% for step 3
  const targetProgress = currentStep === 1 ? 0 : currentStep === 2 ? 50 : 100;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  return (
    <View style={styles.container}>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1E3A5F",
    borderRadius: 8,
  },
});
