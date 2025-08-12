// components/ScreenHeader.jsx
import {
  View,
  Text,
  Animated,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

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
      <Pressable
        onPress={() => router.push(backRoute)}
        style={styles.sideContainer}
      >
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
    zIndex: 10,
    elevation: 4,
    marginTop: 70,
    marginBottom: -20,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 15,
    justifyContent: "space-between",
    width: Dimensions.get("window").width,
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
