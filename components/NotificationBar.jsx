import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { NotificationService } from "../services/NotificationService";
import { supabase } from "../services/supabase";

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
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('NotificationBar: Error getting user:', error.message);
          return;
        }
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('NotificationBar: Exception getting user:', error.message);
      }
    };
    getUser();
  }, []);

  // Load notifications when user is available
  useEffect(() => {
    if (userId) {
      loadNotifications();
      
      // Subscribe to real-time notifications
      const subscription = NotificationService.subscribeToNotifications(
        userId,
        (newNotif) => {
          if (__DEV__) {
            console.log('NotificationBar: Received notification via real-time:', {
              id: newNotif.id,
              title: newNotif.title,
              status: newNotif.status,
              type: newNotif.type,
              source: newNotif.source,
              is_read: newNotif.is_read
            });
          }
          
          // Optimistic update - add notification immediately to UI
          setNotifications(prev => {
            // Check if notification already exists (avoid duplicates)
            const exists = prev.some(n => n.id === newNotif.id);
            if (exists) {
              if (__DEV__) {
                console.log('NotificationBar: Notification already exists, skipping duplicate');
              }
              return prev;
            }
            // Add new notification at the top
            if (__DEV__) {
              console.log('NotificationBar: Adding new notification to list');
            }
            return [newNotif, ...prev].slice(0, 10); // Keep only latest 10
          });
          
          // Update badge count immediately
          setUnreadCount(prev => {
            const newCount = prev + 1;
            if (__DEV__) {
              console.log(`NotificationBar: Badge count ${prev} → ${newCount}`);
            }
            return newCount;
          });
          
          // Shake the bell icon to draw attention
          shakeNotificationBell();
          
          // Also reload in background to ensure sync with server
          if (__DEV__) {
            console.log('NotificationBar: Scheduling background sync in 1 second');
          }
          setTimeout(() => loadNotifications(), 1000);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) {
      return;
    }
    
    try {
      const data = await NotificationService.fetchUserNotifications(userId, currentLimit);
      setNotifications(data);
      
      // Check if there might be more
      setHasMore(data.length >= currentLimit);
      
      const count = await NotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('NotificationBar: Error loading notifications:', error.message);
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
        console.log('NotificationBar: Loaded more notifications. Total:', data.length);
      }
    } catch (error) {
      console.error('NotificationBar: Error loading more notifications:', error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (notificationId, notification) => {
    if (!userId) return;
    
    // Mark notification as read in UI
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
    
    // Decrement unread count if it was previously unread
    if (!notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Update server based on source type
    try {
      if (notification?.source === 'manual') {
        // For manual notifications, mark as read in database
        await NotificationService.markAsRead(userId, notificationId);
      } else if (notification?.source === 'automated') {
        // For automated notifications, DELETE them (they're user-specific)
        const { error } = await supabase
          .from('notification_logs')
          .delete()
          .eq('user_id', userId)
          .eq('id', notificationId);
        
        if (error) {
          console.error('NotificationBar: Error deleting automated notification:', error);
        } else if (__DEV__) {
          console.log('NotificationBar: Deleted automated notification:', notificationId);
        }
      }
    } catch (error) {
      console.error('NotificationBar: Error in handleMarkAsRead:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    
    try {
      // Clear UI immediately for better UX (all notifications disappear)
      setNotifications([]);
      setUnreadCount(0);
      
      // Use the service method that marks manual as read and deletes automated
      const result = await NotificationService.markAllAsRead(userId);
      
      if (result && __DEV__) {
        console.log('NotificationBar: Marked all notifications as read:', result);
      }
      
      // Reload to confirm (should be empty or only show new ones)
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
                console.log('NotificationBar: Cleared all notifications:', result);
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
                    <View style={[
                      styles.notificationIconContainer, 
                      { backgroundColor: getNotificationColor(notification.type) }
                    ]}>
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
                        <Text style={styles.notificationTime}>
                          {formatTime(notification.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
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
    maxHeight: 450, // Reduced from 600
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
    maxHeight: 360, // Reduced from 530 to make modal smaller
    paddingHorizontal: 4,
    paddingBottom: 8,
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
    backgroundColor: "rgba(0, 122, 255, 0.15)", // More visible blue tint for unread
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
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