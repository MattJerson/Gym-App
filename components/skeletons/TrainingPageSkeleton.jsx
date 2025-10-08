import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCard, SkeletonCircle, SkeletonText, SkeletonButton } from '../SkeletonLoader';

export const TrainingPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Workout Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <SkeletonText width="50%" lines={1} />
          <SkeletonText width="30%" lines={1} />
        </View>
        <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginTop: 12 }} />
      </View>

      {/* Continue Workout Card */}
      <SkeletonCard height={140} style={{ marginBottom: 20 }} />

      {/* Today's Workout Card */}
      <SkeletonCard height={140} style={{ marginBottom: 20 }} />

      {/* Browse Workouts */}
      <View style={styles.browseSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.categoriesGrid}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.categoryCard}>
              <SkeletonLoader width="100%" height={100} borderRadius={16} />
              <SkeletonText width="80%" lines={1} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Workouts */}
      <View style={styles.recentSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        {[1, 2].map((item) => (
          <View key={item} style={styles.workoutCard}>
            <SkeletonCircle size={50} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonText width="60%" lines={1} style={{ marginBottom: 8 }} />
              <SkeletonText width="40%" lines={1} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  progressSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  browseSection: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: 16,
  },
  recentSection: {
    marginBottom: 20,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
