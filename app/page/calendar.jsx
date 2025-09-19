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
import { useState, useEffect, useMemo, useRef } from "react"; // Added useRef
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

  const userId = "user123";

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      const [
        notificationsData, calendarData, activitiesData, typesData,
        chartData, stepsResponse, analyticsData
      ] = await Promise.all([
        CalendarDataService.fetchUserNotifications(userId),
        CalendarDataService.fetchWorkoutCalendar(userId, "2025-08-01", "2025-10-31"),
        CalendarDataService.fetchRecentActivities(userId),
        CalendarDataService.fetchWorkoutTypes(),
        CalendarDataService.fetchProgressChart(userId, "weight"),
        CalendarDataService.fetchStepsData(userId),
        CalendarDataService.fetchCalendarAnalytics(userId)
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
    if (lastTapTimestamp.current && (now - lastTapTimestamp.current) < DOUBLE_PRESS_DELAY && lastTapDate.current === dateString) {
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
      const newWorkout = { type: selectedWorkoutType, completed: true, streak: true, note: workoutNote.trim() || undefined, date: selectedDate, duration: 0, createdAt: new Date().toISOString() };
      const createdWorkout = await CalendarDataService.createWorkout(userId, newWorkout);
      setWorkoutData(prev => ({ ...prev, [selectedDate]: createdWorkout }));
      setWorkoutNote("");
      setShowWorkoutModal(false);
      Alert.alert("Success", "Workout logged successfully!");
      const updatedActivities = await CalendarDataService.fetchRecentActivities(userId);
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
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
          },
          text: {
            color: '#34C759',
            fontWeight: 'bold',
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
      marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#1E3A5F" };
    }
    return marks;
  }, [workoutData, selectedDate, workoutTypes]);

  const monthlyStats = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let workouts = 0, maxStreak = 0, currentStreak = 0;
    Object.entries(workoutData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .forEach(([dateKey, workout]) => {
        const [year, month] = dateKey.split("-").map(Number);
        if (year === currentYear && month - 1 === currentMonth && workout.completed) workouts++;
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
                const today = formatDateKey(new Date());
                setSelectedDate(today);
                showLogWorkoutUI();
              }}
            >
              <Ionicons name="add-circle-outline" size={32} color="#1E3A5F" />
            </Pressable>
          </View>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading calendar data...</Text></View>
        ) : (
          <>
            <View style={styles.calendarCard}>
              <RNCalendar
                current={formatDateKey(currentDate)}
                onDayPress={handleDayPress}
                onMonthChange={(month) => setCurrentDate(new Date(month.dateString))}
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
                  arrowColor: "#1E3A5F",
                  textDayFontWeight: "500",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "600",
                  textDayFontSize: 14,
                  textMonthFontSize: 18,
                  textDisabledColor: "#555",
                }}
              />
              <View style={styles.statsContainer}>
                <Text style={styles.cardTitle}>{currentDate.toLocaleString("default", { month: "long" })} Progress</Text>
                <View style={styles.statRow}>
                  <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}><FontAwesome5 name="dumbbell" size={16} color="#fff" /></View>
                  <View style={styles.statTextContainer}><Text style={styles.statLabel}>Workouts</Text><Text style={styles.statValue}>{monthlyStats.workouts}</Text></View>
                </View>
                <View style={styles.statRow}>
                  <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}><Ionicons name="flame" size={16} color="#fff" /></View>
                  <View style={styles.statTextContainer}><Text style={styles.statLabel}>Best Streak</Text><Text style={styles.statValue}>{monthlyStats.streak} days</Text></View>
                </View>
                <View style={styles.statRow}>
                  <View style={[styles.statIcon, { backgroundColor: "#1E3A5F" }]}><MaterialIcons name="track-changes" size={16} color="#fff" /></View>
                  <View style={styles.statTextContainer}><Text style={styles.statLabel}>Monthly Goal</Text><Text style={styles.statValue}>{monthlyStats.goalPercentage}%</Text></View>
                </View>
              </View>
            </View>

            {progressChart && <ProgressGraph chart={progressChart} />}
            {stepsData && <StepsBarGraph dailyData={stepsData} />}
            {analytics && <CalendarAnalytics analytics={analytics} />}
            <RecentActivity activities={recentActivitiesData} />
          </>
        )}
      </ScrollView>

      {/* MODAL: Log New Workout */}
      <Modal visible={showWorkoutModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowWorkoutModal(false)}>
          <Pressable style={styles.workoutModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log Workout</Text>
            <Text style={styles.modalDate}>{selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
            
            <Text style={styles.sectionTitle}>Workout Type</Text>
            <View style={styles.workoutTypeGrid}>
              {workoutTypes.map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.workoutTypeButton,
                    { 
                      backgroundColor: type.color,
                      opacity: selectedWorkoutType === type.key ? 1 : 0.6,
                    },
                    selectedWorkoutType === type.key && styles.selectedWorkoutType,
                  ]}
                  onPress={() => setSelectedWorkoutType(type.key)}
                >
                  {type.key === "yoga" ? <MaterialCommunityIcons name={type.icon} size={22} color="#fff" /> : type.key === "cardio" ? <MaterialIcons name={type.icon} size={22} color="#fff" /> : type.key === "rest" ? <Ionicons name={type.icon} size={22} color="#fff" /> : <FontAwesome5 name={type.icon} size={18} color="#fff" />}
                  <Text style={styles.workoutTypeText}>{type.name}</Text>
                </Pressable>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput style={styles.noteInput} placeholder="How was the workout?" placeholderTextColor="#888" value={workoutNote} onChangeText={setWorkoutNote} multiline />
            
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowWorkoutModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addWorkout}>
                <LinearGradient
                  colors={["#2E4A6F", "#1E3A5F"]}
                  style={[styles.modalButton, styles.confirmButton]}
                >
                  <Text style={styles.modalButtonText}>Log Workout</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL: View Workout Details */}
      <Modal visible={showDetailsModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDetailsModal(false)}>
          <Pressable style={styles.workoutModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Workout Details</Text>
            {viewingWorkout && (
              <Text style={styles.modalDate}>
                {new Date(viewingWorkout.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
            )}
            
            <ScrollView style={styles.detailsScrollView}>
              <View style={styles.detailsContainer}>
                {/* Dynamically render details based on workout type */}
                {viewingWorkout?.type && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={[styles.detailValue, {textTransform: 'capitalize'}]}>{viewingWorkout.type}</Text>
                  </View>
                )}
                {viewingWorkout?.duration && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{viewingWorkout.duration} min</Text>
                  </View>
                )}
                 {viewingWorkout?.type === 'cardio' && viewingWorkout.distance && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>{viewingWorkout.distance} km</Text>
                  </View>
                )}
                {viewingWorkout?.type === 'cardio' && viewingWorkout.pace && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pace</Text>
                    <Text style={styles.detailValue}>{viewingWorkout.pace} /km</Text>
                  </View>
                )}
                {viewingWorkout?.type === 'strength' && viewingWorkout.exercises && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Exercises</Text>
                    <Text style={styles.detailValue}>{viewingWorkout.exercises.join(', ')}</Text>
                  </View>
                )}
                {viewingWorkout?.note && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Note</Text>
                    <Text style={styles.detailValue}>{viewingWorkout.note}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.deleteButton]} 
                onPress={() => Alert.alert("Delete", "Delete functionality will be added soon.")}
              >
                 <Ionicons name="trash-outline" size={18} color="#FF453A" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.editButton]} 
                onPress={() => Alert.alert("Edit", "Edit functionality will be added soon.")}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>Edit</Text>
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
  scrollContent: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 15 },
  headerRow: { marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 5 },
  headerText: { fontSize: 28, color: "#fff", fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 15 },
  addButton: { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  loadingText: { color: "#fff", fontSize: 16, opacity: 0.7 },
  calendarCard: { backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 22, marginBottom: 20, overflow: "hidden" },
  statsContainer: { padding: 20, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.1)" },
  cardTitle: { fontSize: 18, color: "#fff", marginBottom: 15, fontWeight: "bold" },
  statRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.06)" },
  statIcon: { width: 36, height: 36, borderRadius: 10, marginRight: 12, justifyContent: "center", alignItems: "center" },
  statTextContainer: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 15, color: "#ccc", fontWeight: "500" },
  statValue: { fontSize: 16, color: "#fff", fontWeight: "700" },
  
  // --- MODAL STYLES (Updated) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  workoutModal: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 15,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalDate: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 25,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#EFEFEF",
    fontWeight: "600",
    marginBottom: 12,
  },
  workoutTypeGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 25,
  },
  workoutTypeButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWorkoutType: {
    borderColor: "#fff",
  },
  workoutTypeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  noteInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 30,
    minHeight: 110,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
  modalButton: { flex: 1, padding: 16, borderRadius: 18, alignItems: "center", justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancelButton: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
  confirmButton: {
    // backgroundColor is now handled by LinearGradient
  },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  // --- DETAILS MODAL STYLES ---
  detailsScrollView: {
    maxHeight: 300, // Limit height for long details
    marginBottom: 20,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    flex: 0.8,
  },
  deleteButtonText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});


