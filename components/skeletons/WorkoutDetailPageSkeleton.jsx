import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const WorkoutDetailPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonCircle size={28} />
        <View style={{ flex: 1, marginHorizontal: 16 }}>
          <SkeletonText width="80%" lines={1} style={{ height: 24 }} />
        </View>
        <SkeletonCircle size={28} />
      </View>

      {/* Workout Image/Banner */}
      <SkeletonLoader width="100%" height={200} borderRadius={20} style={{ marginBottom: 20 }} />

      {/* Workout Info Card */}
      <View style={styles.infoCard}>
        <SkeletonText width="60%" lines={1} style={{ marginBottom: 12, height: 22 }} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <SkeletonCircle size={20} style={{ marginBottom: 6 }} />
            <SkeletonText width={40} lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width={50} lines={1} />
          </View>
          <View style={styles.statItem}>
            <SkeletonCircle size={20} style={{ marginBottom: 6 }} />
            <SkeletonText width={35} lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width={55} lines={1} />
          </View>
          <View style={styles.statItem}>
            <SkeletonCircle size={20} style={{ marginBottom: 6 }} />
            <SkeletonText width={45} lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width={45} lines={1} />
          </View>
        </View>
      </View>

      {/* Exercises Section */}
      <View style={styles.section}>
        <SkeletonText width="35%" lines={1} style={{ marginBottom: 16, height: 20 }} />
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.exerciseCard}>
            <SkeletonLoader width={64} height={64} borderRadius={12} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonText width="70%" lines={1} style={{ marginBottom: 8 }} />
              <SkeletonText width="50%" lines={1} style={{ marginBottom: 8 }} />
              <View style={styles.setsRow}>
                <SkeletonLoader width={60} height={24} borderRadius={8} style={{ marginRight: 8 }} />
                <SkeletonLoader width={60} height={24} borderRadius={8} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Start Workout Button */}
      <SkeletonLoader width="100%" height={56} borderRadius={16} style={{ marginTop: 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  setsRow: {
    flexDirection: 'row',
  },
});
