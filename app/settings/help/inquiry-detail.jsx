import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import SettingsHeader from "../../../components/SettingsHeader";
import { supabase } from "../../../services/supabase";

const statusConfig = {
  new: { label: "New", color: "#4A9EFF", icon: "radio-button-on" },
  in_progress: { label: "In Progress", color: "#FFB800", icon: "time" },
  resolved: { label: "Resolved", color: "#00D4AA", icon: "checkmark-circle" },
  closed: { label: "Closed", color: "#666", icon: "close-circle" },
};

const categoryConfig = {
  technical: { label: "Technical Issue", icon: "bug-outline", color: "#FF6B35" },
  billing: { label: "Billing Question", icon: "card-outline", color: "#4A9EFF" },
  feature_request: { label: "Feature Request", icon: "bulb-outline", color: "#FFB800" },
  general: { label: "General Question", icon: "help-circle-outline", color: "#1abc9c" },
  other: { label: "Other", icon: "chatbubble-outline", color: "#9b59b6" },
};

export default function InquiryDetail() {
  const { id } = useLocalSearchParams();
  const [inquiry, setInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInquiry();
    }
  }, [id]);

  const fetchInquiry = async () => {
    try {
      const { data, error } = await supabase
        .from("user_inquiries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setInquiry(data);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <SettingsHeader title="Inquiry Details" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Loading inquiry...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!inquiry) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <SettingsHeader title="Inquiry Details" />
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF6B35" />
            <Text style={styles.errorTitle}>Inquiry Not Found</Text>
            <Text style={styles.errorText}>
              This inquiry may have been deleted or you don't have permission to view it.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const status = statusConfig[inquiry.status] || statusConfig.new;
  const category = categoryConfig[inquiry.category] || categoryConfig.other;

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Inquiry Details" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status and Category */}
          <View style={styles.headerSection}>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <Ionicons name={status.icon} size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Ionicons name={category.icon} size={18} color={category.color} />
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
          </View>

          {/* Subject */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Subject</Text>
            <Text style={styles.subjectText}>{inquiry.subject}</Text>
          </View>

          {/* Your Message */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Message</Text>
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{inquiry.message}</Text>
              <View style={styles.messageFooter}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.dateText}>{formatDate(inquiry.created_at)}</Text>
              </View>
            </View>
          </View>

          {/* Admin Response */}
          {inquiry.admin_response ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Support Team Response</Text>
              <View style={[styles.messageCard, styles.responseCard]}>
                <View style={styles.responseHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#00D4AA" />
                  <Text style={styles.responseHeaderText}>Official Response</Text>
                </View>
                <Text style={styles.messageText}>{inquiry.admin_response}</Text>
                {inquiry.responded_at && (
                  <View style={styles.messageFooter}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.dateText}>{formatDate(inquiry.responded_at)}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.pendingCard}>
                <Ionicons name="time-outline" size={40} color="#FFB800" />
                <Text style={styles.pendingTitle}>Awaiting Response</Text>
                <Text style={styles.pendingText}>
                  Our support team is reviewing your inquiry. We typically respond within 24-48 hours.
                </Text>
              </View>
            </View>
          )}

          {/* Inquiry Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Inquiry ID:</Text>
              <Text style={styles.infoValue}>{inquiry.id.slice(0, 8)}...</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Submitted:</Text>
              <Text style={styles.infoValue}>{formatDate(inquiry.created_at)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{formatDate(inquiry.updated_at)}</Text>
            </View>
            {inquiry.priority && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Priority:</Text>
                <Text style={[styles.infoValue, styles.priorityText]}>
                  {inquiry.priority.charAt(0).toUpperCase() + inquiry.priority.slice(1)}
                </Text>
              </View>
            )}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    color: "#fff",
    marginTop: 24,
    marginBottom: 12,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    color: "#999",
    lineHeight: 22,
    textAlign: "center",
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subjectText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    lineHeight: 30,
  },
  messageCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  responseCard: {
    backgroundColor: "rgba(0, 212, 170, 0.1)",
    borderColor: "rgba(0, 212, 170, 0.2)",
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 170, 0.2)",
  },
  responseHeaderText: {
    fontSize: 15,
    color: "#00D4AA",
    fontWeight: "700",
  },
  messageText: {
    fontSize: 15,
    color: "#ddd",
    lineHeight: 24,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  dateText: {
    fontSize: 13,
    color: "#666",
  },
  pendingCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255, 184, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.2)",
  },
  pendingTitle: {
    fontSize: 18,
    color: "#FFB800",
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "700",
  },
  pendingText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
    textAlign: "center",
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  infoLabel: {
    fontSize: 14,
    color: "#999",
  },
  infoValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  priorityText: {
    color: "#FFB800",
  },
});
