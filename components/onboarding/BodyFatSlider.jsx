import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";

export default function BodyFatSlider({
  value,
  onChange,
  minimumValue = 3,
  maximumValue = 40,
  minimumTrackTintColor = "#4A9EFF",
  maximumTrackTintColor = "rgba(255, 255, 255, 0.15)",
  thumbTintColor = "#4A9EFF",
  label = "Body Fat Percentage",
  categoryColor,
}) {
  const getCategoryText = (bodyFatPercentage) => {
    if (bodyFatPercentage >= 25) return "Higher";
    if (bodyFatPercentage >= 18) return "Moderate";
    if (bodyFatPercentage >= 12) return "Healthy";
    return "Athletic";
  };

  return (
    <View style={styles.sliderSection}>
      <View style={styles.valueDisplay}>
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>
            {Math.round(value)}%
          </Text>
          <View style={[
            styles.categoryBadge,
            categoryColor && { 
              backgroundColor: `${categoryColor}15`,
              borderColor: `${categoryColor}30`
            }
          ]}>
            <Text style={styles.categoryText}>
              {getCategoryText(value)}
            </Text>
          </View>
        </View>
        <Text style={styles.valueLabel}>{label}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={minimumTrackTintColor}
        maximumTrackTintColor={maximumTrackTintColor}
        thumbTintColor={thumbTintColor}
        thumbStyle={styles.sliderThumb}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>{minimumValue}%</Text>
        <Text style={styles.sliderLabelText}>{maximumValue}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  valueDisplay: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 6,
  },
  valueText: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1.5,
  },
  valueLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: "rgba(74, 158, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 158, 255, 0.3)",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  slider: {
    width: "100%",
    height: 50,
    marginBottom: 8,
  },
  sliderLabels: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  sliderLabelText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
  },
  sliderThumb: {
    width: 32,
    height: 32,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
