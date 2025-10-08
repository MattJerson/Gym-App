import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 20;
const VISIBLE_CARDS = 1.05; // Show very slight peek
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;
const CARD_HEIGHT = height * 0.75; // 75% of screen height

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
  // Separate included and not included features
  const includedFeatures = features.filter(f => f.included);
  const notIncludedFeatures = features.filter(f => !f.included);

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
      <View style={styles.cardInner}>
        {/* Color accent stripe at top */}
        <View style={[styles.colorAccent, { backgroundColor: accentColor }]} />

        {/* Header with badge */}
        {badge && (
          <View style={styles.headerRow}>
            <View style={[styles.badge, { 
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}40`,
            }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>
                {badge}
              </Text>
            </View>
          </View>
        )}

        {/* Plan name */}
        <Text style={styles.planName}>{name}</Text>

        {/* Price section with emoji background */}
        <View style={styles.priceSection}>
          {emoji && (
            <Text style={styles.emojiBackground}>{emoji}</Text>
          )}
          <View style={styles.priceContent}>
            {price === 0 ? (
              <Text style={styles.freeText}>Free</Text>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>{price.toFixed(2)}</Text>
                {interval && (
                  <Text style={styles.interval}>/{interval}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Scrollable Features Section */}
        <ScrollView 
          style={styles.featuresScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.featuresScrollContent}
        >
          {/* Included Features */}
          {includedFeatures.length > 0 && (
            <View style={styles.featureSection}>
              <View style={[styles.sectionHeader, { borderBottomColor: `${accentColor}30` }]}>
                <Ionicons name="checkmark-circle" size={18} color={accentColor} />
                <Text style={[styles.sectionTitle, { color: accentColor }]}>
                  What's Included
                </Text>
              </View>
              <View style={styles.featuresContainer}>
                {includedFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.checkIcon, { backgroundColor: `${accentColor}20` }]}>
                      <Ionicons name="checkmark" size={12} color={accentColor} />
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Not Included Features */}
          {notIncludedFeatures.length > 0 && (
            <View style={[styles.featureSection, styles.notIncludedSection]}>
              <View style={[styles.sectionHeader, { borderBottomColor: 'rgba(102, 102, 102, 0.3)' }]}>
                <Ionicons name="close-circle" size={18} color="#666" />
                <Text style={[styles.sectionTitle, { color: '#888' }]}>
                  Not Included
                </Text>
              </View>
              <View style={styles.featuresContainer}>
                {notIncludedFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.checkIcon, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                      <Ionicons name="close" size={12} color="#666" />
                    </View>
                    <Text style={styles.featureTextDisabled}>{feature.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* CTA Button - Fixed at bottom */}
        <View style={[styles.ctaButton, { backgroundColor: accentColor }]}>
          <Text style={styles.ctaText}>
            {price === 0 ? 'Start Free Trial' : 'Subscribe Now'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN_RIGHT,
  },
  popularCard: {
    transform: [{ scale: 1.01 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  colorAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  priceSection: {
    position: 'relative',
    marginBottom: 24,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  emojiBackground: {
    position: 'absolute',
    fontSize: 140,
    opacity: 0.08,
    top: -40,
    right: -20,
  },
  priceContent: {
    zIndex: 1,
  },
  freeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
  },
  price: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  interval: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  featuresScroll: {
    flex: 1,
    marginBottom: 16,
  },
  featuresScrollContent: {
    paddingBottom: 8,
  },
  featureSection: {
    marginBottom: 20,
  },
  notIncludedSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 20,
  },
  featureTextDisabled: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
