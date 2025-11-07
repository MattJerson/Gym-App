import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonText } from '../../SkeletonLoader';

export const InquiryDetailPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={40} height={40} borderRadius={12} />
        <View style={styles.headerContent}>
          <SkeletonText width={140} lines={1} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.scrollContent}>
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <SkeletonLoader width={100} height={32} borderRadius={16} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <SkeletonText width="90%" lines={1} style={{ marginBottom: 8 }} />
          <SkeletonText width="70%" lines={1} />
        </View>

        {/* Category Section */}
        <View style={styles.categorySection}>
          <SkeletonLoader width={24} height={24} borderRadius={12} />
          <SkeletonText width={120} lines={1} />
        </View>

        {/* Meta Info */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonText width={80} lines={1} />
          </View>
          <View style={styles.metaRow}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonText width={100} lines={1} />
          </View>
          <View style={styles.metaRow}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonText width={120} lines={1} />
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <SkeletonText width={80} lines={1} style={{ marginBottom: 12 }} />
          <SkeletonText width="100%" lines={3} />
        </View>

        {/* Responses Section */}
        <View style={styles.responsesSection}>
          <SkeletonText width={90} lines={1} style={{ marginBottom: 16 }} />
          
          {/* Response Cards */}
          {[1, 2].map((item) => (
            <View key={item} style={styles.responseCard}>
              <View style={styles.responseHeader}>
                <SkeletonLoader width={32} height={32} borderRadius={16} />
                <View style={styles.responseHeaderText}>
                  <SkeletonText width={100} lines={1} style={{ marginBottom: 4 }} />
                  <SkeletonText width={80} lines={1} />
                </View>
              </View>
              <SkeletonText width="95%" lines={2} />
            </View>
          ))}
        </View>
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
    gap: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  statusSection: {
    alignItems: 'flex-start',
  },
  titleSection: {
    gap: 8,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaSection: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  descriptionSection: {
    gap: 12,
  },
  responsesSection: {
    gap: 16,
  },
  responseCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  responseHeaderText: {
    flex: 1,
    gap: 4,
  },
});