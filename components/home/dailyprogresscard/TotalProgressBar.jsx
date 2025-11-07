import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getStreakTheme } from "../../../utils/streakTheme";
import { ShimmerGradient, PulseGlow, FloatingParticles } from "../../effects/StreakEffects";

export default function TotalProgressBar({ totalProgress, currentStreak = 0 }) {
  const isCompleted = totalProgress >= 100;
  const streakTheme = getStreakTheme(currentStreak);
  
  return (
    <PulseGlow 
      enabled={streakTheme.pulseAnimation} 
      glowColor={streakTheme.glowColor}
      intensity={streakTheme.glowIntensity}
      style={styles.totalProgressWrapper}
    >
      <View>
        <View style={styles.progressHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.totalProgressText}>
              Daily Progress
            </Text>
            {streakTheme.name && (
              <Text style={[styles.streakBadge, { color: streakTheme.progressGradient[0] }]}>
                {streakTheme.name}
              </Text>
            )}
          </View>
          <Text style={[
            styles.progressPercentage, 
            isCompleted && styles.completedPercentage,
            streakTheme.textShadow && { 
              textShadowColor: streakTheme.glowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10
            }
          ]}>
            {Math.round(totalProgress)}%
          </Text>
        </View>
        
        <View style={[
          styles.totalProgressContainer,
          streakTheme.borderColor && { borderColor: streakTheme.borderColor, borderWidth: 1 }
        ]}>
          <ShimmerGradient
            colors={streakTheme.progressGradient}
            locations={streakTheme.progressGradientLocations}
            enabled={streakTheme.shimmerEffect}
            style={[styles.totalProgressBar, { width: `${Math.min(totalProgress, 100)}%` }]}
          />
          
          {/* Progress indicator dot */}
          {totalProgress > 5 && (
            <View style={[
              styles.progressDot, 
              { 
                left: `${Math.min(totalProgress, 95)}%`,
                backgroundColor: streakTheme.level !== 'default' ? streakTheme.progressGradient[0] : '#fff'
              }
            ]} />
          )}
          
          {/* Floating particles for legendary streaks */}
          <FloatingParticles enabled={streakTheme.particleEffect} color={streakTheme.glowColor} />
        </View>
      </View>
    </PulseGlow>
  );
}

const styles = StyleSheet.create({
  totalProgressWrapper: { 
    marginBottom: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  totalProgressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  streakBadge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#74b9ff",
  },
  completedPercentage: {
    color: "#00D4AA",
  },
  totalProgressContainer: {
    width: "100%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
  },
  totalProgressBar: { 
    height: "100%", 
    borderRadius: 8,
  },
  progressDot: {
    position: "absolute",
    top: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});
