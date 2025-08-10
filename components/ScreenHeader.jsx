// components/ScreenHeader.jsx
import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ScreenHeader({ title, backRoute }) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
      {/* Back Button */}
      <Pressable onPress={() => router.push(backRoute)} style={styles.sideContainer}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </Pressable>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Spacer to keep layout balanced */}
      <View style={styles.sideContainer} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: Dimensions.get("window").width,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 70,
    marginBottom: -20,
    paddingHorizontal: 15,
    elevation: 4,
    zIndex: 10,
  },
  sideContainer: {
    width: 40,
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    letterSpacing: 2,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },
});
