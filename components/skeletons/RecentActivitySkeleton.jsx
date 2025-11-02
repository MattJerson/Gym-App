import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export default function RecentActivitySkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonLoader width={140} height={22} borderRadius={6} />
        <SkeletonLoader width={60} height={18} borderRadius={4} />
      </View>
      
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.activityItem}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={styles.activityContent}>
            <SkeletonLoader width="70%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="50%" height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
});
