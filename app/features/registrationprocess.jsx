import {
  View,
  Text,
  Platform,
  Keyboard,
  StatusBar,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { logger } from "../../services/logger";
import { supabase } from "../../services/supabase";
import { LinearGradient } from "expo-linear-gradient";
import SubmitButton from "../../components/SubmitButton";
import React, { useState, useRef, useEffect } from "react";
import FormStep from "../../components/onboarding/FormStep";
import FoodTags from "../../components/onboarding/FoodTags";
import HeaderBar from "../../components/onboarding/HeaderBar";
import ProgressBar from "../../components/onboarding/ProgressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TwoColumnFields from "../../components/onboarding/TwoColumnFields";

const formConfig = [
  {
    title: "Basic Info",
    subtitle: "Tell us about yourself",
    fields: [
      {
        key: "gender",
        label: "Please select your gender",
        type: "dropdown",
        placeholder: "Gender",
        zIndex: 3000,
        required: true,
        items: [
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ],
      },
      {
        key: "age",
        label: "What is your age?",
        type: "text",
        placeholder: "Age",
        keyboardType: "numeric",
        validation: { min: 13, max: 120, required: true },
        returnKeyType: "next",
      },

      {
        key: "height",
        label: "What is your height?",
        type: "text",
        placeholder: ["Height", "Height"],
        unit: ["cm", "ft"],
        dependsOn: "useMetric",
        keyboardType: "numeric",
        validation: {
          min: 100,
          max: 250,
          minImperial: 36,
          maxImperial: 96,
          required: true,
        },
        returnKeyType: "next",
      },
      {
        key: "weight",
        label: "What is your weight?",
        type: "text",
        placeholder: ["Weight", "Weight"],
        unit: ["kg", "lbs"],
        dependsOn: "useMetric",
        keyboardType: "numeric",
        validation: {
          min: 30,
          max: 300,
          minImperial: 66,
          maxImperial: 660,
          required: true,
        },
        returnKeyType: "next",
      },
      { key: "useMetric", label: "Use Metric Units", type: "switch" },
      {
        key: "activityLevel",
        label: "Select your activity level",
        type: "dropdown",
        placeholder: "Activity Level",
        zIndex: 2000,
        required: true,
        items: [
          { label: "Sedentary", value: "sedentary" },
          { label: "Lightly Active", value: "light" },
          { label: "Moderately Active", value: "moderate" },
          { label: "Very Active", value: "active" },
        ],
      },
      {
        key: "fitnessGoal",
        label: "What is your fitness goal?",
        type: "dropdown",
        placeholder: "Fitness Goal",
        zIndex: 1000,
        required: true,
        items: [
          { label: "Lose Weight", value: "lose" },
          { label: "Maintain Weight", value: "maintain" },
          { label: "Gain Muscle", value: "gain" },
        ],
      },
    ],
  },
  {
    title: "Workout Plan",
    subtitle: "Training preferences",
    fields: [
      {
        key: "fitnessLevel",
        label: "What's your fitness level?",
        type: "dropdown",
        placeholder: "Select Fitness Level",
        zIndex: 6000,
        required: true,
        items: [
          { label: "Beginner", value: "basic" },
          { label: "Intermediate", value: "intermediate" },
          { label: "Advanced", value: "advanced" },
        ],
      },
      {
        key: "trainingLocation",
        label: "Where do you train?",
        type: "dropdown",
        placeholder: "Select Location",
        zIndex: 5000,
        required: true,
        items: [
          { label: "At Home", value: "home" },
          { label: "At the Gym", value: "gym" },
        ],
      },
      {
        key: "trainingDuration",
        label: "How long do you train?",
        type: "dropdown",
        placeholder: "Select Duration",
        zIndex: 4000,
        required: true,
        items: [
          { label: "20 mins", value: "20" },
          { label: "30 mins", value: "30" },
          { label: "45 mins", value: "45" },
          { label: "60 mins", value: "60" },
          { label: "90+ mins", value: "90+" },
        ],
      },
      {
        key: "muscleFocus",
        label: "Interested in growing specific muscles?",
        type: "multi-button",
        placeholder: "Select Muscle Groups",
        required: false,
        items: [
          { label: "General Growth", value: "general" },
          { label: "Legs & Glutes", value: "legs_glutes" },
          { label: "Back", value: "back" },
          { label: "Chest", value: "chest" },
          { label: "Shoulders & Arms", value: "shoulders_arms" },
          { label: "Core", value: "core" },
        ],
      },
      {
        key: "injuries",
        label: "Any current injuries?",
        type: "dropdown",
        placeholder: "Select Injuries (Optional)",
        zIndex: 2000,
        multiple: true,
        required: false,
        items: [
          { label: "Lower Back", value: "lower_back" },
          { label: "Knees", value: "knees" },
          { label: "Shoulder", value: "shoulder" },
          { label: "Wrist", value: "wrist" },
          { label: "Ankle", value: "ankle" },
        ],
      },
      {
        key: "trainingFrequency",
        label: "How often do you want to train?",
        type: "dropdown",
        placeholder: "Select Frequency",
        zIndex: 1000,
        required: true,
        items: [
          { label: "2 days/week", value: "2" },
          { label: "3 days/week", value: "3" },
          { label: "4 days/week", value: "4" },
          { label: "5 days/week", value: "5" },
          { label: "6 days/week", value: "6" },
        ],
      },
    ],
  },
  {
    title: "Meal Plan",
    subtitle: "Nutrition preferences",
    fields: [
      {
        key: "mealType",
        label: "What's your meal preference?",
        type: "dropdown",
        placeholder: "Meal Preference",
        zIndex: 3000,
        required: true,
        items: [
          { label: "Omnivore", value: "omnivore" },
          { label: "Vegetarian", value: "vegetarian" },
          { label: "Vegan", value: "vegan" },
          { label: "Pescatarian", value: "pescatarian" },
        ],
      },
      {
        key: "calorieGoal",
        label: "Your Recommended Daily Calories",
        type: "calculated",
        placeholder: "Calculated based on your profile",
        helpText: "Based on your BMR (Basal Metabolic Rate) and activity level",
        readOnly: true,
      },
      {
        key: "mealsPerDay",
        label: "How many meals per day?",
        type: "text",
        placeholder: "Meals per Day",
        keyboardType: "numeric",
        validation: { min: 1, max: 8, required: true },
        returnKeyType: "next",
      },
      {
        key: "restrictions",
        label: "Any dietary restrictions?",
        type: "dropdown",
        placeholder: "Dietary Restrictions (Optional)",
        zIndex: 2000,
        multiple: true,
        required: false,
        items: [
          { label: "Gluten-Free", value: "gluten-free" },
          { label: "Dairy-Free", value: "dairy-free" },
          { label: "Nut-Free", value: "nut-free" },
          { label: "Soy-Free", value: "soy-free" },
        ],
      },
    ],
  },
];

// Calculate BMR and TDEE based on user data
const calculateDailyCalories = (formData) => {
  const { gender, age, height, weight, activityLevel, useMetric } = formData;

  // Return null if required fields are missing
  if (!gender || !age || !height || !weight || !activityLevel) {
    return null;
  }

  const ageNum = parseInt(age, 10);
  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);

  if (isNaN(ageNum) || isNaN(heightNum) || isNaN(weightNum)) {
    return null;
  }

  // Convert to metric if needed
  const heightCm = useMetric ? heightNum : heightNum * 2.54; // inches to cm
  const weightKg = useMetric ? weightNum : weightNum * 0.453592; // lbs to kg

  // Calculate BMR using Mifflin-St Jeor equation
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5;
  } else if (gender === 'female') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) - 161;
  } else {
    // For "other", use average of male and female
    const maleBmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5;
    const femaleBmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) - 161;
    bmr = (maleBmr + femaleBmr) / 2;
  }

  // Apply activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = bmr * multiplier;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    recommended: Math.round(tdee), // Default recommendation is maintenance (TDEE)
  };
};

