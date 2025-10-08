import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import NotificationBar from "../../components/NotificationBar";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileStatsCard from "../../components/profile/ProfileStatsCard";
import AchievementBadges from "../../components/profile/AchievementBadges";
import LeaderboardCard from "../../components/profile/LeaderboardCard";
import ProfileMenuSection from "../../components/profile/ProfileMenuSection";
import { ProfilePageSkeleton } from "../../components/skeletons/ProfilePageSkeleton";
import { supabase } from "../../services/supabase";
import GamificationDataService from "../../services/GamificationDataService";

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications] = useState(3);
  const [selectedTheme, setSelectedTheme] = useState('dark');
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/loginregister');
        return;
      }      setCurrentUserId(authUser.id);

      // Get user's profile for nickname
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, full_name')
        .eq('id', authUser.id)
        .single();

      const userNickname = profileData?.nickname || 
                          profileData?.full_name?.split(' ')[0] || 
                          authUser.user_metadata?.full_name?.split(' ')[0] ||
                          authUser.email?.split('@')[0] || 
                          'User';
      
      setCurrentUserNickname(userNickname);

      // Set user basic info
      setUser({
        name: authUser.user_metadata?.full_name || 
              authUser.user_metadata?.name || 
              authUser.email?.split('@')[0] || 
              'User',
        username: `@${authUser.email?.split('@')[0] || 'user'}`,
        joinDate: `Joined ${new Date(authUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      });

      // Ensure server-side stats are up-to-date from activity (workouts, steps, sets, badges)
      // This will populate user_stats so the leaderboard view can include the user
      try {
        await GamificationDataService.syncUserStatsFromActivity(authUser.id); 
      } catch (syncErr) {
        // Non-fatal: continue but log for visibility
        console.warn('syncUserStatsFromActivity failed', syncErr);
      }

      // Load gamification data and user's leaderboard position
      const [stats, badges, leaderboardData, activeChallenges] = await Promise.all([
        GamificationDataService.getUserStats(authUser.id),
        GamificationDataService.getUserBadges(authUser.id),
        GamificationDataService.getWeeklyLeaderboard(100),
        supabase
          .from('challenges')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      // Try to get the user's position (may be null if safe view prevents mapping)
      let position = null;
      try {
        position = await GamificationDataService.getUserLeaderboardPosition(authUser.id);
      } catch (posErr) {
        console.warn('Could not fetch user leaderboard position', posErr);
      }      setUserStats(stats);
      setUserBadges(badges);
      setLeaderboard(leaderboardData || []);
      setCurrentUserPosition(position);
      setActiveChallenge(activeChallenges?.data?.[0] || null);

    } catch (error) {
      console.error('Error loading user data:', error);
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
      console.error('Error logging out:', error);
    }
  };

  // Map badge icon names to MaterialCommunityIcons
  const getBadgeIconName = (badgeName) => {
    const iconMap = {
      'First Workout': 'medal',
      '7-Day Streak': 'fire',
      '3-Day Streak': 'fire',
      '30-Day Streak': 'fire',
      '100-Day Streak': 'fire',
      'Strength Master': 'dumbbell',
      'Consistency King': 'trophy',
      'Cardio King': 'run',
      'Team Player': 'account-group',
      'Challenge Champion': 'trophy-variant',
      'Community Leader': 'star',
      'Early Bird': 'weather-sunset-up',
      'Night Owl': 'weather-night',
      'Perfect Week': 'star-circle',
      'Marathon Runner': 'run-fast',
      'Variety Seeker': 'target',
    };
    return iconMap[badgeName] || 'medal';
  };

  const getBadgeColor = (badge) => {
    return badge.badges?.color || '#f1c40f';
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
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Profile</Text>
            <NotificationBar notifications={notifications} />
          </View>
          <ProfilePageSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (!user) {
    return null;
  }
  
  // Menu items configuration
  const menuItems = [
    {
      title: "Account",
      items: [
        { icon: "person-outline", color: "#3498db", label: "Edit Profile", path: "../settings/edit" },
        { icon: "shield-checkmark-outline", color: "#2ecc71", label: "Privacy & Security", path: "../settings/privacy" },
        { icon: "star-outline", color: "#f1c40f", label: "My Subscription", path: "../settings/subscription" },
      ],
    },
    {
      title: "Settings",
      items: [
        { icon: "notifications-outline", color: "#e74c3c", label: "Notifications", path: "../settings/notifications" },
        { icon: "help-circle-outline", color: "#1abc9c", label: "Help & Support", path: "../settings/helpsupport" },
      ],
    },
  ];


  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Profile</Text>
            <NotificationBar notifications={notifications} />
          </View>
          
          {/* Profile Header */}
          <ProfileHeader user={user} />
          
          {/* Stats & Achievements Combined */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ Stats & Achievements</Text>
            
            <ProfileStatsCard userStats={userStats} />

            <AchievementBadges 
              userBadges={userBadges} 
              userStats={userStats}
            />
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

          {/* Appearance Section */}
          <View style={styles.card}>
            <View style={styles.appearanceHeader}>
              <Ionicons name="color-palette-outline" size={22} color="#9b59b6" />
              <Text style={styles.cardTitle}>Appearance</Text>
            </View>
            
            <View style={styles.themeContainer}>
              <Pressable 
                style={[styles.themeBox, selectedTheme === 'light' && styles.themeBoxSelected]} 
                onPress={() => setSelectedTheme('light')}
              >
                <Ionicons name="sunny-outline" size={28} color={selectedTheme === 'light' ? '#fff' : '#aaa'} />
                <Text style={[styles.themeLabel, selectedTheme === 'light' && styles.themeLabelSelected]}>Light</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.themeBox, selectedTheme === 'dark' && styles.themeBoxSelected]} 
                onPress={() => setSelectedTheme('dark')}
              >
                <Ionicons name="moon-outline" size={28} color={selectedTheme === 'dark' ? '#fff' : '#aaa'} />
                <Text style={[styles.themeLabel, selectedTheme === 'dark' && styles.themeLabelSelected]}>Dark</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.themeBox, selectedTheme === 'system' && styles.themeBoxSelected]} 
                onPress={() => setSelectedTheme('system')}
              >
                <Ionicons name="cog-outline" size={28} color={selectedTheme === 'system' ? '#fff' : '#aaa'} />
                <Text style={[styles.themeLabel, selectedTheme === 'system' && styles.themeLabelSelected]}>System</Text>
              </Pressable>
            </View>
            
            <Text style={styles.themeHelperText}>
              Dark theme is recommended for low-light gym sessions and reduces eye strain during late-night meal planning
            </Text>
          </View>

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
    alignItems: "center",
    marginBottom: 20,
  },  avatarContainer: {
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#f7971e",
    borderRadius: 75,
    padding: 4,
  },
  avatarIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f7971e",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  userHandle: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 4,
  },
  joinDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#aaa",
    textTransform: 'uppercase'
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#eee",
    fontWeight: '500',
  },
  logoutContainer: {
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 24,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },  logoutText: {
    fontSize: 16,
    color: "#e74c3c",
    fontWeight: 'bold',
    marginLeft: 10,
  },  // Combined Stats & Achievements styles - More Compact
  primaryStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  primaryStatItem: {
    alignItems: "center",
    flex: 1,
  },
  primaryStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
    borderWidth: 1.5,
  },
  primaryStatText: {
    alignItems: "center",
  },
  primaryStatValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  primaryStatLabel: {
    fontSize: 9,
    color: "#aaa",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: "uppercase",
  },
  achievementsHeader: {
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.8,
  },
  achievementsSubtitle: {
    fontSize: 11,
    color: "#f1c40f",
    fontWeight: "600",
    marginTop: 2,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  achievementCard: {
    width: "47%",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  achievementIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementGlow: {
    display: "none",
  },
  achievementName: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
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
  },  // Enhanced Leaderboard styles
  leaderboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  challengeSubtitle: {
    fontSize: 11,
    color: "#f39c12",
    fontWeight: "600",
    marginTop: 4,
    fontStyle: "italic",
  },
  leaderboardHeaderRight: {
    alignItems: "flex-end",
  },
  leaderboardTimer: {
    fontSize: 11,
    color: "#f39c12",
    fontWeight: "600",
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  leaderboardContainer: {
    gap: 6,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  currentUserRow: {
    backgroundColor: "rgba(247, 151, 30, 0.1)",
    borderColor: "rgba(247, 151, 30, 0.3)",
    borderWidth: 1.5,
  },
  leaderboardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#444",
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
    fontWeight: "bold",
    color: "#fff",
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
    fontWeight: "600",
    marginBottom: 4,
  },
  currentUserName: {
    color: "#f7971e",
    fontWeight: "700",
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 1.5,
    overflow: "hidden",
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
    fontWeight: "700",
    marginBottom: 2,
  },
  currentUserPoints: {
    color: "#f7971e",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "600",
  },
  leaderboardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
    fontStyle: "italic",
  },
  // Appearance/Theme styles
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  themeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 10, 
    marginBottom: 12,
  },
  themeBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  themeBoxSelected: {
    borderColor: '#f7971e',
    backgroundColor: 'rgba(247, 151, 30, 0.2)',
  },
  themeLabel: { 
    fontSize: 13, 
    color: '#aaa', 
    fontWeight: '600',
  },
  themeLabelSelected: { 
    color: '#fff',
  },
  themeHelperText: {
    color: '#666',
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 5,
  },
});
