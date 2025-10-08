import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WorkoutProgressBarSkeleton } from "../skeletons/WorkoutProgressBarSkeleton";
import { TrainingProgressService } from "../../services/TrainingProgressService";
import { supabase } from "../../services/supabase";

export default function WorkoutProgressBar() {
  const [userId, setUserId] = useState(null);
  const [workoutData, setWorkoutData] = useState({ value: 0, max: 1 });
  const [stepsData, setStepsData] = useState({ value: 0, max: 10000 });
  const [isLoading, setIsLoading] = useState(true);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  // Load progress data when user is available
  useEffect(() => {
    if (userId) {
      loadProgressData();
    }
  }, [userId]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      const progressData = await TrainingProgressService.getTodayProgress(userId);
      setWorkoutData(progressData.workoutData);
      setStepsData(progressData.stepsData);
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const workoutProgress = Math.min(workoutData.value / workoutData.max, 1);
  const stepsProgress = Math.min(stepsData.value / stepsData.max, 1);
  const totalProgress = Math.round(((workoutProgress + stepsProgress) / 2) * 100);

  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = currentDate.toLocaleDateString('en-US', { month: 'short' });

  if (isLoading) {
    return <WorkoutProgressBarSkeleton />;
  }

  return (
    <View style={styles.mainCard}>
      {/* Date + Title */}
      <View style={styles.headerRow}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{month}</Text>
          <Text style={styles.dayText}>{day}</Text>
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.progressLabel}>Daily Goal</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.percentageContainer}>
          <Text style={styles.bigNumber}>{totalProgress}</Text>
          <Text style={styles.percentSymbol}>%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${totalProgress}%` }]}>
              <View style={styles.progressGlow} />
            </View>
          </View>
          <Text style={styles.progressSubtext}>of your daily target</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.stepsCard]}>
          <View style={styles.statHeader}>
            <Text style={styles.statIcon}>🏃</Text>
            <View style={[styles.badge, stepsProgress >= 1 && styles.badgeComplete]}>
              <Text style={styles.badgeText}>
                {stepsProgress >= 1 ? '✓' : Math.round(stepsProgress * 100) + '%'}
              </Text>
            </View>
          </View>
          <Text style={styles.statValue}>{stepsData.value.toLocaleString()}</Text>
          <Text style={styles.statLabel}>steps</Text>
          <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressFill, { width: `${Math.min(stepsProgress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.statGoal}>Goal: {stepsData.max.toLocaleString()}</Text>
        </View>

        <View style={[styles.statCard, styles.workoutCard]}>
          <View style={styles.statHeader}>
            <Text style={styles.statIcon}>💪</Text>
            <View style={[styles.badge, workoutProgress >= 1 && styles.badgeComplete]}>
              <Text style={styles.badgeText}>
                {workoutProgress >= 1 ? '✓' : Math.round(workoutProgress * 100) + '%'}
              </Text>
            </View>
          </View>
          <Text style={styles.statValue}>{workoutData.value}/{workoutData.max}</Text>
          <Text style={styles.statLabel}>workouts</Text>
          <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressFill, styles.workoutProgress, { width: `${Math.min(workoutProgress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.statGoal}>Goal: {workoutData.max} sessions</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 14,        // reduced from 18
    marginBottom: 12,   // reduced from 16
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  gradientOverlay: {
    display: 'none',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '800',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#30d158',
  },
  progressLabel: {
    fontSize: 13,
    color: '#bbb',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bigNumber: {
    fontSize: 58,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 58,
    letterSpacing: -2,
  },
  percentSymbol: {
    fontSize: 26,
    fontWeight: '700',
    color: '#888',
    marginTop: 6,
    marginLeft: 3,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#30d158',
    borderRadius: 4,
    position: 'relative',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
  },
  stepsCard: {
    borderLeftWidth: 0,    // removed 3D/stroke effect
    borderLeftColor: 'transparent',
  },
  workoutCard: {
    borderLeftWidth: 0,    // removed 3D/stroke effect
    borderLeftColor: 'transparent',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 24,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    minWidth: 38,
    alignItems: 'center',
  },
  badgeComplete: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniProgressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#30d158',
    borderRadius: 1.5,
  },
  workoutProgress: {
    backgroundColor: '#5856d6',
  },
  statGoal: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
    fontWeight: '500',
  },
});
