import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import { Alert } from 'react-native';
import { logger } from "../../services/logger";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { mapProfileToFormData, getNextOnboardingStep } from "../../utils/onboardingFlow";
import SubmitButton from "../../components/SubmitButton";
import HeaderBar from "../../components/onboarding/HeaderBar";
import ProgressBar from "../../components/onboarding/ProgressBar";
import FormStep from "../../components/onboarding/FormStep";
import TwoColumnFields from "../../components/onboarding/TwoColumnFields";
import FoodTags from "../../components/onboarding/FoodTags";

const formConfig = [
  {
    title: "Basic Info",
    subtitle: "Tell us about yourself",
    fields: [
      { key: "gender", label: "Please select your gender", type: "dropdown", placeholder: "Gender", zIndex: 3000, items: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }] },
      { key: "age", label: "What is your age?", type: "text", placeholder: "Age", keyboardType: "numeric", validation: { min: 13, max: 120, required: false }, returnKeyType: "next" },
      
      { key: "height", label: "What is your height?", type: "text", placeholder: ["Height", "Height"], unit: ["cm", "ft"], dependsOn: "useMetric", keyboardType: "numeric", validation: { min: 100, max: 250, minImperial: 36, maxImperial: 96, required: false }, returnKeyType: "next" },
      { key: "weight", label: "What is your weight?", type: "text", placeholder: ["Weight", "Weight"], unit: ["kg", "lbs"], dependsOn: "useMetric", keyboardType: "numeric", validation: { min: 30, max: 300, minImperial: 66, maxImperial: 660, required: false }, returnKeyType: "next" },
      { key: "useMetric", label: "Use Metric Units", type: "switch" },
      { key: "activityLevel", label: "Select your activity level", type: "dropdown", placeholder: "Activity Level", zIndex: 2000, items: [{ label: "Sedentary", value: "sedentary" }, { label: "Lightly Active", value: "light" }, { label: "Moderately Active", value: "moderate" }, { label: "Very Active", value: "active" }] },
      { key: "fitnessGoal", label: "What is your fitness goal?", type: "dropdown", placeholder: "Fitness Goal", zIndex: 1000, items: [{ label: "Lose Weight", value: "lose" }, { label: "Maintain Weight", value: "maintain" }, { label: "Gain Muscle", value: "gain" }] },
    ],
  },
  {
    title: "Workout Plan",
    subtitle: "Training preferences",
    fields: [
      { key: "fitnessLevel", label: "What's your fitness level?", type: "dropdown", placeholder: "Select Fitness Level", zIndex: 6000, items: [{ label: "Beginner", value: "basic" }, { label: "Intermediate", value: "intermediate" }, { label: "Advanced", value: "advanced" }] },
      { key: "trainingLocation", label: "Where do you train?", type: "dropdown", placeholder: "Select Location", zIndex: 5000, items: [{ label: "At Home", value: "home" }, { label: "At the Gym", value: "gym" }] },
      { key: "trainingDuration", label: "How long do you train?", type: "dropdown", placeholder: "Select Duration", zIndex: 4000, items: [{ label: "20 mins", value: "20" }, { label: "30 mins", value: "30" }, { label: "45 mins", value: "45" }, { label: "60 mins", value: "60" }, { label: "90+ mins", value: "90+" }] },
      { key: "muscleFocus", label: "Interested in growing specific muscles?", type: "multi-button", placeholder: "Select Muscle Groups", items: [{ label: "General Growth", value: "general" }, { label: "Legs & Glutes", value: "legs_glutes" }, { label: "Back", value: "back" }, { label: "Chest", value: "chest" }, { label: "Shoulders & Arms", value: "shoulders_arms" }, { label: "Core", value: "core" }] },
      { key: "injuries", label: "Any current injuries?", type: "dropdown", placeholder: "Select Injuries (Leave Blank if empty)", zIndex: 2000, multiple: true, items: [{ label: "Lower Back", value: "lower_back" }, { label: "Knees", value: "knees" }, { label: "Shoulder", value: "shoulder" }, { label: "Wrist", value: "wrist" }, { label: "Ankle", value: "ankle" }] },
      { key: "trainingFrequency", label: "How often do you want to train?", type: "dropdown", placeholder: "Select Frequency", zIndex: 1000, items: [{ label: "2 days/week", value: "2" }, { label: "3 days/week", value: "3" }, { label: "4 days/week", value: "4" }, { label: "5 days/week", value: "5" }, { label: "6 days/week", value: "6" }] },
    ],
  },
  {
    title: "Meal Plan",
    subtitle: "Nutrition preferences",
    fields: [
      { key: "mealType", label: "What's your meal preference?", type: "dropdown", placeholder: "Meal Preference", zIndex: 3000, items: [{ label: "Omnivore", value: "omnivore" }, { label: "Vegetarian", value: "vegetarian" }, { label: "Vegan", value: "vegan" }, { label: "Pescatarian", value: "pescatarian" }] },
      { key: "calorieGoal", label: "What is your daily calorie goal?", type: "text", placeholder: "Daily Calorie Goal", keyboardType: "numeric", validation: { min: 800, max: 5000, required: false }, returnKeyType: "next" },
      { key: "mealsPerDay", label: "How many meals per day?", type: "text", placeholder: "Meals per Day", keyboardType: "numeric", validation: { min: 1, max: 8, required: false }, returnKeyType: "next" },
      { key: "restrictions", label: "Any dietary restrictions?", type: "dropdown", placeholder: "Dietary Restrictions", zIndex: 2000, multiple: true, items: [{ label: "Gluten-Free", value: "gluten-free" }, { label: "Dairy-Free", value: "dairy-free" }, { label: "Nut-Free", value: "nut-free" }, { label: "Soy-Free", value: "soy-free" }] },
    ],
  },
];

