import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function StepsBarGraph({ dailyData }) {
  const [range, setRange] = useState("1M");

  const filteredData = useMemo(() => {
    if (!dailyData?.dates || !dailyData?.values) return { labels: [], values: [] };
    
    // This function is now more robust to prevent "Invalid Date" errors.
    const getDayLabel = (dateStr) => {
        if (!dateStr) return '';
        // Handles MM/DD/YYYY format safely
        const parts = dateStr.split('/');
        if (parts.length !== 3) return dateStr; // Return original if format is wrong
        // new Date(year, monthIndex, day) is the safest constructor
        const date = new Date(parts[2], parts[0] - 1, parts[1]);
        if (isNaN(date.getTime())) {
            return 'Err'; // Show an error if date is still invalid
        }
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    switch (range) {
      case "1W":
        return {
          labels: dailyData.dates.slice(-7).map(getDayLabel),
          values: dailyData.values.slice(-7),
        };

      case "1M": {
        const weeks = [];
        for (let i = 0; i < dailyData.values.length; i += 7) {
          weeks.push(dailyData.values.slice(i, i + 7));
        }
        return {
          labels: weeks.map((_, idx) => `W${idx + 1}`),
          values: weeks.map(
            (w) => w.length > 0 ? Math.round(w.reduce((a, b) => a + b, 0) / w.length) : 0
          ),
        };
      }

      case "1Y": {
        const allMonths = { "01": [], "02": [], "03": [], "04": [], "05": [], "06": [], "07": [], "08": [], "09": [], "10": [], "11": [], "12": [] };
        dailyData.dates.forEach((date, idx) => {
          const month = date.split("/")[0].padStart(2, "0");
          if (allMonths[month]) {
            allMonths[month].push(dailyData.values[idx]);
          }
        });
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return {
          labels: monthNames,
          values: Object.values(allMonths).map((vals) =>
            vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
          ),
        };
      }

      default:
        return { labels: [], values: [] };
    }
  }, [range, dailyData]);
  
  const { averageValue, averageLabel } = useMemo(() => {
     if (!filteredData.values || filteredData.values.length === 0) return { averageValue: 0, averageLabel: 'Avg' };
     const total = filteredData.values.reduce((sum, value) => sum + value, 0);
     const avg = Math.round(total / filteredData.values.length);
     
     let label = 'Daily Avg.';
     if (range === '1M') label = 'Weekly Avg.';
     if (range === '1Y') label = 'Monthly Avg.';
     
     return { averageValue: avg, averageLabel: label };
  }, [filteredData, range]);
  
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
        <View>
          <Text style={styles.title}>Daily Steps</Text>
          <Text style={styles.averageValue}>{formatLabel(averageValue)} <Text style={styles.averageLabel}>{averageLabel}</Text></Text>
        </View>
        {/* Range Buttons are now inside the header */}
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
      </View>

      {/* Chart */}
      <BarChart
        data={{
          labels: filteredData.labels,
          datasets: [{ data: filteredData.values }],
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 2,
  },
  averageLabel: {
    fontSize: 12,
    fontWeight: 'normal',
    color: "rgba(235, 235, 245, 0.6)",
  },
  chartStyle: {
    borderRadius: 16,
    marginTop: 10,
  },
  rangeButtonsContainer: {
    flexDirection: "row",
    gap: 8, // Reduced gap
  },
  rangeButton: {
    paddingVertical: 6, // Smaller
    paddingHorizontal: 14, // Smaller
    borderRadius: 14, // Adjusted radius
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  rangeButtonActive: {
    backgroundColor: "#0A84FF",
  },
  rangeText: {
    fontSize: 12, // Smaller font
    fontWeight: "700",
    color: "rgba(235, 235, 245, 0.6)",
  },
  rangeTextActive: {
    color: "#1C1C1E",
  },
});

