import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const BrowsePlansPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonCircle size={28} />
        <SkeletonText width={120} lines={1} style={{ height: 28 }} />
        <SkeletonCircle size={28} />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {[1, 2, 3, 4].map((item) => (
          <SkeletonLoader key={item} width={70} height={36} borderRadius={20} style={{ marginRight: 8 }} />
        ))}
      </View>

      {/* Meal Plan Cards */}
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={{ flex: 1 }}>
              <SkeletonText width="70%" lines={1} style={{ marginBottom: 8, height: 20 }} />
              <SkeletonText width="50%" lines={1} style={{ marginBottom: 12 }} />
            </View>
            <SkeletonCircle size={24} />
          </View>

          {/* Macros Row */}
          <View style={styles.macrosRow}>
            {[1, 2, 3, 4].map((macro) => (
              <View key={macro} style={styles.macroItem}>
                <SkeletonCircle size={16} style={{ marginBottom: 6 }} />
                <SkeletonText width={35} lines={1} style={{ marginBottom: 4 }} />
                <SkeletonText width={40} lines={1} />
              </View>
            ))}
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <SkeletonLoader width={60} height={22} borderRadius={12} style={{ marginRight: 6 }} />
            <SkeletonLoader width={70} height={22} borderRadius={12} style={{ marginRight: 6 }} />
            <SkeletonLoader width={55} height={22} borderRadius={12} />
          </View>

          {/* Action Button */}
          <SkeletonLoader width="100%" height={44} borderRadius={12} style={{ marginTop: 12 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  planCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  macroItem: {
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
