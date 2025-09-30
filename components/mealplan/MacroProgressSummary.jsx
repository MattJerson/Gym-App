import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

// Helper functions remain the same
const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const Arc = ({ radius, progress, startAngle, totalAngle, color }) => {
  const angle = progress * totalAngle;
  const effectiveAngle = angle >= 359.99 ? 359.99 : angle;
  const path = describeArc(50, 50, radius, startAngle, startAngle + effectiveAngle);
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

  const ARC_GAP = 12;
  const ARC_SEGMENT_ANGLE = (360 - (3 * ARC_GAP)) / 3;

  const macroDetails = [
    {
      label: 'Carbs',
      ...carbs,
      progress: carbsProgress,
      color: '#ff9f43',
      icon: '🍞'
    },
    {
      label: 'Protein',
      ...protein,
      progress: proteinProgress,
      color: '#8e44ad',
      icon: '🥩'
    },
    {
      label: 'Fats',
      ...fats,
      progress: fatsProgress,
      color: '#1abc9c',
      icon: '🥑'
    },
  ];

  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = currentDate.toLocaleDateString('en-US', { month: 'short' });

  return (
    <View style={styles.card}>
      {/* Subtle gradient overlay */}
      <View style={styles.gradientOverlay} />
      
      {/* Left Side: Progress Circle */}
      <View style={styles.circleSection}>
        <View style={styles.circleContainer}>
          <Svg height="100%" width="100%" viewBox="0 0 100 100">
            {/* Background Circle */}
            <Circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            
            {/* Macro Arcs */}
            <Arc radius={45} progress={carbsProgress} startAngle={0} totalAngle={ARC_SEGMENT_ANGLE} color="#ff9f43" />
            <Arc radius={45} progress={proteinProgress} startAngle={ARC_SEGMENT_ANGLE + ARC_GAP} totalAngle={ARC_SEGMENT_ANGLE} color="#8e44ad" />
            <Arc radius={45} progress={fatsProgress} startAngle={(ARC_SEGMENT_ANGLE + ARC_GAP) * 2} totalAngle={ARC_SEGMENT_ANGLE} color="#1abc9c" />
          </Svg>
          
          <View style={styles.circleTextContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{month}</Text>
              <Text style={styles.dayText}>{day}</Text>
            </View>
            <View style={styles.calorieInfo}>
              <Text style={styles.circlePercentage}>{Math.round(caloriesProgress * 100)}</Text>
              <Text style={styles.percentSymbol}>%</Text>
            </View>
            <Text style={styles.calorieLabel}>calories</Text>
          </View>
        </View>
      </View>

      {/* Right Side: Vertical Bars */}
      <View style={styles.detailsContainer}>
        {macroDetails.map((macro) => (
          <View key={macro.label} style={styles.macroDetailItem}>
            <View style={styles.barContainer}>
              <View style={styles.vProgressBar}>
                <View style={[
                  styles.vProgressFill, 
                  { 
                    height: `${macro.progress * 100}%`, 
                    backgroundColor: macro.color 
                  }
                ]}>
                  <View style={styles.barGlow} />
                </View>
              </View>
              {macro.progress >= 1 && (
                <View style={[styles.completeBadge, { backgroundColor: macro.color }]}>
                  <Text style={styles.completeBadgeText}>✓</Text>
                </View>
              )}
            </View>
            
            <View style={styles.macroText}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroIcon}>{macro.icon}</Text>
                <Text style={styles.macroDetailLabel}>{macro.label}</Text>
              </View>
              <Text style={styles.macroDetailValue}>
                {macro.current}<Text style={styles.macroTarget}>/{macro.target}g</Text>
              </Text>
              <View style={styles.miniBar}>
                <View style={[styles.miniBarFill, { width: `${macro.progress * 100}%`, backgroundColor: macro.color }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 25,
    backgroundColor: "rgba(20, 20, 25, 0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(142, 68, 173, 0.03)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  // --- LEFT SECTION ---
  circleSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '800',
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  circlePercentage: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -1,
  },
  percentSymbol: {
    color: '#888',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
    marginLeft: 1,
  },
  calorieLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // --- RIGHT SECTION ---
  detailsContainer: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  macroDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  vProgressBar: {
    height: 40,
    width: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  vProgressFill: {
    width: '100%',
    borderRadius: 3.5,
    position: 'relative',
    alignSelf: 'flex-end',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3.5,
  },
  completeBadge: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(20, 20, 25, 0.85)',
  },
  completeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  macroText: {
    flex: 1,
    marginLeft: 12,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  macroIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  macroDetailLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroDetailValue: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  macroTarget: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  miniBar: {
    width: '100%',
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1.25,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 1.25,
  },
});