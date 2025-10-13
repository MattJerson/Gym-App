import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Custom hook for page transition animations
 * @param {string} direction - 'left', 'right', 'up', 'down'
 * @param {number} duration - Animation duration in ms (default: 300)
 * @returns {Object} - { opacity, translateX, animatedStyle }
 */
export const usePageTransition = (direction = 'left', duration = 300) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(direction === 'left' ? 50 : direction === 'right' ? -50 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animatedStyle = {
    opacity,
    transform: [{ translateX }],
  };

  return { opacity, translateX, animatedStyle };
};

/**
 * Get the animation direction based on tab order
 * Home(0) -> Calendar(1) -> Training(2) -> Mealplan(3) -> Profile(4)
 */
export const getAnimationDirection = (fromPage, toPage) => {
  const pageOrder = {
    home: 0,
    calendar: 1,
    training: 2,
    mealplan: 3,
    profile: 4,
  };

  const fromIndex = pageOrder[fromPage] ?? 0;
  const toIndex = pageOrder[toPage] ?? 0;

  return toIndex > fromIndex ? 'left' : 'right';
};
