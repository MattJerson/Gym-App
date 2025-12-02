import {
  View,
  Text,
  Alert,
  Switch,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import SettingsHeader from "../../components/SettingsHeader";
import DropDownPicker from "react-native-dropdown-picker";
import { SettingsPageSkeleton } from "../../components/skeletons/SettingsPageSkeleton";
import { validateMessage } from "../../services/ChatServices";

export default function EditProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Account Data
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Profile Data (from registration_profiles)
  const [profileData, setProfileData] = useState({
    avatarEmoji: "😊",
    gender: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    use_metric: true,
    activity_level: "",
    fitness_goal: "",
    favorite_foods: [],
    fitness_level: "",
    training_location: "",
    training_duration: "",
    muscle_focus: [],
    injuries: [],
    training_frequency: "",
    meal_type: "",
    restrictions: [],
    meals_per_day: "",
    calorie_goal: "",
    current_body_fat: "",
    goal_body_fat: "",
  });

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState("");
  
  // Food input states
  const [foodInput, setFoodInput] = useState("");
  const [foodError, setFoodError] = useState("");

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      // Get current user from auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        Alert.alert("Error", "No authenticated user found");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      setName(
        user.user_metadata?.full_name || user.user_metadata?.nickname || ""
      );

      // Fetch profile data from registration_profiles
      const { data: profileData, error: profileError } = await supabase
        .from("registration_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError);
      }

      if (profileData) {
        setProfileData({
          avatarEmoji: profileData.avatar_emoji || "😊",
          gender: profileData.gender || "",
          age: profileData.age?.toString() || "",
          height_cm: profileData.height_cm?.toString() || "",
          weight_kg: profileData.weight_kg?.toString() || "",
          use_metric: profileData.use_metric ?? true,
          activity_level: profileData.activity_level || "",
          fitness_goal: profileData.fitness_goal || "",
          favorite_foods: profileData.favorite_foods || [],
          fitness_level: profileData.fitness_level || "",
          training_location: profileData.training_location || "",
          training_duration: profileData.training_duration?.toString() || "",
          muscle_focus: Array.isArray(profileData.muscle_focus) 
            ? profileData.muscle_focus 
            : (profileData.muscle_focus ? [profileData.muscle_focus] : []),
          injuries: profileData.injuries || [],
          training_frequency: profileData.training_frequency || "",
          meal_type: profileData.meal_type || "",
          restrictions: profileData.restrictions || [],
          meals_per_day: profileData.meals_per_day?.toString() || "",
          calorie_goal: profileData.calorie_goal?.toString() || "",
          current_body_fat: "",
          goal_body_fat: "",
        });
      }

      // Fetch body fat data from bodyfat_profiles
      const { data: bodyFatData, error: bodyFatError } = await supabase
        .from("bodyfat_profiles")
        .select("current_body_fat, goal_body_fat")
        .eq("user_id", user.id)
        .single();

      if (!bodyFatError && bodyFatData) {
        setProfileData(prev => ({
          ...prev,
          current_body_fat: bodyFatData.current_body_fat?.toString() || "",
          goal_body_fat: bodyFatData.goal_body_fat?.toString() || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const addFood = () => {
    const trimmed = foodInput.trim();
    setFoodError("");
    
    if (!trimmed) return;
    
    if (/^\d+$/.test(trimmed)) {
      setFoodError("Food name cannot be only numbers");
      return;
    }
    
    const isDuplicate = profileData.favorite_foods.some(
      (food) => food.toLowerCase() === trimmed.toLowerCase()
    );
    
    if (isDuplicate) {
      setFoodError("You've already added this food");
      return;
    }
    
    setProfileData(prev => ({
      ...prev,
      favorite_foods: [...prev.favorite_foods, trimmed]
    }));
    setFoodInput("");
  };

  const removeFood = (index) => {
    setProfileData(prev => ({
      ...prev,
      favorite_foods: prev.favorite_foods.filter((_, i) => i !== index)
    }));
  };

  const toggleMuscleFocus = (value) => {
    if (!isEditing) return;
    
    setProfileData(prev => {
      const current = prev.muscle_focus || [];
      if (current.includes(value)) {
        return { ...prev, muscle_focus: current.filter(v => v !== value) };
      } else {
        return { ...prev, muscle_focus: [...current, value] };
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!userId) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Validate name/nickname for profanity
      if (name && name.trim()) {
        if (name.trim().length < 3) {
          Alert.alert("Invalid Name", "Name must be at least 3 characters.");
          setIsSaving(false);
          return;
        }
        if (name.trim().length > 20) {
          Alert.alert("Invalid Name", "Name must be 20 characters or less.");
          setIsSaving(false);
          return;
        }
        
        const validation = validateMessage(name);
        if (validation.hasProfanity) {
          Alert.alert("Inappropriate Name", "Your name contains inappropriate language. Please choose a different name.");
          setIsSaving(false);
          return;
        }
      }

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name, nickname: name },
      });

      if (authError) throw authError;

      // Update profiles table (for display in profile page)
      const { error: profilesError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: name,
            nickname: name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profilesError) {
        console.warn("Failed to update profiles table:", profilesError);
        // Don't throw - this is non-critical
      }

      // Prepare profile data payload
      const payload = {
        user_id: userId,
        avatar_emoji: profileData.avatarEmoji || "😊",
        gender: profileData.gender || null,
        age: profileData.age ? parseInt(profileData.age, 10) : null,
        height_cm: profileData.height_cm
          ? parseInt(profileData.height_cm, 10)
          : null,
        weight_kg: profileData.weight_kg
          ? parseFloat(profileData.weight_kg)
          : null,
        use_metric: profileData.use_metric,
        activity_level: profileData.activity_level || null,
        fitness_goal: profileData.fitness_goal || null,
        favorite_foods: profileData.favorite_foods,
        fitness_level: profileData.fitness_level || null,
        training_location: profileData.training_location || null,
        training_duration: profileData.training_duration
          ? parseInt(profileData.training_duration, 10)
          : null,
        muscle_focus: profileData.muscle_focus || null,
        injuries: profileData.injuries,
        training_frequency: profileData.training_frequency || null,
        meal_type: profileData.meal_type || null,
        restrictions: profileData.restrictions,
        meals_per_day: profileData.meals_per_day
          ? parseInt(profileData.meals_per_day, 10)
          : null,
        calorie_goal: profileData.calorie_goal
          ? parseInt(profileData.calorie_goal, 10)
          : null,
      };

      // Upsert registration profile
      const { error: profileError } = await supabase
        .from("registration_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (profileError) throw profileError;

      // Update body fat data if provided
      if (profileData.current_body_fat || profileData.goal_body_fat) {
        const bodyFatPayload = {
          user_id: userId,
          current_body_fat: profileData.current_body_fat 
            ? parseFloat(profileData.current_body_fat) 
            : null,
          goal_body_fat: profileData.goal_body_fat 
            ? parseFloat(profileData.goal_body_fat) 
            : null,
        };

        const { error: bodyFatError } = await supabase
          .from("bodyfat_profiles")
          .upsert(bodyFatPayload, { onConflict: "user_id" });

        if (bodyFatError) throw bodyFatError;
      }

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <SettingsHeader title="Edit Profile" />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <SettingsPageSkeleton />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Edit Mode Toggle */}
          <View style={styles.editModeContainer}>
            <Text style={styles.editModeText}>
              {isEditing ? "Editing Mode" : "View Mode"}
            </Text>
            <Pressable
              style={[styles.editButton, isEditing && styles.editButtonActive]}
              onPress={() => {
                if (!isEditing) {
                  setIsEditing(true);
                } else {
                  // Cancel editing - just exit edit mode without saving
                  setIsEditing(false);
                  fetchUserData(); // Reload original data
                }
              }}
            >
              <Ionicons
                name={isEditing ? "close-circle" : "create-outline"}
                size={20}
                color="#fff"
              />
              <Text style={styles.editButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </Pressable>
          </View>

          {/* Account Details Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color="#f7971e"
              />
              <Text style={styles.sectionTitle}>Account Details</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor="#666"
                  editable={isEditing}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={email}
                  editable={false}
                  placeholderTextColor="#666"
                />
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>
            </View>
          </View>

          {/* Profile Avatar Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="happy-outline"
                size={24}
                color="#f7971e"
              />
              <Text style={styles.sectionTitle}>Profile Avatar</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Select Your Emoji Avatar</Text>
              <Text style={styles.helperText}>
                Choose an emoji that represents you. This will appear throughout
                the app.
              </Text>

              {/* Current Emoji Display */}
              <View style={styles.currentEmojiContainer}>
                <Text style={styles.currentEmojiLabel}>Current Avatar:</Text>
                <View style={styles.currentEmojiDisplay}>
                  <Text style={styles.currentEmojiText}>
                    {profileData.avatarEmoji}
                  </Text>
                </View>
              </View>

              {/* Emoji Grid */}
              {isEditing && (
                <View style={styles.emojiGrid}>
                  {[
                    "😊", "😎", "🔥", "💪", "⚡", "🚀", "🎯", "👑", "💯", "🏆",
                    "⭐", "🌟", "🎮", "🎨", "🎵", "❤️", "💙", "💚", "💛", "🧡",
                    "💜", "🖤", "🤍", "🤎", "🦄", "🦁", "🐯", "🐻", "🐼", "🐨",
                    "🐸", "🦊", "🐱", "🐶", "🐷",
                  ].map((emoji, index) => (
                    <Pressable
                      key={index}
                      onPress={() =>
                        setProfileData({ ...profileData, avatarEmoji: emoji })
                      }
                      style={[
                        styles.emojiButton,
                        profileData.avatarEmoji === emoji &&
                          styles.emojiButtonSelected,
                      ]}
                    >
                      <Text style={styles.emojiButtonText}>{emoji}</Text>
                      {profileData.avatarEmoji === emoji && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {!isEditing && (
                <Text style={styles.disabledText}>
                  Enable edit mode to change your avatar
                </Text>
              )}
            </View>
          </View>

          {/* Basic Info Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="#4A9EFF"
              />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Gender</Text>
                  {isEditing ? (
                    <DropDownPicker
                      open={openDropdown === "gender"}
                      value={profileData.gender}
                      items={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Other", value: "other" },
                      ]}
                      setOpen={() => {
                        Keyboard.dismiss();
                        setOpenDropdown(openDropdown === "gender" ? "" : "gender");
                      }}
                      setValue={(callback) => {
                        const value = typeof callback === 'function' ? callback(profileData.gender) : callback;
                        setProfileData({ ...profileData, gender: value });
                      }}
                      placeholder="Select Gender"
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      textStyle={styles.dropdownText}
                      placeholderStyle={{ color: "#666" }}
                      zIndex={3000}
                      listMode="SCROLLVIEW"
                    />
                  ) : (
                    <View style={[styles.input, styles.inputDisabled]}>
                      <Text style={styles.valueText}>
                        {profileData.gender || "Not set"}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.age}
                    onChangeText={(val) =>
                      setProfileData({ ...profileData, age: val })
                    }
                    placeholder="Age"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>
                    Height ({profileData.use_metric ? "cm" : "in"})
                  </Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.height_cm}
                    onChangeText={(val) =>
                      setProfileData({ ...profileData, height_cm: val })
                    }
                    placeholder="Height"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>
                    Weight ({profileData.use_metric ? "kg" : "lbs"})
                  </Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.weight_kg}
                    onChangeText={(val) =>
                      setProfileData({ ...profileData, weight_kg: val })
                    }
                    placeholder="Weight"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Use Metric Units</Text>
                <Switch
                  value={profileData.use_metric}
                  onValueChange={(val) =>
                    isEditing &&
                    setProfileData({ ...profileData, use_metric: val })
                  }
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.1)",
                    true: "#1E3A5F",
                  }}
                  thumbColor={profileData.use_metric ? "#FFFFFF" : "#CCCCCC"}
                  disabled={!isEditing}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Activity Level</Text>
                {isEditing ? (
                  <DropDownPicker
                    open={openDropdown === "activity_level"}
                    value={profileData.activity_level}
                    items={[
                      { label: "Sedentary", value: "sedentary" },
                      { label: "Lightly Active", value: "light" },
                      { label: "Moderately Active", value: "moderate" },
                      { label: "Very Active", value: "active" },
                    ]}
                    setOpen={() => {
                      Keyboard.dismiss();
                      setOpenDropdown(openDropdown === "activity_level" ? "" : "activity_level");
                    }}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(profileData.activity_level) : callback;
                      setProfileData({ ...profileData, activity_level: value });
                    }}
                    placeholder="Select Activity Level"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={{ color: "#666" }}
                    zIndex={2000}
                    listMode="SCROLLVIEW"
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={styles.valueText}>
                      {profileData.activity_level || "Not set"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fitness Goal</Text>
                {isEditing ? (
                  <DropDownPicker
                    open={openDropdown === "fitness_goal"}
                    value={profileData.fitness_goal}
                    items={[
                      { label: "Lose Weight", value: "lose" },
                      { label: "Maintain Weight", value: "maintain" },
                      { label: "Gain Muscle", value: "gain" },
                    ]}
                    setOpen={() => {
                      Keyboard.dismiss();
                      setOpenDropdown(openDropdown === "fitness_goal" ? "" : "fitness_goal");
                    }}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(profileData.fitness_goal) : callback;
                      setProfileData({ ...profileData, fitness_goal: value });
                    }}
                    placeholder="Select Fitness Goal"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={{ color: "#666" }}
                    zIndex={1000}
                    listMode="SCROLLVIEW"
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={styles.valueText}>
                      {profileData.fitness_goal || "Not set"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Body Fat Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="body-outline" size={24} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Body Composition</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Current Body Fat (%)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      !isEditing && styles.inputDisabled,
                    ]}
                    value={profileData.current_body_fat}
                    onChangeText={(text) =>
                      setProfileData({ ...profileData, current_body_fat: text })
                    }
                    placeholder="e.g., 20"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Goal Body Fat (%)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      !isEditing && styles.inputDisabled,
                    ]}
                    value={profileData.goal_body_fat}
                    onChangeText={(text) =>
                      setProfileData({ ...profileData, goal_body_fat: text })
                    }
                    placeholder="e.g., 15"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
              </View>

              <Text style={styles.helperText}>
                Track your body fat percentage to monitor progress. Use the visual guide to estimate your current and goal body fat.
              </Text>
            </View>
          </View>

          {/* Training Preferences Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="barbell-outline" size={24} color="#00D4AA" />
              <Text style={styles.sectionTitle}>Training Preferences</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fitness Level</Text>
                {isEditing ? (
                  <DropDownPicker
                    open={openDropdown === "fitness_level"}
                    value={profileData.fitness_level}
                    items={[
                      { label: "Beginner", value: "basic" },
                      { label: "Intermediate", value: "intermediate" },
                      { label: "Advanced", value: "advanced" },
                    ]}
                    setOpen={() => {
                      Keyboard.dismiss();
                      setOpenDropdown(openDropdown === "fitness_level" ? "" : "fitness_level");
                    }}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(profileData.fitness_level) : callback;
                      setProfileData({ ...profileData, fitness_level: value });
                    }}
                    placeholder="Select Fitness Level"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={{ color: "#666" }}
                    zIndex={6000}
                    listMode="SCROLLVIEW"
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={styles.valueText}>
                      {profileData.fitness_level || "Not set"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Training Location</Text>
                {isEditing ? (
                  <DropDownPicker
                    open={openDropdown === "training_location"}
                    value={profileData.training_location}
                    items={[
                      { label: "At Home", value: "home" },
                      { label: "At the Gym", value: "gym" },
                    ]}
                    setOpen={() => {
                      Keyboard.dismiss();
                      setOpenDropdown(openDropdown === "training_location" ? "" : "training_location");
                    }}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(profileData.training_location) : callback;
                      setProfileData({ ...profileData, training_location: value });
                    }}
                    placeholder="Select Location"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={{ color: "#666" }}
                    zIndex={5000}
                    listMode="SCROLLVIEW"
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={styles.valueText}>
                      {profileData.training_location || "Not set"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Duration (mins)</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.training_duration}
                    onChangeText={(val) =>
                      setProfileData({ ...profileData, training_duration: val })
                    }
                    placeholder="Duration"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Frequency (days)</Text>
                  {isEditing ? (
                    <DropDownPicker
                      open={openDropdown === "training_frequency"}
                      value={profileData.training_frequency}
                      items={[
                        { label: "2 days/week", value: "2" },
                        { label: "3 days/week", value: "3" },
                        { label: "4 days/week", value: "4" },
                        { label: "5 days/week", value: "5" },
                        { label: "6 days/week", value: "6" },
                      ]}
                      setOpen={() => {
                        Keyboard.dismiss();
                        setOpenDropdown(openDropdown === "training_frequency" ? "" : "training_frequency");
                      }}
                      setValue={(callback) => {
                        const value = typeof callback === 'function' ? callback(profileData.training_frequency) : callback;
                        setProfileData({ ...profileData, training_frequency: value });
                      }}
                      placeholder="Select Frequency"
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      textStyle={styles.dropdownText}
                      placeholderStyle={{ color: "#666" }}
                      zIndex={4000}
                      listMode="SCROLLVIEW"
                    />
                  ) : (
                    <View style={[styles.input, styles.inputDisabled]}>
                      <Text style={styles.valueText}>
                        {profileData.training_frequency || "Not set"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Muscle Focus</Text>
                <View style={styles.multiButtonContainer}>
                  {[
                    { label: "General Growth", value: "general" },
                    { label: "Legs & Glutes", value: "legs_glutes" },
                    { label: "Back", value: "back" },
                    { label: "Chest", value: "chest" },
                    { label: "Shoulders & Arms", value: "shoulders_arms" },
                    { label: "Core", value: "core" },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.multiButton,
                        (profileData.muscle_focus || []).includes(option.value) && styles.multiButtonSelected,
                        !isEditing && styles.multiButtonDisabled,
                      ]}
                      onPress={() => toggleMuscleFocus(option.value)}
                      disabled={!isEditing}
                    >
                      <Text
                        style={[
                          styles.multiButtonText,
                          (profileData.muscle_focus || []).includes(option.value) && styles.multiButtonTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Injuries</Text>
                {isEditing ? (
                  <DropDownPicker
                    open={openDropdown === "injuries"}
                    value={profileData.injuries}
                    items={[
                      { label: "Lower Back", value: "lower_back" },
                      { label: "Knees", value: "knees" },
                      { label: "Shoulder", value: "shoulder" },
                      { label: "Wrist", value: "wrist" },
                      { label: "Ankle", value: "ankle" },
                    ]}
                    setOpen={() => {
                      Keyboard.dismiss();
                      setOpenDropdown(openDropdown === "injuries" ? "" : "injuries");
                    }}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(profileData.injuries) : callback;
                      setProfileData({ ...profileData, injuries: value });
                    }}
                    placeholder="Select Injuries (Optional)"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={{ color: "#666" }}
                    multiple={true}
                    mode="BADGE"
                    badgeDotColors={["#e74c3c"]}
                    zIndex={3000}
                    listMode="SCROLLVIEW"
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled, { minHeight: 44 }]}>
                    <Text style={styles.valueText}>
                      {profileData.injuries?.length > 0
                        ? profileData.injuries.join(", ")
                        : "None"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Nutrition Preferences Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant-outline" size={24} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Nutrition Preferences</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Meal Type</Text>
                {isEditing ? (
                  <DropDownPicker
                    open={openDropdown === "meal_type"}
                    value={profileData.meal_type}
                    items={[
                      { label: "Omnivore", value: "omnivore" },
                      { label: "Vegetarian", value: "vegetarian" },
                      { label: "Vegan", value: "vegan" },
                      { label: "Pescatarian", value: "pescatarian" },
                    ]}
                    setOpen={() => {
                      Keyboard.dismiss();
                      setOpenDropdown(openDropdown === "meal_type" ? "" : "meal_type");
                    }}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(profileData.meal_type) : callback;
                      setProfileData({ ...profileData, meal_type: value });
                    }}
                    placeholder="Select Meal Preference"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={{ color: "#666" }}
                    zIndex={3000}
                    listMode="SCROLLVIEW"
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={styles.valueText}>
                      {profileData.meal_type || "Not set"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Daily Calories</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.calorie_goal}
                    onChangeText={(val) =>
                      setProfileData({ ...profileData, calorie_goal: val })
                    }
                    placeholder="Calories"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Meals per Day</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.meals_per_day}
                    onChangeText={(val) =>
                      setProfileData({ ...profileData, meals_per_day: val })
                    }
                    placeholder="Meals"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dietary Restrictions</Text>
                {isEditing ? (
                  <DropDownPicker
                    open={openDropdown === "restrictions"}
                    value={profileData.restrictions}
                    items={[
                      { label: "Gluten-Free", value: "gluten-free" },
                      { label: "Dairy-Free", value: "dairy-free" },
                      { label: "Nut-Free", value: "nut-free" },
                      { label: "Soy-Free", value: "soy-free" },
                    ]}
                    setOpen={() => {
                      Keyboard.dismiss();
                      setOpenDropdown(openDropdown === "restrictions" ? "" : "restrictions");
                    }}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(profileData.restrictions) : callback;
                      setProfileData({ ...profileData, restrictions: value });
                    }}
                    placeholder="Select Restrictions (Optional)"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={{ color: "#666" }}
                    multiple={true}
                    mode="BADGE"
                    badgeDotColors={["#FF6B35"]}
                    zIndex={2000}
                    listMode="SCROLLVIEW"
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled, { minHeight: 44 }]}>
                    <Text style={styles.valueText}>
                      {profileData.restrictions?.length > 0
                        ? profileData.restrictions.join(", ")
                        : "None"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Favorite Foods</Text>
                {isEditing ? (
                  <>
                    <View style={styles.foodInputContainer}>
                      <TextInput
                        style={styles.foodInput}
                        value={foodInput}
                        onChangeText={setFoodInput}
                        placeholder="Add a food..."
                        placeholderTextColor="#666"
                        onSubmitEditing={addFood}
                        returnKeyType="done"
                        editable={isEditing}
                      />
                      <Pressable 
                        style={styles.addFoodButton} 
                        onPress={addFood}
                        disabled={!isEditing}
                      >
                        <Ionicons name="add-circle" size={32} color="#00D4AA" />
                      </Pressable>
                    </View>
                    {foodError ? (
                      <Text style={styles.foodError}>{foodError}</Text>
                    ) : null}
                    <View style={styles.foodTagsContainer}>
                      {(profileData.favorite_foods || []).map((food, index) => (
                        <View key={index} style={styles.foodTag}>
                          <Text style={styles.foodTagText}>{food}</Text>
                          <Pressable 
                            onPress={() => removeFood(index)}
                            disabled={!isEditing}
                          >
                            <Ionicons name="close-circle" size={18} color="#fff" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={[styles.input, styles.inputDisabled, { minHeight: 44 }]}>
                    <Text style={styles.valueText}>
                      {profileData.favorite_foods?.length > 0
                        ? profileData.favorite_foods.join(", ")
                        : "None added"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Save Button */}
          {isEditing && (
            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color="#fff"
                  />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    color: "#aaa",
  },
  editModeContainer: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    justifyContent: "space-between",
  },
  editModeText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  editButton: {
    gap: 6,
    borderRadius: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  editButtonActive: {
    backgroundColor: "#00D4AA",
  },
  editButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    gap: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: "#aaa",
    paddingLeft: 4,
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    padding: 12,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  inputDisabled: {
    color: "#bbb",
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  valueText: {
    fontSize: 15,
    color: "#fff",
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
    color: "#666",
    paddingLeft: 4,
    fontStyle: "italic",
  },
  twoColumnRow: {
    gap: 10,
    marginBottom: 12,
    flexDirection: "row",
  },
  halfInput: {
    flex: 1,
  },
  switchRow: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    gap: 8,
    padding: 14,
    elevation: 3,
    marginTop: 8,
    shadowRadius: 6,
    borderRadius: 18,
    shadowOpacity: 0.25,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#f7971e",
    justifyContent: "center",
    backgroundColor: "#f7971e",
    shadowOffset: { width: 0, height: 3 },
  },
  saveButtonDisabled: {
    opacity: 0.7,
    backgroundColor: "#666",
  },
  saveButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "bold",
  },
  dropdown: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    minHeight: 44,
  },
  dropdownContainer: {
    backgroundColor: "rgba(30, 30, 30, 0.98)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  dropdownText: {
    color: "#fff",
    fontSize: 15,
  },
  multiButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currentEmojiContainer: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(247, 151, 30, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(247, 151, 30, 0.3)",
  },
  currentEmojiLabel: {
    fontSize: 12,
    color: "#f7971e",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentEmojiDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247, 151, 30, 0.2)",
    borderWidth: 3,
    borderColor: "#f7971e",
  },
  currentEmojiText: {
    fontSize: 48,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
    justifyContent: "flex-start",
  },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emojiButtonSelected: {
    backgroundColor: "rgba(247, 151, 30, 0.25)",
    borderColor: "#f7971e",
    borderWidth: 3,
  },
  emojiButtonText: {
    fontSize: 28,
  },
  selectedIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f7971e",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  disabledText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  multiButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  multiButtonSelected: {
    borderColor: "#00D4AA",
    backgroundColor: "rgba(0, 212, 170, 0.2)",
  },
  multiButtonDisabled: {
    opacity: 0.5,
  },
  multiButtonText: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "600",
  },
  multiButtonTextSelected: {
    color: "#00D4AA",
  },
  foodInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  foodInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  addFoodButton: {
    padding: 4,
  },
  foodError: {
    fontSize: 11,
    color: "#e74c3c",
    marginBottom: 8,
    paddingLeft: 4,
  },
  foodTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  foodTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0, 212, 170, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.3)",
  },
  foodTagText: {
    fontSize: 13,
    color: "#00D4AA",
    fontWeight: "600",
  },
});
