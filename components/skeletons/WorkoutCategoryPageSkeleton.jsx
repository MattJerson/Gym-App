import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonText } from '../SkeletonLoader';

export const WorkoutCategoryPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={40} height={40} borderRadius={12} />
        <View style={styles.headerContent}>
          <SkeletonText width={180} lines={1} style={{ marginBottom: 4 }} />
          <SkeletonText width={120} lines={1} />
        </View>
      </View>

      {/* Workout Cards Skeleton */}
      <View style={styles.scrollContent}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.workoutCard}>
            <View style={styles.cardContent}>
              {/* Difficulty Badge */}
              <SkeletonLoader width={80} height={24} borderRadius={12} style={{ marginBottom: 12 }} />
              
              {/* Title */}
              <SkeletonText width="85%" lines={1} style={{ marginBottom: 8 }} />
              
              {/* Description */}
              <SkeletonText width="100%" lines={2} style={{ marginBottom: 16 }} />
              
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <SkeletonLoader width={60} height={16} borderRadius={4} />
                <SkeletonLoader width={60} height={16} borderRadius={4} />
                <SkeletonLoader width={60} height={16} borderRadius={4} />
              </View>
              
              {/* Bottom Row */}
              <View style={styles.bottomRow}>
                <SkeletonText width={120} lines={1} />
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    gap: 16,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  workoutCard: {
    borderWidth: 1,
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardContent: {
    padding: 16,
  },
  statsRow: {
    gap: 16,
    marginBottom: 16,
    flexDirection: 'row',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});