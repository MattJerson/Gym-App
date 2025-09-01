import { View, Text, Image, StyleSheet } from "react-native";

export default function FeaturedVideo({
  thumbnail = "https://img.youtube.com/vi/XIenDGSAdPA/hqdefault.jpg",
  title = "Full Body Workout",
  description = "A 20-minute intense routine to build strength and burn fat.",
}) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <Text style={styles.headerText}>Featured</Text>

      {/* Thumbnail */}
      <Image source={{ uri: thumbnail }} style={styles.thumbnail} />

      {/* Info */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A5298",
    marginBottom: 12,
  },
  thumbnail: {
    width: "100%",
    height: 180, // 👈 about the same height ratio as quickstart
    borderRadius: 16,
    marginBottom: 12,
  },
  textContainer: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20, // similar weight to "Workout" in QuickStart
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#ddd",
  },
});
