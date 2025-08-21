import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader'; // Adjust path if needed

export default function PrivacySecurity() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [isTwoFactor, setIsTwoFactor] = useState(true);

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Privacy & Security" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Privacy</Text>
            <View style={styles.menuRow}>
              <Ionicons name="lock-closed-outline" size={24} color="#3498db" style={styles.icon} />
              <Text style={styles.menuLabel}>Private Account</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#6EE7B7" }}
                thumbColor={isPrivate ? "#fff" : "#f4f3f4"}
                onValueChange={() => setIsPrivate(previousState => !previousState)}
                value={isPrivate}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security</Text>
            <View style={styles.menuRow}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#2ecc71" style={styles.icon} />
              <Text style={styles.menuLabel}>Two-Factor Authentication</Text>
               <Switch
                trackColor={{ false: "#767577", true: "#6EE7B7" }}
                thumbColor={isTwoFactor ? "#fff" : "#f4f3f4"}
                onValueChange={() => setIsTwoFactor(previousState => !previousState)}
                value={isTwoFactor}
              />
            </View>
            <Pressable style={styles.menuRow} onPress={() => console.log("Navigate to Change Password")}>
              <Ionicons name="key-outline" size={24} color="#f1c40f" style={styles.icon} />
              <Text style={styles.menuLabel}>Change Password</Text>
              <Ionicons name="chevron-forward" size={22} color="#555" />
            </Pressable>
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
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15, paddingHorizontal: 5 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 5 },
  icon: { marginRight: 15, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 16, color: "#eee", fontWeight: '500' },
});