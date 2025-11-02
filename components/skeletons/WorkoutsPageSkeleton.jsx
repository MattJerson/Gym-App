import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const WorkoutsPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonCircle size={28} />
        <SkeletonText width={140} lines={1} style={{ height: 28 }} />
        <View style={{ width: 28 }} />
      </View>

      {/* Create New Workout Button */}
      <SkeletonLoader width="100%" height={56} borderRadius={16} style={{ marginBottom: 30 }} />

      {/* My Custom Workouts Section */}
      <View style={styles.section}>
        <SkeletonText width="50%" lines={1} style={{ marginBottom: 16, height: 20 }} />
        {[1, 2].map((item) => (
          <View key={item} style={styles.workoutCard}>
            <SkeletonCircle size={32} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <SkeletonText width="60%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="80%" lines={1} />
            </View>
            <SkeletonCircle size={22} />
          </View>
        ))}
      </View>

      {/* Workout Templates Section */}
      <View style={styles.section}>
        <SkeletonText width="45%" lines={1} style={{ marginBottom: 16, height: 20 }} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.workoutCard}>
            <SkeletonCircle size={28} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <SkeletonText width="65%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="75%" lines={1} />
            </View>
            <SkeletonLoader width={60} height={32} borderRadius={20} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: 20,
  },
  workoutCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
