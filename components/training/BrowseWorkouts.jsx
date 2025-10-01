import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Get screen dimensions
const { width } = Dimensions.get("window");

// Card dimensions
const PADDING_HORIZONTAL = 20;
const CARD_MARGIN_RIGHT = 12;
const VISIBLE_CARDS = 2.2;

const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - CARD_MARGIN_RIGHT) / VISIBLE_CARDS;
const CARD_HEIGHT = 220;

// Import workout images at top level
const WORKOUT_IMAGES = {
  image1: require("../../assets/browseworkout1.jpg"),
  image2: require("../../assets/browseworkout2.jpg"),
  image3: require("../../assets/browseworkout3.jpg"),
  image4: require("../../assets/browseworkout4.jpg"),
  image5: require("../../assets/browseworkout5.jpg"),
};

const MOCK_CATEGORIES = [
  {
    id: "strength",
    name: "STRENGTH",
    emoji: "💪",
    description: "Build muscle & power",
    workoutCount: 24,
    color: "#B8F34A",
    image: WORKOUT_IMAGES.image1
  },
  {
    id: "cardio",
    name: "CARDIO",
    emoji: "🏃",
    description: "Boost endurance & burn",
    workoutCount: 18,
    color: "#FF6B6B",
    image: WORKOUT_IMAGES.image2
  },
  {
    id: "endurance",
    name: "ENDURANCE",
    emoji: "⚡",
    description: "Increase stamina",
    workoutCount: 15,
    color: "#60A5FA",
    image: WORKOUT_IMAGES.image3
  },
  {
    id: "flexibility",
    name: "FLEXIBILITY",
    emoji: "🧘",
    description: "Stretch & recover",
    workoutCount: 12,
    color: "#A78BFA",
    image: WORKOUT_IMAGES.image4
  },
  {
    id: "hiit",
    name: "HIIT",
    emoji: "🔥",
    description: "High intensity training",
    workoutCount: 20,
    color: "#FBBF24",
    image: WORKOUT_IMAGES.image5
  },
  {
    id: "functional",
    name: "FUNCTIONAL",
    emoji: "🎯",
    description: "Real-world fitness",
    workoutCount: 16,
    color: "#34D399",
    image: WORKOUT_IMAGES.image1
  }
];

// Category Card Component - with gradient opacity image
const CategoryCardItem = ({ item, onPress }) => {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]} 
      onPress={onPress}
    >
      <View style={[styles.cardInner, { backgroundColor: item.color }]}>
        {/* Workout image - full card */}
        <Image 
          source={item.image}
          style={styles.workoutImage}
          resizeMode="cover"
        />
        
        {/* Gradient overlay - 70% opacity at top, 0% at bottom */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.7)',   // 70% opacity at top
            'rgba(0, 0, 0, 0.5)',   // 50% opacity in middle
            'rgba(0, 0, 0, 0.2)',   // 20% opacity
            'rgba(0, 0, 0, 0)',     // 0% opacity at bottom
          ]}
          style={styles.gradientOverlay}
          locations={[0, 0.4, 0.7, 1]}
        />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Large emoji */}
          <Text style={styles.emojiLarge}>{item.emoji}</Text>
          
          {/* Category name (supports 2 lines) */}
          <View style={styles.nameWrapper}>
            <Text 
              style={styles.categoryName}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>
        </View>

        {/* Arrow - absolute positioned at bottom right */}
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
};

export default function BrowseWorkouts({
  categories = MOCK_CATEGORIES,
  onSelectCategory = () => {},
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Workouts</Text>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <CategoryCardItem
            item={item}
            onPress={() => onSelectCategory(item.id)}
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
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.3,
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
    transform: [{ scale: 0.96 }],
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16,
    elevation: 12,
  },
  workoutImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.6, // 60% base opacity for the image itself
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 10,
    justifyContent: "space-between",
    zIndex: 2,
  },
  emojiLarge: {
    fontSize: 56,
    lineHeight: 60,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  nameWrapper: {
    minHeight: 50,
    justifyContent: "center",
    paddingRight: 10,
    flexShrink: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: 28,
    textAlign: "left",
  },
  arrowContainer: {
    position: "absolute",
    bottom: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
});
