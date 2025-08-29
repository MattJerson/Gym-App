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
      {/* Month label */}
      <Text style={styles.monthText}>{today.format("MMMM YYYY")}</Text>

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
    marginBottom: 20,
  },
  monthText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
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
    fontSize: 12,
    marginBottom: 4,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  dateCircleSelected: {
    backgroundColor: "#2A5298",
  },
  dateText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dimmedText: {
    color: "rgba(255,255,255,0.3)",
  },
  todayText: {
    color: "#2A5298",
    fontWeight: "700",
  },
  todayDateText: {
    color: "#fff",
    fontWeight: "700",
  },
});
