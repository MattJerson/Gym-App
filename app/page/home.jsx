import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
// Import the new, more compatible progress library
import * as Progress from 'react-native-progress';

export default function Home() {
  // Hooks must be called inside the component
  const router = useRouter();
  const pathname = usePathname();

  // --- Start of Progress Bar Data and Logic ---
  // Data for the progress indicators
  const workoutData = { value: 75, max: 100 };
  const calorieData = { value: 1000, max: 3000 };
  const waterData = { value: 8, max: 8 };

  // Calculate percentages for progress bars
  const workoutPercent = (workoutData.value / workoutData.max) * 100;
  const caloriePercent = (calorieData.value / calorieData.max) * 100;
  const waterPercent = (waterData.value / waterData.max) * 100;
  const totalProgress = (workoutPercent + caloriePercent + waterPercent) / 3;
  // --- End of Progress Bar Data and Logic ---

  // Navigation handler
  const handlePress = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button - Placed absolutely over the scroll content */}
        <View style={styles.backRow}>
          <Pressable onPress={() => handlePress("/auth/register")}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Welcome Back!</Text>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </View>

        {/* --- Start of New Daily Progress Card --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Progress</Text>

          {/* Total Horizontal Progress Bar */}
          <View style={styles.totalProgressWrapper}>
            <Text style={styles.totalProgressLabel}>Overall Daily Goal</Text>
            <View style={styles.totalProgressContainer}>
              <LinearGradient
                colors={['#8e44ad', '#c0392b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.totalProgressBar, { width: `${totalProgress}%` }]}
              />
            </View>
            <Text style={styles.totalProgressText}>
              {`${Math.round(totalProgress)}% Complete`}
            </Text>
          </View>

          {/* Individual Progress Circles using react-native-progress */}
          <View style={styles.progressContainer}>
            {[
              { label: "Workout", color: "#2ecc71", data: workoutData, unit: "%" },
              { label: "Calories", color: "#f39c12", data: calorieData, unit: "kcal" },
              { label: "Water", color: "#3498db", data: waterData, unit: "glasses" },
            ].map(({ label, color, data, unit }) => (
              <View style={styles.progressCircleWrapper} key={label}>
                {/* This container holds both the circle and the text overlay */}
                <View style={styles.circleContainer}>
                  <Progress.Circle
                    size={100}
                    progress={data.value / data.max} // Value between 0 and 1
                    color={color}
                    unfilledColor="rgba(255, 255, 255, 0.1)"
                    borderWidth={0}
                    thickness={10}
                    showsText={false} // We render our own text
                  />
                  {/* This text is positioned absolutely to sit on top of the circle */}
                  <View style={styles.progressValueContainer}>
                    <Text style={styles.progressValueText}>{data.value}</Text>
                    <Text style={styles.progressValueSubText}>of</Text>
                    <Text style={styles.progressValueSubText}>{data.max} {unit}</Text>
                  </View>
                </View>
                <Text style={styles.progressLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* --- End of New Daily Progress Card --- */}


        {/* Profile Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <Text style={styles.cardText}>Level: Intermediate</Text>
          <Text style={styles.cardText}>Workouts this week: 3</Text>
        </View>

        {/* Recent Activity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.cardText}>🏋️ Chest + Triceps - 45 mins</Text>
          <Text style={styles.cardText}>🏃 Cardio - 30 mins</Text>
          <Text style={styles.cardText}>🧘 Yoga - 20 mins</Text>
        </View>

        {/* Badges Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Badges</Text>
          <View style={styles.badgeRow}>
            <FontAwesome5 name="medal" size={32} color="#ffd700" />
            <FontAwesome5 name="dumbbell" size={32} color="#ff4d4d" />
            <MaterialIcons name="military-tech" size={32} color="#9acd32" />
          </View>
        </View>

        {/* Leaderboard Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leaderboard</Text>
          <Text style={styles.cardText}>🥇 You - 850 pts</Text>
          <Text style={styles.cardText}>🥈 Alex - 800 pts</Text>
          <Text style={styles.cardText}>🥉 Jamie - 750 pts</Text>
        </View>

        {/* GymBot Assistant Card */}
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backRow: {
    top: 60,
    left: 20,
    zIndex: 10,
    position: "absolute",
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
  cardTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 15,
    fontWeight: "bold",
  },
  cardText: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 5,
  },
  totalProgressWrapper: {
    marginBottom: 25,
  },
  totalProgressLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalProgressContainer: {
    height: 12,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalProgressBar: {
    height: '100%',
    borderRadius: 6,
  },
  totalProgressText: {
    color: '#ccc',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  progressCircleWrapper: {
    alignItems: "center",
    gap: 10,
  },
  // New container to hold the circle and allow text to be placed on top
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "600",
  },
  // Position this absolutely to sit on top of the Progress.Circle
  progressValueContainer: {
    position: 'absolute',
    justifyContent: "center",
    alignItems: "center",
  },
  progressValueText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  progressValueSubText: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 16,
    color: "#ccc",
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
