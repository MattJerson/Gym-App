import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const AddFoodPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonCircle size={28} />
        <SkeletonText width={100} lines={1} style={{ height: 28 }} />
        <SkeletonCircle size={28} />
      </View>

      {/* Search Bar */}
      <SkeletonLoader width="100%" height={48} borderRadius={24} style={{ marginBottom: 16 }} />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <SkeletonLoader width={100} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <SkeletonLoader width={100} height={40} borderRadius={20} />
      </View>

      {/* Food Items */}
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <View key={item} style={styles.foodCard}>
          <SkeletonCircle size={48} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonText width="70%" lines={1} style={{ marginBottom: 6 }} />
            <SkeletonText width="50%" lines={1} style={{ marginBottom: 8 }} />
            <View style={styles.macrosRow}>
              <SkeletonText width={50} lines={1} style={{ marginRight: 12 }} />
              <SkeletonText width={50} lines={1} style={{ marginRight: 12 }} />
              <SkeletonText width={50} lines={1} />
            </View>
          </View>
          <SkeletonCircle size={32} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  foodCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  macrosRow: {
    flexDirection: 'row',
  },
});
