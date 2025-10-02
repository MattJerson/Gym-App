import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader';

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
          
          {/* Account Privacy Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={24} color="#3498db" />
              <Text style={styles.sectionTitle}>Account Privacy</Text>
            </View>
            
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Private Account</Text>
                <Switch
                  trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#00D4AA" }}
                  thumbColor={isPrivate ? "#fff" : "#ccc"}
                  onValueChange={() => setIsPrivate(previousState => !previousState)}
                  value={isPrivate}
                />
              </View>
              <Text style={styles.helperText}>
                When enabled, only approved followers can see your fitness activity
              </Text>
            </View>
          </View>

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
                trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#00D4AA" }}
                thumbColor={showWorkouts ? "#fff" : "#ccc"}
                onValueChange={() => setShowWorkouts(previousState => !previousState)}
                value={showWorkouts}
              />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={styles.label}>Show Meal Plans</Text>
                <Switch
                  trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#00D4AA" }}
                  thumbColor={showMeals ? "#fff" : "#ccc"}
                  onValueChange={() => setShowMeals(previousState => !previousState)}
                  value={showMeals}
                />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={styles.label}>Show Progress Stats</Text>
                <Switch
                  trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#00D4AA" }}
                  thumbColor={showProgress ? "#fff" : "#ccc"}
                  onValueChange={() => setShowProgress(previousState => !previousState)}
                  value={showProgress}
                />
              </View>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#2ecc71" />
              <Text style={styles.sectionTitle}>Security</Text>
            </View>
            
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Two-Factor Authentication</Text>
                <Switch
                  trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#00D4AA" }}
                  thumbColor={isTwoFactor ? "#fff" : "#ccc"}
                  onValueChange={() => setIsTwoFactor(previousState => !previousState)}
                  value={isTwoFactor}
                />
              </View>
              <Text style={styles.helperText}>
                Add an extra layer of security to your account
              </Text>
              
              <Pressable style={styles.linkButton} onPress={() => console.log("Navigate to Change Password")}>
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
                <Text style={[styles.linkButtonText, { color: "#e74c3c" }]}>Delete Account</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: { 
    padding: 20, 
    borderRadius: 24, 
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  label: { 
    color: '#eee', 
    fontSize: 16, 
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  helperText: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
    paddingLeft: 5,
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 5,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#f7971e',
    fontWeight: '500',
  },
});