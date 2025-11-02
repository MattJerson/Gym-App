import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

const screenWidth = Dimensions.get("window").width;

export const CalendarPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Calendar Card - matches RNCalendar size */}
      <View style={styles.calendarCard}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <SkeletonCircle size={24} style={{ marginRight: 12 }} />
          <SkeletonText width={120} lines={1} />
          <SkeletonCircle size={24} style={{ marginLeft: 12 }} />
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <SkeletonText key={idx} width={30} lines={1} style={{ textAlign: 'center' }} />
          ))}
        </View>

        {/* Calendar Grid - 5 weeks */}
        {[1, 2, 3, 4, 5].map((week) => (
          <View key={week} style={styles.weekRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <View key={day} style={styles.dayCell}>
                <SkeletonLoader width={32} height={32} borderRadius={16} />
              </View>
            ))}
          </View>
        ))}

        {/* Calendar Stats Card - matches CalendarStatsCard */}
        <View style={styles.statsSection}>
          <SkeletonText width="60%" lines={1} style={{ marginBottom: 12, alignSelf: 'center' }} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <SkeletonCircle size={20} style={{ marginBottom: 6 }} />
              <SkeletonText width={30} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={45} lines={1} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <SkeletonCircle size={20} style={{ marginBottom: 6 }} />
              <SkeletonText width={30} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={50} lines={1} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <SkeletonCircle size={20} style={{ marginBottom: 6 }} />
              <SkeletonText width={30} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={35} lines={1} />
            </View>
          </View>
        </View>
      </View>

      {/* Progress Graph - matches ProgressGraph size */}
      <View style={styles.progressGraph}>
        <View style={styles.graphHeader}>
          <SkeletonText width="40%" lines={1} />
          <View style={{ alignItems: 'flex-end' }}>
            <SkeletonText width={50} lines={1} style={{ marginBottom: 4 }} />
            <SkeletonText width={70} lines={1} />
          </View>
        </View>
        <SkeletonLoader width={screenWidth - 48} height={220} borderRadius={16} />
      </View>

      {/* Steps Bar Graph - matches StepsBarGraph */}
      <View style={styles.stepsGraph}>
        <View style={styles.stepsHeader}>
          <SkeletonText width="35%" lines={1} />
          <SkeletonLoader width={80} height={24} borderRadius={12} />
        </View>
        <View style={styles.barsContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <View key={item} style={styles.barColumn}>
              <SkeletonLoader width={28} height={120} borderRadius={8} style={{ marginBottom: 8 }} />
              <SkeletonText width={28} lines={1} />
            </View>
          ))}
        </View>
      </View>

      {/* Calendar Analytics - matches CalendarAnalytics */}
      <View style={styles.analyticsCard}>
        <SkeletonText width="45%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.analyticsGrid}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.analyticsItem}>
              <SkeletonCircle size={16} style={{ marginBottom: 8 }} />
              <SkeletonText width={50} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={60} lines={1} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity - matches RecentActivity */}
      <View style={styles.recentCard}>
        <View style={styles.recentHeader}>
          <SkeletonText width="40%" lines={1} />
          <SkeletonCircle size={18} />
        </View>
        {[1, 2, 3].map((item) => (
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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 40,
  },
  calendarCard: {
    borderRadius: 22,
    marginBottom: 20,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayCell: {
    alignItems: 'center',
  },
  statsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressGraph: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 14,
  },
  stepsGraph: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  analyticsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsItem: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  recentCard: {
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
