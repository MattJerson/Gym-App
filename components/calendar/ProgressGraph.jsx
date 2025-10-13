import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import EmptyDataState from "./EmptyDataState";

const screenWidth = Dimensions.get("window").width;

export default function ProgressGraph({ chart }) {
  // Check if we have sufficient data (at least 2 data points)
  const hasSufficientData = chart?.values && chart.values.length >= 2 && 
    chart.values.filter(v => v && v > 0).length >= 2;

  // Data is filtered for the 7-day view
  const filteredData = useMemo(() => {
    if (!chart?.labels || !chart?.values || chart.labels.length === 0 || chart.values.length === 0) {
      return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [0, 0, 0, 0, 0, 0, 0] };
    }
    
    // Filter out any invalid values (null, undefined, NaN, Infinity)
    const validValues = chart.values.map(v => {
      const num = parseFloat(v);
      return (!isNaN(num) && isFinite(num)) ? num : 0;
    });
    
    const validLabels = chart.labels.slice(-7).map(label => label.substring(3, 5) || 'N/A');
    const finalValues = validValues.slice(-7);
    
    // Ensure we have at least some data points
    if (finalValues.length === 0) {
      return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [0, 0, 0, 0, 0, 0, 0] };
    }
    
    return {
      labels: validLabels,
      values: finalValues,
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

  return (
    <View style={styles.card}>
      {/* Header with Title and Weekly Average */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{chart.title}</Text>
        {hasSufficientData && (
          <View>
            <Text style={styles.averageValue}>{formatLabel(weeklyAverage)}</Text>
            <Text style={styles.averageLabel}>Weekly Avg.</Text>
          </View>
        )}
      </View>

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
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{ data: [65, 68, 67, 70, 69, 72, 71] }],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={aestheticChartConfig}
              bezier
              style={styles.chart}
              withShadow={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              formatYLabel={formatLabel}
            />
          }
        />
      ) : filteredData.values.length > 0 && filteredData.labels.length > 0 ? (
        <LineChart
          data={{
            labels: filteredData.labels,
            datasets: [{ 
              data: filteredData.values.length > 0 ? filteredData.values : [0] 
            }],
          }}
          width={screenWidth - 48} // Adjusted for new padding
          height={220}
          chartConfig={aestheticChartConfig}
          bezier
          withInnerLines={true}
          withShadow={true} // This adds the nice gradient fill under the line
          style={styles.chartStyle}
          formatYLabel={formatLabel}
          fromZero={false}
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
});
