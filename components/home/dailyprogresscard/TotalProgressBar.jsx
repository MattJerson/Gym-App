import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TotalProgressBar({ totalProgress }) {
  return (
    <View style={styles.totalProgressWrapper}>
      <Text style={styles.totalProgressText}>
        {`${Math.round(totalProgress)}% Complete`}
      </Text>
      <View style={styles.totalProgressContainer}>
        <LinearGradient
          colors={["#2A5298", "#3A7BD5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.totalProgressBar, { width: `${totalProgress}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totalProgressWrapper: { marginBottom: 20 },
  totalProgressContainer: {
    width: "100%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "#001f3f",
    overflow: "hidden",
  },
  totalProgressBar: { height: "100%", borderRadius: 4 },
  totalProgressText: {
    fontSize: 12,
    marginBottom: 6,
    textAlign: "left",
    fontWeight: "600",
    color: "#fff",
  },
});
