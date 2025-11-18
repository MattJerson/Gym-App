import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { getStreakTheme } from "../../utils/streakTheme";
import { PulseGlow } from "../effects/StreakEffects";
import { supabase } from "../../services/supabase";

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

export default function MacroProgressSummary({ macroGoals, selectedDate, activePlan }) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userId, setUserId] = useState(null);

  // Load user and streak data
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadStreakData();
    }
  }, [userId]);

  const loadStreakData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCurrentStreak(data.current_streak || 0);
      }
    } catch (error) {
      console.error("Error loading streak data:", error);
    }
  };

  // Get streak theme for container enhancement
  const streakTheme = getStreakTheme(currentStreak);

  // Use targets directly from macroGoals prop (already fetched by parent with correct view)
  const targets = {
    calories: macroGoals?.calories?.target || 2200,
    protein: macroGoals?.protein?.target || 140,
    carbs: macroGoals?.carbs?.target || 200,
    fats: macroGoals?.fats?.target || 85,
  };
  
  // Determine plan type color
  const getPlanColor = (planType) => {
    const colors = {
      'weight_loss': '#00D4AA',
      'bulking': '#FF6B35',
      'cutting': '#007AFF',
      'maintenance': '#FFB300',
      'keto': '#8E44AD',
      'vegan': '#4CAF50',
    };
    return colors[planType] || '#00D4AA';
  };
  
  const planColor = activePlan ? getPlanColor(activePlan.plan_type) : '#00D4AA';
  const { calories, protein, carbs, fats } = macroGoals;

  // Helper to get text color based on progress
  // White if under or slightly over, red if 20%+ over
  const getTextColor = (current, target) => {
    const percentOver = ((current - target) / target) * 100;
    if (percentOver >= 20) return '#FF3B30'; // Red if 20%+ over
    return '#fff'; // White otherwise
  };

  // Helper to check if significantly over (20%+)
  const isSignificantlyOver = (current, target) => {
    const percentOver = ((current - target) / target) * 100;
    return percentOver >= 20;
  };

  const carbsProgress = Math.min(carbs.current / targets.carbs, 1);
  const proteinProgress = Math.min(protein.current / targets.protein, 1);
  const fatsProgress = Math.min(fats.current / targets.fats, 1);
  const caloriesProgress = Math.min(calories.current / targets.calories, 1);

  const ARC_GAP = 12;
  const ARC_SEGMENT_ANGLE = (360 - (3 * ARC_GAP)) / 3;

  const macroDetails = [
    {
      label: 'Carbs',
      current: carbs.current,
      target: targets.carbs,
      progress: carbsProgress,
      color: '#ff9f43', // Always use base color for progress bar
      baseColor: '#ff9f43',
      icon: '🍞',
      unit: carbs.unit,
      textColor: getTextColor(carbs.current, targets.carbs),
      isSignificantlyOver: isSignificantlyOver(carbs.current, targets.carbs)
    },
    {
      label: 'Protein',
      current: protein.current,
      target: targets.protein,
      progress: proteinProgress,
      color: '#8e44ad',
      baseColor: '#8e44ad',
      icon: '🥩',
      unit: protein.unit,
      textColor: getTextColor(protein.current, targets.protein),
      isSignificantlyOver: isSignificantlyOver(protein.current, targets.protein)
    },
    {
      label: 'Fats',
      current: fats.current,
      target: targets.fats,
      progress: fatsProgress,
      color: '#1abc9c',
      baseColor: '#1abc9c',
      icon: '🥑',
      unit: fats.unit,
      textColor: getTextColor(fats.current, targets.fats),
      isSignificantlyOver: isSignificantlyOver(fats.current, targets.fats)
    },
  ];

  // Use selectedDate prop or default to today
  const displayDate = selectedDate || new Date();
  const currentDate = new Date();
  const isToday = displayDate.toDateString() === currentDate.toDateString();
  
  const day = String(displayDate.getDate()).padStart(2, '0');
  const month = displayDate.toLocaleDateString('en-US', { month: 'short' });
  const fullDate = displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Check if all macros are completed
  const allMacrosComplete = carbsProgress >= 1 && proteinProgress >= 1 && fatsProgress >= 1;

  return (
    <View style={styles.outerContainer}>
      {/* Macro Progress Card with Streak Enhancement */}
      <PulseGlow 
        enabled={streakTheme.pulseAnimation} 
        glowColor={streakTheme.glowColor}
        intensity={streakTheme.glowIntensity}
      >
        <View style={[
          styles.card,
          streakTheme.cardGradient && { backgroundColor: 'transparent' },
          streakTheme.borderColor && { 
            borderColor: streakTheme.borderColor,
            borderWidth: 1.5,
            shadowColor: streakTheme.glowColor || 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: streakTheme.glowIntensity ? 0.3 : 0,
            shadowRadius: streakTheme.glowIntensity || 0,
            elevation: streakTheme.glowIntensity ? 8 : 0,
          }
        ]}>
          {/* Enhanced gradient overlay with streak theming */}
          <View style={[
            styles.gradientOverlay,
            streakTheme.cardGradient && {
              backgroundColor: 'transparent',
              background: `linear-gradient(135deg, ${streakTheme.cardGradient[0]}, ${streakTheme.cardGradient[1]})`
            }
          ]} />
      
      {/* Left Side: Progress Circle */}
      <View style={styles.circleSection}>
        <View style={styles.circleContainer}>
          <Svg height="100%" width="100%" viewBox="0 0 100 100">
            {/* Background Circle */}
            <Circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            
            {/* Macro Arcs */}
            <Arc radius={45} progress={carbsProgress} startAngle={0} totalAngle={ARC_SEGMENT_ANGLE} color={macroDetails[0].color} />
            <Arc radius={45} progress={proteinProgress} startAngle={ARC_SEGMENT_ANGLE + ARC_GAP} totalAngle={ARC_SEGMENT_ANGLE} color={macroDetails[1].color} />
            <Arc radius={45} progress={fatsProgress} startAngle={(ARC_SEGMENT_ANGLE + ARC_GAP) * 2} totalAngle={ARC_SEGMENT_ANGLE} color={macroDetails[2].color} />
          </Svg>
          
          <View style={styles.circleTextContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{month}</Text>
              <Text style={styles.dayText}>{day}</Text>
            </View>
            <View style={styles.calorieInfo}>
              <Text style={[
                styles.circlePercentage,
                { color: getTextColor(calories.current, targets.calories) }
              ]}>{Math.round(caloriesProgress * 100)}</Text>
              <Text style={styles.percentSymbol}>%</Text>
            </View>
            <Text style={styles.calorieLabel}>
              {Math.round(calories.current)}/{targets.calories} cal
            </Text>
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
                <View style={[styles.completeBadge, { backgroundColor: macro.isSignificantlyOver ? '#FF3B30' : macro.baseColor }]}>
                  <Text style={styles.completeBadgeText}>{macro.isSignificantlyOver ? '!' : '✓'}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.macroText}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroIcon}>{macro.icon}</Text>
                <Text style={styles.macroDetailLabel}>{macro.label}</Text>
              </View>
              <Text style={[styles.macroDetailValue, { color: macro.textColor }]}>
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
      </PulseGlow>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 20,
  },
  card: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(142, 68, 173, 0.02)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  // --- LEFT SECTION ---
  circleSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    width: 160,
    height: 160,
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
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -1,
  },
  percentSymbol: {
    color: '#888',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
    marginLeft: 1,
  },
  calorieLabel: {
    color: '#666',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // --- RIGHT SECTION ---
  detailsContainer: {
    flex: 1,
    marginLeft: 18,
    justifyContent: 'space-between',
    paddingVertical: 0,
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
    height: 28,
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  vProgressFill: {
    width: '100%',
    borderRadius: 2.5,
    position: 'relative',
    alignSelf: 'flex-end',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  completeBadge: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(20, 20, 25, 0.85)',
  },
  completeBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '900',
  },
  macroText: {
    flex: 1,
    marginLeft: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  macroIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  macroDetailLabel: {
    color: '#aaa',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroDetailValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  macroTarget: {
    color: '#666',
    fontSize: 9,
    fontWeight: '600',
  },
  miniBar: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 1.25,
  },
});