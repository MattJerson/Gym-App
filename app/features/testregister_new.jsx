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
  Alert,
  Animated,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import * as Haptics from 'expo-haptics';

const formConfig = [
  {
    title: "Basic Info",
    fields: [
      [
        { name: "gender", label: "Please select your gender", type: "dropdown", placeholder: "Gender", zIndex: 3000, items: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }] },
      ],
      [
        { name: "age", label: "What is your age?", type: "text", placeholder: "Age", keyboardType: "numeric" },
      ],
      [
        { name: "useMetric", label: "Use Metric Units", type: "switch" },
      ],
      [
        { name: "height", label: "What is your height and weight?", type: "text", placeholder: ["Height (cm)", "Height (ft)"], dependsOn: "useMetric", keyboardType: "numeric" },
        { name: "weight", label: "What is your weight?", type: "text", placeholder: ["Weight (kg)", "Weight (lbs)"], dependsOn: "useMetric", keyboardType: "numeric" },
      ],
      [
        { name: "activityLevel", label: "Select your activity level", type: "dropdown", placeholder: "Activity Level", zIndex: 2000, items: [{ label: "Sedentary", value: "sedentary" }, { label: "Lightly Active", value: "light" }, { label: "Moderately Active", value: "moderate" }, { label: "Very Active", value: "active" }, { label: "Extra Active", value: "extra" }] },
      ],
      [
        { name: "fitnessGoal", label: "What is your fitness goal?", type: "dropdown", placeholder: "Fitness Goal", zIndex: 1000, items: [{ label: "Lose Weight", value: "lose" }, { label: "Maintain Weight", value: "maintain" }, { label: "Gain Muscle", value: "gain" }] },
      ],
    ],
  },
  {
    title: "Workout Plan",
    fields: [
      [{ name: "fitnessLevel", label: "Fitness Level?", type: "dropdown", placeholder: "Select Fitness Level", zIndex: 6000, items: [{ label: "Basic", value: "basic" }, { label: "Intermediate", value: "intermediate" }, { label: "Advanced", value: "advanced" }] }],
      [{ name: "trainingLocation", label: "Where do you train?", type: "dropdown", placeholder: "Select Location", zIndex: 5000, items: [{ label: "At Home", value: "home" }, { label: "At the Gym", value: "gym" }] }],
      [{ name: "trainingDuration", label: "How long do you train?", type: "dropdown", placeholder: "Select Duration", zIndex: 4000, items: [{ label: "20 mins", value: "20" }, { label: "30 mins", value: "30" }, { label: "45 mins", value: "45" }, { label: "60 mins", value: "60" }, { label: "90+ mins", value: "90+" }] }],
      [{ name: "muscleFocus", label: "Interested in growing a specific muscle?", type: "dropdown", placeholder: "Select Muscle Group", zIndex: 3000, items: [{ label: "General Growth", value: "general" }, { label: "Legs and Glutes", value: "legs_glutes" }, { label: "Back", value: "back" }, { label: "Chest", value: "chest" }, { label: "Shoulders and Arms", value: "shoulders_arms" }, { label: "Core", value: "core" }] }],
      [{ name: "injuries", label: "Any Injuries?", type: "dropdown", placeholder: "Select Injuries (if any)", zIndex: 2000, multiple: true, items: [{ label: "Lower Back", value: "lower_back" }, { label: "Knees", value: "knees" }, { label: "Shoulder", value: "shoulder" }, { label: "No Injuries", value: "none" }] }],
      [{ name: "trainingFrequency", label: "How often do you want to train?", type: "dropdown", placeholder: "Select Frequency", zIndex: 1000, items: [{ label: "2 days/week", value: "2" }, { label: "3 days/week", value: "3" }, { label: "4 days/week", value: "4" }, { label: "5 days/week", value: "5" }, { label: "6 days/week", value: "6" }] }],
    ],
  },
  {
    title: "Meal Plan",
    fields: [], 
  },
];

const getInitialState = () => {
    let initialState = {};
    formConfig.forEach(step => {
        if (step.fields.length > 0) {
            step.fields.forEach(row => {
                row.forEach(field => {
                    if (field.type === 'switch') initialState[field.name] = true;
                    else if (field.multiple) initialState[field.name] = [];
                    else initialState[field.name] = '';
                });
            });
        }
    });
    return initialState;
};

