import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonText } from '../SkeletonLoader';

export const WorkoutSessionPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={40} height={40} borderRadius={12} />
        <View style={styles.headerContent}>
          <SkeletonText width={180} lines={1} style={{ marginBottom: 4 }} />
          <SkeletonText width={120} lines={1} />
        </View>
        <SkeletonLoader width={60} height={32} borderRadius={16} />
      </View>

      {/* Stats Cards Skeleton */}
      <View style={styles.statsContainer}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.statCard}>
            <SkeletonLoader width={24} height={24} borderRadius={12} style={{ marginBottom: 8 }} />
            <SkeletonText width={40} lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width={60} lines={1} />
          </View>
        ))}
      </View>

      {/* Progress Bar Skeleton */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <SkeletonText width={100} lines={1} />
          <SkeletonText width={40} lines={1} />
        </View>
        <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonText width={150} lines={1} />
      </View>

      {/* Exercise Cards Skeleton */}
      <View style={styles.exerciseList}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.exerciseCard}>
            {/* Exercise Image */}
            <SkeletonLoader width={80} height={80} borderRadius={12} style={{ marginBottom: 12 }} />
            
            {/* Exercise Info */}
            <SkeletonText width="80%" lines={1} style={{ marginBottom: 8 }} />
            <SkeletonText width="60%" lines={1} style={{ marginBottom: 12 }} />
            
            {/* Progress Bar */}
            <View style={styles.exerciseProgress}>
              <SkeletonLoader width="100%" height={6} borderRadius={3} style={{ marginBottom: 8 }} />
              <View style={styles.progressActions}>
                <SkeletonText width={80} lines={1} />
                <SkeletonLoader width={100} height={32} borderRadius={16} />
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
  statsContainer: {
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseList: {
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  exerciseCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  exerciseProgress: {
    marginTop: 4,
  },
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});