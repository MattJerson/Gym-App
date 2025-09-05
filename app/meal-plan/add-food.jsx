import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { MealPlanDataService } from "../../services/MealPlanDataService";

export default function AddFood() {
  const router = useRouter();
  const { mealType = "breakfast" } = useLocalSearchParams();
  
  // 🔄 State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [favoriteFoods, setFavoriteFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [activeTab, setActiveTab] = useState("search");

  // User ID - replace with actual user ID
  const userId = "user123";

  // Meal type configuration
  const mealTypeConfig = {
    breakfast: { icon: "sunny", color: "#FF9800", name: "Breakfast" },
    lunch: { icon: "partly-sunny", color: "#4CAF50", name: "Lunch" },
    dinner: { icon: "moon", color: "#1E3A5F", name: "Dinner" },
    snack: { icon: "nutrition", color: "#9C27B0", name: "Snack" }
  };

  const currentMeal = mealTypeConfig[mealType] || mealTypeConfig.breakfast;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "search") {
      searchFoods();
    }
  }, [searchQuery, selectedCategory, activeTab]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      const [recentData, favoritesData, searchData] = await Promise.all([
        MealPlanDataService.getRecentFoods(userId, 8),
        MealPlanDataService.getFavoritesFoods(userId, 8),
        MealPlanDataService.searchFoods(userId, "", "all", 20)
      ]);

      setRecentFoods(recentData);
      setFavoriteFoods(favoritesData);
      setFoods(searchData.foods);
      setCategories(searchData.categories);
      
    } catch (error) {
      console.error("Error loading food data:", error);
      Alert.alert("Error", "Failed to load food data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const searchFoods = async () => {
    try {
      const searchData = await MealPlanDataService.searchFoods(
        userId, 
        searchQuery, 
        selectedCategory, 
        50
      );
      setFoods(searchData.foods);
    } catch (error) {
      console.error("Error searching foods:", error);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setQuantity("1");
    setShowQuantityModal(true);
  };

  const handleAddFood = async () => {
    if (!selectedFood || !quantity || parseFloat(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    try {
      const foodData = {
        food: selectedFood,
        quantity: parseFloat(quantity),
        servingSize: selectedFood.servingSize
      };

      await MealPlanDataService.addFoodToMeal(userId, mealType, foodData);
      
      setShowQuantityModal(false);
      Alert.alert(
        "Success", 
        `${selectedFood.name} added to ${currentMeal.name.toLowerCase()}!`,
        [{ text: "OK", onPress: () => router.back() }]
      );
      
    } catch (error) {
      console.error("Error adding food:", error);
      Alert.alert("Error", "Failed to add food. Please try again.");
    }
  };

  const calculateTotalNutrition = () => {
    if (!selectedFood || !quantity) return null;
    
    const multiplier = parseFloat(quantity);
    return {
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fats: Math.round(selectedFood.fats * multiplier * 10) / 10,
      fiber: Math.round(selectedFood.fiber * multiplier * 10) / 10
    };
  };

  const renderFoodItem = ({ item }) => (
    <Pressable style={styles.foodItem} onPress={() => handleFoodSelect(item)}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodBrand}>{item.brand} • {item.servingSize}</Text>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionText}>{item.calories} cal</Text>
          <Text style={styles.nutritionText}>P: {item.protein}g</Text>
          <Text style={styles.nutritionText}>C: {item.carbs}g</Text>
          <Text style={styles.nutritionText}>F: {item.fats}g</Text>
        </View>
      </View>
      <View style={styles.foodActions}>
        {item.verified && (
          <MaterialIcons name="verified" size={16} color="#4CAF50" />
        )}
        <Ionicons name="add-circle-outline" size={24} color="#1E3A5F" />
      </View>
    </Pressable>
  );

  const renderCategoryTab = (category) => (
    <Pressable
      key={category.id}
      style={[
        styles.categoryTab,
        selectedCategory === category.id && styles.activeCategoryTab
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category.id && styles.activeCategoryText
      ]}>
        {category.name}
      </Text>
    </Pressable>
  );

  return (
    <LinearGradient colors={["#1a1a1a", "#2d2d2d"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.mealTypeHeader}>
            <Ionicons name={currentMeal.icon} size={24} color={currentMeal.color} />
            <Text style={styles.headerTitle}>Add to {currentMeal.name}</Text>
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "search" && styles.activeTab]}
          onPress={() => setActiveTab("search")}
        >
          <Ionicons 
            name="search" 
            size={20} 
            color={activeTab === "search" ? "#fff" : "#666"} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "search" && styles.activeTabText
          ]}>
            Search
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.tab, activeTab === "recent" && styles.activeTab]}
          onPress={() => setActiveTab("recent")}
        >
          <Ionicons 
            name="time" 
            size={20} 
            color={activeTab === "recent" ? "#fff" : "#666"} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "recent" && styles.activeTabText
          ]}>
            Recent
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => setActiveTab("favorites")}
        >
          <Ionicons 
            name="heart" 
            size={20} 
            color={activeTab === "favorites" ? "#fff" : "#666"} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "favorites" && styles.activeTabText
          ]}>
            Favorites
          </Text>
        </Pressable>
      </View>

      {/* Search Bar - Only show in search tab */}
      {activeTab === "search" && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
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

          {/* Category Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map(renderCategoryTab)}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={styles.loadingText}>Loading foods...</Text>
          </View>
        ) : (
          <FlatList
            data={
              activeTab === "recent" ? recentFoods :
              activeTab === "favorites" ? favoriteFoods :
              foods
            }
            keyExtractor={(item) => item.id}
            renderItem={renderFoodItem}
            contentContainerStyle={styles.foodList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="restaurant" size={48} color="#666" />
                <Text style={styles.emptyStateText}>
                  {activeTab === "search" && searchQuery 
                    ? "No foods found" 
                    : activeTab === "recent" 
                    ? "No recent foods" 
                    : activeTab === "favorites"
                    ? "No favorite foods yet"
                    : "No foods available"
                  }
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Quantity Modal */}
      <Modal
        visible={showQuantityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quantityModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {selectedFood?.name}</Text>
              <Pressable onPress={() => setShowQuantityModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {selectedFood && (
              <>
                <View style={styles.foodDetails}>
                  <Text style={styles.foodDetailName}>{selectedFood.name}</Text>
                  <Text style={styles.foodDetailBrand}>
                    {selectedFood.brand} • {selectedFood.servingSize}
                  </Text>
                </View>

                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <View style={styles.quantityInput}>
                    <Pressable 
                      style={styles.quantityButton}
                      onPress={() => setQuantity(String(Math.max(0.25, parseFloat(quantity) - 0.25)))}
                    >
                      <Ionicons name="remove" size={20} color="#fff" />
                    </Pressable>
                    <TextInput
                      style={styles.quantityTextInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="decimal-pad"
                    />
                    <Pressable 
                      style={styles.quantityButton}
                      onPress={() => setQuantity(String(parseFloat(quantity) + 0.25))}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </Pressable>
                  </View>
                </View>

                {/* Nutrition Preview */}
                {calculateTotalNutrition() && (
                  <View style={styles.nutritionPreview}>
                    <Text style={styles.nutritionPreviewTitle}>Total Nutrition</Text>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {calculateTotalNutrition().calories}
                        </Text>
                        <Text style={styles.nutritionLabel}>Calories</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {calculateTotalNutrition().protein}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {calculateTotalNutrition().carbs}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {calculateTotalNutrition().fats}g
                        </Text>
                        <Text style={styles.nutritionLabel}>Fats</Text>
                      </View>
                    </View>
                  </View>
                )}

                <Pressable style={styles.addButton} onPress={handleAddFood}>
                  <LinearGradient
                    colors={[currentMeal.color, "#1E3A5F"]}
                    style={styles.addButtonGradient}
                  >
                    <Text style={styles.addButtonText}>Add to {currentMeal.name}</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  mealTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 4,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#1E3A5F",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  categoryContainer: {
    height: 40,
  },
  categoryContent: {
    paddingRight: 20,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 8,
  },
  activeCategoryTab: {
    backgroundColor: "#1E3A5F",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeCategoryText: {
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.7,
  },
  foodList: {
    paddingBottom: 20,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
  },
  foodBrand: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: "row",
    gap: 12,
  },
  nutritionText: {
    fontSize: 12,
    color: "#ccc",
    fontWeight: "500",
  },
  foodActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  quantityModal: {
    backgroundColor: "#2d2d2d",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  foodDetails: {
    marginBottom: 24,
  },
  foodDetailName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
  },
  foodDetailBrand: {
    fontSize: 14,
    color: "#999",
  },
  quantityContainer: {
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 12,
  },
  quantityInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityTextInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    minWidth: 80,
  },
  nutritionPreview: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  nutritionPreviewTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 12,
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
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#999",
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  addButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});
