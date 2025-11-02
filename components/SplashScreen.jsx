import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash screen visible while we load
SplashScreen.preventAutoHideAsync();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SplashScreenVideo({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Hide native splash once component mounts
    SplashScreen.hideAsync();
    
    // Auto-progress animation (simulate video duration)
    const duration = 3000; // 3 seconds
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress(currentStep / steps);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        onFinish();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onFinish]);

  const handleSkip = () => {
    onFinish();
  };

  return (
    <View style={styles.container}>
      {/* You can replace this with your logo image */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>BAB</Text>
        <Text style={styles.subText}>Fitness App</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
      
      {/* Skip Button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 10,
  },
  subText: {
    fontSize: 18,
    color: '#AAA',
    marginTop: 10,
    letterSpacing: 2,
  },
  progressBarContainer: {
    width: SCREEN_WIDTH * 0.6,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 100,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skipText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
