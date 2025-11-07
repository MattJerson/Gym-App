import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export const TrainingPageSkeleton = ({ hasActiveSession = false, hasTodaysWorkout = false }) => {
  return (
    <View style={styles.container}>
      {/* Workout Progress Bar */}
      <View style={styles.progressCard}>
        {/* Date badge */}
        <View style={styles.dateContainer}>
          <SkeletonLoader width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonLoader width={8} height={8} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={80} height={16} borderRadius={8} />
          </View>
        </View>

        {/* Big percentage number */}
        <View style={styles.percentageSection}>
          <SkeletonLoader width={80} height={48} borderRadius={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={12} borderRadius={6} style={{ marginBottom: 6 }} />
          <SkeletonLoader width={150} height={14} borderRadius={7} />
        </View>

        {/* Two stat cards (steps & workouts) */}
        <View style={styles.statsRow}>
          {/* Steps card */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <SkeletonLoader width={24} height={24} borderRadius={12} />
              <SkeletonLoader width={50} height={20} borderRadius={10} />
            </View>
            <SkeletonLoader width={70} height={28} borderRadius={8} style={{ marginVertical: 8 }} />
            <SkeletonLoader width="90%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoader width={100} height={12} borderRadius={6} />
          </View>

          {/* Workouts card */}
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <SkeletonLoader width={24} height={24} borderRadius={12} />
              <SkeletonLoader width={45} height={20} borderRadius={10} />
            </View>
            <SkeletonLoader width={50} height={28} borderRadius={8} style={{ marginVertical: 8 }} />
            <SkeletonLoader width="80%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoader width={110} height={12} borderRadius={6} />
          </View>
        </View>
      </View>

      {/* Continue Workout Card - only if hasActiveSession */}
      {hasActiveSession && (
        <View style={styles.continueSection}>
          <View style={styles.continueHeader}>
            <SkeletonLoader width={120} height={18} borderRadius={9} />
            <SkeletonLoader width={90} height={22} borderRadius={11} />
          </View>
          
          <View style={styles.continueCard}>
            {/* Color accent stripe */}
            <View style={styles.colorAccent} />
            
            <View style={styles.continueContent}>
              {/* Left: Play button */}
              <SkeletonLoader width={56} height={56} borderRadius={28} />
              
              {/* Right: Info */}
              <View style={styles.continueInfo}>
                <SkeletonLoader width={100} height={20} borderRadius={10} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="85%" height={22} borderRadius={11} style={{ marginBottom: 12 }} />
                
                {/* Progress info */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <SkeletonLoader width={100} height={14} borderRadius={7} />
                  <SkeletonLoader width={40} height={14} borderRadius={7} />
                </View>
                <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 8 }} />
                
                {/* Time elapsed */}
                <SkeletonLoader width={80} height={12} borderRadius={6} />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Today's Workout Card - only if hasTodaysWorkout */}
      {hasTodaysWorkout && (
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <SkeletonLoader width={120} height={18} borderRadius={9} />
            <SkeletonLoader width={90} height={22} borderRadius={11} />
          </View>
          
          <View style={styles.todayCard}>
            {/* Color accent stripe */}
            <View style={styles.colorAccent} />
            
            <View style={styles.todayContent}>
              {/* Left: Play button */}
              <SkeletonLoader width={56} height={56} borderRadius={28} />
              
              {/* Right: Info */}
              <View style={styles.todayInfo}>
                {/* Top row - day and badges */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <SkeletonLoader width={60} height={14} borderRadius={7} />
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <SkeletonLoader width={70} height={22} borderRadius={11} />
                    <SkeletonLoader width={80} height={22} borderRadius={11} />
                  </View>
                </View>
                
                {/* Workout name */}
                <SkeletonLoader width="90%" height={22} borderRadius={11} style={{ marginBottom: 12 }} />
                
                {/* Metrics row */}
                <View style={styles.metricsRow}>
                  <SkeletonLoader width={40} height={32} borderRadius={10} />
                  <SkeletonLoader width={1} height={24} borderRadius={0} />
                  <SkeletonLoader width={50} height={32} borderRadius={10} />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Browse Workouts */}
      <View style={styles.browseSection}>
        <SkeletonLoader width={130} height={20} borderRadius={10} style={{ marginBottom: 12 }} />
        
        {/* Horizontal scroll cards */}
        <View style={styles.categoriesScroll}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.categoryCard}>
              <SkeletonLoader width="100%" height="100%" borderRadius={20} />
            </View>
          ))}
        </View>
      </View>

      {/* My Workouts */}
      <View style={styles.myWorkoutsSection}>
        <SkeletonLoader width={110} height={20} borderRadius={10} style={{ marginBottom: 12 }} />
        
        {/* Grid of workout cards */}
        <View style={styles.workoutsGrid}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.workoutGridCard}>
              <SkeletonLoader width="100%" height={160} borderRadius={20} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Workouts */}
      <View style={styles.recentSection}>
        <SkeletonLoader width={130} height={20} borderRadius={10} style={{ marginBottom: 12 }} />
        
        {[...Array(2)].map((_, i) => (
          <View key={i} style={styles.recentCard}>
            <SkeletonLoader width={56} height={56} borderRadius={28} />
            <View style={styles.recentContent}>
              <SkeletonLoader width="70%" height={18} borderRadius={9} style={{ marginBottom: 6 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <SkeletonLoader width={60} height={14} borderRadius={7} />
                <SkeletonLoader width={50} height={14} borderRadius={7} />
              </View>
            </View>
            <SkeletonLoader width={24} height={24} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueSection: {
    marginBottom: 18,
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  continueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  colorAccent: {
    height: 3,
    backgroundColor: '#FCD34D',
  },
  continueContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  continueInfo: {
    flex: 1,
  },
  todaySection: {
    marginBottom: 18,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  todayContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  todayInfo: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
  },
  browseSection: {
    marginBottom: 24,
  },
  categoriesScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    width: 160,
    height: 220,
  },
  myWorkoutsSection: {
    marginBottom: 24,
  },
  workoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutGridCard: {
    width: '48%',
  },
  recentSection: {
    marginBottom: 20,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  recentContent: {
    flex: 1,
  },
});

