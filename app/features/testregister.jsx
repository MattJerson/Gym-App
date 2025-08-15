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
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";

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


  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const addFood = () => {
    if (!foodInput.trim()) return;
    setFoods((prev) => [...prev, foodInput.trim()]);
    setFoodInput("");
  };

  const removeFood = (index) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
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
  };

  const handlePreviousStep = () => {
    if (step > 0) setStep(prev => prev - 1);
  };
  
  const renderField = (field) => {
    const placeholder = Array.isArray(field.placeholder) 
        ? (formData.useMetric ? field.placeholder[0] : field.placeholder[1]) 
        : field.placeholder;

    switch (field.type) {
        case 'text':
            return <TextInput style={styles.inputRowItem} placeholder={placeholder} placeholderTextColor="#999" value={formData[field.name]} onChangeText={(val) => handleInputChange(field.name, val)} keyboardType={field.keyboardType || 'default'} />;
        case 'dropdown':
            return <DropDownPicker open={openDropdown === field.name} value={formData[field.name]} items={field.items} setOpen={() => setOpenDropdown(openDropdown === field.name ? '' : field.name)} setValue={(callback) => handleInputChange(field.name, callback(formData[field.name]))} multiple={field.multiple || false} mode={field.multiple ? "BADGE" : "SIMPLE"} placeholder={placeholder} style={styles.inputRowItem} dropDownContainerStyle={styles.dropdownContainer} textStyle={{ color: "#fff" }} labelStyle={{ color: "#fff" }} />;
        case 'switch':
            return <View style={styles.switchContainer}><Text style={styles.label}>{field.label}</Text><Switch value={formData[field.name]} onValueChange={(val) => handleInputChange(field.name, val)} trackColor={{ false: "#767577", true: "#ff4d4d" }} thumbColor={formData[field.name] ? "#fff" : "#ccc"} /></View>;
        default:
            return null;
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
            <View style={styles.headerContainer}>
              <View style={styles.topHeaderRow}>
                <Pressable onPress={handlePreviousStep} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={28} color={step > 0 ? "#fff" : "#444"} />
                </Pressable>
                <Text style={styles.mainTitle}>REGISTER</Text>
              </View>
              <View style={styles.stepsIndicatorContainer}>
                {formConfig.map((config, index) => (
                  <Pressable key={index} onPress={() => setStep(index)}>
                    <View style={[styles.stepIndicator, index === step && styles.activeStepIndicator]}>
                      <Text style={[styles.stepText, index === step && styles.activeStepText]}>{config.title}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {step < 2 ? (
                formConfig[step].fields.map((row, rowIndex) => (
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
                ))
              ) : (
                <View style={{width: '100%', zIndex: 1}}>
                  <DropDownPicker
                    open={mealTypeOpen}
                    value={mealType}
                    items={mealTypeItems}
                    setOpen={setMealTypeOpen}
                    setValue={setMealType}
                    setItems={setMealTypeItems}
                    placeholder="Meal Preference"
                    style={styles.inputRowItem}
                    dropDownContainerStyle={styles.dropdownContainer}
                    zIndex={3000}
                    textStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff" }}
                    containerStyle={{marginBottom: 15}}
                  />
                  <DropDownPicker
                    multiple
                    open={restrictionOpen}
                    value={restrictions}
                    items={restrictionItems}
                    setOpen={setRestrictionOpen}
                    setValue={setRestrictions}
                    setItems={setRestrictionItems}
                    placeholder="Dietary Restrictions"
                    mode="BADGE"
                    style={styles.inputRowItem}
                    dropDownContainerStyle={styles.dropdownContainer}
                    zIndex={2000}
                    textStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff" }}
                    containerStyle={{marginBottom: 15}}
                  />
                  <TextInput
                    style={styles.inputRowItem}
                    placeholder="Daily Calorie Goal"
                    placeholderTextColor="#999"
                    value={calorieGoal}
                    onChangeText={setCalorieGoal}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.inputRowItem, {marginTop: 15}]}
                    placeholder="Meals per Day"
                    placeholderTextColor="#999"
                    value={mealsPerDay}
                    onChangeText={setMealsPerDay}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.questionLabel, {marginTop: 15}]}>
                    What foods do you like?
                  </Text>
                  <View style={styles.foodRow}>
                    <TextInput
                      style={[styles.inputRowItem, { flex: 1, marginBottom: 0 }]}
                      placeholder="Add a food"
                      placeholderTextColor="#999"
                      value={foodInput}
                      onChangeText={setFoodInput}
                      onSubmitEditing={addFood}
                      returnKeyType="done"
                    />
                    <Pressable style={styles.addButton} onPress={addFood}>
                      <Text style={styles.addButtonText}>ADD</Text>
                    </Pressable>
                  </View>
                  <FlatList
                    data={foods}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    renderItem={({ item, index }) => (
                      <View style={styles.foodItem}>
                        <Text style={styles.foodText}>{item}</Text>
                        <Pressable onPress={() => removeFood(index)}>
                          <Ionicons name="close" size={20} color="#fff" />
                        </Pressable>
                      </View>
                    )}
                    style={{ marginTop: 10, maxHeight: 150 }}
                  />
                </View>
              )}
              <Text style={styles.disclaimer}>You can always fully customize your plan afterwards</Text>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={[styles.button, { width: width * 0.7 }]} onPress={handleNextStep}>
                <Text style={styles.buttonText}>{step < formConfig.length - 1 ? "Next" : "Generate Plan"}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  mainTitle: {
    fontSize: 22,
    letterSpacing: 2,
    color: "#ffffff",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  stepsIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  stepIndicator: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeStepIndicator: {
    borderBottomColor: '#ff4d4d',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  activeStepText: {
    color: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionLabel: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 10,
    fontWeight: "500",
    textAlign: "left",
    width: '100%',
  },
  disclaimer: {
    marginTop: 15,
    fontSize: 12,
    color: "#ccc",
    fontWeight: "500",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    color: "#fff",
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    gap: 15,
  },
  inputRowItem: {
    color: "#fff",
    padding: 15,
    paddingLeft: 24,
    fontSize: 13,
    borderRadius: 25,
    textAlign: "left",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: 'transparent',
  },
  dropdownContainer: {
    backgroundColor: "#333",
    borderColor: "transparent",
    borderRadius: 25,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 10,
    alignItems: 'center',
    backgroundColor: '#2d2d2d'
  },
  button: {
    elevation: 5,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#ff4d4d",
  },
  buttonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  addButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#ff4d4d",
    justifyContent: 'center',
    height: 50,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  foodItem: {
    marginTop: 8,
    borderRadius: 20,
    paddingVertical: 10,
    flexDirection: "row",
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  foodText: {
    fontSize: 16,
    color: "#fff",
  },
});