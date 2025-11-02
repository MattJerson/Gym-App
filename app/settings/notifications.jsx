import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SettingsHeader from "../../components/SettingsHeader";
import { supabase } from "../../services/supabase";
import { SettingsPageSkeleton } from "../../components/skeletons/SettingsPageSkeleton";


export default function Notifications() {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    // Workouts & Training
    workout_reminders: true,
    rest_day_alerts: true,
    progress_milestones: true,
    // Nutrition & Meals
    meal_reminders: true,
    water_alerts: true,
    calorie_updates: false,
    // Progress & Analytics
    weekly_summary: true,
    streak_achievements: true,
    challenge_events: false,
    // Admin Broadcasts
    admin_broadcasts: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      // Fetch notification preferences from database
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error fetching preferences:", error);
      }
      
      if (data) {
        setPreferences({
          workout_reminders: data.workout_reminders,
          rest_day_alerts: data.rest_day_alerts,
          progress_milestones: data.progress_milestones,
          meal_reminders: data.meal_reminders,
          water_alerts: data.water_alerts,
          calorie_updates: data.calorie_updates,
          weekly_summary: data.weekly_summary,
          streak_achievements: data.streak_achievements,
          challenge_events: data.challenge_events,
          admin_broadcasts: data.admin_broadcasts,
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in fetchPreferences:", error);
      setIsLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      // Optimistic update
      setPreferences(prev => ({ ...prev, [key]: value }));
      
      // Update in database
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          [key]: value,
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error("Error updating preference:", error);
        // Revert on error
        setPreferences(prev => ({ ...prev, [key]: !value }));
        Alert.alert("Error", "Failed to update notification preference. Please try again.");
      }
    } catch (error) {
      console.error("Error in updatePreference:", error);
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
      Alert.alert("Error", "Failed to update notification preference. Please try again.");
    }
  };

  const NotificationToggle = ({ label, prefKey, description }) => {
    return (
      <View style={styles.switchRow}>
        <View style={styles.switchLabelContainer}>
          <Text style={styles.label}>{label}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
        <Switch
          trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#00D4AA" }}
          thumbColor={preferences[prefKey] ? "#fff" : "#ccc"}
          onValueChange={(value) => updatePreference(prefKey, value)}
          value={preferences[prefKey]}
          disabled={isLoading}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <SettingsHeader title="Notifications" />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <SettingsPageSkeleton />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

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
                prefKey="workout_reminders"
                description="Get notified about your scheduled workouts"
              />
              <NotificationToggle 
                label="Rest Day Alerts" 
                prefKey="rest_day_alerts"
                description="Reminders to take rest days and recover"
              />
              <NotificationToggle
                label="Progress Milestones"
                prefKey="progress_milestones"
                description="Celebrate your achievements and PRs"
              />
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
                label="Meal Reminders"
                prefKey="meal_reminders"
                description="Stay on track with your meal plan"
              />
              <NotificationToggle
                label="Water Intake Alerts"
                prefKey="water_alerts"
                description="Stay hydrated throughout the day"
              />
              <NotificationToggle 
                label="Calorie Goal Updates"
                prefKey="calorie_updates"
                description="Track your daily calorie progress"
              />
            </View>
          </View>

          {/* Progress & Analytics Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart-outline" size={24} color="#f7971e" />
              <Text style={styles.sectionTitle}>Progress & Analytics</Text>
            </View>

            <View style={styles.card}>
              <NotificationToggle 
                label="Weekly Summary" 
                prefKey="weekly_summary"
                description="Your weekly progress report"
              />
              <NotificationToggle
                label="Streak Achievements"
                prefKey="streak_achievements"
                description="Keep your workout streak alive"
              />
              <NotificationToggle 
                label="Challenge Events"
                prefKey="challenge_events"
                description="Participate in community challenges"
              />
            </View>
          </View>

          {/* System Notifications Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="megaphone-outline" size={24} color="#9b59b6" />
              <Text style={styles.sectionTitle}>System Notifications</Text>
            </View>

            <View style={styles.card}>
              <NotificationToggle 
                label="Admin Broadcasts"
                prefKey="admin_broadcasts"
                description="Important updates and announcements"
              />
              <Text style={styles.helperText}>
                Note: Critical security and account notifications cannot be disabled
              </Text>
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
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
});
