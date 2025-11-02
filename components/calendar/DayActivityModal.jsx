import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityLogDataService } from '../../services/ActivityLogDataService';
import { supabase } from '../../services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Simplified modal showing activities for a specific day
 * Uses the same activity log format as RecentActivity component
 */
export default function DayActivityModal({ visible, onClose, date }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && date) {
      fetchDayActivities();
    }
  }, [visible, date]);

  const fetchDayActivities = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all activities
      const allActivities = await ActivityLogDataService.fetchAllActivities(user.id);
      
      // Filter activities for the selected date
      const dayActivities = allActivities.filter(activity => {
        const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
        return activityDate === date;
      });

      console.log(`📅 Found ${dayActivities.length} activities for ${date}`);
      setActivities(dayActivities);
    } catch (error) {
      console.error('Error fetching day activities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatActivityTime = (timestamp) => {
    const time = new Date(timestamp);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getActivityTypeColor = (type) => {
    return type === 'workout' ? '#0A84FF' : '#34C759';
  };

  const getActivityIcon = (activity) => {
    if (activity.type === 'workout') {
      return 'barbell';
    }
    // Nutrition
    return 'restaurant';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{formatDate(date)}</Text>
              <Text style={styles.headerSubtitle}>
                {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading activities...</Text>
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No activities logged</Text>
                <Text style={styles.emptySubtext}>Start tracking your workouts and meals!</Text>
              </View>
            ) : (
              <View style={styles.activitiesList}>
                {activities.map((activity, index) => {
                  const typeColor = getActivityTypeColor(activity.type);
                  const icon = getActivityIcon(activity);
                  
                  return (
                    <View key={activity.id || index} style={styles.activityCard}>
                      {/* Activity Header */}
                      <View style={styles.activityHeader}>
                        <View style={styles.activityTitleRow}>
                          <View style={[styles.activityIcon, { backgroundColor: `${typeColor}15` }]}>
                            <Ionicons name={icon} size={20} color={typeColor} />
                          </View>
                          <View style={styles.activityTitleContent}>
                            <Text style={styles.activityTitle}>{activity.title}</Text>
                            <Text style={styles.activityTime}>{formatActivityTime(activity.timestamp)}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Activity Description */}
                      {activity.description && (
                        <Text style={styles.activityDescription}>{activity.description}</Text>
                      )}

                      {/* Activity Metadata */}
                      {activity.metadata && (
                        <View style={styles.metadataRow}>
                          {activity.metadata.duration && (
                            <View style={styles.metadataChip}>
                              <Ionicons name="time-outline" size={14} color="#0A84FF" />
                              <Text style={styles.metadataText}>{activity.metadata.duration}</Text>
                            </View>
                          )}
                          {activity.metadata.calories > 0 && (
                            <View style={styles.metadataChip}>
                              <Ionicons name="flame-outline" size={14} color="#FF9500" />
                              <Text style={styles.metadataText}>{activity.metadata.calories} cal</Text>
                            </View>
                          )}
                          {activity.metadata.exercises > 0 && (
                            <View style={styles.metadataChip}>
                              <Ionicons name="barbell-outline" size={14} color="#34C759" />
                              <Text style={styles.metadataText}>
                                {activity.metadata.completedExercises || activity.metadata.exercises} exercises
                              </Text>
                            </View>
                          )}
                          {activity.metadata.protein > 0 && (
                            <View style={styles.metadataChip}>
                              <Text style={styles.metadataText}>P: {activity.metadata.protein}g</Text>
                            </View>
                          )}
                          {activity.metadata.carbs > 0 && (
                            <View style={styles.metadataChip}>
                              <Text style={styles.metadataText}>C: {activity.metadata.carbs}g</Text>
                            </View>
                          )}
                          {activity.metadata.fats > 0 && (
                            <View style={styles.metadataChip}>
                              <Text style={styles.metadataText}>F: {activity.metadata.fats}g</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(235, 235, 245, 0.6)',
    textAlign: 'center',
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityHeader: {
    marginBottom: 12,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitleContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.7)',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metadataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  metadataText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.8)',
  },
});
