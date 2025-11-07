import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { SkeletonText } from '../SkeletonLoader';

export const EditWorkoutPageSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={40} height={40} borderRadius={12} />
        <View style={styles.headerContent}>
          <SkeletonText width={150} lines={1} style={{ marginBottom: 4 }} />
          <SkeletonText width={100} lines={1} />
        </View>
        <SkeletonLoader width={80} height={36} borderRadius={18} />
      </View>

      {/* Form Content Skeleton */}
      <View style={styles.scrollContent}>
        {/* Workout Name Input */}
        <View style={styles.section}>
          <SkeletonText width={100} lines={1} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={48} borderRadius={12} />
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <SkeletonText width={80} lines={1} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={80} borderRadius={12} />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <SkeletonText width={70} lines={1} style={{ marginBottom: 12 }} />
          <View style={styles.categoryGrid}>
            {[1, 2, 3, 4].map((item) => (
              <SkeletonLoader 
                key={item} 
                width="22%" 
                height={60} 
                borderRadius={12} 
              />
            ))}
          </View>
        </View>

        {/* Duration & Difficulty */}
        <View style={styles.row}>
          <View style={styles.halfSection}>
            <SkeletonText width={60} lines={1} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={48} borderRadius={12} />
          </View>
          <View style={styles.halfSection}>
            <SkeletonText width={70} lines={1} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={48} borderRadius={12} />
          </View>
        </View>

        {/* Exercises Section */}
        <View style={styles.section}>
          <View style={styles.exerciseHeader}>
            <SkeletonText width={80} lines={1} />
            <SkeletonLoader width={100} height={32} borderRadius={16} />
          </View>
          
          {/* Exercise Cards */}
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.exerciseCard}>
              <View style={styles.exerciseContent}>
                <SkeletonText width="70%" lines={1} style={{ marginBottom: 8 }} />
                <SkeletonText width="50%" lines={1} style={{ marginBottom: 12 }} />
                
                <View style={styles.exerciseStats}>
                  <SkeletonLoader width={60} height={24} borderRadius={12} />
                  <SkeletonLoader width={60} height={24} borderRadius={12} />
                  <SkeletonLoader width={60} height={24} borderRadius={12} />
                </View>
              </View>
              <SkeletonLoader width={24} height={24} borderRadius={12} />
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
  section: {
    gap: 8,
  },
  row: {
    gap: 16,
    flexDirection: 'row',
  },
  halfSection: {
    flex: 1,
    gap: 8,
  },
  categoryGrid: {
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exerciseCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseStats: {
    gap: 8,
    flexDirection: 'row',
  },
});