import { Stack } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";

export default function Layout() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_API_KEY}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
      />
    </StripeProvider>
  );
}