// Validation utilities
const validateField = (field, value, useMetric = true) => {
  // Skip validation for calculated fields
  if (field.type === "calculated") {
    return null;
  }

  // Check if field is required (can be set at field level or in validation)
  const isRequired = field.required || field.validation?.required;

  // Handle dropdown fields
  if (field.type === "dropdown") {
    if (isRequired && (!value || value === "")) {
      return "This field is required";
    }
    return null;
  }

  // Handle multi-button fields (array)
  if (field.type === "multi-button") {
    if (isRequired && (!value || !Array.isArray(value) || value.length === 0)) {
      return "Please select at least one option";
    }
    return null;
  }

  // Handle text input fields
  if (!field.validation) return null;

  const { min, max, minImperial, maxImperial, required } = field.validation;

  if ((isRequired || required) && (!value || value.trim() === "")) {
    return "This field is required";
  }

  if (!value || value.trim() === "") return null;

  if (field.keyboardType === "numeric") {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "Please enter a valid number";

    const minVal = useMetric ? min : minImperial || min;
    const maxVal = useMetric ? max : maxImperial || max;

    if (minVal && numValue < minVal) {
      const unit = field.unit ? ` ${field.unit[useMetric ? 0 : 1]}` : "";
      return `Minimum value is ${minVal}${unit}`;
    }
    if (maxVal && numValue > maxVal) {
      const unit = field.unit ? ` ${field.unit[useMetric ? 0 : 1]}` : "";
      return `Maximum value is ${maxVal}${unit}`;
    }
  }

  return null;
};

