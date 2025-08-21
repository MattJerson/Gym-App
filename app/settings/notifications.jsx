import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader'; // Adjust path if needed

const NotificationToggle = ({ label, iconName, color, initialValue = false }) => {
    const [isEnabled, setIsEnabled] = useState(initialValue);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    return (
        <View style={styles.menuRow}>
            <Ionicons name={iconName} size={24} color={color} style={styles.icon} />
            <Text style={styles.menuLabel}>{label}</Text>
            <Switch
                trackColor={{ false: "#767577", true: "#6EE7B7" }}
                thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
                onValueChange={toggleSwitch}
                value={isEnabled}
            />
        </View>
    );
};

export default function Notifications() {
  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Notifications" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Workouts & Meals</Text>
            <NotificationToggle label="Workout Reminders" iconName="barbell-outline" color="#6EE7B7" initialValue={true} />
            <NotificationToggle label="Meal Plan Alerts" iconName="restaurant-outline" color="#5b86e5" initialValue={true} />
            <NotificationToggle label="Progress Updates" iconName="trending-up-outline" color="#f7971e" />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Social</Text>
            <NotificationToggle label="New Followers" iconName="people-outline" color="#3498db" />
            <NotificationToggle label="Post Likes" iconName="heart-outline" color="#e74c3c" initialValue={true} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { padding: 15, borderRadius: 24, marginBottom: 20, backgroundColor: "rgba(255, 255, 255, 0.05)" },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10, paddingHorizontal: 5 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 5 },
  icon: { marginRight: 15, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 16, color: "#eee", fontWeight: '500' },
});