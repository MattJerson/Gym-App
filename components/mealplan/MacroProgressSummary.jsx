import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

// A helper function to describe an SVG arc path
const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

// A helper function to convert polar coordinates to cartesian
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

// The Arc component that will be used for each macro
const Arc = ({ radius, progress, startAngle, totalAngle, color }) => {
  const angle = progress * totalAngle;
  // Prevent path from closing on itself at 100%
  const effectiveAngle = angle >= 359.99 ? 359.99 : angle;
  const path = describeArc(50, 50, radius, startAngle, startAngle + effectiveAngle);
  // Added circle endpoints
  const startPos = polarToCartesian(50, 50, radius, startAngle);
  const endPos = polarToCartesian(50, 50, radius, startAngle + effectiveAngle);

  return (
    <>
      <Path d={path} stroke={color} strokeWidth="8" fill="none" />
      <Circle cx={startPos.x} cy={startPos.y} r="4" fill={color} />
      <Circle cx={endPos.x} cy={endPos.y} r="4" fill={color} />
    </>
  );
};


export default function MacroProgressSummary({ macroGoals }) {
  const { calories, protein, carbs, fats } = macroGoals;

  const carbsProgress = Math.min(carbs.current / carbs.target, 1);
  const proteinProgress = Math.min(protein.current / protein.target, 1);
  const fatsProgress = Math.min(fats.current / fats.target, 1);
  const caloriesProgress = Math.min(calories.current / calories.target, 1);

  const ARC_GAP = 12; // Increased gap for a more defined look
  const ARC_SEGMENT_ANGLE = (360 - (3 * ARC_GAP)) / 3;

  const macroDetails = [
      {
          label: 'Carbs',
          ...carbs,
          progress: carbsProgress,
          color: '#ff9f43'
      },
      {
          label: 'Protein',
          ...protein,
          progress: proteinProgress,
          color: '#8e44ad'
      },
      {
          label: 'Fats',
          ...fats,
          progress: fatsProgress,
          color: '#1abc9c'
      },
  ];

  return (
    <View style={styles.card}>
      {/* Left Side: Progress Circle */}
      <View style={styles.circleContainer}>
        <Svg height="100%" width="100%" viewBox="0 0 100 100">
          {/* Background Circle */}
          <Circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          
          {/* Macro Arcs */}
          <Arc radius={45} progress={carbsProgress} startAngle={0} totalAngle={ARC_SEGMENT_ANGLE} color="#ff9f43" />
          <Arc radius={45} progress={proteinProgress} startAngle={ARC_SEGMENT_ANGLE + ARC_GAP} totalAngle={ARC_SEGMENT_ANGLE} color="#8e44ad" />
          <Arc radius={45} progress={fatsProgress} startAngle={(ARC_SEGMENT_ANGLE + ARC_GAP) * 2} totalAngle={ARC_SEGMENT_ANGLE} color="#1abc9c" />
        </Svg>
        <View style={styles.circleTextContainer}>
            <View style={styles.dayTag}>
                <Text style={styles.dayTagText}>Day 8</Text>
            </View>
            <Text style={styles.circlePercentage}>{Math.round(caloriesProgress * 100)}%</Text>
        </View>
      </View>

      {/* Right Side: Vertical Bars */}
      <View style={styles.detailsContainer}>
        {macroDetails.map(macro => (
            <View key={macro.label} style={styles.macroDetailItem}>
                <View style={styles.vProgressBar}>
                    <View style={[styles.vProgressFill, {height: `${macro.progress * 100}%`, backgroundColor: macro.color}]} />
                </View>
                <View style={styles.macroText}>
                    <Text style={styles.macroDetailLabel}>{macro.label}</Text>
                    <Text style={styles.macroDetailValue}>{macro.current}/{macro.target}g</Text>
                </View>
            </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: 25,    // Increased padding
        paddingHorizontal: 20,  // Increased padding
        borderRadius: 25,       // Increased border radius
        marginBottom: 25,       // Increased margin
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        flexDirection: 'row',
    },
    // --- LEFT SECTION ---
    circleContainer: {
        width: 190,            // Increased from 150
        height: 190,           // Increased from 150
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayTag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,      // Increased
        paddingHorizontal: 10, // Increased
        paddingVertical: 4,    // Increased
        marginTop: -15,
    },
    dayTagText: {
        color: '#ccc',
        fontSize: 10,          // Increased
        fontWeight: 'bold',
    },
    circlePercentage: {
        color: '#fff',
        fontSize: 50,          // Increased
        fontWeight: 'bold',
    },
    // --- RIGHT SECTION ---
    detailsContainer: {
      marginTop: 5,
        flex: 1,
        marginLeft: 30,        // Increased
        justifyContent: 'space-between',
    },
    macroDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Align items to the left
        marginBottom: 20,      // Increased spacing between items
    },
    macroText: {
        alignItems: 'flex-start', // Left align text
        marginLeft: 15,        // Space between bar and text
        width: 100,            // Fixed width for consistent alignment
    },
    macroDetailLabel: {
        color: '#ccc',
        fontSize: 12,          // Increased
        marginBottom: 6,       // Increased
    },
    macroDetailValue: {
        color: '#fff',
        fontSize: 15,          // Increased
        fontWeight: '600',
    },
    vProgressBar: {
        height: 45,            // Slightly reduced
        width: 6,             // Increased
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    vProgressFill: {
        width: '100%',
        borderRadius: 3,
    },
});