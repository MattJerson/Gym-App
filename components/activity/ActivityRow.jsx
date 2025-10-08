import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityRow({ activity, onPress }) {
  const isWorkout = activity.type === 'workout';
  const typeColor = isWorkout ? '#74b9ff' : '#4ecdc4';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {/* Type Badge */}
      <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
        <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{activity.title}</Text>
          <Text style={styles.time}>{formatTimeAgo(activity.timestamp)}</Text>
        </View>
        
        <Text style={styles.description} numberOfLines={1}>{activity.description}</Text>
        
        {/* Metadata */}
        {activity.metadata && (
          <View style={styles.metadata}>
            {activity.metadata.calories > 0 && (
              <View style={styles.chip}>
                <Text style={styles.chipIcon}>🔥</Text>
                <Text style={styles.chipText}>{activity.metadata.calories}</Text>
              </View>
            )}
            {activity.metadata.duration && (
              <View style={styles.chip}>
                <Text style={styles.chipIcon}>⏱</Text>
                <Text style={styles.chipText}>{activity.metadata.duration}</Text>
              </View>
            )}
            {activity.metadata.protein && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>P:{activity.metadata.protein}</Text>
              </View>
            )}
            {activity.metadata.carbs && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>C:{activity.metadata.carbs}</Text>
              </View>
            )}
            {activity.metadata.fats && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>F:{activity.metadata.fats}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Now";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  description: {
    fontSize: 11,
    color: '#888',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  chipIcon: {
    fontSize: 9,
  },
  chipText: {
    fontSize: 10,
    color: '#aaa',
    fontWeight: '500',
  },
});
