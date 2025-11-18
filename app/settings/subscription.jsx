import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabase";
import { LinearGradient } from "expo-linear-gradient";
import SettingsHeader from "../../components/SettingsHeader";
import { SettingsPageSkeleton } from "../../components/skeletons/SettingsPageSkeleton";
import { useFocusEffect } from "@react-navigation/native";

export default function MySubscription() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPackage, setSubscriptionPackage] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  // Reload data when screen comes into focus (after returning from subscription packages)
  useFocusEffect(
    useCallback(() => {
      loadSubscriptionData();
    }, [])
  );

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }
      setUserId(user.id);

      // Get user's active subscription
      const { data: subData, error: subError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (subError && subError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Subscription error:", subError);
      }

      if (subData) {
        setSubscription(subData);

        // Get subscription package details
        const { data: packageData, error: packageError } = await supabase
          .from("subscription_packages")
          .select("*")
          .eq("id", subData.package_id)
          .single();

        if (packageError) {
          console.error("Package error:", packageError);
        } else {
          setSubscriptionPackage(packageData);
        }
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      Alert.alert("Error", "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert(
      "Manage Subscription",
      "This will open your subscription management portal.",
      [{ text: "OK" }]
    );
  };

  const handleBillingHistory = () => {
    Alert.alert("Billing History", "View your billing history and invoices.", [
      { text: "OK" },
    ]);
  };

  const handleRedeemCode = () => {
    Alert.alert(
      "Redeem Promo Code",
      "Enter a promo code to unlock special offers.",
      [{ text: "OK" }]
    );
  };

  const handleViewPlans = () => {
    router.push("/features/subscriptionpackages");
  };

  // Parse feature text with markdown-style bold (**text**)
  const parseFeatureText = (text) => {
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), bold: false });
      }
      parts.push({ text: match[1], bold: true });
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), bold: false });
    }
    
    return parts.length > 0 ? parts : [{ text, bold: false }];
  };

  // Get tier-specific styling
  const getTierConfig = (planType, slug) => {
    if (slug === 'basic-plan' || planType === 'automated') {
      return {
        useGradient: false,
        accentColor: '#4A9EFF',
        borderColor: 'rgba(74, 158, 255, 0.3)',
        bgColor: 'rgba(11, 11, 11, 0.95)',
      };
    }
    
    if (slug === 'standard-plan' || planType === 'assigned') {
      return {
        useGradient: true,
        gradient: ['rgba(255, 184, 0, 0.15)', 'transparent', 'rgba(243, 156, 18, 0.1)'],
        accentColor: '#FFB800',
        borderColor: 'rgba(255, 184, 0, 0.4)',
      };
    }
    
    if (slug === 'rapid-results-coaching' || planType === 'custom') {
      return {
        useGradient: true,
        useGlow: true,
        gradient: ['rgba(155, 89, 182, 0.2)', 'transparent', 'rgba(231, 76, 60, 0.15)'],
        accentColor: '#9b59b6',
        borderColor: 'rgba(155, 89, 182, 0.5)',
        glowColor: 'rgba(155, 89, 182, 0.6)',
      };
    }
    
    return {
      useGradient: false,
      accentColor: '#A3E635',
      borderColor: 'rgba(163, 230, 53, 0.3)',
      bgColor: 'rgba(11, 11, 11, 0.95)',
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getIntervalText = (interval) => {
    if (!interval) return "";
    if (interval === "month") return "/ month";
    if (interval === "year") return "/ year";
    return "";
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <SettingsHeader title="My Subscription" />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <SettingsPageSkeleton />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="My Subscription" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* No Active Subscription */}
          {!subscription && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="gift-outline" size={64} color="#666" />
              </View>
              <Text style={styles.emptyTitle}>No Active Subscription</Text>
              <Text style={styles.emptyText}>
                Subscribe to unlock premium features and take your fitness
                journey to the next level
              </Text>
              <Pressable style={styles.upgradeButton} onPress={handleViewPlans}>
                <LinearGradient
                  colors={["#A3E635", "#86C232"]}
                  style={styles.upgradeButtonGradient}
                >
                  <Ionicons name="rocket" size={20} color="#000" />
                  <Text style={styles.upgradeButtonText}>View Plans</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Active Subscription */}
          {subscription && subscriptionPackage && (() => {
            const tierConfig = getTierConfig(subscriptionPackage.plan_type, subscriptionPackage.slug);
            const features = Array.isArray(subscriptionPackage.features) 
              ? subscriptionPackage.features 
              : [];
            
            return (
              <>
                {/* Combined Current Plan & Benefits Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="sparkles"
                      size={24}
                      color={tierConfig.accentColor}
                    />
                    <Text style={styles.sectionTitle}>Your Subscription</Text>
                  </View>

                  {/* Premium Card with tier-specific styling */}
                  <View style={styles.premiumCardContainer}>
                    {tierConfig.useGlow && (
                      <View style={[styles.outerGlow, { 
                        shadowColor: tierConfig.glowColor,
                        borderColor: tierConfig.glowColor,
                      }]} />
                    )}

                    {tierConfig.useGradient && (
                      <LinearGradient
                        colors={tierConfig.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBg}
                      />
                    )}

                    <View style={[styles.premiumCard, {
                      backgroundColor: tierConfig.bgColor || 'rgba(11, 11, 11, 0.95)',
                      borderColor: tierConfig.borderColor,
                    }]}>
                      {/* Header */}
                      <View style={styles.premiumHeader}>
                        {subscriptionPackage.badge && (
                          <View style={[styles.topBadge, { 
                            backgroundColor: `${tierConfig.accentColor}15`, 
                            borderColor: `${tierConfig.accentColor}40` 
                          }]}>
                            {subscriptionPackage.emoji && (
                              <Text style={styles.badgeEmoji}>{subscriptionPackage.emoji}</Text>
                            )}
                            <Text style={[styles.topBadgeText, { color: tierConfig.accentColor }]}>
                              {subscriptionPackage.badge}
                            </Text>
                          </View>
                        )}
                        
                        <Text style={styles.premiumTitle}>
                          {subscriptionPackage.name}
                        </Text>

                        {subscriptionPackage.subtitle && (
                          <Text style={[styles.premiumSubtitle, { color: tierConfig.accentColor }]}>
                            {subscriptionPackage.subtitle}
                          </Text>
                        )}

                        {subscriptionPackage.description && (
                          <Text style={styles.premiumDescription}>
                            {subscriptionPackage.description}
                          </Text>
                        )}
                      </View>

                      {/* Price */}
                      <View style={styles.premiumPriceContainer}>
                        <Text style={[styles.premiumPrice, { color: tierConfig.accentColor }]}>
                          {subscriptionPackage.price === 0
                            ? "Free"
                            : `$${subscriptionPackage.price.toFixed(0)}`}
                        </Text>
                        {subscriptionPackage.price > 0 && (
                          <Text style={styles.premiumInterval}>/mo</Text>
                        )}
                      </View>

                      {/* Subscription Info */}
                      <View style={styles.subscriptionInfo}>
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={16} color="#aaa" />
                          <Text style={styles.infoLabel}>Started:</Text>
                          <Text style={styles.infoValue}>{formatDate(subscription.started_at)}</Text>
                        </View>
                        {subscription.expires_at && (
                          <View style={styles.infoRow}>
                            <Ionicons 
                              name={isExpiringSoon(subscription.expires_at) ? "alert-circle-outline" : "refresh-outline"}
                              size={16} 
                              color={isExpiringSoon(subscription.expires_at) ? "#FFB800" : "#aaa"} 
                            />
                            <Text style={styles.infoLabel}>
                              {isExpiringSoon(subscription.expires_at) ? "Expires Soon:" : "Renews:"}
                            </Text>
                            <Text style={[
                              styles.infoValue,
                              isExpiringSoon(subscription.expires_at) && { color: "#FFB800", fontWeight: "700" }
                            ]}>
                              {formatDate(subscription.expires_at)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Benefits */}
                      {features.length > 0 && (
                        <View style={styles.benefitsSection}>
                          <View style={styles.benefitsHeader}>
                            <Ionicons name="checkmark-circle" size={18} color={tierConfig.accentColor} />
                            <Text style={styles.benefitsTitle}>What's Included</Text>
                          </View>
                          
                          <View style={styles.benefitsGrid}>
                            {features.map((feature, index) => {
                              const featureText = typeof feature === 'string' ? feature : feature.text || feature;
                              const parsedText = parseFeatureText(featureText);
                              
                              return (
                                <View key={index} style={styles.benefitItem}>
                                  <View style={[styles.benefitIconContainer, { 
                                    backgroundColor: `${tierConfig.accentColor}20` 
                                  }]}>
                                    <Ionicons 
                                      name="checkmark" 
                                      size={14} 
                                      color={tierConfig.accentColor} 
                                    />
                                  </View>
                                  <Text style={styles.benefitText}>
                                    {parsedText.map((part, i) => (
                                      <Text 
                                        key={i} 
                                        style={part.bold ? styles.benefitTextBold : styles.benefitTextNormal}
                                      >
                                        {part.text}
                                      </Text>
                                    ))}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

              {/* Manage Subscription Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="settings-outline" size={24} color="#9b59b6" />
                  <Text style={styles.sectionTitle}>Manage</Text>
                </View>

                <View style={styles.card}>
                  {/* View All Subscription Packages */}
                  <Pressable
                    style={[
                      styles.linkButton,
                      subscriptionPackage.price === 0 && styles.upgradeHighlight
                    ]}
                    onPress={handleViewPlans}
                  >
                    <View style={styles.linkButtonLeft}>
                      <Ionicons 
                        name="apps-outline" 
                        size={22} 
                        color={tierConfig.accentColor} 
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.linkButtonText}>
                          View Subscription Packages
                        </Text>
                        <Text style={styles.linkButtonSubtext}>
                          {subscriptionPackage.price === 0 
                            ? 'Explore premium plans to unlock all features'
                            : 'Compare plans and upgrade or change anytime'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={subscriptionPackage.price === 0 ? tierConfig.accentColor : "#666"}
                    />
                  </Pressable>

                  {subscriptionPackage.price > 0 && (
                    <>
                      <View style={styles.divider} />

                      <Pressable
                        style={styles.linkButton}
                        onPress={handleManageSubscription}
                      >
                        <View style={styles.linkButtonLeft}>
                          <Ionicons
                            name="card-outline"
                            size={22}
                            color="#4A9EFF"
                          />
                          <Text style={styles.linkButtonText}>
                            Payment Method
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#666"
                        />
                      </Pressable>

                      <View style={styles.divider} />

                      <Pressable
                        style={styles.linkButton}
                        onPress={handleBillingHistory}
                      >
                        <View style={styles.linkButtonLeft}>
                          <Ionicons
                            name="receipt-outline"
                            size={22}
                            color="#FFB800"
                          />
                          <Text style={styles.linkButtonText}>
                            Billing History
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#666"
                        />
                      </Pressable>

                      <View style={styles.divider} />
                    </>
                  )}

                  <Pressable
                    style={styles.linkButton}
                    onPress={handleRedeemCode}
                  >
                    <View style={styles.linkButtonLeft}>
                      <Ionicons
                        name="pricetag-outline"
                        size={22}
                        color="#FF4D4D"
                      />
                      <Text style={styles.linkButtonText}>
                        Redeem Promo Code
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </Pressable>
                </View>
              </View>

              {/* Cancel Section */}
              {subscriptionPackage.price > 0 &&
                subscription.status === "active" && (
                  <View style={styles.cancelContainer}>
                    <Text style={styles.cancelText}>
                      Need to cancel? Your subscription will remain active until{" "}
                      {formatDate(subscription.expires_at)}
                    </Text>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() =>
                        Alert.alert(
                          "Cancel Subscription",
                          "Are you sure you want to cancel your subscription?",
                          [
                            { text: "Keep Subscription", style: "cancel" },
                            { text: "Cancel", style: "destructive" },
                          ]
                        )
                      }
                    >
                      <Text style={styles.cancelButtonText}>
                        Cancel Subscription
                      </Text>
                    </Pressable>
                  </View>
                )}
              </>
            );
          })()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyTitle: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    lineHeight: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  upgradeButton: {
    elevation: 6,
    shadowRadius: 8,
    borderRadius: 16,
    shadowOpacity: 0.3,
    overflow: "hidden",
    shadowColor: "#A3E635",
    shadowOffset: { width: 0, height: 4 },
  },
  upgradeButtonGradient: {
    gap: 8,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  upgradeButtonText: {
    fontSize: 17,
    color: "#000",
    fontWeight: "700",
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    gap: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  premiumCardContainer: {
    position: "relative",
  },
  outerGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 36,
    borderWidth: 3,
    opacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  premiumCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  premiumHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 8,
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
  premiumTitle: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
    marginBottom: 6,
  },
  premiumSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  premiumDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  premiumPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 20,
  },
  premiumPrice: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  premiumInterval: {
    fontSize: 16,
    marginLeft: 4,
    fontWeight: "700",
    color: "#888",
    marginBottom: 8,
  },
  subscriptionInfo: {
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  benefitsSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  benefitTextBold: {
    fontWeight: '700',
    color: '#fff',
  },
  benefitTextNormal: {
    fontWeight: '500',
    color: '#ccc',
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  featureRow: {
    gap: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    lineHeight: 20,
    fontWeight: "500",
  },
  linkButton: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkButtonLeft: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  linkButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  linkButtonSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: "#999",
  },
  upgradeHighlight: {
    borderRadius: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    backgroundColor: "rgba(163, 230, 53, 0.1)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelContainer: {
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "rgba(255, 77, 77, 0.3)",
    backgroundColor: "rgba(255, 77, 77, 0.1)",
  },
  cancelText: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
    marginBottom: 16,
    textAlign: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 24,
    borderColor: "rgba(255, 77, 77, 0.4)",
    backgroundColor: "rgba(255, 77, 77, 0.15)",
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#FF4D4D",
    fontWeight: "600",
  },
});
