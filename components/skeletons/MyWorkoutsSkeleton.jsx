import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonText } from '../SkeletonLoader';

export const MyWorkoutsSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Title Row */}
      <View style={styles.titleRow}>
        <SkeletonText width={120} lines={1} />
        <SkeletonLoader width={70} height={20} borderRadius={10} />
      </View>

      {/* Workout Cards */}
      {[1, 2].map((item) => (
        <View key={item} style={styles.workoutCard}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <SkeletonLoader width={60} height={60} borderRadius={16} />
              <View style={styles.workoutInfo}>
                <SkeletonText width={120} lines={1} style={{ marginBottom: 6 }} />
                <SkeletonText width={90} lines={1} style={{ marginBottom: 4 }} />
                <SkeletonText width={80} lines={1} />
              </View>
            </View>
            <SkeletonLoader width={24} height={24} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutInfo: {
    marginLeft: 12,
    flex: 1,
  },
});
