import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 20;
const VISIBLE_CARDS = 1.05;
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;
const CARD_HEIGHT = height * 0.75;

export default function SubscriptionCard({
  name,
  price,
  interval,
  features = [],
  badge,
  isPopular,
  emoji,
  accentColor = '#4A9EFF',
  onPress,
  disabled = false,
}) {
  const includedFeatures = features.filter(f => f.included);
  const notIncludedFeatures = features.filter(f => !f.included);

  // Calculate monthly price for annual plans
  const monthlyEquivalent = interval === 'yr' ? (price / 12).toFixed(2) : null;

  // Define unique color schemes per plan
  const getColorScheme = () => {
    const planName = name.toLowerCase();
    
    if (planName.includes('free') || planName.includes('trial')) {
      return {
        gradient1: ['rgba(0, 212, 170, 0.15)', 'transparent', 'rgba(26, 188, 156, 0.1)'],
        gradient2: ['transparent', 'rgba(0, 212, 170, 0.08)', 'transparent'],
        accentColor: '#00D4AA',
        secondaryColor: '#1abc9c',
        textGradient: ['#00D4AA', '#1abc9c'],
        ctaGradient: ['#00D4AA', '#1abc9c', '#16a085'],
        glowColor: ['rgba(0, 212, 170, 0.4)', 'rgba(26, 188, 156, 0.4)', 'rgba(22, 160, 133, 0.4)'],
      };
    } else if (planName.includes('monthly')) {
      return {
        gradient1: ['rgba(74, 158, 255, 0.15)', 'transparent', 'rgba(52, 152, 219, 0.1)'],
        gradient2: ['transparent', 'rgba(41, 128, 185, 0.08)', 'transparent'],
        accentColor: '#4A9EFF',
        secondaryColor: '#3498db',
        textGradient: ['#4A9EFF', '#3498db'],
        ctaGradient: ['#4A9EFF', '#3498db', '#2980b9'],
        glowColor: ['rgba(74, 158, 255, 0.4)', 'rgba(52, 152, 219, 0.4)', 'rgba(41, 128, 185, 0.4)'],
      };
    } else if (planName.includes('annual') || planName.includes('year')) {
      return {
        gradient1: ['rgba(255, 184, 0, 0.15)', 'transparent', 'rgba(243, 156, 18, 0.1)'],
        gradient2: ['transparent', 'rgba(255, 184, 0, 0.08)', 'transparent'],
        accentColor: '#FFB800',
        secondaryColor: '#f39c12',
        textGradient: ['#FFB800', '#f39c12'],
        ctaGradient: ['#FFB800', '#f39c12', '#e67e22'],
        glowColor: ['rgba(255, 184, 0, 0.4)', 'rgba(243, 156, 18, 0.4)', 'rgba(230, 126, 34, 0.4)'],
      };
    } else if (planName.includes('lifetime')) {
      return {
        gradient1: ['rgba(231, 76, 60, 0.15)', 'transparent', 'rgba(192, 57, 43, 0.1)'],
        gradient2: ['transparent', 'rgba(155, 89, 182, 0.1)', 'transparent'],
        accentColor: '#e74c3c',
        secondaryColor: '#c0392b',
        textGradient: ['#e74c3c', '#9b59b6'],
        ctaGradient: ['#e74c3c', '#9b59b6', '#8e44ad'],
        glowColor: ['rgba(231, 76, 60, 0.4)', 'rgba(155, 89, 182, 0.4)', 'rgba(142, 68, 173, 0.4)'],
      };
    }
    
    // Default fallback
    return {
      gradient1: ['rgba(74, 158, 255, 0.15)', 'transparent', 'rgba(155, 89, 182, 0.1)'],
      gradient2: ['transparent', 'rgba(255, 184, 0, 0.08)', 'transparent'],
      accentColor: accentColor,
      secondaryColor: accentColor,
      textGradient: ['#4A9EFF', '#9b59b6'],
      ctaGradient: ['#4A9EFF', '#9b59b6', '#FFB800'],
      glowColor: ['rgba(74, 158, 255, 0.4)', 'rgba(155, 89, 182, 0.4)', 'rgba(255, 184, 0, 0.4)'],
    };
  };

  const colors = getColorScheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: CARD_WIDTH },
        isPopular && styles.popularCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {/* Background gradients - unique per plan */}
      <LinearGradient
        colors={colors.gradient1}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg1}
      />
      <LinearGradient
        colors={colors.gradient2}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBg2}
      />

      <View style={styles.cardInner}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Plan Name with Gradient Text Effect */}
          <View style={styles.planNameContainer}>
            <LinearGradient
              colors={colors.textGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTextBg}
            >
              <Text style={styles.planName}>{name}</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.subtitle}>Join thousands of premium members today</Text>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            {price === 0 ? (
              <Text style={styles.freeText}>Free</Text>
            ) : (
              <>
                <LinearGradient
                  colors={colors.textGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.priceGradient}
                >
                  <Text style={styles.price}>
                    ${monthlyEquivalent || price.toFixed(2)}
                  </Text>
                </LinearGradient>
                <Text style={styles.interval}>/month</Text>
              </>
            )}
          </View>

          {/* Premium Badge */}
          {badge && (
            <View style={[styles.premiumBadge, { backgroundColor: `${colors.accentColor}20`, borderColor: `${colors.accentColor}50` }]}>
              <Ionicons name="crown" size={16} color={colors.accentColor} />
              <Text style={[styles.premiumBadgeText, { color: colors.accentColor }]}>
                {badge}
              </Text>
            </View>
          )}
        </View>

        {/* Features Section with Glassmorphism - Compact */}
        <View style={styles.featuresCard}>
          <LinearGradient
            colors={[
              'rgba(51, 51, 51, 0.9)',
              `${colors.accentColor}20`,
              'rgba(51, 51, 51, 0.9)'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuresGradient}
          >
            {/* Features Header */}
            <View style={styles.featuresHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.accentColor} />
              <Text style={styles.featuresHeaderText}>Premium Benefits</Text>
            </View>

            {/* Scrollable Features - Show first 4 only */}
            <View style={styles.featuresContainer}>
              {includedFeatures.slice(0, 4).map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <LinearGradient
                    colors={[`${colors.accentColor}30`, `${colors.secondaryColor}30`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureIconGradient}
                  >
                    <Ionicons 
                      name="checkmark" 
                      size={14} 
                      color={colors.accentColor} 
                    />
                  </LinearGradient>
                  <Text style={styles.featureText} numberOfLines={1}>{feature.text}</Text>
                </View>
              ))}

              {/* "And much more" link if more features */}
              {includedFeatures.length > 4 && (
                <View style={[styles.featureRow, styles.moreFeatures]}>
                  <View style={styles.moreTextContainer}>
                    <Text style={[styles.moreText, { color: colors.accentColor }]}>
                      +{includedFeatures.length - 4} more features
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color={colors.accentColor} />
                  </View>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* CTA Button with Premium Gradient */}
        <View style={styles.ctaContainer}>
          {/* Glow effect */}
          <LinearGradient
            colors={colors.glowColor}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGlow}
          />
          
          <LinearGradient
            colors={colors.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Pressable 
              style={styles.ctaButton}
              onPress={onPress}
              disabled={disabled}
            >
              {/* Shine effect overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shineEffect}
              />
              
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.ctaText}>
                {price === 0 ? 'Start Free Trial' : 'Get Premium Now'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </LinearGradient>
        </View>

        {/* Footer disclaimer */}
        <Text style={styles.disclaimer}>
          Cancel anytime • No hidden fees • Instant access
        </Text>
      </View>
    </Pressable>
  );
}const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN_RIGHT,
    position: 'relative',
  },
  popularCard: {
    transform: [{ scale: 1.02 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  gradientBg1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
  },
  gradientBg2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
  },
  cardInner: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 11, 0.8)',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planNameContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 12,
  },
  gradientTextBg: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  planName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  priceGradient: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  interval: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginLeft: 8,
  },
  freeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  premiumBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  featuresCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  featuresGradient: {
    flex: 1,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  featuresHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  featuresContainer: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconGradient: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#ddd',
    fontWeight: '500',
    lineHeight: 18,
  },
  moreFeatures: {
    marginTop: 4,
  },
  moreTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ctaContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  ctaGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    opacity: 0.6,
  },
  ctaGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});
