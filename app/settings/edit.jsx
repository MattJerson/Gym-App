import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SettingsHeader from '../../components/SettingsHeader'; // Adjust path if needed

// Mock user data for the form
const user = {
  name: "Matt",
  username: "matt_dev",
  email: "matt@example.com",
  bio: "Building cool apps with React Native & Expo. Let's connect!",
  avatar: "https://placehold.co/200x200/f7971e/ffffff?text=M",
};

export default function EditProfile() {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <SettingsHeader title="Edit Profile" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Pressable>
              <Text style={styles.changeAvatarText}>Change Profile Photo</Text>
            </Pressable>
          </View>

          {/* Form Section */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Your Username"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor="#666"
                multiline
              />
            </View>
          </View>
          
          {/* Save Button */}
          <Pressable style={styles.saveButton} onPress={() => console.log("Changes Saved!")}>
             <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  changeAvatarText: { color: '#f7971e', fontSize: 16, fontWeight: 'bold' },
  card: { padding: 20, borderRadius: 24, backgroundColor: "rgba(255, 255, 255, 0.05)" },
  inputGroup: { marginBottom: 20 },
  label: { color: '#aaa', fontSize: 14, marginBottom: 8, paddingLeft: 5 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#fff',
    fontSize: 16,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#f7971e',
    padding: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});