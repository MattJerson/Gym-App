import { useState, useEffect } from "react";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DailyProgressCard from "../../components/home/DailyProgressCard"; // 👈 Import new component
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import QuickStart from "../../components/home/QuickStart";
import RecentActivity from "../../components/home/RecentActivity";
import FeaturedVideo from "../../components/home/FeaturedVideo";
import NotificationBar from "../../components/NotificationBar";

// 🔄 API Service Functions - Replace these with actual API calls
const HomeDataService = {
  async fetchUserData(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}`);
    return {
      name: "Matt",
      notifications: 3,
    };
  },

  async fetchDailyProgress(userId, date) {
    // Replace with: const response = await fetch(`/api/progress/${userId}?date=${date}`);
    return {
      streak: {
        current: 5,
        goal: 7,
        lastWorkout: "Yesterday",
        bestStreak: 12,
      },
      metrics: {
        workout: { value: 1, max: 1, unit: "Done" },
        calories: { value: 420, max: 500, unit: "kcal" },
        steps: { value: 8500, max: 10000, unit: "steps" },
      },
    };
  },

  async fetchWorkoutCategories() {
    // Replace with: const response = await fetch('/api/workout-categories');
    return [
      {
        id: 1,
        title: "Push Day",
        subtitle: "Chest, Shoulders, Triceps",
        gradient: ["#FF6B6B", "#4ECDC4"],
        icon: "fitness",
        difficulty: "Intermediate",
      },
      {
        id: 2,
        title: "Cardio Blast",
        subtitle: "HIIT Training Session",
        gradient: ["#A8E6CF", "#88D8C0"],
        icon: "flash",
        difficulty: "Beginner",
      },
      {
        id: 3,
        title: "Full Body",
        subtitle: "Complete Workout",
        gradient: ["#FFD93D", "#6BCF7F"],
        icon: "body",
        difficulty: "Advanced",
      },
    ];
  },

  async fetchFeaturedContent() {
    // Replace with: const response = await fetch('/api/featured-content');
    return {
      title: "Complete Core Transformation",
      subtitle: "Science-Based Training",
      author: "Dr. Mike Fitness",
      views: "2.1M",
      category: "Education",
      thumbnail: "https://img.youtube.com/vi/2tM1LFFxeKg/hqdefault.jpg",
      duration: "12 min read",
    };
  },

  async fetchRecentActivities(userId, limit = 4) {
    // Replace with: const response = await fetch(`/api/activities/${userId}?limit=${limit}`);
    return [
      {
        id: 1,
        label: "Chest + Triceps",
        duration: "45 mins",
        icon: "barbell",
        color: ["#ff7e5f", "#feb47b"],
        date: "Today",
        calories: 280,
      },
      {
        id: 2,
        label: "Morning Cardio",
        duration: "30 mins",
        icon: "walk",
        color: ["#43cea2", "#185a9d"],
        date: "Yesterday",
        calories: 220,
      },
      {
        id: 3,
        label: "Evening Yoga",
        duration: "20 mins",
        icon: "leaf-outline",
        color: ["#a18cd1", "#fbc2eb"],
        date: "2 days ago",
        calories: 120,
      },
      {
        id: 4,
        label: "Cycling Session",
        duration: "25 mins",
        icon: "bicycle",
        color: ["#36d1dc", "#5b86e5"],
        date: "3 days ago",
        calories: 310,
      },
    ];
  },
};

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications] = useState(3);
  
  // 🔄 Centralized data - replace with API calls later
  const homeData = {
    user: {
      name: "Matt",
      notifications: 3,
    },
    dailyProgress: {
      streak: {
        current: 5,
        goal: 7,
        lastWorkout: "Yesterday",
        bestStreak: 12,
      },
      totalProgress: 65, // Will be calculated from individual metrics
      metrics: {
        workout: { value: 1, max: 1, unit: "Done" },
        calories: { value: 420, max: 500, unit: "kcal" },
        steps: { value: 8500, max: 10000, unit: "steps" },
      },
    },
    quickStart: {
      categories: [
        {
          id: 1,
          title: "Push Day",
          subtitle: "Chest, Shoulders, Triceps",
          gradient: ["#FF6B6B", "#4ECDC4"],
          icon: "fitness",
          difficulty: "Intermediate",
        },
        {
          id: 2,
          title: "Cardio Blast",
          subtitle: "HIIT Training Session",
          gradient: ["#A8E6CF", "#88D8C0"],
          icon: "flash",
          difficulty: "Beginner",
        },
        {
          id: 3,
          title: "Full Body",
          subtitle: "Complete Workout",
          gradient: ["#FFD93D", "#6BCF7F"],
          icon: "body",
          difficulty: "Advanced",
        },
      ],
    },
    featuredContent: {
      title: "Complete Core Transformation",
      subtitle: "Science-Based Training",
      author: "Dr. Mike Fitness",
      views: "2.1M",
      category: "Education",
      thumbnail: "https://img.youtube.com/vi/2tM1LFFxeKg/hqdefault.jpg",
      duration: "12 min read",
    },
    recentActivities: [
      {
        id: 1,
        label: "Chest + Triceps",
        duration: "45 mins",
        icon: "barbell",
        color: ["#ff7e5f", "#feb47b"],
        date: "Today",
        calories: 280,
      },
      {
        id: 2,
        label: "Morning Cardio",
        duration: "30 mins",
        icon: "walk",
        color: ["#43cea2", "#185a9d"],
        date: "Yesterday",
        calories: 220,
      },
      {
        id: 3,
        label: "Evening Yoga",
        duration: "20 mins",
        icon: "leaf-outline",
        color: ["#a18cd1", "#fbc2eb"],
        date: "2 days ago",
        calories: 120,
      },
      {
        id: 4,
        label: "Cycling Session",
        duration: "25 mins",
        icon: "bicycle",
        color: ["#36d1dc", "#5b86e5"],
        date: "3 days ago",
        calories: 310,
      },
    ],
  };

  // Calculate total progress from metrics
  const calculateTotalProgress = (metrics) => {
    const workoutPercent = (metrics.workout.value / metrics.workout.max) * 100;
    const caloriePercent = (metrics.calories.value / metrics.calories.max) * 100;
    const stepsPercent = (metrics.steps.value / metrics.steps.max) * 100;
    return (workoutPercent + caloriePercent + stepsPercent) / 3;
  };

  const totalProgress = calculateTotalProgress(homeData.dailyProgress.metrics);

  const handlePress = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Welcome, {homeData.user.name}! 💪</Text>
          <NotificationBar notifications={homeData.user.notifications} />
        </View>

        {/* ✅ Daily Progress Card Component */}
        <DailyProgressCard
          totalProgress={totalProgress}
          workoutData={homeData.dailyProgress.metrics.workout}
          calorieData={homeData.dailyProgress.metrics.calories}
          stepsData={homeData.dailyProgress.metrics.steps}
          streakData={homeData.dailyProgress.streak}
        />
        
        <QuickStart categories={homeData.quickStart.categories} />
        
        <FeaturedVideo
          title={homeData.featuredContent.title}
          subtitle={homeData.featuredContent.subtitle}
          author={homeData.featuredContent.author}
          views={homeData.featuredContent.views}
          category={homeData.featuredContent.category}
          thumbnail={homeData.featuredContent.thumbnail}
          duration={homeData.featuredContent.duration}
        />

        {/* Recent Activity */}
        <RecentActivity activities={homeData.recentActivities} />
        {/* Featured Video */}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    marginVertical: 60,
    marginBottom: 20,
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
