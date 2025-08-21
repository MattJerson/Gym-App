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

export default function Training() {
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
          <Text style={styles.headerText}>Training</Text>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </View>

        {/* Quick Start Workout */}
        <Pressable style={[styles.card, styles.quickStartCard]}>
          <LinearGradient
            colors={["#ff6b6b", "#ee5a24"]}
            style={styles.quickStartGradient}
          >
            <View style={styles.quickStartContent}>
              <MaterialIcons name="play-circle-filled" size={48} color="#fff" />
              <View style={styles.quickStartText}>
                <Text style={styles.quickStartTitle}>Quick Start</Text>
                <Text style={styles.quickStartSubtitle}>
                  Continue last workout
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Current Program */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Program</Text>
            <Pressable>
              <Text style={styles.changeText}>Change</Text>
            </Pressable>
          </View>
          <View style={styles.programInfo}>
            <FontAwesome5 name="dumbbell" size={24} color="#ff6b6b" />
            <View style={styles.programDetails}>
              <Text style={styles.programName}>Push Pull Legs</Text>
              <Text style={styles.programSubtext}>
                Week 3 of 8 • Intermediate
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "37.5%" }]} />
          </View>
        </View>

        {/* Today's Workout */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Workout</Text>
          <View style={styles.todayWorkout}>
            <MaterialCommunityIcons
              name="chest-expander"
              size={32}
              color="#4ecdc4"
            />
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutName}>Push Day - Chest & Triceps</Text>
              <Text style={styles.workoutDetails}>7 exercises • ~45 mins</Text>
            </View>
            <Pressable style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start</Text>
            </Pressable>
          </View>
        </View>

        {/* Workout Programs */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Workout Programs</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.programsScroll}
          >
            <Pressable style={styles.programCard}>
              <MaterialIcons name="fitness-center" size={24} color="#ffd93d" />
              <Text style={styles.programCardTitle}>Strength</Text>
              <Text style={styles.programCardSub}>Get Power</Text>
            </Pressable>
            <Pressable style={styles.programCard}>
              <MaterialCommunityIcons name="run" size={24} color="#6c5ce7" />
              <Text style={styles.programCardTitle}>HIIT</Text>
              <Text style={styles.programCardSub}>Burn Fat</Text>
            </Pressable>
            <Pressable style={styles.programCard}>
              <FontAwesome5 name="heart" size={24} color="#fd79a8" />
              <Text style={styles.programCardTitle}>Cardio</Text>
              <Text style={styles.programCardSub}>Endurance</Text>
            </Pressable>
            <Pressable style={styles.programCard}>
              <MaterialCommunityIcons name="yoga" size={24} color="#00b894" />
              <Text style={styles.programCardTitle}>Stretch</Text>
              <Text style={styles.programCardSub}>Mobility</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Exercise Library */}
        <Pressable style={styles.card}>
          <View style={styles.libraryHeader}>
            <MaterialIcons name="library-books" size={32} color="#74b9ff" />
            <View style={styles.libraryInfo}>
              <Text style={styles.cardTitle}>Exercise Library</Text>
              <Text style={styles.cardText}>
                500+ exercises with video guides
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </Pressable>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable style={styles.actionBtn} 
            onPress={() => router.push('/training/workouts')}
            >
              <FontAwesome5 name="plus" size={20} color="#fff" />
              <Text style={styles.actionText}>Custom Workout</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <MaterialIcons name="history" size={20} color="#fff" />
              <Text style={styles.actionText}>Workout History</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color="#fff"
              />
              <Text style={styles.actionText}>Progress</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Workouts</Text>
          <View style={styles.recentWorkout}>
            <View style={styles.workoutDot} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>Pull Day - Back & Biceps</Text>
              <Text style={styles.recentDetails}>2 days ago • 42 mins</Text>
            </View>
            <Text style={styles.recentWeight}>+5 lbs</Text>
          </View>
          <View style={styles.recentWorkout}>
            <View style={[styles.workoutDot, { backgroundColor: "#ffd93d" }]} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>Leg Day - Quads & Glutes</Text>
              <Text style={styles.recentDetails}>4 days ago • 55 mins</Text>
            </View>
            <Text style={styles.recentWeight}>PR!</Text>
          </View>
          <View style={styles.recentWorkout}>
            <View style={[styles.workoutDot, { backgroundColor: "#00b894" }]} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>Push Day - Chest & Triceps</Text>
              <Text style={styles.recentDetails}>6 days ago • 38 mins</Text>
            </View>
            <Text style={styles.recentWeight}>Complete</Text>
          </View>
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
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backRow: {
    top: 0,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  cardTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  cardText: {
    fontSize: 14,
    color: "#ccc",
  },
  cardHeader: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  changeText: {
    fontSize: 14,
    color: "#ff6b6b",
    fontWeight: "500",
  },
  seeAllText: {
    fontSize: 14,
    color: "#74b9ff",
    fontWeight: "500",
  },
  quickStartCard: {
    padding: 0,
    overflow: "hidden",
  },
  quickStartGradient: {
    padding: 20,
    borderRadius: 16,
  },
  quickStartContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickStartText: {
    marginLeft: 16,
  },
  quickStartTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  quickStartSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  programInfo: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  programDetails: {
    flex: 1,
    marginLeft: 16,
  },
  programName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  programSubtext: {
    fontSize: 14,
    color: "#ccc",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#ff6b6b",
  },
  todayWorkout: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  workoutInfo: {
    flex: 1,
    marginLeft: 16,
  },
  workoutName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  workoutDetails: {
    fontSize: 14,
    color: "#ccc",
  },
  startBtn: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#4ecdc4",
  },
  startBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  programsScroll: {
    marginTop: 12,
  },
  programCard: {
    width: 100,
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  programCardTitle: {
    fontSize: 14,
    marginTop: 8,
    color: "#fff",
    fontWeight: "600",
  },
  programCardSub: {
    fontSize: 12,
    color: "#ccc",
  },
  libraryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  libraryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  quickActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  actionText: {
    fontSize: 12,
    marginTop: 8,
    color: "#fff",
    textAlign: "center",
  },
  recentWorkout: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  workoutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ecdc4",
  },
  recentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  recentName: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  recentDetails: {
    fontSize: 12,
    color: "#ccc",
  },
  recentWeight: {
    fontSize: 12,
    color: "#4ecdc4",
    fontWeight: "600",
  },
});
