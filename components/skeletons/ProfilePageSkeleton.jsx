import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const ProfilePageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Profile Header - matches ProfileHeader */}
      <View style={styles.headerSection}>
        <SkeletonCircle size={120} style={{ alignSelf: 'center', marginBottom: 16, borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <SkeletonText width="50%" lines={1} style={{ alignSelf: 'center', marginBottom: 8, height: 28 }} />
        <SkeletonText width="35%" lines={1} style={{ alignSelf: 'center', marginBottom: 4 }} />
        <SkeletonText width="30%" lines={1} style={{ alignSelf: 'center', marginBottom: 20 }} />
      </View>

      {/* Profile Stats Card - matches ProfileStatsCard */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginBottom: 8 }} />
            <SkeletonText width={40} lines={1} style={{ marginBottom: 4, height: 16 }} />
            <SkeletonText width={50} lines={1} style={{ height: 10 }} />
          </View>
          <View style={styles.statItem}>
            <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginBottom: 8 }} />
            <SkeletonText width={35} lines={1} style={{ marginBottom: 4, height: 16 }} />
            <SkeletonText width={55} lines={1} style={{ height: 10 }} />
          </View>
          <View style={styles.statItem}>
            <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginBottom: 8 }} />
            <SkeletonText width={30} lines={1} style={{ marginBottom: 4, height: 16 }} />
            <SkeletonText width={45} lines={1} style={{ height: 10 }} />
          </View>
        </View>
      </View>

      {/* Leaderboard Card - matches LeaderboardCard */}
      <View style={styles.leaderboardCard}>
        <View style={styles.leaderboardHeader}>
          <SkeletonText width="45%" lines={1} style={{ height: 18 }} />
          <View style={styles.timerContainer}>
            <SkeletonCircle size={14} style={{ marginRight: 6 }} />
            <SkeletonText width={60} lines={1} />
          </View>
        </View>
        
        {/* Top 10 Leaderboard Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((position) => (
          <View key={position} style={styles.leaderboardRow}>
            <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width="60%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonLoader width="100%" height={4} borderRadius={2} />
            </View>
            <SkeletonText width={45} lines={1} style={{ marginLeft: 12 }} />
          </View>
        ))}
      </View>

      {/* Achievement Badges - matches AchievementBadges */}
      <View style={styles.badgesCard}>
        <View style={styles.badgesHeader}>
          <SkeletonText width="40%" lines={1} />
          <SkeletonText width={60} lines={1} />
        </View>
        <View style={styles.badgesGrid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <View key={item} style={styles.badgeItem}>
              <SkeletonCircle size={64} style={{ marginBottom: 8 }} />
              <SkeletonText width={60} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={70} lines={1} />
            </View>
          ))}
        </View>
      </View>

      {/* Profile Menu Section - matches ProfileMenuSection */}
      <View style={styles.menuCard}>
        <SkeletonText width="35%" lines={1} style={{ marginBottom: 16 }} />
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <SkeletonCircle size={24} style={{ marginRight: 12 }} />
              <View>
                <SkeletonText width={100} lines={1} style={{ marginBottom: 4 }} />
                <SkeletonText width={140} lines={1} />
              </View>
            </View>
            <SkeletonCircle size={16} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
    paddingVertical: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  leaderboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  badgesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
