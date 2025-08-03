// unchanged imports ...
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";

export default function BasicInfo() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [useMetric, setUseMetric] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [genderOpen, setGenderOpen] = useState(false);
  const [gender, setGender] = useState(null);
  const [genderItems, setGenderItems] = useState([
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ]);

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityLevel, setActivityLevel] = useState(null);
  const [activityItems, setActivityItems] = useState([
    { label: "Sedentary", value: "sedentary" },
    { label: "Lightly Active", value: "light" },
    { label: "Moderately Active", value: "moderate" },
    { label: "Very Active", value: "active" },
    { label: "Extra Active", value: "extra" },
  ]);

  const [goalOpen, setGoalOpen] = useState(false);
  const [fitnessGoal, setFitnessGoal] = useState(null);
  const [goalItems, setGoalItems] = useState([
    { label: "Lose Weight", value: "lose" },
    { label: "Maintain Weight", value: "maintain" },
    { label: "Gain Muscle", value: "gain" },
  ]);

  const closeAllDropdowns = () => {
    setGenderOpen(false);
    setActivityOpen(false);
    setGoalOpen(false);
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = () => {
    if (
      !height ||
      !weight ||
      !age ||
      !gender ||
      !activityLevel ||
      !fitnessGoal
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    console.log("Basic Info:", {
      height,
      weight,
      age,
      gender,
      activityLevel,
      fitnessGoal,
      units: useMetric ? "Metric" : "Imperial",
    });

    router.push("/workoutplanning");
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        closeAllDropdowns();
      }}
    >
      <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView style={styles.scrollContent}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              <Text style={styles.title}>Basic Info</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Metric Units</Text>
                <Switch
                  value={useMetric}
                  onValueChange={setUseMetric}
                  trackColor={{ false: "#767577", true: "#ff4d4d" }}
                  thumbColor={useMetric ? "#fff" : "#ccc"}
                />
              </View>

              <View style={styles.duoRow}>
                <TextInput
                  style={styles.duoInput}
                  placeholder={`Height (${useMetric ? "cm" : "ft"})`}
                  placeholderTextColor="#999"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.duoInput}
                  placeholder={`Weight (${useMetric ? "kg" : "lbs"})`}
                  placeholderTextColor="#999"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor="#999"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />

              <DropDownPicker
                open={genderOpen}
                value={gender}
                items={genderItems}
                setOpen={setGenderOpen}
                setValue={setGender}
                setItems={setGenderItems}
                placeholder="Select Gender"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                onOpen={() => {
                  closeAllDropdowns();
                  setGenderOpen(true);
                }}
                zIndex={3000}
                textStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />

              <DropDownPicker
                open={activityOpen}
                value={activityLevel}
                items={activityItems}
                setOpen={setActivityOpen}
                setValue={setActivityLevel}
                setItems={setActivityItems}
                placeholder="Activity Level"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                onOpen={() => {
                  closeAllDropdowns();
                  setActivityOpen(true);
                }}
                zIndex={2000}
                textStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />

              <DropDownPicker
                open={goalOpen}
                value={fitnessGoal}
                items={goalItems}
                setOpen={setGoalOpen}
                setValue={setFitnessGoal}
                setItems={setGoalItems}
                placeholder="Fitness Goal"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                onOpen={() => {
                  closeAllDropdowns();
                  setGoalOpen(true);
                }}
                zIndex={1000}
                textStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />

              <Pressable
                style={[styles.button, { width: width * 0.7 }]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 30,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  label: {
    color: "#fff",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: Dimensions.get("window").width * 0.7,
    marginBottom: 15,
    alignItems: "center",
  },
  duoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: Dimensions.get("window").width * 0.7,
    marginBottom: 15,
  },
  duoInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: 15,
    borderRadius: 25,
    fontSize: 16,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 5,
  },
  input: {
    width: Dimensions.get("window").width * 0.7,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
    fontSize: 16,
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
