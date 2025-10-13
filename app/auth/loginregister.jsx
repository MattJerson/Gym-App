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
import FormInput from "../../components/FormInput";
import SubmitButton from "../../components/SubmitButton";
import { supabase, pingSupabase } from "../../services/supabase";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";

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
      dlog("handleSubmit start", {
        isRegistering,
        emailMasked: email?.replace(/(.{2}).+(@.*)/, "$1***$2"),
      });
      setIsLoading(true);
      if (Platform.OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      console.time("auth:ping");
      const healthy = await pingSupabase(4000);
      console.timeEnd("auth:ping");
      dlog("pingSupabase", { healthy });
      if (!healthy) throw new Error("Unable to reach the server. Check your internet connection or try again shortly.");

      // Log Supabase client status
      if (__DEV__) {
        try {
          dlog("getSession:start");
          const { data: { session } } = await supabase.auth.getSession();
          dlog("existing-session", { hasSession: !!session, userId: session?.user?.id });
        } catch (e) {
          dlog("session-check-error", e.message);
        }
      }

      if (isRegistering) {
        dlog("signup:begin");
        try {
          try {
            console.time("auth:signup");
            dlog("signup:calling:supabase.auth.signUp", { email });
            const { data, error } = await withTimeout(
              supabase.auth.signUp({ email, password, options: { data: { nickname } } }),
              8000,
              "Sign up"
            );
            dlog("signup:sdk:result", { ok: !error, hasUser: !!data?.user, error });
            if (error) {
              dlog("signup:sdk:error", error.message);
              if (error instanceof Error && error.message?.includes("Password should be at least")) {
                throw new Error("Password must be at least 6 characters.");
              }
              // Fallback: direct signup
              try {
                dlog("signup:fallback:start");
                const controller = new AbortController();
                const to = setTimeout(() => controller.abort(), 12000);
                const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
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
                  supabase.auth.updateUser({ data: { full_name: nickname, nickname, display_name: nickname } }),
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
                const { data: rpcData, error: profileError } = await supabase.rpc('create_profile_for_user', {
                  user_id_param: data.user.id
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
            }
          } catch (innerErr) {
            dlog("signup:catchall:exception", String(innerErr?.message || innerErr));
            throw innerErr;
          }
        } catch (upErr) {
          dlog("signup:post:exception", upErr.message);
          console.warn("Failed to update user metadata:", upErr);
        }

        router.push("/features/registrationprocess");
      } else {
        // SDK sign-in with timeout
        dlog("signin:start");
        dlog("Supabase URL/ANON", { url: SUPABASE_URL, anon: SUPABASE_ANON_KEY });
        console.time("auth:signin");
        const { data, error: sdkErr } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          15000,
          "Sign in"
        );
        console.timeEnd("auth:signin");
        if (sdkErr) {
          dlog("signin:sdk:fail", { 
            message: sdkErr.message, 
            status: sdkErr.status,
            code: sdkErr.code,
            name: sdkErr.name
          });
          throw sdkErr;
        }
        dlog("signin:sdk:ok", { userId: data?.user?.id });

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
            nickname = profile?.nickname || data.user.email?.split("@") [0] || "User";
          } catch (e) {
            dlog("login:post:updateUser:profile:error", String(e?.message || e));
            nickname = data.user.email?.split("@") [0] || "User";
          }
          await withTimeout(
            supabase.auth.updateUser({ data: { full_name: nickname, nickname, display_name: nickname } }),
            8000,
            "Profile update (login)"
          );
          dlog("login:post:updateUser:done", { nickname });
        } catch (updateErr) {
          dlog("login:post:updateUser:error", String(updateErr?.message || updateErr));
        }

        // Check if onboarding is complete (with DB function, profile will be created if missing)
        dlog("onboarding:check:step");
        try {
          // First, ensure profile exists (for existing users who signed up before this fix)
          dlog("ensuring:profile:rpc:start", { userId: data.user.id });
          const { data: rpcData, error: rpcError } = await supabase.rpc('create_profile_for_user', {
            user_id_param: data.user.id
          });
          dlog("ensuring:profile:rpc:done", { rpcData, rpcError });
          // Now check onboarding status
          dlog("profile:check:select:start", { userId: data.user.id });
          const { data: profile, error: selectError } = await supabase
            .from("registration_profiles")
            .select("onboarding_completed")
            .eq("user_id", data.user.id)
            .maybeSingle();
          dlog("profile:check:select:done", { hasProfile: !!profile, onboardingComplete: profile?.onboarding_completed, selectError });
          if (!profile || !profile.onboarding_completed) {
            // Onboarding not complete, go to registration flow
            dlog("nav:to:registrationprocess");
            try {
              router.replace("/features/registrationprocess");
              dlog("nav:to:registrationprocess:done");
            } catch (navErr) {
              dlog("nav:to:registrationprocess:error", String(navErr?.message || navErr));
            }
          } else {
            // Onboarding complete, go to home
            dlog("nav:to:home");
            try {
              router.replace("/page/home");
              dlog("nav:to:home:done");
            } catch (navErr) {
              dlog("nav:to:home:error", String(navErr?.message || navErr));
            }
          }
        } catch (err) {
          dlog("profile:check:exception", String(err?.message || err));
          try {
            router.replace("/features/registrationprocess");
            dlog("profile:check:exception:navdone");
          } catch (navErr) {
            dlog("profile:check:exception:naverror", String(navErr?.message || navErr));
          }
        }
      }
    } catch (error) {
      dlog("Authentication error:", String(error?.message || error));
      Alert.alert("Authentication error", error.message || "An error occurred");
    } finally {
      dlog("handleSubmit:end");
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
