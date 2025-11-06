import {
  View,
  Text,
  Alert,
  Modal,
  Animated,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../../services/supabase";
import React, { useState, useEffect, useRef } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import FoodItemCard from "../../components/mealplan/FoodItemCard";
import { MealPlanDataService } from "../../services/MealPlanDataService";
import { AddFoodPageSkeleton } from "../../components/skeletons/AddFoodPageSkeleton";

export default function AddFood() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mealType = "breakfast", editMode = false, logId, foodData } = params;

  // Parse foodData if in edit mode
  const existingFood = editMode && foodData ? JSON.parse(foodData) : null;

  // 🔄 State management
  const [activeTab, setActiveTab] = useState("all"); // "all" or "logs"
  const [searchQuery, setSearchQuery] = useState("");
  const [popularFoods, setPopularFoods] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDietary, setSelectedDietary] = useState([]);

  // Animation values
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(1)).current;

  // Get current user ID
  const [userId, setUserId] = useState(null);

  // Meal type configuration
  const mealTypeConfig = {
    breakfast: { icon: "free-breakfast", color: "#FF9500", name: "Breakfast" },
    lunch: { icon: "restaurant", color: "#34C759", name: "Lunch" },
    dinner: { icon: "dinner-dining", color: "#007AFF", name: "Dinner" },
    snack: { icon: "local-cafe", color: "#AF52DE", name: "Snack" },
  };

  const currentMeal = mealTypeConfig[mealType] || mealTypeConfig.breakfast;

  // Food category filters (based on FoodData Central API categories)
  const categoryFilters = [
    { id: "all", label: "All Foods", icon: "restaurant", color: "#4ecdc4" },
    { id: "protein", label: "Protein", icon: "nutrition", color: "#e74c3c" },
    { id: "dairy", label: "Dairy", icon: "water", color: "#3498db" },
    { id: "vegetables", label: "Vegetables", icon: "leaf", color: "#2ecc71" },
    { id: "fruits", label: "Fruits", icon: "apple", color: "#e67e22" },
    { id: "grains", label: "Grains", icon: "pizza", color: "#f39c12" },
    { id: "snacks", label: "Snacks", icon: "fast-food", color: "#9b59b6" },
  ];

  // Dietary preference filters
  const dietaryFilters = [
    { id: "gluten-free", label: "Gluten-Free", icon: "remove-circle" },
    { id: "dairy-free", label: "Dairy-Free", icon: "water-outline" },
    { id: "vegan", label: "Vegan", icon: "leaf-outline" },
    { id: "vegetarian", label: "Vegetarian", icon: "restaurant-outline" },
    { id: "keto", label: "Keto", icon: "fitness-outline" },
    { id: "low-carb", label: "Low-Carb", icon: "barbell-outline" },
  ];

  // Filter foods based on selected filters
  const filterFoods = (foodsArray) => {
    return foodsArray.filter((food) => {
      // Category filter
      if (selectedCategory !== "all") {
        const category = food.category?.toLowerCase() || "";
        const foodName = food.name?.toLowerCase() || "";

        // Map categories to food keywords
        const categoryMatch = {
          protein: [
            "meat",
            "chicken",
            "beef",
            "pork",
            "fish",
            "salmon",
            "tuna",
            "egg",
            "protein",
          ],
          dairy: ["milk", "cheese", "yogurt", "butter", "cream", "dairy"],
          vegetables: [
            "vegetable",
            "lettuce",
            "tomato",
            "carrot",
            "broccoli",
            "spinach",
            "kale",
          ],
          fruits: [
            "fruit",
            "apple",
            "banana",
            "orange",
            "berry",
            "strawberry",
            "grape",
          ],
          grains: ["bread", "rice", "pasta", "cereal", "grain", "oat", "wheat"],
          snacks: ["snack", "chip", "cookie", "candy", "bar", "popcorn"],
        };

        const keywords = categoryMatch[selectedCategory] || [];
        const matches = keywords.some(
          (keyword) => category.includes(keyword) || foodName.includes(keyword)
        );

        if (!matches) return false;
      }

      // Dietary filters (can select multiple)
      if (selectedDietary.length > 0) {
        const foodName = food.name?.toLowerCase() || "";
        const category = food.category?.toLowerCase() || "";

        // Check if food matches any selected dietary preference
        const dietaryMatch = selectedDietary.every((dietary) => {
          const dietaryKeywords = {
            "gluten-free": { avoid: ["wheat", "gluten", "bread", "pasta"] },
            "dairy-free": {
              avoid: ["milk", "cheese", "yogurt", "butter", "cream", "dairy"],
            },
            vegan: {
              avoid: [
                "meat",
                "chicken",
                "beef",
                "pork",
                "fish",
                "egg",
                "dairy",
                "milk",
                "cheese",
              ],
            },
            vegetarian: { avoid: ["meat", "chicken", "beef", "pork", "fish"] },
            keto: { prefer: ["protein", "fat"], high: "protein" },
            "low-carb": { high: "carbs" },
          };

          const criteria = dietaryKeywords[dietary];
          if (!criteria) return true;

          // Check avoid keywords
          if (criteria.avoid) {
            return !criteria.avoid.some(
              (keyword) =>
                foodName.includes(keyword) || category.includes(keyword)
            );
          }

          // Check macros for keto/low-carb
          if (dietary === "keto" && food.carbs > 10) return false;
          if (dietary === "low-carb" && food.carbs > 20) return false;

          return true;
        });

        if (!dietaryMatch) return false;
      }

      return true;
    });
  };

  const toggleDietary = (id) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedDietary([]);
  };

  const hasActiveFilters =
    selectedCategory !== "all" || selectedDietary.length > 0;

  // Get user session on mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Auto-open edit modal if in edit mode
  useEffect(() => {
    if (editMode && existingFood) {
      setSelectedFood({
        id: existingFood.fdcId,
        fdc_id: existingFood.fdcId,
        name: existingFood.name,
        brand_name: existingFood.brand,
        calories: existingFood.calories,
        protein: existingFood.protein,
        carbs: existingFood.carbs,
        fats: existingFood.fats,
        serving_size: existingFood.servingSize,
        serving_unit: existingFood.servingUnit,
        source: "edit",
      });
      setQuantity(existingFood.quantity?.toString() || "1");
      setShowQuantityModal(true);
    }
  }, [editMode, existingFood]);

  // Load initial data when user is ready
  useEffect(() => {
    if (userId) {
      loadInitialData();
    }
  }, [userId, activeTab]);

  // Search debouncing
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      const debounceTimer = setTimeout(() => {
        searchFoodsFromAPI();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setCurrentPage(1);
      setTotalPages(1);
      setIsSearching(false);
    }
  }, [searchQuery]);

  /**
   * Load data based on active tab
   */
  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      if (activeTab === "all") {
        const [popular, recent] = await Promise.all([
          MealPlanDataService.getPopularFoods(10),
          MealPlanDataService.getUserRecentFoods(userId, 10),
        ]);
        setPopularFoods(popular);
        setRecentFoods(recent);
      } else {
        // Load user's previous logs
        const logs = await MealPlanDataService.getMealLogsForDate(
          userId,
          new Date()
        );
        setUserLogs(logs);
      }
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      Alert.alert("Error", "Failed to load food data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search foods from FoodData API
   */
  const searchFoodsFromAPI = async (page = 1) => {
    try {
      if (page === 1) {
        setIsSearching(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await MealPlanDataService.searchFoodsAPI(
        searchQuery.trim(),
        12,
        page
      );

      if (page === 1) {
        setSearchResults(result.foods || []);
      } else {
        setSearchResults((prev) => [...prev, ...(result.foods || [])]);
      }

      setCurrentPage(result.currentPage || page);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("❌ Error searching foods:", error);
      Alert.alert("Error", "Failed to search foods. Please try again.");
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  /**
   * Handle food selection (open quantity modal)
   */
  const handleFoodSelect = async (food) => {
    setSelectedFood(food);
    setQuantity("1");
    setShowQuantityModal(true);
  };

  /**
   * Play success animation
   */
  const playSuccessAnimation = () => {
    setShowSuccessAnimation(true);

    // Haptic feedback (like Face ID success)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Reset animation values
    successScale.setValue(0);
    successOpacity.setValue(0);
    checkmarkScale.setValue(0);
    blurOpacity.setValue(1);

    // Blur the background content
    Animated.timing(blurOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate success circle
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After circle appears, animate checkmark
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start(() => {
        // Close modal after a short delay
        setTimeout(() => {
          setShowQuantityModal(false);
          setShowSuccessAnimation(false);
          // Reset animations
          successScale.setValue(0);
          successOpacity.setValue(0);
          checkmarkScale.setValue(0);
          blurOpacity.setValue(1);
          // Navigate back
          router.back();
        }, 600);
      });
    });
  };

  /**
   * Add food with custom quantity
   */
  const handleAddFood = async () => {
    try {
      if (!selectedFood || !quantity) {
        Alert.alert("Invalid Quantity", "Please enter a quantity.");
        return;
      }

      const quantityValue = parseFloat(quantity);

      // If in edit mode, update or delete the existing log
      if (editMode && logId) {
        // If quantity is 0, delete the food entry
        if (quantityValue <= 0) {
          await MealPlanDataService.deleteMealLog(userId, logId);
          playSuccessAnimation();
          return;
        }

        // Otherwise update the quantity
        await MealPlanDataService.updateMealLog(logId, {
          quantity: quantityValue,
          serving_size: selectedFood.serving_size || 100,
        });

        playSuccessAnimation();
        return;
      }

      // Otherwise, add new food
      if (quantityValue <= 0) {
        Alert.alert(
          "Invalid Quantity",
          "Please enter a quantity greater than 0."
        );
        return;
      }

      let foodId = selectedFood.id;

      // If food is from API, cache it in database first
      if (selectedFood.source === "api") {
        const dbFood = await MealPlanDataService.getOrCreateFoodFromAPI(
          selectedFood.fdc_id
        );
        foodId = dbFood.id;
      }

      // Log food to meal (convert mealType to lowercase for database)
      await MealPlanDataService.logFoodToMeal(
        userId,
        mealType.toLowerCase(),
        foodId,
        quantityValue,
        selectedFood.serving_size || 100,
        new Date()
      );

      playSuccessAnimation();
    } catch (error) {
      console.error("❌ Error adding food:", error);
      Alert.alert("Error", "Failed to add food. Please try again.");
    }
  };

  /**
   * Calculate nutrition for modal preview
   */
  const calculateTotalNutrition = () => {
    if (!selectedFood || !quantity) return null;

    const multiplier = parseFloat(quantity) || 1;
    const servingMultiplier =
      (multiplier * (selectedFood.serving_size || 100)) / 100;

    return {
      calories: Math.round(selectedFood.calories * servingMultiplier),
      protein: Math.round(selectedFood.protein * servingMultiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * servingMultiplier * 10) / 10,
      fats: Math.round(selectedFood.fats * servingMultiplier * 10) / 10,
    };
  };

  /**
   * Load more search results
   */
  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      searchFoodsFromAPI(currentPage + 1);
    }
  };

  /**
   * Format food name for display
   */
  const formatFoodName = (name) => {
    if (!name) return "";
    return name
      .split(/(?=[,-])/g)
      .map((part) => {
        const trimmed = part.trim();
        if (!trimmed) return "";
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      })
      .join("");
  };

  /**
   * Render content based on active tab and search
   */
  const renderContent = () => {
    // Show search results if searching
    if (searchQuery.trim().length >= 2) {
      if (isSearching && searchResults.length === 0) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentMeal.color} />
            <Text style={styles.loadingText}>Searching foods...</Text>
          </View>
        );
      }

      if (searchResults.length === 0 && !isSearching) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No foods found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try a different search term
            </Text>
          </View>
        );
      }

      const filteredResults = filterFoods(searchResults);

      return (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <Text style={styles.sectionCount}>{filteredResults.length}</Text>
          </View>

          {filteredResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="filter-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>No foods match filters</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters
              </Text>
            </View>
          ) : (
            <>
              {filteredResults.map((food, index) => (
                <FoodItemCard
                  key={`search-${food.fdc_id}-${index}`}
                  food={food}
                  onPress={handleFoodSelect}
                  mode="default"
                />
              ))}

              {currentPage < totalPages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={currentMeal.color} />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.loadMoreText,
                          { color: currentMeal.color },
                        ]}
                      >
                        Load More
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={currentMeal.color}
                      />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      );
    }

    // Show content based on active tab
    if (activeTab === "all") {
      const filteredRecent = filterFoods(recentFoods);
      const filteredPopular = filterFoods(popularFoods);

      return (
        <>
          {filteredRecent.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Foods</Text>
              </View>
              {filteredRecent.map((food, index) => (
                <FoodItemCard
                  key={`recent-${food.id}-${index}`}
                  food={food}
                  onPress={handleFoodSelect}
                  mode="recent"
                />
              ))}
            </>
          )}

          {filteredPopular.length > 0 && (
            <>
              <View
                style={[
                  styles.sectionHeader,
                  { marginTop: filteredRecent.length > 0 ? 20 : 0 },
                ]}
              >
                <Text style={styles.sectionTitle}>Popular Foods</Text>
                <Text style={styles.sectionSubtitle}>Most logged by users</Text>
              </View>
              {filteredPopular.map((food, index) => (
                <FoodItemCard
                  key={`popular-${food.id}-${index}`}
                  food={food}
                  onPress={handleFoodSelect}
                  mode="default"
                />
              ))}
            </>
          )}

          {filteredRecent.length === 0 &&
            filteredPopular.length === 0 &&
            hasActiveFilters && (
              <View style={styles.emptyState}>
                <Ionicons name="filter-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>
                  No foods match filters
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your filters
                </Text>
              </View>
            )}
        </>
      );
    } else {
      // My Logs tab
      if (userLogs.length === 0) {
        return (
          <View style={styles.emptyState}>
            <MaterialIcons name="restaurant" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No logs yet today</Text>
            <Text style={styles.emptyStateSubtext}>
              Start logging your meals!
            </Text>
          </View>
        );
      }

      return (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Logs</Text>
            <Text style={styles.sectionCount}>{userLogs.length}</Text>
          </View>
          {userLogs.map((log, index) => (
            <FoodItemCard
              key={`log-${log.id}-${index}`}
              food={log.food}
              onPress={handleFoodSelect}
              mode="log"
            />
          ))}
        </>
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AddFoodPageSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Combined Header Row with Back Button and Search */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods... (Try brand names for fast food)"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialIcons
            name="filter-list"
            size={20}
            color={hasActiveFilters ? currentMeal.color : "#888"}
          />
          {hasActiveFilters && (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: currentMeal.color },
              ]}
            >
              <Text style={styles.filterBadgeText}>
                {selectedDietary.length + (selectedCategory !== "all" ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.activeFilters}>
              {selectedCategory !== "all" && (
                <View
                  style={[
                    styles.filterChip,
                    { borderColor: currentMeal.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: currentMeal.color },
                    ]}
                  >
                    {
                      categoryFilters.find((f) => f.id === selectedCategory)
                        ?.label
                    }
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCategory("all")}>
                    <Ionicons
                      name="close"
                      size={14}
                      color={currentMeal.color}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {selectedDietary.map((dietary) => (
                <View
                  key={dietary}
                  style={[
                    styles.filterChip,
                    { borderColor: currentMeal.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: currentMeal.color },
                    ]}
                  >
                    {dietaryFilters.find((f) => f.id === dietary)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => toggleDietary(dietary)}>
                    <Ionicons
                      name="close"
                      size={14}
                      color={currentMeal.color}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "all" && [
              styles.activeTab,
              { borderBottomColor: currentMeal.color },
            ],
          ]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && [
                styles.activeTabText,
                { color: currentMeal.color },
              ],
            ]}
          >
            All Meals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "logs" && [
              styles.activeTab,
              { borderBottomColor: currentMeal.color },
            ],
          ]}
          onPress={() => setActiveTab("logs")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "logs" && [
                styles.activeTabText,
                { color: currentMeal.color },
              ],
            ]}
          >
            My Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentMeal.color} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          renderContent()
        )}
      </ScrollView>

      {/* Quantity Modal */}
      <Modal
        visible={showQuantityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuantityModal(false)}
        >
          <TouchableOpacity
            style={styles.quantityModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? "Edit Food" : "Add Food"}
              </Text>
              <TouchableOpacity onPress={() => setShowQuantityModal(false)}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedFood && (
              <>
                {/* Blurred Content Container */}
                <Animated.View style={{ opacity: blurOpacity }}>
                  {/* Food Details */}
                  <View style={styles.foodDetails}>
                    <Text style={styles.foodDetailName}>
                      {formatFoodName(selectedFood.name)}
                    </Text>
                    {selectedFood.brand && (
                      <Text style={styles.foodDetailBrand}>
                        {selectedFood.brand.charAt(0).toUpperCase() +
                          selectedFood.brand.slice(1).toLowerCase()}
                      </Text>
                    )}
                  </View>

                  {/* Quantity Input */}
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Servings</Text>
                    <View style={styles.quantityInput}>
                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          { backgroundColor: `${currentMeal.color}20` },
                        ]}
                        onPress={() => {
                          const current = parseFloat(quantity) || 0;
                          if (current > 0.5) {
                            setQuantity((current - 0.5).toString());
                          }
                        }}
                      >
                        <Ionicons
                          name="remove"
                          size={18}
                          color={currentMeal.color}
                        />
                      </TouchableOpacity>

                      <TextInput
                        style={styles.quantityTextInput}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                      />

                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          { backgroundColor: `${currentMeal.color}20` },
                        ]}
                        onPress={() => {
                          const current = parseFloat(quantity) || 0;
                          setQuantity((current + 0.5).toString());
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={18}
                          color={currentMeal.color}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.servingSizeText}>
                      {selectedFood.serving_size || 100}
                      {selectedFood.serving_unit || "g"} per serving
                    </Text>
                  </View>

                  {/* Nutrition Preview */}
                  {calculateTotalNutrition() && (
                    <View
                      style={[
                        styles.nutritionPreview,
                        { backgroundColor: `${currentMeal.color}10` },
                      ]}
                    >
                      <Text style={styles.nutritionPreviewTitle}>
                        Total Nutrition
                      </Text>
                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <Text
                            style={[
                              styles.nutritionValue,
                              { color: currentMeal.color },
                            ]}
                          >
                            {calculateTotalNutrition().calories}
                          </Text>
                          <Text style={styles.nutritionLabel}>Calories</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text
                            style={[
                              styles.nutritionValue,
                              { color: currentMeal.color },
                            ]}
                          >
                            {calculateTotalNutrition().protein}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Protein</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text
                            style={[
                              styles.nutritionValue,
                              { color: currentMeal.color },
                            ]}
                          >
                            {calculateTotalNutrition().carbs}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Carbs</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text
                            style={[
                              styles.nutritionValue,
                              { color: currentMeal.color },
                            ]}
                          >
                            {calculateTotalNutrition().fats}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Fats</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Add Button */}
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: currentMeal.color },
                    ]}
                    onPress={handleAddFood}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addButtonText}>
                      {editMode ? "Update Food" : `Add to ${currentMeal.name}`}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Success Animation Overlay */}
                {showSuccessAnimation && (
                  <View style={styles.successOverlay}>
                    <Animated.View
                      style={[
                        styles.successCircle,
                        {
                          opacity: successOpacity,
                          transform: [{ scale: successScale }],
                        },
                      ]}
                    >
                      <Animated.View
                        style={{
                          transform: [{ scale: checkmarkScale }],
                        }}
                      >
                        <Ionicons name="checkmark" size={60} color="#fff" />
                      </Animated.View>
                    </Animated.View>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity
            style={styles.filterModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Foods</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalContent}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Food Category</Text>
                <View style={styles.filterGrid}>
                  {categoryFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.filterOption,
                        selectedCategory === filter.id && [
                          styles.selectedFilterOption,
                          { borderColor: filter.color },
                        ],
                      ]}
                      onPress={() => setSelectedCategory(filter.id)}
                    >
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={
                          selectedCategory === filter.id ? filter.color : "#888"
                        }
                      />
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedCategory === filter.id && [
                            styles.selectedFilterOptionText,
                            { color: filter.color },
                          ],
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dietary Preferences */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Dietary Preferences
                </Text>
                <View style={styles.dietaryGrid}>
                  {dietaryFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.dietaryOption,
                        selectedDietary.includes(filter.id) && [
                          styles.selectedDietaryOption,
                          { borderColor: currentMeal.color },
                        ],
                      ]}
                      onPress={() => toggleDietary(filter.id)}
                    >
                      <Ionicons
                        name={filter.icon}
                        size={16}
                        color={
                          selectedDietary.includes(filter.id)
                            ? currentMeal.color
                            : "#888"
                        }
                      />
                      <Text
                        style={[
                          styles.dietaryOptionText,
                          selectedDietary.includes(filter.id) && [
                            styles.selectedDietaryOptionText,
                            { color: currentMeal.color },
                          ],
                        ]}
                      >
                        {filter.label}
                      </Text>
                      {selectedDietary.includes(filter.id) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={currentMeal.color}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.filterModalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: currentMeal.color },
                ]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
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
  headerRow: {
    gap: 12,
    paddingTop: 60,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  searchBar: {
    gap: 10,
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  filterButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  filterBadge: {
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 10,
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    color: "#000",
    fontWeight: "700",
  },
  activeFiltersContainer: {
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  activeFilters: {
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clearFiltersButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
  },
  tabContainer: {
    gap: 12,
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderBottomWidth: 2,
    alignItems: "center",
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    gap: 12,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 15,
    color: "#888",
  },
  emptyState: {
    gap: 12,
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 17,
    color: "#fff",
    marginTop: 12,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    color: "#888",
  },
  sectionCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  loadMoreButton: {
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  quantityModal: {
    padding: 24,
    maxHeight: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#1a1a1a",
  },
  modalHeader: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },
  foodDetails: {
    marginBottom: 20,
  },
  foodDetailName: {
    fontSize: 17,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "600",
  },
  foodDetailBrand: {
    fontSize: 13,
    color: "#888",
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "600",
  },
  quantityInput: {
    gap: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityTextInput: {
    minWidth: 70,
    fontSize: 17,
    color: "#fff",
    borderWidth: 1,
    borderRadius: 10,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  servingSizeText: {
    fontSize: 12,
    marginTop: 8,
    color: "#888",
    textAlign: "center",
  },
  nutritionPreview: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 20,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  nutritionPreviewTitle: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 17,
    marginBottom: 4,
    fontWeight: "800",
  },
  nutritionLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
  },
  addButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  successOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    shadowColor: "#34C759",
    justifyContent: "center",
    backgroundColor: "#34C759", // iOS green success color
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 16,
    shadowRadius: 16,
    shadowOpacity: 0.5,
  },
  filterModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  filterModalBackdrop: {
    flex: 1,
  },
  filterModal: {
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#1a1a1a",
  },
  filterModalHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    justifyContent: "space-between",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  filterModalTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },
  filterModalContent: {
    maxHeight: 500,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
    gap: 10,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  filterOption: {
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedFilterOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  selectedFilterOptionText: {
    fontWeight: "700",
  },
  dietaryGrid: {
    gap: 10,
  },
  dietaryOption: {
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedDietaryOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dietaryOptionText: {
    flex: 1,
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  selectedDietaryOptionText: {
    fontWeight: "700",
  },
  filterModalActions: {
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    flexDirection: "row",
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  clearButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  clearButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
});
