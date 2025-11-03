import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

export default function ExerciseDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [exercise, setExercise] = useState(null);

  useEffect(() => {
    // Parse the exercise data from params
    if (params.exerciseData) {
      try {
        const parsed = JSON.parse(params.exerciseData);
        setExercise(parsed);
      } catch (error) {
        console.error("Error parsing exercise data:", error);
      }
    }
  }, [params.exerciseData]); // Only re-run when exerciseData changes

  // Function to capitalize each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!exercise) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const exerciseName = capitalizeWords(exercise.name || 'Unknown Exercise');
  const exerciseGif = exercise.gif_url;
  const exerciseDescription = exercise.description || '';
  const exerciseInstructions = exercise.instructions || [];
  const exerciseMetValue = exercise.met_value || 5;
  
  // Handle target_muscles
  let targetMuscles = '';
  if (exercise.target_muscles) {
    if (Array.isArray(exercise.target_muscles)) {
      targetMuscles = exercise.target_muscles
        .map(tm => {
          if (typeof tm === 'string') return tm;
          if (tm.muscle?.name) return tm.muscle.name;
          if (tm.name) return tm.name;
          return '';
        })
        .filter(Boolean)
        .join(', ');
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exerciseName}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise GIF - Full size and playing */}
        {exerciseGif && (
          <View style={styles.gifContainer}>
            <Image
              source={{ uri: exerciseGif }}
              style={styles.gif}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Description */}
        {exerciseDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>{exerciseDescription}</Text>
          </View>
        )}

        {/* Instructions */}
        {exerciseInstructions && exerciseInstructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {exerciseInstructions.map((instruction, idx) => (
              <View key={idx} style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>{idx + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Additional Info Grid */}
        <View style={styles.infoGrid}>
          {targetMuscles && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Target Muscles</Text>
              <Text style={styles.infoValue}>{targetMuscles}</Text>
            </View>
          )}
          {exercise.body_parts && exercise.body_parts.length > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Body Parts</Text>
              <Text style={styles.infoValue}>
                {exercise.body_parts.join(', ')}
              </Text>
            </View>
          )}
          {exercise.equipments && exercise.equipments.length > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Equipment</Text>
              <Text style={styles.infoValue}>
                {exercise.equipments.join(', ')}
              </Text>
            </View>
          )}
          {exerciseMetValue && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Intensity</Text>
              <Text style={styles.infoValue}>{exerciseMetValue} MET</Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={18} color="#74B9FF" />
            <Text style={styles.tipText}>
              Keep proper form throughout the movement
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={18} color="#74B9FF" />
            <Text style={styles.tipText}>
              Control the weight on both eccentric and concentric phases
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={18} color="#74B9FF" />
            <Text style={styles.tipText}>
              Focus on the target muscles during each rep
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#0B0B0B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(116, 185, 255, 0.2)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "rgba(116, 185, 255, 0.3)",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: "#FAFAFA",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#A1A1AA",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  gifContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
  },
  gif: {
    width: "100%",
    height: "100%",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#74B9FF",
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: "#D4D4D8",
    lineHeight: 22,
    fontWeight: "500",
  },
  instructionRow: {
    flexDirection: "row",
    marginBottom: 12,
    paddingRight: 8,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1E3A5F",
    color: "#FAFAFA",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
    marginRight: 12,
    flexShrink: 0,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: "#D4D4D8",
    lineHeight: 22,
    fontWeight: "500",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  infoItem: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717A",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAFAFA",
    textTransform: "capitalize",
  },
  tipCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "rgba(30, 58, 95, 0.2)",
    borderLeftWidth: 3,
    borderLeftColor: "#74B9FF",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#D4D4D8",
    lineHeight: 20,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 40,
  },
});
