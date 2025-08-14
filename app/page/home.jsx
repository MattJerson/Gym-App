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
} from "@expo/vector-icons";
// import { useRouter } from "expo-router"; // Temporarily commented out to prevent crash
import { LinearGradient } from "expo-linear-gradient";
import CircularProgress from "react-native-circular-progress-indicator";

export default function Home() {
  // --- Progress Data ---
  // Store progress data in variables to make calculations and rendering dynamic.
  const workoutData = { value: 75, max: 100 };
  const calorieData = { value: 1000, max: 3000 };
  const waterData = { value: 8, max: 8 };

  // --- Calculations ---
  // Calculate the percentage for each individual goal.
  const workoutPercent = (workoutData.value / workoutData.max) * 100;
  const caloriePercent = (calorieData.value / calorieData.max) * 100;
  const waterPercent = (waterData.value / waterData.max) * 100;

  // Calculate the total progress by averaging the three percentages.
  // Each goal contributes 1/3 to the total.
  const totalProgress = (workoutPercent + caloriePercent + waterPercent) / 3;

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <View style={styles.backRow}>
          <Pressable onPress={() => console.log("Back button pressed")}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
        </View>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Welcome Back!</Text>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </View>

        {/* Daily Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Progress</Text>

          {/* --- Total Horizontal Progress Bar --- */}
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
             <Text style={styles.totalProgressText}>{`${Math.round(totalProgress)}% Complete`}</Text>
          </View>


          {/* --- Individual Circular Progress Bars --- */}
          <View style={styles.progressContainer}>
            {/* Workout Progress */}
            <View style={styles.progressCircleWrapper}>
              <CircularProgress
                value={workoutData.value}
                maxValue={workoutData.max}
                radius={50}
                duration={1500}
                activeStrokeColor={"#2ecc71"}
                inActiveStrokeColor={"#fff"}
                inActiveStrokeOpacity={0.2}
                activeStrokeWidth={10}
                inActiveStrokeWidth={10}
                progressValueRenderer={() => (
                  <View style={styles.progressValueContainer}>
                    <Text style={styles.progressValueText}>{workoutData.value}%</Text>
                    <Text style={styles.progressValueSubText}>of</Text>
                    <Text style={styles.progressValueSubText}>{workoutData.max}%</Text>
                  </View>
                )}
              />
              <Text style={styles.progressLabel}>Workout</Text>
            </View>
            {/* Calorie Progress */}
            <View style={styles.progressCircleWrapper}>
              <CircularProgress
                value={calorieData.value}
                maxValue={calorieData.max}
                radius={50}
                duration={1500}
                activeStrokeColor={"#f39c12"}
                inActiveStrokeColor={"#fff"}
                inActiveStrokeOpacity={0.2}
                activeStrokeWidth={10}
                inActiveStrokeWidth={10}
                progressValueRenderer={() => (
                  <View style={styles.progressValueContainer}>
                    <Text style={styles.progressValueText}>{calorieData.value}</Text>
                     <Text style={styles.progressValueSubText}>of</Text>
                    <Text style={styles.progressValueSubText}>{calorieData.max} kcal</Text>
                  </View>
                )}
              />
              <Text style={styles.progressLabel}>Calories</Text>
            </View>
            {/* Water Intake Progress */}
            <View style={styles.progressCircleWrapper}>
              <CircularProgress
                value={waterData.value}
                maxValue={waterData.max}
                radius={50}
                duration={1500}
                activeStrokeColor={"#3498db"}
                inActiveStrokeColor={"#fff"}
                inActiveStrokeOpacity={0.2}
                activeStrokeWidth={10}
                inActiveStrokeWidth={10}
                progressValueRenderer={() => (
                  <View style={styles.progressValueContainer}>
                    <Text style={styles.progressValueText}>{waterData.value}</Text>
                    <Text style={styles.progressValueSubText}>of</Text>
                    <Text style={styles.progressValueSubText}>{waterData.max} glasses</Text>
                  </View>
                )}
              />
              <Text style={styles.progressLabel}>Water</Text>
            </View>
          </View>
        </View>

        {/* Other Cards... */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <Text style={styles.cardText}>Level: Intermediate</Text>
          <Text style={styles.cardText}>Workouts this week: 3</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.cardText}>🏋️ Chest + Triceps - 45 mins</Text>
          <Text style={styles.cardText}>🏃 Cardio - 30 mins</Text>
          <Text style={styles.cardText}>🧘 Yoga - 20 mins</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Badges</Text>
          <View style={styles.badgeRow}>
            <FontAwesome5 name="medal" size={32} color="#ffd700" />
            <FontAwesome5 name="dumbbell" size={32} color="#ff4d4d" />
            <MaterialIcons name="military-tech" size={32} color="#9acd32" />
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leaderboard</Text>
          <Text style={styles.cardText}>🥇 You - 850 pts</Text>
          <Text style={styles.cardText}>🥈 Alex - 800 pts</Text>
          <Text style={styles.cardText}>🥉 Jamie - 750 pts</Text>
        </View>
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
  // --- New Styles for Total Progress Bar ---
  totalProgressWrapper: {
    marginBottom: 25, // Add space between total bar and circles
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
  // --- Styles for Circular Progress ---
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  progressCircleWrapper: {
    alignItems: "center",
    gap: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "600",
  },
  progressValueContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressValueText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  progressValueSubText: {
    fontSize: 13,
    lineHeight: 16,
    color: "#ccc",
  },
  // --- Other Styles ---
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
