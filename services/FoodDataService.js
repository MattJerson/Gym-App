/**
 * FoodData Central API Service
 * 
 * Integration with USDA FoodData Central API with rate limiting
 * API Limit: 500 requests per hour
 * Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

import { EXPO_PUBLIC_FOODDATA_API } from "@env";

class FoodDataAPIService {
  constructor() {
    this.apiKey = EXPO_PUBLIC_FOODDATA_API;
    this.baseURL = "https://api.nal.usda.gov/fdc/v1";
    
    // Rate limiting configuration (500 requests/hour = ~8.3 requests/minute)
    this.maxRequestsPerHour = 500;
    this.requestQueue = [];
    this.lastRequestTime = 0;
    this.minRequestInterval = 500; // 500ms between requests (safe buffer)
    
    // Cache configuration
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Rate limiter - ensures we don't exceed API limits
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Check cache for existing data
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Store data in cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Search foods by query with improved relevance and validation
   * @param {string} query - Search term
   * @param {number} pageSize - Number of results (default: 12)
   * @param {number} pageNumber - Page number for pagination (default: 1)
   * @returns {Promise<Array>} - Array of food items
   */
  async searchFoods(query, pageSize = 12, pageNumber = 1) {
    try {
      if (!query || query.trim().length < 2) {
        return { foods: [], totalHits: 0, currentPage: 1 };
      }

      // Check cache first
      const cacheKey = `search_${query}_${pageSize}_${pageNumber}`;
      const cachedResult = this.getCachedData(cacheKey);
      if (cachedResult) {
        console.log("📦 Returning cached results for:", query);
        return cachedResult;
      }

      // Rate limiting
      await this.waitForRateLimit();

      const url = `${this.baseURL}/foods/search`;
      
      // Request slightly more results for better filtering (but not too many)
      const requestSize = pageSize + 8; // Small buffer for filtering
      
      const params = new URLSearchParams({
        api_key: this.apiKey,
        query: query.trim(),
        pageSize: requestSize.toString(),
        pageNumber: pageNumber.toString(),
        dataType: "Survey (FNDDS),Foundation,Branded",
        sortBy: "dataType.keyword",
        sortOrder: "asc"
      });

      console.log("🔍 Searching FoodData Central API:", query);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${url}?${params}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform and validate results (lightweight validation)
      let transformedFoods = this.transformFoodResults(data.foods || []);
      
      // Quick validation - only filter out obvious bad data
      transformedFoods = this.validateAndFilterFoods(transformedFoods);
      
      // Remove duplicates
      transformedFoods = this.removeDuplicates(transformedFoods);
      
      // Score and sort by relevance
      transformedFoods = this.scoreAndSortFoods(transformedFoods, query);
      
      // Limit to requested page size
      const startIndex = 0;
      const endIndex = pageSize;
      const paginatedFoods = transformedFoods.slice(startIndex, endIndex);
      
      const transformedData = {
        foods: paginatedFoods,
        totalHits: data.totalHits || transformedFoods.length,
        currentPage: pageNumber,
        totalPages: Math.ceil((data.totalHits || transformedFoods.length) / pageSize)
      };

      // Cache the results
      this.setCachedData(cacheKey, transformedData);

      console.log(`✅ Found ${paginatedFoods.length} results`);

      return transformedData;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("❌ Request timeout - try a more specific search");
        return { foods: [], totalHits: 0, currentPage: 1, error: "Request timeout" };
      }
      console.error("❌ FoodData API Search Error:", error);
      return { foods: [], totalHits: 0, currentPage: 1, error: error.message };
    }
  }

  /**
   * Get detailed food information by FDC ID
   * @param {string} fdcId - FoodData Central ID
   * @returns {Promise<Object>} - Detailed food information
   */
  async getFoodDetails(fdcId) {
    try {
      // Check cache first
      const cacheKey = `food_${fdcId}`;
      const cachedResult = this.getCachedData(cacheKey);
      if (cachedResult) {
        console.log("📦 Returning cached food details for:", fdcId);
        return cachedResult;
      }

      // Rate limiting
      await this.waitForRateLimit();

      const url = `${this.baseURL}/food/${fdcId}`;
      const params = new URLSearchParams({
        api_key: this.apiKey,
        format: "full"
      });

      console.log("🔍 Fetching food details:", fdcId);
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const transformedData = this.transformFoodDetail(data);

      // Cache the results
      this.setCachedData(cacheKey, transformedData);

      return transformedData;
    } catch (error) {
      console.error("❌ FoodData API Details Error:", error);
      throw error;
    }
  }

  /**
   * Validate and filter foods - lightweight check for obvious bad data
   */
  validateAndFilterFoods(foods) {
    return foods.filter(food => {
      // Must have a valid name
      if (!food.name || food.name === "Unknown Food") return false;
      
      // Must have calorie data
      if (!food.calories || food.calories <= 0) return false;
      
      // Validate basic calorie range (0-900 cal per 100g is realistic)
      if (food.calories > 900) return false;
      
      // Must have at least one macro nutrient
      const hasMacros = (food.protein > 0) || (food.carbs > 0) || (food.fats > 0);
      if (!hasMacros) return false;
      
      return true;
    });
  }

  /**
   * Remove duplicate foods (same name/brand)
   */
  removeDuplicates(foods) {
    const seen = new Set();
    const unique = [];
    
    for (const food of foods) {
      // Create unique key from name (simpler, faster)
      const key = `${food.name.toLowerCase()}_${(food.brand || '').toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(food);
      }
    }
    
    return unique;
  }

  /**
   * Score and sort foods by relevance to search query (optimized)
   */
  scoreAndSortFoods(foods, query) {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
    
    const scoredFoods = foods.map(food => {
      let score = 0;
      const lowerName = food.name.toLowerCase();
      const lowerBrand = (food.brand || '').toLowerCase();
      
      // Exact name match (highest priority)
      if (lowerName === lowerQuery) {
        score += 100;
      }
      // Name starts with query
      else if (lowerName.startsWith(lowerQuery)) {
        score += 50;
      }
      // Query is in the name
      else if (lowerName.includes(lowerQuery)) {
        score += 25;
      }
      
      // Brand match bonus
      if (lowerBrand && lowerBrand.includes(lowerQuery)) {
        score += 30;
      }
      
      // Count matching words (quick check)
      const matchingWords = queryWords.filter(word => 
        lowerName.includes(word) || lowerBrand.includes(word)
      ).length;
      score += matchingWords * 8;
      
      // Branded foods get small boost
      if (food.brand) {
        score += 5;
      }
      
      return {
        ...food,
        _relevanceScore: score
      };
    });
    
    // Sort by relevance score (highest first)
    return scoredFoods.sort((a, b) => b._relevanceScore - a._relevanceScore);
  }

  /**
   * Transform API food search results to our app format
   */
  transformFoodResults(foods) {
    return foods.map(food => {
      const nutrients = this.extractNutrients(food.foodNutrients || []);
      
      return {
        id: food.fdcId?.toString(),
        fdc_id: food.fdcId?.toString(),
        name: food.description || food.lowercaseDescription || "Unknown Food",
        brand: food.brandOwner || food.brandName || null,
        description: food.additionalDescriptions || food.ingredients || null,
        
        // Nutritional values (per 100g)
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fats: nutrients.fats,
        fiber: nutrients.fiber,
        sugar: nutrients.sugar,
        sodium: nutrients.sodium,
        
        // Serving info
        serving_size: food.servingSize || 100,
        serving_unit: food.servingSizeUnit || "g",
        
        // Metadata
        category: this.categorizeFood(food),
        dataType: food.dataType,
        source: "api",
        
        // Original data for reference
        _raw: food
      };
    });
  }

  /**
   * Transform detailed food data
   */
  transformFoodDetail(food) {
    const nutrients = this.extractNutrients(food.foodNutrients || []);
    
    return {
      id: food.fdcId?.toString(),
      fdc_id: food.fdcId?.toString(),
      name: food.description || "Unknown Food",
      brand: food.brandOwner || food.brandName || null,
      description: food.ingredients || food.additionalDescriptions || null,
      
      // Nutritional values
      calories: nutrients.calories,
      protein: nutrients.protein,
      carbs: nutrients.carbs,
      fats: nutrients.fats,
      fiber: nutrients.fiber,
      sugar: nutrients.sugar,
      sodium: nutrients.sodium,
      
      // Additional nutrients
      cholesterol: nutrients.cholesterol,
      saturatedFat: nutrients.saturatedFat,
      transFat: nutrients.transFat,
      vitaminD: nutrients.vitaminD,
      calcium: nutrients.calcium,
      iron: nutrients.iron,
      potassium: nutrients.potassium,
      
      // Serving info
      serving_size: food.servingSize || 100,
      serving_unit: food.servingSizeUnit || "g",
      household_serving: food.householdServingFullText || null,
      
      // Metadata
      category: this.categorizeFood(food),
      dataType: food.dataType,
      publishedDate: food.publishedDate,
      source: "api"
    };
  }

  /**
   * Extract and normalize nutrients from API response
   */
  extractNutrients(foodNutrients) {
    const nutrients = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturatedFat: 0,
      transFat: 0,
      vitaminD: 0,
      calcium: 0,
      iron: 0,
      potassium: 0
    };

    // Nutrient ID mapping (FoodData Central nutrient IDs)
    const nutrientMap = {
      1008: "calories", // Energy (kcal)
      1003: "protein", // Protein
      1005: "carbs", // Carbohydrate
      1004: "fats", // Total lipid (fat)
      1079: "fiber", // Fiber, total dietary
      2000: "sugar", // Total sugars
      1093: "sodium", // Sodium
      1253: "cholesterol", // Cholesterol
      1258: "saturatedFat", // Fatty acids, total saturated
      1257: "transFat", // Fatty acids, total trans
      1114: "vitaminD", // Vitamin D
      1087: "calcium", // Calcium
      1089: "iron", // Iron
      1092: "potassium" // Potassium
    };

    foodNutrients.forEach(nutrient => {
      const nutrientId = nutrient.nutrientId || nutrient.nutrient?.id;
      const nutrientName = nutrientMap[nutrientId];
      
      if (nutrientName) {
        const value = nutrient.value || nutrient.amount || 0;
        nutrients[nutrientName] = Math.round(value * 10) / 10; // Round to 1 decimal
      }
    });

    return nutrients;
  }

  /**
   * Categorize food based on its properties
   */
  categorizeFood(food) {
    const description = (food.description || "").toLowerCase();
    const ingredients = (food.ingredients || "").toLowerCase();
    const combined = `${description} ${ingredients}`;

    // Category determination logic
    if (combined.match(/chicken|turkey|beef|pork|lamb|fish|salmon|tuna|shrimp|protein/)) {
      return "protein";
    }
    if (combined.match(/rice|pasta|bread|oat|quinoa|cereal|grain/)) {
      return "grain";
    }
    if (combined.match(/broccoli|spinach|lettuce|carrot|tomato|pepper|vegetable/)) {
      return "vegetable";
    }
    if (combined.match(/apple|banana|orange|berry|strawberry|grape|fruit/)) {
      return "fruit";
    }
    if (combined.match(/milk|yogurt|cheese|dairy/)) {
      return "dairy";
    }
    if (combined.match(/almond|peanut|cashew|walnut|nut|seed/)) {
      return "nuts";
    }
    if (combined.match(/avocado|olive oil|coconut oil|butter/)) {
      return "healthy_fat";
    }
    if (combined.match(/protein powder|supplement|shake/)) {
      return "supplement";
    }
    
    return "other";
  }

  /**
   * Batch search with delay (for loading initial data)
   */
  async batchSearch(queries, delayMs = 600) {
    const results = [];
    
    for (const query of queries) {
      try {
        const result = await this.searchFoods(query, 5); // Get 5 results per category
        results.push(...result.foods);
        
        // Add delay between requests
        if (queries.indexOf(query) < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`Error searching for ${query}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get suggested foods for initial load (popular categories)
   */
  async getSuggestedFoods() {
    const cacheKey = "suggested_foods";
    const cachedResult = this.getCachedData(cacheKey);
    
    if (cachedResult) {
      console.log("📦 Returning cached suggested foods");
      return cachedResult;
    }

    try {
      const popularCategories = [
        "chicken breast",
        "brown rice",
        "salmon",
        "banana",
        "oatmeal",
        "greek yogurt"
      ];

      const results = await this.batchSearch(popularCategories);
      this.setCachedData(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error("❌ Error fetching suggested foods:", error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.cache.clear();
    console.log("🗑️ Food data cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const FoodDataService = new FoodDataAPIService();
