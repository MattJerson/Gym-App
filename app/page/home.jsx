import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { useRouter, usePathname } from "expo-router";
import QuickStart from "../../components/home/QuickStart";
import NotificationBar from "../../components/NotificationBar";
import FeaturedVideo from "../../components/home/FeaturedVideo";
import { HomeDataService } from "../../services/HomeDataService";
import RecentActivity from "../../components/home/RecentActivity";
import DailyProgressCard from "../../components/home/DailyProgressCard";
import { View, Text, Alert, StyleSheet, ScrollView } from "react-native";
import { HomePageSkeleton } from "../../components/skeletons/HomePageSkeleton";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();

  // User state
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [notifications, setNotifications] = useState(0);

  // Data state
  const [dailyProgress, setDailyProgress] = useState(null);
  const [quickStartCategories, setQuickStartCategories] = useState([]);
  const [featuredContent, setFeaturedContent] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
          setUserId(user.id);
          // Get user name from metadata or email
          setUserName(
            user.user_metadata?.name || user.email?.split("@")[0] || "User"
          );
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    getUser();
  }, []);

  // Load home data when user is available
  useEffect(() => {
    if (userId) {
      loadHomeData();
    }
  }, [userId]);

  const loadHomeData = async () => {
    try {
      setIsLoading(true);

      // Fetch all home data in parallel
      const [
        userStatsData,
        featuredData,
        activitiesData,
        categoriesData,
        notificationsData,
      ] = await Promise.all([
        HomeDataService.fetchUserDailyStats(userId),
        HomeDataService.fetchFeaturedContent(),
        HomeDataService.fetchRecentActivities(userId, 4),
        HomeDataService.fetchQuickStartCategories(),
        HomeDataService.fetchUserNotifications(userId),
      ]);

      // Update state with real data
      setDailyProgress(userStatsData);
      setFeaturedContent(featuredData);
      setRecentActivities(activitiesData);
      setQuickStartCategories(categoriesData);
      setNotifications(notificationsData.count);
    } catch (error) {
      console.error("Error loading home data:", error);
      Alert.alert("Error", "Failed to load home data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total progress from metrics
  const calculateTotalProgress = (metrics) => {
    if (!metrics) return 0;
    const workoutPercent = (metrics.workout.value / metrics.workout.max) * 100;
    const caloriePercent =
      (metrics.calories.value / metrics.calories.max) * 100;
    const stepsPercent = (metrics.steps.value / metrics.steps.max) * 100;
    return (workoutPercent + caloriePercent + stepsPercent) / 3;
  };

  const totalProgress = dailyProgress
    ? calculateTotalProgress(dailyProgress.metrics)
    : 0;

  const handlePress = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Welcome, {userName}! 💪</Text>
          <NotificationBar notifications={notifications} />
        </View>

        {/* Loading State */}
        {isLoading ? (
          <HomePageSkeleton />
        ) : (
          <>
            {/* ✅ Daily Progress Card Component - Now fetches its own data */}
            <DailyProgressCard />

            {/* Quick Start Section */}
            {quickStartCategories.length > 0 && (
              <QuickStart categories={quickStartCategories} />
            )}

            {/* Featured Video */}
            {featuredContent && (
              <FeaturedVideo
                id={featuredContent.id}
                title={featuredContent.title}
                subtitle={featuredContent.subtitle}
                author={featuredContent.author}
                views={featuredContent.views}
                category={featuredContent.category}
                thumbnail={featuredContent.thumbnail}
                duration={featuredContent.duration}
                youtubeUrl={featuredContent.youtubeUrl}
                articleUrl={featuredContent.articleUrl}
                contentType={featuredContent.contentType}
              />
            )}

            {/* Recent Activity */}
            {recentActivities.length > 0 && (
              <RecentActivity activities={recentActivities} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backRow: {
    top: 60,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  headerRow: {
    marginBottom: 20,
    marginVertical: 60,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 40,
    resizeMode: "contain",
  },
  notificationBadge: {
    top: -4,
    right: -6,
    minWidth: 18,
    borderRadius: 10,
    paddingVertical: 1,
    paddingHorizontal: 5,
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
  storyScroll: {
    gap: 14,
    marginBottom: 20,
    flexDirection: "row",
  },
  card: {
    padding: 20,
    borderRadius: 32,
    marginBottom: 22,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionHeader: {
    marginBottom: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badgeRow: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  badgeItem: {
    alignItems: "center",
  },
  badgeLabel: {
    fontSize: 12,
    marginTop: 6,
    color: "#ccc",
  },
  leaderboardContainer: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  leaderboardRow: {
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    justifyContent: "space-between",
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  leaderboardRank: {
    width: 30,
    fontSize: 16,
    textAlign: "center",
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  leaderboardPoints: {
    fontSize: 14,
    color: "#ccc",
  },
  activityDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  activityItem: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  activitySub: {
    fontSize: 12,
    color: "#bbb",
  },
});
