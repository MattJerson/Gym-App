import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useRouter, usePathname } from "expo-router";
import ProfileHeader from "../../components/profile/ProfileHeader";
import LeaderboardCard from "../../components/profile/LeaderboardCard";
import ProfileStatsCard from "../../components/profile/ProfileStatsCard";
import AchievementBadges from "../../components/profile/AchievementBadges";
import ProfileMenuSection from "../../components/profile/ProfileMenuSection";
import GamificationDataService from "../../services/GamificationDataService";
import { ProfilePageSkeleton } from "../../components/skeletons/ProfilePageSkeleton";

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();
  // User data
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserPosition, setCurrentUserPosition] = useState(null);
  const [currentUserNickname, setCurrentUserNickname] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth/loginregister");
        return;
      }
      setCurrentUserId(authUser.id);

      // Get user's profile for nickname
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, full_name")
        .eq("id", authUser.id)
        .single();

      const userNickname =
        profileData?.nickname ||
        profileData?.full_name?.split(" ")[0] ||
        authUser.user_metadata?.full_name?.split(" ")[0] ||
        authUser.email?.split("@")[0] ||
        "User";

      setCurrentUserNickname(userNickname);

      // Set user basic info
      setUser({
        name:
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "User",
        username: `@${authUser.email?.split("@")[0] || "user"}`,
        joinDate: `Joined ${new Date(authUser.created_at).toLocaleDateString(
          "en-US",
          { month: "long", year: "numeric" }
        )}`,
      });

      // Ensure server-side stats are up-to-date from activity (workouts, steps, sets, badges)
      // This will populate user_stats so the leaderboard view can include the user
      try {
        await GamificationDataService.syncUserStatsFromActivity(authUser.id);
      } catch (syncErr) {
        // Non-fatal: continue but log for visibility
        console.warn("syncUserStatsFromActivity failed", syncErr);
      }

      // Load gamification data and user's leaderboard position
      const [stats, badges, leaderboardData, activeChallenges] =
        await Promise.all([
          GamificationDataService.getUserStats(authUser.id),
          GamificationDataService.getUserBadges(authUser.id),
          GamificationDataService.getWeeklyLeaderboard(100),
          supabase
            .from("challenges")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      // Try to get the user's position (may be null if safe view prevents mapping)
      let position = null;
      try {
        position = await GamificationDataService.getUserLeaderboardPosition(
          authUser.id
        );
      } catch (posErr) {
        console.warn("Could not fetch user leaderboard position", posErr);
      }
      setUserStats(stats);
      setUserBadges(badges);
      setLeaderboard(leaderboardData || []);
      setCurrentUserPosition(position);
      setActiveChallenge(activeChallenges?.data?.[0] || null);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/loginregister");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Map badge icon names to MaterialCommunityIcons
  const getBadgeIconName = (badgeName) => {
    const iconMap = {
      "First Workout": "medal",
      "7-Day Streak": "fire",
      "3-Day Streak": "fire",
      "30-Day Streak": "fire",
      "100-Day Streak": "fire",
      "Strength Master": "dumbbell",
      "Consistency King": "trophy",
      "Cardio King": "run",
      "Team Player": "account-group",
      "Challenge Champion": "trophy-variant",
      "Community Leader": "star",
      "Early Bird": "weather-sunset-up",
      "Night Owl": "weather-night",
      "Perfect Week": "star-circle",
      "Marathon Runner": "run-fast",
      "Variety Seeker": "target",
    };
    return iconMap[badgeName] || "medal";
  };

  const getBadgeColor = (badge) => {
    return badge.badges?.color || "#f1c40f";
  };

  // Calculate time remaining for weekly challenge
  const getTimeRemaining = () => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const diff = endOfWeek - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h left`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProfilePageSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  // Menu items configuration - Profile focused
  const menuItems = [
    {
      title: "My Profile",
      items: [
        {
          icon: "person-outline",
          color: "#3498db",
          label: "Edit Profile",
          path: "../settings/edit",
        },
        {
          icon: "star-outline",
          color: "#f1c40f",
          label: "My Subscription",
          path: "../settings/subscription",
        },
      ],
    },
    {
      title: "App Settings",
      items: [
        {
          icon: "shield-checkmark-outline",
          color: "#2ecc71",
          label: "Privacy & Security",
          path: "../settings/privacy",
        },
        {
          icon: "notifications-outline",
          color: "#e74c3c",
          label: "Notifications",
          path: "../settings/notifications",
        },
        {
          icon: "help-circle-outline",
          color: "#1abc9c",
          label: "Help & Support",
          path: "../settings/helpsupport",
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <ProfileHeader user={user} />

          {/* Stats & Achievements Combined */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ Stats & Achievements</Text>

            <ProfileStatsCard userStats={userStats} />

            <AchievementBadges userBadges={userBadges} userStats={userStats} />
          </View>

          {/* Leaderboard Section */}
          <LeaderboardCard
            leaderboard={leaderboard}
            activeChallenge={activeChallenge}
            currentUserPosition={currentUserPosition}
            currentUserId={currentUserId}
            currentUserNickname={currentUserNickname}
            getTimeRemaining={getTimeRemaining}
          />

          {/* Account Section */}
          <ProfileMenuSection
            title={menuItems[0].title}
            items={menuItems[0].items}
            onItemPress={handlePress}
          />

          {/* Settings Section */}
          <ProfileMenuSection
            title={menuItems[1].title}
            items={menuItems[1].items}
            onItemPress={handlePress}
          />

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  backRow: {
    top: 60,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  profileHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  avatarContainer: {
    padding: 4,
    borderWidth: 3,
    marginBottom: 15,
    borderRadius: 75,
    borderColor: "#f7971e",
  },
  avatarIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7971e",
  },
  userName: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  userHandle: {
    marginTop: 4,
    fontSize: 16,
    color: "#aaa",
  },
  joinDate: {
    marginTop: 8,
    fontSize: 12,
    color: "#777",
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cardTitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
    fontWeight: "bold",
    paddingHorizontal: 5,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    gap: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#aaa",
    textTransform: "uppercase",
  },
  menuRow: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    marginRight: 15,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#eee",
    fontWeight: "500",
  },
  logoutContainer: {
    marginTop: 10,
  },
  logoutButton: {
    padding: 15,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(231, 76, 60, 0.1)",
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#e74c3c",
    fontWeight: "bold",
  }, // Combined Stats & Achievements styles - More Compact
  primaryStatsContainer: {
    marginBottom: 20,
    flexDirection: "row",
    paddingHorizontal: 5,
    justifyContent: "space-between",
  },
  primaryStatItem: {
    flex: 1,
    alignItems: "center",
  },
  primaryStatIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
    borderWidth: 1.5,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  primaryStatText: {
    alignItems: "center",
  },
  primaryStatValue: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "900",
    textShadowRadius: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
  },
  primaryStatLabel: {
    fontSize: 9,
    marginTop: 2,
    color: "#aaa",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  achievementsHeader: {
    marginBottom: 15,
    borderTopWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  achievementsTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  achievementsSubtitle: {
    fontSize: 11,
    marginTop: 2,
    color: "#f1c40f",
    fontWeight: "600",
  },
  achievementsGrid: {
    gap: 10,
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  achievementCard: {
    width: "47%",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 8,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  achievementIcon: {
    width: 45,
    height: 45,
    elevation: 4,
    marginBottom: 8,
    shadowRadius: 4,
    borderRadius: 22.5,
    shadowOpacity: 0.2,
    shadowColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
  },
  achievementGlow: {
    display: "none",
  },
  achievementName: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  achievementBorder: {
    display: "none",
  },
  // Remove old badge styles
  badgesContainer: {
    display: "none",
  },
  badgeItem: {
    display: "none",
  },
  badgeIcon: {
    display: "none",
  },
  badgeLabel: {
    display: "none",
  },
  // Remove old stats styles
  statsContainer: {
    display: "none",
  },
  statItem: {
    display: "none",
  },
  statValue: {
    display: "none",
  },
  statLabel: {
    display: "none",
  }, // Enhanced Leaderboard styles
  leaderboardHeader: {
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  challengeSubtitle: {
    fontSize: 11,
    marginTop: 4,
    color: "#f39c12",
    fontWeight: "600",
    fontStyle: "italic",
  },
  leaderboardHeaderRight: {
    alignItems: "flex-end",
  },
  leaderboardTimer: {
    fontSize: 11,
    borderRadius: 8,
    color: "#f39c12",
    fontWeight: "600",
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "rgba(243, 156, 18, 0.1)",
  },
  leaderboardContainer: {
    gap: 6,
  },
  leaderboardRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 12,
    justifyContent: "space-between",
    borderColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  currentUserRow: {
    borderWidth: 1.5,
    borderColor: "rgba(247, 151, 30, 0.3)",
    backgroundColor: "rgba(247, 151, 30, 0.1)",
  },
  leaderboardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  positionBadge: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#444",
    justifyContent: "center",
  },
  goldBadge: {
    backgroundColor: "transparent",
  },
  silverBadge: {
    backgroundColor: "transparent",
  },
  bronzeBadge: {
    backgroundColor: "transparent",
  },
  medalEmoji: {
    fontSize: 16,
  },
  positionText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  topThreeText: {
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 15,
    color: "#eee",
    marginBottom: 4,
    fontWeight: "600",
  },
  currentUserName: {
    color: "#f7971e",
    fontWeight: "700",
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  leaderboardPoints: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 2,
    fontWeight: "700",
  },
  currentUserPoints: {
    color: "#f7971e",
  },
  trendContainer: {
    gap: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 10,
    fontWeight: "600",
  },
  leaderboardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: "center",
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  footerText: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
    fontStyle: "italic",
  },
});
