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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
        setNotificationsEnabled(data.notifications_enabled !== false); // Default to true
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in fetchPreferences:", error);
      setIsLoading(false);
    }
  };

  const updateNotificationSetting = async (value) => {
    try {
      // Optimistic update
      setNotificationsEnabled(value);
      
      // Update in database
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          notifications_enabled: value,
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error("Error updating notification setting:", error);
        // Revert on error
        setNotificationsEnabled(!value);
        Alert.alert("Error", "Failed to update notification setting. Please try again.");
      } else {
        // Show confirmation
        Alert.alert(
          value ? "Notifications Enabled" : "Notifications Disabled",
          value 
            ? "You will receive all app notifications."
            : "You will not receive any notifications. Important security alerts will still be delivered.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error in updateNotificationSetting:", error);
      // Revert on error
      setNotificationsEnabled(!value);
      Alert.alert("Error", "Failed to update notification setting. Please try again.");
    }
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
          {/* Master Notification Toggle */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={24} color="#00D4AA" />
              <Text style={styles.sectionTitle}>Notification Settings</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionDescription}>
                Control whether you receive notifications from the app
              </Text>

              <View style={styles.masterToggleContainer}>
                <View style={styles.masterToggleIcon}>
                  <Ionicons 
                    name={notificationsEnabled ? "notifications" : "notifications-off"} 
                    size={32} 
                    color={notificationsEnabled ? "#00D4AA" : "#666"} 
                  />
                </View>
                
                <View style={styles.masterToggleContent}>
                  <Text style={styles.masterToggleTitle}>
                    {notificationsEnabled ? "Notifications Enabled" : "Notifications Disabled"}
                  </Text>
                  <Text style={styles.masterToggleDescription}>
                    {notificationsEnabled 
                      ? "You're receiving all app notifications" 
                      : "You won't receive any notifications"}
                  </Text>
                </View>

                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={notificationsEnabled ? "#fff" : "#ccc"}
                  onValueChange={updateNotificationSetting}
                  value={notificationsEnabled}
                  disabled={isLoading}
                  style={styles.masterToggleSwitch}
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.helperText}>
                <Ionicons name="shield-checkmark" size={14} color="#00D4AA" /> Critical security and account notifications will always be delivered regardless of this setting.
              </Text>
            </View>
          </View>

          {/* Notification Types Info */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#4A9EFF" />
              <Text style={styles.sectionTitle}>What You'll Receive</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.infoItem}>
                <Ionicons name="barbell" size={20} color="#00D4AA" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Workout Updates</Text>
                  <Text style={styles.infoDescription}>
                    Reminders for scheduled workouts, rest days, and progress milestones
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="restaurant" size={20} color="#FF6B35" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Nutrition & Meals</Text>
                  <Text style={styles.infoDescription}>
                    Meal reminders, hydration alerts, and calorie tracking updates
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="trophy" size={20} color="#FFB800" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Achievements</Text>
                  <Text style={styles.infoDescription}>
                    Streak milestones, challenge events, and weekly summaries
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="megaphone" size={20} color="#9b59b6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Admin Updates</Text>
                  <Text style={styles.infoDescription}>
                    Important announcements and new feature releases
                  </Text>
                </View>
              </View>
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
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  masterToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  masterToggleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  masterToggleContent: {
    flex: 1,
  },
  masterToggleTitle: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
  },
  masterToggleDescription: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
  masterToggleSwitch: {
    transform: [{ scale: 1.1 }],
  },
  divider: {
    height: 1,
    marginVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    lineHeight: 18,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
});
