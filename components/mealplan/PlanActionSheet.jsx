import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PlanActionSheet({
  visible,
  onClose,
  onChangePlan,
  onViewDetails,
  onRemovePlan,
  planName = "Current Plan",
  isAdminAssigned = false,
}) {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleAction = (action) => {
    onClose();
    setTimeout(() => {
      action();
    }, 300);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </Pressable>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle Bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Meal Plan</Text>
          <Text style={styles.headerSubtitle}>{planName}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Change Plan */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleAction(onChangePlan)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#007AFF20" }]}>
              <Ionicons name="swap-horizontal" size={22} color="#007AFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Plan</Text>
              <Text style={styles.actionSubtitle}>
                Browse and select a different meal plan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Pressable>

          {/* View Details */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleAction(onViewDetails)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#00D4AA20" }]}>
              <Ionicons name="information-circle" size={22} color="#00D4AA" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Details</Text>
              <Text style={styles.actionSubtitle}>
                See full plan information and progress
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Pressable>

          {/* Remove Plan - Hidden if admin assigned */}
          {!isAdminAssigned ? (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => handleAction(onRemovePlan)}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#EF444420" }]}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: "#EF4444" }]}>
                  Remove Plan
                </Text>
                <Text style={styles.actionSubtitle}>
                  Deactivate your current meal plan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          ) : (
            <View style={[styles.actionButton, styles.actionButtonDisabled]}>
              <View style={[styles.actionIcon, { backgroundColor: "#FFB30020" }]}>
                <Ionicons name="shield-checkmark" size={22} color="#FFB300" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: "#888" }]}>
                  Admin Assigned Plan
                </Text>
                <Text style={styles.actionSubtitle}>
                  This plan was assigned by an admin and cannot be removed
                </Text>
              </View>
              <Ionicons name="lock-closed" size={20} color="#888" />
            </View>
          )}
        </View>

        {/* Cancel Button */}
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.cancelButtonPressed,
          ]}
          onPress={onClose}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        {/* Safe Area Bottom Padding */}
        <View style={styles.safeArea} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  actionButtonDisabled: {
    opacity: 0.6,
    borderColor: "rgba(255, 179, 0, 0.2)",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
    lineHeight: 18,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  safeArea: {
    height: 20,
  },
});
