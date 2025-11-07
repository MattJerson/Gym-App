import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const CalendarPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Calendar Card with Stats */}
      <View style={styles.calendarCard}>
        {/* Calendar Month Header */}
        <View style={styles.calendarHeader}>
          <SkeletonLoader width={30} height={30} borderRadius={15} />
          <SkeletonLoader width={120} height={20} borderRadius={10} />
          <SkeletonLoader width={30} height={30} borderRadius={15} />
        </View>

        {/* Day Headers (S M T W T F S) */}
        <View style={styles.dayHeaders}>
          {[...Array(7)].map((_, i) => (
            <SkeletonLoader key={i} width={30} height={16} borderRadius={8} style={{ marginHorizontal: 4 }} />
          ))}
        </View>

        {/* Calendar Days Grid (5 rows x 7 days) */}
        {[...Array(5)].map((_, rowIndex) => (
          <View key={rowIndex} style={styles.weekRow}>
            {[...Array(7)].map((_, dayIndex) => (
              <View key={dayIndex} style={styles.dayCell}>
                <SkeletonLoader width={32} height={32} borderRadius={16} />
              </View>
            ))}
          </View>
        ))}

        {/* Calendar Stats Section - 6 stats in 2 rows */}
        <View style={styles.statsContainer}>
          <SkeletonLoader width={150} height={16} borderRadius={8} style={{ marginBottom: 12, alignSelf: 'center' }} />
          
          {/* First Row - 3 stats (Streak, Workouts, Active Days) */}
          <View style={styles.statRow}>
            {[...Array(3)].map((_, i) => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width={40} height={24} borderRadius={8} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={50} height={12} borderRadius={6} style={{ marginBottom: 2 }} />
                  <SkeletonLoader width={70} height={10} borderRadius={5} />
                </View>
                {i < 2 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Second Row - 3 stats (Progress, Points, Frequency) */}
          <View style={styles.statRow}>
            {[...Array(3)].map((_, i) => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width={40} height={24} borderRadius={8} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={50} height={12} borderRadius={6} style={{ marginBottom: 2 }} />
                  <SkeletonLoader width={70} height={10} borderRadius={5} />
                </View>
                {i < 2 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>

      {/* Progress Graph Card */}
      <View style={styles.progressCard}>
        <View style={styles.graphHeader}>
          <SkeletonLoader width={120} height={18} borderRadius={9} />
          <View style={{ alignItems: 'flex-end' }}>
            <SkeletonLoader width={50} height={14} borderRadius={7} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={70} height={12} borderRadius={6} />
          </View>
        </View>
        <View style={styles.chartArea}>
          {[...Array(7)].map((_, i) => (
            <View key={i} style={styles.barContainer}>
              <SkeletonLoader 
                width={30} 
                height={Math.random() * 80 + 40} 
                borderRadius={6} 
                style={{ marginBottom: 6 }} 
              />
              <SkeletonLoader width={20} height={10} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>

      {/* Steps Bar Graph Card */}
      <View style={styles.stepsCard}>
        <View style={styles.stepsHeader}>
          <SkeletonLoader width={100} height={18} borderRadius={9} />
          <SkeletonLoader width={80} height={14} borderRadius={7} />
        </View>
        <View style={styles.stepsChart}>
          {[...Array(7)].map((_, i) => (
            <View key={i} style={styles.stepsBar}>
              <SkeletonLoader 
                width={35} 
                height={Math.random() * 100 + 50} 
                borderRadius={6} 
                style={{ marginBottom: 6 }} 
              />
              <SkeletonLoader width={25} height={10} borderRadius={5} />
            </View>
          ))}
        </View>
        <View style={styles.stepsFooter}>
          <SkeletonLoader width={120} height={12} borderRadius={6} />
        </View>
      </View>

      {/* Recent Activity Card */}
      <View style={styles.recentActivityCard}>
        <SkeletonLoader width={130} height={20} borderRadius={10} style={{ marginBottom: 16 }} />
        {[...Array(3)].map((_, i) => (
          <View key={i} style={styles.activityItem}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={styles.activityContent}>
              <SkeletonLoader width="70%" height={16} borderRadius={8} style={{ marginBottom: 6 }} />
              <SkeletonLoader width="50%" height={12} borderRadius={6} />
            </View>
            <SkeletonLoader width={60} height={24} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  calendarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    justifyContent: 'center',
  },
  statsContainer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
  },
  stepsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepsChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 12,
  },
  stepsBar: {
    alignItems: 'center',
  },
  stepsFooter: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentActivityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
});
