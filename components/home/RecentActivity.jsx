// components/home/RecentActivity.jsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function RecentActivity({ activities = [] }) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Activity</Text>
        <Ionicons name="time-outline" size={20} color="#fff" />
      </View>

      {/* Dynamic list of activities */}
      {activities.slice(0, 4).map((item, idx) => (
        <Pressable key={idx} style={styles.item}>
          <LinearGradient colors={item.color} style={styles.iconContainer}>
            <Ionicons name={item.icon} size={16} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.sub}>{item.duration}</Text>
          </View>
        </Pressable>
      ))}

      {/* Subtle footer */}
      <Text style={styles.footer}>View full history →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 22,
    marginBottom: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  headerRow: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  sub: {
    fontSize: 11,
    color: "#aaa",
  },
  footer: {
    fontSize: 12,
    marginTop: 10,
    textAlign: "right",
    color: "#bbb",
  },
});