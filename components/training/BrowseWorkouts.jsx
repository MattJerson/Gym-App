import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Get screen dimensions
const { width } = Dimensions.get("window");

// --- MODIFICATIONS START HERE ---

// Calculate card dimensions
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 16;
const VISIBLE_CARDS = 2.5;

const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2)) / VISIBLE_CARDS;
// Adjusted aspect ratio to make cards shorter ( ~3/4 of previous height)
const CARD_HEIGHT = CARD_WIDTH * 1.25; 

// --- MODIFICATIONS END HERE ---

const MOCK_WORKOUTS = [
  {
    id: "1",
    name: "Push Day",
    type: "Strength",
    icon: { name: "chest-expander", library: MaterialCommunityIcons },
    colors: ["#ffafbd", "#ffc3a0"], // Pink -> Peach
  },
  {
    id: "2",
    name: "Pull Day",
    type: "Strength",
    icon: { name: "weight-lifter", library: FontAwesome5 },
    colors: ["#2193b0", "#6dd5ed"], // Blue -> Light Blue
  },
  {
    id: "3",
    name: "Leg Day",
    type: "Hypertrophy",
    icon: { name: "running", library: FontAwesome5 },
    colors: ["#cc2b5e", "#753a88"], // Purple -> Dark Pink
  },
  {
    id: "4",
    name: "Full Body HIIT",
    type: "Cardio",
    icon: { name: "flash-on", library: MaterialIcons },
    colors: ["#ee9ca7", "#ffdde1"], // Light Pink -> Lighter Pink
  },
  {
    id: "5",
    name: "Active Recovery",
    type: "Mobility",
    icon: { name: "yoga", library: MaterialCommunityIcons },
    colors: ["#42e695", "#3bb2b8"], // Green -> Teal
  },
];

// Individual Card Component for the FlatList
const WorkoutCardItem = ({ item, onPress }) => {
  // Handle both old and new data structures
  const iconName = item.icon?.name || item.icon;
  const iconLibrary = item.icon?.library || FontAwesome5;
  const colors = item.colors || item.gradient || ["#1E3A5F", "#4A90E2"];
  
  // Icon mapping for the new data structure
  const getIconLibrary = (iconName) => {
    const iconMap = {
      'dumbbell': FontAwesome5,
      'flash': MaterialIcons,
      'trending-up': MaterialIcons,
      'leaf': MaterialCommunityIcons,
      'fitness': MaterialIcons,
      'body': MaterialCommunityIcons,
      'zap': MaterialIcons
    };
    return iconMap[iconName] || FontAwesome5;
  };

  const IconComponent = typeof iconLibrary === 'function' ? iconLibrary : getIconLibrary(iconName);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconOverlay}>
          <IconComponent
            name={iconName}
            size={70}
            color="rgba(255, 255, 255, 0.15)"
          />
        </View>

        {/* --- MODIFIED CONTENT LAYOUT --- */}
        <View style={styles.textContainer}>
          <View style={styles.workoutTypeTag}>
            <Text style={styles.workoutTypeText}>{item.type}</Text>
          </View>
          <Text style={styles.workoutName}>{item.name}</Text>
          {/* Additional info for new data structure */}
          {item.duration && (
            <Text style={styles.workoutDetails}>
              {item.duration} min • {item.exercises} exercises
            </Text>
          )}
        </View>
        {/* ----------------------------- */}

      </LinearGradient>
    </Pressable>
  );
};

export default function BrowseWorkouts({
  workouts = MOCK_WORKOUTS,
  onSelectWorkout = () => {},
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Workouts</Text>
      <FlatList
        data={workouts}
        renderItem={({ item }) => (
          <WorkoutCardItem
            item={item}
            onPress={() => onSelectWorkout(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContentContainer}
        snapToInterval={CARD_WIDTH + CARD_MARGIN_RIGHT}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 12,
  },
  listContentContainer: {
    paddingRight: PADDING_HORIZONTAL * 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN_RIGHT,
    borderRadius: 4,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gradient: {
    padding: 10,
    flex: 1,
    // Pushes the textContainer to the bottom
    justifyContent: "flex-end",
  },
  iconOverlay: {
    position: "absolute",
    top: 10,
    right: -5,
    opacity: 0.8,
  },
  // --- NEW AND UPDATED STYLES ---
  textContainer: {
    // Aligns content to the bottom-left
    alignSelf: 'flex-start'
  },
  workoutTypeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 4,
    backgroundColor: "rgba(0, 0, 0, 0.40)",
    borderRadius: 4,
    marginBottom: 4, // Space between tag and title
  },
  workoutTypeText: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "500",
  },
  workoutName: {
    fontSize: 22, // Made text slightly larger
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  workoutDetails: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});