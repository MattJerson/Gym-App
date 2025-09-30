// components/home/RecentActivity.jsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function RecentActivity({ activities = [] }) {
  const router = useRouter();

  const handleViewAll = () => {
    router.push("/activity");
  };

const getActivityHighlight = (activity) => {
  const parts = [];
  if (activity.calories) parts.push(`${activity.calories} cal`);
  if (activity.duration) parts.push(activity.duration);
  return parts.join(" • "); // e.g. "250 cal • 30 min"
};


  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Activity</Text>
        <Ionicons name="time-outline" size={18} color="#fff" />
      </View>

      {/* Dynamic list of activities */}
      {activities.slice(0, 4).map((item, idx) => (
        <Pressable key={idx} style={styles.item}>
          <View style={styles.activityInfo}>
            <Text style={styles.name}>{item.label}</Text>
            <Text style={styles.details}>{item.date} • {item.duration}</Text>
          </View>

          <Text style={styles.highlight}>
            {getActivityHighlight(item)}
          </Text>
        </Pressable>
      ))}

      {/* Subtle footer with navigation */}
      <Pressable onPress={handleViewAll}>
        <Text style={styles.footer}>View full history →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    marginBottom: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
  },
  headerRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  activityInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: "#aaa",
  },
  highlight: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  footer: {
    fontSize: 13,
    marginTop: 12,
    textAlign: "right",
    color: "#74b9ff",
    fontWeight: "500",
  },
});