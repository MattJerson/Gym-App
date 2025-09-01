// components/calendar/StepsBarGraph.js
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";

export default function StepsBarGraph({ dailyData }) {
  const screenWidth = Dimensions.get("window").width - 40;
  
  // Show every 7th date like iPhone Health app
  const labels = dailyData.dates.map((date, idx) =>
    idx % 7 === 0 ? date : ""
  );
  
  const chartData = {
    labels,
    datasets: [
      {
        data: dailyData.values,
      },
    ],
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Steps</Text>
          <Text style={styles.subtitle}>Last 30 days</Text>
        </View>
        <Text style={styles.deviceLabel}>iPhone</Text>
      </View>
      
      <BarChart
        data={chartData}
        width={screenWidth}
        height={300}
        fromZero
        withInnerLines
        showValuesOnTopOfBars={false}
        yAxisSuffix=""
        yAxisInterval={1}
        segments={3} // Creates 4 segments like iPhone (0, 5133, 10267, 15400)
        chartConfig={{
          backgroundColor: "#2C2C2E", // Dark background like iPhone
          backgroundGradientFrom: "#2C2C2E",
          backgroundGradientTo: "#2C2C2E",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 69, 58, ${opacity})`, // Red/pink bars like iPhone
          labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`, // Gray labels
          propsForBackgroundLines: {
            stroke: "rgba(72, 72, 74, 0.5)", // Subtle grid lines
          },
          barPercentage: 0.15, // Very thin bars
          formatYLabel: (yValue) => {
            const numValue = parseInt(yValue);
            if (numValue >= 1000) {
              return `${Math.floor(numValue / 1000)},${String(numValue % 1000).padStart(3, '0')}`;
            }
            return numValue.toString();
          },
          propsForLabels: {
            fontSize: 12,
          },
          propsForVerticalLabels: {
            fontSize: 14,
            fill: "rgba(142, 142, 147, 1)",
          },
          propsForHorizontalLabels: {
            fontSize: 12,
            fill: "rgba(142, 142, 147, 1)",
          },
        }}
        style={styles.chartStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E", // iPhone dark card background
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93", // Gray subtitle
    fontWeight: "400",
  },
  deviceLabel: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "400",
  },
  chartStyle: {
    borderRadius: 0,
    marginLeft: -16, // Align with card edges
  },
});