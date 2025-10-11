import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import SettingsHeader from "../../components/SettingsHeader";

const NotificationToggle = ({ label, initialValue = false }) => {
  const [isEnabled, setIsEnabled] = useState(initialValue);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  return (
    <View style={styles.switchRow}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#00D4AA" }}
        thumbColor={isEnabled ? "#fff" : "#ccc"}
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </View>
  );
};

export default function Notifications() {
  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Notifications" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Workouts & Training Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="barbell-outline" size={24} color="#00D4AA" />
              <Text style={styles.sectionTitle}>Workouts & Training</Text>
            </View>

            <View style={styles.card}>
              <NotificationToggle
                label="Workout Reminders"
                initialValue={true}
              />
              <NotificationToggle label="Rest Day Alerts" initialValue={true} />
              <NotificationToggle
                label="Progress Milestones"
                initialValue={true}
              />
              <NotificationToggle label="Exercise Tips" />
            </View>
          </View>

          {/* Nutrition & Meals Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant-outline" size={24} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Nutrition & Meals</Text>
            </View>

            <View style={styles.card}>
              <NotificationToggle
                label="Meal Plan Reminders"
                initialValue={true}
              />
              <NotificationToggle
                label="Water Intake Alerts"
                initialValue={true}
              />
              <NotificationToggle label="Calorie Goal Updates" />
              <NotificationToggle label="Recipe Suggestions" />
            </View>
          </View>

          {/* Progress & Analytics Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart-outline" size={24} color="#f7971e" />
              <Text style={styles.sectionTitle}>Progress & Analytics</Text>
            </View>

            <View style={styles.card}>
              <NotificationToggle label="Weekly Summary" initialValue={true} />
              <NotificationToggle
                label="Streak Achievements"
                initialValue={true}
              />
              <NotificationToggle label="Body Measurements" />
            </View>
          </View>

          {/* Community Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={24} color="#3498db" />
              <Text style={styles.sectionTitle}>Community</Text>
            </View>

            <View style={styles.card}>
              <NotificationToggle label="New Followers" />
              <NotificationToggle label="Challenges & Events" />
              <NotificationToggle label="Messages" initialValue={true} />
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
});
