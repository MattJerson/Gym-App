import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCard, SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const HomePageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Daily Progress Card */}
      <View style={styles.progressCard}>
        <SkeletonText width="50%" lines={1} style={{ marginBottom: 16 }} />
        <SkeletonCircle size={120} style={{ alignSelf: 'center', marginBottom: 20 }} />
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <SkeletonLoader width={40} height={40} borderRadius={12} />
            <SkeletonText width={60} lines={1} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.metric}>
            <SkeletonLoader width={40} height={40} borderRadius={12} />
            <SkeletonText width={60} lines={1} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.metric}>
            <SkeletonLoader width={40} height={40} borderRadius={12} />
            <SkeletonText width={60} lines={1} style={{ marginTop: 8 }} />
          </View>
        </View>
      </View>

      {/* Quick Start Categories */}
      <View style={styles.quickStartSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        <View style={styles.categoriesRow}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.categoryCard}>
              <SkeletonLoader width={60} height={60} borderRadius={16} />
              <SkeletonText width="100%" lines={1} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Featured Content */}
      <SkeletonCard height={200} style={{ marginBottom: 20 }} />

      {/* Recent Activity */}
      <View style={styles.recentSection}>
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.activityItem}>
            <SkeletonCircle size={40} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonText width="70%" lines={1} style={{ marginBottom: 4 }} />
              <SkeletonText width="40%" lines={1} />
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
    padding: 20,
    borderRadius: 32,
    marginBottom: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  quickStartSection: {
    marginBottom: 24,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    alignItems: 'center',
    width: '22%',
  },
  recentSection: {
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
