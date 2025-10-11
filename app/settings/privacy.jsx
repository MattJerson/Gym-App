import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import SettingsHeader from "../../components/SettingsHeader";

export default function PrivacySecurity() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [isTwoFactor, setIsTwoFactor] = useState(true);
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [showMeals, setShowMeals] = useState(true);
  const [showProgress, setShowProgress] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Privacy & Security" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Visibility Settings Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye-outline" size={24} color="#9b59b6" />
              <Text style={styles.sectionTitle}>Visibility Settings</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Show Workouts</Text>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={showWorkouts ? "#fff" : "#ccc"}
                  onValueChange={() =>
                    setShowWorkouts((previousState) => !previousState)
                  }
                  value={showWorkouts}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Show Meal Plans</Text>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={showMeals ? "#fff" : "#ccc"}
                  onValueChange={() =>
                    setShowMeals((previousState) => !previousState)
                  }
                  value={showMeals}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Show Progress Stats</Text>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={showProgress ? "#fff" : "#ccc"}
                  onValueChange={() =>
                    setShowProgress((previousState) => !previousState)
                  }
                  value={showProgress}
                />
              </View>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color="#2ecc71"
              />
              <Text style={styles.sectionTitle}>Security</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Two-Factor Authentication</Text>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={isTwoFactor ? "#fff" : "#ccc"}
                  onValueChange={() =>
                    setIsTwoFactor((previousState) => !previousState)
                  }
                  value={isTwoFactor}
                />
              </View>
              <Text style={styles.helperText}>
                Add an extra layer of security to your account
              </Text>

              <Pressable
                style={styles.linkButton}
                onPress={() => console.log("Navigate to Change Password")}
              >
                <Text style={styles.linkButtonText}>Change Password</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>
            </View>
          </View>

          {/* Data & Storage Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="server-outline" size={24} color="#4A9EFF" />
              <Text style={styles.sectionTitle}>Data & Storage</Text>
            </View>

            <View style={styles.card}>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Download My Data</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>

              <Pressable style={[styles.linkButton, { marginTop: 12 }]}>
                <Text style={[styles.linkButtonText, { color: "#e74c3c" }]}>
                  Delete Account
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#e74c3c" />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    gap: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  label: {
    fontSize: 16,
    color: "#eee",
    fontWeight: "500",
  },
  switchRow: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    justifyContent: "space-between",
  },
  helperText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    paddingLeft: 5,
    lineHeight: 18,
  },
  linkButton: {
    paddingVertical: 14,
    flexDirection: "row",
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkButtonText: {
    fontSize: 16,
    color: "#f7971e",
    fontWeight: "500",
  },
});
