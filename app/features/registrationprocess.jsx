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
  const { width } = Dimensions.get("window");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  
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

  // Haptic feedback function
  const lightHaptic = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };


  const handleInputChange = (name, value) => {
    lightHaptic();
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const addFood = () => {
    if (!foodInput.trim()) return;
    lightHaptic();
    setFoods((prev) => [...prev, foodInput.trim()]);
    setFoodInput("");
  };

  const removeFood = (index) => {
    lightHaptic();
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    lightHaptic();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
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
      router.replace('../features/bodyfatuser');
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
              <View style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="create-outline"
                    style={[
                      styles.icon,
                      isFocused && styles.iconFocused
                    ]}
                  />
                </View>
                <TextInput 
                  style={styles.textInput} 
                  placeholder={`${placeholder} (Optional)`}
                  placeholderTextColor="#666" 
                  value={formData[field.name]} 
                  onChangeText={(val) => handleInputChange(field.name, val)} 
                  keyboardType={field.keyboardType || 'default'}
                  onFocus={() => setFocusedField(field.name)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            );
        case 'dropdown':
            return (
              <View style={[
                styles.inputContainer,
                openDropdown === field.name && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="chevron-down-outline"
                    style={[
                      styles.icon,
                      openDropdown === field.name && styles.iconFocused
                    ]}
                  />
                </View>
                <DropDownPicker 
                  open={openDropdown === field.name} 
                  value={formData[field.name]} 
                  items={field.items} 
                  setOpen={() => {
                    setOpenDropdown(openDropdown === field.name ? '' : field.name);
                    lightHaptic();
                  }}
                  setValue={(callback) => handleInputChange(field.name, callback(formData[field.name]))} 
                  multiple={field.multiple || false} 
                  mode={field.multiple ? "BADGE" : "SIMPLE"} 
                  placeholder={`${placeholder} (Optional)`}
                  style={styles.dropdownInput} 
                  dropDownContainerStyle={styles.dropdownContainer} 
                  textStyle={{ color: "#fff", fontSize: 16 }} 
                  labelStyle={{ color: "#fff", fontSize: 16 }} 
                  placeholderStyle={{ color: "#666", fontSize: 16 }}
                  arrowIconStyle={{ tintColor: "#1E3A5F" }}
                  tickIconStyle={{ tintColor: "#1E3A5F" }}
                />
              </View>
            );
        case 'switch':
            return (
              <View style={styles.switchInputContainer}>
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
              </View>
            );
        default:
            return null;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>            {/* Header */}
            <View style={styles.header}>
              {step > 0 ? (
                <Pressable 
                  onPress={() => {
                    setStep(step - 1);
                    lightHaptic();
                  }}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
              ) : (
                <Pressable 
                  onPress={() => {
                    router.back();
                    lightHaptic();
                  }}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
              )}
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
              style={[
                styles.formScrollView,
                {
                  opacity: formAnim,
                  transform: [
                    {
                      translateY: formAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {step < 2 ? (
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>{formConfig[step].title}</Text>
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
                  <Text style={styles.sectionTitle}>Meal Plan Preferences</Text>
                  <Text style={styles.sectionSubtitle}>
                    Help us create a personalized meal plan for you
                  </Text>
                  
                  <View style={styles.mealPlanContainer}>
                    <Text style={styles.questionLabel}>What's your meal preference?</Text>
                    <View style={[
                      styles.inputContainer,
                      mealTypeOpen && styles.inputContainerFocused
                    ]}>
                      <View style={styles.inputIconContainer}>
                        <MaterialCommunityIcons name="food-apple" size={20} color={mealTypeOpen ? "#1E3A5F" : "#666"} />
                      </View>
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
                        style={styles.dropdownInput}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={3000}
                        textStyle={{ color: "#fff", fontSize: 16 }}
                        labelStyle={{ color: "#fff", fontSize: 16 }}
                        placeholderStyle={{ color: "#666", fontSize: 16 }}
                        arrowIconStyle={{ tintColor: "#1E3A5F" }}
                        tickIconStyle={{ tintColor: "#1E3A5F" }}
                        containerStyle={{marginBottom: 20}}
                      />
                    </View>
                    
                    <Text style={styles.questionLabel}>Any dietary restrictions?</Text>
                    <View style={[
                      styles.inputContainer,
                      restrictionOpen && styles.inputContainerFocused
                    ]}>
                      <View style={styles.inputIconContainer}>
                        <MaterialCommunityIcons name="food-off" size={20} color={restrictionOpen ? "#1E3A5F" : "#666"} />
                      </View>
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
                        style={styles.dropdownInput}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={2000}
                        textStyle={{ color: "#fff", fontSize: 16 }}
                        labelStyle={{ color: "#fff", fontSize: 16 }}
                        placeholderStyle={{ color: "#666", fontSize: 16 }}
                        arrowIconStyle={{ tintColor: "#1E3A5F" }}
                        tickIconStyle={{ tintColor: "#1E3A5F" }}
                        containerStyle={{marginBottom: 20}}
                      />
                    </View>
                    
                    <Text style={styles.questionLabel}>Daily calorie goal</Text>
                    <View style={[
                      styles.inputContainer,
                      focusedField === 'calorieGoal' && styles.inputContainerFocused
                    ]}>
                      <View style={styles.inputIconContainer}>
                        <MaterialCommunityIcons 
                          name="fire" 
                          size={20} 
                          color={focusedField === 'calorieGoal' ? "#1E3A5F" : "#666"} 
                        />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Daily Calorie Goal (Optional)"
                        placeholderTextColor="#666"
                        value={calorieGoal}
                        onChangeText={setCalorieGoal}
                        keyboardType="numeric"
                        onFocus={() => setFocusedField('calorieGoal')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    
                    <Text style={styles.questionLabel}>How many meals per day?</Text>
                    <View style={[
                      styles.inputContainer,
                      focusedField === 'mealsPerDay' && styles.inputContainerFocused
                    ]}>
                      <View style={styles.inputIconContainer}>
                        <MaterialCommunityIcons 
                          name="silverware-fork-knife" 
                          size={20} 
                          color={focusedField === 'mealsPerDay' ? "#1E3A5F" : "#666"} 
                        />
                      </View>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Meals per Day (Optional)"
                        placeholderTextColor="#666"
                        value={mealsPerDay}
                        onChangeText={setMealsPerDay}
                        keyboardType="numeric"
                        onFocus={() => setFocusedField('mealsPerDay')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    
                    <Text style={styles.questionLabel}>What foods do you enjoy?</Text>
                    <View style={styles.foodRow}>
                      <View style={[
                        styles.inputContainer,
                        focusedField === 'foodInput' && styles.inputContainerFocused,
                        { flex: 1 }
                      ]}>
                        <View style={styles.inputIconContainer}>
                          <MaterialCommunityIcons 
                            name="food" 
                            size={20} 
                            color={focusedField === 'foodInput' ? "#1E3A5F" : "#666"} 
                          />
                        </View>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Add a food you like (Optional)"
                          placeholderTextColor="#666"
                          value={foodInput}
                          onChangeText={setFoodInput}
                          onSubmitEditing={addFood}
                          returnKeyType="done"
                          onFocus={() => setFocusedField('foodInput')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                      <Pressable style={styles.addButton} onPress={addFood}>
                        <LinearGradient
                          colors={["#1E3A5F", "#4A90E2"]}
                          style={styles.addButtonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Ionicons name="add" size={20} color="#fff" />
                        </LinearGradient>
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
                      />
                    )}
                  </View>
                </View>
              )}
              
              <Text style={styles.disclaimer}>
                All fields are optional - you can customize everything later in your profile
              </Text>
            </Animated.ScrollView>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, isLoading && styles.submitButtonLoading]}
              onPress={handleNextStep}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ["#666", "#888"] : ["#1E3A5F", "#4A90E2"]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
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
              </LinearGradient>
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
  },  content: {
    width: "100%",
    alignItems: "center",
    maxWidth: 400,
    flex: 1,
    paddingTop: 20,
  },  header: {
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
    borderRadius: 20,
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
    marginBottom: 30,
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
    paddingBottom: 100,
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
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    maxWidth: 280,
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
  inputContainer: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: "#1E3A5F",
    backgroundColor: "rgba(30, 58, 95, 0.1)",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconContainer: {
    width: 50,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 20,
    color: "#666",
  },
  iconFocused: {
    color: "#1E3A5F",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    height: "100%",
    paddingRight: 16,
  },
  dropdownInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
    flex: 1,
    height: "100%",
    paddingRight: 16,
  },
  dropdownContainer: {
    backgroundColor: "#333",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    marginTop: 4,
  },
  switchInputContainer: {
    width: "100%",
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    justifyContent: "space-between",
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
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
  mealPlanContainer: {
    width: "100%",
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    flex: 1,
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
    marginTop: 24,
    fontStyle: "italic",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  submitButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  submitButtonIcon: {
    opacity: 0.8,
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