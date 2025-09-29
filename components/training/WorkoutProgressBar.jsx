import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WorkoutProgressBar({ 
  workoutData = { value: 2, max: 5 }, 
  stepsData = { value: 6600, max: 4400 },
}) {
  const workoutProgress = Math.min(workoutData.value / workoutData.max, 1);
  const stepsProgress = Math.min(stepsData.value / stepsData.max, 1);
  const totalProgress = Math.round(((workoutProgress + stepsProgress) / 2) * 100);
  
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
  
  return (
    <View style={styles.mainCard}>
      {/* Date + Title */}
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>{month} {day}</Text>
        <Text style={styles.progressLabel}>Daily Goal</Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <Text style={styles.bigNumber}>{totalProgress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${totalProgress}%` }]} />
        </View>
      </View>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏃</Text>
          <Text style={styles.statValue}>{stepsData.value.toLocaleString()}</Text>
          <Text style={styles.statLabel}>steps</Text>
          <Text style={styles.statGoal}>of {stepsData.max.toLocaleString()}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💪</Text>
          <Text style={styles.statValue}>{workoutData.value}/{workoutData.max}</Text>
          <Text style={styles.statLabel}>workouts</Text>
          <Text style={styles.statGoal}>completed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 32,
    padding: 24,
    paddingBottom: 0,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 64,
  },
  progressLabel: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 12, // bigger bar
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#30d158',
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1, // ensures equal sizing
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
  },
  statGoal: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
});
