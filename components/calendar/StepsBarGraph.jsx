import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable, ActivityIndicator } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import EmptyDataState from "./EmptyDataState";

const screenWidth = Dimensions.get("window").width;

export default function StepsBarGraph({ 
  dailyData, 
  source, 
  lastSynced, 
  onSyncPress, 
  isSyncing = false,
  goalSteps = 10000,
  stepsTrackingEnabled = true,
  onEnableTracking = null,
}) {
  const [range, setRange] = useState("1W");

  // Normalize data format - accept both old format (dates/values arrays) and new HealthKit format (dailySteps array)
  const normalizedData = useMemo(() => {
    // New HealthKit format: { dailySteps: [{date, steps, day}, ...], totalSteps, averageSteps, ... }
    if (dailyData?.dailySteps && Array.isArray(dailyData.dailySteps)) {
      return {
        dates: dailyData.dailySteps.map(d => d.date),
        values: dailyData.dailySteps.map(d => d.steps),
        labels: dailyData.dailySteps.map(d => d.day),
        totalSteps: dailyData.totalSteps || 0,
        averageSteps: dailyData.averageSteps || 0,
        highestDay: dailyData.highestDay || { steps: 0 },
        isHealthKitData: true
      };
    }
    
    // Old format: { dates: ['MM/DD', ...], values: [steps, ...] }
    if (dailyData?.dates && dailyData?.values) {
      const totalSteps = dailyData.values.reduce((sum, val) => sum + (val || 0), 0);
      const validValues = dailyData.values.filter(v => v > 0);
      const avgSteps = validValues.length > 0 
        ? Math.round(totalSteps / validValues.length) 
        : 0;
      
      return {
        dates: dailyData.dates,
        values: dailyData.values,
        labels: null, // Will be computed in filteredData
        totalSteps,
        averageSteps: avgSteps,
        highestDay: { steps: Math.max(...dailyData.values) },
        isHealthKitData: false
      };
    }
    
    // No data
    return {
      dates: [],
      values: [],
      labels: [],
      totalSteps: 0,
      averageSteps: 0,
      highestDay: { steps: 0 },
      isHealthKitData: false
    };
  }, [dailyData]);

  // Check if we have sufficient data
  const hasSufficientData = normalizedData.values.length >= 2 &&
    normalizedData.values.filter(v => v && v > 0).length >= 2;

  const filteredData = useMemo(() => {
    if (normalizedData.values.length === 0) {
      return { labels: ['W1', 'W2', 'W3', 'W4'], values: [0, 0, 0, 0] };
    }
    
    // Filter out any invalid values (null, undefined, NaN, Infinity)
    const validValues = normalizedData.values.map(v => {
      const num = parseFloat(v);
      return (!isNaN(num) && isFinite(num)) ? num : 0;
    });
    
    // Helper to get day label from date string
    const getDayLabel = (dateStr, index) => {
      // If we have pre-computed labels from HealthKit (e.g., "Mon", "Tue")
      if (normalizedData.labels && normalizedData.labels[index]) {
        return normalizedData.labels[index];
      }
      
      // Parse date string (supports "YYYY-MM-DD" or "MM/DD" or "MM/DD/YYYY")
      if (!dateStr) return '';
      
      let date;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 2) {
          // MM/DD format - assume current year
          const currentYear = new Date().getFullYear();
          date = new Date(currentYear, parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else if (parts.length === 3) {
          // MM/DD/YYYY format
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      } else if (dateStr.includes('-')) {
        // YYYY-MM-DD format
        date = new Date(dateStr);
      }
      
      if (!date || isNaN(date.getTime())) {
        return 'Err';
      }
      
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    switch (range) {
      case "1W":
        const weekData = {
          labels: normalizedData.dates.slice(-7).map((d, i) => getDayLabel(d, normalizedData.dates.length - 7 + i)),
          values: validValues.slice(-7).map(v => v || 0),
        };
        return weekData;

      case "1M": {
        const weeks = [];
        for (let i = 0; i < validValues.length; i += 7) {
          weeks.push(validValues.slice(i, i + 7));
        }
        if (weeks.length === 0) {
          return { labels: ['W1', 'W2', 'W3', 'W4'], values: [0, 0, 0, 0] };
        }
        return {
          labels: weeks.map((_, idx) => `W${idx + 1}`),
          values: weeks.map((w) => {
            if (!w || w.length === 0) return 0;
            const validWeekValues = w.filter(v => !isNaN(v) && isFinite(v));
            return validWeekValues.length > 0 
              ? Math.round(validWeekValues.reduce((a, b) => a + b, 0) / validWeekValues.length) 
              : 0;
          }),
        };
      }

      case "1Y": {
        const allMonths = { "01": [], "02": [], "03": [], "04": [], "05": [], "06": [], "07": [], "08": [], "09": [], "10": [], "11": [], "12": [] };
        normalizedData.dates.forEach((dateStr, idx) => {
          let month;
          
          if (dateStr.includes('/')) {
            month = dateStr.split("/")[0].padStart(2, "0");
          } else if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            month = dateStr.split("-")[1];
          }
          
          if (allMonths[month]) {
            const value = validValues[idx];
            if (!isNaN(value) && isFinite(value)) {
              allMonths[month].push(value);
            }
          }
        });
        
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return {
          labels: monthNames,
          values: Object.values(allMonths).map((vals) => {
            if (!vals || vals.length === 0) return 0;
            const validMonthValues = vals.filter(v => !isNaN(v) && isFinite(v));
            return validMonthValues.length > 0 
              ? Math.round(validMonthValues.reduce((a, b) => a + b, 0) / validMonthValues.length) 
              : 0;
          }),
        };
      }

      default:
        return { labels: ['W1', 'W2', 'W3', 'W4'], values: [0, 0, 0, 0] };
    }
  }, [range, normalizedData]);
  
  const { averageValue, averageLabel } = useMemo(() => {
     if (!filteredData.values || filteredData.values.length === 0) return { averageValue: 0, averageLabel: 'Avg' };
     const validValues = filteredData.values.filter(v => !isNaN(v) && isFinite(v));
     if (validValues.length === 0) return { averageValue: 0, averageLabel: 'Avg' };
     const total = validValues.reduce((sum, value) => sum + value, 0);
     const avg = Math.round(total / validValues.length);
     
     let label = 'Daily Avg.';
     if (range === '1M') label = 'Weekly Avg.';
     if (range === '1Y') label = 'Monthly Avg.';
     
     return { averageValue: avg, averageLabel: label };
  }, [filteredData, range]);

  // Calculate goal achievement stats
  const goalStats = useMemo(() => {
    if (!normalizedData.values || normalizedData.values.length === 0) {
      return { daysMetGoal: 0, totalDays: 0, percentage: 0 };
    }
    
    const totalDays = normalizedData.values.length;
    const daysMetGoal = normalizedData.values.filter(v => v >= goalSteps).length;
    const percentage = Math.round((daysMetGoal / totalDays) * 100);
    
    return { daysMetGoal, totalDays, percentage };
  }, [normalizedData, goalSteps]);
  
  const formatLabel = (value) => {
    const numValue = parseFloat(value);
    if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}k`;
    }
    return Math.round(numValue);
  };

const aestheticChartConfig = {
  backgroundGradientFrom: "#1C1C1E",
  backgroundGradientTo: "#1C1C1E",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`, // ✅ #0A84FF
  labelColor: (opacity = 1) => `rgba(235, 235, 245, ${opacity * 0.6})`,
  barPercentage: 0.6,
  propsForBackgroundLines: {
    stroke: "rgba(255, 255, 255, 0.08)",
    strokeDasharray: "0",
  },
  fillShadowGradientFrom: "#0A84FF", // ✅ vivid blue start
  fillShadowGradientTo: "#0A84FF",   // ✅ same blue (solid look)
  fillShadowGradientOpacity: 1,
};


  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Daily Steps</Text>
            {source && (
              <View style={styles.sourceBadge}>
                <Ionicons 
                  name={source.includes('Apple') ? 'fitness' : 'logo-google'} 
                  size={12} 
                  color="#0A84FF" 
                />
                <Text style={styles.sourceText}>{source}</Text>
              </View>
            )}
          </View>
          {hasSufficientData && (
            <View style={styles.statsRow}>
              <Text style={styles.averageValue}>
                {formatLabel(averageValue)} <Text style={styles.averageLabel}>{averageLabel}</Text>
              </Text>
              {goalStats.percentage > 0 && (
                <Text style={styles.goalBadge}>
                  🎯 {goalStats.percentage}% goal hit
                </Text>
              )}
            </View>
          )}
        </View>
        {/* Range Buttons */}
        {hasSufficientData && (
          <View style={styles.rangeButtonsContainer}>
            {["1W", "1M", "1Y"].map((r) => (
              <Pressable
                key={r}
                style={[styles.rangeButton, range === r && styles.rangeButtonActive]}
                onPress={() => setRange(r)}
              >
                <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Sync Status Bar */}
      {(lastSynced || onSyncPress) && (
        <View style={styles.syncBar}>
          <View style={styles.syncInfo}>
            <Ionicons name="sync-outline" size={14} color="rgba(235, 235, 245, 0.6)" />
            {lastSynced && (
              <Text style={styles.syncText}>
                Last synced: {new Date(lastSynced).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </Text>
            )}
          </View>
          {onSyncPress && (
            <Pressable 
              onPress={onSyncPress} 
              disabled={isSyncing}
              style={styles.syncButton}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#0A84FF" />
              ) : (
                <Text style={styles.syncButtonText}>Refresh</Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {/* Enable Tracking Button - shown when user dismissed prompt but hasn't enabled yet */}
      {!stepsTrackingEnabled && onEnableTracking && (
        <View style={styles.enableTrackingBar}>
          <View style={styles.enableTrackingInfo}>
            <Ionicons name="footsteps-outline" size={16} color="#0A84FF" />
            <Text style={styles.enableTrackingText}>
              Steps tracking is disabled
            </Text>
          </View>
          <Pressable 
            onPress={onEnableTracking}
            style={styles.enableTrackingButton}
          >
            <Text style={styles.enableTrackingButtonText}>Enable</Text>
          </Pressable>
        </View>
      )}

      {/* Chart or Empty State */}
      {!hasSufficientData ? (
        <EmptyDataState
          title="No Steps Recorded"
          message="Start tracking your daily steps to see your activity trends"
          icon="footsteps-outline"
          iconColor="#0A84FF"
          sampleComponent={
            <BarChart
              data={{
                labels: ['W1', 'W2', 'W3', 'W4'],
                datasets: [{ data: [8500, 9200, 7800, 10100] }],
              }}
              width={screenWidth - 48}
              height={220}
              fromZero
              withInnerLines={true}
              showBarTops={false}
              chartConfig={aestheticChartConfig}
              style={styles.chartStyle}
              yAxisLabel=""
              yAxisSuffix=""
              formatYLabel={formatLabel}
            />
          }
        />
      ) : filteredData.values.length > 0 && filteredData.labels.length > 0 ? (
        <>
          <BarChart
            data={{
              labels: filteredData.labels,
              datasets: [{ data: filteredData.values.length > 0 ? filteredData.values : [0] }],
            }}
            width={screenWidth - 48}
            height={220}
            fromZero
            withInnerLines={true}
            showBarTops={false}
            chartConfig={aestheticChartConfig}
            style={styles.chartStyle}
            yAxisLabel=""
            yAxisSuffix=""
            formatYLabel={formatLabel}
          />
          
          {/* Additional Stats Footer */}
          {normalizedData.totalSteps > 0 && (
            <View style={styles.statsFooter}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatLabel(normalizedData.totalSteps)}</Text>
                <Text style={styles.statLabel}>Total Steps</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{normalizedData.highestDay.steps.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Best Day</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{goalStats.daysMetGoal}/{goalStats.totalDays}</Text>
                <Text style={styles.statLabel}>Goals Met</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No step data available</Text>
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
    alignItems: "flex-start",
    marginBottom: 15,
    paddingHorizontal: 14,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#EFEFEF",
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0A84FF",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  averageValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  averageLabel: {
    fontSize: 12,
    fontWeight: 'normal',
    color: "rgba(235, 235, 245, 0.6)",
  },
  goalBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#34C759",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  syncBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  syncInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncText: {
    fontSize: 11,
    color: "rgba(235, 235, 245, 0.6)",
    fontWeight: "500",
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: "center",
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0A84FF",
  },
  enableTrackingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(10, 132, 255, 0.1)",
    borderRadius: 12,
    marginHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.2)",
  },
  enableTrackingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  enableTrackingText: {
    fontSize: 13,
    color: "#0A84FF",
    fontWeight: "600",
  },
  enableTrackingButton: {
    backgroundColor: "#0A84FF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  enableTrackingButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  chartStyle: {
    borderRadius: 16,
    marginTop: 10,
  },
  rangeButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  rangeButtonActive: {
    backgroundColor: "#0A84FF",
  },
  rangeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(235, 235, 245, 0.6)",
  },
  rangeTextActive: {
    color: "#1C1C1E",
  },
  statsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 4,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A84FF",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(235, 235, 245, 0.5)",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginHorizontal: 14,
    marginTop: 10,
  },
  emptyText: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
});

