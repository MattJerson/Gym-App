import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const CalendarAnalytics = ({ analytics }) => {
  if (!analytics) return null;

  const analyticsItems = [
    {
      icon: 'fitness',
      iconType: 'ionicons',
      label: 'Total Workouts',
      value: analytics.totalWorkouts,
      color: '#1E3A5F',
    },
    {
      icon: 'percent',
      iconType: 'fontawesome',
      label: 'Completion Rate',
      value: `${analytics.completionRate}%`,
      color: '#4CAF50',
    },
    {
      icon: 'local-fire-department',
      iconType: 'material',
      label: 'Current Streak',
      value: `${analytics.currentStreak} days`,
      color: '#FF5722',
    },
    {
      icon: 'trending-up',
      iconType: 'ionicons',
      label: 'Progress to Goal',
      value: `${analytics.progressToGoal}%`,
      color: '#9C27B0',
    },
  ];

  const renderIcon = (item) => {
    const iconProps = { size: 20, color: '#fff' };
    
    switch (item.iconType) {
      case 'fontawesome':
        return <FontAwesome5 name={item.icon} {...iconProps} />;
      case 'material':
        return <MaterialIcons name={item.icon} {...iconProps} />;
      default:
        return <Ionicons name={item.icon} {...iconProps} />;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(30, 58, 95, 0.1)', 'rgba(30, 58, 95, 0.05)']}
        style={styles.card}
      >
        <Text style={styles.title}>Monthly Analytics</Text>
        <Text style={styles.subtitle}>Your fitness journey this month</Text>
        
        <View style={styles.analyticsGrid}>
          {analyticsItems.map((item, index) => (
            <View key={index} style={styles.analyticsItem}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                {renderIcon(item)}
              </View>
              <Text style={styles.analyticsLabel}>{item.label}</Text>
              <Text style={styles.analyticsValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Additional Insights */}
        <View style={styles.insightsContainer}>
          <View style={styles.insightRow}>
            <Ionicons name="time" size={16} color="#1E3A5F" />
            <Text style={styles.insightText}>
              Average workout: {analytics.avgWorkoutDuration} min
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Ionicons name="flame" size={16} color="#FF5722" />
            <Text style={styles.insightText}>
              Total calories: {analytics.caloriesBurned.toLocaleString()}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <FontAwesome5 name="dumbbell" size={14} color="#1E3A5F" />
            <Text style={styles.insightText}>
              Favorite: {analytics.favoriteWorkoutType}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 13,
    color: '#ccc',
    marginLeft: 8,
    flex: 1,
  },
});

export default CalendarAnalytics;
