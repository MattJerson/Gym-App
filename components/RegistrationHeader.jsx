import { useRouter, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import React, { useRef } from "react";

const steps = [
  { path: "/features/basicinfo", name: "Basic Info" },
  { path: "/features/workoutplanning", name: "Workout" },
  { path: "/features/mealplan", name: "Meal Plan" },
];

export default function RegistrationHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const fadeAnim = useRef(new Animated.Value(1)).current; // start fully visible

  const handlePress = (path) => {
    if (pathname === path) return;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.replace(path);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {steps.map((step) => {
          const isActive = pathname === step.path;
          return (
            <Pressable
              key={step.path}
              style={styles.stepButton}
              onPress={() => handlePress(step.path)}
            >
              <Text
                style={[
                  styles.stepText,
                  isActive ? styles.activeText : styles.inactiveText,
                ]}
              >
                {step.name}
              </Text>
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: isActive ? "#ff4d4d" : "transparent" },
                ]}
              />
            </Pressable>
          );
        })}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    width: Dimensions.get("window").width * 0.94,
  },
  stepButton: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "uppercase",
  },
  activeText: {
    color: "#ffffff",
  },
  inactiveText: {
    color: "#888",
  },
  activeIndicator: {
    height: 3,
    width: "60%",
    marginTop: 10,
    borderRadius: 2,
  },
});
