import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

// Mock user data
const user = {
  name: "Matt",
  username: "@matt_dev",
  avatar: "https://placehold.co/200x200/f7971e/ffffff?text=M",
  joinDate: "Joined June 2024",
  stats: {
    workouts: 75,
    streak: 5,
    followers: 245,
  },
};

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();

  const handlePress = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };
  
  // Menu items configuration
  const menuItems = [
    {
      title: "Account",
      items: [
        { icon: "person-outline", color: "#3498db", label: "Edit Profile", path: "../settings/edit" },
        { icon: "shield-checkmark-outline", color: "#2ecc71", label: "Privacy & Security", path: "../settings/privacy" },
        { icon: "star-outline", color: "#f1c40f", label: "My Subscription", path: "../settings/subscription" },
      ],
    },
    {
      title: "Settings",
      items: [
        { icon: "notifications-outline", color: "#e74c3c", label: "Notifications", path: "../settings/notifications" },
        { icon: "color-palette-outline", color: "#9b59b6", label: "Appearance", path: "../settings/appearance" },
        { icon: "help-circle-outline", color: "#1abc9c", label: "Help & Support", path: "../settings/helpsupport" },
      ],
    },
  ];


  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <View style={styles.backRow}>
            <Pressable onPress={() => handlePress("/home")}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </Pressable>
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userHandle}>{user.username}</Text>
            <Text style={styles.joinDate}>{user.joinDate}</Text>
          </View>

          {/* Stats Card */}
          <View style={styles.card}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesome5 name="fire-alt" size={24} color="#f7971e" />
                <Text style={styles.statValue}>{user.stats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="weight-lifter" size={24} color="#6EE7B7" />
                <Text style={styles.statValue}>{user.stats.workouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color="#5b86e5" />
                <Text style={styles.statValue}>{user.stats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </View>
          
          {/* Menu Sections */}
          {menuItems.map((section, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                 <Pressable key={itemIndex} style={styles.menuRow} onPress={() => handlePress(item.path)}>
                   <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                     <Ionicons name={item.icon} size={20} color="#fff" />
                   </View>
                   <Text style={styles.menuLabel}>{item.label}</Text>
                   <Ionicons name="chevron-forward" size={22} color="#555" />
                 </Pressable>
              ))}
            </View>
          ))}


          {/* Logout Button */}
           <View style={styles.logoutContainer}>
            <Pressable style={styles.logoutButton} onPress={() => console.log("Logout Pressed")}>
                <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
                <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
           </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backRow: {
    top: 60,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  avatarContainer: {
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#f7971e",
    borderRadius: 75,
    padding: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  card: {
    padding: 15,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#aaa",
    textTransform: 'uppercase'
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#eee",
    fontWeight: '500',
  },
  logoutContainer: {
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 24,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  logoutText: {
    fontSize: 16,
    color: "#e74c3c",
    fontWeight: 'bold',
    marginLeft: 10,
  }
});
