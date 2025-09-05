import { Stack } from "expo-router";

export default function MealPlanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add-food" />
    </Stack>
  );
}
