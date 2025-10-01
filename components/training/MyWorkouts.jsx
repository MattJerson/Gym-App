import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Get screen dimensions
const { width } = Dimensions.get("window");

// Card dimensions - larger, more prominent cards
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 14;
const VISIBLE_CARDS = 1.3; // Show more of next card

const CARD_WIDTH = (width - 40 - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;
const CARD_HEIGHT = 200;

// Mock user workouts data
const MOCK_MY_WORKOUTS = [
  {
    id: "1",
    name: "Full Body Strength",
    exercises: 8,
    duration: 45,
    difficulty: "Intermediate",
    calories: 320,
    workoutType: "Custom Workout",
    color: "#10B981",
    icon: "dumbbell",
  },
  {
    id: "2",
    name: "Upper Body Focus",
    exercises: 6,
    duration: 35,
    difficulty: "Beginner",
    calories: 240,
    workoutType: "Pre-made Workout",
    color: "#8B5CF6",
    icon: "arm-flex",
  },
  {
    id: "3",
    name: "HIIT Cardio Blast",
    exercises: 10,
    duration: 30,
    difficulty: "Advanced",
    calories: 400,
    workoutType: "Custom Workout",
    color: "#F59E0B",
    icon: "run-fast",
  },
  {
    id: "4",
    name: "Cardio & Core",
    exercises: 7,
    duration: 40,
    difficulty: "Intermediate",
    calories: 300,
    workoutType: "Pre-made Workout",
    color: "#EF4444",
    icon: "heart-pulse",
  },
];

// Difficulty badge colors
const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "Beginner":
      return "#10B981";
    case "Intermediate":
      return "#F59E0B";
    case "Advanced":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

// Workout Card Component - Refined design with color coding
const WorkoutCardItem = ({ item, onPress, onOptions }) => {
  const difficultyColor = getDifficultyColor(item.difficulty);
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]} 
      onPress={onPress}
    >
      <View style={styles.cardInner}>
        {/* Color accent stripe at top */}
        <View style={[styles.colorAccent, { backgroundColor: item.color }]} />
        
        {/* Header with workout type badge */}
        <View style={styles.headerRow}>
          <View style={[styles.typeBadge, { 
            backgroundColor: `${item.color}12`,
            borderColor: `${item.color}25`,
          }]}>
            <Text style={[styles.typeText, { color: item.color }]}>
              {item.workoutType.toUpperCase()}
            </Text>
          </View>
          <Pressable 
            style={styles.optionsButton}
            onPress={(e) => {
              e.stopPropagation();
              onOptions(item.id);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#999" />
          </Pressable>
        </View>

        {/* Workout name with icon */}
        <View style={styles.nameRow}>
          <View style={[styles.iconBadge, { backgroundColor: `${item.color}20` }]}>
            <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
          </View>
          <Text style={styles.workoutName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        {/* Difficulty badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20`, borderColor: difficultyColor }]}>
          <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>{item.difficulty}</Text>
        </View>

        {/* Metrics - TodaysWorkoutCard style */}
        <View style={[styles.metricsContainer, {
          backgroundColor: `${item.color}08`,
          borderColor: `${item.color}15`,
        }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: item.color }]}>{item.exercises}</Text>
            <Text style={styles.metricLabel}>exercises</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: `${item.color}25` }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: item.color }]}>{item.duration}</Text>
            <Text style={styles.metricLabel}>min</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: `${item.color}25` }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNum, { color: item.color }]}>{item.calories}</Text>
            <Text style={styles.metricLabel}>kcal</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function MyWorkouts({
  workouts = MOCK_MY_WORKOUTS,
  onSelectWorkout = () => {},
  onWorkoutOptions = () => {},
}) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>My Workouts</Text>
        <Pressable style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#A3E635" />
        </Pressable>
      </View>
      
      <FlatList
        data={workouts}
        renderItem={({ item }) => (
          <WorkoutCardItem
            item={item}
            onPress={() => onSelectWorkout(item.id)}
            onOptions={onWorkoutOptions}
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
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#A3E635",
    fontWeight: "600",
  },
  listContentContainer: {
    paddingRight: PADDING_HORIZONTAL * 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN_RIGHT,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    overflow: 'hidden',
    // Shadow matching other components
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  colorAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  workoutName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricNum: {
    fontWeight: "800",
    fontSize: 16,
  },
  metricLabel: {
    color: "#A1A1AA",
    fontSize: 11,
    fontWeight: "500",
  },
  metricDivider: {
    width: 1,
    height: 16,
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 9,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressCount: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    position: 'relative',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 9,
    color: "#666",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
