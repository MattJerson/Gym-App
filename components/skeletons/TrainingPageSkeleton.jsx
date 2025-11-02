import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const TrainingPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Workout Progress Bar - matches WorkoutProgressBar exact size */}
      <View style={styles.progressCard}>
        {/* Header with date and title */}
        <View style={styles.progressHeader}>
          <View style={styles.dateBox}>
            <SkeletonText width={30} lines={1} style={{ marginBottom: 2 }} />
            <SkeletonText width={25} lines={1} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonLoader width={8} height={8} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonText width={80} lines={1} />
          </View>
        </View>

        {/* Big percentage number and progress bar */}
        <View style={styles.progressSection}>
          <SkeletonText width={60} lines={1} style={{ marginBottom: 8, height: 40 }} />
          <SkeletonLoader width="100%" height={10} borderRadius={5} style={{ marginBottom: 6 }} />
          <SkeletonText width="50%" lines={1} />
        </View>

        {/* Stats Row - steps and workouts */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <SkeletonText width={24} lines={1} />
              <SkeletonLoader width={40} height={20} borderRadius={10} />
            </View>
            <SkeletonText width={70} lines={1} style={{ marginBottom: 4, marginTop: 8 }} />
            <SkeletonText width={50} lines={1} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={6} borderRadius={3} style={{ marginBottom: 6 }} />
            <SkeletonText width={80} lines={1} />
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <SkeletonText width={24} lines={1} />
              <SkeletonLoader width={40} height={20} borderRadius={10} />
            </View>
            <SkeletonText width={50} lines={1} style={{ marginBottom: 4, marginTop: 8 }} />
            <SkeletonText width={60} lines={1} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={6} borderRadius={3} style={{ marginBottom: 6 }} />
            <SkeletonText width={90} lines={1} />
          </View>
        </View>
      </View>

      {/* Continue Workout Card - matches ContinueWorkoutCard size */}
      <View style={styles.continueSection}>
        <SkeletonText width="45%" lines={1} style={{ marginBottom: 10 }} />
        <View style={styles.continueCard}>
          <View style={styles.cardContent}>
            <SkeletonLoader width={80} height={20} borderRadius={6} style={{ marginBottom: 12 }} />
            <SkeletonText width="80%" lines={1} style={{ marginBottom: 8, height: 24 }} />
            
            {/* Progress info */}
            <View style={styles.progressInfo}>
              <SkeletonText width="60%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="20%" lines={1} />
            </View>
            <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 12 }} />
            
            {/* Bottom metrics and button */}
            <View style={styles.metricsRow}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <SkeletonText width={50} lines={1} />
                <SkeletonText width={50} lines={1} />
              </View>
              <SkeletonLoader width={48} height={48} borderRadius={24} />
            </View>
          </View>
        </View>
      </View>

      {/* Today's Workout Card - matches TodaysWorkoutCard size */}
      <View style={styles.todaySection}>
        <View style={styles.todayHeader}>
          <SkeletonText width="40%" lines={1} />
          <SkeletonLoader width={90} height={20} borderRadius={10} />
        </View>
        <View style={styles.todayCard}>
          <View style={styles.todayContent}>
            <SkeletonLoader width={64} height={64} borderRadius={32} style={{ marginRight: 16 }} />
            <View style={{ flex: 1 }}>
              <View style={styles.todayTopRow}>
                <SkeletonText width={60} lines={1} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <SkeletonLoader width={70} height={20} borderRadius={6} />
                  <SkeletonLoader width={90} height={20} borderRadius={6} />
                </View>
              </View>
              <SkeletonText width="90%" lines={1} style={{ marginBottom: 8, marginTop: 8, height: 22 }} />
              <View style={styles.todayMetrics}>
                <SkeletonText width={40} lines={1} />
                <SkeletonText width={40} lines={1} />
                <SkeletonText width={50} lines={1} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Browse Workouts - matches BrowseWorkouts grid */}
      <View style={styles.browseSection}>
        <SkeletonText width="45%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.categoriesGrid}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.categoryCard}>
              <SkeletonLoader width="100%" height={220} borderRadius={20} />
            </View>
          ))}
        </View>
      </View>

      {/* Create Custom Workout Button */}
      <View style={styles.createButton}>
        <SkeletonCircle size={28} style={{ marginRight: 16 }} />
        <View style={{ flex: 1 }}>
          <SkeletonText width="60%" lines={1} style={{ marginBottom: 4 }} />
          <SkeletonText width="50%" lines={1} />
        </View>
        <SkeletonCircle size={20} />
      </View>

      {/* Recent Workouts */}
      <View style={styles.recentSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        {[1, 2].map((item) => (
          <View key={item} style={styles.workoutCard}>
            <SkeletonCircle size={56} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width="70%" lines={1} style={{ marginBottom: 8 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <SkeletonText width={60} lines={1} />
                <SkeletonText width={50} lines={1} />
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBox: {
    width: 48,
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueSection: {
    marginBottom: 18,
  },
  continueCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FCD34D',
    borderColor: 'rgba(252, 211, 77, 0.2)',
    backgroundColor: '#161616',
    minHeight: 150,
  },
  cardContent: {
    padding: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todaySection: {
    marginBottom: 18,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#161616',
    minHeight: 150,
  },
  todayContent: {
    flexDirection: 'row',
    padding: 16,
  },
  todayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayMetrics: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  browseSection: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: '#161616',
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

