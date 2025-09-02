// components/calendar/StepsBarGraph.jsx
import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function StepsBarGraph({ dailyData }) {
  const [range, setRange] = useState("1M");

  const filteredData = useMemo(() => {
    if (!dailyData?.dates || !dailyData?.values) return { labels: [], values: [] };

    switch (range) {
      case "1W":
        return {
          labels: dailyData.dates.slice(-7),
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
            (w) => Math.round(w.reduce((a, b) => a + b, 0) / w.length)
          ),
        };
      }

      case "1Y": {
        const allMonths = {
          "01": [], "02": [], "03": [], "04": [], "05": [], "06": [],
          "07": [], "08": [], "09": [], "10": [], "11": [], "12": []
        };
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
        return dailyData;
    }
  }, [range, dailyData]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Daily Steps</Text>
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
      <BarChart
        data={{
          labels: filteredData.labels,
          datasets: [{ data: filteredData.values }],
        }}
        width={screenWidth - 70}
        height={230}
        fromZero
        withInnerLines={true}
        withHorizontalLabels={true}
        chartConfig={{
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`,
          labelColor: () => "#bbb",
          barPercentage: 0.4,
          propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: "rgba(255,255,255,0.1)",
          },
          fillShadowGradientFrom: "#34d399",
          fillShadowGradientTo: "#10b981",
          fillShadowGradientOpacity: 1,
        }}
        style={{
          padding: 10,
        }}
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
