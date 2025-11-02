import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCard, SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const HomePageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Daily Progress Card - matches actual DailyProgressCard size */}
      <View style={styles.progressCard}>
        {/* Header with date and streak */}
        <View style={styles.progressHeader}>
          <View>
            <SkeletonText width={60} lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width={120} lines={1} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonLoader width={80} height={28} borderRadius={14} style={{ marginBottom: 4 }} />
            <SkeletonText width={40} lines={1} />
          </View>
        </View>
        
        {/* Calendar Strip */}
        <View style={styles.calendarStrip}>
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <View key={item} style={styles.calendarDay}>
              <SkeletonText width={20} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={40} height={40} borderRadius={20} />
            </View>
          ))}
        </View>

        {/* Total Progress Bar */}
        <View style={styles.totalProgress}>
          <SkeletonText width="50%" lines={1} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={12} borderRadius={6} />
        </View>

        {/* Progress Circles - 3 metrics */}
        <View style={styles.progressCircles}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.circleItem}>
              <SkeletonCircle size={70} style={{ marginBottom: 8 }} />
              <SkeletonText width={60} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={50} lines={1} />
            </View>
          ))}
        </View>
      </View>

      {/* Quick Start Categories - matches actual QuickStart size */}
      <View style={styles.quickStartSection}>
        <SkeletonText width="35%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.quickStartRow}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.quickStartCard}>
              <SkeletonLoader width={36} height={36} borderRadius={12} style={{ marginBottom: 12 }} />
              <SkeletonText width="80%" lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width="70%" lines={1} />
            </View>
          ))}
        </View>
      </View>

      {/* Featured Content - matches actual FeaturedVideo size */}
      <View style={styles.featuredSection}>
        <View style={styles.featuredCard}>
          {/* Image/Thumbnail */}
          <SkeletonLoader width="100%" height={200} borderRadius={0} />
          
          {/* Content */}
          <View style={styles.featuredContent}>
            <View style={styles.featuredHeader}>
              <SkeletonLoader width={100} height={28} borderRadius={14} />
              <SkeletonText width={60} lines={1} />
            </View>
            <SkeletonText width="95%" lines={1} style={{ marginBottom: 6 }} />
            <SkeletonText width="90%" lines={1} style={{ marginBottom: 8 }} />
            <SkeletonText width="100%" lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width="85%" lines={1} />
          </View>
        </View>
      </View>

      {/* Recent Activity - matches actual RecentActivity size */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <SkeletonText width="40%" lines={1} />
          <SkeletonCircle size={18} />
        </View>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.activityItem}>
            <SkeletonLoader width={28} height={28} borderRadius={14} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.activityHeader}>
                <SkeletonText width="60%" lines={1} style={{ marginBottom: 6 }} />
                <SkeletonText width={50} lines={1} />
              </View>
              <View style={styles.activityMeta}>
                <SkeletonLoader width={60} height={18} borderRadius={6} style={{ marginRight: 6 }} />
                <SkeletonLoader width={50} height={18} borderRadius={6} />
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
    paddingBottom: 40,
  },
  progressCard: {
    padding: 15,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  calendarDay: {
    alignItems: 'center',
  },
  totalProgress: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  progressCircles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  circleItem: {
    alignItems: 'center',
  },
  quickStartSection: {
    marginBottom: 24,
  },
  quickStartRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStartCard: {
    flex: 1,
    minHeight: 100,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  featuredSection: {
    marginBottom: 24,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  featuredContent: {
    padding: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentSection: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityMeta: {
    flexDirection: 'row',
  },
});

