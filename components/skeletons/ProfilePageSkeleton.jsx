import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const ProfilePageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerSection}>
        <SkeletonCircle size={100} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <SkeletonText width="50%" lines={1} style={{ alignSelf: 'center', marginBottom: 8 }} />
        <SkeletonText width="40%" lines={1} style={{ alignSelf: 'center', marginBottom: 4 }} />
        <SkeletonText width="30%" lines={1} style={{ alignSelf: 'center', marginBottom: 20 }} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.statCard}>
            <SkeletonLoader width={40} height={40} borderRadius={12} style={{ marginBottom: 8 }} />
            <SkeletonText width="80%" lines={1} />
          </View>
        ))}
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <SkeletonText width="30%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.badgesRow}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.badgeItem}>
              <SkeletonCircle size={60} />
              <SkeletonText width={50} lines={1} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Leaderboard Section */}
      <View style={styles.leaderboardSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.leaderboardRow}>
            <SkeletonText width={30} lines={1} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonText width="60%" lines={1} />
            </View>
            <SkeletonText width={50} lines={1} />
          </View>
        ))}
      </View>

      {/* Active Challenge */}
      <View style={styles.challengeSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 12 }} />
        <View style={styles.challengeCard}>
          <SkeletonText width="70%" lines={1} style={{ marginBottom: 8 }} />
          <SkeletonText width="90%" lines={2} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={8} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgesSection: {
    marginBottom: 24,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badgeItem: {
    alignItems: 'center',
  },
  leaderboardSection: {
    marginBottom: 24,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  challengeSection: {
    marginBottom: 20,
  },
  challengeCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
