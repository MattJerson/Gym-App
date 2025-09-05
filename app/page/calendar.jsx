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
import { useState, useEffect, useMemo } from "react";
import { Calendar as RNCalendar } from "react-native-calendars";
import RecentActivity from "../../components/home/RecentActivity";
import ProgressGraph from "../../components/calendar/ProgressGraph";
import StepsBarGraph from "../../components/calendar/StepsBarGraph";
import CalendarAnalytics from "../../components/calendar/CalendarAnalytics";
import NotificationBar from "../../components/NotificationBar";
import { CalendarDataService } from "../../services/CalendarDataService";

export default function Calendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutNote, setWorkoutNote] = useState("");
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("strength");
  
  // 🔄 Data-driven state management
  const [notifications, setNotifications] = useState(0);
  const [workoutData, setWorkoutData] = useState({});
  const [recentActivitiesData, setRecentActivitiesData] = useState([]);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [progressChart, setProgressChart] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Load data on component mount - Replace with actual user ID
  const userId = "user123";

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Load all calendar data in parallel
      const [
        notificationsData,
        calendarData,
        activitiesData,
        typesData,
        chartData,
        stepsResponse,
        analyticsData
      ] = await Promise.all([
        CalendarDataService.fetchUserNotifications(userId),
        CalendarDataService.fetchWorkoutCalendar(userId, "2025-08-01", "2025-10-31"),
        CalendarDataService.fetchRecentActivities(userId),
        CalendarDataService.fetchWorkoutTypes(),
        CalendarDataService.fetchProgressChart(userId, "weight"),
        CalendarDataService.fetchStepsData(userId),
        CalendarDataService.fetchCalendarAnalytics(userId)
      ]);

      // Update state with fetched data
      setNotifications(notificationsData.count);
      setWorkoutData(calendarData);
      setRecentActivitiesData(activitiesData);
      setWorkoutTypes(typesData);
      setProgressChart(chartData);
      setStepsData(stepsResponse);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error("Error loading calendar data:", error);
      Alert.alert("Error", "Failed to load calendar data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateKey = (date) => {
    return CalendarDataService.formatDateKey(date);
  };

  const addWorkout = async () => {
    if (!selectedDate) {
      Alert.alert("Error", "Please select a date first");
      return;
    }

    try {
      const newWorkout = {
        type: selectedWorkoutType,
        completed: true,
        streak: true,
        note: workoutNote.trim() || undefined,
        date: selectedDate,
        duration: 0, // Can be updated later
        createdAt: new Date().toISOString()
      };

      // 🔄 Call API to create workout
      const createdWorkout = await CalendarDataService.createWorkout(userId, newWorkout);
      
      // Update local state
      setWorkoutData(prev => ({ 
        ...prev, 
        [selectedDate]: createdWorkout 
      }));
      
      setWorkoutNote("");
      setShowWorkoutModal(false);
      Alert.alert("Success", "Workout logged successfully!");
      
      // Refresh recent activities
      const updatedActivities = await CalendarDataService.fetchRecentActivities(userId);
      setRecentActivitiesData(updatedActivities);
      
    } catch (error) {
      console.error("Error creating workout:", error);
      Alert.alert("Error", "Failed to log workout. Please try again.");
    }
  };

  const markedDates = useMemo(() => {
    const marks = {};
    Object.entries(workoutData).forEach(([date, workout]) => {
      const workoutType = workoutTypes.find((w) => w.key === workout.type);
      const color = workout.completed ? workoutType?.color || "#1E3A5F" : "rgba(30, 58, 95, 0.3)";
      marks[date] = { marked: true, dotColor: color };
    });
    if (selectedDate) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#1E3A5F" };
    }
    return marks;
  }, [workoutData, selectedDate, workoutTypes]);

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
          <Text style={styles.headerText}>Calendar</Text>
          <View style={styles.headerRight}>
            <NotificationBar notifications={notifications} />
            <Pressable
              style={styles.addButton}
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
              <Ionicons name="add-circle-outline" size={32} color="#1E3A5F" />
            </Pressable>
          </View>
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading calendar data...</Text>
          </View>
        ) : (
          <>
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
              selectedDayBackgroundColor: "#1E3A5F",
              selectedDayTextColor: "#fff",
              todayTextColor: "#1E3A5F",
              arrowColor: "#1E3A5F",
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
              <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}>
                <FontAwesome5 name="dumbbell" size={16} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Workouts</Text>
                <Text style={styles.statValue}>{monthlyStats.workouts}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}>
                <Ionicons name="flame" size={16} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Best Streak</Text>
                <Text style={styles.statValue}>{monthlyStats.streak} days</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}>
                <MaterialIcons name="track-changes" size={16} color="#fff" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel}>Monthly Goal</Text>
                <Text style={styles.statValue}>{monthlyStats.goalPercentage}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Charts - Only render when data is loaded */}
        {progressChart && <ProgressGraph chart={progressChart} />}

        {stepsData && <StepsBarGraph dailyData={stepsData} />}

        {/* Calendar Analytics */}
        {analytics && <CalendarAnalytics analytics={analytics} />}
        
        {/* Recent Activity */}
        <RecentActivity activities={recentActivitiesData} />
          </>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.7,
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
  confirmButton: { backgroundColor: "#1E3A5F" },
  cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
