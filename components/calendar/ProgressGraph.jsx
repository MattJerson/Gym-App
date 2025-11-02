import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import EmptyDataState from "./EmptyDataState";
import { WeightProgressService } from "../../services/WeightProgressService";
import { supabase } from "../../services/supabase";

const screenWidth = Dimensions.get("window").width;

export default function ProgressGraph({ chart, userId }) {
  const [unlockStatus, setUnlockStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Load unlock status when component mounts
  useEffect(() => {
    if (userId) {
      loadUnlockStatus();
    }
  }, [userId]);

  const loadUnlockStatus = async () => {
    try {
      console.log('📱 ProgressGraph: Loading unlock status for userId:', userId);
      setIsLoadingStatus(true);
      const status = await WeightProgressService.checkUnlockStatus(userId);
      console.log('📱 ProgressGraph: Received status:', status);
      setUnlockStatus(status);
    } catch (error) {
      console.error('📱 ProgressGraph: Error loading unlock status:', error);
      setUnlockStatus({
        isUnlocked: false,
        totalActivities: 0,
        message: 'Unable to load status'
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Check if we have sufficient data (at least 2 data points)
  const hasSufficientData = chart?.values && chart.values.length >= 2 && 
    chart.values.filter(v => v && v > 0).length >= 2;

  // Smart data sampling: Show max 4 dates intelligently
  const filteredData = useMemo(() => {
    if (!chart?.labels || !chart?.values || chart.labels.length === 0 || chart.values.length === 0) {
      return { labels: [], values: [], minY: 0, maxY: 100 };
    }
    
    // Filter out invalid values
    const validData = chart.values.map((v, i) => ({
      value: parseFloat(v),
      label: chart.labels[i],
      index: i
    })).filter(d => !isNaN(d.value) && isFinite(d.value) && d.value > 0);
    
    if (validData.length === 0) {
      return { labels: [], values: [], minY: 0, maxY: 100 };
    }

    let sampledData = [];
    
    // Smart sampling based on data amount
    if (validData.length <= 4) {
      // Show all if 4 or less
      sampledData = validData;
    } else if (validData.length <= 7) {
      // Show first, middle, last for 5-7 days
      const indices = [0, Math.floor(validData.length / 2), validData.length - 1];
      sampledData = indices.map(i => validData[i]);
    } else {
      // For more data (weekly/monthly): evenly sample 4 points
      const step = (validData.length - 1) / 3;
      sampledData = [
        validData[0],
        validData[Math.floor(step)],
        validData[Math.floor(step * 2)],
        validData[validData.length - 1]
      ];
    }

    // Extract labels (MM/DD format)
    const labels = sampledData.map(d => {
      const label = d.label;
      if (label.includes('/')) {
        return label; // Already in MM/DD format
      }
      // Try to extract from other formats
      return label.substring(0, 5);
    });

    const values = sampledData.map(d => d.value);
    
    // Calculate dynamic Y-axis range with 20% padding on both sides
    const minWeight = Math.min(...values);
    const maxWeight = Math.max(...values);
    const range = maxWeight - minWeight;
    
    // Add 20% padding to both top and bottom
    const paddingPercent = 0.20;
    const topPadding = range > 0 ? range * paddingPercent : maxWeight * paddingPercent;
    const bottomPadding = range > 0 ? range * paddingPercent : minWeight * paddingPercent;
    
    const minY = Math.floor((minWeight - bottomPadding) * 10) / 10; // Round to 1 decimal
    const maxY = Math.ceil((maxWeight + topPadding) * 10) / 10; // Round to 1 decimal
    
    return {
      labels,
      values,
      minY,
      maxY
    };
  }, [chart]);
  
  // Calculate weekly average to display in the header
  const weeklyAverage = useMemo(() => {
     if (!filteredData.values || filteredData.values.length === 0) return 0;
     const validValues = filteredData.values.filter(v => !isNaN(v) && isFinite(v));
     if (validValues.length === 0) return 0;
     const total = validValues.reduce((sum, value) => sum + value, 0);
     return Math.round(total / validValues.length);
  }, [filteredData.values]);

  // Dynamic chart config based on data range
  const dynamicChartConfig = useMemo(() => ({
    backgroundGradientFrom: "#1C1C1E",
    backgroundGradientTo: "#1C1C1E",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(235, 235, 245, ${opacity * 0.6})`,
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#1C1C1E",
      fill: "#0A84FF",
    },
    propsForBackgroundLines: {
      stroke: "rgba(255, 255, 255, 0.05)",
      strokeDasharray: "0",
    },
    fillShadowGradientOpacity: 0, // Remove background fill
    segments: 4,
    yAxisInterval: 1,
  }), []);

const aestheticChartConfig = {
  backgroundGradientFrom: "#1C1C1E",
  backgroundGradientTo: "#1C1C1E",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`, // ✅ #0A84FF
  labelColor: (opacity = 1) => `rgba(235, 235, 245, ${opacity * 0.6})`,
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: "#1C1C1E", // background punch-out
    fill: "#0A84FF",  // same vivid blue for consistency
  },
  propsForBackgroundLines: {
    stroke: "rgba(255, 255, 255, 0.05)",
    strokeDasharray: "0",
  },
  segments: 4,
};


  const formatLabel = (value) => {
    const numValue = parseFloat(value);
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}k`;
    }
    return Math.round(numValue);
  };

  // Render unlock required state
  const renderUnlockRequired = () => {
    if (isLoadingStatus) {
      return (
        <View style={styles.unlockContainer}>
          <Text style={styles.unlockMessage}>Loading...</Text>
        </View>
      );
    }

    if (!unlockStatus) return null;

    const activities = WeightProgressService.getActivityBreakdown(unlockStatus);

    return (
      <View style={styles.unlockContainer}>
        <View style={styles.unlockIconContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#0A84FF" />
        </View>
        
        <Text style={styles.unlockTitle}>Weight Tracking Locked</Text>
        <Text style={styles.unlockMessage}>
          Log your first workout, meal, or active day to unlock weight progress tracking
        </Text>

        {activities.length > 0 && (
          <View style={styles.activitiesPreview}>
            <Text style={styles.activitiesTitle}>Current Activity:</Text>
            <View style={styles.activitiesGrid}>
              {activities.map((activity, index) => (
                <View key={index} style={styles.activityBadge}>
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                  <Text style={styles.activityCount}>{activity.count}</Text>
                  <Text style={styles.activityLabel}>{activity.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.unlockProgressContainer}>
          <View style={styles.unlockProgressBar}>
            <View 
              style={[
                styles.unlockProgressFill, 
                { width: `${unlockStatus.unlockProgress}%`, backgroundColor: '#0A84FF' }
              ]} 
            />
          </View>
          <Text style={styles.unlockProgressText}>
            {unlockStatus.totalActivities > 0 
              ? `${unlockStatus.totalActivities} ${unlockStatus.totalActivities === 1 ? 'activity' : 'activities'} logged`
              : 'Start tracking to unlock'}
          </Text>
        </View>
      </View>
    );
  };

  // If not unlocked, show unlock required state
  if (!isLoadingStatus && unlockStatus && !unlockStatus.isUnlocked) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{chart?.title || 'Weight Progress'}</Text>
        </View>
        {renderUnlockRequired()}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header with Title and Weight Change */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{chart.title}</Text>
        {hasSufficientData && chart.weightChange !== undefined && (
          <View>
            <Text style={[
              styles.averageValue, 
              { color: chart.weightChange < 0 ? '#10B981' : chart.weightChange > 0 ? '#EF4444' : '#999' }
            ]}>
              {chart.weightChange > 0 ? '+' : ''}{chart.weightChange} kg
            </Text>
            <Text style={styles.averageLabel}>
              {chart.weightChange < 0 ? 'Lost' : chart.weightChange > 0 ? 'Gained' : 'No Change'}
            </Text>
          </View>
        )}
      </View>

      {/* Calorie Balance Indicator */}
      {hasSufficientData && chart.calorieBalance !== undefined && (
        <View style={styles.calorieBalanceContainer}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Current Weight</Text>
              <Text style={styles.balanceValue}>{chart.currentWeight} kg</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Cal Balance</Text>
              <Text style={[
                styles.balanceValue,
                { color: chart.calorieBalance < 0 ? '#10B981' : chart.calorieBalance > 0 ? '#EF4444' : '#999' }
              ]}>
                {chart.calorieBalance > 0 ? '+' : ''}{chart.calorieBalance}
              </Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0A84FF' }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0A84FF', opacity: 0.4 }]} />
              <Text style={styles.legendText}>Projected</Text>
            </View>
          </View>
        </View>
      )}

      {/* Chart with Gradient Fill or Empty State */}
      {!hasSufficientData ? (
        <EmptyDataState
          title="Start Tracking"
          message="Complete more workouts to see your progress trends"
          icon="trending-up-outline"
          iconColor="#0A84FF"
          sampleComponent={
            <LineChart
              data={{
                labels: ['10/15', '10/22', '10/29', '11/05'],
                datasets: [{ data: [88, 87, 86, 85] }],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={dynamicChartConfig}
              bezier={false}
              style={styles.chart}
              withShadow={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
              yAxisInterval={1}
            />
          }
        />
      ) : filteredData.values.length > 0 && filteredData.labels.length > 0 ? (
        <LineChart
          data={{
            labels: filteredData.labels,
            datasets: [
              { 
                data: filteredData.values,
              },
              // Add invisible padding points for Y-axis range
              {
                data: [filteredData.minY, filteredData.maxY],
                withDots: false,
                strokeWidth: 0,
                color: () => 'rgba(0, 0, 0, 0)', // Completely transparent
              }
            ],
          }}
          width={screenWidth - 48}
          height={240}
          chartConfig={dynamicChartConfig}
          bezier={false}
          withInnerLines={true}
          withShadow={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withOuterLines={false}
          style={styles.chartStyle}
          fromZero={false}
          yAxisInterval={1}
          segments={4}
          yLabelsOffset={15}
          xLabelsOffset={15}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", 
    
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#EFEFEF",
  },
  averageValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: 'right',
  },
  averageLabel: {
    fontSize: 12,
    color: "rgba(235, 235, 245, 0.6)",
    textAlign: 'right',
  },
  calorieBalanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceLabel: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.6)',
    marginBottom: 4,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: 'rgba(235, 235, 245, 0.6)',
    fontWeight: '500',
  },
  chartStyle: {
    borderRadius: 16,
  },
  emptyState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginHorizontal: 14,
  },
  emptyText: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  unlockContainer: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  unlockIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  unlockTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  unlockMessage: {
    fontSize: 14,
    color: 'rgba(235, 235, 245, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  activitiesPreview: {
    width: '100%',
    marginBottom: 24,
  },
  activitiesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  activitiesGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  activityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activityCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 10,
    color: 'rgba(235, 235, 245, 0.6)',
    fontWeight: '600',
  },
  unlockProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  unlockProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  unlockProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  unlockProgressText: {
    fontSize: 12,
    color: 'rgba(235, 235, 245, 0.6)',
    fontWeight: '600',
  },
});
