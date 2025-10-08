import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import NotificationBar from "../../components/NotificationBar";
import ActivityRow from "../../components/activity/ActivityRow";
import { ActivityLogDataService } from "../../services/ActivityLogDataService";
import { supabase } from "../../services/supabase";

export default function ActivityLog() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State management
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(params.filter || "all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [userId, setUserId] = useState(null);

  // Filter options - simplified to just workout and nutrition
  const filterOptions = [
    { id: "all", label: "All Activity", icon: "apps", color: "#1e3a5f" },
    { id: "workout", label: "Workouts", icon: "fitness", color: "#015f7b" },
    { id: "nutrition", label: "Nutrition", icon: "restaurant", color: "#288477" },
  ];

  const timeRangeOptions = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "3months", label: "Last 3 Months" },
  ];

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Load data when user ID is available
  useEffect(() => {
    if (userId) {
      loadActivityData();
    }
  }, [userId]);

  // Apply URL filter if present
  useEffect(() => {
    if (params.filter && params.filter !== selectedFilter) {
      setSelectedFilter(params.filter);
    }
  }, [params.filter]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery, selectedFilter, selectedTimeRange]);

  const loadActivityData = async () => {
    try {
      setIsLoading(true);
      const activityData = await ActivityLogDataService.fetchAllActivities(userId);
      setActivities(activityData);
    } catch (error) {
      console.error("Error loading activity data:", error);
      Alert.alert("Error", "Failed to load activity data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by type
    if (selectedFilter !== "all") {
      filtered = filtered.filter(activity => activity.type === selectedFilter);
    }

    // Filter by time range
    if (selectedTimeRange !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (selectedTimeRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      if (selectedTimeRange !== "all") {
        filtered = filtered.filter(activity => 
          new Date(activity.timestamp) >= filterDate
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.category?.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (activity) => {
    if (activity.type === "workout") {
      return "fitness";
    } else if (activity.type === "nutrition") {
      return "restaurant";
    }
    return "ellipse";
  };

  const getActivityColor = (activity) => {
    switch (activity.type) {
      case "workout":
        return activity.metadata?.gradient || ["#015f7b", "#1e3a5f"];
      case "nutrition":
        return ["#288477", "#00c6ac"];
      case "calendar":
        return ["#00c6ac", "#b9e3e6"];
      case "progress":
        return ["#1e3a5f", "#015f7b"];
      default:
        return ["#666", "#999"];
    }
  };

  const groupedActivities = useMemo(() => {
    const groups = {};
    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    return groups;
  }, [filteredActivities]);

  const formatDateHeader = (dateKey) => {
    const date = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getSelectedFilterLabel = () => {
    const filter = filterOptions.find(f => f.id === selectedFilter);
    return filter?.label || "All Activity";
  };

  const clearFilters = () => {
    setSelectedFilter("all");
    setSelectedTimeRange("all");
    setSearchQuery("");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerText}>Activity Log</Text>
          </View>
          <NotificationBar notifications={notifications} />
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </Pressable>
            )}
          </View>
          
          <Pressable 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="filter-list" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Active Filters */}
        {(selectedFilter !== "all" || selectedTimeRange !== "all" || searchQuery.length > 0) && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFilters}>
                {selectedFilter !== "all" && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>{getSelectedFilterLabel()}</Text>
                    <Pressable onPress={() => setSelectedFilter("all")}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
                {selectedTimeRange !== "all" && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>
                      {timeRangeOptions.find(t => t.id === selectedTimeRange)?.label}
                    </Text>
                    <Pressable onPress={() => setSelectedTimeRange("all")}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
                <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Activity Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{filteredActivities.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {filteredActivities.filter(a => a.type === "workout").length}
              </Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {filteredActivities.filter(a => a.type === "nutrition").length}
              </Text>
              <Text style={styles.statLabel}>Meals</Text>
            </View>
          </View>
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#74b9ff" />
            <Text style={styles.loadingText}>Loading activity data...</Text>
          </View>
        ) : (
          /* Activity List */
          <View style={styles.activitiesContainer}>
            {Object.keys(groupedActivities).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#666" />
                <Text style={styles.emptyTitle}>No activities found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? "Try adjusting your search or filters" : "Start using the app to see your activity history"}
                </Text>
              </View>
            ) : (
              Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
                <View key={dateKey} style={styles.dayGroup}>
                  <Text style={styles.dayHeader}>
                    {formatDateHeader(dateKey)}
                  </Text>
                  
                  {dayActivities.map((activity) => (
                    <ActivityRow 
                      key={activity.id} 
                      activity={activity}
                      onPress={() => {
                        // Handle activity press if needed
                        console.log('Activity pressed:', activity.id);
                      }}
                    />
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Activities</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Activity Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Activity Type</Text>
              <View style={styles.filterGrid}>
                {filterOptions.map(option => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.filterOption,
                      selectedFilter === option.id && styles.selectedFilterOption
                    ]}
                    onPress={() => setSelectedFilter(option.id)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={selectedFilter === option.id ? "#fff" : option.color}
                    />
                    <Text style={[
                      styles.filterOptionText,
                      selectedFilter === option.id && styles.selectedFilterOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Time Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Time Range</Text>
              <View style={styles.timeRangeGrid}>
                {timeRangeOptions.map(option => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.timeRangeOption,
                      selectedTimeRange === option.id && styles.selectedTimeRangeOption
                    ]}
                    onPress={() => setSelectedTimeRange(option.id)}
                  >
                    <Text style={[
                      styles.timeRangeOptionText,
                      selectedTimeRange === option.id && styles.selectedTimeRangeOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </Pressable>
              <Pressable 
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: "#fff",
    fontSize: 15,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFiltersContainer: {
    marginBottom: 16,
  },
  activeFilters: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(116, 185, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterChipText: {
    color: "#74b9ff",
    fontSize: 12,
    fontWeight: "600",
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
  },
  clearFiltersText: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "500",
  },
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  statsTitle: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.7,
  },
  activitiesContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayHeader: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterGrid: {
    gap: 8,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  selectedFilterOption: {
    backgroundColor: "rgba(116, 185, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#74b9ff",
  },
  filterOptionText: {
    fontSize: 15,
    color: "#ccc",
    fontWeight: "500",
  },
  selectedFilterOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
  timeRangeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeRangeOption: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectedTimeRangeOption: {
    backgroundColor: "rgba(116, 185, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#74b9ff",
  },
  timeRangeOptionText: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "500",
  },
  selectedTimeRangeOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#74b9ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
});
