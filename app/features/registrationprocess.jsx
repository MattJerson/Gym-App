import {
  View,
  Text,
  Switch,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  StatusBar,
  Animated,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import * as Haptics from 'expo-haptics';
import FormInput from "../../components/FormInput";

const formConfig = [
  {
    title: "Basic Info",
    subtitle: "Tell us about yourself",
    fields: [
      { name: "gender", label: "Please select your gender", type: "dropdown", placeholder: "Gender", zIndex: 3000, items: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }] },
      { name: "age", label: "What is your age?", type: "text", placeholder: "Age", keyboardType: "numeric", validation: { min: 13, max: 120, required: false }, returnKeyType: "next" },
      
      { name: "height", label: "What is your height?", type: "text", placeholder: ["Height", "Height"], unit: ["cm", "ft"], dependsOn: "useMetric", keyboardType: "numeric", validation: { min: 100, max: 250, minImperial: 36, maxImperial: 96, required: false }, returnKeyType: "next" },
      { name: "weight", label: "What is your weight?", type: "text", placeholder: ["Weight", "Weight"], unit: ["kg", "lbs"], dependsOn: "useMetric", keyboardType: "numeric", validation: { min: 30, max: 300, minImperial: 66, maxImperial: 660, required: false }, returnKeyType: "next" },
      { name: "useMetric", label: "Use Metric Units", type: "switch" },
      { name: "activityLevel", label: "Select your activity level", type: "dropdown", placeholder: "Activity Level", zIndex: 2000, items: [{ label: "Sedentary", value: "sedentary" }, { label: "Lightly Active", value: "light" }, { label: "Moderately Active", value: "moderate" }, { label: "Very Active", value: "active" }, { label: "Extra Active", value: "extra" }] },
      { name: "fitnessGoal", label: "What is your fitness goal?", type: "dropdown", placeholder: "Fitness Goal", zIndex: 1000, items: [{ label: "Lose Weight", value: "lose" }, { label: "Maintain Weight", value: "maintain" }, { label: "Gain Muscle", value: "gain" }] },
    ],
  },
  {
    title: "Workout Plan",
    subtitle: "Training preferences",
    fields: [
      { name: "fitnessLevel", label: "What's your fitness level?", type: "dropdown", placeholder: "Select Fitness Level", zIndex: 6000, items: [{ label: "Beginner", value: "basic" }, { label: "Intermediate", value: "intermediate" }, { label: "Advanced", value: "advanced" }] },
      { name: "trainingLocation", label: "Where do you train?", type: "dropdown", placeholder: "Select Location", zIndex: 5000, items: [{ label: "At Home", value: "home" }, { label: "At the Gym", value: "gym" }] },
      { name: "trainingDuration", label: "How long do you train?", type: "dropdown", placeholder: "Select Duration", zIndex: 4000, items: [{ label: "20 mins", value: "20" }, { label: "30 mins", value: "30" }, { label: "45 mins", value: "45" }, { label: "60 mins", value: "60" }, { label: "90+ mins", value: "90+" }] },
      { name: "muscleFocus", label: "Interested in growing a specific muscle?", type: "dropdown", placeholder: "Select Muscle Group", zIndex: 3000, items: [{ label: "General Growth", value: "general" }, { label: "Legs and Glutes", value: "legs_glutes" }, { label: "Back", value: "back" }, { label: "Chest", value: "chest" }, { label: "Shoulders and Arms", value: "shoulders_arms" }, { label: "Core", value: "core" }] },
      { name: "injuries", label: "Any current injuries?", type: "dropdown", placeholder: "Select Injuries (if any)", zIndex: 2000, multiple: true, items: [{ label: "Lower Back", value: "lower_back" }, { label: "Knees", value: "knees" }, { label: "Shoulder", value: "shoulder" }, { label: "No Injuries", value: "none" }] },
      { name: "trainingFrequency", label: "How often do you want to train?", type: "dropdown", placeholder: "Select Frequency", zIndex: 1000, items: [{ label: "2 days/week", value: "2" }, { label: "3 days/week", value: "3" }, { label: "4 days/week", value: "4" }, { label: "5 days/week", value: "5" }, { label: "6 days/week", value: "6" }] },
    ],
  },
  {
    title: "Meal Plan",
    subtitle: "Nutrition preferences",
    fields: [
      { name: "mealType", label: "What's your meal preference?", type: "dropdown", placeholder: "Meal Preference", zIndex: 3000, items: [{ label: "Omnivore", value: "omnivore" }, { label: "Vegetarian", value: "vegetarian" }, { label: "Vegan", value: "vegan" }, { label: "Pescatarian", value: "pescatarian" }] },
      { name: "restrictions", label: "Any dietary restrictions?", type: "dropdown", placeholder: "Dietary Restrictions", zIndex: 2000, multiple: true, items: [{ label: "Gluten-Free", value: "gluten-free" }, { label: "Dairy-Free", value: "dairy-free" }, { label: "Nut-Free", value: "nut-free" }, { label: "Soy-Free", value: "soy-free" }] },
      { name: "calorieGoal", type: "text", placeholder: "Daily Calorie Goal", keyboardType: "numeric", validation: { min: 800, max: 5000, required: false }, returnKeyType: "next" },
      { name: "mealsPerDay", type: "text", placeholder: "Meals per Day", keyboardType: "numeric", validation: { min: 1, max: 8, required: false }, returnKeyType: "done" },
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

// Debounce utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const getInitialState = () => {
    let initialState = {};
    formConfig.forEach(step => {
        step.fields.forEach(field => {
            if (field.type === 'switch') initialState[field.name] = true;
            else if (field.multiple) initialState[field.name] = [];
            else initialState[field.name] = '';
        });
    });
    return initialState;
};

const getInitialErrors = () => {
    let initialErrors = {};
    formConfig.forEach(step => {
        step.fields.forEach(field => {
            initialErrors[field.name] = null;
        });
    });
    return initialErrors;
};

export default function BasicInfo() {
  const { width } = Dimensions.get("window");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Form state
  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState(getInitialErrors());
  const [openDropdown, setOpenDropdown] = useState('');
  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState([]);
  
  // Input refs for navigation
  const inputRefs = useRef({});
  
  // Debounced form data for performance
  const debouncedFormData = useDebounce(formData, 300);
  
  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Save form data locally (debounced)
  useEffect(() => {
    // In a real app, you would save to AsyncStorage or similar
    // AsyncStorage.setItem('registrationFormData', JSON.stringify(debouncedFormData));
    console.log('Form data auto-saved:', debouncedFormData);
  }, [debouncedFormData]);

  // Reset slide animation when step changes
  useEffect(() => {
    slideAnim.setValue(0);
  }, [step]);

  // Haptic feedback function
  const lightHaptic = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Helper function to get placeholder with units
  const getFieldPlaceholder = useCallback((field) => {
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
  }, [formData.useMetric]);

  // Helper function to get text content type
  const getTextContentType = useCallback((field) => {
    if (field.name === 'age') return 'none';
    if (field.keyboardType === 'numeric') return 'none';
    return undefined;
  }, []);

  // Memoized handlers
  const handleInputChange = useCallback((name, value) => {
    lightHaptic();
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [lightHaptic, errors]);

  const handleFieldBlur = useCallback((fieldName, value) => {
    const currentStep = formConfig[step];
    const field = currentStep.fields.find(f => f.name === fieldName);
    
    if (field) {
      const error = validateField(field, value, formData.useMetric);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [step, formData.useMetric]);

  const handleDropdownOpen = useCallback((fieldName) => {
    Keyboard.dismiss();
    lightHaptic();
    setOpenDropdown(openDropdown === fieldName ? '' : fieldName);
  }, [openDropdown, lightHaptic]);

  const addFood = useCallback(() => {
    if (!foodInput.trim()) return;
    lightHaptic();
    setFoods((prev) => [...prev, foodInput.trim()]);
    setFoodInput("");
  }, [foodInput, lightHaptic]);

  const removeFood = useCallback((index) => {
    lightHaptic();
    setFoods((prev) => prev.filter((_, i) => i !== index));
  }, [lightHaptic]);

  const validateCurrentStep = useCallback(() => {
    const currentStep = formConfig[step];
    let stepErrors = {};
    let hasErrors = false;
    
    currentStep.fields.forEach(field => {
      const error = validateField(field, formData[field.name], formData.useMetric);
      if (error) {
        stepErrors[field.name] = error;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...stepErrors }));
    }
    
    return !hasErrors;
  }, [step, formData]);

  const handleNextStep = useCallback(async () => {
    setIsLoading(true);
    lightHaptic();
    
    // Validate current step
    if (!validateCurrentStep()) {
      setIsLoading(false);
      return;
    }
    
    // Animate step transition
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (step === formConfig.length - 1) {
        const finalData = {
          ...formData,
          favoriteFoods: foods,
        };
        console.log("--- Final Form Data ---", finalData);
        router.replace('../features/bodyfatuser');
      } else {
        setStep(prev => prev + 1);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      setIsLoading(false);
    });
  }, [step, validateCurrentStep, lightHaptic, slideAnim, width, formData, foods, router]);

  const handlePreviousStep = useCallback(() => {
    if (step > 0) {
      lightHaptic();
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setStep(prev => prev - 1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      router.back();
    }
  }, [step, lightHaptic, slideAnim, width, router]);

  const renderField = useCallback((field, index) => {
    const isOpen = openDropdown === field.name;
    const fieldError = errors[field.name];
    
    const handleSubmitEditing = () => {
      const currentFields = formConfig[step].fields;
      const nextIndex = index + 1;
      
      if (nextIndex < currentFields.length) {
        const nextField = currentFields[nextIndex];
        if (inputRefs.current[nextField.name]) {
          inputRefs.current[nextField.name].focus();
        }
      }
    };

    switch (field.type) {
        case 'text':
            return (
              <FormInput
                key={field.name}
                ref={(ref) => inputRefs.current[field.name] = ref}
                placeholder={getFieldPlaceholder(field)}
                value={formData[field.name]}
                onChangeText={(val) => handleInputChange(field.name, val)}
                keyboardType={field.keyboardType || 'default'}
                returnKeyType={field.returnKeyType || 'done'}
                textContentType={getTextContentType(field)}
                onSubmitEditing={handleSubmitEditing}
                onBlur={() => handleFieldBlur(field.name, formData[field.name])}
                errorMessage={fieldError}
              />
            );
        case 'dropdown':
            return (
              <View key={field.name} style={styles.fieldWrapper}>
                <View style={[
                  styles.formInputContainer,
                  isOpen && styles.formInputFocused,
                  fieldError && styles.formInputError
                ]}>
                  <View style={styles.formInputIconContainer}>
                    <Ionicons
                      name="chevron-down-outline"
                      style={[
                        styles.formInputIcon,
                        isOpen && styles.formInputIconFocused,
                        fieldError && styles.formInputIconError
                      ]}
                    />
                  </View>
                  <DropDownPicker 
                    open={isOpen} 
                    value={formData[field.name]} 
                    items={field.items} 
                    setOpen={() => handleDropdownOpen(field.name)}
                    setValue={(callback) => handleInputChange(field.name, callback(formData[field.name]))} 
                    multiple={field.multiple || false} 
                    mode={field.multiple ? "BADGE" : "SIMPLE"} 
                    placeholder={`${field.placeholder}`}
                    style={styles.dropdownInput} 
                    dropDownContainerStyle={styles.dropdownContainer} 
                    textStyle={{ color: "#fff", fontSize: 16 }} 
                    labelStyle={{ color: "#fff", fontSize: 16 }} 
                    placeholderStyle={{ color: "#666", fontSize: 16 }}
                    arrowIconStyle={{ tintColor: "#1E3A5F" }}
                    tickIconStyle={{ tintColor: "#1E3A5F" }}
                    zIndex={field.zIndex}
                  />
                </View>
                {fieldError && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#F44336" />
                    <Text style={styles.errorText}>{fieldError}</Text>
                  </View>
                )}
              </View>
            );
        case 'switch':
            return (
              <View key={field.name} style={styles.plainSwitchWrapper}>
                <Text style={styles.plainSwitchLabel}>{field.label}</Text>
                <Switch 
                  value={formData[field.name]} 
                  onValueChange={(val) => handleInputChange(field.name, val)} 
                  trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#1E3A5F" }} 
                  thumbColor={formData[field.name] ? "#FFFFFF" : "#CCCCCC"}
                  ios_backgroundColor="rgba(255, 255, 255, 0.1)"
                />
              </View>
            );
        default:
            return null;
    }  
  }, [formData, errors, openDropdown, handleInputChange, handleFieldBlur, handleDropdownOpen, getFieldPlaceholder, getTextContentType, step]);

  // Custom layout renderer for special field combinations
  const renderCustomLayouts = useCallback(() => {
    const currentFields = formConfig[step].fields;
    const renderedFields = new Set();
    const layouts = [];

    currentFields.forEach((field, index) => {
      if (renderedFields.has(field.name)) return;

      // Height & Weight two-column layout
      if (field.name === 'height') {
        const weightField = currentFields.find(f => f.name === 'weight');
        const useMetricField = currentFields.find(f => f.name === 'useMetric');
        
        if (weightField && useMetricField) {
          renderedFields.add('height');
          renderedFields.add('weight');
          renderedFields.add('useMetric');
          
          layouts.push(
            <View key="height-weight-section" style={styles.twoColumnSection}>
              <Text style={styles.twoColumnLabel}>What is your height & weight?</Text>
              
              {/* Use Metric switch above the input fields */}
              <View style={styles.metricToggleSection}>
                <Text style={styles.metricToggleText}>Use Metric Units</Text>
                <Switch 
                  value={formData[useMetricField.name]} 
                  onValueChange={(val) => handleInputChange(useMetricField.name, val)} 
                  trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#1E3A5F" }} 
                  thumbColor={formData[useMetricField.name] ? "#FFFFFF" : "#CCCCCC"}
                  ios_backgroundColor="rgba(255, 255, 255, 0.1)"
                />
              </View>
              
              <View style={styles.twoColumnContainer}>
                <View style={[styles.twoColumnField, { zIndex: openDropdown === field.name ? 9999 : (field.zIndex || 1000 - index) }]}>
                  {renderField(field, index)}
                </View>
                <View style={[styles.twoColumnField, { zIndex: openDropdown === weightField.name ? 9999 : (weightField.zIndex || 1000 - currentFields.indexOf(weightField)) }]}>
                  {renderField(weightField, currentFields.indexOf(weightField))}
                </View>
              </View>
            </View>
          );
          return;
        }
      }

      // Calorie Goal & Meals Per Day two-column layout
      if (field.name === 'calorieGoal') {
        const mealsField = currentFields.find(f => f.name === 'mealsPerDay');
        if (mealsField) {
          renderedFields.add('calorieGoal');
          renderedFields.add('mealsPerDay');
          
          layouts.push(
            <View key="calorie-meals-section" style={styles.twoColumnSection}>
              <Text style={styles.twoColumnLabel}>Daily Intake</Text>
              <View style={styles.twoColumnContainer}>
                <View style={styles.twoColumnField}>
                  {renderField(field, index)}
                </View>
                <View style={styles.twoColumnField}>
                  {renderField(mealsField, currentFields.indexOf(mealsField))}
                </View>
              </View>
            </View>

          );
          return;
        }
      }

      // Default single field layout
      if (!renderedFields.has(field.name)) {
        renderedFields.add(field.name);
        layouts.push(
          <View key={field.name} style={{ 
            zIndex: openDropdown === field.name ? 9999 : (field.zIndex || 1000 - index) 
          }}>
            {field.type !== 'switch' && (
              <Text style={styles.questionLabel}>{field.label}</Text>
            )}
            {renderField(field, index)}
          </View>
        );
      }
    });

    return layouts;
  }, [formConfig, step, renderField, openDropdown]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable 
                onPress={handlePreviousStep}
                style={styles.backButton}
                hitSlop={10}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
              </Pressable>

              {/* Section Title centered */}
              <Text style={styles.sectionTitleHeader}>
                {formConfig[step].title}
              </Text>

              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>{step + 1}/{formConfig.length}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: `${((step + 1) / formConfig.length) * 100}%` }
                  ]}
                />
              </View>
            </View>

            <Animated.ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={[
                styles.formScrollView,
                {
                  opacity: formAnim,
                  transform: [
                    {
                      translateX: slideAnim,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.formSection}>
                {formConfig[step].subtitle && (
                  <Text style={styles.sectionSubtitle}>{formConfig[step].subtitle}</Text>
                )}
                <View style={styles.fieldsContainer}>
                  {renderCustomLayouts()}
                </View>

                {/* Food input section for last step */}
                {step === formConfig.length - 1 && (
                  <View style={styles.foodSection}>
                    <Text style={styles.questionLabel}>What foods do you enjoy?</Text>
                    <View style={styles.foodRow}>
                      <View style={{ flex: 1 }}>
                        <FormInput
                          placeholder="Add a food you like"
                          value={foodInput}
                          onChangeText={setFoodInput}
                          returnKeyType="done"
                          onSubmitEditing={addFood}
                        />
                      </View>
                      <Pressable style={styles.addButton} onPress={addFood}>
                        <View style={styles.addButtonSolid}>
                          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                        </View>
                      </Pressable>
                    </View>
                    
                    {foods.length > 0 && (
                      <FlatList
                        data={foods}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        renderItem={({ item, index }) => (
                          <View style={styles.foodItem}>
                            <MaterialCommunityIcons name="food-apple" size={16} color="#1E3A5F" />
                            <Text style={styles.foodText}>{item}</Text>
                            <Pressable 
                              onPress={() => removeFood(index)}
                              style={styles.removeButton}
                            >
                              <Ionicons name="close" size={16} color="#666" />
                            </Pressable>
                          </View>
                        )}
                        style={styles.foodsList}
                        scrollEnabled={false}
                        showsVerticalScrollIndicator={false}
                      />
                    )}
                  </View>
                )}
                
                <Text style={styles.disclaimer}>
                  Want to change something? You can customize everything later in your profile.
                </Text>
              </View>
            </Animated.ScrollView>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, isLoading && styles.submitButtonLoading]}
              onPress={handleNextStep}
              disabled={isLoading}
            >
              <View style={[styles.submitButtonSolid, isLoading && styles.submitButtonDisabled]}>
                {isLoading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="small" color="#fff" style={styles.loadingSpinner} />
                    <Text style={styles.submitButtonText}>
                      {step < formConfig.length - 1 ? "Processing..." : "Generating Plan..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {step < formConfig.length - 1 ? "Continue" : "Generate Plan"}
                    </Text>
                    <Ionicons
                      name={step < formConfig.length - 1 ? "arrow-forward" : "checkmark"}
                      size={20}
                      color="#fff"
                      style={styles.submitButtonIcon}
                    />
                  </>
                )}
              </View>
            </Pressable>

          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
    maxWidth: 400,
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingTop: Platform.OS === "ios" ? 25 : 35,
    marginTop: 15,
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center",
    flex: 1,
  },
  stepIndicator: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  stepText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4A9EFF",
    borderRadius: 2,
  },
  formScrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  formSection: {
    width: "100%",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
    maxWidth: 320,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "600",
    width: '100%',
    textAlign: "left",
  },
  formInputContainer: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  formInputFocused: {
    borderColor: "#1E3A5F",
    backgroundColor: "rgba(30, 58, 95, 0.1)",
  },
  formInputIconContainer: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  formInputIcon: {
    fontSize: 20,
    color: "#666",
  },
  formInputIconFocused: {
    color: "#1E3A5F",
  },
  formInputError: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  formInputIconError: {
    color: "#F44336",
  },
  fieldWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  fieldsContainer: {
    width: "100%",
    paddingHorizontal: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 8,
    gap: 6,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  foodSection: {
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  dropdownInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
    flex: 1,
    height: "100%",
    paddingHorizontal: 0,
  },
  dropdownContainer: {
    backgroundColor: "#333333",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    marginLeft: -24,
  },
  switchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  mealPlanContainer: {
    width: "100%",
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitleHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 0,
  },
  addButtonSolid: {
    backgroundColor: "#1E3A5F", // pick your solid color
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  foodsList: {
    maxHeight: 150,
    width: "100%",
  },
  foodItem: {
    flexDirection: "row",
    alignItems: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  foodText: {
    fontSize: 15,
    color: "#fff",
    flex: 1,
    fontWeight: '500',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  twoColumnSection: {
    width: "100%",
    marginBottom: -8,
  },
  twoColumnLabel: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "left",
  },
  twoColumnContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  twoColumnField: {
    flex: 1,
  },
  twoColumnFieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    opacity: 0.9,
  },
  metricToggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  metricToggleText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  plainSwitchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%",
    paddingVertical: 12,
    marginBottom: 16,
  },
  plainSwitchLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  submitButton: {
    width: "100%",
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 40,
  },
  submitButtonSolid: {
    backgroundColor: "#356FB0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#666",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonIcon: {
    marginLeft: 8,
  },
  submitButtonLoading: {
    opacity: 0.8,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpinner: {
    marginRight: 12,
  },
});