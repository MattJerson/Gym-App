import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonText } from '../SkeletonLoader';

export const MyInquiriesPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={40} height={40} borderRadius={12} />
        <View style={styles.headerContent}>
          <SkeletonText width={140} lines={1} />
        </View>
      </View>

      {/* Inquiries List Skeleton */}
      <View style={styles.scrollContent}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.inquiryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
                <View style={styles.titleSection}>
                  <SkeletonText width="80%" lines={1} style={{ marginBottom: 4 }} />
                  <SkeletonText width="60%" lines={1} />
                </View>
              </View>
              <SkeletonLoader width={80} height={24} borderRadius={12} />
            </View>
            
            <SkeletonText width="95%" lines={2} style={{ marginBottom: 12 }} />
            
            <View style={styles.cardFooter}>
              <SkeletonText width={100} lines={1} />
              <SkeletonLoader width={20} height={20} borderRadius={10} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    gap: 16,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  inquiryCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleSection: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});