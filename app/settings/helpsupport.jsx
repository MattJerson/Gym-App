import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import SettingsHeader from "../../components/SettingsHeader";

export default function HelpSupport() {
  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Help & Support" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Support Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="help-circle-outline" size={24} color="#1abc9c" />
              <Text style={styles.sectionTitle}>Support</Text>
            </View>

            <View style={styles.card}>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>FAQ</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>

              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Contact Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>
            </View>
          </View>

          {/* Resources Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={24} color="#3498db" />
              <Text style={styles.sectionTitle}>Resources</Text>
            </View>

            <View style={styles.card}>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Training Guides</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>

              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Nutrition Tips</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>
            </View>
          </View>

          {/* Legal Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#9b59b6"
              />
              <Text style={styles.sectionTitle}>Legal</Text>
            </View>

            <View style={styles.card}>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={20} color="#f7971e" />
              </Pressable>

              <Pressable style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Privacy Policy</Text>
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
  linkButton: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    justifyContent: "space-between",
  },
  linkButtonText: {
    fontSize: 16,
    color: "#f7971e",
    fontWeight: "500",
  },
});
