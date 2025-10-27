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
import { supabase, getCurrentUser } from "../../services/supabase";
import { useState, useEffect, useMemo, useRef } from "react";
import { Calendar as RNCalendar } from "react-native-calendars";
import RecentActivity from "../../components/home/RecentActivity";
import ProgressGraph from "../../components/calendar/ProgressGraph";
import StepsBarGraph from "../../components/calendar/StepsBarGraph";
import WorkoutLogModal from "../../components/calendar/WorkoutLogModal";
import HealthKitService from "../../services/HealthKitService";
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

  const [workoutData, setWorkoutData] = useState({});
  const [recentActivitiesData, setRecentActivitiesData] = useState([]);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [progressChart, setProgressChart] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const [healthPermission, setHealthPermission] = useState(false);
  const [isSyncingSteps, setIsSyncingSteps] = useState(false);
  const [showHealthPermissionPrompt, setShowHealthPermissionPrompt] = useState(false);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await getCurrentUser();
        
        if (user) {
          setUserId(user.id);
        } else {
          // User not logged in - redirect to sign in
          router.replace('/page/signin');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadCalendarData();
      checkHealthPermission();
    }
  }, [userId]);

  const checkHealthPermission = async () => {
    try {
      const hasPermission = await HealthKitService.checkPermission();
      setHealthPermission(hasPermission);
      
      // If no permission, show prompt after a short delay
      if (!hasPermission) {
        setTimeout(() => setShowHealthPermissionPrompt(true), 2000);
      }
    } catch (error) {
      console.error('Error checking health permission:', error);
      // Don't show permission prompt if HealthKit isn't available
      setHealthPermission(false);
    }
  };

  const requestHealthPermission = async () => {
    try {
      const granted = await HealthKitService.requestPermission();
      setHealthPermission(granted);
      setShowHealthPermissionPrompt(false);
      
      if (granted) {
        // Sync steps immediately after permission granted
        await syncHealthData();
        Alert.alert(
          "Success! 🎉",
          `Connected to ${Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}. Your steps will sync automatically.`
        );
      } else {
        Alert.alert(
          "Permission Denied",
          "You can enable step tracking later in your device settings."
        );
      }
    } catch (error) {
      console.error('Error requesting health permission:', error);
      Alert.alert("Error", "Failed to connect to health data");
    }
  };

  const syncHealthData = async () => {
    if (!healthPermission) return;
    
    try {
      setIsSyncingSteps(true);
      
      // Fetch steps from HealthKit (last 31 days to match calendar view)
      const healthData = await HealthKitService.getStepsDataForCalendar(31);
      
      // Update state with HealthKit data
      setStepsData(healthData);
      
      // Optionally sync to backend for persistent tracking
      if (healthData.dailySteps && healthData.dailySteps.length > 0) {
        await syncStepsToBackend(healthData.dailySteps);
      }
      
    } catch (error) {
      console.error('Error syncing health data:', error);
      Alert.alert("Sync Error", "Failed to sync step data from health app");
    } finally {
      setIsSyncingSteps(false);
    }
  };

  const syncStepsToBackend = async (dailyStepsArray) => {
    try {
      // Sync each day's steps to the backend for persistent tracking
      // Uses daily_activity_tracking table for progress analytics
      const syncPromises = dailyStepsArray.map(async (dayData) => {
        const { data, error } = await supabase
          .from('daily_activity_tracking')
          .upsert({
            user_id: userId,
            tracking_date: dayData.date,
            steps_count: dayData.steps,
            data_source: Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit',
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,tracking_date',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.warn(`Failed to sync ${dayData.date}:`, error);
        }
        return data;
      });

      await Promise.all(syncPromises);
      console.log(`✅ ${dailyStepsArray.length} days of steps synced to backend for analytics`);
    } catch (error) {
      console.error('Error syncing steps to backend:', error);
      // Don't show alert for backend sync errors - steps are still available from HealthKit
    }
  };

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      const [
        notificationsData,
        calendarData,
        activitiesData,
        typesData,
        chartData,
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
        CalendarDataService.fetchCalendarAnalytics(userId),
      ]);
      
      setNotifications(notificationsData.count);
      setWorkoutData(calendarData);
      setRecentActivitiesData(activitiesData);
      setWorkoutTypes(typesData);
      setProgressChart(chartData);
      setAnalytics(analyticsData);

      // Load steps from HealthKit if permission granted
      try {
        const hasHealthPermission = await HealthKitService.checkPermission();
        if (hasHealthPermission) {
          try {
            const healthData = await HealthKitService.getStepsDataForCalendar(31);
            setStepsData(healthData);
          } catch (healthError) {
            console.log('HealthKit data unavailable, loading from backend:', healthError.message);
            // Fallback to backend data
            const stepsResponse = await CalendarDataService.fetchStepsData(userId);
            setStepsData(stepsResponse);
          }
        } else {
          // Load from backend if no HealthKit permission
          const stepsResponse = await CalendarDataService.fetchStepsData(userId);
          setStepsData(stepsResponse);
        }
      } catch (permissionError) {
        console.log('Health permission check failed, loading from backend:', permissionError.message);
        // Fallback to backend data if permission check fails
        try {
          const stepsResponse = await CalendarDataService.fetchStepsData(userId);
          setStepsData(stepsResponse);
        } catch (backendError) {
          console.log('Backend steps data unavailable:', backendError.message);
          // Steps data will be null, component will handle gracefully
        }
      }
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

  // Updated handler for day presses - VIEW ONLY MODE
  const handleDayPress = (day) => {
    const dateString = day.dateString;
    
    // Simply select the date
    setSelectedDate(dateString);

    // If a workout exists on this date, show the details modal
    if (workoutData[dateString]) {
      setViewingWorkout({ ...workoutData[dateString], date: dateString });
      setShowDetailsModal(true);
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
            {stepsData && (
              <StepsBarGraph 
                dailyData={stepsData} 
                source={stepsData.source}
                lastSynced={stepsData.lastSynced}
                onSyncPress={healthPermission ? syncHealthData : null}
                isSyncing={isSyncingSteps}
                goalSteps={10000}
              />
            )}
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

      {/* Health Permission Prompt */}
      {showHealthPermissionPrompt && !healthPermission && (
        <View style={styles.healthPromptOverlay}>
          <Pressable 
            style={styles.healthPromptBackdrop} 
            onPress={() => setShowHealthPermissionPrompt(false)} 
          />
          <View style={styles.healthPromptCard}>
            <View style={styles.healthIconContainer}>
              <Ionicons 
                name={Platform.OS === 'ios' ? 'fitness' : 'logo-google'} 
                size={48} 
                color="#0A84FF" 
              />
            </View>
            <Text style={styles.healthPromptTitle}>
              Enable Automatic Step Tracking
            </Text>
            <Text style={styles.healthPromptMessage}>
              Connect to {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'} to 
              automatically sync your daily steps. No manual entry needed!
            </Text>
            <View style={styles.healthPromptFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>Auto-sync daily steps</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>Track activity trends</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.featureText}>Better progress insights</Text>
              </View>
            </View>
            <Pressable 
              style={styles.healthEnableButton}
              onPress={requestHealthPermission}
            >
              <Text style={styles.healthEnableButtonText}>Enable Step Tracking</Text>
            </Pressable>
            <Pressable 
              style={styles.healthSkipButton}
              onPress={() => setShowHealthPermissionPrompt(false)}
            >
              <Text style={styles.healthSkipButtonText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 40, paddingHorizontal: 15 },
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
  healthPromptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  healthPromptBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  healthPromptCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  healthIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthPromptTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  healthPromptMessage: {
    fontSize: 15,
    color: 'rgba(235, 235, 245, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  healthPromptFeatures: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.8)',
  },
  healthEnableButton: {
    width: '100%',
    backgroundColor: '#0A84FF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  healthEnableButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  healthSkipButton: {
    paddingVertical: 10,
  },
  healthSkipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(235, 235, 245, 0.6)',
  },
});
