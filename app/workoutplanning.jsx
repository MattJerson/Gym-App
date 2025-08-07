import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import RegistrationHeader from '../components/RegistrationHeader'; // Assuming this component exists

export default function WorkoutPlanning() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  // State for Fitness Level
  const [fitnessLevelOpen, setFitnessLevelOpen] = useState(false);
  const [fitnessLevel, setFitnessLevel] = useState(null);
  const [fitnessLevelItems, setFitnessLevelItems] = useState([
    { label: "Basic", value: "basic" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ]);

  // State for Training Location
  const [trainingLocationOpen, setTrainingLocationOpen] = useState(false);
  const [trainingLocation, setTrainingLocation] = useState(null);
  const [trainingLocationItems, setTrainingLocationItems] = useState([
    { label: "At Home", value: "home" },
    { label: "At the Gym", value: "gym" },
  ]);

  // State for Training Duration
  const [trainingDurationOpen, setTrainingDurationOpen] = useState(false);
  const [trainingDuration, setTrainingDuration] = useState(null);
  const [trainingDurationItems, setTrainingDurationItems] = useState([
    { label: "20 mins", value: "20" },
    { label: "30 mins", value: "30" },
    { label: "45 mins", value: "45" },
    { label: "60 mins", value: "60" },
    { label: "More than 90 mins", value: "90+" },
  ]);

  // State for Muscle Group Focus
  const [muscleFocusOpen, setMuscleFocusOpen] = useState(false);
  const [muscleFocus, setMuscleFocus] = useState(null);
  const [muscleFocusItems, setMuscleFocusItems] = useState([
    { label: "General Growth", value: "general" },
    { label: "Legs and Glutes", value: "legs_glutes" },
    { label: "Back", value: "back" },
    { label: "Chest", value: "chest" },
    { label: "Shoulders and Arms", value: "shoulders_arms" },
    { label: "Core", value: "core" },
  ]);

  // State for Injuries (Multiple choice)
  const [injuriesOpen, setInjuriesOpen] = useState(false);
  const [injuries, setInjuries] = useState([]);
  const [injuriesItems, setInjuriesItems] = useState([
    { label: "Lower Back", value: "lower_back" },
    { label: "Knees", value: "knees" },
    { label: "Shoulder", value: "shoulder" },
    { label: "No Injuries", value: "none" },
  ]);

  // State for Training Frequency
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [trainingFrequency, setTrainingFrequency] = useState(null);
  const [frequencyItems, setFrequencyItems] = useState([
    { label: "2 days/week", value: "2" },
    { label: "3 days/week", value: "3" },
    { label: "4 days/week", value: "4" },
    { label: "5 days/week", value: "5" },
    { label: "6 days/week", value: "6" },
  ]);

  // Callbacks to close other dropdowns when one opens
  const onFitnessLevelOpen = useCallback(() => {
    setTrainingLocationOpen(false);
    setTrainingDurationOpen(false);
    setMuscleFocusOpen(false);
    setInjuriesOpen(false);
    setFrequencyOpen(false);
  }, []);

  const onTrainingLocationOpen = useCallback(() => {
    setFitnessLevelOpen(false);
    setTrainingDurationOpen(false);
    setMuscleFocusOpen(false);
    setInjuriesOpen(false);
    setFrequencyOpen(false);
  }, []);

  const onTrainingDurationOpen = useCallback(() => {
    setFitnessLevelOpen(false);
    setTrainingLocationOpen(false);
    setMuscleFocusOpen(false);
    setInjuriesOpen(false);
    setFrequencyOpen(false);
  }, []);
  
  const onMuscleFocusOpen = useCallback(() => {
    setFitnessLevelOpen(false);
    setTrainingLocationOpen(false);
    setTrainingDurationOpen(false);
    setInjuriesOpen(false);
    setFrequencyOpen(false);
  }, []);

  const onInjuriesOpen = useCallback(() => {
    setFitnessLevelOpen(false);
    setTrainingLocationOpen(false);
    setTrainingDurationOpen(false);
    setMuscleFocusOpen(false);
    setFrequencyOpen(false);
  }, []);

  const onFrequencyOpen = useCallback(() => {
    setFitnessLevelOpen(false);
    setTrainingLocationOpen(false);
    setTrainingDurationOpen(false);
    setMuscleFocusOpen(false);
    setInjuriesOpen(false);
  }, []);


  const handleSubmit = () => {
    // Validation check for all fields
    if (
      !fitnessLevel ||
      !trainingLocation ||
      !trainingDuration ||
      !muscleFocus ||
      injuries.length === 0 ||
      !trainingFrequency
    ) {
      alert("Please fill in all fields.");
      return;
    }
    
    // Logic check: if "No Injuries" is selected, no other injury should be selected.
    if (injuries.includes('none') && injuries.length > 1) {
        alert("If 'No Injuries' is selected, please deselect other injury options.");
        return;
    }

    // Construct the data object with the new state values
    const workoutData = {
      fitnessLevel,
      trainingLocation,
      trainingDuration,
      muscleFocus,
      injuries,
      trainingFrequency,
    };

    console.log("Workout Plan:", workoutData);
    router.push("/mealplan");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.content}>
                <View style={styles.backRow}>
                  <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                  </Pressable>
                </View>

                <Text style={styles.title}>Information</Text>
                <RegistrationHeader />

                <Text style={styles.questionLabel}>Fitness Level?</Text>
                <DropDownPicker
                  open={fitnessLevelOpen}
                  value={fitnessLevel}
                  items={fitnessLevelItems}
                  setOpen={setFitnessLevelOpen}
                  setValue={setFitnessLevel}
                  setItems={setFitnessLevelItems}
                  onOpen={onFitnessLevelOpen}
                  placeholder="Select Fitness Level"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                  zIndex={6000}
                />

                <Text style={styles.questionLabel}>Where do you train?</Text>
                <DropDownPicker
                  open={trainingLocationOpen}
                  value={trainingLocation}
                  items={trainingLocationItems}
                  setOpen={setTrainingLocationOpen}
                  setValue={setTrainingLocation}
                  setItems={setTrainingLocationItems}
                  onOpen={onTrainingLocationOpen}
                  placeholder="Select Location"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                  zIndex={5000}
                />

                <Text style={styles.questionLabel}>How long do you train?</Text>
                <DropDownPicker
                  open={trainingDurationOpen}
                  value={trainingDuration}
                  items={trainingDurationItems}
                  setOpen={setTrainingDurationOpen}
                  setValue={setTrainingDuration}
                  setItems={setTrainingDurationItems}
                  onOpen={onTrainingDurationOpen}
                  placeholder="Select Duration"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                  zIndex={4000}
                />

                <Text style={styles.questionLabel}>Interested in growing a specific muscle?</Text>
                <DropDownPicker
                  open={muscleFocusOpen}
                  value={muscleFocus}
                  items={muscleFocusItems}
                  setOpen={setMuscleFocusOpen}
                  setValue={setMuscleFocus}
                  setItems={setMuscleFocusItems}
                  onOpen={onMuscleFocusOpen}
                  placeholder="Select Muscle Group"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                  zIndex={3000}
                />

                <Text style={styles.questionLabel}>Any Injuries?</Text>
                <DropDownPicker
                  multiple
                  open={injuriesOpen}
                  value={injuries}
                  items={injuriesItems}
                  setOpen={setInjuriesOpen}
                  setValue={setInjuries}
                  setItems={setInjuriesItems}
                  onOpen={onInjuriesOpen}
                  placeholder="Select Injuries (if any)"
                  mode="BADGE"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                  zIndex={2000}
                />

                <Text style={styles.questionLabel}>How often do you want to train?</Text>
                <DropDownPicker
                  open={frequencyOpen}
                  value={trainingFrequency}
                  items={frequencyItems}
                  setOpen={setFrequencyOpen}
                  setValue={setTrainingFrequency}
                  setItems={setFrequencyItems}
                  onOpen={onFrequencyOpen}
                  placeholder="Select Frequency"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                  zIndex={1000}
                />

                <Text style={styles.disclaimer}>
                  You can always fully customize your plan afterwards
                </Text>

                <Pressable style={[styles.button, { width: width * 0.7 }]} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Save Plan</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  backRow: {
    position: "absolute",
    top: 0,
    left: 20,
    zIndex: 10,
  },
    inner: {
    flex: 1,
  justifyContent: "flex-start",
  },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: -20,
  },
  questionLabel: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "500",
    width: Dimensions.get("window").width * 0.7,
    textAlign: "left",
    marginBottom: 10,
  },
  disclaimer: {
    marginTop: 5,
    textAlign: "center",
    color: "#ccc",
    fontSize: 12,
    fontWeight: "500",
    width: Dimensions.get("window").width * 0.7,
  },
  dropdown: {
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "transparent",
    width: Dimensions.get("window").width * 0.7,
    marginBottom: 15,
    alignSelf: "center",
  },
  dropdownContainer: {
    backgroundColor: "#333",
    borderColor: "transparent",
    width: Dimensions.get("window").width * 0.7,
    alignSelf: "center",
  },
  button: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    elevation: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
