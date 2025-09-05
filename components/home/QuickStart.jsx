import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function QuickStart({ categories = [] }) {
  // Default categories if none provided
  const defaultCategories = [
    {
      id: 1,
      title: "Push Day",
      subtitle: "Chest, Shoulders, Triceps",
      gradient: ["#FF6B6B", "#4ECDC4"],
      icon: "fitness",
      difficulty: "Intermediate",
    },
    {
      id: 2,
      title: "Cardio Blast", 
      subtitle: "HIIT Training Session",
      gradient: ["#A8E6CF", "#88D8C0"],
      icon: "flash",
      difficulty: "Beginner",
    },
    {
      id: 3,
      title: "Full Body",
      subtitle: "Complete Workout",
      gradient: ["#FFD93D", "#6BCF7F"],
      icon: "body",
      difficulty: "Advanced",
    },
  ];

  const workoutCategories = categories.length > 0 ? categories : defaultCategories;
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    // Set random category as today's recommendation
    setSelectedCategory(workoutCategories[Math.floor(Math.random() * workoutCategories.length)]);
  }, [workoutCategories]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Start</Text>
      
      <View style={styles.row}>
        {/* Start Workout */}
        <Pressable 
          style={styles.cardContainer} 
          onPress={() => {}}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          <LinearGradient
            colors={selectedCategory ? selectedCategory.gradient : ["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.textSection}>
                <Text style={styles.categoryLabel}>START</Text>
                <Text style={styles.difficultyBadge}>{selectedCategory?.difficulty || "Intermediate"}</Text>
              </View>
              
              {/* Background Icon */}
              <View style={styles.backgroundIconContainer}>
                <Ionicons
                  name={selectedCategory?.icon || "fitness"}
                  size={80}
                  color="rgba(255,255,255,0.15)"
                />
              </View>
              
              {/* Bottom Text */}
              <View style={styles.bottomTextSection}>
                <Text style={styles.title}>{selectedCategory?.title || "Workout"}</Text>
                <Text style={styles.subtitle}>{selectedCategory?.subtitle || "Loading..."}</Text>
              </View>
            </View>
            
            <View style={styles.bottomAccent} />
          </LinearGradient>
        </Pressable>

        {/* Browse Categories */}
        <Pressable 
          style={styles.cardContainer} 
          onPress={() => {}}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          <LinearGradient
            colors={["#a8edea", "#fed6e3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.textSection}>
                <Text style={styles.categoryLabel}>BROWSE</Text>
                <Text style={styles.difficultyBadge}>{workoutCategories.length} Options</Text>
              </View>
              
              {/* Background Icon */}
              <View style={styles.backgroundIconContainer}>
                <Ionicons
                  name="library"
                  size={80}
                  color="rgba(255,255,255,0.15)"
                />
              </View>
              
              {/* Bottom Text */}
              <View style={styles.bottomTextSection}>
                <Text style={styles.title}>All Workouts</Text>
                <Text style={styles.subtitle}>Browse Categories</Text>
              </View>
            </View>
            
            <View style={styles.bottomAccent} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  gradient: {
    flex: 1,
    minHeight: 140,
    position: "relative",
  },
  cardContent: {
    flex: 1,
    padding: 20,
    position: "relative",
    justifyContent: "space-between",
  },
  textSection: {
    alignItems: "flex-start",
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  difficultyBadge: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  backgroundIconContainer: {
    position: "absolute",
    top: "50%",
    right: 20,
    transform: [{ translateY: -40 }],
    zIndex: 1,
  },
  bottomTextSection: {
    alignItems: "flex-start",
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  iconContainer: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
