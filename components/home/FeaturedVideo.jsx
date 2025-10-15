import { View, Text, Image, StyleSheet, Pressable, Alert, Linking } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { HomeDataService } from "../../services/HomeDataService";

export default function FeaturedVideo({
  id = null,
  thumbnail = "https://placehold.co/400x225/3498db/ffffff?text=Featured+Content",
  title = "5 Science-Backed Ways to Build Better Habits",
  subtitle = "Discover the psychology behind habit formation and learn practical strategies to create lasting positive changes in your daily routine.",
  duration = "8:42",
  category = "Personal Growth",
  author = "Dr. Sarah Johnson",
  views = "2.4M",
  youtubeUrl = null,
  articleUrl = null,
  ebookUrl = null,
  contentType = "video",
}) {

  const handleContentAction = async () => {
    try {
      // Increment view count if we have an ID
      if (id) {
        await HomeDataService.incrementFeaturedViews(id);
      }

      let targetUrl = null;
      let errorMessage = "Cannot open link";
      
      // Determine target URL based on content type
      if (contentType === 'video' && youtubeUrl) {
        targetUrl = youtubeUrl;
        errorMessage = "Cannot open YouTube link";
      } else if (contentType === 'article' && articleUrl) {
        targetUrl = articleUrl;
        errorMessage = "Cannot open article link";
      } else if (contentType === 'ebook' && ebookUrl) {
        targetUrl = ebookUrl;
        errorMessage = "Cannot open eBook link";
      }

      if (targetUrl) {
        const canOpen = await Linking.canOpenURL(targetUrl);
        if (canOpen) {
          await Linking.openURL(targetUrl);
        } else {
          Alert.alert("Error", errorMessage);
        }
      } else {
        Alert.alert(
          "Coming Soon",
          `${contentType === 'video' ? 'Video' : contentType === 'ebook' ? 'eBook' : 'Article'} will be available soon!`
        );
      }
    } catch (error) {
      console.error(`Error opening ${contentType}:`, error);
      Alert.alert("Error", `Failed to open ${contentType}`);
    }
  };

  const getActionLabel = () => {
    switch (contentType) {
      case 'video':
        return 'Watch';
      case 'ebook':
        return 'Download';
      case 'article':
      default:
        return 'Read';
    }
  };

  const getActionIcon = () => {
    switch (contentType) {
      case 'video':
        return 'play-circle';
      case 'ebook':
        return 'download';
      case 'article':
      default:
        return 'document-text';
    }
  };

  const handleCardPress = () => {
    const contentTypeLabel = contentType === 'video' ? 'video' : contentType === 'ebook' ? 'eBook' : 'article';
    const actionLabel = getActionLabel().toLowerCase();
    
    Alert.alert(
      "Featured Content",
      `"${title}"\n\nBy: ${author}\nViews: ${views}\n${duration ? `Duration: ${duration}\n` : ''}Category: ${category}\n\nWould you like to ${actionLabel} this ${contentTypeLabel}?`,
      [
        {
          text: "Not Now",
          style: "cancel"
        },
        {
          text: getActionLabel(),
          onPress: handleContentAction
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Featured Content</Text>
      
      <Pressable 
        style={styles.card}
        android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        onPress={handleCardPress}
      >
        {/* Video Thumbnail Container */}
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          
          {/* Play Button Overlay */}
          <Pressable 
            style={styles.playButtonOverlay}
            onPress={handleContentAction}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)']}
              style={styles.playButtonGradient}
            >
              <View style={styles.playButton}>
                <Ionicons 
                  name={getActionIcon()} 
                  size={24} 
                  color="#000" 
                />
              </View>
            </LinearGradient>
          </Pressable>
          
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
            <Pressable 
              style={styles.primaryButton}
              onPress={handleContentAction}
            >
              <Ionicons 
                name={getActionIcon()} 
                size={18} 
                color="#fff" 
              />
              <Text style={styles.primaryButtonText}>
                {getActionLabel()} Now
              </Text>
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
});
