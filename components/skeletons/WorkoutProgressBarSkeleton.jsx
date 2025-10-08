import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const WorkoutProgressBarSkeleton = () => {
  return (
    <View style={styles.mainCard}>
      {/* Date + Title */}
      <View style={styles.headerRow}>
        <View style={styles.dateSection}>
          <SkeletonText width={40} lines={1} />
          <SkeletonText width={30} lines={1} style={{ marginLeft: 5 }} />
        </View>
        <View style={styles.titleSection}>
          <SkeletonLoader width={5} height={5} borderRadius={2.5} style={{ marginRight: 7 }} />
          <SkeletonText width={70} lines={1} />
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <SkeletonText width={80} height={58} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonText width={120} lines={1} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <SkeletonCircle size={24} />
            <SkeletonLoader width={38} height={20} borderRadius={7} />
          </View>
          <SkeletonText width={60} lines={1} style={{ marginBottom: 3 }} />
          <SkeletonText width={40} lines={1} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={3} borderRadius={1.5} style={{ marginBottom: 6 }} />
          <SkeletonText width={80} lines={1} />
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <SkeletonCircle size={24} />
            <SkeletonLoader width={38} height={20} borderRadius={7} />
          </View>
          <SkeletonText width={50} lines={1} style={{ marginBottom: 3 }} />
          <SkeletonText width={50} lines={1} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={3} borderRadius={1.5} style={{ marginBottom: 6 }} />
          <SkeletonText width={90} lines={1} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});
