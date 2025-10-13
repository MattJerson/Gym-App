import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Empty state component for calendar analytics
 * Shows when user doesn't have sufficient data
 * Displays sample preview data in background
 */
export default function EmptyDataState({ 
  title = "No Data Yet",
  message = "Keep using the app to see your progress here",
  icon = "stats-chart-outline",
  iconColor = "#666",
  sampleComponent = null // Optional: pass a sample chart/graph component
}) {
  return (
    <View style={styles.container}>
      {/* Background sample data (darkened) */}
      {sampleComponent && (
        <View style={styles.sampleBackground}>
          {sampleComponent}
          <View style={styles.darkOverlay} />
        </View>
      )}
      
      {/* Foreground empty state */}
      <View style={styles.emptyContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={48} color={iconColor} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 200,
  },
  sampleBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0B0B',
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
