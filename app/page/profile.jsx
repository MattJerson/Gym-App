import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import NotificationBar from "../../components/NotificationBar";

// Mock user data
const user = {
  name: "Matt",
  username: "@matt_dev",
  joinDate: "Joined June 2024",
  stats: {
    workouts: 75,
    streak: 5,
    followers: 245,
  },
  badges: [
    { id: 1, name: "First Workout", icon: "medal", color: "#f1c40f" },
    { id: 2, name: "7-Day Streak", icon: "fire", color: "#e74c3c" },
    { id: 3, name: "Strength Master", icon: "dumbbell", color: "#9b59b6" },
    { id: 4, name: "Consistency King", icon: "trophy", color: "#f39c12" },
  ],
};

// Mock leaderboard data
const leaderboardData = [
  { id: 1, name: "Sarah Johnson", points: 1247, position: 1 },
  { id: 2, name: "Mike Davis", points: 1156, position: 2 },
  { id: 3, name: "Matt", points: 987, position: 3 },
  { id: 4, name: "Emma Wilson", points: 876, position: 4 },
  { id: 5, name: "Alex Chen", points: 743, position: 5 },
];

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications] = useState(3);
  const [selectedTheme, setSelectedTheme] = useState('dark');

  const handlePress = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };
  
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
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarIcon}>
                <MaterialCommunityIcons name="account" size={60} color="#fff" />
              </View>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userHandle}>{user.username}</Text>
            <Text style={styles.joinDate}>{user.joinDate}</Text>
          </View>
          
          {/* Stats & Achievements Combined */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ Stats & Achievements</Text>
            
            {/* Primary Stats Row - More Compact */}
            <View style={styles.primaryStatsContainer}>
              <View style={styles.primaryStatItem}>
                <View style={[styles.primaryStatIcon, { borderColor: "#FF6B35" }]}>
                  <FontAwesome5 name="fire" size={16} color="#FF6B35" />
                </View>
                <Text style={styles.primaryStatValue}>{user.stats.streak}</Text>
                <Text style={styles.primaryStatLabel}>STREAK</Text>
              </View>
              
              <View style={styles.primaryStatItem}>
                <View style={[styles.primaryStatIcon, { borderColor: "#00D4AA" }]}>
                  <MaterialCommunityIcons name="dumbbell" size={16} color="#00D4AA" />
                </View>
                <Text style={styles.primaryStatValue}>{user.stats.workouts}</Text>
                <Text style={styles.primaryStatLabel}>WORKOUTS</Text>
              </View>
              
              <View style={styles.primaryStatItem}>
                <View style={[styles.primaryStatIcon, { borderColor: "#5B86E5" }]}>
                  <Ionicons name="people" size={16} color="#5B86E5" />
                </View>
                <Text style={styles.primaryStatValue}>{user.stats.followers}</Text>
                <Text style={styles.primaryStatLabel}>FOLLOWERS</Text>
              </View>
            </View>

            {/* Achievements Grid - More Compact */}
            <View style={styles.achievementsHeader}>
              <Text style={styles.achievementsTitle}>🏆 ACHIEVEMENTS</Text>
              <Text style={styles.achievementsSubtitle}>4/12</Text>
            </View>
            
            <View style={styles.achievementsGrid}>
              {user.badges.map((badge, index) => (
                <View key={index} style={styles.achievementCard}>
                  <View style={[styles.achievementIcon, { backgroundColor: badge.color }]}>
                    <MaterialCommunityIcons name={badge.icon} size={18} color="#fff" />
                  </View>
                  <Text style={styles.achievementName}>{badge.name}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Leaderboard Section */}
          <View style={styles.card}>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.cardTitle}>🏁 Weekly Leaderboard</Text>
              <View style={styles.leaderboardHeaderRight}>
                <Text style={styles.leaderboardTimer}>⏱️ 2d 14h left</Text>
              </View>
            </View>
            
            <View style={styles.leaderboardContainer}>
              {leaderboardData.map((user, index) => (
                <View key={user.id} style={[
                  styles.leaderboardRow,
                  user.name === "Matt" && styles.currentUserRow
                ]}>
                  <View style={styles.leaderboardLeft}>
                    {/* Position with Medal Icons for Top 3 */}
                    <View
                      style={[
                        styles.positionBadge,
                        user.position === 1 && styles.goldBadge,
                        user.position === 2 && styles.silverBadge,
                        user.position === 3 && styles.bronzeBadge,
                      ]}
                    >
                      {user.position <= 3 ? (
                        <Text style={styles.medalEmoji}>
                          {user.position === 1
                            ? "🥇"
                            : user.position === 2
                            ? "🥈"
                            : "🥉"}
                        </Text>
                      ) : (
                        <Text style={styles.positionText}>{user.position}</Text>
                      )}
                    </View>
                    
                    {/* User Info */}
                    <View style={styles.userInfo}>
                      <Text
                        style={[
                          styles.leaderboardName,
                          user.name === "Matt" && styles.currentUserName,
                        ]}
                      >
                        {user.name}
                        {user.name === "Matt" && <Text> (You)</Text>}
                      </Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(user.points / 1247) * 100}%`,
                              backgroundColor:
                                user.position === 1
                                  ? "#f1c40f"
                                  : user.position === 2
                                  ? "#95a5a6"
                                  : user.position === 3
                                  ? "#e67e22"
                                  : "#5B86E5",
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  
                  {/* Points with Trend */}
                  <View style={styles.pointsContainer}>
                    <Text style={[
                      styles.leaderboardPoints,
                      user.name === "Matt" && styles.currentUserPoints
                    ]}>
                      {user.points.toLocaleString()}
                    </Text>
                    <View style={styles.trendContainer}>
                      <Ionicons 
                        name={index < 2 ? "trending-up" : "trending-down"} 
                        size={12} 
                        color={index < 2 ? "#00D4AA" : "#e74c3c"} 
                      />
                      <Text style={[
                        styles.trendText,
                        { color: index < 2 ? "#00D4AA" : "#e74c3c" }
                      ]}>
                        {index < 2 ? "+24" : "-12"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Leaderboard Footer */}
            <View style={styles.leaderboardFooter}>
              <Text style={styles.footerText}>💪 Keep pushing to climb higher!</Text>
            </View>
          </View>
          
          {/* Account Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{menuItems[0].title}</Text>
            {menuItems[0].items.map((item, itemIndex) => (
               <Pressable key={itemIndex} style={styles.menuRow} onPress={() => handlePress(item.path)}>
                 <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                   <Ionicons name={item.icon} size={20} color="#fff" />
                 </View>
                 <Text style={styles.menuLabel}>{item.label}</Text>
                 <Ionicons name="chevron-forward" size={22} color="#555" />
               </Pressable>
            ))}
          </View>

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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{menuItems[1].title}</Text>
            {menuItems[1].items.map((item, itemIndex) => (
               <Pressable key={itemIndex} style={styles.menuRow} onPress={() => handlePress(item.path)}>
                 <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                   <Ionicons name={item.icon} size={20} color="#fff" />
                 </View>
                 <Text style={styles.menuLabel}>{item.label}</Text>
                 <Ionicons name="chevron-forward" size={22} color="#555" />
               </Pressable>
            ))}
          </View>


          {/* Logout Button */}
           <View style={styles.logoutContainer}>
            <Pressable style={styles.logoutButton} onPress={() => handlePress("/auth/loginregister")}>
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
    alignItems: "center",
    marginBottom: 15,
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
