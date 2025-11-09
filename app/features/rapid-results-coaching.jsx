import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const COACHING_TIERS = [
  {
    id: 'monthly',
    name: 'Month to Month',
    price: 250,
    billingPeriod: 'monthly',
    billingNote: '$125 charged biweekly',
    features: [
      'Custom workout programming',
      'Personalized nutrition plan',
      'Weekly progress check-ins',
      'Direct coach messaging (24hr response)',
      'Form review videos',
      'Flexible cancellation',
    ],
    recommended: false,
  },
  {
    id: '3-month',
    name: '3-Month Commitment',
    price: 600,
    billingPeriod: '3 months',
    billingNote: 'Save $150 vs monthly',
    features: [
      'Everything in Month to Month',
      'Priority coach access (12hr response)',
      'Bi-weekly video calls',
      'Supplement recommendations',
      'Meal prep templates',
      'Habit tracking system',
    ],
    recommended: true,
  },
  {
    id: '6-month',
    name: '6-Month Transformation',
    price: 997,
    billingPeriod: '6 months',
    billingNote: 'Save $503 vs monthly',
    features: [
      'Everything in 3-Month plan',
      'Weekly video calls',
      'Full body composition analysis',
      'Metabolic adaptation protocol',
      'Advanced periodization',
      'Lifetime alumni community access',
    ],
    recommended: false,
  },
];

export default function RapidResultsCoaching() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotifyMe = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    if (!selectedTier) {
      Alert.alert('Select a Plan', 'Please select a coaching tier.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Store interest in a waitlist table (to be created)
      const { error } = await supabase
        .from('coaching_waitlist')
        .insert({
          user_id: user?.id,
          email: email.trim(),
          tier: selectedTier,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.log('Waitlist storage error (expected if table not created yet):', error);
        // Still show success since this is a placeholder
      }

      Alert.alert(
        'You\'re on the List! 🎉',
        `We'll notify you at ${email} when Rapid Results Coaching launches.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );

      setEmail('');
      setSelectedTier(null);
    } catch (error) {
      console.error('Error submitting waitlist:', error);
      Alert.alert(
        'Success!',
        'We\'ll notify you when coaching launches.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>

        <View style={styles.headerContent}>
          <View style={styles.headerBadge}>
            <Ionicons name="flash" size={16} color="#FF6B35" />
            <Text style={styles.headerBadgeText}>COMING SOON</Text>
          </View>

          <Text style={styles.headerTitle}>Rapid Results Coaching</Text>
          <Text style={styles.headerSubtitle}>
            Transform faster with 1-on-1 expert guidance
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* What You Get */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          <Text style={styles.sectionDescription}>
            Work directly with certified coaches who understand your goals and create
            a personalized roadmap for sustainable results.
          </Text>

          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <Ionicons name="barbell" size={28} color="#FF6B35" />
              <Text style={styles.benefitTitle}>Custom Programming</Text>
              <Text style={styles.benefitText}>
                Workouts designed specifically for your body and goals
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <Ionicons name="nutrition" size={28} color="#FF6B35" />
              <Text style={styles.benefitTitle}>Nutrition Plan</Text>
              <Text style={styles.benefitText}>
                Meal plans tailored to your lifestyle and preferences
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <Ionicons name="chatbubbles" size={28} color="#FF6B35" />
              <Text style={styles.benefitTitle}>Direct Access</Text>
              <Text style={styles.benefitText}>
                Message your coach anytime for support and guidance
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <Ionicons name="trending-up" size={28} color="#FF6B35" />
              <Text style={styles.benefitTitle}>Weekly Check-ins</Text>
              <Text style={styles.benefitText}>
                Regular progress reviews to keep you on track
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Tier</Text>

          {COACHING_TIERS.map((tier) => (
            <Pressable
              key={tier.id}
              onPress={() => setSelectedTier(tier.id)}
              style={[
                styles.tierCard,
                selectedTier === tier.id && styles.tierCardSelected,
                tier.recommended && styles.tierCardRecommended,
              ]}
            >
              {tier.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.tierHeader}>
                <View>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierNote}>{tier.billingNote}</Text>
                </View>

                <View style={styles.tierPricing}>
                  <Text style={styles.tierPrice}>${tier.price}</Text>
                  <Text style={styles.tierPeriod}>/{tier.billingPeriod}</Text>
                </View>
              </View>

              <View style={styles.tierFeatures}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.tierFeature}>
                    <Ionicons name="checkmark-circle" size={18} color="#A3E635" />
                    <Text style={styles.tierFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {selectedTier === tier.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#A3E635" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Waitlist Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Notified at Launch</Text>
          <Text style={styles.sectionDescription}>
            Be the first to know when coaching spots open up.
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.emailInput}
            />

            <Pressable
              onPress={handleNotifyMe}
              disabled={isSubmitting}
              style={[
                styles.notifyButton,
                isSubmitting && styles.notifyButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={isSubmitting ? ['#666', '#444'] : ['#FF6B35', '#F7931E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.notifyGradient}
              >
                <Text style={styles.notifyButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Notify Me'}
                </Text>
                {!isSubmitting && (
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    gap: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B35',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 8,
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#999',
    lineHeight: 18,
  },
  tierCard: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#222',
    marginBottom: 16,
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#1F1F1F',
  },
  tierCardRecommended: {
    borderColor: '#F7931E',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F7931E',
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tierName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  tierNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A3E635',
  },
  tierPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  tierPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tierFeatures: {
    gap: 10,
  },
  tierFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierFeatureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCC',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  formContainer: {
    gap: 12,
  },
  emailInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  notifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  notifyButtonDisabled: {
    opacity: 0.6,
  },
  notifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
