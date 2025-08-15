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
import { useState } from "react";

const router = useRouter();

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Sample workout data
  const workoutData = {
    '2024-08-15': { type: 'strength', completed: true, streak: true },
    '2024-08-14': { type: 'cardio', completed: true, streak: true },
    '2024-08-13': { type: 'rest', completed: true, streak: true },
    '2024-08-12': { type: 'strength', completed: true, streak: true },
    '2024-08-16': { type: 'yoga', completed: false, planned: true },
    '2024-08-17': { type: 'strength', completed: false, planned: true },
    '2024-08-18': { type: 'rest', completed: false, planned: true },
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getWorkoutIcon = (type) => {
    switch (type) {
      case 'strength': return <FontAwesome5 name="dumbbell" size={12} color="#fff" />;
      case 'cardio': return <MaterialIcons name="directions-run" size={12} color="#fff" />;
      case 'yoga': return <MaterialCommunityIcons name="yoga" size={12} color="#fff" />;
      case 'rest': return <Ionicons name="bed" size={12} color="#fff" />;
      default: return null;
    }
  };

  const getWorkoutColor = (type, completed, planned) => {
    if (completed) {
      switch (type) {
        case 'strength': return '#4CAF50';
        case 'cardio': return '#FF5722';
        case 'yoga': return '#9C27B0';
        case 'rest': return '#607D8B';
        default: return '#4CAF50';
      }
    } else if (planned) {
      return 'rgba(255, 255, 255, 0.3)';
    }
    return 'transparent';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const days = getDaysInMonth(currentDate);

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
          <Text style={styles.headerText}>Workout Calendar</Text>
          <Pressable onPress={() => {}}>
            <Ionicons name="add-circle-outline" size={28} color="#fff" />
          </Pressable>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <Pressable onPress={() => navigateMonth(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.monthText}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <Pressable onPress={() => navigateMonth(1)} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {dayNames.map((day) => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.emptyDay} />;
              }

              const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
              const workoutInfo = workoutData[dateKey];
              const today = isToday(day);

              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayCell,
                    today && styles.todayCell,
                    selectedDate === dateKey && styles.selectedDay
                  ]}
                  onPress={() => setSelectedDate(dateKey)}
                >
                  <Text style={[styles.dayText, today && styles.todayText]}>
                    {day}
                  </Text>
                  {workoutInfo && (
                    <View style={[
                      styles.workoutIndicator,
                      { backgroundColor: getWorkoutColor(workoutInfo.type, workoutInfo.completed, workoutInfo.planned) }
                    ]}>
                      {getWorkoutIcon(workoutInfo.type)}
                    </View>
                  )}
                  {workoutInfo && workoutInfo.streak && (
                    <View style={styles.streakIndicator}>
                      <Ionicons name="flame" size={8} color="#FF6B35" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Strength</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF5722' }]} />
              <Text style={styles.legendText}>Cardio</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#9C27B0' }]} />
              <Text style={styles.legendText}>Yoga</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#607D8B' }]} />
              <Text style={styles.legendText}>Rest</Text>
            </View>
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>August Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Streak</Text>
              <Ionicons name="flame" size={16} color="#FF6B35" />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>75%</Text>
              <Text style={styles.statLabel}>Goal</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionBtn}>
              <FontAwesome5 name="dumbbell" size={16} color="#fff" />
              <Text style={styles.actionText}>Log Workout</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <MaterialIcons name="schedule" size={16} color="#fff" />
              <Text style={styles.actionText}>Schedule</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <Ionicons name="stats-chart" size={16} color="#fff" />
              <Text style={styles.actionText}>Progress</Text>
            </Pressable>
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
  backRow: {
    top: 0,
    left: 20,
    zIndex: 10,
    position: "absolute",
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 10,
  },
  monthText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayHeader: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 40,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 20,
    position: 'relative',
  },
  emptyDay: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  todayCell: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  todayText: {
    fontWeight: 'bold',
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
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
    marginBottom: 10,
    fontWeight: "bold",
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#ccc',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  statNumber: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 15,
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});