import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Animated Shimmer Effect for Streak Progress Bars
 */
export const ShimmerGradient = ({ colors, locations, style, children, enabled = true }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [enabled]);

  if (!enabled) {
    return (
      <LinearGradient
        colors={colors}
        locations={locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={style}
      >
        {children}
      </LinearGradient>
    );
  }

  const animatedOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.7, 1],
  });

  return (
    <Animated.View style={[style, { opacity: animatedOpacity }]}>
      <LinearGradient
        colors={colors}
        locations={locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );
};

/**
 * Pulsing Glow Effect for Cards
 */
export const PulseGlow = ({ children, enabled = true, glowColor, intensity = 10, style }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  const animatedScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const animatedOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: animatedScale }],
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: animatedOpacity,
          shadowRadius: intensity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Floating Particle Effect (for legendary streaks)
 */
export const FloatingParticles = ({ enabled = true, color = '#FFD700' }) => {
  const particles = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!enabled) return;

    const animations = particles.map((particle, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.timing(particle, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((anim) => anim.start());

    return () => animations.forEach((anim) => anim.stop());
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {particles.map((particle, index) => {
        const translateY = particle.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100],
        });

        const opacity = particle.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });

        const positions = [
          { left: '10%' },
          { left: '30%' },
          { left: '50%' },
          { left: '70%' },
          { left: '20%' },
          { left: '80%' },
        ];

        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              bottom: 0,
              ...positions[index],
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: color,
              opacity,
              transform: [{ translateY }],
            }}
          />
        );
      })}
    </>
  );
};

/**
 * Icon Glow Effect
 */
export const IconGlow = ({ children, enabled = true, glowColor, style }) => {
  if (!enabled || !glowColor) {
    return <>{children}</>;
  }

  return (
    <Animated.View
      style={[
        style,
        {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
