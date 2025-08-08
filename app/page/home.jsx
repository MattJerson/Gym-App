// app/home.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
const router = useRouter();

export default function Home() {
  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.backRow}>
                <Pressable onPress={() => router.push('/auth/register')}>
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </Pressable>
              </View>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Welcome Back!</Text>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </View>

        {/* Profile Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <Text style={styles.cardText}>Level: Intermediate</Text>
          <Text style={styles.cardText}>Workouts this week: 3</Text>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.cardText}>🏋️ Chest + Triceps - 45 mins</Text>
          <Text style={styles.cardText}>🏃 Cardio - 30 mins</Text>
          <Text style={styles.cardText}>🧘 Yoga - 20 mins</Text>
        </View>

        {/* Badges */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Badges</Text>
          <View style={styles.badgeRow}>
            <FontAwesome5 name="medal" size={32} color="#ffd700" />
            <FontAwesome5 name="dumbbell" size={32} color="#ff4d4d" />
            <MaterialIcons name="military-tech" size={32} color="#9acd32" />
          </View>
        </View>

        {/* Leaderboard */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leaderboard</Text>
          <Text style={styles.cardText}>🥇 You - 850 pts</Text>
          <Text style={styles.cardText}>🥈 Alex - 800 pts</Text>
          <Text style={styles.cardText}>🥉 Jamie - 750 pts</Text>
        </View>

        {/* GymBot Placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GymBot Assistant</Text>
          <Text style={styles.cardText}>
            💬 Talk to GymBot about your next workout or meal!
          </Text>
          <Pressable style={styles.gymbotBtn}>
            <Text style={styles.gymbotText}>Launch GymBot (Coming Soon)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    marginTop:60,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  
  headerText: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  backRow: {
    position: 'absolute',
    top: 0,
    left: 20,
    zIndex: 10, // Ensure it's clickable
  },
  cardTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 5,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 20,
  },
  gymbotBtn: {
    backgroundColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  gymbotText: {
    color: "#fff",
    fontSize: 14,
  },
});
