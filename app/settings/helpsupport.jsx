import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader'; // Adjust path if needed

const SupportItem = ({ label, iconName, color }) => (
    <Pressable style={styles.menuRow}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Ionicons name={iconName} size={20} color="#fff" />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Ionicons name="chevron-forward" size={22} color="#555" />
    </Pressable>
);

export default function HelpSupport() {
  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Help & Support" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <SupportItem label="FAQ" iconName="help-circle-outline" color="#1abc9c" />
            <SupportItem label="Contact Us" iconName="mail-outline" color="#3498db" />
            <SupportItem label="Terms of Service" iconName="document-text-outline" color="#9b59b6" />
            <SupportItem label="Privacy Policy" iconName="shield-checkmark-outline" color="#2ecc71" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { padding: 15, borderRadius: 24, backgroundColor: "rgba(255, 255, 255, 0.05)" },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 5 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuLabel: { flex: 1, fontSize: 16, color: "#eee", fontWeight: '500' },
});