// components/home/RecentActivity.jsx
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityLogDataService } from "../../services/ActivityLogDataService";
import { supabase } from "../../services/supabase";
import RecentActivitySkeleton from "../skeletons/RecentActivitySkeleton";

export default function RecentActivity() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all activities and take top 4
      const allActivities = await ActivityLogDataService.fetchAllActivities(user.id);
      setActivities(allActivities.slice(0, 4));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityItem = (activity) => {
    const activityDate = new Date(activity.timestamp);
    const now = new Date();
    const daysAgo = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
    
    let timeAgo;
    if (daysAgo === 0) {
      const hoursAgo = Math.floor((now - activityDate) / (1000 * 60 * 60));
      if (hoursAgo === 0) {
        const minsAgo = Math.floor((now - activityDate) / (1000 * 60));
        timeAgo = `${minsAgo} min${minsAgo !== 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
      }
    } else if (daysAgo === 1) {
      timeAgo = "Yesterday";
    } else {
      timeAgo = `${daysAgo} days ago`;
    }

    let duration = activity.metadata?.duration || '';
    let calories = activity.metadata?.calories || 0;
    let points = activity.metadata?.points || 0;
    
    return {
      label: activity.title,
      date: timeAgo,
      duration: duration,
      calories: calories,
      points: points,
      type: activity.type
    };
  };

  const handleViewAll = () => {
    router.push("/activity");
  };

  const getActivityHighlight = (activity) => {
    const parts = [];
    if (activity.calories) parts.push(`${activity.calories} cal`);
    if (activity.duration) parts.push(activity.duration);
    return parts.join(" • ");
  };

  // Show skeleton while loading
  if (loading) {
    return <RecentActivitySkeleton />;
  }

  if (activities.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recent Activity</Text>
          <Ionicons name="time-outline" size={18} color="#fff" />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>Start logging workouts and meals!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Activity</Text>
        <Pressable onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={12} color="#a29bfe" />
        </Pressable>
      </View>

      {/* Dynamic list of activities */}
      {activities.map((activity, idx) => {
        const item = formatActivityItem(activity);
        const isWorkout = item.type === 'workout';
        const typeColor = isWorkout ? '#74b9ff' : '#4ecdc4';
        
        return (
          <Pressable key={idx} style={styles.item}>
            {/* Left side - Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
              <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
            </View>

            {/* Middle - Content */}
            <View style={styles.activityInfo}>
              <View style={styles.header}>
                <Text style={styles.name} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.timeText}>{item.date}</Text>
              </View>
              <View style={styles.metaRow}>
                {item.calories > 0 && (
                  <View style={styles.calorieChip}>
                    <Text style={styles.chipIcon}>🔥</Text>
                    <Text style={styles.chipText}>{item.calories}</Text>
                  </View>
                )}
                {item.duration && (
                  <View style={styles.durationChip}>
                    <Text style={styles.chipIcon}>⏱</Text>
                    <Text style={styles.chipText}>{item.duration}</Text>
                  </View>
                )}
                {isWorkout && item.points && (
                  <View style={styles.pointsChip}>
                    <Text style={styles.chipIcon}>⭐</Text>
                    <Text style={[styles.chipText, styles.pointsText]}>{item.points}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(162, 155, 254, 0.12)",
    borderWidth: 1,
  },
  headerRow: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: "rgba(162, 155, 254, 0.08)",
  },
  viewAllText: {
    fontSize: 11,
    color: "#a29bfe",
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityInfo: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    gap: 5,
  },
  calorieChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 107, 107, 0.08)",
  },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  chipIcon: {
    fontSize: 9,
  },
  chipText: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "600",
  },
  pointsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  pointsText: {
    color: "#F59E0B",
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 5,
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 11,
    color: "#666",
  },
});