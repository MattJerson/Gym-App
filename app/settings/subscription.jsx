import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader'; // Adjust path if needed

export default function MySubscription() {
  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="My Subscription" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
                <Ionicons name="star" size={28} color="#fff" />
                <Text style={styles.premiumTitle}>Premium Plan</Text>
            </View>
            <Text style={styles.premiumText}>You have unlimited access to all workout plans, meal preps, and analytics.</Text>
            <View style={styles.premiumDetails}>
              <Text style={styles.premiumPrice}>$9.99 / month</Text>
              <Text style={styles.premiumRenewal}>Renews on Sep 20, 2025</Text>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Pressable style={styles.menuRow}>
              <Ionicons name="settings-outline" size={24} color="#9b59b6" style={styles.icon} />
              <Text style={styles.menuLabel}>Manage Subscription</Text>
              <Ionicons name="chevron-forward" size={22} color="#555" />
            </Pressable>
            <Pressable style={styles.menuRow}>
              <Ionicons name="receipt-outline" size={24} color="#3498db" style={styles.icon} />
              <Text style={styles.menuLabel}>Billing History</Text>
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
  premiumCard: {
    borderRadius: 24,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  premiumText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 25,
    lineHeight: 22,
  },
  premiumDetails: {
    width: '100%',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  premiumPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  premiumRenewal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  card: { padding: 15, borderRadius: 24, backgroundColor: "rgba(255, 255, 255, 0.05)" },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 5 },
  icon: { marginRight: 15, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 16, color: "#eee", fontWeight: '500' },
});