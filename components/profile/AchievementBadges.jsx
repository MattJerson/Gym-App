import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AchievementBadges({ userBadges, userStats }) {
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

  return (
    <>
      <View style={styles.achievementsHeader}>
        <Text style={styles.achievementsTitle}>🏆 ACHIEVEMENTS</Text>
        <Text style={styles.achievementsSubtitle}>
          {userBadges.length}/{userStats?.badges_earned || 0}
        </Text>
      </View>
      
      <View style={styles.achievementsGrid}>
        {userBadges.slice(0, 4).map((badge) => (
          <View key={badge.id} style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: getBadgeColor(badge) }]}>
              <MaterialCommunityIcons 
                name={getBadgeIconName(badge.badges?.name)} 
                size={16} 
                color="#fff" 
              />
            </View>
            <Text style={styles.achievementName}>{badge.badges?.name}</Text>
          </View>
        ))}
        {userBadges.length === 0 && (
          <Text style={styles.emptyText}>
            Complete workouts to earn badges!
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  achievementsHeader: {
    alignItems: "center",
    marginBottom: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  achievementsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.6,
  },
  achievementsSubtitle: {
    fontSize: 9,
    color: "#f1c40f",
    fontWeight: "600",
    marginTop: 1,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  achievementCard: {
    width: "47%",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  achievementIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementName: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 10,
    fontSize: 11,
  },
});
