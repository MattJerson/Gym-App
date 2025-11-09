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
import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { LinearGradient } from "expo-linear-gradient";
import SettingsHeader from "../../components/SettingsHeader";
import { SettingsPageSkeleton } from "../../components/skeletons/SettingsPageSkeleton";

export default function MySubscription() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPackage, setSubscriptionPackage] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

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

  const handleUpgrade = () => {
    router.push("/features/subscriptionpackages");
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
              <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
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
          {subscription && subscriptionPackage && (
            <>
              {/* Current Plan Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="sparkles"
                    size={24}
                    color={subscriptionPackage.accent_color || "#A3E635"}
                  />
                  <Text style={styles.sectionTitle}>Current Plan</Text>
                </View>

                <LinearGradient
                  colors={[
                    subscriptionPackage.accent_color || "#A3E635",
                    `${subscriptionPackage.accent_color || "#A3E635"}CC`,
                  ]}
                  style={styles.premiumCard}
                >
                  <View style={styles.premiumHeader}>
                    {subscriptionPackage.emoji && (
                      <Text style={styles.premiumEmoji}>
                        {subscriptionPackage.emoji}
                      </Text>
                    )}
                    <Text style={styles.premiumTitle}>
                      {subscriptionPackage.name}
                    </Text>
                    {subscriptionPackage.badge && (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>
                          {subscriptionPackage.badge}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.premiumPriceContainer}>
                    <Text style={styles.premiumPrice}>
                      {subscriptionPackage.price === 0
                        ? "Free"
                        : `$${subscriptionPackage.price.toFixed(2)}`}
                    </Text>
                    {subscriptionPackage.price > 0 && (
                      <Text style={styles.premiumInterval}>
                        {getIntervalText(subscriptionPackage.billing_interval)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.premiumDetails}>
                    <View style={styles.premiumDetailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.premiumDetailText}>
                        Started: {formatDate(subscription.started_at)}
                      </Text>
                    </View>
                    {subscription.expires_at && (
                      <View style={styles.premiumDetailRow}>
                        <Ionicons
                          name={
                            isExpiringSoon(subscription.expires_at)
                              ? "alert-circle-outline"
                              : "refresh-outline"
                          }
                          size={16}
                          color={
                            isExpiringSoon(subscription.expires_at)
                              ? "#FFB800"
                              : "rgba(255,255,255,0.9)"
                          }
                        />
                        <Text
                          style={[
                            styles.premiumDetailText,
                            isExpiringSoon(subscription.expires_at) && {
                              color: "#FFB800",
                              fontWeight: "700",
                            },
                          ]}
                        >
                          Expires: {formatDate(subscription.expires_at)}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* Features Section */}
              {subscriptionPackage.features &&
                subscriptionPackage.features.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#A3E635"
                      />
                      <Text style={styles.sectionTitle}>Your Benefits</Text>
                    </View>

                    <View style={styles.card}>
                      {subscriptionPackage.features
                        .filter((f) => f.included)
                        .map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <View
                              style={[
                                styles.featureIcon,
                                {
                                  backgroundColor: `${
                                    subscriptionPackage.accent_color ||
                                    "#A3E635"
                                  }20`,
                                },
                              ]}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={
                                  subscriptionPackage.accent_color || "#A3E635"
                                }
                              />
                            </View>
                            <Text style={styles.featureText}>
                              {feature.text}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}

              {/* Manage Subscription Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="settings-outline" size={24} color="#9b59b6" />
                  <Text style={styles.sectionTitle}>Manage</Text>
                </View>

                <View style={styles.card}>
                  {subscriptionPackage.price === 0 ? (
                    // Free tier (base-free or free-trial) - show upgrade option prominently
                    <>
                      <Pressable
                        style={[styles.linkButton, styles.upgradeHighlight]}
                        onPress={handleUpgrade}
                      >
                        <View style={styles.linkButtonLeft}>
                          <Ionicons name="rocket" size={22} color="#A3E635" />
                          <View>
                            <Text style={styles.linkButtonText}>
                              {subscriptionPackage.slug === 'free-trial' 
                                ? 'Upgrade to Keep Premium Features' 
                                : 'Start 7-Day Free Trial'}
                            </Text>
                            <Text style={styles.linkButtonSubtext}>
                              {subscriptionPackage.slug === 'free-trial'
                                ? 'Your trial expires soon'
                                : 'Try all features free for 7 days'}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#A3E635"
                        />
                      </Pressable>

                      <View style={styles.divider} />
                    </>
                  ) : (
                    <>
                      <Pressable
                        style={styles.linkButton}
                        onPress={handleUpgrade}
                      >
                        <View style={styles.linkButtonLeft}>
                          <Ionicons
                            name="arrow-up-circle-outline"
                            size={22}
                            color="#A3E635"
                          />
                          <Text style={styles.linkButtonText}>
                            Upgrade Plan
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
          )}
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
  premiumCard: {
    padding: 28,
    elevation: 8,
    borderRadius: 28,
    shadowRadius: 16,
    shadowOpacity: 0.3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
  },
  premiumHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  premiumEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 28,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  badgeContainer: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  badgeText: {
    fontSize: 11,
    color: "#fff",
    letterSpacing: 1,
    fontWeight: "800",
  },
  premiumPriceContainer: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  premiumPrice: {
    fontSize: 42,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: -1,
  },
  premiumInterval: {
    fontSize: 18,
    marginLeft: 6,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  premiumDetails: {
    gap: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
  },
  premiumDetailRow: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumDetailText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
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
