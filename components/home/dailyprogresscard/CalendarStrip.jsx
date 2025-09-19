import { View, Text, StyleSheet } from "react-native";
import moment from "moment";

export default function CalendarStrip() {
  const today = moment();

  // Generate days: 3 before, today, 3 after
  const daysAround = Array.from({ length: 7 }).map((_, i) =>
    moment(today).add(i - 3, "days")
  );

  return (
    <View style={styles.calendarWrapper}>
      <View style={styles.calendarContainer}>
        {daysAround.map((day, idx) => {
          const isToday = day.isSame(today, "day");
          const isPast = day.isBefore(today, "day");
          const isFuture = day.isAfter(today, "day");

          return (
            <View key={idx} style={styles.calendarItem}>
              {/* Day of week (Mon, Tue, etc.) */}
              <Text
                style={[
                  styles.dayText,
                  (isPast || isFuture) && styles.dimmedText,
                  isToday && styles.todayText,
                ]}
              >
                {day.format("ddd")}
              </Text>

              {/* Date number */}
              <View
                style={[
                  styles.dateCircle,
                  isToday && styles.dateCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateText,
                    (isPast || isFuture) && styles.dimmedText,
                    isToday && styles.todayDateText,
                  ]}
                >
                  {day.format("D")}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarWrapper: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarItem: {
    alignItems: "center",
    flex: 1,
  },
  dayText: {
    color: "#aaa",
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dateCircleSelected: {
    backgroundColor: "#74b9ff",
    borderColor: "#74b9ff",
    shadowColor: "#74b9ff",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  dateText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  dimmedText: {
    color: "rgba(255,255,255,0.4)",
  },
  todayText: {
    color: "#74b9ff",
    fontWeight: "600",
  },
  todayDateText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
