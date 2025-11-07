import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SettingsHeader from "../../../components/SettingsHeader";
import { supabase } from "../../../services/supabase";
import { MyInquiriesPageSkeleton } from "../../../components/skeletons/MyInquiriesPageSkeleton";

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

export default function MyInquiries() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_inquiries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInquiries(data || []);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInquiries();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <SettingsHeader title="My Inquiries" />
          <MyInquiriesPageSkeleton />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="My Inquiries" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00D4AA"
            />
          }
        >
          {inquiries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#666" />
              </View>
              <Text style={styles.emptyTitle}>No Inquiries Yet</Text>
              <Text style={styles.emptyText}>
                You haven't submitted any support inquiries. If you need help, feel free to contact our support team.
              </Text>
              <Pressable
                style={styles.contactButton}
                onPress={() => router.push("/settings/help/contact")}
              >
                <Ionicons name="mail" size={20} color="#000" />
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.headerText}>
                You have {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}
              </Text>

              {inquiries.map((inquiry) => {
                const status = statusConfig[inquiry.status] || statusConfig.new;
                const category = categoryConfig[inquiry.category] || categoryConfig.other;

                return (
                  <Pressable
                    key={inquiry.id}
                    style={styles.inquiryCard}
                    onPress={() => router.push(`/settings/help/inquiry-detail?id=${inquiry.id}`)}
                  >
                    <View style={styles.inquiryHeader}>
                      <View style={styles.categoryBadge}>
                        <Ionicons name={category.icon} size={16} color={category.color} />
                        <Text style={[styles.categoryText, { color: category.color }]}>
                          {category.label}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                        <Ionicons name={status.icon} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.inquirySubject} numberOfLines={2}>
                      {inquiry.subject}
                    </Text>

                    <Text style={styles.inquiryMessage} numberOfLines={3}>
                      {inquiry.message}
                    </Text>

                    <View style={styles.inquiryFooter}>
                      <View style={styles.dateContainer}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.dateText}>{formatDate(inquiry.created_at)}</Text>
                      </View>
                      {inquiry.admin_response && (
                        <View style={styles.responseIndicator}>
                          <Ionicons name="mail-open" size={14} color="#00D4AA" />
                          <Text style={styles.responseText}>Response received</Text>
                        </View>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#666"
                      style={styles.chevron}
                    />
                  </Pressable>
                );
              })}

              <Pressable
                style={styles.newInquiryButton}
                onPress={() => router.push("/settings/help/contact")}
              >
                <Ionicons name="add-circle" size={20} color="#00D4AA" />
                <Text style={styles.newInquiryText}>Submit New Inquiry</Text>
              </Pressable>
            </>
          )}
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
  headerText: {
    fontSize: 15,
    color: "#999",
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 80,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyTitle: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    lineHeight: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#00D4AA",
  },
  contactButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  inquiryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  inquiryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inquirySubject: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 22,
  },
  inquiryMessage: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
    marginBottom: 12,
  },
  inquiryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  responseIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  responseText: {
    fontSize: 12,
    color: "#00D4AA",
    fontWeight: "600",
  },
  chevron: {
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -10,
  },
  newInquiryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0, 212, 170, 0.3)",
    backgroundColor: "rgba(0, 212, 170, 0.05)",
  },
  newInquiryText: {
    fontSize: 16,
    color: "#00D4AA",
    fontWeight: "600",
  },
});
