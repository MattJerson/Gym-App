import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const ProfilePageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerSection}>
        {/* Avatar with border */}
        <View style={styles.avatarContainer}>
          <SkeletonLoader width={120} height={120} borderRadius={60} />
        </View>
        <SkeletonLoader width={150} height={28} borderRadius={14} style={{ alignSelf: 'center', marginBottom: 8 }} />
        <SkeletonLoader width={100} height={16} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 4 }} />
        <SkeletonLoader width={90} height={12} borderRadius={6} style={{ alignSelf: 'center', marginBottom: 20 }} />
      </View>

      {/* Profile Stats Card - 3 stats */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.statItem}>
              <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={40} height={16} borderRadius={8} style={{ marginBottom: 2 }} />
              <SkeletonLoader width={50} height={10} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>

      {/* Leaderboard Card */}
      <View style={styles.leaderboardCard}>
        <View style={styles.leaderboardHeader}>
          <View>
            <SkeletonLoader width={160} height={18} borderRadius={9} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={140} height={14} borderRadius={7} />
          </View>
          <SkeletonLoader width={80} height={14} borderRadius={7} />
        </View>
        
        {/* Top 10 Leaderboard Rows */}
        {[...Array(10)].map((_, i) => (
          <View key={i} style={styles.leaderboardRow}>
            <SkeletonLoader width={28} height={28} borderRadius={14} />
            <View style={styles.leaderboardInfo}>
              <SkeletonLoader width="60%" height={16} borderRadius={8} style={{ marginBottom: 6 }} />
              <SkeletonLoader width="100%" height={4} borderRadius={2} />
            </View>
            <SkeletonLoader width={45} height={16} borderRadius={8} />
          </View>
        ))}
      </View>

      {/* Achievement Badges */}
      <View style={styles.badgesCard}>
        <View style={styles.badgesHeader}>
          <SkeletonLoader width={130} height={20} borderRadius={10} />
          <SkeletonLoader width={60} height={16} borderRadius={8} />
        </View>
        <View style={styles.badgesGrid}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.badgeItem}>
              <SkeletonLoader width={64} height={64} borderRadius={32} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={60} height={12} borderRadius={6} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={70} height={10} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>

      {/* Profile Menu Section */}
      <View style={styles.menuCard}>
        <SkeletonLoader width={100} height={18} borderRadius={9} style={{ marginBottom: 16 }} />
        {[...Array(4)].map((_, i) => (
          <View key={i} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <SkeletonLoader width={24} height={24} borderRadius={12} />
              <View style={{ marginLeft: 12 }}>
                <SkeletonLoader width={100} height={16} borderRadius={8} style={{ marginBottom: 4 }} />
                <SkeletonLoader width={140} height={12} borderRadius={6} />
              </View>
            </View>
            <SkeletonLoader width={16} height={16} borderRadius={8} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  avatarContainer: {
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(247, 151, 30, 0.3)',
    borderRadius: 63,
    padding: 4,
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
    justifyContent: 'space-between',
    paddingHorizontal: 5,
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
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 12,
  },
  leaderboardInfo: {
    flex: 1,
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
