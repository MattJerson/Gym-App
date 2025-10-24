import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SettingsHeader from "../../components/SettingsHeader";

export default function HelpSupport() {
  const router = useRouter();

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
              <Pressable 
                style={styles.linkButton}
                onPress={() => router.push("/settings/help/faq")}
              >
                <View style={styles.linkButtonLeft}>
                  <Ionicons name="chatbox-ellipses-outline" size={20} color="#1abc9c" />
                  <Text style={styles.linkButtonText}>FAQ</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>

              <View style={styles.divider} />

              <Pressable 
                style={styles.linkButton}
                onPress={() => router.push("/settings/help/contact")}
              >
                <View style={styles.linkButtonLeft}>
                  <Ionicons name="mail-outline" size={20} color="#4A9EFF" />
                  <Text style={styles.linkButtonText}>Contact Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>

              <View style={styles.divider} />

              <Pressable 
                style={styles.linkButton}
                onPress={() => router.push("/settings/help/my-inquiries")}
              >
                <View style={styles.linkButtonLeft}>
                  <Ionicons name="list-outline" size={20} color="#FFB800" />
                  <Text style={styles.linkButtonText}>My Inquiries</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
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
              <Pressable 
                style={styles.linkButton}
                onPress={() => router.push("/settings/help/terms")}
              >
                <View style={styles.linkButtonLeft}>
                  <Ionicons name="document-outline" size={20} color="#9b59b6" />
                  <Text style={styles.linkButtonText}>Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>

              <View style={styles.divider} />

              <Pressable 
                style={styles.linkButton}
                onPress={() => router.push("/settings/help/privacy-policy")}
              >
                <View style={styles.linkButtonLeft}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#2ecc71" />
                  <Text style={styles.linkButtonText}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* App Information */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#f7971e" />
              <Text style={styles.sectionTitle}>App Information</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Build</Text>
                <Text style={styles.infoValue}>2024.10.23</Text>
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
  linkButton: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  infoRow: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
