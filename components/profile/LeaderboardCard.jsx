import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LeaderboardCard({ 
  leaderboard, 
  activeChallenge,
  currentUserPosition,
  currentUserId,
  currentUserNickname,
  getTimeRemaining
}) {
  return (
    <View style={styles.card}>
      <View style={styles.leaderboardHeader}>
        <View>
          <Text style={styles.cardTitle}>🏁 Weekly Leaderboard</Text>
          {activeChallenge && (
            <Text style={styles.challengeSubtitle}>
              🎯 {activeChallenge.title}
            </Text>
          )}
        </View>
        <View style={styles.leaderboardHeaderRight}>
          <Text style={styles.leaderboardTimer}>⏱️ {getTimeRemaining()}</Text>
        </View>
      </View>
      
      <View style={styles.leaderboardContainer}>
        {leaderboard.slice(0, 10).map((leaderUser, index) => {
          const leaderKey = leaderUser.anon_id || leaderUser.user_id || `pos-${leaderUser.position || index}`;
          const isCurrentUser = currentUserPosition && (leaderUser.position === currentUserPosition);
          
          let displayName = leaderUser.display_name || leaderUser.user_name || 'User';
          if (isCurrentUser && currentUserNickname) {
            displayName = currentUserNickname;
          }
          
          return (
            <View key={leaderKey} style={[
              styles.leaderboardRow,
              isCurrentUser && styles.currentUserRow
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
                          width: `${Math.min((leaderUser.total_points / (leaderboard[0]?.total_points || 1)) * 100, 100)}%`,
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
        {leaderboard.length === 0 && (
          <Text style={styles.emptyText}>
            No active users this week. Be the first!
          </Text>
        )}
      </View>
      
      <View style={styles.leaderboardFooter}>
        <Text style={styles.footerText}>💪 Keep pushing to climb higher!</Text>
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
  emptyText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
