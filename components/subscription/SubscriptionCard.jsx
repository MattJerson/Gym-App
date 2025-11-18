import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 20;
const VISIBLE_CARDS = 1.05;
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;
const CARD_HEIGHT = height * 0.72; // Slightly shorter for better fit

export default function SubscriptionCard({
  name,
  price,
  interval,
  features = [],
  badge,
  isPopular,
  emoji,
  accentColor = '#4A9EFF',
  planType,
  slug,
  subtitle,
  description,
  onPress,
  disabled = false,
}) {
  const includedFeatures = features.filter(f => f.included);
  
  // Parse feature text with markdown-style bold (**text**)
  const parseFeatureText = (text) => {
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before bold
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), bold: false });
      }
      // Add bold text
      parts.push({ text: match[1], bold: true });
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), bold: false });
    }
    
    return parts.length > 0 ? parts : [{ text, bold: false }];
  };
  
  // Map features to categories with emojis
  const categorizeFeature = (featureText) => {
    const text = featureText.toLowerCase();
    if (text.includes('workout')) return { emoji: '💪', category: 'Workout' };
    if (text.includes('meal') || text.includes('nutrition')) return { emoji: '🥗', category: 'Nutrition' };
    if (text.includes('support') || text.includes('chatbot')) return { emoji: '💬', category: 'Support' };
    if (text.includes('accountability') || text.includes('motivation')) return { emoji: '📱', category: 'Accountability' };
    if (text.includes('resources') || text.includes('e-book')) return { emoji: '📚', category: 'Resources' };
    if (text.includes('zoom') || text.includes('call') || text.includes('check-in')) return { emoji: '📹', category: 'Live Coaching' };
    if (text.includes('success manager') || text.includes('coach tim') || text.includes('bonus')) return { emoji: '⭐', category: 'Premium' };
    if (text.includes('analytics') || text.includes('tracking') || text.includes('assessment')) return { emoji: '📊', category: 'Analytics' };
    if (text.includes('video') || text.includes('library')) return { emoji: '🎥', category: 'Content' };
    return { emoji: '✨', category: 'Feature' };
  };

  // Calculate monthly price for annual plans
  const monthlyEquivalent = interval === 'yr' ? (price / 12).toFixed(2) : null;

  // Define unique color schemes and styles per tier
  const getTierConfig = () => {
    // Basic Plan ($20) - Automated - Simple, clean design (no gradients)
    if (slug === 'basic-plan' || planType === 'automated') {
      return {
        useGradient: false,
        useGlow: false,
        accentColor: '#4A9EFF',
        secondaryColor: '#3498db',
        bgColor: 'rgba(11, 11, 11, 0.95)',
        borderColor: 'rgba(74, 158, 255, 0.3)',
        ctaColors: ['#4A9EFF', '#3498db'],
      };
    }
    
    // Standard Plan ($50) - Assigned - Premium with gradients
    if (slug === 'standard-plan' || planType === 'assigned') {
      return {
        useGradient: true,
        useGlow: false,
        gradient1: ['rgba(255, 184, 0, 0.15)', 'transparent', 'rgba(243, 156, 18, 0.1)'],
        gradient2: ['transparent', 'rgba(255, 184, 0, 0.08)', 'transparent'],
        accentColor: '#FFB800',
        secondaryColor: '#f39c12',
        textGradient: ['#FFB800', '#f39c12'],
        ctaColors: ['#FFB800', '#f39c12', '#e67e22'],
        borderColor: 'rgba(255, 184, 0, 0.4)',
      };
    }
    
    // Rapid Results Coaching ($200) - Custom - Ultra premium with gradients + glow
    if (slug === 'rapid-results-coaching' || planType === 'custom') {
      return {
        useGradient: true,
        useGlow: true,
        gradient1: ['rgba(155, 89, 182, 0.2)', 'transparent', 'rgba(231, 76, 60, 0.15)'],
        gradient2: ['transparent', 'rgba(142, 68, 173, 0.12)', 'rgba(192, 57, 43, 0.1)'],
        accentColor: '#9b59b6',
        secondaryColor: '#e74c3c',
        textGradient: ['#9b59b6', '#e74c3c'],
        ctaColors: ['#9b59b6', '#8e44ad', '#e74c3c'],
        glowColor: 'rgba(155, 89, 182, 0.6)',
        borderColor: 'rgba(155, 89, 182, 0.5)',
      };
    }
    
    // Fallback
    return {
      useGradient: false,
      useGlow: false,
      accentColor: accentColor,
      secondaryColor: accentColor,
      bgColor: 'rgba(11, 11, 11, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      ctaColors: [accentColor, accentColor],
    };
  };

  const config = getTierConfig();

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
      {/* Outer glow for premium tier */}
      {config.useGlow && (
        <View style={[styles.outerGlow, { 
          shadowColor: config.glowColor,
          borderColor: config.glowColor,
        }]} />
      )}

      {/* Background gradients - only for premium tiers */}
      {config.useGradient && (
        <>
          <LinearGradient
            colors={config.gradient1}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBg1}
          />
          <LinearGradient
            colors={config.gradient2}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientBg2}
          />
        </>
      )}

      <View style={[
        styles.cardInner,
        { 
          backgroundColor: config.bgColor || 'rgba(11, 11, 11, 0.95)',
          borderColor: config.borderColor
        }
      ]}>
        {/* Header Section - Fixed height */}
        <View style={styles.headerSection}>
          {/* Badge */}
          {badge && (
            <View style={[styles.topBadge, { 
              backgroundColor: `${config.accentColor}15`, 
              borderColor: `${config.accentColor}40` 
            }]}>
              {emoji && <Text style={styles.badgeEmoji}>{emoji}</Text>}
              <Text style={[styles.topBadgeText, { color: config.accentColor }]}>
                {badge}
              </Text>
            </View>
          )}
          
          {/* Plan Name - Fixed height with ellipsis */}
          <Text style={styles.planName} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>
          
          {/* Subtitle */}
          {subtitle && (
            <Text style={[styles.subtitle, { color: config.accentColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          
          {/* Description */}
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>

        {/* Price Section - Fixed height */}
        <View style={styles.priceSection}>
          {price === 0 ? (
            <Text style={[styles.price, { color: config.accentColor }]}>Free</Text>
          ) : (
            <>
              {config.useGradient ? (
                <LinearGradient
                  colors={config.textGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.priceGradientWrapper}
                >
                  <Text style={styles.price}>${price.toFixed(0)}</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.price, { color: config.accentColor }]}>
                  ${price.toFixed(0)}
                </Text>
              )}
              <Text style={styles.interval}>/mo</Text>
            </>
          )}
        </View>

        {/* Features Section - Scrollable, fills remaining space */}
        <View style={styles.featuresCard}>
          {config.useGradient ? (
            <LinearGradient
              colors={[
                'rgba(51, 51, 51, 0.5)',
                `${config.accentColor}15`,
                'rgba(51, 51, 51, 0.5)'
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.featuresInner, { borderColor: config.borderColor }]}
            >
              {renderFeatures()}
            </LinearGradient>
          ) : (
            <View style={[styles.featuresInner, { 
              backgroundColor: 'rgba(51, 51, 51, 0.3)',
              borderColor: config.borderColor
            }]}>
              {renderFeatures()}
            </View>
          )}
        </View>

        {/* CTA Button */}
        <View style={styles.ctaContainer}>
          {config.useGlow && (
            <View style={[styles.ctaGlow, { 
              backgroundColor: config.glowColor,
              shadowColor: config.glowColor,
            }]} />
          )}
          
          <LinearGradient
            colors={config.ctaColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Pressable 
              style={styles.ctaButton}
              onPress={onPress}
              disabled={disabled}
            >
              <Ionicons name="rocket" size={18} color="#fff" />
              <Text style={styles.ctaText}>
                {price === 0 ? 'Start Free' : 'Get Started'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </LinearGradient>
        </View>

        {/* Footer */}
        <Text style={styles.disclaimer}>
          {price === 0 ? 'No credit card required' : 'Cancel anytime • Instant access'}
        </Text>
      </View>
    </Pressable>
  );

  // Helper function to render features
  function renderFeatures() {
    const maxVisibleFeatures = 3;
    const visibleFeatures = includedFeatures.slice(0, maxVisibleFeatures);
    const remainingCount = includedFeatures.length - maxVisibleFeatures;
    
    return (
      <View style={styles.featuresScrollContent}>
        <View style={styles.featuresHeader}>
          <Text style={styles.featuresTitle}>What's Included</Text>
        </View>
        
        <View style={styles.featuresGrid}>
          {visibleFeatures.map((feature, index) => {
            const { emoji: featureEmoji, category } = categorizeFeature(feature.text);
            const parsedText = parseFeatureText(feature.text);
            
            return (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: `${config.accentColor}20` }]}>
                  <Text style={styles.featureEmoji}>{featureEmoji}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureText} numberOfLines={2}>
                    {parsedText.map((part, i) => (
                      <Text 
                        key={i} 
                        style={part.bold ? styles.featureTextBold : styles.featureTextNormal}
                      >
                        {part.text}
                      </Text>
                    ))}
                  </Text>
                </View>
              </View>
            );
          })}
          
          {/* Show "more features" indicator if there are additional features */}
          {remainingCount > 0 && (
            <View style={styles.moreFeatures}>
              <View style={[styles.moreIcon, { backgroundColor: `${config.accentColor}20` }]}>
                <Ionicons name="add" size={16} color={config.accentColor} />
              </View>
              <Text style={[styles.moreText, { color: config.accentColor }]}>
                And {remainingCount} more feature{remainingCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }
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
  outerGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 36,
    borderWidth: 3,
    opacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  gradientBg1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  gradientBg2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  cardInner: {
    flex: 1,
    borderRadius: 28,
    padding: 24,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Header Section - Fixed height
  headerSection: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  badgeEmoji: {
    fontSize: 14,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 28,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  description: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  
  // Price Section - Fixed height
  priceSection: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  priceGradientWrapper: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  price: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  interval: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
    marginLeft: 4,
    marginBottom: 8,
  },
  
  // Features Section - Flexible height
  featuresCard: {
    flex: 1,
    marginBottom: 16,
    minHeight: 200,
  },
  featuresInner: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
  },
  featuresScrollContent: {
    flexGrow: 1,
  },
  featuresHeader: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresGrid: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureContent: {
    flex: 1,
    paddingTop: 2,
  },
  featureText: {
    fontSize: 12,
    color: '#ddd',
    lineHeight: 16,
  },
  featureTextBold: {
    fontWeight: '700',
    color: '#fff',
  },
  featureTextNormal: {
    fontWeight: '500',
    color: '#ccc',
  },
  moreFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  moreIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // CTA Button
  ctaContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  ctaGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 18,
    opacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  ctaGradient: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  
  // Footer
  disclaimer: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});
