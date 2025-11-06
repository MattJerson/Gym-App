import {
  View,
  Text,
  Alert,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../services/supabase";
import { useState, useEffect, useMemo } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import NotificationBar from "../../components/NotificationBar";
import ActivityRow from "../../components/activity/ActivityRow";
import { ActivityLogDataService } from "../../services/ActivityLogDataService";

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
    {
      id: "nutrition",
      label: "Nutrition",
      icon: "restaurant",
      color: "#288477",
    },
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const activityData = await ActivityLogDataService.fetchAllActivities(
        userId
      );
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
      filtered = filtered.filter(
        (activity) => activity.type === selectedFilter
      );
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
        filtered = filtered.filter(
          (activity) => new Date(activity.timestamp) >= filterDate
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
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
    filteredActivities.forEach((activity) => {
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
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getSelectedFilterLabel = () => {
    const filter = filterOptions.find((f) => f.id === selectedFilter);
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
        {(selectedFilter !== "all" ||
          selectedTimeRange !== "all" ||
          searchQuery.length > 0) && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFilters}>
                {selectedFilter !== "all" && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>
                      {getSelectedFilterLabel()}
                    </Text>
                    <Pressable onPress={() => setSelectedFilter("all")}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
                {selectedTimeRange !== "all" && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>
                      {
                        timeRangeOptions.find((t) => t.id === selectedTimeRange)
                          ?.label
                      }
                    </Text>
                    <Pressable onPress={() => setSelectedTimeRange("all")}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
                <Pressable
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
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
                {filteredActivities.filter((a) => a.type === "workout").length}
              </Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {
                  filteredActivities.filter((a) => a.type === "nutrition")
                    .length
                }
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
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Start using the app to see your activity history"}
                </Text>
              </View>
            ) : (
              Object.entries(groupedActivities).map(
                ([dateKey, dayActivities]) => (
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
                        }}
                      />
                    ))}
                  </View>
                )
              )
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
                {filterOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.filterOption,
                      selectedFilter === option.id &&
                        styles.selectedFilterOption,
                    ]}
                    onPress={() => setSelectedFilter(option.id)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={
                        selectedFilter === option.id ? "#fff" : option.color
                      }
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedFilter === option.id &&
                          styles.selectedFilterOptionText,
                      ]}
                    >
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
                {timeRangeOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.timeRangeOption,
                      selectedTimeRange === option.id &&
                        styles.selectedTimeRangeOption,
                    ]}
                    onPress={() => setSelectedTimeRange(option.id)}
                  >
                    <Text
                      style={[
                        styles.timeRangeOptionText,
                        selectedTimeRange === option.id &&
                          styles.selectedTimeRangeOptionText,
                      ]}
                    >
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
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
  searchContainer: {
    gap: 12,
    marginBottom: 16,
    flexDirection: "row",
  },
  searchInputContainer: {
    flex: 1,
    gap: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#fff",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  activeFiltersContainer: {
    marginBottom: 16,
  },
  activeFilters: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    gap: 6,
    borderRadius: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(116, 185, 255, 0.2)",
  },
  filterChipText: {
    fontSize: 12,
    color: "#74b9ff",
    fontWeight: "600",
  },
  clearFiltersButton: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  statsCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  statsTitle: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
    marginBottom: 3,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
    color: "#fff",
  },
  activitiesContainer: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "center",
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayHeader: {
    fontSize: 11,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  filterModal: {
    padding: 20,
    maxHeight: "80%",
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#161616",
  },
  modalHeader: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    marginBottom: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  filterGrid: {
    gap: 8,
  },
  filterOption: {
    gap: 12,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedFilterOption: {
    borderWidth: 1,
    borderColor: "#74b9ff",
    backgroundColor: "rgba(116, 185, 255, 0.2)",
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
    gap: 8,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  timeRangeOption: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedTimeRangeOption: {
    borderWidth: 1,
    borderColor: "#74b9ff",
    backgroundColor: "rgba(116, 185, 255, 0.2)",
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
    gap: 12,
    marginTop: 24,
    flexDirection: "row",
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  clearButtonText: {
    fontSize: 16,
    color: "#aaa",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#74b9ff",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
});
