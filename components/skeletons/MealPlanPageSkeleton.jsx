import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const MealPlanPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Plan Indicator - matches MacroProgressSummary */}
      <View style={styles.planIndicator}>
        <SkeletonLoader width={6} height={6} borderRadius={3} style={{ marginRight: 6 }} />
        <SkeletonText width={160} lines={1} />
      </View>

      {/* Macro Progress Summary - matches exact size */}
      <View style={styles.macroCard}>
        {/* Left: Circle */}
        <View style={styles.circleSection}>
          <SkeletonCircle size={110} />
          <View style={styles.circleCenter}>
            <SkeletonText width={35} lines={1} style={{ marginBottom: 2 }} />
            <SkeletonText width={25} lines={1} style={{ marginBottom: 8 }} />
            <SkeletonText width={40} lines={1} style={{ marginBottom: 2 }} />
            <SkeletonText width={55} lines={1} />
          </View>
        </View>

        {/* Right: Vertical Bars */}
        <View style={styles.barsSection}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.barItem}>
              <SkeletonLoader width={16} height={110} borderRadius={8} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <SkeletonText width={20} lines={1} style={{ marginRight: 6 }} />
                  <SkeletonText width={45} lines={1} />
                </View>
                <SkeletonText width={60} lines={1} style={{ marginBottom: 6 }} />
                <SkeletonLoader width="100%" height={4} borderRadius={2} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Today's Meals - matches TodaysMeals card size */}
      <View style={styles.todaysCard}>
        <View style={styles.todaysHeader}>
          <SkeletonText width="40%" lines={1} />
        </View>

        {/* Meal Sections */}
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.mealSection}>
            {/* Color accent */}
            <SkeletonLoader width="100%" height={3} borderRadius={0} style={{ position: 'absolute', top: 0 }} />
            
            {/* Meal header */}
            <View style={styles.mealHeader}>
              <SkeletonText width={80} lines={1} />
              <SkeletonCircle size={32} />
            </View>

            {/* Meal items */}
            <View style={styles.mealItems}>
              {[1, 2].map((itemIdx) => (
                <View key={itemIdx} style={styles.foodItem}>
                  <SkeletonText width={24} lines={1} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <SkeletonText width="70%" lines={1} style={{ marginBottom: 4 }} />
                    <SkeletonText width="50%" lines={1} />
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <SkeletonText width={50} lines={1} style={{ marginBottom: 4 }} />
                    <SkeletonText width={40} lines={1} />
                  </View>
                </View>
              ))}
            </View>

            {/* Meal footer */}
            <View style={styles.mealFooter}>
              {[1, 2, 3, 4].map((idx) => (
                <View key={idx} style={styles.footerMacro}>
                  <SkeletonText width={35} lines={1} style={{ marginBottom: 4 }} />
                  <SkeletonText width={45} lines={1} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Meal Plans Card - matches MealPlans compact card */}
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={{ flex: 1 }}>
            <SkeletonLoader width={60} height={20} borderRadius={10} style={{ marginBottom: 8 }} />
            <SkeletonText width="70%" lines={1} />
          </View>
          <SkeletonLoader width={90} height={24} borderRadius={12} />
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <SkeletonCircle size={14} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width={60} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={50} lines={1} />
            </View>
          </View>
          <View style={styles.statItem}>
            <SkeletonCircle size={14} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width="80%" lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={60} lines={1} />
            </View>
          </View>
        </View>

        {/* Progress bars */}
        <View style={styles.progressBars}>
          {[1, 2].map((item) => (
            <View key={item} style={styles.progressItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <SkeletonCircle size={12} style={{ marginRight: 6 }} />
                <SkeletonText width={100} lines={1} />
              </View>
              <SkeletonLoader width="100%" height={6} borderRadius={3} />
            </View>
          ))}
        </View>

        {/* Strategy info */}
        <SkeletonText width="95%" lines={1} style={{ marginTop: 8 }} />
      </View>

      {/* Recent Meals - matches RecentMeals */}
      <View style={styles.recentSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.recentItem}>
            <SkeletonText width={24} lines={1} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonText width="60%" lines={1} style={{ marginBottom: 6 }} />
              <SkeletonText width="80%" lines={1} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <SkeletonText width={50} lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width={40} lines={1} />
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  planIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  macroCard: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 25,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circleSection: {
    marginRight: 20,
    position: 'relative',
  },
  circleCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -27.5 }, { translateY: -30 }],
    alignItems: 'center',
  },
  barsSection: {
    flex: 1,
    gap: 12,
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todaysCard: {
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  todaysHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  mealSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 12,
  },
  mealItems: {
    paddingHorizontal: 14,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  mealFooter: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  footerMacro: {
    flex: 1,
    alignItems: 'center',
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quickStats: {
    gap: 10,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBars: {
    gap: 10,
  },
  progressItem: {
    marginBottom: 4,
  },
  recentSection: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
});

