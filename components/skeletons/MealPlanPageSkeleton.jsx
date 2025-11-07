import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const MealPlanPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* MacroProgressSummary Card */}
      <View style={styles.macroCard}>
        {/* Left: Circular Progress Chart */}
        <View style={styles.circleSection}>
          <SkeletonLoader width={130} height={130} borderRadius={65} />
          <View style={styles.circleCenter}>
            <SkeletonLoader width={40} height={14} borderRadius={7} style={{ marginBottom: 2 }} />
            <SkeletonLoader width={30} height={18} borderRadius={9} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={50} height={30} borderRadius={10} style={{ marginBottom: 2 }} />
            <SkeletonLoader width={70} height={10} borderRadius={5} />
          </View>
        </View>

        {/* Right: Vertical Macro Bars */}
        <View style={styles.barsSection}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.macroBar}>
              <View style={styles.vBarContainer}>
                <SkeletonLoader width={18} height={110} borderRadius={9} />
              </View>
              <View style={styles.macroInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginRight: 6 }} />
                  <SkeletonLoader width={50} height={14} borderRadius={7} />
                </View>
                <SkeletonLoader width={70} height={18} borderRadius={9} style={{ marginBottom: 6 }} />
                <SkeletonLoader width="100%" height={6} borderRadius={3} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Today's Meals Section */}
      <SkeletonLoader width={120} height={20} borderRadius={10} style={{ marginBottom: 14 }} />
      
      {/* 4 Meal Sections */}
      {[...Array(4)].map((_, idx) => (
        <View key={idx} style={styles.mealSection}>
          <View style={styles.mealHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 10 }} />
              <View>
                <SkeletonLoader width={80} height={16} borderRadius={8} style={{ marginBottom: 4 }} />
                <SkeletonLoader width={50} height={12} borderRadius={6} />
              </View>
            </View>
            <SkeletonLoader width={36} height={36} borderRadius={18} />
          </View>

          <View style={styles.foodItems}>
            {[...Array(2)].map((_, foodIdx) => (
              <View key={foodIdx} style={styles.foodItem}>
                <SkeletonLoader width={28} height={28} borderRadius={14} />
                <View style={styles.foodInfo}>
                  <SkeletonLoader width="70%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width="50%" height={12} borderRadius={6} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <SkeletonLoader width={50} height={18} borderRadius={9} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={40} height={12} borderRadius={6} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.mealTotals}>
            {[...Array(4)].map((_, totalIdx) => (
              <View key={totalIdx} style={styles.totalItem}>
                <SkeletonLoader width={40} height={20} borderRadius={10} style={{ marginBottom: 4 }} />
                <SkeletonLoader width={50} height={12} borderRadius={6} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  macroCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    marginBottom: 20,
  },
  circleSection: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 16,
  },
  circleCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  barsSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  macroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vBarContainer: {
    alignItems: 'center',
  },
  macroInfo: {
    flex: 1,
  },
  mealSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodItems: {
    marginBottom: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  foodInfo: {
    flex: 1,
  },
  mealTotals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  totalItem: {
    alignItems: 'center',
  },
});