import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SubmitButton = ({
  text,
  title, // Support both text and title props for backward compatibility
  onPress,
  isLoading = false,
  disabled = false,
  loadingText = "Processing...",
  icon = "arrow-forward",
  variant = "solid", // "solid" or "gradient"
  gradientColors = ["#4A9EFF", "#6BB6FF"],
  loadingGradientColors = ["#666", "#888"],
  style,
  ...props
}) => {
  const isDisabled = disabled || isLoading;
  const buttonText = text || title || "Submit"; // Fallback to ensure there's always text

  if (variant === "gradient") {
    return (
      <Pressable
        style={[styles.submitButton, isLoading && styles.submitButtonLoading, style]}
        onPress={onPress}
        disabled={isDisabled}
        {...props}
      >
        <LinearGradient
          colors={isLoading ? loadingGradientColors : gradientColors}
          style={styles.submitButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isLoading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator
                size="small"
                color="#fff"
                style={styles.loadingSpinner}
              />
              <Text style={styles.submitButtonText}>{loadingText}</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.submitButtonText}>{buttonText}</Text>
              {icon && (
                <Ionicons
                  name={icon}
                  size={20}
                  color="#fff"
                  style={styles.submitButtonIcon}
                />
              )}
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  // Solid variant (default)
  return (
    <Pressable
      style={[styles.submitButton, isLoading && styles.submitButtonLoading, style]}
      onPress={onPress}
      disabled={isDisabled}
      {...props}
    >
      <View style={[styles.submitButtonSolid, isLoading && styles.submitButtonDisabled]}>
        {isLoading ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color="#fff" />
            {loadingText && <Text style={styles.submitButtonText}>{loadingText}</Text>}
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.submitButtonText}>{buttonText}</Text>
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color="#fff"
                style={styles.submitButtonIcon}
              />
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default SubmitButton;

const styles = StyleSheet.create({
  submitButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  submitButtonSolid: {
    flex: 1,
    backgroundColor: "#3678c2ff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonLoading: {
    opacity: 0.8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingSpinner: {
    marginRight: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  submitButtonIcon: {
    marginLeft: 8,
  },
});