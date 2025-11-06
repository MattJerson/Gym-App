import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Simple tooltip showing activity counts for a calendar day
 */
export default function DayActivityTooltip({ visible, counts, position }) {
  if (!visible || !counts) return null;

  const hasActivities = counts.workouts > 0 || counts.meals > 0;

  return (
    <View 
      style={[
        styles.tooltipContainer,
        position && {
          top: position.y,
          left: position.x,
        }
      ]}
    >
      {/* Triangle pointer at top */}
      <View style={styles.tooltipArrowTop} />
      <View style={styles.tooltip}>
        <Text style={styles.tooltipTitle}>Logs:</Text>
        <View style={styles.countsColumn}>
          {counts.workouts > 0 && (
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Workouts:</Text>
              <Text style={styles.countValue}>{counts.workouts}</Text>
            </View>
          )}
          {counts.meals > 0 && (
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Meals:</Text>
              <Text style={styles.countValue}>{counts.meals}</Text>
            </View>
          )}
          {!hasActivities && (
            <Text style={styles.emptyText}>No activities</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltipContainer: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 110,
  },
  tooltipTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(235, 235, 245, 0.6)',
    marginBottom: 4,
  },
  countsColumn: {
    gap: 3,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.8)',
  },
  countValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.5)',
    textAlign: 'center',
  },
  tooltipArrowTop: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(28, 28, 30, 0.98)',
    borderLeftColor: 'transparent',
    marginBottom: -1,
  },
});
