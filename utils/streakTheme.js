/**
 * Streak-Based Theme System
 * Provides progressive visual enhancements based on user's streak days
 * Milestones: 2, 4, 6, 8, 10, 15, 20, 30+ days
 */

export const getStreakTheme = (streakDays) => {
  if (streakDays >= 30) {
    // 30+ days: LEGENDARY (Purple/Gold Cosmic)
    return {
      level: 'legendary',
      name: '🔥 Legendary Streak',
      progressGradient: ['#FFD700', '#FF6B35', '#9333EA', '#EC4899'],
      progressGradientLocations: [0, 0.3, 0.7, 1],
      cardGradient: ['rgba(147, 51, 234, 0.15)', 'rgba(236, 72, 153, 0.15)'],
      glowColor: '#FFD700',
      glowIntensity: 20,
      borderColor: 'rgba(255, 215, 0, 0.4)',
      shimmerEffect: true,
      particleEffect: true,
      pulseAnimation: true,
      iconGlow: '#FFD700',
      textShadow: true
    };
  } else if (streakDays >= 20) {
    // 20-29 days: MASTER (Rainbow Gradient)
    return {
      level: 'master',
      name: '⚡ Master Streak',
      progressGradient: ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'],
      progressGradientLocations: [0, 0.33, 0.66, 1],
      cardGradient: ['rgba(139, 92, 246, 0.12)', 'rgba(59, 130, 246, 0.12)'],
      glowColor: '#8B5CF6',
      glowIntensity: 15,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      shimmerEffect: true,
      particleEffect: false,
      pulseAnimation: true,
      iconGlow: '#8B5CF6',
      textShadow: false
    };
  } else if (streakDays >= 15) {
    // 15-19 days: EXPERT (Blue/Purple)
    return {
      level: 'expert',
      name: '💎 Expert Streak',
      progressGradient: ['#3B82F6', '#8B5CF6', '#EC4899'],
      progressGradientLocations: [0, 0.5, 1],
      cardGradient: ['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)'],
      glowColor: '#3B82F6',
      glowIntensity: 12,
      borderColor: 'rgba(59, 130, 246, 0.3)',
      shimmerEffect: true,
      particleEffect: false,
      pulseAnimation: false,
      iconGlow: '#3B82F6',
      textShadow: false
    };
  } else if (streakDays >= 10) {
    // 10-14 days: ADVANCED (Cyan/Blue)
    return {
      level: 'advanced',
      name: '🌟 Advanced Streak',
      progressGradient: ['#06B6D4', '#3B82F6'],
      progressGradientLocations: [0, 1],
      cardGradient: ['rgba(6, 182, 212, 0.08)', 'rgba(59, 130, 246, 0.08)'],
      glowColor: '#06B6D4',
      glowIntensity: 10,
      borderColor: 'rgba(6, 182, 212, 0.25)',
      shimmerEffect: false,
      particleEffect: false,
      pulseAnimation: false,
      iconGlow: '#06B6D4',
      textShadow: false
    };
  } else if (streakDays >= 8) {
    // 8-9 days: COMMITTED (Teal gradient)
    return {
      level: 'committed',
      name: '✨ Committed Streak',
      progressGradient: ['#14B8A6', '#06B6D4'],
      progressGradientLocations: [0, 1],
      cardGradient: ['rgba(20, 184, 166, 0.06)', 'rgba(6, 182, 212, 0.06)'],
      glowColor: '#14B8A6',
      glowIntensity: 8,
      borderColor: 'rgba(20, 184, 166, 0.2)',
      shimmerEffect: false,
      particleEffect: false,
      pulseAnimation: false,
      iconGlow: null,
      textShadow: false
    };
  } else if (streakDays >= 6) {
    // 6-7 days: CONSISTENT (Green/Teal)
    return {
      level: 'consistent',
      name: '🔥 Consistent Streak',
      progressGradient: ['#10B981', '#14B8A6'],
      progressGradientLocations: [0, 1],
      cardGradient: ['rgba(16, 185, 129, 0.05)', 'rgba(20, 184, 166, 0.05)'],
      glowColor: '#10B981',
      glowIntensity: 6,
      borderColor: 'rgba(16, 185, 129, 0.15)',
      shimmerEffect: false,
      particleEffect: false,
      pulseAnimation: false,
      iconGlow: null,
      textShadow: false
    };
  } else if (streakDays >= 4) {
    // 4-5 days: BUILDING (Green)
    return {
      level: 'building',
      name: '💪 Building Streak',
      progressGradient: ['#22C55E', '#10B981'],
      progressGradientLocations: [0, 1],
      cardGradient: ['rgba(34, 197, 94, 0.04)', 'rgba(16, 185, 129, 0.04)'],
      glowColor: null,
      glowIntensity: 0,
      borderColor: 'rgba(34, 197, 94, 0.1)',
      shimmerEffect: false,
      particleEffect: false,
      pulseAnimation: false,
      iconGlow: null,
      textShadow: false
    };
  } else if (streakDays >= 2) {
    // 2-3 days: STARTING (Light Green)
    return {
      level: 'starting',
      name: '🌱 Starting Streak',
      progressGradient: ['#4ADE80', '#22C55E'],
      progressGradientLocations: [0, 1],
      cardGradient: ['rgba(74, 222, 128, 0.03)', 'rgba(34, 197, 94, 0.03)'],
      glowColor: null,
      glowIntensity: 0,
      borderColor: 'rgba(74, 222, 128, 0.08)',
      shimmerEffect: false,
      particleEffect: false,
      pulseAnimation: false,
      iconGlow: null,
      textShadow: false
    };
  } else {
    // 0-1 days: DEFAULT (Original Orange)
    return {
      level: 'default',
      name: null,
      progressGradient: ['#F7971E', '#FFD200'],
      progressGradientLocations: [0, 1],
      cardGradient: null,
      glowColor: null,
      glowIntensity: 0,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shimmerEffect: false,
      particleEffect: false,
      pulseAnimation: false,
      iconGlow: null,
      textShadow: false
    };
  }
};

// Animation configurations for each level
export const getStreakAnimations = (streakDays) => {
  const theme = getStreakTheme(streakDays);
  
  return {
    shimmer: theme.shimmerEffect ? {
      duration: 2000,
      repeatCount: -1, // infinite
      colors: theme.progressGradient
    } : null,
    
    pulse: theme.pulseAnimation ? {
      duration: 1500,
      repeatCount: -1,
      scaleFrom: 1,
      scaleTo: 1.05,
      opacityFrom: 1,
      opacityTo: 0.8
    } : null,
    
    glow: theme.glowColor ? {
      color: theme.glowColor,
      intensity: theme.glowIntensity,
      shadowRadius: theme.glowIntensity * 2
    } : null
  };
};

// Get encouragement message based on streak
export const getStreakMessage = (streakDays) => {
  if (streakDays >= 30) return "You're unstoppable! 🔥";
  if (streakDays >= 20) return "Mastering consistency! ⚡";
  if (streakDays >= 15) return "Expert dedication! 💎";
  if (streakDays >= 10) return "You're on fire! 🌟";
  if (streakDays >= 8) return "Strong commitment! ✨";
  if (streakDays >= 6) return "Building momentum! 🔥";
  if (streakDays >= 4) return "Great progress! 💪";
  if (streakDays >= 2) return "Keep it going! 🌱";
  return "Start your streak! 💫";
};