// Validation utilities
const validateField = (field, value, useMetric = true) => {
  if (!field.validation) return null;
  
  const { min, max, minImperial, maxImperial, required } = field.validation;
  
  if (required && (!value || value.trim() === '')) {
    return 'This field is required';
  }
  
  if (!value || value.trim() === '') return null;
  
  if (field.keyboardType === 'numeric') {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'Please enter a valid number';
    
    const minVal = useMetric ? min : (minImperial || min);
    const maxVal = useMetric ? max : (maxImperial || max);
    
    if (minVal && numValue < minVal) {
      const unit = field.unit ? ` ${field.unit[useMetric ? 0 : 1]}` : '';
      return `Minimum value is ${minVal}${unit}`;
    }
    if (maxVal && numValue > maxVal) {
      const unit = field.unit ? ` ${field.unit[useMetric ? 0 : 1]}` : '';
      return `Maximum value is ${maxVal}${unit}`;
    }
  }
  
  return null;
};

const getInitialState = () => {
    let initialState = {};
    formConfig.forEach(step => {
        step.fields.forEach(field => {
            if (field.type === 'switch') initialState[field.key] = true;
            else if (field.multiple || field.type === 'multi-button') initialState[field.key] = [];
            else initialState[field.key] = '';
        });
    });
    return initialState;
};

