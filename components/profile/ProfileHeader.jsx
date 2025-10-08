import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ProfileHeader({ user }) {
  if (!user) return null;
  
  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarIcon}>
          <MaterialCommunityIcons name="account" size={60} color="#fff" />
        </View>
      </View>
      <Text style={styles.userName}>{user.name}</Text>
      <Text style={styles.userHandle}>{user.username}</Text>
      <Text style={styles.joinDate}>{user.joinDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#f7971e",
    borderRadius: 75,
    padding: 4,
  },
  avatarIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f7971e",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  userHandle: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 4,
  },
  joinDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
  },
});
