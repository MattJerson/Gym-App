import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { NotificationService } from "../services/NotificationService";
import { supabase, getCurrentUser } from "../services/supabase";

const NotificationBar = ({ notifications: initialCount = 0 }) => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [userId, setUserId] = useState(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(20); // Start with 20

  // Animation for bell icon when new notification arrives
  const bellShake = useState(new Animated.Value(0))[0];

  const shakeNotificationBell = () => {
    setHasNewNotification(true);
    Animated.sequence([
      Animated.timing(bellShake, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start(() => {
      // Clear the new notification indicator after 3 seconds
      setTimeout(() => setHasNewNotification(false), 3000);
    });
  };

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        // Silently handle auth session errors (expected during logout)
        if (error.name !== 'AuthSessionMissingError') {
          console.error('NotificationBar: Exception getting user:', error.message);
        }
      }
    };
    getUser();
  }, []);

  // Load notifications when user is available
  useEffect(() => {
    if (userId) {
      // IMPORTANT: Clear state completely before loading fresh data
      setNotifications([]);
      setUnreadCount(0);
      setCurrentLimit(20);
      
      loadNotifications();
      
      // Subscribe to real-time notifications
      const subscription = NotificationService.subscribeToNotifications(
        userId,
        (newNotif) => {
          if (__DEV__) {
            console.log('[NotificationBar] Real-time notification received:', newNotif.id, newNotif.title);
          }
          
          // Shake the bell icon to draw attention
          shakeNotificationBell();
          
          // Don't add optimistically - just reload from database to ensure accuracy
          // This prevents phantom notifications from appearing
          if (__DEV__) {
            console.log('[NotificationBar] Reloading notifications from database...');
          }
          setTimeout(() => loadNotifications(), 500);
        }
      );

      // Polling fallback: Check for new notifications every 30 seconds
      const pollingInterval = setInterval(() => {
        if (__DEV__) {
          console.log('[NotificationBar] Polling for new notifications...');
        }
        loadNotifications();
      }, 30000); // 30 seconds

      return () => {
        subscription.unsubscribe();
        clearInterval(pollingInterval);
      };
    }
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) {
      if (__DEV__) {
        console.log('[NotificationBar] Cannot load notifications - no userId');
      }
      return;
    }
    
    try {
      if (__DEV__) {
        console.log('[NotificationBar] Loading notifications for user:', userId);
      }
      
      const data = await NotificationService.fetchUserNotifications(userId, currentLimit);
      
      if (__DEV__) {
        console.log('[NotificationBar] Loaded', data.length, 'notifications from database');
      }
      
      setNotifications(data);
      
      // Check if there might be more
      setHasMore(data.length >= currentLimit);
      
      const count = await NotificationService.getUnreadCount(userId);
      setUnreadCount(count);
      
      if (__DEV__) {
        console.log('[NotificationBar] Unread count:', count);
      }
    } catch (error) {
      console.error('NotificationBar: Error loading notifications:', error.message);
      // Clear on error to prevent showing stale data
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const loadMoreNotifications = async () => {
    if (!userId || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      // Increase limit by 20
      const newLimit = currentLimit + 20;
      setCurrentLimit(newLimit);
      
      const data = await NotificationService.fetchUserNotifications(userId, newLimit);
      setNotifications(data);
      
      // Check if there are more
      setHasMore(data.length >= newLimit);
      
      if (__DEV__) {
      }
    } catch (error) {
      console.error('NotificationBar: Error loading more notifications:', error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (notificationId, notification) => {
    if (!userId) return;
    
    // Optimistically remove from UI immediately
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Decrement unread count if it was previously unread
    if (!notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Track dismissal in database (both manual and automated use notification_dismissals)
    try {
      const { error } = await supabase
        .from('notification_dismissals')
        .insert({
          user_id: userId,
          notification_id: notificationId,
          notification_source: notification?.source || 'automated',
          dismissed_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('NotificationBar: Error dismissing notification:', error);
        // Reload on error to restore correct state
        await loadNotifications();
      } else if (__DEV__) {
        console.log('✅ Dismissed notification:', notificationId, notification?.source);
      }
      
      // For manual notifications, also mark as read
      if (notification?.source === 'manual') {
        await NotificationService.markAsRead(userId, notificationId);
      }
    } catch (error) {
      console.error('NotificationBar: Error in handleMarkAsRead:', error);
      await loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    
    try {
      // Mark notifications as read in UI immediately for better UX
      setNotifications(prev => 
        prev.map(n => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      setUnreadCount(0);
      
      // Use the service method that marks manual as read and deletes automated
      const result = await NotificationService.markAllAsRead(userId);
      
      if (result && __DEV__) {
      }
      
      // Reload to confirm state with server
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
      // On error, reload from server to get correct state
      await loadNotifications();
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;
    
    Alert.alert(
      'Clear All Notifications',
      'This will permanently remove all notifications from your list. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update - clear UI immediately
              setNotifications([]);
              setUnreadCount(0);
              
              // Use the new service method that dismisses ALL notifications in database
              const result = await NotificationService.dismissAllNotifications(userId);
              
              if (result && __DEV__) {
              }
              
              // Reload to confirm
              await loadNotifications();
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications. Please try again.');
              // On error, reload from server
              await loadNotifications();
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "success": return "checkmark-circle-outline";
      case "warning": return "warning-outline";
      case "error": return "alert-circle-outline";
      case "info":
      default: return "information-circle-outline";
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case "success": return "#4CAF50";
      case "warning": return "#FF9500";
      case "error": return "#e74c3c";
      case "info":
      default: return "#007AFF";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
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
        <Animated.View style={{ transform: [{ rotate: bellShake.interpolate({
          inputRange: [-10, 10],
          outputRange: ['-10deg', '10deg']
        })}]}}>
          <Ionicons name="notifications-outline" size={26} color="#fff" />
          {hasNewNotification && (
            <View style={styles.newNotificationPulse} />
          )}
        </Animated.View>
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>{unreadCount}</Text>
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
            <View style={styles.headerActions}>
              <Pressable 
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleMarkAllAsRead();
                }}
              >
                <Text style={styles.actionText}>Mark all read</Text>
              </Pressable>
              <Pressable 
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
              >
                <Text style={[styles.actionText, styles.clearText]}>Clear all</Text>
              </Pressable>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView 
            style={styles.notificationsList} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              <>
                {notifications.map((notification) => (
                  <Pressable 
                    key={notification.id} 
                    style={[
                      styles.notificationItem,
                      !notification.is_read && styles.unreadNotification
                    ]}
                    onPress={() => handleMarkAsRead(notification.id, notification)}
                  >
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle} numberOfLines={2}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.created_at)}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                    </View>
                    {!notification.is_read && <View style={styles.unreadDot} />}
                  </Pressable>
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <Pressable 
                    style={styles.loadMoreButton}
                    onPress={loadMoreNotifications}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <Text style={styles.loadMoreText}>Loading...</Text>
                    ) : (
                      <>
                        <Ionicons name="chevron-down" size={16} color="#007AFF" />
                        <Text style={styles.loadMoreText}>Load More</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
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

  // New notification pulse effect
  newNotificationPulse: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Dropdown Styles
  notificationDropdown: {
    position: "absolute",
    top: 40,
    right: -10,
    width: 320,
    maxHeight: 500,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  clearText: {
    color: "#FF3B30", // Red color for "Clear all"
  },

  // Notifications List Styles
  notificationsList: {
    maxHeight: 400,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "stretch",
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    minHeight: 80,
  },
  unreadNotification: {
    backgroundColor: "rgba(0, 122, 255, 0.12)",
  },
  // Icon container removed - notifications no longer display icons
  notificationContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between",
  },
  // Header removed - title and time are now separate elements
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 22,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
    textAlign: "left",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
    marginLeft: 12,
    alignSelf: "center",
    flexShrink: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },

  // Load More Button
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
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