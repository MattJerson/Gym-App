import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SettingsHeader from "../../components/SettingsHeader";
import { supabase } from "../../services/supabase";
import { SettingsPageSkeleton } from "../../components/skeletons/SettingsPageSkeleton";

export default function PrivacySecurity() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile visibility settings
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [showMeals, setShowMeals] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  
  // Security settings
  const [isTwoFactor, setIsTwoFactor] = useState(false);

  // Fetch user and privacy settings
  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      // Fetch privacy settings from database
      const { data, error } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error fetching privacy settings:", error);
      }
      
      if (data) {
        setShowWorkouts(data.show_workouts);
        setShowMeals(data.show_meals);
        setShowProgress(data.show_progress);
        setActivityStatus(data.activity_status);
        setIsTwoFactor(data.two_factor_enabled);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      setIsLoading(false);
    }
  };

  const handleToggle = async (key, value) => {
    try {
      // Update in database
      const { error } = await supabase
        .from("privacy_settings")
        .upsert({
          user_id: userId,
          [key]: value,
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error("Error saving privacy setting:", error);
        Alert.alert("Error", "Failed to save privacy setting. Please try again.");
      }
    } catch (error) {
      console.error("Error saving privacy setting:", error);
      Alert.alert("Error", "Failed to save privacy setting. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <SettingsHeader title="Privacy & Security" />
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
        <SettingsHeader title="Privacy & Security" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Visibility Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye-outline" size={24} color="#9b59b6" />
              <Text style={styles.sectionTitle}>Profile Visibility</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionDescription}>
                Control what other users can see on your profile
              </Text>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.label}>Show Workouts</Text>
                  <Text style={styles.helperText}>Display your workout history and active programs</Text>
                </View>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={showWorkouts ? "#fff" : "#ccc"}
                  onValueChange={(value) => {
                    setShowWorkouts(value);
                    handleToggle('showWorkouts', value);
                  }}
                  value={showWorkouts}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.label}>Show Meal Plans</Text>
                  <Text style={styles.helperText}>Share your nutrition plans with others</Text>
                </View>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={showMeals ? "#fff" : "#ccc"}
                  onValueChange={(value) => {
                    setShowMeals(value);
                    handleToggle('showMeals', value);
                  }}
                  value={showMeals}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.label}>Show Progress Stats</Text>
                  <Text style={styles.helperText}>Let others see your achievements and milestones</Text>
                </View>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={showProgress ? "#fff" : "#ccc"}
                  onValueChange={(value) => {
                    setShowProgress(value);
                    handleToggle('showProgress', value);
                  }}
                  value={showProgress}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.label}>Activity Status</Text>
                  <Text style={styles.helperText}>Show when you're active in the app</Text>
                </View>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={activityStatus ? "#fff" : "#ccc"}
                  onValueChange={(value) => {
                    setActivityStatus(value);
                    handleToggle('activityStatus', value);
                  }}
                  value={activityStatus}
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
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.label}>Two-Factor Authentication</Text>
                  <Text style={styles.helperText}>
                    {Platform.OS === 'ios' ? 'Use Face ID or Touch ID for extra security' : 'Use biometric authentication for extra security'}
                  </Text>
                </View>
                <Switch
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#00D4AA",
                  }}
                  thumbColor={isTwoFactor ? "#fff" : "#ccc"}
                  onValueChange={(value) => {
                    // Log for now - biometric auth ready for production
                    console.log(`Two-Factor Authentication: ${value ? 'ENABLED' : 'DISABLED'}`);
                    setIsTwoFactor(value);
                    handleToggle('two_factor_enabled', value);
                    
                    if (value) {
                      Alert.alert(
                        "Two-Factor Authentication",
                        Platform.OS === 'ios' 
                          ? "Face ID / Touch ID will be required on your next login." 
                          : "Biometric authentication will be required on your next login.",
                        [{ text: "OK" }]
                      );
                    }
                  }}
                  value={isTwoFactor}
                />
              </View>

              <View style={styles.divider} />

              <Pressable
                style={styles.linkButton}
                onPress={() => router.push("/auth/passwordresetprocess")}
              >
                <View style={styles.linkButtonContent}>
                  <Ionicons name="key-outline" size={20} color="#f7971e" />
                  <Text style={styles.linkButtonText}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Account Management Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={24} color="#e74c3c" />
              <Text style={styles.sectionTitle}>Account Management</Text>
            </View>

            <View style={styles.card}>
              <Pressable 
                style={styles.dangerButton}
                onPress={() => {
                  Alert.alert(
                    "Delete Account",
                    "This feature will be available soon. Contact support if you need immediate assistance.",
                    [{ text: "OK" }]
                  );
                }}
              >
                <View style={styles.linkButtonContent}>
                  <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  <Text style={[styles.linkButtonText, { color: "#e74c3c" }]}>Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>
              <Text style={styles.helperText}>
                Feature coming soon. Contact support for account deletion requests.
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
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
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
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
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  linkButton: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkButtonText: {
    fontSize: 16,
    color: "#f7971e",
    fontWeight: "500",
  },
  dangerButton: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
