import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SettingsHeader from "../../../components/SettingsHeader";
import { supabase } from "../../../services/supabase";

const categories = [
  { label: "Technical Issue", value: "technical", icon: "bug-outline", color: "#FF6B35" },
  { label: "Billing Question", value: "billing", icon: "card-outline", color: "#4A9EFF" },
  { label: "Feature Request", value: "feature_request", icon: "bulb-outline", color: "#FFB800" },
  { label: "General Question", value: "general", icon: "help-circle-outline", color: "#1abc9c" },
  { label: "Other", value: "other", icon: "chatbubble-outline", color: "#9b59b6" },
];

export default function ContactSupport() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    // Validation
    if (!selectedCategory) {
      Alert.alert("Missing Category", "Please select a category for your inquiry.");
      return;
    }

    if (!subject.trim()) {
      Alert.alert("Missing Subject", "Please enter a subject for your inquiry.");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Missing Message", "Please describe your issue or question.");
      return;
    }

    if (message.trim().length < 20) {
      Alert.alert("Message Too Short", "Please provide more details (at least 20 characters).");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to submit an inquiry");
      }

      // Insert inquiry into database
      const { error: insertError } = await supabase
        .from("user_inquiries")
        .insert({
          user_id: user.id,
          category: selectedCategory,
          subject: subject.trim(),
          message: message.trim(),
          status: 'new',
        });

      if (insertError) throw insertError;

      // Success!
      Alert.alert(
        "Inquiry Submitted",
        "Thank you for contacting us! We'll review your inquiry and get back to you within 24-48 hours.",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setSelectedCategory("");
              setSubject("");
              setMessage("");
              // Navigate back
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      Alert.alert("Submission Failed", error.message || "Failed to submit your inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Contact Support" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoCard}>
              <Ionicons name="mail-outline" size={40} color="#00D4AA" />
              <Text style={styles.infoTitle}>We're Here to Help</Text>
              <Text style={styles.infoText}>
                Our support team typically responds within 24-48 hours. For urgent issues, please include as many details as possible.
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <Pressable
                    key={category.value}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.value && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.value)}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={24} 
                      color={selectedCategory === category.value ? category.color : "#666"} 
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.value && styles.categoryTextSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Subject Input */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>
                Subject <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor="#666"
                maxLength={100}
              />
              <Text style={styles.charCount}>{subject.length}/100</Text>
            </View>

            {/* Message Input */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>
                Message <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or screenshots if applicable."
                placeholderTextColor="#666"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{message.length}/1000</Text>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#000" />
                  <Text style={styles.submitButtonText}>Submit Inquiry</Text>
                </>
              )}
            </Pressable>

            <Text style={styles.footerText}>
              Your inquiry will be sent to our support team. You'll receive a response at your registered email address.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
  infoCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 28,
    backgroundColor: "rgba(0, 212, 170, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.2)",
  },
  infoTitle: {
    fontSize: 20,
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "600",
  },
  required: {
    color: "#FF6B35",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  categoryButtonSelected: {
    borderColor: "#00D4AA",
    backgroundColor: "rgba(0, 212, 170, 0.1)",
  },
  categoryText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
    textAlign: "center",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  input: {
    padding: 16,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  textArea: {
    minHeight: 160,
    maxHeight: 240,
  },
  charCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "right",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#00D4AA",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    color: "#000",
    fontWeight: "700",
  },
  footerText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 16,
    textAlign: "center",
  },
});