export default function BasicInfo() {
  const { width, height } = Dimensions.get("window");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const [formData, setFormData] = useState(getInitialState());
  
  const [mealTypeOpen, setMealTypeOpen] = useState(false);
  const [mealType, setMealType] = useState(null);
  const [mealTypeItems, setMealTypeItems] = useState([
    { label: "Omnivore", value: "omnivore" },
    { label: "Vegetarian", value: "vegetarian" },
    { label: "Vegan", value: "vegan" },
    { label: "Pescatarian", value: "pescatarian" },
  ]);

  const [restrictionOpen, setRestrictionOpen] = useState(false);
  const [restrictions, setRestrictions] = useState([]);
  const [restrictionItems, setRestrictionItems] = useState([
    { label: "Gluten-Free", value: "gluten-free" },
    { label: "Dairy-Free", value: "dairy-free" },
    { label: "Nut-Free", value: "nut-free" },
    { label: "Soy-Free", value: "soy-free" },
  ]);

  const [calorieGoal, setCalorieGoal] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("");
  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState([]);

  const [openDropdown, setOpenDropdown] = useState('');

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (step + 1) / formConfig.length,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // Haptic feedback functions
  const lightHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const mediumHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleInputChange = (name, value) => {
    lightHaptic();
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const addFood = () => {
    if (!foodInput.trim()) return;
    mediumHaptic();
    setFoods((prev) => [...prev, foodInput.trim()]);
    setFoodInput("");
  };

  const removeFood = (index) => {
    lightHaptic();
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    mediumHaptic();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (step === formConfig.length - 1) {
      const finalData = {
        ...formData,
        mealType,
        restrictions,
        calorieGoal,
        mealsPerDay,
        favoriteFoods: foods,
      };
      console.log("--- Final Form Data ---", finalData);
      router.replace('../features/bodyfatinfo');
    } else {
      setStep(prev => prev + 1);
    }
    setIsLoading(false);
  };

  const handlePreviousStep = () => {
    if (step > 0) {
      lightHaptic();
      setStep(prev => prev - 1);
    }
  };
  
  const renderField = (field) => {
    const placeholder = Array.isArray(field.placeholder) 
        ? (formData.useMetric ? field.placeholder[0] : field.placeholder[1]) 
        : field.placeholder;

    const isFocused = focusedField === field.name;

    switch (field.type) {
        case 'text':
            return (
              <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                <TextInput 
                  style={[styles.inputRowItem, isFocused && styles.inputRowItemFocused]} 
                  placeholder={`${placeholder} (Optional)`}
                  placeholderTextColor="#8B8B8B" 
                  value={formData[field.name]} 
                  onChangeText={(val) => handleInputChange(field.name, val)} 
                  keyboardType={field.keyboardType || 'default'}
                  onFocus={() => setFocusedField(field.name)}
                  onBlur={() => setFocusedField(null)}
                />
                {isFocused && (
                  <View style={styles.inputFocusIndicator} />
                )}
              </View>
            );
        case 'dropdown':
            return (
              <View style={[styles.inputContainer, openDropdown === field.name && styles.inputContainerFocused]}>
                <DropDownPicker 
                  open={openDropdown === field.name} 
                  value={formData[field.name]} 
                  items={field.items} 
                  setOpen={() => {
                    const newValue = openDropdown === field.name ? '' : field.name;
                    setOpenDropdown(newValue);
                    lightHaptic();
                  }}
                  setValue={(callback) => handleInputChange(field.name, callback(formData[field.name]))} 
                  multiple={field.multiple || false} 
                  mode={field.multiple ? "BADGE" : "SIMPLE"} 
                  placeholder={`${placeholder} (Optional)`}
                  style={styles.inputRowItem} 
                  dropDownContainerStyle={styles.dropdownContainer} 
                  textStyle={{ color: "#FFFFFF" }} 
                  labelStyle={{ color: "#FFFFFF" }} 
                  placeholderStyle={{ color: "#8B8B8B" }}
                  arrowIconStyle={{ tintColor: "#1E3A5F" }}
                  tickIconStyle={{ tintColor: "#1E3A5F" }}
                />
                {openDropdown === field.name && (
                  <View style={styles.inputFocusIndicator} />
                )}
              </View>
            );
        case 'switch':
            return (
              <Pressable
                style={styles.switchContainer}
                onPress={() => handleInputChange(field.name, !formData[field.name])}
              >
                <View style={styles.switchContent}>
                  <MaterialCommunityIcons 
                    name="tune" 
                    size={20} 
                    color="#1E3A5F" 
                    style={styles.switchIcon}
                  />
                  <Text style={styles.switchLabel}>{field.label}</Text>
                </View>
                <Switch 
                  value={formData[field.name]} 
                  onValueChange={(val) => handleInputChange(field.name, val)} 
                  trackColor={{ false: "#3A3A3A", true: "#1E3A5F" }} 
                  thumbColor={formData[field.name] ? "#FFFFFF" : "#CCCCCC"}
                  ios_backgroundColor="#3A3A3A"
                />
              </Pressable>
            );
        default:
            return null;
    }
  };

  return (
    <LinearGradient 
      colors={["#0A0A0A", "#1A1A1A", "#2A2A2A"]} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
            
            {/* Animated Header */}
            <Animated.View 
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Logo Container */}
              <LinearGradient
                colors={["rgba(30, 58, 95, 0.2)", "rgba(74, 144, 226, 0.1)"]}
                style={styles.logoContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="dumbbell" size={32} color="#1E3A5F" />
                <Text style={styles.logoText}>FitTracker</Text>
              </LinearGradient>

              <View style={styles.topHeaderRow}>
                <Pressable 
                  onPress={handlePreviousStep} 
                  style={[styles.backButton, step === 0 && styles.backButtonDisabled]}
                  disabled={step === 0}
                >
                  <Ionicons name="arrow-back" size={24} color={step > 0 ? "#FFFFFF" : "#555555"} />
                </Pressable>
                <View style={styles.headerContent}>
                  <Text style={styles.mainTitle}>Complete Your Profile</Text>
                  <Text style={styles.subtitle}>
                    Step {step + 1} of {formConfig.length}
                  </Text>
                </View>
                <View style={styles.headerRight} />
              </View>

              {/* Enhanced Progress Indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        })
                      }
                    ]} 
                  />
                </View>
                <Animated.Text style={styles.progressText}>
                  {Math.round(((step + 1) / formConfig.length) * 100)}% Complete
                </Animated.Text>
              </View>

              {/* Modern Step Indicators */}
              <View style={styles.stepsIndicatorContainer}>
                {formConfig.map((config, index) => (
                  <Pressable 
                    key={index} 
                    onPress={() => {
                      setStep(index);
                      mediumHaptic();
                    }}
                    style={styles.stepTab}
                  >
                    <LinearGradient
                      colors={
                        index === step 
                          ? ["#1E3A5F", "#4A90E2"]
                          : index < step
                          ? ["#4CAF50", "#66BB6A"]
                          : ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]
                      }
                      style={[
                        styles.stepIndicator,
                        index === step && styles.activeStepIndicator,
                        index < step && styles.completedStepIndicator
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {index < step ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <Text style={[
                          styles.stepNumber, 
                          index === step && styles.activeStepNumber
                        ]}>
                          {index + 1}
                        </Text>
                      )}
                    </LinearGradient>
                    <Text style={[
                      styles.stepText, 
                      index === step && styles.activeStepText,
                      index < step && styles.completedStepText
                    ]}>
                      {config.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            <Animated.ScrollView 
              contentContainerStyle={styles.scrollContent} 
              keyboardShouldPersistTaps="handled"
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }}
            >
              {step < 2 ? (
                <View style={styles.formSection}>
                  <LinearGradient
                    colors={["rgba(30, 58, 95, 0.1)", "rgba(74, 144, 226, 0.05)"]}
                    style={styles.sectionHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons 
                      name={step === 0 ? "account-circle" : "dumbbell"} 
                      size={28} 
                      color="#1E3A5F" 
                    />
                    <Text style={styles.sectionTitle}>{formConfig[step].title}</Text>
                  </LinearGradient>
                  
                  {formConfig[step].fields.map((row, rowIndex) => (
                    <View key={rowIndex} style={{ zIndex: openDropdown === row[0].name ? 9999 : row[0].zIndex }}>
                      {row[0].type !== 'switch' && (
                        <Text style={styles.questionLabel}>{row[0].label}</Text>
                      )}
                      <View style={styles.rowContainer}>
                        {row.map(field => (
                          <View key={field.name} style={{ flex: 1 }}>
                            {renderField(field)}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.formSection}>
                  <LinearGradient
                    colors={["rgba(30, 58, 95, 0.1)", "rgba(74, 144, 226, 0.05)"]}
                    style={styles.sectionHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="food-apple" size={28} color="#1E3A5F" />
                    <Text style={styles.sectionTitle}>Meal Plan Preferences</Text>
                  </LinearGradient>
                  <Text style={styles.sectionSubtitle}>
                    Help us create a personalized meal plan for you
                  </Text>
                  
                  <View style={styles.mealPlanContainer}>
                    <Text style={styles.questionLabel}>What's your meal preference?</Text>
                    <View style={[styles.inputContainer, mealTypeOpen && styles.inputContainerFocused]}>
                      <DropDownPicker
                        open={mealTypeOpen}
                        value={mealType}
                        items={mealTypeItems}
                        setOpen={() => {
                          setMealTypeOpen(!mealTypeOpen);
                          lightHaptic();
                        }}
                        setValue={setMealType}
                        setItems={setMealTypeItems}
                        placeholder="Meal Preference (Optional)"
                        style={styles.inputRowItem}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={3000}
                        textStyle={{ color: "#FFFFFF" }}
                        labelStyle={{ color: "#FFFFFF" }}
                        placeholderStyle={{ color: "#8B8B8B" }}
                        arrowIconStyle={{ tintColor: "#1E3A5F" }}
                        tickIconStyle={{ tintColor: "#1E3A5F" }}
                        containerStyle={{marginBottom: 20}}
                      />
                      {mealTypeOpen && <View style={styles.inputFocusIndicator} />}
                    </View>
                    
                    <Text style={styles.questionLabel}>Any dietary restrictions?</Text>
                    <View style={[styles.inputContainer, restrictionOpen && styles.inputContainerFocused]}>
                      <DropDownPicker
                        multiple
                        open={restrictionOpen}
                        value={restrictions}
                        items={restrictionItems}
                        setOpen={() => {
                          setRestrictionOpen(!restrictionOpen);
                          lightHaptic();
                        }}
                        setValue={setRestrictions}
                        setItems={setRestrictionItems}
                        placeholder="Dietary Restrictions (Optional)"
                        mode="BADGE"
                        style={styles.inputRowItem}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={2000}
                        textStyle={{ color: "#FFFFFF" }}
                        labelStyle={{ color: "#FFFFFF" }}
                        placeholderStyle={{ color: "#8B8B8B" }}
                        arrowIconStyle={{ tintColor: "#1E3A5F" }}
                        tickIconStyle={{ tintColor: "#1E3A5F" }}
                        containerStyle={{marginBottom: 20}}
                      />
                      {restrictionOpen && <View style={styles.inputFocusIndicator} />}
                    </View>
                    
                    <Text style={styles.questionLabel}>Daily calorie goal</Text>
                    <View style={[styles.inputContainer, focusedField === 'calorieGoal' && styles.inputContainerFocused]}>
                      <TextInput
                        style={[styles.inputRowItem, focusedField === 'calorieGoal' && styles.inputRowItemFocused]}
                        placeholder="Daily Calorie Goal (Optional)"
                        placeholderTextColor="#8B8B8B"
                        value={calorieGoal}
                        onChangeText={setCalorieGoal}
                        keyboardType="numeric"
                        onFocus={() => setFocusedField('calorieGoal')}
                        onBlur={() => setFocusedField(null)}
                      />
                      {focusedField === 'calorieGoal' && <View style={styles.inputFocusIndicator} />}
                    </View>
                    
                    <Text style={styles.questionLabel}>How many meals per day?</Text>
                    <View style={[styles.inputContainer, focusedField === 'mealsPerDay' && styles.inputContainerFocused]}>
                      <TextInput
                        style={[styles.inputRowItem, focusedField === 'mealsPerDay' && styles.inputRowItemFocused]}
                        placeholder="Meals per Day (Optional)"
                        placeholderTextColor="#8B8B8B"
                        value={mealsPerDay}
                        onChangeText={setMealsPerDay}
                        keyboardType="numeric"
                        onFocus={() => setFocusedField('mealsPerDay')}
                        onBlur={() => setFocusedField(null)}
                      />
                      {focusedField === 'mealsPerDay' && <View style={styles.inputFocusIndicator} />}
                    </View>
                    
                    <Text style={styles.questionLabel}>What foods do you enjoy?</Text>
                    <View style={styles.foodInputSection}>
                      <View style={styles.foodRow}>
                        <View style={[styles.inputContainer, focusedField === 'foodInput' && styles.inputContainerFocused, { flex: 1 }]}>
                          <TextInput
                            style={[styles.inputRowItem, styles.foodInput, focusedField === 'foodInput' && styles.inputRowItemFocused]}
                            placeholder="Add a food you like (Optional)"
                            placeholderTextColor="#8B8B8B"
                            value={foodInput}
                            onChangeText={setFoodInput}
                            onSubmitEditing={addFood}
                            returnKeyType="done"
                            onFocus={() => setFocusedField('foodInput')}
                            onBlur={() => setFocusedField(null)}
                          />
                          {focusedField === 'foodInput' && <View style={styles.inputFocusIndicator} />}
                        </View>
                        <Pressable 
                          style={styles.addButton} 
                          onPress={addFood}
                        >
                          <LinearGradient
                            colors={["#1E3A5F", "#4A90E2"]}
                            style={styles.addButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                          </LinearGradient>
                        </Pressable>
                      </View>
                      
                      {foods.length > 0 && (
                        <View style={styles.foodsList}>
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
                                  <Ionicons name="close" size={16} color="#888888" />
                                </Pressable>
                              </View>
                            )}
                            scrollEnabled={false}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
              
              <Text style={styles.disclaimer}>
                All fields are optional - you can customize everything later
              </Text>
            </Animated.ScrollView>

            {/* Enhanced Footer with Modern Button */}
            <View style={styles.footer}>
              <Pressable 
                style={[styles.nextButton, isLoading && styles.nextButtonLoading]} 
                onPress={handleNextStep}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ["#888888", "#AAAAAA"] : ["#1E3A5F", "#4A90E2"]}
                  style={styles.nextButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <>
                      <Text style={styles.nextButtonText}>Processing...</Text>
                      <MaterialCommunityIcons 
                        name="loading" 
                        size={20} 
                        color="#FFFFFF"
                        style={[styles.buttonIcon, { transform: [{ rotate: '45deg' }] }]}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>
                        {step < formConfig.length - 1 ? "Continue" : "Complete Setup"}
                      </Text>
                      <Ionicons 
                        name={step < formConfig.length - 1 ? "arrow-forward" : "checkmark"} 
                        size={20} 
                        color="#FFFFFF" 
                        style={styles.buttonIcon}
                      />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
              
              {step > 0 && !isLoading && (
                <Pressable style={styles.skipButton} onPress={handlePreviousStep}>
                  <Text style={styles.skipButtonText}>← Previous Step</Text>
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(30, 58, 95, 0.3)",
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginLeft: 8,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(30, 58, 95, 0.05)",
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  backButtonDisabled: {
    opacity: 0.3,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 44,
  },
  mainTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#AAAAAA",
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#1E3A5F",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#CCCCCC",
    textAlign: "center",
    fontWeight: "600",
  },
  stepsIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  stepTab: {
    alignItems: 'center',
    gap: 10,
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "bold",
  },
  activeStepNumber: {
    color: "#FFFFFF",
  },
  stepText: {
    fontSize: 12,
    color: "#888888",
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 70,
  },
  activeStepText: {
    color: "#1E3A5F",
    fontWeight: '700',
  },
  completedStepText: {
    color: "#4CAF50",
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },
  formSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(30, 58, 95, 0.2)",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 12,
    fontWeight: "600",
    lineHeight: 22,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 0,
  },
  inputContainerFocused: {
    transform: [{ scale: 1.02 }],
  },
  inputFocusIndicator: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1E3A5F',
    borderRadius: 2,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    flex: 1,
  },
  inputRowItem: {
    color: "#FFFFFF",
    padding: 18,
    fontSize: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
    fontWeight: '500',
  },
  inputRowItemFocused: {
    borderColor: "#1E3A5F",
    backgroundColor: "rgba(30, 58, 95, 0.1)",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: "#2A2A2A",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderWidth: 1.5,
  },
  mealPlanContainer: {
    flex: 1,
  },
  foodInputSection: {
    marginTop: 8,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 16,
  },
  foodInput: {
    marginBottom: 0,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  foodsList: {
    maxHeight: 140,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  foodText: {
    fontSize: 15,
    color: "#FFFFFF",
    flex: 1,
    fontWeight: '500',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  disclaimer: {
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: "rgba(42, 42, 42, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    alignItems: 'center',
    gap: 12,
  },
  nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonLoading: {
    opacity: 0.8,
  },
  nextButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonIcon: {
    opacity: 0.9,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: "#AAAAAA",
    fontWeight: "600",
  },
});
