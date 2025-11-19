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
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase, getCurrentUser } from "../../services/supabase";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Calendar as RNCalendar } from "react-native-calendars";
import RecentActivity from "../../components/home/RecentActivity";
import RecentActivitySkeleton from "../../components/skeletons/RecentActivitySkeleton";
import ProgressGraph from "../../components/calendar/ProgressGraph";
import StepsBarGraph from "../../components/calendar/StepsBarGraph";
import WorkoutLogModal from "../../components/calendar/WorkoutLogModal";
import HealthKitService from "../../services/HealthKitService";
import StepsSyncService from "../../services/StepsSyncService";
import { CalendarDataService } from "../../services/CalendarDataService";
import CalendarStatsCard from "../../components/calendar/CalendarStatsCard";
import WorkoutDetailsModal from "../../components/calendar/WorkoutDetailsModal";
import DayActivityTooltip from "../../components/calendar/DayActivityTooltip";
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

  // State for day activity tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipCounts, setTooltipCounts] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);

  const [workoutData, setWorkoutData] = useState({});
  const [recentActivitiesData, setRecentActivitiesData] = useState([]);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [progressChart, setProgressChart] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [activityIndicators, setActivityIndicators] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const [healthPermission, setHealthPermission] = useState(false);
  const [isSyncingSteps, setIsSyncingSteps] = useState(false);
  const [showHealthPermissionPrompt, setShowHealthPermissionPrompt] = useState(false);
  const [stepsTrackingEnabled, setStepsTrackingEnabled] = useState(false);
  const [hasSeenStepsPrompt, setHasSeenStepsPrompt] = useState(false);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0 });
  const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);

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
        if (error.name !== 'AuthSessionMissingError') {
          console.error("Error fetching user:", error);
        }
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadCalendarData();
      loadStreakData();
      loadMonthlyAnalytics();
      checkHealthPermission();
    }
  }, [userId]);

  // Reload monthly analytics when month changes
  useEffect(() => {
    if (userId && currentDate) {
      loadMonthlyAnalytics();
    }
  }, [userId, currentDate]);

  // Reload data when screen comes into focus (navigating back to calendar)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadCalendarData();
        loadStreakData();
        loadMonthlyAnalytics();
      }
    }, [userId, currentDate])
  );

  const loadMonthlyAnalytics = async () => {
    if (!userId || !currentDate) return;
    
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      
      const analytics = await CalendarDataService.fetchMonthlyAnalytics(userId, year, month);
      setMonthlyAnalytics(analytics);
    } catch (error) {
      console.error("Error loading monthly analytics:", error);
    }
  };

  const checkHealthPermission = async () => {
    try {
      const hasPermission = await HealthKitService.checkPermission();
      setHealthPermission(hasPermission);
      setStepsTrackingEnabled(hasPermission);
      
      // Check if user has seen the prompt before (stored in user_stats)
      if (!hasPermission && userId) {
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('steps_prompt_dismissed')
          .eq('user_id', userId)
          .single();
        
        const hasSeenPrompt = userStats?.steps_prompt_dismissed || false;
        setHasSeenStepsPrompt(hasSeenPrompt);
        
        // Only show prompt if they haven't seen it before
        if (!hasSeenPrompt) {
          setTimeout(() => setShowHealthPermissionPrompt(true), 2000);
        }
      }
    } catch (error) {
      console.error('Error checking health permission:', error);
      // Don't show permission prompt if HealthKit isn't available
      setHealthPermission(false);
      setStepsTrackingEnabled(false);
    }
  };

  const loadStreakData = async () => {
    try {
      // Fetch user stats for streak information
      const { data, error } = await supabase
        .from('user_stats')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setStreakData({
          current: data.current_streak || 0,
          longest: data.longest_streak || 0,
        });
      }
    } catch (error) {
      console.error("Error loading streak data:", error);
    }
  };

  const requestHealthPermission = async () => {
    try {
      const granted = await HealthKitService.requestPermission();
      setHealthPermission(granted);
      setStepsTrackingEnabled(granted);
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

  const dismissStepsPrompt = async () => {
    setShowHealthPermissionPrompt(false);
    setHasSeenStepsPrompt(true);
    
    // Store dismissal in user_stats so we don't show it again
    try {
      const { error } = await supabase
        .from('user_stats')
        .update({ steps_prompt_dismissed: true })
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving steps prompt dismissal:', error);
    }
  };

  const syncHealthData = async () => {
    if (!healthPermission) return;
    
    try {
      setIsSyncingSteps(true);
      
      // Use the centralized sync service for consistency
      const success = await StepsSyncService.forceSyncNow(userId);
      
      if (success) {
        // Fetch fresh data from HealthKit for display
        const healthData = await HealthKitService.getStepsDataForCalendar(31);
        setStepsData(healthData);
      } else {
        throw new Error('Sync failed');
      }
      
    } catch (error) {
      console.error('Error syncing health data:', error);
      Alert.alert("Sync Error", "Failed to sync step data from health app");
    } finally {
      setIsSyncingSteps(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Get dynamic date range for calendar (current month ± 2 months)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const [
        notificationsData,
        calendarData,
        activitiesData,
        typesData,
        chartData,
        indicatorsData,
      ] = await Promise.all([
        CalendarDataService.fetchUserNotifications(userId),
        CalendarDataService.fetchWorkoutCalendar(
          userId,
          formatDate(startDate),
          formatDate(endDate)
        ),
        CalendarDataService.fetchRecentActivities(userId),
        CalendarDataService.fetchWorkoutTypes(),
        CalendarDataService.fetchProgressChart(userId, "weight"),
        CalendarDataService.fetchActivityIndicators(
          userId,
          formatDate(startDate),
          formatDate(endDate)
        ),
      ]);
      setNotifications(notificationsData.count);
      setWorkoutData(calendarData);
      setRecentActivitiesData(activitiesData);
      setWorkoutTypes(typesData);
      setProgressChart(chartData);
      setActivityIndicators(indicatorsData);

      // Load steps from HealthKit if permission granted
      try {
        const hasHealthPermission = await HealthKitService.checkPermission();
        if (hasHealthPermission) {
          try {
            const healthData = await HealthKitService.getStepsDataForCalendar(31);
            setStepsData(healthData);
          } catch (healthError) {
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
        // Fallback to backend data if permission check fails
        try {
          const stepsResponse = await CalendarDataService.fetchStepsData(userId);
          setStepsData(stepsResponse);
        } catch (backendError) {
          // Steps data will be null, component will handle gracefully
        }
      }
    } catch (error) {
      console.error("❌ Error loading calendar data:", error);
      console.error("❌ Error stack:", error.stack);
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

  // Updated handler for day presses - show tooltip with activity counts
  const handleDayPress = async (day) => {
    const dateString = day.dateString;
    const selectedDateObj = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only allow viewing past dates and today
    if (selectedDateObj > today) {
      return;
    }

    setSelectedDate(dateString);
    
    // Fetch activity counts for this day
    try {
      const counts = await CalendarDataService.fetchDayActivityCounts(userId, dateString);
      setTooltipCounts(counts);
      
      // Calculate position (centered above the day, approximate)
      // Note: This is a simplified positioning. For exact positioning, you'd need to measure the calendar layout
      setTooltipPosition({ x: 20, y: 200 }); // You can adjust these values
      
      setShowTooltip(true);
      
      // Auto-hide tooltip after 3 seconds
      setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
    } catch (error) {
      console.error('Error fetching day activity counts:', error);
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
        selected: true,
        selectedColor: "rgba(52, 199, 89, 0.2)",
        dots: []
      };
    }

    // Add activity indicators as colored dots
    Object.entries(activityIndicators).forEach(([date, activities]) => {
      const dots = [];
      
      if (activities.includes('workout')) {
        dots.push({ key: 'workout', color: '#0A84FF' }); // Blue for workouts
      }
      if (activities.includes('meal')) {
        dots.push({ key: 'meal', color: '#34C759' }); // Green for meals
      }
      if (activities.includes('steps')) {
        dots.push({ key: 'steps', color: '#FF9500' }); // Orange for steps
      }
      if (activities.includes('weight')) {
        dots.push({ key: 'weight', color: '#AF52DE' }); // Purple for weight
      }

      if (dots.length > 0) {
        marks[date] = {
          ...marks[date],
          dots: dots,
        };
      }
    });

    if (selectedDate && selectedDate !== todayString) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: "#1E3A5F",
      };
    }
    return marks;
  }, [activityIndicators, selectedDate]);

  const monthlyStats = useMemo(() => {
    if (monthlyAnalytics) {
      return monthlyAnalytics;
    }

    // Fallback to calculating from workoutData if analytics not loaded yet
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let workouts = 0;

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

    return {
      totalWorkouts: workouts,
      currentStreak: streakData.current,
      longestStreak: streakData.longest,
      daysActive: workouts,
      totalDuration: 0,
      totalCalories: 0,
      totalVolume: 0,
      avgDuration: 0,
      totalPoints: 0,
      completionRate: 0,
      workoutsPerWeek: 0
    };
  }, [currentDate, workoutData, streakData, monthlyAnalytics]);

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
                markingType={"multi-dot"}
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
                  dotColor: "#0A84FF",
                  selectedDotColor: "#FFFFFF",
                }}
              />
              <CalendarStatsCard
                monthlyStats={monthlyStats}
                currentDate={currentDate}
              />
            </View>

            {progressChart && <ProgressGraph chart={progressChart} userId={userId} />}
            {stepsData && (
              <StepsBarGraph 
                dailyData={stepsData} 
                source={stepsData.source}
                lastSynced={stepsData.lastSynced}
                onSyncPress={healthPermission ? syncHealthData : null}
                isSyncing={isSyncingSteps}
                goalSteps={10000}
                stepsTrackingEnabled={stepsTrackingEnabled}
                onEnableTracking={hasSeenStepsPrompt ? requestHealthPermission : null}
              />
            )}
            {!stepsData && !stepsTrackingEnabled && hasSeenStepsPrompt && (
              <View style={styles.lockedFeatureCard}>
                <View style={styles.lockedIconContainer}>
                  <Ionicons name="footsteps" size={32} color="#666" />
                </View>
                <Text style={styles.lockedTitle}>Steps Tracking Disabled</Text>
                <Text style={styles.lockedMessage}>
                  Enable step tracking to automatically sync your daily steps and track your activity
                </Text>
                <Pressable 
                  style={styles.enableButton}
                  onPress={requestHealthPermission}
                >
                  <Text style={styles.enableButtonText}>Enable Step Tracking</Text>
                </Pressable>
              </View>
            )}
            <RecentActivity />
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

      {/* Tooltip: Day Activity Summary */}
      <DayActivityTooltip
        visible={showTooltip}
        counts={tooltipCounts}
        position={tooltipPosition}
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
              onPress={dismissStepsPrompt}
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
  scrollContent: { paddingTop: 10, paddingBottom: 40, paddingHorizontal: 20 },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 22,
    marginBottom: 20,
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  lockedFeatureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  lockedIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 14,
    color: 'rgba(235, 235, 245, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  enableButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  enableButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