const getInitialState = () => {
  let initialState = {};
  formConfig.forEach((step) => {
    step.fields.forEach((field) => {
      if (field.type === "switch") initialState[field.key] = true;
      else if (field.multiple || field.type === "multi-button")
        initialState[field.key] = [];
      else initialState[field.key] = "";
    });
  });
  return initialState;
};

const getInitialErrors = () => {
  let initialErrors = {};
  formConfig.forEach((step) => {
    step.fields.forEach((field) => {
      initialErrors[field.key] = null;
    });
  });
  return initialErrors;
};

export default function BasicInfo() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState(getInitialErrors());
  const [openDropdown, setOpenDropdown] = useState("");
  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState([]);
  const [foodError, setFoodError] = useState("");

  // Input refs for navigation
  const inputRefs = useRef({});

  // Auto-calculate daily calories when relevant fields change
  useEffect(() => {
    const calories = calculateDailyCalories(formData);
    if (calories && calories.recommended) {
      // Only update if the value actually changed to avoid infinite loops
      if (formData.calorieGoal !== calories.recommended.toString()) {
        setFormData((prev) => ({
          ...prev,
          calorieGoal: calories.recommended.toString(),
        }));
      }
    }
  }, [
    formData.gender,
    formData.age,
    formData.height,
    formData.weight,
    formData.activityLevel,
    formData.useMetric,
  ]);

  // Hydrate saved progress on mount (prioritize database data over AsyncStorage)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // First, try to get existing data from database
        const userResp = await supabase.auth.getUser();
        const userId = userResp?.data?.user?.id;

        if (userId) {
          // Load existing registration data from database
          const { data: existingProfile, error: profileError } = await supabase
            .from("registration_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (cancelled) return;

          if (!profileError && existingProfile) {
            logger.info("Loading existing registration data from database");
            
            // Map database columns to form state
            const dbFormData = {
              gender: existingProfile.gender || "",
              age: existingProfile.age?.toString() || "",
              height: existingProfile.height_cm?.toString() || "",
              weight: existingProfile.weight_kg?.toString() || "",
              useMetric: existingProfile.use_metric !== false,
              activityLevel: existingProfile.activity_level || "",
              fitnessGoal: existingProfile.fitness_goal || "",
              fitnessLevel: existingProfile.fitness_level || "",
              trainingLocation: existingProfile.training_location || "",
              trainingDuration: existingProfile.training_duration?.toString() || "",
              muscleFocus: Array.isArray(existingProfile.muscle_focus) 
                ? existingProfile.muscle_focus 
                : [],
              injuries: Array.isArray(existingProfile.injuries) 
                ? existingProfile.injuries 
                : [],
              trainingFrequency: existingProfile.training_frequency || "",
              mealType: existingProfile.meal_type || "",
              restrictions: Array.isArray(existingProfile.restrictions) 
                ? existingProfile.restrictions 
                : [],
              mealsPerDay: existingProfile.meals_per_day?.toString() || "",
              calorieGoal: existingProfile.calorie_goal?.toString() || "",
              favoriteFoods: Array.isArray(existingProfile.favorite_foods) 
                ? existingProfile.favorite_foods 
                : [],
            };

            // Merge with initial state to ensure all keys exist
            const initial = getInitialState();
            const merged = { ...initial, ...dbFormData };
            setFormData(merged);
            setFoods(dbFormData.favoriteFoods);

            // Determine which step to start on based on data completeness
            // Only consider truly required fields (not optional ones like injuries, restrictions)
            let startStep = 0;
            
            // Step 0: Basic Info - Check required fields only
            const hasBasicInfo = 
              existingProfile.gender && 
              existingProfile.age && 
              existingProfile.height_cm && 
              existingProfile.weight_kg &&
              existingProfile.activity_level && 
              existingProfile.fitness_goal;
            
            // Step 1: Workout Plan - Check required fields (not injuries which is optional)
            const hasWorkoutPlan = 
              existingProfile.fitness_level && 
              existingProfile.training_location && 
              existingProfile.training_frequency;
            
            // Step 2: Meal Plan - Check required fields (not restrictions which is optional)
            const hasMealPlan = 
              existingProfile.meal_type && 
              existingProfile.calorie_goal && 
              existingProfile.meals_per_day;
            
            // Determine starting step based on completion
            if (hasBasicInfo && hasWorkoutPlan && hasMealPlan) {
              // All steps complete - go to last step to review
              startStep = 2;
            } else if (hasBasicInfo && hasWorkoutPlan) {
              // Basic and workout done, need meal plan
              startStep = 2;
            } else if (hasBasicInfo) {
              // Only basic done, need workout plan
              startStep = 1;
            } else {
              // Nothing done or incomplete basic info
              startStep = 0;
            }
            
            setStep(startStep);
            logger.info(`Starting at step ${startStep} based on existing data (Basic: ${hasBasicInfo}, Workout: ${hasWorkoutPlan}, Meal: ${hasMealPlan})`);
            return; // Skip AsyncStorage if we have database data
          }
        }

        // Fallback to AsyncStorage if no database data
        const [savedStr, savedStepStr] = await Promise.all([
          AsyncStorage.getItem("onboarding:registration"),
          AsyncStorage.getItem("onboarding:registration:step"),
        ]);
        if (cancelled) return;
        if (savedStr) {
          const parsed = JSON.parse(savedStr);
          // Backward compatibility: ensure all keys exist
          const initial = getInitialState();
          const merged = { ...initial, ...parsed };
          setFormData(merged);
          setFoods(
            Array.isArray(parsed.favoriteFoods) ? parsed.favoriteFoods : []
          );
          logger.info("Restored registration draft from storage");
        }
        if (savedStepStr) {
          const savedStep = parseInt(savedStepStr, 10);
          if (!Number.isNaN(savedStep)) {
            setStep(Math.min(Math.max(savedStep, 0), formConfig.length - 1));
          }
        }
      } catch (e) {
        logger.warn("Failed to restore registration draft", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Haptic feedback function
  const lightHaptic = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Helper function to get placeholder with units
  const getPlaceholder = (field) => {
    let placeholder = Array.isArray(field.placeholder)
      ? formData.useMetric
        ? field.placeholder[0]
        : field.placeholder[1]
      : field.placeholder;

    if (field.unit) {
      const unit = Array.isArray(field.unit)
        ? formData.useMetric
          ? field.unit[0]
          : field.unit[1]
        : field.unit;
      placeholder += ` (${unit})`;
    }

    return placeholder;
  };

  // Input change handler
  const handleInputChange = (key, value) => {
    lightHaptic();
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleFieldBlur = (fieldKey) => {
    const currentStep = formConfig[step];
    const field = currentStep.fields.find((f) => f.key === fieldKey);

    if (field) {
      const error = validateField(
        field,
        formData[fieldKey],
        formData.useMetric
      );
      setErrors((prev) => ({ ...prev, [fieldKey]: error }));
    }
  };

  const handleDropdownOpen = (fieldKey) => {
    Keyboard.dismiss();
    lightHaptic();
    setOpenDropdown(openDropdown === fieldKey ? "" : fieldKey);
  };

  const addFood = () => {
    const trimmed = foodInput.trim();

    // Clear previous errors
    setFoodError("");

    // Don't add if empty
    if (!trimmed) return;

    // Check if only numbers
    if (/^\d+$/.test(trimmed)) {
      setFoodError("Food name cannot be only numbers");
      return;
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = foods.some(
      (food) => food.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setFoodError("You've already added this food");
      return;
    }

    // All good - add the food
    lightHaptic();
    setFoods((prev) => [...prev, trimmed]);
    setFoodInput("");
    setFoodError("");
  };

  const removeFood = (index) => {
    lightHaptic();
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const validateCurrentStep = () => {
    const currentStep = formConfig[step];
    let stepErrors = {};
    let hasErrors = false;

    currentStep.fields.forEach((field) => {
      const error = validateField(
        field,
        formData[field.key],
        formData.useMetric
      );
      if (error) {
        stepErrors[field.key] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
    }

    return !hasErrors;
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    lightHaptic();

    // Validate current step
    if (!validateCurrentStep()) {
      setIsLoading(false);
      return;
    }

    // Persist current step data
    try {
      const toSave = { ...formData, favoriteFoods: foods };
      await Promise.all([
        AsyncStorage.setItem("onboarding:registration", JSON.stringify(toSave)),
        AsyncStorage.setItem("onboarding:registration:step", String(step)),
      ]);
    } catch (e) {
      logger.warn("Failed to persist registration data", e);
    }

    if (step === formConfig.length - 1) {
      // Final step - save to Supabase
      const finalData = {
        ...formData,
        favoriteFoods: foods,
      };
      logger.debug("Final registration form", finalData);

      try {
        const userResp = await supabase.auth.getUser();
        const userId = userResp?.data?.user?.id;

        if (!userId) {
          logger.info("No authenticated user - skipping remote save.");
          router.replace("../features/bodyfatuser");
          return;
        }

        const payload = {
          user_id: userId,
          gender: finalData.gender || null,
          age: finalData.age ? parseInt(finalData.age, 10) : null,
          height_cm: finalData.height ? parseInt(finalData.height, 10) : null,
          weight_kg: finalData.weight ? parseFloat(finalData.weight) : null,
          use_metric:
            finalData.useMetric === undefined ? true : !!finalData.useMetric,
          activity_level: finalData.activityLevel || null,
          fitness_goal: finalData.fitnessGoal || null,
          favorite_foods: finalData.favoriteFoods || null,
          fitness_level: finalData.fitnessLevel || null,
          training_location: finalData.trainingLocation || null,
          training_duration: finalData.trainingDuration
            ? finalData.trainingDuration === "90+"
              ? 90
              : parseInt(finalData.trainingDuration, 10)
            : null,
          muscle_focus: finalData.muscleFocus || null,
          injuries: finalData.injuries || null,
          training_frequency: finalData.trainingFrequency || null,
          meal_type: finalData.mealType || null,
          restrictions: finalData.restrictions || null,
          meals_per_day: finalData.mealsPerDay
            ? parseInt(finalData.mealsPerDay, 10)
            : null,
          calorie_goal: finalData.calorieGoal
            ? parseInt(finalData.calorieGoal, 10)
            : null,
          details: {},
        };

        logger.info("Saving registration to Supabase for user", userId);
        const { data, error } = await supabase
          .from("registration_profiles")
          .upsert(payload, {
            onConflict: "user_id",
            returning: "representation",
          });

        if (error) {
          logger.error("Failed to save registration_profiles:", error);
          Alert.alert(
            "Save failed",
            error.message || "Failed to save registration to server"
          );
          setIsLoading(false);
          return;
        } else {
          logger.info("Registration saved to Supabase successfully");
          await Promise.all([
            AsyncStorage.removeItem("onboarding:registration"),
            AsyncStorage.removeItem("onboarding:registration:step"),
          ]);
        }

        // Check if bodyfat data already exists
        const { data: existingBodyFat } = await supabase
          .from("bodyfat_profiles")
          .select("current_body_fat, goal_body_fat")
          .eq("user_id", userId)
          .single();

        const hasBodyFatData = 
          existingBodyFat?.current_body_fat != null && 
          existingBodyFat?.goal_body_fat != null;

        if (hasBodyFatData) {
          logger.info("Bodyfat data already exists, checking subscription...");
          
          // Check if subscription already exists
          const { data: existingSubscription } = await supabase
            .from("user_subscriptions")
            .select("id, status")
            .eq("user_id", userId)
            .eq("status", "active")
            .single();

          if (existingSubscription) {
            logger.info("Active subscription found, skipping to workout selection");
            setIsLoading(false);
            router.replace("../features/selectworkouts");
            return;
          } else {
            logger.info("No active subscription, routing to subscription packages");
            setIsLoading(false);
            router.replace("../features/subscriptionpackages");
            return;
          }
        } else {
          logger.info("No bodyfat data found, routing to bodyfat page");
          setIsLoading(false);
          router.replace("../features/bodyfatuser");
          return;
        }
      } catch (err) {
        logger.error("Unexpected error saving registration:", err);
        Alert.alert("Save error", "Unexpected error saving registration");
        setIsLoading(false);
      }
    } else {
      // Move to next step
      const nextStep = step + 1;
      setStep(nextStep);
      // Persist step advance eagerly for crash safety
      AsyncStorage.setItem(
        "onboarding:registration:step",
        String(nextStep)
      ).catch(() => {});
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    if (step > 0) {
      lightHaptic();
      setStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  // Get current step fields
  const currentStep = formConfig[step];
  const heightField = currentStep.fields.find((f) => f.key === "height");
  const weightField = currentStep.fields.find((f) => f.key === "weight");
  const useMetricField = currentStep.fields.find((f) => f.key === "useMetric");
  const regularFields = currentStep.fields.filter(
    (f) => !["height", "weight", "useMetric"].includes(f.key)
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
        <LinearGradient colors={["#0B0B0B", "#1a1a1a"]} style={styles.gradient}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <SafeAreaView style={styles.safeArea}>
              <HeaderBar
                title={currentStep.title}
                currentStep={step + 1}
                totalSteps={formConfig.length}
                onBackPress={handleBackPress}
                onHapticFeedback={lightHaptic}
              />

              <ProgressBar
                currentStep={step + 1}
                totalSteps={formConfig.length}
              />
              {currentStep.subtitle && (
                <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
              )}

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Height/Weight two-column section */}
                {heightField && weightField && useMetricField && (
                  <>
                    <Text style={styles.sectionLabel}>
                      What is your height & weight?
                    </Text>
                    <TwoColumnFields
                      heightField={heightField}
                      weightField={weightField}
                      useMetricField={useMetricField}
                      formData={formData}
                      errors={errors}
                      handleInputChange={handleInputChange}
                      handleFieldBlur={handleFieldBlur}
                      inputRefs={inputRefs}
                      getPlaceholder={getPlaceholder}
                    />
                  </>
                )}

                {/* Regular fields */}
                {regularFields.map((field, index) => {
                  const isLastField = index === regularFields.length - 1;
                  return (
                    <View
                      key={field.key}
                      style={[
                        styles.fieldContainer,
                        isLastField && styles.lastFieldContainer,
                      ]}
                    >
                      {field.type !== "switch" && (
                        <Text style={styles.questionLabel}>{field.label}</Text>
                      )}
                      <FormStep
                        step={{ fields: [field] }}
                        formData={formData}
                        errors={errors}
                        openDropdown={openDropdown}
                        handleInputChange={handleInputChange}
                        handleFieldBlur={handleFieldBlur}
                        handleDropdownOpen={handleDropdownOpen}
                        onHapticFeedback={lightHaptic}
                        inputRefs={inputRefs}
                        getPlaceholder={getPlaceholder}
                      />
                    </View>
                  );
                })}

                {/* Food section for last step */}
                {step === formConfig.length - 1 && (
                  <FoodTags
                    foodInput={foodInput}
                    setFoodInput={setFoodInput}
                    foods={foods}
                    addFood={addFood}
                    removeFood={removeFood}
                    error={foodError}
                    onHapticFeedback={lightHaptic}
                  />
                )}
              </ScrollView>

              <View style={styles.footer}>
                <Text style={styles.disclaimer}>
                  Want to change something? You can customize everything later
                  in your profile.
                </Text>
                <SubmitButton
                  title={
                    step === formConfig.length - 1
                      ? "Submit Info"
                      : "Continue"
                  }
                  onPress={handleNextStep}
                  isLoading={isLoading}
                  disabled={isLoading}
                />
              </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for footer
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    color: "#999",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 16,
    marginTop: 8,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "600",
  },
  fieldContainer: {
    marginBottom: 2,
  },
  lastFieldContainer: {
    marginBottom: 20, // Extra space after last field to prevent dropdown overlap
  },
  questionLabel: {
    fontSize: 16,
    marginTop: 6,
    color: "#fff",
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  footer: {
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 24,
    borderTopWidth: 1,
    paddingVertical: 16,
    position: "absolute",
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
});
