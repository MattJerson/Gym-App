import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCard, SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const MealPlanPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Macro Progress Summary */}
      <View style={styles.macroSection}>
        <SkeletonText width="50%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.macroCards}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.macroCard}>
              <SkeletonLoader width={50} height={50} borderRadius={25} />
              <SkeletonText width="80%" lines={1} style={{ marginTop: 8 }} />
              <SkeletonText width="60%" lines={1} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Today's Meals */}
      <View style={styles.todaysSection}>
        <View style={styles.sectionHeader}>
          <SkeletonText width="40%" lines={1} />
          <SkeletonText width="20%" lines={1} />
        </View>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.mealCard}>
            <SkeletonCircle size={60} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonText width="70%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="50%" lines={1} />
            </View>
            <SkeletonText width={60} lines={1} />
          </View>
        ))}
      </View>

      {/* Weekly Plan */}
      <View style={styles.weeklySection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.daysRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <View key={item} style={styles.dayCard}>
              <SkeletonLoader width={50} height={50} borderRadius={12} />
              <SkeletonText width={40} lines={1} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Meals */}
      <View style={styles.recentSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        {[1, 2].map((item) => (
          <View key={item} style={styles.recentMealCard}>
            <SkeletonCircle size={50} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonText width="60%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="80%" lines={1} />
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
  macroSection: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  macroCards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroCard: {
    alignItems: 'center',
  },
  todaysSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  weeklySection: {
    marginBottom: 24,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    alignItems: 'center',
  },
  recentSection: {
    marginBottom: 20,
  },
  recentMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
