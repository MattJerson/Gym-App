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
} from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";
import { useState } from "react";
import WorkoutCard from "../../components/WorkoutCard";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const notifications = useState(3);
  const workoutData = { value: 75, max: 100 };
  const calorieData = { value: 1000, max: 3000 };
  const waterData = { value: 8, max: 8 };
  const userName = "Matt";
  const workoutPercent = (workoutData.value / workoutData.max) * 100;
  const caloriePercent = (calorieData.value / calorieData.max) * 100;
  const waterPercent = (waterData.value / waterData.max) * 100;
  const totalProgress = (workoutPercent + caloriePercent + waterPercent) / 3;
  const handlePress = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Back Button */}
        <View style={styles.backRow}>
          <Pressable onPress={() => handlePress("/auth/register")}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Welcome, {userName}! 💪</Text>
          <View style={{ position: "relative" }}>
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{notifications}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Daily Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Progress</Text>
          <LinearGradient
            colors={["#f7971e", "#ffd200"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakBadge}
          >
            <Ionicons name="flame" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.streakText}>Streak: 5</Text>
          </LinearGradient>

          <View style={styles.totalProgressWrapper}>
            <View style={styles.totalProgressContainer}>
              <LinearGradient
                colors={["#8e44ad", "#c0392b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.totalProgressBar, { width: `${totalProgress}%` }]}
              />
            </View>
            <Text style={styles.totalProgressText}>
              {`${Math.round(totalProgress)}% Complete`}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            {[
              { label: "Workout", color: "#2ecc71", data: workoutData , unit: "%" },
              { label: "Calories", color: "#f39c12", data: calorieData, unit: "kcal" },
              { label: "Water", color: "#3498db", data: waterData, unit: "glasses" },
            ].map(({ label, color, data, unit }) => (
              <View style={styles.progressCircleWrapper} key={label}>
                <View style={styles.circleContainer}>
                  <Progress.Circle
                    size={100}
                    progress={data.value / data.max}
                    color={color}
                    unfilledColor="rgba(255, 255, 255, 0.1)"
                    borderWidth={0}
                    thickness={10}
                    showsText={false}
                    strokeCap="round"
                  />
                  <View style={styles.progressValueContainer}>
                    <Text style={styles.progressValueText}>{data.value}</Text>
                    <Text style={styles.progressValueSubText}>
                      {data.max} {unit}
                    </Text>
                  </View>
                </View>
                <Text style={styles.progressLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Ionicons name="time-outline" size={22} color="#fff" />
          </View>

          <Text style={styles.activityDate}>Today</Text>
          {[
            { icon: "barbell", color: ["#ff7e5f", "#feb47b"], label: "Chest + Triceps", duration: "45 mins" },
            { icon: "walk", color: ["#43cea2", "#185a9d"], label: "Cardio", duration: "30 mins" },
            { icon: "leaf-outline", color: ["#a18cd1", "#fbc2eb"], label: "Yoga", duration: "20 mins" },
          ].map((item, idx) => (
            <Pressable key={idx} style={styles.activityItem}>
              <LinearGradient colors={item.color} style={styles.activityIconContainer}>
                <Ionicons name={item.icon} size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityLabel}>{item.label}</Text>
                <Text style={styles.activitySub}>{item.duration}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#aaa" />
            </Pressable>
          ))}
        </View>

        {/* Horizontal Workout Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyScroll}
        >
          <WorkoutCard
            title="Push Day Workout"
            sub="13 exercises"
            colors={["#6EE7B7", "#2ecc71", "#027A48"]}
            rating={4.9}
          />
          <WorkoutCard
            title="Pull Day Workout"
            sub="10 exercises"
            colors={["#f6d365", "#fda085"]}
            rating={4.7}
          />
          <WorkoutCard
            title="Leg Day Workout"
            sub="12 exercises"
            colors={["#36d1dc", "#5b86e5"]}
            rating={4.8}
          />
          <WorkoutCard
            title="Core Workout"
            sub="8 exercises"
            colors={["#a18cd1", "#fbc2eb"]}
            rating={4.6}
          />
        </ScrollView>

        {/* Achievements & Leaderboard */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Achievements & Leaderboard</Text>
            <Ionicons name="trophy-outline" size={24} color="#ffd700" />
          </View>

          <View style={styles.badgeRow}>
            {[
              { icon: "medal", color: "#ffd700", label: "Champion" },
              { icon: "dumbbell", color: "#ff4d4d", label: "Power Lifter" },
              { icon: "running", color: "#00bfff", label: "Cardio Pro" },
            ].map((badge, idx) => (
              <View key={idx} style={styles.badgeItem}>
                <FontAwesome5 name={badge.icon} size={28} color={badge.color} />
                <Text style={styles.badgeLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.leaderboardContainer}>
            {[
              { rank: "🥇", name: "You", points: 850 },
              { rank: "🥈", name: "Alex", points: 800 },
              { rank: "🥉", name: "Jamie", points: 750 },
            ].map((player, idx) => (
              <View key={idx} style={styles.leaderboardRow}>
                <Text style={styles.leaderboardRank}>{player.rank}</Text>
                <Text style={styles.leaderboardName}>{player.name}</Text>
                <Text style={styles.leaderboardPoints}>{player.points} pts</Text>
              </View>
            ))}
          </View>
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
    marginVertical: 40,
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
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  storyScroll: {
    gap: 14,
    flexDirection: "row",
    marginBottom: 20,
  },
  card: {
    padding: 20,
    borderRadius: 32,
    marginBottom: 22,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  cardTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 5,
    fontWeight: "bold",
  },
  sectionText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
    fontWeight: "semibold",
  },
  cardText: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 5,
  },
  totalProgressWrapper: {
    marginBottom: 25,
  },
  totalProgressContainer: {
    height: 12,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 6,
    overflow: "hidden",
  },
  totalProgressBar: {
    height: "100%",
    borderRadius: 6,
  },
  totalProgressText: {
    color: "#ccc",
    fontSize: 12,
    alignSelf: "flex-end",
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
  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "600",
  },
  progressValueContainer: {
    position: "absolute",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  badgeItem: {
    alignItems: "center",
  },
  badgeLabel: {
    fontSize: 12,
    color: "#ccc",
    marginTop: 6,
  },
  leaderboardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 10,
  },
  leaderboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  leaderboardRank: {
    fontSize: 16,
    width: 30,
    textAlign: "center",
  },
  leaderboardName: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  leaderboardPoints: {
    color: "#ccc",
    fontSize: 14,
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
  activityDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  activitySub: {
    fontSize: 12,
    color: "#bbb",
  },
});
