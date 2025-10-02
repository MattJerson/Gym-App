import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, Pressable, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SettingsHeader from '../../components/SettingsHeader';
import { supabase } from '../../services/supabase';
import DropDownPicker from 'react-native-dropdown-picker';

export default function EditProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Account Data
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Profile Data (from registration_profiles)
  const [profileData, setProfileData] = useState({
    gender: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    use_metric: true,
    activity_level: '',
    fitness_goal: '',
    favorite_foods: [],
    fitness_level: '',
    training_location: '',
    training_duration: '',
    muscle_focus: '',
    injuries: [],
    training_frequency: '',
    meal_type: '',
    restrictions: [],
    meals_per_day: '',
    calorie_goal: '',
  });
  
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState('');
  
  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        Alert.alert('Error', 'No authenticated user found');
        return;
      }
      
      setUserId(user.id);
      setEmail(user.email || '');
      setName(user.user_metadata?.full_name || user.user_metadata?.nickname || '');
      
      // Fetch profile data from registration_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('registration_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }
      
      if (profileData) {
        setProfileData({
          gender: profileData.gender || '',
          age: profileData.age?.toString() || '',
          height_cm: profileData.height_cm?.toString() || '',
          weight_kg: profileData.weight_kg?.toString() || '',
          use_metric: profileData.use_metric ?? true,
          activity_level: profileData.activity_level || '',
          fitness_goal: profileData.fitness_goal || '',
          favorite_foods: profileData.favorite_foods || [],
          fitness_level: profileData.fitness_level || '',
          training_location: profileData.training_location || '',
          training_duration: profileData.training_duration?.toString() || '',
          muscle_focus: profileData.muscle_focus || '',
          injuries: profileData.injuries || [],
          training_frequency: profileData.training_frequency || '',
          meal_type: profileData.meal_type || '',
          restrictions: profileData.restrictions || [],
          meals_per_day: profileData.meals_per_day?.toString() || '',
          calorie_goal: profileData.calorie_goal?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name, nickname: name }
      });
      
      if (authError) throw authError;
      
      // Prepare profile data payload
      const payload = {
        user_id: userId,
        gender: profileData.gender || null,
        age: profileData.age ? parseInt(profileData.age, 10) : null,
        height_cm: profileData.height_cm ? parseInt(profileData.height_cm, 10) : null,
        weight_kg: profileData.weight_kg ? parseFloat(profileData.weight_kg) : null,
        use_metric: profileData.use_metric,
        activity_level: profileData.activity_level || null,
        fitness_goal: profileData.fitness_goal || null,
        favorite_foods: profileData.favorite_foods,
        fitness_level: profileData.fitness_level || null,
        training_location: profileData.training_location || null,
        training_duration: profileData.training_duration ? parseInt(profileData.training_duration, 10) : null,
        muscle_focus: profileData.muscle_focus || null,
        injuries: profileData.injuries,
        training_frequency: profileData.training_frequency || null,
        meal_type: profileData.meal_type || null,
        restrictions: profileData.restrictions,
        meals_per_day: profileData.meals_per_day ? parseInt(profileData.meals_per_day, 10) : null,
        calorie_goal: profileData.calorie_goal ? parseInt(profileData.calorie_goal, 10) : null,
      };
      
      // Upsert registration profile
      const { error: profileError } = await supabase
        .from('registration_profiles')
        .upsert(payload, { onConflict: 'user_id' });
      
      if (profileError) throw profileError;
      
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#0B0B0B', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f7971e" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0B0B0B' }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Edit Mode Toggle */}
          <View style={styles.editModeContainer}>
            <Text style={styles.editModeText}>
              {isEditing ? 'Editing Mode' : 'View Mode'}
            </Text>
            <Pressable 
              style={[styles.editButton, isEditing && styles.editButtonActive]}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons 
                name={isEditing ? "checkmark-circle" : "create-outline"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.editButtonText}>
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          {/* Account Details Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={24} color="#f7971e" />
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

          {/* Basic Info Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#4A9EFF" />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.card}>
              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                    <Text style={styles.valueText}>{profileData.gender || 'Not set'}</Text>
                  </View>
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.age}
                    onChangeText={(val) => setProfileData({...profileData, age: val})}
                    placeholder="Age"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
              </View>
              
              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Height ({profileData.use_metric ? 'cm' : 'in'})</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.height_cm}
                    onChangeText={(val) => setProfileData({...profileData, height_cm: val})}
                    placeholder="Height"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Weight ({profileData.use_metric ? 'kg' : 'lbs'})</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.weight_kg}
                    onChangeText={(val) => setProfileData({...profileData, weight_kg: val})}
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
                  onValueChange={(val) => isEditing && setProfileData({...profileData, use_metric: val})}
                  trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: "#1E3A5F" }}
                  thumbColor={profileData.use_metric ? "#FFFFFF" : "#CCCCCC"}
                  disabled={!isEditing}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Activity Level</Text>
                <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                  <Text style={styles.valueText}>{profileData.activity_level || 'Not set'}</Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fitness Goal</Text>
                <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                  <Text style={styles.valueText}>{profileData.fitness_goal || 'Not set'}</Text>
                </View>
              </View>
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
                <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                  <Text style={styles.valueText}>{profileData.fitness_level || 'Not set'}</Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Training Location</Text>
                <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                  <Text style={styles.valueText}>{profileData.training_location || 'Not set'}</Text>
                </View>
              </View>
              
              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Duration (mins)</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.training_duration}
                    onChangeText={(val) => setProfileData({...profileData, training_duration: val})}
                    placeholder="Duration"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Frequency (days/week)</Text>
                  <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                    <Text style={styles.valueText}>{profileData.training_frequency || 'Not set'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Muscle Focus</Text>
                <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                  <Text style={styles.valueText}>{profileData.muscle_focus || 'Not set'}</Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Injuries</Text>
                <View style={[styles.input, !isEditing && styles.inputDisabled, { minHeight: 56 }]}>
                  <Text style={styles.valueText}>
                    {profileData.injuries?.length > 0 
                      ? profileData.injuries.join(', ') 
                      : 'None'}
                  </Text>
                </View>
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
                <View style={[styles.input, !isEditing && styles.inputDisabled]}>
                  <Text style={styles.valueText}>{profileData.meal_type || 'Not set'}</Text>
                </View>
              </View>
              
              <View style={styles.twoColumnRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Daily Calories</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.calorie_goal}
                    onChangeText={(val) => setProfileData({...profileData, calorie_goal: val})}
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
                    onChangeText={(val) => setProfileData({...profileData, meals_per_day: val})}
                    placeholder="Meals"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dietary Restrictions</Text>
                <View style={[styles.input, !isEditing && styles.inputDisabled, { minHeight: 56 }]}>
                  <Text style={styles.valueText}>
                    {profileData.restrictions?.length > 0 
                      ? profileData.restrictions.join(', ') 
                      : 'None'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Favorite Foods</Text>
                <View style={[styles.input, !isEditing && styles.inputDisabled, { minHeight: 56 }]}>
                  <Text style={styles.valueText}>
                    {profileData.favorite_foods?.length > 0 
                      ? profileData.favorite_foods.join(', ') 
                      : 'None added'}
                  </Text>
                </View>
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
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
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
    paddingHorizontal: 20, 
    paddingBottom: 40,
    paddingTop: 10,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 15,
  },
  editModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  editModeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonActive: {
    backgroundColor: '#00D4AA',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: { 
    padding: 20, 
    borderRadius: 24, 
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  inputGroup: { 
    marginBottom: 18,
  },
  label: { 
    color: '#aaa', 
    fontSize: 13, 
    marginBottom: 8, 
    paddingLeft: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#fff',
    fontSize: 16,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    color: '#bbb',
  },
  valueText: {
    color: '#fff',
    fontSize: 16,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 6,
    paddingLeft: 5,
    fontStyle: 'italic',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  halfInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
    marginBottom: 18,
  },
  saveButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#f7971e',
    padding: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#f7971e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});