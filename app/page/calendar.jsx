import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useMemo } from "react";
import { Calendar as RNCalendar } from "react-native-calendars";
import RecentActivity from "../../components/home/RecentActivity";
import ProgressGraph from "../../components/calendar/ProgressGraph";
import StepsBarGraph from "../../components/calendar/StepsBarGraph";

export default function Calendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutNote, setWorkoutNote] = useState("");
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("strength");

  // Sample workout data
  const [workoutData, setWorkoutData] = useState({
    "2025-09-15": { type: "strength", completed: true, streak: true, note: "Great session!" },
    "2025-09-14": { type: "cardio", completed: true, streak: true, note: "5K run" },
    "2025-09-13": { type: "rest", completed: true, streak: true },
    "2025-09-12": { type: "strength", completed: true, streak: true },
    "2025-09-16": { type: "yoga", completed: false, planned: true },
    "2025-09-17": { type: "strength", completed: false, planned: true },
    "2025-08-30": { type: "cardio", completed: true, streak: false },
    "2025-08-31": { type: "strength", completed: true, streak: false },
    "2025-10-01": { type: "yoga", completed: false, planned: true },
    "2025-10-02": { type: "cardio", completed: false, planned: true },
  });

  // Sample data for the new RecentActivity component
  const recentActivitiesData = [
    { label: "Morning Run", duration: "45 min", icon: "walk", color: ["#FF5722", "#FF9800"] },
    { label: "Upper Body Strength", duration: "1 hour 15 min", icon: "barbell", color: ["#4CAF50", "#8BC34A"] },
    { label: "Evening Yoga", duration: "30 min", icon: "body", color: ["#9C27B0", "#E1BEE7"] },
    { label: "Rest Day", duration: "Full day", icon: "bed", color: ["#607D8B", "#90A4AE"] },
  ];

  const workoutTypes = [
    { key: "strength", name: "Strength", icon: "dumbbell", color: "#4CAF50" },
    { key: "cardio", name: "Cardio", icon: "directions-run", color: "#FF5722" },
    { key: "yoga", name: "yoga", icon: "yoga", color: "#9C27B0" },
    { key: "rest", name: "Rest", icon: "bed", color: "#607D8B" },
  ];

  // single-chart data (ProgressGraph now expects a single `chart` prop)
  const chart = {
    title: "Weight Progress",
    labels: ["08/01", "08/02", "08/03", "08/04", "08/05", "08/06", "08/07"],
    values: [70, 71, 71.5, 71, 70.8, 70.5, 70.2],
    color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`,
  };

  const dailyStepsData = {
    dates: [
      "08/01","08/02","08/03","08/04","08/05","08/06","08/07",
      "08/08","08/09","08/10","08/11","08/12","08/13","08/14",
      "08/15","08/16","08/17","08/18","08/19","08/20","08/21",
      "08/22","08/23","08/24","08/25","08/26","08/27","08/28",
      "08/29","08/30","08/31"
    ],
    values: [
      12539, 5776, 2782, 10673, 4430,
      13029, 6263, 4226, 42300, 2783,
      1021, 7563, 8863, 4992, 13332,
      3661, 4324, 2226, 3688, 10773,
      5792, 6960, 9021, 6642, 1876,
      11528, 4474, 11983, 9385, 11111,
      7701
    ]
  };

  const formatDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const addWorkout = () => {
    if (!selectedDate) return;
    const newWorkout = {
      type: selectedWorkoutType,
      completed: true,
      streak: true,
      note: workoutNote.trim() || undefined,
    };
    setWorkoutData((prev) => ({ ...prev, [selectedDate]: newWorkout }));
    setWorkoutNote("");
    setShowWorkoutModal(false);
    Alert.alert("Success", "Workout logged successfully!");
  };

  const markedDates = useMemo(() => {
    const marks = {};
    Object.entries(workoutData).forEach(([date, workout]) => {
      const workoutType = workoutTypes.find((w) => w.key === workout.type);
      const color = workout.completed ? workoutType?.color || "#fff" : "rgba(255,255,255,0.3)";
      marks[date] = { marked: true, dotColor: color };
    });
    if (selectedDate) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#007AFF" };
    }
    return marks;
  }, [workoutData, selectedDate]);

  const monthlyStats = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let workouts = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    Object.entries(workoutData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .forEach(([dateKey, workout]) => {
        const [year, month] = dateKey.split("-").map(Number);
        if (year === currentYear && month - 1 === currentMonth && workout.completed) {
          workouts++;
        }
        if (workout.streak && workout.completed) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const goalPercentage = Math.round((workouts / daysInMonth) * 100);
    return { workouts, streak: maxStreak, goalPercentage };
  }, [currentDate, workoutData]);

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.headerText}>Calendar</Text>
          <Pressable
            onPress={() => {
              setSelectedDate(formatDateKey(new Date()));
              if (Platform.OS === "ios") {
                ActionSheetIOS.showActionSheetWithOptions(
                  {
                    options: ["Cancel", "Strength", "Cardio", "Yoga", "Rest"],
                    cancelButtonIndex: 0,
                    title: "Log Workout",
                  },
                  (buttonIndex) => {
                    if (buttonIndex === 0) return;
                    const typeMap = ["strength", "cardio", "yoga", "rest"];
                    const chosenType = typeMap[buttonIndex - 1];
                    setSelectedWorkoutType(chosenType);
                    addWorkout();
                  }
                );
              } else {
                setShowWorkoutModal(true);
              }
            }}
          >
            <Ionicons name="add-circle-outline" size={32} color="#fff" />
          </Pressable>
        </View>

        {/* Calendar + Stats */}
        <View style={styles.calendarCard}>
          <RNCalendar
            current={formatDateKey(currentDate)}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              if (!workoutData[day.dateString]) {
                if (Platform.OS === "ios") {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: ["Cancel", "Strength", "Cardio", "Yoga", "Rest"],
                      cancelButtonIndex: 0,
                      title: "Log Workout",
                    },
                    (buttonIndex) => {
                      if (buttonIndex === 0) return;
                      const typeMap = ["strength", "cardio", "yoga", "rest"];
                      const chosenType = typeMap[buttonIndex - 1];
                      setSelectedWorkoutType(chosenType);
                      addWorkout();
                    }
                  );
                } else {
                  setShowWorkoutModal(true);
                }
              }
            }}
            onMonthChange={(month) => {
              setCurrentDate(new Date(month.dateString));
            }}
            markedDates={markedDates}
            hideExtraDays={false}
            disableAllTouchEventsForDisabledDays={true}
            theme={{
              calendarBackground: "transparent",
              dayTextColor: "#fff",
              monthTextColor: "#fff",
              textSectionTitleColor: "#888",
              selectedDayBackgroundColor: "#007AFF",
              selectedDayTextColor: "#fff",
              todayTextColor: "#FFD700",
              arrowColor: "#fff",
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDisabledColor: "#555",
            }}
          />

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.cardTitle}>
              {currentDate.toLocaleString("default", { month: "long" })} Progress
            </Text>
            <View style={styles.statRow}>
              <View style={[styles.statIcon, { backgroundColor: "#4CAF50" }]}>
                <FontAwesome5 name="dumbbell" size={16} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Workouts</Text>
                <Text style={styles.statValue}>{monthlyStats.workouts}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statIcon, { backgroundColor: "#FF5722" }]}>
                <Ionicons name="flame" size={16} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Best Streak</Text>
                <Text style={styles.statValue}>{monthlyStats.streak} days</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statIcon, { backgroundColor: "#9C27B0" }]}>
                <MaterialIcons name="track-changes" size={16} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Monthly Goal</Text>
                <Text style={styles.statValue}>{monthlyStats.goalPercentage}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pass single `chart` prop to ProgressGraph */}
        <ProgressGraph chart={chart} />

        <StepsBarGraph dailyData={dailyStepsData} />
        
        {/* Recent Activity */}
        <RecentActivity activities={recentActivitiesData} />
      </ScrollView>

      {/* Android Fallback Modal */}
      <Modal visible={showWorkoutModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowWorkoutModal(false)}>
          <Pressable style={styles.workoutModal}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            <Text style={styles.modalDate}>
              {selectedDate &&
                new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
            </Text>
            <Text style={styles.sectionTitle}>Workout Type</Text>
            <View style={styles.workoutTypeGrid}>
              {workoutTypes.map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.workoutTypeButton,
                    { backgroundColor: type.color },
                    selectedWorkoutType === type.key && styles.selectedWorkoutType,
                  ]}
                  onPress={() => setSelectedWorkoutType(type.key)}
                >
                  {type.key === "yoga" ? (
                    <MaterialCommunityIcons name={type.icon} size={20} color="#fff" />
                  ) : type.key === "cardio" ? (
                    <MaterialIcons name={type.icon} size={20} color="#fff" />
                  ) : type.key === "rest" ? (
                    <Ionicons name={type.icon} size={20} color="#fff" />
                  ) : (
                    <FontAwesome5 name={type.icon} size={20} color="#fff" />
                  )}
                  <Text style={styles.workoutTypeText}>{type.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="How was the workout?"
              placeholderTextColor="#999"
              value={workoutNote}
              onChangeText={setWorkoutNote}
              multiline
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWorkoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addWorkout}
              >
                <Text style={styles.confirmButtonText}>Log Workout</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 15,
  },
  headerRow: {
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  calendarCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 22,
    marginBottom: 20,
    overflow: "hidden",
  },
  statsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 15,
    fontWeight: "bold",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 15,
    color: "#ccc",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  workoutModal: {
    backgroundColor: "#252525",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 25,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  modalDate: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },
  workoutTypeGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  workoutTypeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    gap: 5,
  },
  selectedWorkoutType: {
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ scale: 1.05 }],
  },
  workoutTypeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  noteInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    color: "#fff",
    fontSize: 16,
    marginBottom: 25,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalButton: { flex: 1, padding: 16, borderRadius: 18, alignItems: "center" },
  cancelButton: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
  confirmButton: { backgroundColor: "#007AFF" },
  cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
