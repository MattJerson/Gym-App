// components/calendar/ProgressGraph.jsx
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

const CARD_WIDTH = width * 0.8;
const CARD_MARGIN = 20;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

// Define the smaller dimensions for the chart itself
const CHART_WIDTH = CARD_WIDTH - 30;
const CHART_HEIGHT = 210;

export default function ProgressGraph({ charts = [] }) {
  if (!charts || charts.length === 0) {
    return null;
  }

  // This is the working chart config we had before, with the gray background
  const chartConfig = {
    backgroundGradientFrom: "#333333",
    backgroundGradientTo: "#333333",
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#fff",
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
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Progress</Text>
        <Ionicons name="bar-chart-outline" size={20} color="#fff" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {charts.map((chart, index) => {
          const isHighValue = Math.max(...chart.values) > 1000;
          const dataForChart = {
            labels: chart.labels,
            datasets: [
              {
                data: chart.values,
                color: chart.color,
                strokeWidth: 3,
              },
            ],
          };

          return (
            // FIX #1: The outer card is now just a container to center the chart.
            // Its size remains the same as you wanted.
            <View key={index} style={styles.graphCard}>
              {/* This new wrapper holds the smaller chart and its title */}
              <View style={styles.chartWrapper}>
                <LineChart
                  data={dataForChart}
                  // FIX #2: Use the smaller dimensions for the chart.
                  width={CHART_WIDTH}
                  height={CHART_HEIGHT}
                  chartConfig={chartConfig}
                  bezier
                  withInnerLines={false}
                  style={styles.graphStyle} // This style now just adds the border radius
                  formatYLabel={(yValue) => formatLabel(parseFloat(yValue), isHighValue)}
                  decimalPlaces={isHighValue ? 0 : 1}
                  fromZero={false}
                />
                {/* FIX #3: The title is an overlay again, positioned relative to the smaller chart wrapper. */}
                <Text style={styles.chartTitleOverlay}>{chart.title}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  headerRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  // This is the full-size container card. It's transparent.
  // Its only job is to center its content.
  graphCard: {
    width: CARD_WIDTH,
    height: 250, // The fixed height of the card area
    marginRight: CARD_MARGIN,
    justifyContent: "center",
    alignItems: "center",
  },
  // This new View is smaller and holds the visible chart and title.
  chartWrapper: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    position: 'relative', // Context for the title overlay
  },
  // This style is applied to the LineChart itself.
  graphStyle: {
    borderRadius: 22,
  },
  // The title overlay is positioned within the smaller chartWrapper.
  chartTitleOverlay: {
    position: "absolute",
    top: 18,
    left: 18,
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});