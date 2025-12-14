import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Randomized placeholder names for empty leaderboard spots
const PLACEHOLDER_NAMES = [
  'Alex Fitness', 'Jamie Strong', 'Casey Champion', 'Jordan Power',
  'Taylor Swift', 'Morgan Muscle', 'Riley Runner', 'Quinn Quest',
  'Avery Active', 'Blake Buff', 'Dakota Driven', 'Sage Strong',
  'Rowan Ready', 'Phoenix Fit', 'Skylar Solid', 'Cameron Core'
];

// Get consistent random name based on position (same each render)
const getPlaceholderName = (position) => {
  const index = (position - 1) % PLACEHOLDER_NAMES.length;
  return PLACEHOLDER_NAMES[index];
};

export default function LeaderboardCard({ 
  leaderboard, 
  activeChallenge,
  currentUserPosition,
  currentUserId,
  currentUserNickname,
  getTimeRemaining
}) {
  // Format metric type for display
  const formatMetricType = (metricType) => {
    if (!metricType) return "";
    const map = {
      "workouts_completed": "Workouts",
      "calories_burned": "Calories",
      "total_exercises": "Exercises",
      "streak_days": "Streak Days"
    };
    return map[metricType] || metricType;
  };

  // Show top 3, then current user if they're not in top 3
  const displayLeaderboard = React.useMemo(() => {
    const topThree = leaderboard.slice(0, 3);
    const minEntries = 3;
    
    // Pad top 3 with placeholders if needed
    while (topThree.length < minEntries) {
      const position = topThree.length + 1;
      topThree.push({
        position: position,
        user_id: null,
        display_name: getPlaceholderName(position),
        total_points: 0,
        current_streak: 0,
        progress_value: 0,
        target_value: 0,
        anon_id: `placeholder-${position}`,
        is_placeholder: true
      });
    }
    
    // Check if current user is in top 3
    const userInTopThree = topThree.some(user => user.user_id === currentUserId);
    
    // If user is not in top 3 and exists in leaderboard, add them as 4th entry
    if (!userInTopThree && currentUserId) {
      const currentUserEntry = leaderboard.find(user => user.user_id === currentUserId);
      if (currentUserEntry) {
        return [...topThree, currentUserEntry];
      }
      
      // If user not in leaderboard at all, add them at position 4 with 0 points
      return [...topThree, {
        position: 4,
        user_id: currentUserId,
        display_name: currentUserNickname || 'You',
        total_points: 0,
        current_streak: 0,
        progress_value: 0,
        target_value: 0,
        anon_id: `current-user`,
        is_placeholder: false
      }];
    }
    
    return topThree;
  }, [leaderboard, currentUserId, currentUserNickname]);

  return (
    <View style={styles.card}>
      <View style={styles.leaderboardHeader}>
        <View style={{flex: 1}}>
          <Text style={styles.cardTitle}>🏁 Weekly Challenge</Text>
          {activeChallenge && (
            <>
              <Text style={styles.challengeSubtitle}>
                🎯 {activeChallenge.title}
              </Text>
              <Text style={styles.challengeMetric}>
                {formatMetricType(activeChallenge.metric_type)}
                {activeChallenge.target_value && ` • Target: ${activeChallenge.target_value}`}
              </Text>
            </>
          )}
        </View>
        <View style={styles.leaderboardHeaderRight}>
          <Text style={styles.leaderboardTimer}>⏱️ {getTimeRemaining()}</Text>
        </View>
      </View>
      
      <View style={styles.leaderboardContainer}>
        {displayLeaderboard.slice(0, 10).map((leaderUser, index) => {
          const leaderKey = leaderUser.anon_id || leaderUser.user_id || `pos-${leaderUser.position || index}`;
          const isCurrentUser = leaderUser.user_id === currentUserId && !leaderUser.is_placeholder;
          const isPlaceholder = leaderUser.is_placeholder || (leaderUser.total_points === 0 && !leaderUser.user_id);
          
          // Use the display_name from the database (already includes nickname logic from GamificationDataService)
          let displayName = leaderUser.display_name || leaderUser.user_name || `User ${leaderUser.position || index + 1}`;
          
          // Only override with currentUserNickname if this is actually the current user
          if (isCurrentUser && currentUserNickname) {
            displayName = currentUserNickname;
          }
          
          return (
            <View key={leaderKey} style={[
              styles.leaderboardRow,
              isCurrentUser && styles.currentUserRow,
              isPlaceholder && styles.placeholderRow
            ]}>
              <View style={styles.leaderboardLeft}>
                <View
                  style={[
                    styles.positionBadge,
                    leaderUser.position === 1 && styles.goldBadge,
                    leaderUser.position === 2 && styles.silverBadge,
                    leaderUser.position === 3 && styles.bronzeBadge,
                  ]}
                >
                  {leaderUser.position <= 3 ? (
                    <Text style={styles.medalEmoji}>
                      {leaderUser.position === 1 ? "🥇" : 
                       leaderUser.position === 2 ? "🥈" : "🥉"}
                    </Text>
                  ) : (
                    <Text style={styles.positionText}>{leaderUser.position}</Text>
                  )}
                </View>
                
                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.leaderboardName,
                      isCurrentUser && styles.currentUserName,
                    ]}
                  >
                    {displayName}
                    {isCurrentUser && <Text> (You)</Text>}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min((leaderUser.total_points / (displayLeaderboard[0]?.total_points || 1)) * 100, 100)}%`,
                          backgroundColor:
                            leaderUser.position === 1 ? "#f1c40f" :
                            leaderUser.position === 2 ? "#95a5a6" :
                            leaderUser.position === 3 ? "#e67e22" : "#5B86E5",
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.pointsContainer}>
                <Text style={[
                  styles.leaderboardPoints,
                  isCurrentUser && styles.currentUserPoints
                ]}>
                  {(leaderUser.total_points ?? 0).toLocaleString()}
                </Text>
                <View style={styles.trendContainer}>
                  <Ionicons name="flame" size={12} color="#FF6B35" />
                  <Text style={[styles.trendText, { color: "#FF6B35" }]}>
                    {leaderUser.current_streak ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      
      <View style={styles.leaderboardFooter}>
        <Text style={styles.footerText}>
          {leaderboard.length === 0 
            ? "🎯 Start a workout to earn your first points!" 
            : "💪 Keep pushing to climb higher!"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  challengeMetric: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "500",
    marginTop: 2,
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
  placeholderRow: {
    opacity: 0.4,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
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
  motivationalText: {
    fontSize: 11,
    color: "#5B86E5",
    fontWeight: "600",
    fontStyle: "italic",
    textAlign: "right",
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
  emptyText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
