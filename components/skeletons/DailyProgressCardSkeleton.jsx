import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const DailyProgressCardSkeleton = () => {
  return (
    <View style={styles.card}>
      {/* Header with Streak */}
      <View style={styles.headerSection}>
        <View style={styles.dateSection}>
          <SkeletonText width={50} lines={1} style={{ marginBottom: 4 }} />
          <SkeletonText width={100} lines={1} />
        </View>
        <View style={styles.streakSection}>
          <SkeletonLoader width={50} height={28} borderRadius={14} style={{ marginBottom: 4 }} />
          <SkeletonText width={60} lines={1} />
        </View>
      </View>

      {/* Calendar Strip */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarDays}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <View key={day} style={styles.dayItem}>
              <SkeletonText width={20} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonCircle size={40} />
            </View>
          ))}
        </View>
      </View>

      {/* Progress Circle */}
      <View style={styles.progressSection}>
        <SkeletonCircle size={140} style={{ marginBottom: 16 }} />
      </View>

      {/* Metrics */}
      <View style={styles.metricsSection}>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <SkeletonCircle size={12} style={{ marginRight: 8 }} />
            <SkeletonText width={60} lines={1} style={{ marginRight: 8 }} />
            <SkeletonText width={40} lines={1} />
          </View>
          <SkeletonText width={50} lines={1} />
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <SkeletonCircle size={12} style={{ marginRight: 8 }} />
            <SkeletonText width={60} lines={1} style={{ marginRight: 8 }} />
            <SkeletonText width={40} lines={1} />
          </View>
          <SkeletonText width={50} lines={1} />
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <SkeletonCircle size={12} style={{ marginRight: 8 }} />
            <SkeletonText width={60} lines={1} style={{ marginRight: 8 }} />
            <SkeletonText width={40} lines={1} />
          </View>
          <SkeletonText width={50} lines={1} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 32,
    marginBottom: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dateSection: {
    flex: 1,
  },
  streakSection: {
    alignItems: 'flex-end',
  },
  calendarSection: {
    marginBottom: 24,
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  metricsSection: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});
