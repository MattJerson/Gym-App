import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../services/supabase";
import { getAllUnreadCounts } from "../../services/ChatServices";

export default function QuickStart() {
  const router = useRouter();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadChatUnreadCount();
    
    // Set up real-time subscription for chat unread counts
    const interval = setInterval(loadChatUnreadCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadChatUnreadCount = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return; // Silently fail if not authenticated
      }
      if (user) {
        setCurrentUserId(user.id);
        const { data } = await getAllUnreadCounts(user.id);
        if (data) {
          const totalUnread = data.totalUnread || 0;
          setChatUnreadCount(totalUnread);
        }
      }
    } catch (error) {
      // Silently fail - don't show errors for this
    }
  };

  const quickActions = [
    {
      title: "Workouts",
      subtitle: "Get Started",
      icon: "fitness",
      iconLibrary: "Ionicons",
      route: "/page/training",
      iconColor: "#b9e3e6",
    },
    {
      title: "Nutrition",
      subtitle: "Log Meals",
      icon: "restaurant-outline",
      iconLibrary: "Ionicons",
      route: "/page/mealplan",
      iconColor: "#00c6ac",
    },
    {
      title: "Chat",
      subtitle: "Community",
      icon: "chat-outline",
      iconLibrary: "MaterialCommunityIcons",
      route: "/page/communitychat",
      iconColor: "#b9e3e6",
    },
  ];

  const handlePress = (route) => {
    router.push(route);
  };

  const renderIcon = (action) => {
    if (action.iconLibrary === "Ionicons") {
      return (
        <Ionicons
          name={action.icon}
          size={20}
          color={action.iconColor}
        />
      );
    } else {
      return (
        <MaterialCommunityIcons
          name={action.icon}
          size={20}
          color={action.iconColor}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Start</Text>

      <View style={styles.row}>
        {quickActions.map((action, index) => (
          <Pressable
            key={index}
            style={styles.cardContainer}
            onPress={() => handlePress(action.route)}
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]}
              style={styles.gradientCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  {renderIcon(action)}
                </View>

                <View style={styles.textSection}>
                  <Text style={styles.title}>{action.title}</Text>
                  <Text style={styles.subtitle}>{action.subtitle}</Text>
                </View>
                
                {/* Show unread badge for Chat */}
                {action.title === "Chat" && chatUnreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  gradientCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    position: "relative",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  textSection: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#0B0B0B",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
