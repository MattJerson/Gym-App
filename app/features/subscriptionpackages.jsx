import {
  Text,
  View,
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from '../../services/supabase';
import { LinearGradient } from "expo-linear-gradient";
import { useStripe } from "@stripe/stripe-react-native";
import * as Haptics from 'expo-haptics';
import { getNextOnboardingStep } from "../../utils/onboardingFlow";
import HeaderBar from "../../components/onboarding/HeaderBar";
import ProgressBar from "../../components/onboarding/ProgressBar";
import SubscriptionCard from "../../components/subscription/SubscriptionCard";

// Get screen dimensions for card sizing
const { width, height } = Dimensions.get("window");
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 20;
const VISIBLE_CARDS = 1.05; // Show very slight peek
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;

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

    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading subscriptions:', error);
        // Use fallback data if DB query fails
        setSubscriptions(getFallbackSubscriptions());
      } else {
        setSubscriptions(data || getFallbackSubscriptions());
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setSubscriptions(getFallbackSubscriptions());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackSubscriptions = () => [
    {
      slug: 'free-trial',
      name: 'Free Trial',
      price: 0,
      billing_interval: 'one_time',
      features: [
        { text: '7 days unlimited access', included: true },
        { text: 'Basic workout plans', included: true },
        { text: 'Basic meal plans', included: true },
        { text: 'Activity tracking', included: true },
        { text: 'Progress photos', included: true },
        { text: 'AI workout assistant', included: false },
        { text: 'Custom nutrition plans', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Priority support', included: false },
        { text: 'Workout history export', included: false },
      ],
      badge: 'TRY FREE',
      emoji: '🎁',
      accent_color: '#00D4AA',
      is_popular: false,
    },
    {
      slug: 'monthly',
      name: 'Monthly',
      price: 9.99,
      billing_interval: 'month',
      features: [
        { text: 'Unlimited workout plans', included: true },
        { text: 'Personalized meal plans', included: true },
        { text: 'Activity & progress tracking', included: true },
        { text: 'AI workout assistant', included: true },
        { text: 'Custom nutrition analysis', included: true },
        { text: 'Community access', included: true },
        { text: 'Video exercise library', included: true },
        { text: 'Daily motivation tips', included: true },
        { text: 'Priority support', included: false },
        { text: 'Early access to features', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Workout history export', included: false },
      ],
      emoji: '💪',
      accent_color: '#4A9EFF',
      is_popular: false,
    },
    {
      slug: 'annual',
      name: 'Annual',
      price: 79.99,
      billing_interval: 'year',
      features: [
        { text: 'Everything in Monthly', included: true },
        { text: 'Save 33% vs Monthly plan', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Early access to features', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Workout history export', included: true },
        { text: 'Custom workout builder', included: true },
        { text: 'Macro tracking & planning', included: true },
        { text: 'Integration with fitness devices', included: true },
        { text: 'Monthly progress reports', included: true },
        { text: 'VIP community badge', included: true },
      ],
      badge: 'BEST VALUE',
      emoji: '🏆',
      accent_color: '#FFB800',
      is_popular: true,
    },
    {
      slug: 'lifetime',
      name: 'Lifetime',
      price: 149.99,
      billing_interval: 'one_time',
      features: [
        { text: 'Everything in Annual', included: true },
        { text: 'Lifetime access forever', included: true },
        { text: 'No recurring payments ever', included: true },
        { text: 'VIP priority support 24/7', included: true },
        { text: 'Exclusive beta features', included: true },
        { text: 'Exclusive workout content', included: true },
        { text: 'Personal trainer consultations', included: true },
        { text: 'Nutrition coaching sessions', included: true },
        { text: 'Lifetime update guarantee', included: true },
        { text: 'VIP-only community access', included: true },
        { text: 'Free merchandise & swag', included: true },
      ],
      badge: 'ONE-TIME',
      emoji: '🚀',
      accent_color: '#FF4D4D',
      is_popular: false,
    },
  ];

  const lightHaptic = () => {
    if (Platform.OS === 'ios') {
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Please log in to subscribe');
        setIsProcessing(false);
        return;
      }

      // Free trial - no payment needed
      if (subscription.price === 0 || subscription.slug === 'free-trial') {
        console.log('Starting free trial...');
        console.log('User ID:', user.id);
        console.log('Subscription slug:', subscription.slug);
        
        // Check if user already has an active subscription
        const { data: existingSub, error: checkError } = await supabase
          .from('user_subscriptions')
          .select('id, status, expires_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing subscription:', checkError);
        }

        console.log('Existing active subscription:', existingSub);

        // If user already has an active subscription, skip creation
        if (existingSub) {
          console.log('User already has active subscription, skipping creation');
          const nextStep = await getNextOnboardingStep('subscriptionpackages', user.id);
          console.log('Next onboarding step:', nextStep);
          router.replace(nextStep);
          return;
        }
        
        // Get the subscription package ID
        const { data: packageData, error: packageError } = await supabase
          .from('subscription_packages')
          .select('id')
          .eq('slug', subscription.slug)
          .single();

        if (packageError) {
          console.error('Error fetching package:', packageError);
          Alert.alert('Error', 'Failed to start free trial');
          setIsProcessing(false);
          return;
        }

        console.log('Package data:', packageData);

        // Create free trial subscription in database
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // 7-day free trial

        console.log('Creating new subscription...');

        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            package_id: packageData.id,
            status: 'active',
            started_at: startDate.toISOString(),
            expires_at: endDate.toISOString()
          })
          .select()
          .single();

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          Alert.alert('Error', 'Failed to create subscription');
          setIsProcessing(false);
          return;
        }

        console.log('Free trial created successfully!', subscriptionData);
        
        // Determine next step dynamically
        const nextStep = await getNextOnboardingStep('subscriptionpackages', user.id);
        console.log('Next onboarding step:', nextStep);
        router.replace(nextStep);
        return;
      }

      // Paid subscription - initiate payment
      const response = await fetch(
        "http://192.168.0.101:3000/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            plan: subscription.name,
            price: subscription.price,
            interval: subscription.billing_interval,
          }),
        }
      );

      if (!response.ok) {
        console.error("Backend returned error:", response.statusText);
        return;
      }

      const { paymentIntent, ephemeralKey, customer } = await response.json();

      if (!paymentIntent || !ephemeralKey || !customer) {
        console.error("Backend response missing required fields");
        return;
      }

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Gym App",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        console.error("PaymentSheet initialization failed:", initError);
        return;
      }

      // Present the Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        console.error("Payment failed:", paymentError);
      } else {
        console.log("Payment successful ✅");
        router.push("/page/home");
      }
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
        <LinearGradient
          colors={["#0B0B0B", "#1a1a1a"]}
          style={styles.gradient}
        >
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
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <HeaderBar
                  title="Choose Your Plan"
                  currentStep={1}
                  totalSteps={1}
                  onBackPress={handleBack}
                  onHapticFeedback={lightHaptic}
                />

                <ProgressBar
                  currentStep={1}
                  totalSteps={1}
                />

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
                    renderItem={({ item }) => (
                      <SubscriptionCard
                        name={item.name}
                        price={item.price}
                        interval={item.billing_interval === 'month' ? 'mo' : 
                                 item.billing_interval === 'year' ? 'yr' : null}
                        features={item.features || []}
                        badge={item.badge}
                        isPopular={item.is_popular}
                        emoji={item.emoji}
                        accentColor={item.accent_color}
                        onPress={() => handleSubscribe(item)}
                        disabled={isProcessing}
                      />
                    )}
                    keyExtractor={(item, index) => item.slug || index.toString()}
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
    paddingHorizontal: 20,
    textAlign: "center",
  },
  listContentContainer: {
    paddingLeft: PADDING_HORIZONTAL,
    paddingRight: PADDING_HORIZONTAL * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
});
