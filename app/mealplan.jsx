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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function MealPlanSetup() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

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

  const handleSubmit = () => {
    if (!mealType || !calorieGoal || !mealsPerDay) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const mealPlanData = {
      mealType,
      restrictions,
      calorieGoal,
      mealsPerDay,
    };

    console.log("Meal Plan:", mealPlanData);
    router.push("/home");
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

              <Text style={styles.title}>MEAL PLAN SETUP</Text>

              <DropDownPicker
                open={mealTypeOpen}
                value={mealType}
                items={mealTypeItems}
                setOpen={setMealTypeOpen}
                setValue={setMealType}
                setItems={setMealTypeItems}
                placeholder="Meal Preference"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={3000}
                textStyle={styles.dropdownText}
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
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={2000}
                textStyle={styles.dropdownText}
              />

              <TextInput
                style={styles.input}
                placeholder="Daily Calorie Goal"
                placeholderTextColor="#999"
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Meals per Day"
                placeholderTextColor="#999"
                value={mealsPerDay}
                onChangeText={setMealsPerDay}
                keyboardType="numeric"
              />

              <Pressable style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Save Meal Plan</Text>
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
    flexGrow: 1,
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
