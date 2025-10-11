import { Stack } from "expo-router";

export default function TrainingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="workouts" />
      <Stack.Screen name="workout-category" />
      <Stack.Screen name="workout-detail" />
      <Stack.Screen name="create-workout" />
    </Stack>
  );
}
