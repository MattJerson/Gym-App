import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function WorkoutPlanning() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const [workoutTypeOpen, setWorkoutTypeOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState(null);
  const [workoutTypeItems, setWorkoutTypeItems] = useState([
    { label: "Cardio", value: "cardio" },
    { label: "Weights", value: "weights" },
    { label: "Yoga", value: "yoga" },
  ]);

  const [timeOpen, setTimeOpen] = useState(false);
  const [timePreference, setTimePreference] = useState(null);
  const [timeItems, setTimeItems] = useState([
    { label: "Morning", value: "morning" },
    { label: "Afternoon", value: "afternoon" },
    { label: "Evening", value: "evening" },
  ]);

  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [equipmentItems, setEquipmentItems] = useState([
    { label: "Dumbbells", value: "dumbbells" },
    { label: "Resistance Bands", value: "bands" },
    { label: "Bodyweight", value: "bodyweight" },
  ]);

  const [experienceOpen, setExperienceOpen] = useState(false);
  const [experience, setExperience] = useState(null);
  const [experienceItems, setExperienceItems] = useState([
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ]);

  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [trainingFrequency, setTrainingFrequency] = useState(null);
  const [frequencyItems, setFrequencyItems] = useState([
    { label: "1-2 days", value: "1-2" },
    { label: "3-4 days", value: "3-4" },
    { label: "5-6 days", value: "5-6" },
    { label: "Everyday", value: "everyday" },
  ]);

  const [preferredDays, setPreferredDays] = useState("");

  const validateDays = (days) => {
    const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.split(/,\s*/).every((day) => validDays.includes(day.trim()));
  };

  const handleSubmit = () => {
    if (
      !workoutType ||
      !timePreference ||
      equipment.length === 0 ||
      !experience ||
      !trainingFrequency ||
      !preferredDays ||
      !validateDays(preferredDays)
    ) {
      alert("Please fill in all fields correctly (Valid days: Mon–Sun)");
      return;
    }

    const workoutData = {
      workoutType,
      timePreference,
      equipment,
      experience,
      trainingFrequency,
      preferredDays,
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
            <View style={styles.inner}>
              <View style={styles.backRow}>
                <Pressable onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </Pressable>
              </View>

              <Text style={styles.title}>WORKOUT PLANNING</Text>

              <DropDownPicker
                open={workoutTypeOpen}
                value={workoutType}
                items={workoutTypeItems}
                setOpen={setWorkoutTypeOpen}
                setValue={setWorkoutType}
                setItems={setWorkoutTypeItems}
                placeholder="Workout Type"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={6000}
                textStyle={styles.dropdownText}
              />

              <DropDownPicker
                open={timeOpen}
                value={timePreference}
                items={timeItems}
                setOpen={setTimeOpen}
                setValue={setTimePreference}
                setItems={setTimeItems}
                placeholder="Time of Day"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={5000}
                textStyle={styles.dropdownText}
              />

              <DropDownPicker
                multiple
                open={equipmentOpen}
                value={equipment}
                items={equipmentItems}
                setOpen={setEquipmentOpen}
                setValue={setEquipment}
                setItems={setEquipmentItems}
                placeholder="Equipment Available"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={4000}
                textStyle={styles.dropdownText}
              />

              <DropDownPicker
                open={experienceOpen}
                value={experience}
                items={experienceItems}
                setOpen={setExperienceOpen}
                setValue={setExperience}
                setItems={setExperienceItems}
                placeholder="Experience Level"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={3000}
                textStyle={styles.dropdownText}
              />

              <DropDownPicker
                open={frequencyOpen}
                value={trainingFrequency}
                items={frequencyItems}
                setOpen={setFrequencyOpen}
                setValue={setTrainingFrequency}
                setItems={setFrequencyItems}
                placeholder="Training Frequency"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={2000}
                textStyle={styles.dropdownText}
              />

              <TextInput
                style={styles.input}
                placeholder="Preferred Days (e.g., Mon, Wed, Fri)"
                placeholderTextColor="#999"
                value={preferredDays}
                onChangeText={setPreferredDays}
              />

              <Pressable style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Save Plan</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 55,
  },
  backRow: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 30,
    textAlign: "center",
  },
  dropdown: {
    width: Dimensions.get("window").width * 0.8,
    borderRadius: 25,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "transparent",
    alignSelf: "center",
  },
  dropdownContainer: {
    width: Dimensions.get("window").width * 0.8,
    backgroundColor: "#333",
    borderColor: "transparent",
    alignSelf: "center",
  },
  dropdownText: {
    color: "#fff",
  },
  input: {
    width: Dimensions.get("window").width * 0.8,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#ff4d4d",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
