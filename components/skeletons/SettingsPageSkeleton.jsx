import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonCircle, SkeletonText } from '../SkeletonLoader';

export const SettingsPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <SkeletonCircle size={28} />
        <SkeletonText width={150} lines={1} style={{ height: 28 }} />
        <View style={{ width: 28 }} />
      </View>

      {/* Main Content Card */}
      <View style={styles.contentCard}>
        {/* Section Title */}
        <SkeletonText width="40%" lines={1} style={{ marginBottom: 20, height: 18 }} />

        {/* Setting Items */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <SkeletonCircle size={24} />
              <View style={{ marginLeft: 12 }}>
                <SkeletonText width={120} lines={1} style={{ marginBottom: 6 }} />
                <SkeletonText width={160} lines={1} />
              </View>
            </View>
            <SkeletonLoader width={40} height={24} borderRadius={12} />
          </View>
        ))}
      </View>

      {/* Additional Section */}
      <View style={styles.contentCard}>
        <SkeletonText width="35%" lines={1} style={{ marginBottom: 20, height: 18 }} />
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <SkeletonCircle size={24} />
              <SkeletonText width={100} lines={1} style={{ marginLeft: 12 }} />
            </View>
            <SkeletonCircle size={16} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  contentCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
