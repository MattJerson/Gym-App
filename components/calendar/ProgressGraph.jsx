import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import EmptyDataState from "./EmptyDataState";
import { WeightProgressService } from "../../services/WeightProgressService";
import { supabase } from "../../services/supabase";

const screenWidth = Dimensions.get("window").width;

export default function ProgressGraph({ chart, userId, onRefresh }) {
  const [unlockStatus, setUnlockStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [dailyBalance, setDailyBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [projectedWeightToday, setProjectedWeightToday] = useState(null);
  const [isLoadingProjection, setIsLoadingProjection] = useState(true);

  // 🔍 COMPREHENSIVE LOGGING - Component Mount
  useEffect(() => {
  }, []);

  // 🔍 Log when chart prop changes
  useEffect(() => {
  }, [chart]);

  // Load unlock status when component mounts
  useEffect(() => {
    if (userId) {
      loadUnlockStatus();
      loadDailyBalance();
      loadProjectedWeightToday();
    } else {
      console.warn('📊 ProgressGraph: No userId provided!');
    }
  }, [userId]);

  // Reload daily balance and projection when chart data changes (new food/workout logged)
  useEffect(() => {
    if (userId && chart) {
      loadDailyBalance();
    }
  }, [chart?.values, chart?.labels]);

  // Reload projection when daily balance changes (after food/workout logged)
  useEffect(() => {
    if (userId && dailyBalance) {
      loadProjectedWeightToday();
    }
  }, [dailyBalance]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      if (onRefresh) {
        await onRefresh();
      }
      await loadDailyBalance();
      await loadProjectedWeightToday();
    } catch (error) {
      console.error('Error refreshing chart:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadUnlockStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const status = await WeightProgressService.checkUnlockStatus(userId);
      setUnlockStatus(status);
    } catch (error) {
      console.error('❌ ProgressGraph: Error loading unlock status:', error);
      setUnlockStatus({
        isUnlocked: false,
        totalActivities: 0,
        message: 'Unable to load status'
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const loadDailyBalance = async () => {
    try {
      setIsLoadingBalance(true);
      // Use local date to ensure we get today's data in user's timezone
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const balance = await WeightProgressService.getDailyCalorieBalance(userId, todayString);
      
      // CORRECT LOGIC:
      // To maintain weight, user needs to eat their maintenance calories (calorieGoal)
      // Net balance = what they consumed - their maintenance requirement
      // Positive net = surplus (will gain weight)
      // Negative net = deficit (will lose weight)
      const maintenanceCalories = balance.calorieGoal || 2000;
      const netBalance = balance.caloriesConsumed - maintenanceCalories;
      
      setDailyBalance({
        consumed: balance.caloriesConsumed,
        burned: balance.caloriesBurned,
        net: netBalance,
        isDeficit: netBalance < 0,
        isSurplus: netBalance > 0,
        mealsLogged: balance.mealsLogged,
        calorieGoal: balance.calorieGoal
      });
    } catch (error) {
      console.error('❌ ProgressGraph: Error loading daily balance:', error);
      setDailyBalance({
        consumed: 0,
        burned: 0,
        net: 0,
        isDeficit: false,
        isSurplus: false,
        mealsLogged: 0,
        calorieGoal: 2000
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const loadProjectedWeightToday = async () => {
    try {
      setIsLoadingProjection(true);
      const projection = await WeightProgressService.getProjectedWeightToday(userId);
      
      if (projection.hasInitialWeight && dailyBalance) {
        const today = new Date();
        const todayLabel = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
        
        // CORRECT LOGIC: dailyBalance.net already contains the correct calculation
        // dailyBalance.net = consumed - maintenance
        // If user logged 100 cal broccoli with 2000 maintenance: net = 100 - 2000 = -1900 (deficit)
        // If user logged 2500 cal with 2000 maintenance: net = 2500 - 2000 = +500 (surplus)
        let actualNetCalories;
        
        if (dailyBalance.mealsLogged === 0) {
          // No meals logged = assume user ate maintenance calories (no weight change)
          actualNetCalories = 0;
        } else {
          // Use the correct net balance (already calculated as consumed - maintenance)
          actualNetCalories = dailyBalance.net;
        }
        
        const todayWeightChange = actualNetCalories / 7700; // 7700 calories = 1kg
        const adjustedProjectedWeight = projection.projectedWeight + todayWeightChange;
        const adjustedChange = projection.expectedWeightChange + todayWeightChange;
        
        setProjectedWeightToday({
          date: todayLabel,
          weight: adjustedProjectedWeight,
          change: adjustedChange,
          lastActualWeight: projection.lastActualWeight,
          daysSince: projection.daysSinceMeasurement,
          calorieBalance: projection.cumulativeCalorieBalance + actualNetCalories
        });
      } else if (projection.hasInitialWeight) {
        const today = new Date();
        const todayLabel = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
        
        setProjectedWeightToday({
          date: todayLabel,
          weight: projection.projectedWeight,
          change: projection.expectedWeightChange,
          lastActualWeight: projection.lastActualWeight,
          daysSince: projection.daysSinceMeasurement,
          calorieBalance: projection.cumulativeCalorieBalance
        });
      } else {
        setProjectedWeightToday(null);
      }
    } catch (error) {
      setProjectedWeightToday(null);
    } finally {
      setIsLoadingProjection(false);
    }
  };

  // Filter data based on selected time range
  const getFilteredDataByRange = useMemo(() => {
    if (!chart?.labels || !chart?.values || chart.labels.length === 0 || chart.values.length === 0) {
      return { labels: [], values: [], dates: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create array of data with parsed dates
    let allData = chart.labels.map((label, i) => {
      // Parse date from MM/DD format
      const [month, day] = label.split('/').map(n => parseInt(n));
      const year = today.getFullYear();
      const date = new Date(year, month - 1, day);
      
      // Handle year boundary (if date is in future, it's from previous year)
      if (date > today) {
        date.setFullYear(year - 1);
      }
      
      return {
        value: parseFloat(chart.values[i]),
        label: label,
        date: date,
        index: i,
        isProjected: false
      };
    }).filter(d => !isNaN(d.value) && isFinite(d.value) && d.value > 0);

    // Add tomorrow's projected weight if available (for graph line, but hide the date label)
    if (projectedWeightToday && projectedWeightToday.weight > 0) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowLabel = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${String(tomorrow.getDate()).padStart(2, '0')}`;
      
      // Add tomorrow's projection to extend the graph line
      allData.push({
        value: projectedWeightToday.weight,
        label: tomorrowLabel,
        date: tomorrow,
        index: allData.length,
        isProjected: true,
        hideLabel: true // Flag to hide this date on X-axis
      });
    }

    if (allData.length === 0) {
      return { labels: [], values: [], dates: [] };
    }

    // Sort by date ascending
    allData.sort((a, b) => a.date - b.date);

    let startDate;
    let filteredData;

    switch (timeRange) {
      case 'week':
        // Last 7 days from today
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6); // 7 days including today
        filteredData = allData.filter(d => d.date >= startDate && (d.date <= today || d.isProjected));
        break;
      
      case 'month':
        // Last 30 days from today
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29); // 30 days including today
        filteredData = allData.filter(d => d.date >= startDate && (d.date <= today || d.isProjected));
        break;
      
      case 'year':
        // From first data point up to 1 year ago, or all data if less than 1 year
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        const firstDataDate = allData[0].date;
        
        // Use whichever is more recent: 1 year ago or first data point
        const effectiveStartDate = firstDataDate > startDate ? firstDataDate : startDate;
        filteredData = allData.filter(d => d.date >= effectiveStartDate && (d.date <= today || d.isProjected));
        break;
      
      default:
        filteredData = allData;
    }

    return {
      labels: filteredData.map(d => d.label),
      values: filteredData.map(d => d.value),
      dates: filteredData.map(d => d.date)
    };
  }, [chart, timeRange, projectedWeightToday, isLoadingProjection]);

  // Check if we have sufficient data (at least 1 data point for automatic tracking)
  // With automatic weight tracking, we can show progress with just the initial weight
  const hasSufficientData = getFilteredDataByRange.values.length >= 1;
  
  // Smart data sampling: Group days and show summary points (3-4 total)
  const filteredData = useMemo(() => {
    const data = getFilteredDataByRange;
    
    if (data.values.length === 0) {
      return { labels: [], values: [], minY: 0, maxY: 100, displayLabels: [] };
    }

    const validData = data.values.map((v, i) => ({
      value: v,
      label: data.labels[i],
      date: data.dates[i],
      index: i
    }));

    // Show 4 dates consistently across all time ranges
    const targetSummaryPoints = 4;
    
    // Check if last point is projected (future date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasProjectedPoint = validData.length > 0 && validData[validData.length - 1].date > today;
    
    // Separate historical and projected data
    const historicalData = hasProjectedPoint ? validData.slice(0, -1) : validData;
    const projectedData = hasProjectedPoint ? validData[validData.length - 1] : null;
    
    let summarizedData = [];
    
    if (historicalData.length <= targetSummaryPoints) {
      // Keep as is if we have fewer points than target
      summarizedData = historicalData;
    } else {
      // Many points - group into exactly targetSummaryPoints summary ranges
      // Create exactly targetSummaryPoints groups by sampling evenly
      const step = (historicalData.length - 1) / (targetSummaryPoints - 1);
      
      for (let i = 0; i < targetSummaryPoints; i++) {
        if (i === targetSummaryPoints - 1) {
          // Last point - use the actual last data point
          const lastPoint = historicalData[historicalData.length - 1];
          summarizedData.push(lastPoint);
        } else {
          // Calculate the center index for this group
          const centerIndex = Math.round(i * step);
          const startIndex = i === 0 ? 0 : Math.round((i - 0.5) * step);
          const endIndex = Math.round((i + 0.5) * step);
          
          const group = historicalData.slice(startIndex, endIndex + 1);
          
          // Average the weights in this group
          const avgWeight = group.reduce((sum, d) => sum + d.value, 0) / group.length;
          
          summarizedData.push({
            value: avgWeight,
            label: historicalData[centerIndex].label,
            date: historicalData[centerIndex].date
          });
        }
      }
    }
    
    // If we have projected weight, include it with the last historical date
    // This makes the user assume current day includes today's progress
    if (projectedData) {
      // Replace the last summary point with projected weight, keeping its date label
      if (summarizedData.length > 0) {
        summarizedData[summarizedData.length - 1] = {
          value: projectedData.value,
          label: summarizedData[summarizedData.length - 1].label, // Keep historical date label
          date: summarizedData[summarizedData.length - 1].date
        };
      } else {
        // Edge case: only projected data
        summarizedData.push({
          value: projectedData.value,
          label: projectedData.label,
          date: projectedData.date
        });
      }
    }
    
    const values = summarizedData.map(d => d.value);
    const displayLabels = summarizedData.map(d => d.label);
    
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
      labels: displayLabels,
      values,
      minY,
      maxY
    };
  }, [getFilteredDataByRange, timeRange, projectedWeightToday]);
  
  // Calculate weight change for the selected time range
  const dynamicWeightChange = useMemo(() => {
    if (!filteredData.values || filteredData.values.length === 0) {
      return { change: 0, current: 0 };
    }
    
    if (filteredData.values.length === 1) {
      // Only one data point
      return { 
        change: 0, 
        current: filteredData.values[0]
      };
    }
    
    const firstWeight = filteredData.values[0];
    // Last value in the array is the current/projected weight (already included in filteredData)
    const currentWeight = filteredData.values[filteredData.values.length - 1];
    const change = Number((currentWeight - firstWeight).toFixed(1));
    
    return {
      change: change,
      current: currentWeight
    };
  }, [filteredData.values, projectedWeightToday]);

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

  // Check if all data is fully loaded
  const isFullyLoaded = !isLoadingStatus && !isLoadingBalance && !isLoadingProjection;

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

  // Show loading skeleton while any data is still loading
  if (!isFullyLoaded) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{chart?.title || 'Weight Progress'}</Text>
        </View>
        <View style={styles.unlockContainer}>
          <Text style={styles.unlockMessage}>Loading...</Text>
        </View>
      </View>
    );
  }

  // If not unlocked, show unlock required state
  if (unlockStatus && !unlockStatus.isUnlocked) {
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
      {/* Header with Title, Weight Change, and Refresh Button */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{chart.title}</Text>
          {onRefresh && (
            <Pressable 
              style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]} 
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <Ionicons 
                name="refresh" 
                size={18} 
                color={isRefreshing ? 'rgba(235, 235, 245, 0.3)' : '#0A84FF'} 
              />
            </Pressable>
          )}
        </View>
        {hasSufficientData && (
          <View>
            <Text style={[
              styles.averageValue, 
              { color: dynamicWeightChange.change < 0 ? '#10B981' : dynamicWeightChange.change > 0 ? '#EF4444' : '#999' }
            ]}>
              {dynamicWeightChange.change > 0 ? '+' : ''}{dynamicWeightChange.change} kg
            </Text>
            <Text style={styles.averageLabel}>
              {dynamicWeightChange.change < 0 ? 'Lost' : dynamicWeightChange.change > 0 ? 'Gained' : 'No Change'}
            </Text>
          </View>
        )}
      </View>

      {/* Time Range Selector */}
      {hasSufficientData && (
        <>
          <View style={styles.timeRangeContainer}>
            <Pressable
              style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('week')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>
                Week
              </Text>
            </Pressable>
            <Pressable
              style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('month')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>
                Month
              </Text>
            </Pressable>
            <Pressable
              style={[styles.timeRangeButton, timeRange === 'year' && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange('year')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'year' && styles.timeRangeTextActive]}>
                Year
              </Text>
            </Pressable>
          </View>

        </>
      )}

      {/* Current Weight & Daily Balance Indicator */}
      {hasSufficientData && !isLoadingBalance && dailyBalance && (
        <View style={styles.compactBalanceContainer}>
          <View style={styles.compactBalanceRow}>
            <View style={styles.compactBalanceItem}>
              <Text style={styles.compactBalanceLabel}>Current Weight</Text>
              <Text style={styles.compactBalanceValue}>{dynamicWeightChange.current.toFixed(1)} kg</Text>
            </View>
            <View style={styles.compactBalanceDivider} />
            <View style={styles.compactBalanceItem}>
              <Text style={styles.compactBalanceLabel}>Daily Balance</Text>
              <Text style={[
                styles.compactBalanceValue,
                { color: dailyBalance.isDeficit ? '#10B981' : dailyBalance.isSurplus ? '#EF4444' : '#999' }
              ]}>
                {dailyBalance.net > 0 ? '+' : ''}{dailyBalance.net}
              </Text>
              <Text style={styles.compactBalanceSubtext}>
                {dailyBalance.isDeficit ? 'Deficit' : dailyBalance.isSurplus ? 'Surplus' : 'Balanced'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Chart with Gradient Fill or Empty State */}
      {!hasSufficientData ? (
        <EmptyDataState
          title="Start Tracking"
          message="Log meals and workouts to see automatic weight tracking"
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#EFEFEF",
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  refreshButtonDisabled: {
    opacity: 0.5,
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
  // Compact Balance Container (New Design)
  compactBalanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  compactBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  compactBalanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  compactBalanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  compactBalanceLabel: {
    fontSize: 10,
    color: 'rgba(235, 235, 245, 0.5)',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactBalanceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  compactBalanceSubtext: {
    fontSize: 9,
    color: 'rgba(235, 235, 245, 0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#0A84FF',
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

});
