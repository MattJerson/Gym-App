import {
  View,
  Text,
  Image,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import FormInput from "../../components/FormInput";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";
import SubmitButton from "../../components/SubmitButton";
import React, { useState, useRef, useEffect } from "react";
import { supabase, pingSupabase } from "../../services/supabase";
import { logger } from "../../services/logger";
import { registerDeviceToken } from "../../services/notifications";
import { validateMessage } from "../../services/ChatServices";

/**
 * Determines the next onboarding step based on what data is missing
 * This makes onboarding truly dynamic - users only complete what they haven't done yet
 */
const determineNextOnboardingStep = async (profile, userId) => {
  // No profile at all - start from beginning
  if (!profile) {
    return "/features/registrationprocess";
  }

  // Check registration process completion (required fields only)
  const hasBasicInfo = 
    profile.gender && 
    profile.age && 
    profile.height_cm && 
    profile.weight_kg &&
    profile.activity_level && 
    profile.fitness_goal;
  
  const hasWorkoutPlan = 
    profile.fitness_level && 
    profile.training_location && 
    profile.training_frequency;
  
  const hasMealPlan = 
    profile.meal_type && 
    profile.calorie_goal && 
    profile.meals_per_day;

  // If registration is incomplete, route there
  if (!hasBasicInfo || !hasWorkoutPlan || !hasMealPlan) {
    return "/features/registrationprocess";
  }

  // Check bodyfat data (from bodyfat_profiles table, not registration_profiles)
  try {
    const { data: bodyfatData } = await supabase
      .from("bodyfat_profiles")
      .select("current_body_fat, goal_body_fat")
      .eq("user_id", userId)
      .maybeSingle();
    
    const hasBodyfat = 
      bodyfatData?.current_body_fat != null && 
      bodyfatData?.goal_body_fat != null;

    if (!hasBodyfat) {
      return "/features/bodyfatuser";
    }
  } catch (e) {
    logger.warn("Failed to check bodyfat data", e);
    return "/features/bodyfatuser";
  }

  // Check subscription status
  try {
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!subscription) {
      return "/features/subscriptionpackages";
    }
  } catch (e) {
    logger.warn("Failed to check subscription", e);
    return "/features/subscriptionpackages";
  }

  // Check if user has selected workouts
  try {
    const { data: userWorkouts } = await supabase
      .from("user_saved_workouts")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (!userWorkouts || userWorkouts.length === 0) {
      return "/features/selectworkouts";
    }
  } catch (e) {
    logger.warn("Failed to check user workouts", e);
    return "/features/selectworkouts";
  }

  // Check if user has selected a meal plan
  try {
    const { data: userMealPlan } = await supabase
      .from("user_meal_plans")
      .select("id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!userMealPlan) {
      return "/features/selectmealplan";
    }
  } catch (e) {
    logger.warn("Failed to check meal plan", e);
    return "/features/selectmealplan";
  }

  // All onboarding steps complete!
  return "/page/home";
};

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
      timeoutId = setTimeout(
        () => reject(new Error(`${label} timed out. Please try again.`)),
        ms
      );
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Slide animation refs for smooth transitions
  const slideInAnim = useRef(new Animated.Value(0)).current;

  /* -------------------- HANDLERS -------------------- */
  const handleToggle = async () => {
    try {
      if (Platform.OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Keyboard.dismiss();
      
      // Slide out to the right if going to signup, left if going to login
      const slideDirection = isRegistering ? -300 : 300;
      
      Animated.parallel([
        Animated.timing(formAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideInAnim, {
          toValue: slideDirection,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsRegistering((prev) => !prev);
        setNickname("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});
        
        // Reset and slide in from opposite direction
        slideInAnim.setValue(-slideDirection);
        
        Animated.parallel([
          Animated.timing(formAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(slideInAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          })
        ]).start();
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
      if (!nickname.trim()) {
        newErrors.nickname = "Nickname is required.";
      } else if (nickname.trim().length < 3) {
        newErrors.nickname = "Nickname must be at least 3 characters.";
      } else if (nickname.trim().length > 20) {
        newErrors.nickname = "Nickname must be 20 characters or less.";
      } else {
        // Check for profanity in nickname
        const validation = validateMessage(nickname);
        if (validation.hasProfanity) {
          newErrors.nickname = "Nickname contains inappropriate language.";
        }
      }
      
      if (password !== confirmPassword)
        newErrors.confirmPassword = "Passwords do not match.";
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
      if (!healthy)
        throw new Error(
          "Unable to reach the server. Check your internet connection or try again shortly."
        );

      if (isRegistering) {
        try {
          try {
            const { data, error } = await withTimeout(
              supabase.auth.signUp({
                email,
                password,
                options: { data: { nickname } },
              }),
              8000,
              "Sign up"
            );
            dlog("signup:sdk:result", {
              ok: !error,
              hasUser: !!data?.user,
              error,
            });
            if (error) {
              dlog("signup:sdk:error", error.message);
              if (
                error instanceof Error &&
                error.message?.includes("Password should be at least")
              ) {
                throw new Error("Password must be at least 6 characters.");
              }
              // Fallback: direct signup
              try {
                dlog("signup:fallback:start");
                const controller = new AbortController();
                const to = setTimeout(() => controller.abort(), 12000);
                const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: SUPABASE_ANON_KEY,
                  },
                  body: JSON.stringify({ email, password, data: { nickname } }),
                  signal: controller.signal,
                });
                clearTimeout(to);
                dlog("signup:fallback:status", res.status);
                if (!res.ok) {
                  const text = await res.text();
                  dlog("signup:fallback:error", text);
                  throw new Error(text || "Sign up failed");
                }
              } catch (e2) {
                dlog("signup:fallback:exception", e2.message);
                console.timeEnd("auth:signup");
                throw error;
              }
            }
            console.timeEnd("auth:signup");

            dlog("signup:post:metadata", { hasUser: !!data?.user });
            if (data?.user) {
              try {
                dlog("signup:post:updateUser:start");
                // Always set full_name, nickname, and display_name in user_metadata
                await withTimeout(
                  supabase.auth.updateUser({
                    data: {
                      full_name: nickname,
                      nickname,
                      display_name: nickname,
                    },
                  }),
                  8000,
                  "Profile update"
                );
                dlog("signup:post:updateUser:done");
              } catch (updateErr) {
                dlog("signup:post:updateUser:error", updateErr.message);
              }
              // Create registration_profiles row
              try {
                dlog("creating:profile:rpc:start", { userId: data.user.id });
                const { data: rpcData, error: profileError } =
                  await supabase.rpc("create_profile_for_user", {
                    user_id_param: data.user.id,
                  });
                dlog("creating:profile:rpc:done", { rpcData, profileError });
                if (profileError) {
                  dlog("profile:create:error", profileError.message);
                } else {
                  dlog("profile:created", { userId: data.user.id });
                }
              } catch (rpcErr) {
                dlog("creating:profile:rpc:exception", rpcErr.message);
              }

              // Sign in the user immediately after successful signup
              try {
                dlog("signup:post:signin:start");
                const { data: signInData, error: signInError } = await withTimeout(
                  supabase.auth.signInWithPassword({ email, password }),
                  8000,
                  "Auto sign-in after signup"
                );
                if (signInError) {
                  dlog("signup:post:signin:error", signInError.message);
                } else {
                  dlog("signup:post:signin:success");
                  
                  // Register device token for push notifications
                  try {
                    const token = await registerDeviceToken(supabase, signInData.user.id);
                    if (__DEV__ && token) {
                    }
                  } catch (tokenErr) {
                    if (__DEV__) {
                    }
                  }
                }
              } catch (signInErr) {
                dlog("signup:post:signin:exception", signInErr.message);
              }
            }
          } catch (innerErr) {
            dlog(
              "signup:catchall:exception",
              String(innerErr?.message || innerErr)
            );
            throw innerErr;
          }
        } catch (upErr) {
          dlog("signup:post:exception", upErr.message);
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
        
        if (__DEV__) {
        }

        // Register device token for push notifications
        try {
          const token = await registerDeviceToken(supabase, data.user.id);
          if (__DEV__ && token) {
          }
        } catch (tokenErr) {
          // Non-fatal - push notifications will just not work
          if (__DEV__) {
          }
        }

        // After login, if display name is missing, set it from registration_profiles or fallback to email
        dlog("login:post:updateUser:step");
        try {
          dlog("login:post:updateUser:start");
          // Try to get nickname from registration_profiles
          let nickname = null;
          try {
            const { data: profile } = await supabase
              .from("registration_profiles")
              .select("nickname")
              .eq("user_id", data.user.id)
              .maybeSingle();
            dlog("login:post:updateUser:profile", { profile });
            nickname =
              profile?.nickname || data.user.email?.split("@")[0] || "User";
          } catch (e) {
            dlog(
              "login:post:updateUser:profile:error",
              String(e?.message || e)
            );
            nickname = data.user.email?.split("@")[0] || "User";
          }
          await withTimeout(
            supabase.auth.updateUser({
              data: { full_name: nickname, nickname, display_name: nickname },
            }),
            8000,
            "Profile update (login)"
          );
          dlog("login:post:updateUser:done", { nickname });
        } catch (updateErr) {
          if (__DEV__) {
            console.error("[AUTH] Profile update error:", updateErr.message);
          }
        }

        // Check if onboarding is complete - DYNAMIC routing based on missing data
        try {
          // Ensure profile exists
          await supabase.rpc("create_profile_for_user", {
            user_id_param: data.user.id,
          });
          
          // Check onboarding status and missing data
          const { data: profile } = await supabase
            .from("registration_profiles")
            .select("*")
            .eq("user_id", data.user.id)
            .maybeSingle();
            
          // Always check what's missing, regardless of onboarding_completed flag
          // This ensures users who partially completed onboarding are routed correctly
          const nextStep = await determineNextOnboardingStep(profile, data.user.id);
          
          if (nextStep !== "/page/home") {
            logger.info(`Routing to next onboarding step: ${nextStep}`);
            router.replace(nextStep);
          } else {
            logger.info("Onboarding complete, routing to home");
            router.replace("/page/home");
          }
        } catch (err) {
          if (__DEV__) {
            console.error("[AUTH] Onboarding check error:", err.message);
          }
          // Fallback to home
          router.replace("/page/home");
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error("[AUTH] Authentication error:", error.message);
      }
      Alert.alert("Authentication error", error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------- RENDER -------------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
                pointerEvents: "none",
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.welcomeText}>
              {isRegistering ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={styles.subtitleText}>
              {isRegistering
                ? "Start your fitness journey and see your growth"
                : "Sign in to continue your fitness journey"}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: formAnim,
                transform: [
                  {
                    translateX: slideInAnim,
                  },
                ],
              },
            ]}
          >
            {isRegistering && (
              <FormInput
                placeholder="Nickname"
                value={nickname}
                onChangeText={setNickname}
                errorMessage={errors.nickname}
              />
            )}
            <FormInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              errorMessage={errors.email}
            />
            <FormInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              errorMessage={errors.password}
              textContentType="none"
              autoComplete="off"
              importantForAutofill="no"
              passwordRules="minlength: 6;"
              secureTextEntry={true}
            />

            {isRegistering && password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthBar}>
                  <View
                    style={[
                      styles.passwordStrengthFill,
                      {
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.passwordStrengthText,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.text}
                </Text>
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
                passwordRules="minlength: 6;"
                secureTextEntry={true}
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

            <Pressable style={styles.toggleContainer} onPress={handleToggle}>
              <Text style={styles.toggleText}>
                {isRegistering
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Text style={styles.toggleTextHighlight}>
                  {isRegistering ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </Pressable>

            {!isRegistering && (
              <Pressable
                style={styles.forgotPasswordContainer}
                onPress={() => router.push("/auth/passwordresetprocess")}
              >
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
  keyboardAvoidingView: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  content: { width: "100%", alignItems: "center", maxWidth: 400 },
  headerSection: { position: "absolute", alignItems: "center" },
  logoContainer: { alignItems: "center", justifyContent: "center" },
  logo: { width: 180, height: 180, resizeMode: "contain" },
  welcomeText: {
    fontSize: 32,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  submitButtonSolid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: "#5994d7ff",
  },
  subtitleText: {
    fontSize: 12,
    color: "#999",
    maxWidth: 280,
    lineHeight: 22,
    textAlign: "center",
  },
  formContainer: { width: "100%", alignItems: "center", marginTop: 280 },
  toggleContainer: { paddingVertical: 16 },
  toggleText: { fontSize: 16, color: "#999", textAlign: "center" },
  toggleTextHighlight: { color: "#4590e6ff", fontWeight: "bold" },
  forgotPasswordContainer: { paddingVertical: 12 },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4590e6ff",
    textAlign: "center",
  },
  passwordStrengthContainer: {
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  passwordStrengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  passwordStrengthFill: { height: "100%", borderRadius: 2 },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
