import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NotificationBar = ({ notifications = 3 }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const mockNotifications = [
    {
      id: 1,
      type: "workout",
      icon: "fitness-outline",
      title: "Workout Reminder",
      message: "Time for your Push Day workout! 💪",
      time: "5 min ago",
      color: "#4CAF50",
      unread: true,
    },
    {
      id: 2,
      type: "achievement",
      icon: "trophy-outline",
      title: "Achievement Unlocked!",
      message: "You've completed 7 days in a row!",
      time: "2 hrs ago",
      color: "#FF9500",
      unread: true,
    },
    {
      id: 3,
      type: "meal",
      icon: "restaurant-outline",
      title: "Meal Tracking",
      message: "Don't forget to log your lunch today",
      time: "4 hrs ago",
      color: "#007AFF",
      unread: false,
    },
    {
      id: 4,
      type: "workout",
      icon: "fitness-outline",
      title: "New Program Available",
      message: "Check out the new 'Summer Shred' program.",
      time: "1 day ago",
      color: "#e74c3c",
      unread: false,
    },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case "workout": return "fitness-outline";
      case "achievement": return "trophy-outline";
      case "meal": return "restaurant-outline";
      default: return "notifications-outline";
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <View style={styles.container}>
      {/* Notification Bell */}
      <Pressable 
        style={styles.notificationButton} 
        onPress={toggleDropdown}
      >
        <Ionicons name="notifications-outline" size={26} color="#fff" />
        {notifications > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>{notifications}</Text>
          </View>
        )}
      </Pressable>

      {/* Notification Dropdown */}
      {showDropdown && (
        <View style={styles.notificationDropdown}>
          {/* Dropdown Arrow */}
          <View style={styles.dropdownArrow} />
          
          {/* Header */}
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Notifications</Text>
            <Pressable 
              style={styles.markAllButton}
              onPress={() => {/* Handle mark all as read */}}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          </View>

          {/* Notifications List */}
          <ScrollView 
            style={styles.notificationsList} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {mockNotifications.map((notification) => (
              <Pressable 
                key={notification.id} 
                style={[
                  styles.notificationItem,
                  notification.unread && styles.unreadNotification
                ]}
                onPress={() => {/* Handle notification tap */}}
              >
                <View style={[styles.notificationIconContainer, { backgroundColor: notification.color }]}>
                  <Ionicons 
                    name={getNotificationIcon(notification.type)} 
                    size={18} 
                    color="#fff" 
                  />
                </View>
                
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                </View>

                {notification.unread && <View style={styles.unreadDot} />}
              </Pressable>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.dropdownFooter}>
            <Pressable 
              style={styles.viewAllButton}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={styles.viewAllText}>View All Notifications</Text>
              <Ionicons name="arrow-forward" size={16} color="#007AFF" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <Pressable 
          style={styles.overlay} 
          onPress={() => setShowDropdown(false)} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },

  // Notification Bell Styles
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  notificationBadge: {
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
  },
  notificationText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },

  // Dropdown Styles
  notificationDropdown: {
    position: "absolute",
    top: 40,
    right: -10,
    width: 320,
    maxHeight: 400,
    backgroundColor: "rgba(20, 20, 20, 0.98)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  // Dropdown Arrow
  dropdownArrow: {
    position: "absolute",
    top: -8,
    right: 20,
    width: 16,
    height: 16,
    backgroundColor: "rgba(20, 20, 20, 0.98)",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ rotate: "45deg" }],
  },

  // Header Styles
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },

  // Notifications List Styles
  notificationsList: {
    maxHeight: 280,
    paddingHorizontal: 4,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  unreadNotification: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 11,
    color: "#999",
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#ccc",
    lineHeight: 16,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#007AFF",
    marginTop: 6,
    marginLeft: 8,
    flexShrink: 0,
  },

  // Footer Styles
  dropdownFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginRight: 6,
  },

  // Overlay to close dropdown
  overlay: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: "transparent",
    zIndex: -1,
  },
});

export default NotificationBar;