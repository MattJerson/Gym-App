import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash screen visible while we load
SplashScreen.preventAutoHideAsync();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SplashScreenVideo({ onFinish }) {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    // Hide native splash once component mounts
    SplashScreen.hideAsync();
  }, []);

  const handleVideoEnd = () => {
    onFinish();
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.stopAsync();
    }
    onFinish();
  };

  const handleLoad = () => {
    setIsVideoLoaded(true);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('../assets/BAB Logo Animation.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            handleVideoEnd();
          }
        }}
        onLoad={handleLoad}
      />
      
      {/* Skip Button */}
      {isVideoLoaded && (
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
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
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
