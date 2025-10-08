import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonText } from '../SkeletonLoader';

export const CalendarPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Month/Year Header */}
      <View style={styles.headerSection}>
        <SkeletonText width="40%" lines={1} style={{ alignSelf: 'center', marginBottom: 20 }} />
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Day headers */}
        <View style={styles.dayHeadersRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <SkeletonLoader key={item} width={40} height={20} borderRadius={8} />
          ))}
        </View>
        
        {/* Calendar days */}
        {[1, 2, 3, 4, 5].map((week) => (
          <View key={week} style={styles.weekRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <SkeletonLoader 
                key={day} 
                width={40} 
                height={40} 
                borderRadius={20}
                style={{ marginVertical: 4 }}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Selected Date Info */}
      <View style={styles.dateInfoSection}>
        <SkeletonText width="50%" lines={1} style={{ marginBottom: 16 }} />
        
        {/* Workout Card */}
        <View style={styles.workoutCard}>
          <SkeletonText width="60%" lines={1} style={{ marginBottom: 8 }} />
          <SkeletonText width="80%" lines={2} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="100%" height={8} borderRadius={4} />
        </View>

        {/* Meal Card */}
        <View style={styles.mealCard}>
          <SkeletonText width="40%" lines={1} style={{ marginBottom: 8 }} />
          <SkeletonText width="90%" lines={2} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  calendarGrid: {
    marginBottom: 24,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dateInfoSection: {
    marginTop: 20,
  },
  workoutCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mealCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
