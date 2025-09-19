import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function ProgressGraph({ chart }) {
  // Data is filtered for the 7-day view
  const filteredData = useMemo(() => {
    if (!chart?.labels || !chart?.values) return { labels: [], values: [] };
    return {
      labels: chart.labels.slice(-7).map(label => label.substring(3, 5)), // Show only day, e.g., "Mon"
      values: chart.values.slice(-7),
    };
  }, [chart]);
  
  // Calculate weekly average to display in the header
  const weeklyAverage = useMemo(() => {
     if (!filteredData.values || filteredData.values.length === 0) return 0;
     const total = filteredData.values.reduce((sum, value) => sum + value, 0);
     return Math.round(total / filteredData.values.length);
  }, [filteredData.values]);

  const aestheticChartConfig = {
    backgroundGradientFrom: "#1C1C1E",
    backgroundGradientTo: "#1C1C1E",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 220, 180, ${opacity})`, // Vibrant Teal
    labelColor: (opacity = 1) => `rgba(235, 235, 245, ${opacity * 0.6})`,
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#1C1C1E", // Background color for a "punched-out" look
      fill: "rgb(0, 220, 180)",
    },
    propsForBackgroundLines: {
      stroke: "rgba(255, 255, 255, 0.08)",
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
        <View>
          <Text style={styles.averageValue}>{formatLabel(weeklyAverage)}</Text>
          <Text style={styles.averageLabel}>Weekly Avg.</Text>
        </View>
      </View>

      {/* Chart with Gradient Fill */}
      <LineChart
        data={{
          labels: filteredData.labels,
          datasets: [{ data: filteredData.values }],
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E", // Softer dark color
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    // Adding a subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
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
});
