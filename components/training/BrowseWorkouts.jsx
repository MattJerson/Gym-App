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

// Category Card Component - cleaner design matching MyWorkouts style
const CategoryCardItem = ({ item, onPress }) => {
  // Map database image_url to local images (fallback to image1)
  const getImageSource = (imageUrl) => {
    if (!imageUrl) return WORKOUT_IMAGES.image1;
    
    // If using Unsplash URLs from seed data, map to local images
    if (imageUrl.includes('photo-1583454110551')) return WORKOUT_IMAGES.image1; // Strength
    if (imageUrl.includes('photo-1476480862126')) return WORKOUT_IMAGES.image2; // Cardio
    if (imageUrl.includes('photo-1552196563')) return WORKOUT_IMAGES.image3; // Endurance
    if (imageUrl.includes('photo-1544367567')) return WORKOUT_IMAGES.image4; // Flexibility
    if (imageUrl.includes('photo-1549060279')) return WORKOUT_IMAGES.image5; // HIIT
    if (imageUrl.includes('photo-1571019613454')) return WORKOUT_IMAGES.image1; // Functional
    
    return WORKOUT_IMAGES.image1; // Default fallback
  };

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
        
        {/* Workout image - background layer */}
        <Image 
          source={getImageSource(item.image_url)}
          style={styles.workoutImage}
          resizeMode="cover"
        />
        
        {/* Gradient overlay for readability */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.5)',   // 50% at top
            'rgba(0, 0, 0, 0.3)',   // 30% in middle
            'rgba(0, 0, 0, 0)',     // 0% at bottom
          ]}
          style={styles.gradientOverlay}
          locations={[0, 0.5, 1]}
        />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Icon badge with emoji */}
          <View style={[styles.iconBadge, { backgroundColor: `${item.color}20` }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
          
          {/* Category info */}
          <View style={styles.infoContainer}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {item.name.toUpperCase()}
            </Text>
            <Text style={styles.workoutCount}>{item.workout_count} workouts</Text>
          </View>

          {/* Arrow button */}
          <View style={[styles.arrowButton, { backgroundColor: `${item.color}30` }]}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function BrowseWorkouts({
  categories = [],
  onSelectCategory = () => {},
}) {
  // If no categories, show empty state
  if (!categories || categories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Browse Workouts</Text>
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No workout categories available</Text>
        </View>
      </View>
    );
  }

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
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
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
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    zIndex: 3,
  },
  workoutImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.4,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    zIndex: 2,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  emoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  workoutCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
