// components/calendar/ProgressGraph.jsx
import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function ProgressGraph({ chart }) {
  const [range, setRange] = useState("1M");

  // format data similar to StepsBarGraph
  const filteredData = useMemo(() => {
    if (!chart?.labels || !chart?.values) return { labels: [], values: [] };

    switch (range) {
      case "1W":
        return {
          labels: chart.labels.slice(-7),
          values: chart.values.slice(-7),
        };

      case "1M": {
        const weeks = [];
        for (let i = 0; i < chart.values.length; i += 7) {
          weeks.push(chart.values.slice(i, i + 7));
        }
        return {
          labels: weeks.map((_, idx) => `W${idx + 1}`),
          values: weeks.map(
            (w) => Math.round(w.reduce((a, b) => a + b, 0) / w.length)
          ),
        };
      }

      case "1Y": {
        const allMonths = {
          "01": [], "02": [], "03": [], "04": [], "05": [], "06": [],
          "07": [], "08": [], "09": [], "10": [], "11": [], "12": []
        };
        chart.labels.forEach((date, idx) => {
          const month = date.split("/")[0].padStart(2, "0");
          if (allMonths[month]) {
            allMonths[month].push(chart.values[idx]);
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
        return chart;
    }
  }, [range, chart]);

  const chartConfig = {
    decimalPlaces: Math.max(...(filteredData.values || [0])) > 1000 ? 0 : 1,
    color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`,
    labelColor: () => "#bbb",
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#fff",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "rgba(255,255,255,0.1)",
    },
    segments: 4,
  };

  const formatLabel = (value, isHighValue) => {
    if (isHighValue) {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      }
      return Math.round(value);
    }
    return value.toFixed(1);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{chart.title}</Text>
        <View style={styles.rangeButtons}>
          {["1W", "1M", "1Y"].map((r) => (
            <Pressable
              key={r}
              style={[styles.rangeButton, range === r && styles.rangeButtonActive]}
              onPress={() => setRange(r)}
            >
              <Text
                style={[
                  styles.rangeText,
                  range === r && styles.rangeTextActive,
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Chart */}
      <LineChart
        data={{
          labels: filteredData.labels,
          datasets: [
            {
              data: filteredData.values,
              color:
                chart.color ||
                ((opacity = 1) => `rgba(52, 211, 153, ${opacity})`),
              strokeWidth: 3,
            },
          ],
        }}
        width={screenWidth - 70}
        height={230}
        chartConfig={chartConfig}
        bezier
        withInnerLines={true}
        withHorizontalLabels={true}
        style={{ padding: 10 }}
        formatYLabel={(yValue) =>
          formatLabel(parseFloat(yValue), Math.max(...filteredData.values) > 1000)
        }
        fromZero={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "black",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  rangeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rangeButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  rangeButtonActive: {
    backgroundColor: "#34d399",
  },
  rangeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ccc",
  },
  rangeTextActive: {
    color: "#fff",
  },
});
