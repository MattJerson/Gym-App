import { Pressable, Text, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function WorkoutCard({ title, sub, colors, rating, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: 14, overflow: "hidden" }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.storyBox}
      >
        <View style={styles.storyTextWrapper}>
          <Text style={styles.storyTitle}>{title}</Text>
          <Text style={styles.storySub}>{sub}</Text>
        </View>

        <View style={styles.storyRating}>
          <Ionicons name="star" size={16} color="#ffd700" />
          <Text style={styles.storyRatingText}>{rating}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  storyBox: {
    width: 200,
    height: 150,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
  },
  storyTextWrapper: {
    flexDirection: "column",
  },
  storyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  storySub: {
    color: "#f0f0f0",
    fontSize: 12,
    marginTop: 2,
  },
  storyRating: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  storyRatingText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
});
