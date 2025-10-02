import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader';

export default function MySubscription() {
  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="My Subscription" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Current Plan Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color="#f7971e" />
              <Text style={styles.sectionTitle}>Current Plan</Text>
            </View>
            
            <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.premiumCard}>
              <View style={styles.premiumHeader}>
                  <Text style={styles.premiumTitle}>Premium Plan</Text>
              </View>
              <Text style={styles.premiumText}>Unlimited access to all workout plans, meal preps, nutrition tracking, and advanced analytics.</Text>
              <View style={styles.premiumDetails}>
                <Text style={styles.premiumPrice}>$9.99 / month</Text>
                <Text style={styles.premiumRenewal}>Renews on Sep 20, 2025</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Premium Benefits Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={24} color="#f7971e" />
              <Text style={styles.sectionTitle}>Premium Benefits</Text>
            </View>
            
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Workouts</Text>
                <Text style={styles.valueText}>Custom workout plans tailored to your goals</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nutrition</Text>
                <Text style={styles.valueText}>Personalized meal plans & recipes</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Analytics</Text>
                <Text style={styles.valueText}>Advanced progress tracking & analytics</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Community</Text>
                <Text style={styles.valueText}>Access to exclusive community features</Text>
              </View>
            </View>
          </View>

          {/* Manage Subscription Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={24} color="#9b59b6" />
              <Text style={styles.sectionTitle}>Manage</Text>
            </View>
            
            <View style={styles.card}>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Manage Subscription</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>
              
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Billing History</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>
              
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Redeem Promo Code</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
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
  premiumCard: {
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
  },
  premiumHeader: {
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  premiumText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 20,
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
  card: { 
    padding: 20, 
    borderRadius: 24, 
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  inputGroup: { 
    marginBottom: 18,
  },
  label: { 
    color: '#aaa', 
    fontSize: 13, 
    marginBottom: 8, 
    paddingLeft: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueText: {
    color: '#fff',
    fontSize: 15,
    paddingLeft: 5,
    lineHeight: 20,
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