const getInitialErrors = () => {
    let initialErrors = {};
    formConfig.forEach(step => {
        step.fields.forEach(field => {
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
  const [openDropdown, setOpenDropdown] = useState('');
  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState([]);
  const [foodError, setFoodError] = useState("");
  
  // Input refs for navigation
  const inputRefs = useRef({});

  // Hydrate saved progress on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // First, try to load existing profile data from database
        const userResp = await supabase.auth.getUser();
        const userId = userResp?.data?.user?.id;
        
        if (userId) {
          const { data: profile } = await supabase
            .from('registration_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (profile) {
            // Map profile data to form fields
            const profileData = mapProfileToFormData(profile);
            logger.info('Loaded existing profile data', { hasData: !!profile });
            
            // Merge with any local storage data (local takes precedence)
            const savedStr = await AsyncStorage.getItem('onboarding:registration');
            const localData = savedStr ? JSON.parse(savedStr) : {};
            
            const mergedData = { ...profileData, ...localData };
            setFormData(mergedData);
            setFoods(Array.isArray(mergedData.favoriteFoods) ? mergedData.favoriteFoods : []);
          }
        }
        
        // Load saved step
        const savedStepStr = await AsyncStorage.getItem('onboarding:registration:step');
        if (cancelled) return;
        
        if (savedStepStr) {
          const savedStep = parseInt(savedStepStr, 10);
          if (!Number.isNaN(savedStep)) {
            setStep(Math.min(Math.max(savedStep, 0), formConfig.length - 1));
          }
        }
      } catch (e) {
        logger.warn('Failed to restore registration draft', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Haptic feedback function
  const lightHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Helper function to get placeholder with units
  const getPlaceholder = (field) => {
    let placeholder = Array.isArray(field.placeholder) 
      ? (formData.useMetric ? field.placeholder[0] : field.placeholder[1]) 
      : field.placeholder;
    
    if (field.unit) {
      const unit = Array.isArray(field.unit) 
        ? (formData.useMetric ? field.unit[0] : field.unit[1])
        : field.unit;
      placeholder += ` (${unit})`;
    }
    
    return placeholder;
  };

  // Input change handler
  const handleInputChange = (key, value) => {
    lightHaptic();
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleFieldBlur = (fieldKey) => {
    const currentStep = formConfig[step];
    const field = currentStep.fields.find(f => f.key === fieldKey);
    
    if (field) {
      const error = validateField(field, formData[fieldKey], formData.useMetric);
      setErrors(prev => ({ ...prev, [fieldKey]: error }));
    }
  };

  const handleDropdownOpen = (fieldKey) => {
    Keyboard.dismiss();
    lightHaptic();
    setOpenDropdown(openDropdown === fieldKey ? '' : fieldKey);
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
    
    currentStep.fields.forEach(field => {
      const error = validateField(field, formData[field.key], formData.useMetric);
      if (error) {
        stepErrors[field.key] = error;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...stepErrors }));
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
        AsyncStorage.setItem('onboarding:registration', JSON.stringify(toSave)),
        AsyncStorage.setItem('onboarding:registration:step', String(step)),
      ]);
    } catch (e) {
      logger.warn('Failed to persist registration data', e);
    }

    if (step === formConfig.length - 1) {
      // Final step - save to Supabase
  const finalData = {
        ...formData,
        favoriteFoods: foods,
      };
  logger.debug('Final registration form', finalData);

      try {
  const userResp = await supabase.auth.getUser();
        const userId = userResp?.data?.user?.id;
        
        if (!userId) {
          logger.info('No authenticated user - skipping remote save.');
          router.replace('../features/bodyfatuser');
          return;
        }

        const payload = {
          user_id: userId,
          gender: finalData.gender || null,
          age: finalData.age ? parseInt(finalData.age, 10) : null,
          height_cm: finalData.height ? parseInt(finalData.height, 10) : null,
          weight_kg: finalData.weight ? parseFloat(finalData.weight) : null,
          use_metric: finalData.useMetric === undefined ? true : !!finalData.useMetric,
          activity_level: finalData.activityLevel || null,
          fitness_goal: finalData.fitnessGoal || null,
          favorite_foods: finalData.favoriteFoods || null,
          fitness_level: finalData.fitnessLevel || null,
          training_location: finalData.trainingLocation || null,
          training_duration: finalData.trainingDuration ? (finalData.trainingDuration === '90+' ? 90 : parseInt(finalData.trainingDuration, 10)) : null,
          muscle_focus: finalData.muscleFocus || null,
          injuries: finalData.injuries || null,
          training_frequency: finalData.trainingFrequency || null,
          meal_type: finalData.mealType || null,
          restrictions: finalData.restrictions || null,
          meals_per_day: finalData.mealsPerDay ? parseInt(finalData.mealsPerDay, 10) : null,
          calorie_goal: finalData.calorieGoal ? parseInt(finalData.calorieGoal, 10) : null,
          details: {}
        };

        logger.info('Saving registration to Supabase for user', userId);
        const { data, error } = await supabase.from('registration_profiles').upsert(payload, { 
          onConflict: 'user_id',
          returning: 'representation'
        });
        
        if (error) {
          logger.error('Failed to save registration_profiles:', error);
          Alert.alert('Save failed', error.message || 'Failed to save registration to server');
        } else {
          logger.info('Registration saved to Supabase successfully');
          await Promise.all([
            AsyncStorage.removeItem('onboarding:registration'),
            AsyncStorage.removeItem('onboarding:registration:step'),
          ]);
        }
      } catch (err) {
        logger.error('Unexpected error saving registration:', err);
        Alert.alert('Save error', 'Unexpected error saving registration');
      } finally {
        setIsLoading(false);
        
        // Determine next step dynamically
        try {
          const userResp = await supabase.auth.getUser();
          const userId = userResp?.data?.user?.id;
          if (userId) {
            const nextStep = await getNextOnboardingStep('registrationprocess', userId);
            router.replace(nextStep);
          } else {
            router.replace('../features/bodyfatuser');
          }
        } catch (navErr) {
          logger.error('Navigation error:', navErr);
          router.replace('../features/bodyfatuser');
        }
      }
    } else {
      // Move to next step
  const nextStep = step + 1;
  setStep(nextStep);
  // Persist step advance eagerly for crash safety
  AsyncStorage.setItem('onboarding:registration:step', String(nextStep)).catch(() => {});
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    if (step > 0) {
      lightHaptic();
      setStep(prev => prev - 1);
    } else {
      lightHaptic();
      router.replace('/auth/loginregister');
    }
  };

  // Get current step fields
  const currentStep = formConfig[step];
  const heightField = currentStep.fields.find(f => f.key === 'height');
  const weightField = currentStep.fields.find(f => f.key === 'weight');
  const useMetricField = currentStep.fields.find(f => f.key === 'useMetric');
  const regularFields = currentStep.fields.filter(f => !['height', 'weight', 'useMetric'].includes(f.key));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
        <LinearGradient
          colors={["#0B0B0B", "#1a1a1a"]}
          style={styles.gradient}
        >
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
                    <Text style={styles.sectionLabel}>What is your height & weight?</Text>
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
                        isLastField && styles.lastFieldContainer
                      ]}
                    >
                      {field.type !== 'switch' && (
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
                  Want to change something? You can customize everything later in your profile.
                </Text>
                <SubmitButton
                  title={step === formConfig.length - 1 ? "Submit Info" : "Continue →"}
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
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for footer
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
    marginTop: 4,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    marginTop: 8,
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
    color: "#fff",
    marginBottom: 8,
    marginTop: 6,
  },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#0B0B0B",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
});
