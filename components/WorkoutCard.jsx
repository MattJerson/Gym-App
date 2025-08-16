import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View, StyleSheet } from "react-native";

export default function WorkoutCard({ title, sub, colors, rating, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: 14, overflow: "hidden" }}
    >
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
    padding: 12,
    borderRadius: 14,
    justifyContent: "space-between",
  },
  storyTextWrapper: {
    flexDirection: "column",
  },
  storyTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  storySub: {
    fontSize: 12,
    marginTop: 2,
    color: "#f0f0f0",
  },
  storyRating: {
    borderRadius: 12,
    paddingVertical: 3,
    flexDirection: "row",
    paddingHorizontal: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  storyRatingText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
});
