import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
const steps = [
  { path: '/basicinfo', name: 'Basic Info' },
  { path: '/workoutplanning', name: 'Workout Plan' },
  { path: '/mealplan', name: 'Meal Plan' },
];

export default function RegistrationHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const handlePress = (path) => {
    router.replace(path);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {steps.map((step) => {
          const isActive = pathname === step.path;
          return (
            <Pressable
              key={step.path}
              style={styles.stepButton}
              onPress={() => handlePress(step.path)}
            >
              <Text style={[styles.stepText, isActive ? styles.activeText : styles.inactiveText]}>
                {step.name}
              </Text>
              <View style={[
                styles.activeIndicator, 
                { backgroundColor: isActive ? '#ff4d4d' : 'transparent' }
                ]} />
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: Dimensions.get('window').width * 0.94, 
    alignSelf: 'center',
    marginBottom: 20,

  },
  stepButton: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 5,
},
  inactiveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#cc3f3f',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeText: {
    color: '#ffffff',
  },
  inactiveText: {
    color: '#888',
  },
  activeIndicator: {
    height: 3,
    width: '60%',
    backgroundColor: '#ff4d4d',
    marginTop: 10,
    borderRadius: 2,
  },
});