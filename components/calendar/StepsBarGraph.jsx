import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { BarChart } from "react-native-chart-kit";
import EmptyDataState from "./EmptyDataState";

const screenWidth = Dimensions.get("window").width;

export default function StepsBarGraph({ dailyData }) {
  const [range, setRange] = useState("1M");

  // Check if we have sufficient data
  const hasSufficientData = dailyData?.values && dailyData.values.length >= 2 &&
    dailyData.values.filter(v => v && v > 0).length >= 2;

  const filteredData = useMemo(() => {
    if (!dailyData?.dates || !dailyData?.values || dailyData.dates.length === 0 || dailyData.values.length === 0) {
      // Return default empty data
      return { labels: ['W1', 'W2', 'W3', 'W4'], values: [0, 0, 0, 0] };
    }
    
    // Filter out any invalid values (null, undefined, NaN, Infinity)
    const validValues = dailyData.values.map(v => {
      const num = parseFloat(v);
      return (!isNaN(num) && isFinite(num)) ? num : 0;
    });
    
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
          values: validValues.slice(-7).map(v => v || 0),
        };

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
        dailyData.dates.forEach((date, idx) => {
          const month = date.split("/")[0].padStart(2, "0");
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
  }, [range, dailyData]);
  
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
          {hasSufficientData && (
            <Text style={styles.averageValue}>
              {formatLabel(averageValue)} <Text style={styles.averageLabel}>{averageLabel}</Text>
            </Text>
          )}
        </View>
        {/* Range Buttons are now inside the header - only show if we have data */}
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

