import {
  View,
  Text,
  TextInput,
  StyleSheet,
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
import SettingsHeader from "../../components/SettingsHeader";
import { supabase } from "../../services/supabase";

export default function ChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      Alert.alert("Missing Field", "Please enter your current password");
      return;
    }

    if (!newPassword) {
      Alert.alert("Missing Field", "Please enter a new password");
      return;
    }

    if (!confirmPassword) {
      Alert.alert("Missing Field", "Please confirm your new password");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert("Weak Password", passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Same Password", "New password must be different from current password");
      return;
    }

    try {
      setIsSubmitting(true);

      // First verify current password by signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error("User not found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Success
      Alert.alert(
        "Password Changed",
        "Your password has been successfully updated.",
        [
          {
            text: "OK",
            onPress: () => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", error.message || "Failed to change password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Change Password" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={40} color="#00D4AA" />
              <Text style={styles.infoTitle}>Secure Your Account</Text>
              <Text style={styles.infoText}>
                Use a strong password with at least 8 characters, including uppercase, lowercase, and numbers.
              </Text>
            </View>

            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Current Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#666"
                  />
                </Pressable>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                New Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#666"
                  />
                </Pressable>
              </View>
              <Text style={styles.helperText}>
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Confirm New Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#666"
                  />
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                  <Text style={styles.submitButtonText}>Change Password</Text>
                </>
              )}
            </Pressable>

            <Text style={styles.footerText}>
              After changing your password, you'll remain logged in on this device but will be logged out of all other devices.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
  infoCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 32,
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
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "600",
  },
  required: {
    color: "#FF6B35",
  },
  passwordInput: {
    position: "relative",
  },
  input: {
    padding: 16,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    lineHeight: 16,
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
