import {
  Text,
  View,
  Alert,
  Animated,
  Keyboard,
  Platform,
  FlatList,
  StatusBar,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "../../services/supabase";
import { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useStripe } from "@stripe/stripe-react-native";
import HeaderBar from "../../components/onboarding/HeaderBar";
import ProgressBar from "../../components/onboarding/ProgressBar";
import SubscriptionCard from "../../components/subscription/SubscriptionCard";

// Get screen dimensions for card sizing
const { width, height } = Dimensions.get("window");
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 20;
const VISIBLE_CARDS = 1.05; // Show very slight peek
const CARD_WIDTH =
  (width - PADDING_HORIZONTAL * 2 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;

export default function SubscriptionPackages() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    try {
      // Check if user is coming from settings (upgrade flow)
      // If so, don't redirect them away - let them see upgrade options
      const isUpgradeFlow = router.canGoBack();
      
      if (!isUpgradeFlow) {
        // Only check for existing subscription during onboarding
        const userResp = await supabase.auth.getUser();
        const userId = userResp?.data?.user?.id;

        if (userId) {
          // Check for existing active subscription
          const { data: existingSubscription } = await supabase
            .from("user_subscriptions")
            .select("id, status, package_slug")
            .eq("user_id", userId)
            .eq("status", "active")
            .single();

          if (existingSubscription) {
            console.log("User already has active subscription, skipping to workout selection");
            router.replace("../features/selectworkouts");
            return;
          }
        }
      }

      // No subscription found or user wants to upgrade, load packages
      loadSubscriptions();
    } catch (err) {
      console.warn("Error checking existing subscription:", err);
      // Continue to load subscriptions even if check fails
      loadSubscriptions();
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("is_active", true) // Only show active packages
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error loading subscriptions:", error);
        // Use fallback data if DB query fails
        setSubscriptions(getFallbackSubscriptions());
      } else {
        // Filter out base-free (it's auto-assigned only, not purchasable)
        const filteredData = (data || []).filter(pkg => pkg.slug !== 'base-free');
        setSubscriptions(filteredData.length > 0 ? filteredData : getFallbackSubscriptions());
      }
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
      setSubscriptions(getFallbackSubscriptions());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackSubscriptions = () => [
    {
      slug: "free-trial",
      name: "7-Day Free Trial",
      price: 0,
      billing_interval: "one_time",
      features: [
        { text: "7 days unlimited access", included: true },
        { text: "Full feature access", included: true },
        { text: "Cancel anytime", included: true },
        { text: "Automatic downgrade to Base (Free) tier after trial", included: true },
        { text: "No credit card required", included: true },
        { text: "Basic workout plans", included: true },
        { text: "Basic meal plans", included: true },
        { text: "Progress tracking", included: true },
      ],
      badge: "7 DAYS FREE",
      emoji: "🎁",
      accent_color: "#00D4AA",
      is_popular: false,
    },
    {
      slug: "monthly",
      name: "Monthly",
      price: 27.99,
      billing_interval: "month",
      features: [
        { text: "Unlimited workout plans", included: true },
        { text: "Personalized meal plans", included: true },
        { text: "Activity & progress tracking", included: true },
        { text: "AI workout assistant", included: true },
        { text: "Custom nutrition analysis", included: true },
        { text: "Community access", included: true },
        { text: "Video exercise library", included: true },
        { text: "Daily motivation tips", included: true },
        { text: "Priority support", included: false },
        { text: "Early access to features", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Workout history export", included: false },
      ],
      emoji: "💪",
      accent_color: "#4A9EFF",
      is_popular: false,
    },
    {
      slug: "six-month",
      name: "6-Month Plan",
      price: 149.99,
      billing_interval: "six_month",
      features: [
        { text: "Everything in Monthly", included: true },
        { text: "Save $17.95 vs monthly", included: true },
        { text: "Priority email support", included: true },
        { text: "Early access to features", included: true },
        { text: "Advanced analytics dashboard", included: true },
        { text: "Workout history export", included: true },
        { text: "Custom workout builder", included: true },
        { text: "Macro tracking & planning", included: true },
        { text: "Integration with fitness devices", included: true },
        { text: "Monthly progress reports", included: true },
        { text: "VIP community badge", included: true },
      ],
      badge: "POPULAR",
      emoji: "🏆",
      accent_color: "#FFB800",
      is_popular: true,
    },
    {
      slug: "lifetime",
      name: "Lifetime",
      price: 149.99,
      billing_interval: "one_time",
      features: [
        { text: "Everything in Annual", included: true },
        { text: "Lifetime access forever", included: true },
        { text: "No recurring payments ever", included: true },
        { text: "VIP priority support 24/7", included: true },
        { text: "Exclusive beta features", included: true },
        { text: "Exclusive workout content", included: true },
        { text: "Personal trainer consultations", included: true },
        { text: "Nutrition coaching sessions", included: true },
        { text: "Lifetime update guarantee", included: true },
        { text: "VIP-only community access", included: true },
        { text: "Free merchandise & swag", included: true },
      ],
      badge: "ONE-TIME",
      emoji: "🚀",
      accent_color: "#FF4D4D",
      is_popular: false,
    },
  ];

  const lightHaptic = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBack = () => {
    lightHaptic();
    router.back();
  };

  const handleSubscribe = async (subscription) => {
    if (isProcessing) return;

    lightHaptic();
    setIsProcessing(true);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "Please log in to subscribe");
        setIsProcessing(false);
        return;
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from('registration_profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single();

      const userName = profile?.nickname || user.email?.split('@')[0] || 'User';

      // Handle free trial (no payment required)
      if (subscription.slug === 'free-trial' || subscription.price === 0) {
        console.log(`Activating free trial for: ${userName}`);
        await activateSubscription(user.id, subscription);
        return;
      }

      // Initialize Stripe payment sheet for paid subscriptions
      console.log(`Initializing Stripe payment for: ${subscription.name}`);
      
      // Call backend to create payment intent
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: subscription.slug,
          price: subscription.price,
          userId: user.id,
          userName: userName,
        }),
      });

      const { paymentIntent, ephemeralKey, customer, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Gym App',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: userName,
        },
      });

      if (initError) {
        console.error('Payment sheet init error:', initError);
        Alert.alert('Error', 'Failed to initialize payment');
        setIsProcessing(false);
        return;
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled
        console.log('Payment cancelled:', presentError);
        setIsProcessing(false);
        return;
      }

      // Payment successful! Activate subscription
      await activateSubscription(user.id, subscription);
    } catch (err) {
      console.error("Subscription error:", err);
      Alert.alert("Error", err.message || "An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const activateSubscription = async (userId, subscription) => {
    try {
      // Get the subscription package ID
      const { data: packageData, error: packageError } = await supabase
        .from("subscription_packages")
        .select("id")
        .eq("slug", subscription.slug)
        .single();

      if (packageError) {
        console.error("Error fetching package:", packageError);
        Alert.alert("Error", "Failed to fetch subscription package");
        setIsProcessing(false);
        return;
      }

      // Create subscription record
      const startDate = new Date();
      const endDate = new Date();
      
      // Calculate expiration based on billing interval
      if (subscription.billing_interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscription.billing_interval === 'six_month') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (subscription.billing_interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (subscription.billing_interval === 'one_time') {
        endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime
      }

      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (existingSubscription) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            package_id: packageData.id,
            started_at: startDate.toISOString(),
            expires_at: endDate.toISOString(),
          })
          .eq("id", existingSubscription.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
          Alert.alert("Error", "Failed to update subscription");
          setIsProcessing(false);
          return;
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: userId,
            package_id: packageData.id,
            status: "active",
            started_at: startDate.toISOString(),
            expires_at: endDate.toISOString(),
          });

        if (insertError) {
          console.error("Error creating subscription:", insertError);
          Alert.alert("Error", "Failed to create subscription");
          setIsProcessing(false);
          return;
        }
      }

      // Success!
      setIsProcessing(false);
      Alert.alert(
        "Success! 🎉",
        `You've been subscribed to ${subscription.name}!`,
        [
          {
            text: "Continue",
            onPress: () => {
              // Check if coming from settings (upgrade flow) or onboarding
              if (router.canGoBack()) {
                router.back(); // Go back to settings
              } else {
                router.replace("/features/selectworkouts"); // Continue onboarding
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("Activation error:", err);
      Alert.alert("Error", "Payment processed but failed to activate subscription. Please contact support.");
      setIsProcessing(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
        <LinearGradient colors={["#0B0B0B", "#1a1a1a"]} style={styles.gradient}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <SafeAreaView style={styles.safeArea}>
              <Animated.View
                style={[
                  styles.content,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <HeaderBar
                  title="Choose Your Plan"
                  currentStep={1}
                  totalSteps={1}
                  onBackPress={handleBack}
                  onHapticFeedback={lightHaptic}
                />

                <ProgressBar currentStep={1} totalSteps={1} />

                <Text style={styles.subtitle}>
                  Select the plan that works best for you
                </Text>

                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A9EFF" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={subscriptions}
                    renderItem={({ item }) => {
                      // Transform features from string array to object array
                      const transformedFeatures = Array.isArray(item.features)
                        ? item.features.map(feature => ({
                            text: typeof feature === 'string' ? feature : feature.text,
                            included: true
                          }))
                        : [];
                      
                      return (
                        <SubscriptionCard
                          name={item.name}
                          price={item.price}
                          interval={
                            item.billing_interval === "month"
                              ? "mo"
                              : item.billing_interval === "year"
                              ? "yr"
                              : null
                          }
                          features={transformedFeatures}
                          badge={item.badge}
                          isPopular={item.is_popular}
                          emoji={item.emoji}
                          accentColor={item.accent_color}
                          planType={item.plan_type}
                          slug={item.slug}
                          subtitle={item.subtitle}
                          description={item.description}
                          onPress={() => handleSubscribe(item)}
                          disabled={isProcessing}
                        />
                      );
                    }}
                    keyExtractor={(item, index) =>
                      item.slug || index.toString()
                    }
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContentContainer}
                    snapToInterval={CARD_WIDTH + CARD_MARGIN_RIGHT}
                    decelerationRate="fast"
                    snapToAlignment="start"
                  />
                )}
              </Animated.View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  listContentContainer: {
    paddingLeft: PADDING_HORIZONTAL,
    paddingRight: PADDING_HORIZONTAL * 2,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
});
