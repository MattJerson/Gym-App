import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from '@react-native-async-storage/async-storage';
import FormInput from "../../components/FormInput";
import SubmitButton from "../../components/SubmitButton";
import { supabase, pingSupabase } from "../../services/supabase";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
import { checkOnboardingStatus } from "../../utils/onboardingFlow";
import { NotificationService } from "../../services/NotificationService";

/* -------------------- REGISTER/LOGIN SCREEN -------------------- */
export default function Register() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fields
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Errors
  const [errors, setErrors] = useState({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  // Dev-only logger
  const dlog = (...args) => {
    if (__DEV__) console.log("[AUTH]", ...args);
  };

  // Password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, text: "", color: "#666" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    const levels = [
      { strength: 0, text: "", color: "#666" },
      { strength: 1, text: "Very Weak", color: "#F44336" },
      { strength: 2, text: "Weak", color: "#FF9800" },
      { strength: 3, text: "Fair", color: "#FFC107" },
      { strength: 4, text: "Good", color: "#4CAF50" },
      { strength: 5, text: "Strong", color: "#1E3A5F" },
    ];

    return levels[score];
  };

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1200,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const withTimeout = async (promise, ms, label = "request") => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  /* -------------------- HANDLERS -------------------- */
  const handleToggle = async () => {
    try {
      if (Platform.OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Keyboard.dismiss();
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsRegistering((prev) => !prev);
        setNickname("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});
        Animated.timing(formAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setErrors({});
    let newErrors = {};

    // Email validation (both modes)
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format.";
    }

    // Password validation (both modes)
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    // Registration-specific validation
    if (isRegistering) {
      if (!nickname.trim()) newErrors.nickname = "Nickname is required.";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      if (Platform.OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const healthy = await pingSupabase(4000);
      if (!healthy) throw new Error("Unable to reach the server. Check your internet connection or try again shortly.");

      if (isRegistering) {
        try {
          try {
            const { data, error } = await withTimeout(
              supabase.auth.signUp({ email, password, options: { data: { nickname } } }),
              8000,
              "Sign up"
            );
            if (error) {
              if (error instanceof Error && error.message?.includes("Password should be at least")) {
                throw new Error("Password must be at least 6 characters.");
              }
              // Fallback: direct signup
              try {
                const controller = new AbortController();
                const to = setTimeout(() => controller.abort(), 12000);
                const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
                  body: JSON.stringify({ email, password, data: { nickname } }),
                  signal: controller.signal,
                });
                clearTimeout(to);
                if (!res.ok) {
                  const text = await res.text();
                  throw new Error(text || "Sign up failed");
                }
              } catch (e2) {
                throw error;
              }
            }

            if (data?.user) {
              try {
                // Always set full_name, nickname, and display_name in user_metadata
                await withTimeout(
                  supabase.auth.updateUser({ data: { full_name: nickname, nickname, display_name: nickname } }),
                  8000,
                  "Profile update"
                );
              } catch (updateErr) {
              }
              // Create registration_profiles row
              try {
                const { data: rpcData, error: profileError } = await supabase.rpc('create_profile_for_user', {
                  user_id_param: data.user.id
                });
                if (profileError) {
                }
              } catch (rpcErr) {
              }
            }
          } catch (innerErr) {
            throw innerErr;
          }
        } catch (upErr) {
          console.warn("Failed to update user metadata:", upErr);
        }

        router.push("/features/registrationprocess");
      } else {
        // SDK sign-in with timeout
        const { data, error: sdkErr } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          15000,
          "Sign in"
        );
        if (sdkErr) {
          throw sdkErr;
        }

        // After login, if display name is missing, set it from registration_profiles or fallback to email
        try {
          // Try to get nickname from registration_profiles
          let nickname = null;
          let fullProfile = null;
          try {
            const { data: profile } = await supabase
              .from("registration_profiles")
              .select("*")
              .eq("user_id", data.user.id)
              .maybeSingle();
            
            fullProfile = profile;
            nickname = profile?.nickname || data.user.email?.split("@") [0] || "User";
            
            // 📊 LOG USER PROFILE DATA
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔐 USER LOGIN SUCCESS');
            console.log('═══════════════════════════════════════════════════════');
            console.log('User ID:', data.user.id);
            console.log('Email:', data.user.email);
            console.log('Nickname:', nickname);
            console.log('\n📝 REGISTRATION PROFILE DATA:');
            if (fullProfile) {
              console.log('  ├─ Gender:', fullProfile.gender || '(not set)');
              console.log('  ├─ Age:', fullProfile.age || '(not set)');
              console.log('  ├─ Height:', fullProfile.height ? `${fullProfile.height} ${fullProfile.use_metric ? 'cm' : 'ft'}` : '(not set)');
              console.log('  ├─ Weight:', fullProfile.weight ? `${fullProfile.weight} ${fullProfile.use_metric ? 'kg' : 'lbs'}` : '(not set)');
              console.log('  ├─ Activity Level:', fullProfile.activity_level || '(not set)');
              console.log('  ├─ Fitness Goal:', fullProfile.fitness_goal || '(not set)');
              console.log('  ├─ Fitness Level:', fullProfile.fitness_level || '(not set)');
              console.log('  ├─ Training Location:', fullProfile.training_location || '(not set)');
              console.log('  ├─ Training Duration:', fullProfile.training_duration || '(not set)');
              console.log('  ├─ Training Frequency:', fullProfile.training_frequency || '(not set)');
              console.log('  ├─ Muscle Focus:', fullProfile.muscle_focus || '(not set)');
              console.log('  ├─ Injuries:', fullProfile.injuries || '(none)');
              console.log('  ├─ Meal Type:', fullProfile.meal_type || '(not set)');
              console.log('  ├─ Calorie Goal:', fullProfile.calorie_goal || '(not set)');
              console.log('  ├─ Meals Per Day:', fullProfile.meals_per_day || '(not set)');
              console.log('  ├─ Dietary Restrictions:', fullProfile.restrictions || '(none)');
              console.log('  ├─ Current Body Fat:', fullProfile.current_body_fat ? `${fullProfile.current_body_fat}%` : '(not set)');
              console.log('  ├─ Goal Body Fat:', fullProfile.goal_body_fat ? `${fullProfile.goal_body_fat}%` : '(not set)');
              console.log('  ├─ Registration Complete:', fullProfile.registration_complete ? '✅ Yes' : '❌ No');
              console.log('  └─ Profile Created:', fullProfile.created_at || '(unknown)');
            } else {
              console.log('  └─ No profile data found (new user or incomplete registration)');
            }
            console.log('═══════════════════════════════════════════════════════\n');
          } catch (e) {
            nickname = data.user.email?.split("@") [0] || "User";
            console.log('⚠️  Failed to fetch full profile data:', e.message);
          }
          await withTimeout(
            supabase.auth.updateUser({ data: { full_name: nickname, nickname, display_name: nickname } }),
            8000,
            "Profile update (login)"
          );
        } catch (updateErr) {
        }

        // 🔔 Initialize notification subscription (happens once in background)
        try {
          console.log('[AUTH] Initializing notification subscription for user:', data.user.id);
          // Subscribe to real-time notifications
          NotificationService.subscribeToNotifications(
            data.user.id,
            (newNotif) => {
              console.log('[AUTH] Background notification received:', newNotif.title);
              // Notifications will be handled by NotificationBar when it mounts
            }
          );
        } catch (notifErr) {
          console.warn('[AUTH] Failed to initialize notifications:', notifErr);
        }

        // 🎬 Set flag for welcome animation (only on login, not navigation)
        try {
          await AsyncStorage.setItem('justLoggedIn', 'true');
          console.log('[AUTH] Set justLoggedIn flag for welcome animation');
        } catch (storageErr) {
          console.warn('[AUTH] Failed to set justLoggedIn flag:', storageErr);
        }

        // Check if onboarding is complete (with DB function, profile will be created if missing)
        try {
          // First, ensure profile exists (for existing users who signed up before this fix)
          const { data: rpcData, error: rpcError } = await supabase.rpc('create_profile_for_user', {
            user_id_param: data.user.id
          });
          
          // Check onboarding status dynamically
          const { status, nextStep } = await checkOnboardingStatus(data.user.id);
          dlog("profile:check:select:done", { 
            hasProfile: !!status, 
            onboardingComplete: status.registrationComplete && status.hasBodyFat && status.hasSubscription && status.hasWorkouts && status.hasMealPlan,
            nextStep 
          });
          
          try {
            router.replace(nextStep);
          } catch (navErr) {
          }
        } catch (err) {
          try {
            router.replace("/features/registrationprocess");
          } catch (navErr) {
          }
        }
      }
    } catch (error) {
      Alert.alert("Authentication error", error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------- RENDER -------------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }),
                  },
                ],
                pointerEvents: "none",
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Image source={require("../../assets/logo.png")} style={styles.logo} />
            </View>
            <Text style={styles.welcomeText}>{isRegistering ? "Create Account" : "Welcome Back"}</Text>
            <Text style={styles.subtitleText}>
              {isRegistering ? "Start your fitness journey and see your growth" : "Sign in to continue your fitness journey"}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formContainer,
              { opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] },
            ]}
          >
            {isRegistering && (
              <FormInput placeholder="Nickname" value={nickname} onChangeText={setNickname} errorMessage={errors.nickname} />
            )}
            <FormInput placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" errorMessage={errors.email} />
            <FormInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              errorMessage={errors.password}
              textContentType="none"
              autoComplete="off"
              importantForAutofill="no"
            />

            {isRegistering && password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthBar}>
                  <View style={[styles.passwordStrengthFill, { width: `${(passwordStrength.strength / 5) * 100}%`, backgroundColor: passwordStrength.color }]} />
                </View>
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>{passwordStrength.text}</Text>
              </View>
            )}

            {isRegistering && (
              <FormInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                errorMessage={errors.confirmPassword}
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
              />
            )}


            <SubmitButton
              text={isRegistering ? "Create Account" : "Sign In"}
              onPress={handleSubmit}
              isLoading={isLoading}
              loadingText=""
              icon="arrow-forward"
              variant="solid"
            />

            {/* debug button removed in production */}

            <Pressable style={styles.toggleContainer} onPress={handleToggle}>
              <Text style={styles.toggleText}>
                {isRegistering ? "Already have an account? " : "Don't have an account? "}
                <Text style={styles.toggleTextHighlight}>{isRegistering ? "Sign In" : "Sign Up"}</Text>
              </Text>
            </Pressable>

            {!isRegistering && (
              <Pressable style={styles.forgotPasswordContainer} onPress={() => router.push("/auth/passwordresetprocess")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>
            )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0B" },
  keyboardAvoidingView: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  content: { width: "100%", alignItems: "center", maxWidth: 400 },
  headerSection: { position: "absolute", alignItems: "center" },
  logoContainer: { alignItems: "center", justifyContent: "center" },
  logo: { width: 180, height: 180, resizeMode: "contain" },
  welcomeText: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  submitButtonSolid: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, backgroundColor: "#5994d7ff" },
  subtitleText: { fontSize: 12, color: "#999", textAlign: "center", lineHeight: 22, maxWidth: 280 },
  formContainer: { width: "100%", alignItems: "center", marginTop: 280 },
  toggleContainer: { paddingVertical: 16 },
  toggleText: { fontSize: 16, color: "#999", textAlign: "center" },
  toggleTextHighlight: { color: "#4590e6ff", fontWeight: "bold" },
  forgotPasswordContainer: { paddingVertical: 12 },
  forgotPasswordText: { fontSize: 16, color: "#4590e6ff", fontWeight: "600", textAlign: "center" },
  passwordStrengthContainer: { width: "100%", marginBottom: 16, paddingHorizontal: 4 },
  passwordStrengthBar: { height: 4, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 2, marginBottom: 8, overflow: "hidden" },
  passwordStrengthFill: { height: "100%", borderRadius: 2 },
  passwordStrengthText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});
