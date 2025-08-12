import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
const router = useRouter();

export default function Home() {
  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.backRow}>
          <Pressable onPress={() => router.push("/auth/register")}>
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
    marginTop: 60,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerText: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  backRow: {
    top: 0,
    left: 20,
    zIndex: 10, // Ensure it's clickable
    position: "absolute",
  },
  cardTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 10,
    fontWeight: "bold",
  },
  cardText: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 5,
  },
  badgeRow: {
    gap: 20,
    flexDirection: "row",
  },
  gymbotBtn: {
    marginTop: 10,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: "flex-start",
    backgroundColor: "#444",
  },
  gymbotText: {
    fontSize: 14,
    color: "#fff",
  },
});
