import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SkeletonLoader = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Preset skeleton components for common use cases
export const SkeletonCard = ({ height = 120, style }) => (
  <View style={[styles.card, { height }, style]}>
    <SkeletonLoader width="60%" height={20} style={{ marginBottom: 12 }} />
    <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="80%" height={16} />
  </View>
);

export const SkeletonCircle = ({ size = 50, style }) => (
  <SkeletonLoader width={size} height={size} borderRadius={size / 2} style={style} />
);

export const SkeletonText = ({ width = '100%', lines = 1, style }) => (
  <View style={style}>
    {[...Array(lines)].map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? '70%' : width}
        height={16}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);

export const SkeletonButton = ({ style }) => (
  <SkeletonLoader width="100%" height={56} borderRadius={16} style={style} />
);

export default SkeletonLoader;

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
