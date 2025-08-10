import {
  View,
  Text,
  Alert,
  Keyboard,
  Platform,
  FlatList,
  TextInput,
  Pressable,
  Dimensions,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import RegistrationHeader from "../../components/RegistrationHeader";

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

  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState([]);

  const addFood = () => {
    if (!foodInput.trim()) return;
    setFoods((prev) => [...prev, foodInput.trim()]);
    setFoodInput("");
  };

  const removeFood = (index) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

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
      foods,
    };

    console.log("Meal Plan:", mealPlanData);
    router.push("/features/bodyfatinfo");
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.inner}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <View style={styles.backRow}>
                  <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                  </Pressable>
                </View>
                <Text style={styles.title}>Information</Text>
                <RegistrationHeader />
              </View>

              <View style={styles.form}>
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
                <Text style={styles.questionLabel}>
                  What foods do you like?
                </Text>
                {/* Food input and add button */}
                <View style={styles.foodRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
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

                {/* List of foods */}
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
                  style={{ marginTop: 10, width: width * 0.8 }}
                />
                <Text style={styles.disclaimer}>
                  You can always fully customize your plan afterwards
                </Text>
                <Pressable style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Submit</Text>
                </Pressable>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    paddingBottom: 55,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  header: {
    width: "100%",
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backRow: {
    width: "100%",
    marginBottom: 10,
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  questionLabel: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 10,
    fontWeight: "500",
    textAlign: "left",
    width: Dimensions.get("window").width * 0.7,
  },
  disclaimer: {
    marginTop: 5,
    fontSize: 12,
    color: "#ccc",
    fontWeight: "500",
    textAlign: "center",
    width: Dimensions.get("window").width * 0.7,
  },
  title: {
    fontSize: 22,
    marginTop: -35,
    letterSpacing: 2,
    color: "#ffffff",
    marginBottom: -20,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  form: {
    paddingBottom: 55,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
    width: Dimensions.get("window").width * 0.9,
  },
  dropdown: {
    borderRadius: 25,
    marginBottom: 15,
    alignSelf: "center",
    borderColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.1)",
    width: Dimensions.get("window").width * 0.8,
  },
  dropdownContainer: {
    alignSelf: "center",
    backgroundColor: "#333",
    borderColor: "transparent",
    width: Dimensions.get("window").width * 0.8,
  },
  dropdownText: {
    color: "#fff",
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: "#fff",
    borderRadius: 25,
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: Dimensions.get("window").width * 0.8,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
    marginTop: 10,
  },
  addButton: {
    marginLeft: 8,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#ff4d4d",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  foodItem: {
    marginBottom: 8,
    borderRadius: 20,
    paddingVertical: 8,
    flexDirection: "row",
    paddingHorizontal: 12,
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  foodText: {
    fontSize: 16,
    color: "#fff",
  },
  button: {
    marginTop: 20,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#ff4d4d",
    width: Dimensions.get("window").width * 0.7,
  },
  buttonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
