import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyDataState from './EmptyDataState';

const CalendarAnalytics = ({ analytics }) => {
  if (!analytics) return null;

  // Check if we have sufficient data (at least 2 workouts completed)
  const hasSufficientData = analytics.totalWorkouts >= 2;

  // Calculate frequency (workouts per week)
  const workoutsPerWeek = analytics.totalWorkouts > 0 
    ? ((analytics.totalWorkouts / 30) * 7).toFixed(1) 
    : '0';

  const analyticsItems = [
    {
      icon: 'fitness-outline',
      label: 'Total Workouts',
      value: analytics.totalWorkouts,
      color: '#0A84FF', // Blue
    },
    {
      icon: 'checkmark-done-outline',
      label: 'Completion Rate',
      value: `${analytics.completionRate}%`,
      color: '#30D158', // Green
    },
    {
      icon: 'flame-outline',
      label: 'Current Streak',
      value: `${analytics.currentStreak} days`,
      color: '#FF9F0A', // Orange
    },
    {
      icon: 'trending-up-outline',
      label: 'Progress to Goal',
      value: `${analytics.progressToGoal}%`,
      color: '#BF5AF2', // Purple
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly Analytics</Text>
      
      {!hasSufficientData ? (
        <EmptyDataState
          title="Build Your Stats"
          message="Complete more workouts this month to unlock detailed analytics and insights"
          icon="analytics-outline"
          iconColor="#BF5AF2"
          sampleComponent={
            <>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Ionicons name="fitness-outline" size={26} color="#0A84FF" style={styles.icon} />
                  <Text style={styles.analyticsValue}>24</Text>
                  <Text style={styles.analyticsLabel}>Total Workouts</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Ionicons name="checkmark-done-outline" size={26} color="#30D158" style={styles.icon} />
                  <Text style={styles.analyticsValue}>92%</Text>
                  <Text style={styles.analyticsLabel}>Completion Rate</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Ionicons name="flame-outline" size={26} color="#FF9F0A" style={styles.icon} />
                  <Text style={styles.analyticsValue}>7 days</Text>
                  <Text style={styles.analyticsLabel}>Current Streak</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Ionicons name="trending-up-outline" size={26} color="#BF5AF2" style={styles.icon} />
                  <Text style={styles.analyticsValue}>85%</Text>
                  <Text style={styles.analyticsLabel}>Progress to Goal</Text>
                </View>
              </View>
              <View style={styles.insightsContainer}>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Avg. Duration</Text>
                  <Text style={styles.insightValue}>45 min</Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Calories Burned</Text>
                  <Text style={styles.insightValue}>12,400</Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Favorite</Text>
                  <Text style={styles.insightValue}>Strength</Text>
                </View>
              </View>
            </>
          }
        />
      ) : (
        <>
          <View style={styles.analyticsGrid}>
            {analyticsItems.map((item, index) => (
              <View key={index} style={styles.analyticsItem}>
                <Ionicons name={item.icon} size={26} color={item.color} style={styles.icon} />
                <Text style={styles.analyticsValue}>{item.value}</Text>
                <Text style={styles.analyticsLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Frequency Section */}
          <View style={styles.frequencyContainer}>
            <Text style={styles.frequencyLabel}>Frequency</Text>
            <Text style={styles.frequencyValue}>{workoutsPerWeek}x / week</Text>
          </View>

          {/* Additional Insights */}
          <View style={styles.insightsContainer}>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Avg Duration</Text>
                <Text style={styles.insightValue}>{analytics.avgWorkoutDuration} min</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Cal Burned</Text>
                <Text style={styles.insightValue}>{analytics.caloriesBurned.toLocaleString()}</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Favorite</Text>
                <Text style={styles.insightValue}>{analytics.favoriteWorkout || analytics.favoriteWorkoutType}</Text>
              </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EFEFEF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(235, 235, 245, 0.6)',
    marginBottom: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -5,
  },
  analyticsItem: {
    width: '50%',
    padding: 5,
    marginBottom: 10,
  },
  icon: {
    marginBottom: 6,
  },
  analyticsValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  analyticsLabel: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.6)',
  },
  frequencyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  frequencyLabel: {
    fontSize: 13,
    color: 'rgba(235, 235, 245, 0.6)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  frequencyValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.6)',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    paddingBottom: 2,
  },
});

export default CalendarAnalytics;

