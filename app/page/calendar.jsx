import {
  View,
  Text,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  ScrollView,
  ActionSheetIOS,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useState, useEffect, useMemo, useRef } from "react"; // Added useRef
import NotificationBar from "../../components/NotificationBar";
import { Calendar as RNCalendar } from "react-native-calendars";
import RecentActivity from "../../components/home/RecentActivity";
import ProgressGraph from "../../components/calendar/ProgressGraph";
import StepsBarGraph from "../../components/calendar/StepsBarGraph";
import WorkoutLogModal from "../../components/calendar/WorkoutLogModal";
import { CalendarDataService } from "../../services/CalendarDataService";
import CalendarAnalytics from "../../components/calendar/CalendarAnalytics";
import CalendarStatsCard from "../../components/calendar/CalendarStatsCard";
import WorkoutDetailsModal from "../../components/calendar/WorkoutDetailsModal";
import { CalendarPageSkeleton } from "../../components/skeletons/CalendarPageSkeleton";

export default function Calendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutNote, setWorkoutNote] = useState("");
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("strength");

  // For double-tap detection
  const lastTapTimestamp = useRef(null);
  const lastTapDate = useRef(null);

  // State for the new workout details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState(null);

  const [notifications, setNotifications] = useState(0);
  const [workoutData, setWorkoutData] = useState({});
  const [recentActivitiesData, setRecentActivitiesData] = useState([]);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [progressChart, setProgressChart] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUserId(user.id);
        } else {
          Alert.alert("Error", "Please sign in to view calendar");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        Alert.alert("Error", "Failed to get user session");
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadCalendarData();
    }
  }, [userId]);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      const [
        notificationsData,
        calendarData,
        activitiesData,
        typesData,
        chartData,
        stepsResponse,
        analyticsData,
      ] = await Promise.all([
        CalendarDataService.fetchUserNotifications(userId),
        CalendarDataService.fetchWorkoutCalendar(
          userId,
          "2025-08-01",
          "2025-10-31"
        ),
        CalendarDataService.fetchRecentActivities(userId),
        CalendarDataService.fetchWorkoutTypes(),
        CalendarDataService.fetchProgressChart(userId, "weight"),
        CalendarDataService.fetchStepsData(userId),
        CalendarDataService.fetchCalendarAnalytics(userId),
      ]);
      setNotifications(notificationsData.count);
      setWorkoutData(calendarData);
      setRecentActivitiesData(activitiesData);
      setWorkoutTypes(typesData);
      setProgressChart(chartData);
      setStepsData(stepsResponse);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading calendar data:", error);
      Alert.alert("Error", "Failed to load calendar data.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateKey = (date) => CalendarDataService.formatDateKey(date);

  // Function to show the log workout UI
  const showLogWorkoutUI = () => {
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
          setSelectedWorkoutType(typeMap[buttonIndex - 1]);
          addWorkout(); // Note: addWorkout uses the selected date from state
        }
      );
    } else {
      setShowWorkoutModal(true);
    }
  };

  // Updated handler for day presses
  const handleDayPress = (day) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300; // ms
    const dateString = day.dateString;

    // Check for double tap
    if (
      lastTapTimestamp.current &&
      now - lastTapTimestamp.current < DOUBLE_PRESS_DELAY &&
      lastTapDate.current === dateString
    ) {
      // It's a double tap: show the log UI IF THE DAY IS EMPTY
      if (!workoutData[dateString]) {
        setSelectedDate(dateString);
        showLogWorkoutUI();
      }
      // Reset tap detection
      lastTapTimestamp.current = null;
      lastTapDate.current = null;
    } else {
      // It's a single tap
      lastTapTimestamp.current = now;
      lastTapDate.current = dateString;
      // Select the date
      setSelectedDate(dateString);

      // AND if a workout exists on this date, show the details modal
      if (workoutData[dateString]) {
        setViewingWorkout({ ...workoutData[dateString], date: dateString });
        setShowDetailsModal(true);
      }
    }
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
        duration: 0,
        createdAt: new Date().toISOString(),
      };
      const createdWorkout = await CalendarDataService.createWorkout(
        userId,
        newWorkout
      );
      setWorkoutData((prev) => ({ ...prev, [selectedDate]: createdWorkout }));
      setWorkoutNote("");
      setShowWorkoutModal(false);
      Alert.alert("Success", "Workout logged successfully!");
      const updatedActivities = await CalendarDataService.fetchRecentActivities(
        userId
      );
      setRecentActivitiesData(updatedActivities);
    } catch (error) {
      console.error("Error creating workout:", error);
      Alert.alert("Error", "Failed to log workout.");
    }
  };

  const markedDates = useMemo(() => {
    const marks = {};
    const todayString = formatDateKey(new Date());

    if (todayString) {
      marks[todayString] = {
        customStyles: {
          container: {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderRadius: 8,
          },
          text: {
            color: "#34C759",
            fontWeight: "bold",
          },
        },
      };
    }

    Object.entries(workoutData).forEach(([date, workout]) => {
      const workoutType = workoutTypes.find((w) => w.key === workout.type);
      // FIX: Always use the workout's main color for the dot to ensure visibility.
      // The distinction between 'planned' and 'completed' can be seen in the details modal.
      const color = workoutType?.color || "#1E3A5F";
      marks[date] = { ...marks[date], marked: true, dotColor: color };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: "#1E3A5F",
      };
    }
    return marks;
  }, [workoutData, selectedDate, workoutTypes]);

  const monthlyStats = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let workouts = 0;

    // Count workouts in current month
    Object.entries(workoutData).forEach(([dateKey, workout]) => {
      const [year, month] = dateKey.split("-").map(Number);
      if (
        year === currentYear &&
        month - 1 === currentMonth &&
        workout.completed
      ) {
        workouts++;
      }
    });

    // Calculate current active streak (from today backwards)
    let currentStreakCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check each day going backwards from today
    for (let i = 0; i < 365; i++) {
      // Max 365 days check
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = formatDateKey(checkDate);

      const workout = workoutData[dateKey];

      if (workout && workout.completed) {
        currentStreakCount++;
      } else {
        // If it's today or yesterday and no workout, continue checking
        // This allows for "grace period" - streak doesn't break until you miss 2 days
        if (i === 0) {
          continue; // Today - keep checking backwards
        }
        break; // Streak broken
      }
    }

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const goalPercentage = Math.round((workouts / daysInMonth) * 100);
    return { workouts, streak: currentStreakCount, goalPercentage };
  }, [currentDate, workoutData]);

  return (
    <View style={[styles.container, { backgroundColor: "#0B0B0B" }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Calendar</Text>
          <View style={styles.headerRight}>
            <NotificationBar notifications={notifications} />
            <Pressable
              style={styles.addButton}
              onPress={() => {
                const today = formatDateKey(new Date());
                setSelectedDate(today);
                showLogWorkoutUI();
              }}
            >
              <Ionicons name="add-circle-outline" size={32} color="#74b9ff" />
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <CalendarPageSkeleton />
        ) : (
          <>
            <View style={styles.calendarCard}>
              <RNCalendar
                current={formatDateKey(currentDate)}
                onDayPress={handleDayPress}
                onMonthChange={(month) =>
                  setCurrentDate(new Date(month.dateString))
                }
                markedDates={markedDates}
                markingType={"custom"}
                hideExtraDays={false}
                disableAllTouchEventsForDisabledDays={true}
                theme={{
                  calendarBackground: "transparent",
                  dayTextColor: "#fff",
                  monthTextColor: "#fff",
                  textSectionTitleColor: "#888",
                  selectedDayBackgroundColor: "#1E3A5F",
                  selectedDayTextColor: "#fff",
                  arrowColor: "#74b9ff",
                  textDayFontWeight: "500",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "600",
                  textDayFontSize: 14,
                  textMonthFontSize: 18,
                  textDisabledColor: "#555",
                }}
              />
              <CalendarStatsCard
                monthlyStats={monthlyStats}
                currentDate={currentDate}
              />
            </View>

            {progressChart && <ProgressGraph chart={progressChart} />}
            {stepsData && <StepsBarGraph dailyData={stepsData} />}
            {analytics && <CalendarAnalytics analytics={analytics} />}
            <RecentActivity activities={recentActivitiesData} />
          </>
        )}
      </ScrollView>

      {/* MODAL: Log New Workout */}
      <WorkoutLogModal
        visible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        selectedDate={selectedDate}
        workoutTypes={workoutTypes}
        selectedWorkoutType={selectedWorkoutType}
        setSelectedWorkoutType={setSelectedWorkoutType}
        workoutNote={workoutNote}
        setWorkoutNote={setWorkoutNote}
        onLogWorkout={addWorkout}
      />

      {/* MODAL: View Workout Details */}
      <WorkoutDetailsModal
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        workout={viewingWorkout}
        onDelete={() => {}}
        onEdit={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 15 },
  headerRow: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    justifyContent: "space-between",
  },
  headerText: { fontSize: 28, color: "#fff", fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 15 },
  addButton: { padding: 4 },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#fff", fontSize: 16, opacity: 0.7 },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 22,
    marginBottom: 20,
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
});
