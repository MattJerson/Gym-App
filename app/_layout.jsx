import { Stack } from 'expo-router';

  export default function Layout() {
    return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="basicinfo" options={{ headerShown: false }} />
        <Stack.Screen name="workoutplanning" options={{ headerShown: false }} />
        <Stack.Screen name="mealplan" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
      </Stack>
    );
  }