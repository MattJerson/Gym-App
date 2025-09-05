import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function FeaturedVideo({
  thumbnail = "https://placehold.co/400x225/3498db/ffffff?text=Featured+Video",
  title = "5 Science-Backed Ways to Build Better Habits",
  subtitle = "Discover the psychology behind habit formation and learn practical strategies to create lasting positive changes in your daily routine.",
  duration = "8:42",
  category = "Personal Growth",
  author = "Dr. Sarah Johnson",
  views = "2.4M",
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Featured Content</Text>
      
      <Pressable 
        style={styles.card}
        android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        onPress={() => {}}
      >
        {/* Video Thumbnail Container */}
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          
          {/* Play Button Overlay */}
          <View style={styles.playButtonOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)']}
              style={styles.playButtonGradient}
            >
              <View style={styles.playButton}>
                <Ionicons name="play" size={24} color="#000" />
              </View>
            </LinearGradient>
          </View>
          
          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
          
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.authorContainer}>
              <MaterialIcons name="person" size={14} color="#007AFF" />
              <Text style={styles.authorText}>{author}</Text>
            </View>
            <View style={styles.viewsContainer}>
              <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.viewsText}>{views} views</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{subtitle}</Text>
          
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryButton}>
              <Ionicons name="play-circle" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Watch Now</Text>
            </Pressable>
            
            <Pressable style={styles.secondaryButton}>
              <Ionicons name="bookmark-outline" size={16} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
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
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  thumbnailContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  durationBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  contentContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  authorText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewsText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 26,
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
