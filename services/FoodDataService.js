/**
 * FoodData Central API Service
 * 
 * Integration with USDA FoodData Central API with rate limiting
 * API Limit: 500 requests per hour
 * Documentation: https://fdc.nal.usda.gov/api-guide.html
 */
import { EXPO_PUBLIC_FOODDATA_API } from "@env";
import { callEdgeFunction } from "./edgeClient";
import { logger } from "./logger";

class FoodDataAPIService {
  constructor() {
  // Prefer secure proxy via Supabase Edge Functions; fallback only if explicitly configured
  this.apiKey = EXPO_PUBLIC_FOODDATA_API || null;
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
        logger.debug("Returning cached results for:", query);
        return cachedResult;
      }

      // Rate limiting
      await this.waitForRateLimit();

      // Simple search with original query
      const data = await this.performAPISearch(query.trim(), pageSize + 15, pageNumber);
      
      // Transform and validate results
      let transformedFoods = this.transformFoodResults(data.foods || []);
      
      // Quick validation - only filter out obvious bad data
      transformedFoods = this.validateAndFilterFoods(transformedFoods);
      
      // Remove duplicates and keep most popular variant
      transformedFoods = this.deduplicateByPopularity(transformedFoods);
      
      // Score and sort by relevance
      transformedFoods = this.scoreAndSortFoods(transformedFoods, query);
      
      // Limit to requested page size
      const paginatedFoods = transformedFoods.slice(0, pageSize);
      
      const transformedData = {
        foods: paginatedFoods,
        totalHits: data.totalHits || transformedFoods.length,
        currentPage: pageNumber,
        totalPages: Math.ceil((data.totalHits || transformedFoods.length) / pageSize)
      };

      // Cache the results
      this.setCachedData(cacheKey, transformedData);

      logger.debug(`Found ${paginatedFoods.length} results`);

      return transformedData;
    } catch (error) {
      if (error.name === 'AbortError') {
        logger.warn("Request timeout - try a more specific search");
        return { foods: [], totalHits: 0, currentPage: 1, error: "Request timeout" };
      }
      logger.error("FoodData API Search Error:", error);
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
        logger.debug("Returning cached food details for:", fdcId);
        return cachedResult;
      }

      // Rate limiting
      await this.waitForRateLimit();

      let data;
      if (!this.apiKey) {
        logger.info('FoodData details via Edge Function');
        data = await callEdgeFunction('fooddata_proxy', {
          method: 'POST',
          body: {
            path: `food/${fdcId}`,
            params: { format: 'full' }
          }
        });
      } else {
        const url = `${this.baseURL}/food/${fdcId}`;
        const params = new URLSearchParams({ api_key: this.apiKey, format: 'full' });
        const response = await fetch(`${url}?${params}`);
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        data = await response.json();
      }
      const transformedData = this.transformFoodDetail(data);

      // Cache the results
      this.setCachedData(cacheKey, transformedData);

      return transformedData;
    } catch (error) {
  logger.error("FoodData API Details Error:", error);
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
      
      // Must have ALL macros present (protein, carbs, fats)
      // Real food items should have complete nutritional data
      // All macros must be > 0 (not just >= 0) for realistic foods
      if (!food.protein || food.protein <= 0) return false;
      if (!food.carbs || food.carbs <= 0) return false;
      if (!food.fats || food.fats <= 0) return false;
      
      return true;
    });
  }

  /**
   * Perform actual API search call
   */
  async performAPISearch(searchQuery, requestSize, pageNumber) {
    let data;
    
    if (!this.apiKey) {
      // Secure path via Edge Function
      logger.info('FoodData search via Edge Function');
      data = await callEdgeFunction('fooddata_proxy', {
        method: 'POST',
        body: {
          path: 'foods/search',
          params: {
            query: searchQuery,
            pageSize: String(requestSize),
            pageNumber: String(pageNumber),
            dataType: "Branded,Survey (FNDDS),Foundation",
            sortBy: "dataType.keyword",
            sortOrder: "asc"
          }
        }
      });
    } else {
      // Backward-compatible direct call using public env key (not recommended)
      const url = `${this.baseURL}/foods/search`;
      const params = new URLSearchParams({
        api_key: this.apiKey,
        query: searchQuery,
        pageSize: requestSize.toString(),
        pageNumber: pageNumber.toString(),
        dataType: "Branded,Survey (FNDDS),Foundation",
        sortBy: "dataType.keyword",
        sortOrder: "asc"
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // Increased to 15s
      const response = await fetch(`${url}?${params}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        console.warn(`⚠️  FoodData API returned ${response.status}: ${response.statusText}`);
        // Return empty result instead of throwing to allow local results to still work
        return { foods: [], totalHits: 0 };
      }
      data = await response.json();
    }
    
    return data;
  }

  /**
   * Deduplicate foods by keeping the most popular/relevant variant
   * Groups similar foods and keeps only one (the best one)
   */
  deduplicateByPopularity(foods) {
    const groups = new Map();
    
    foods.forEach(food => {
      // Create a normalized key for grouping similar items
      const nameParts = food.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 2) // Filter out very short words
        .sort(); // Sort for consistent key
      
      const baseKey = nameParts.slice(0, 4).join(' '); // Use first 4 significant words
      const brandKey = (food.brand || '').toLowerCase().slice(0, 10);
      const groupKey = `${baseKey}_${brandKey}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(food);
    });
    
    // From each group, pick the best one
    const deduplicated = [];
    
    groups.forEach(group => {
      if (group.length === 1) {
        deduplicated.push(group[0]);
        return;
      }
      
      // Score each item in the group
      const scored = group.map(food => {
        let score = 0;
        
        // Prefer branded items (more specific)
        if (food.dataType === 'Branded' && food.brand) score += 30;
        
        // Prefer Foundation/Survey data (USDA verified)
        if (food.dataType === 'Survey (FNDDS)') score += 25;
        if (food.dataType === 'Foundation') score += 20;
        
        // Prefer items with complete nutrition data
        if (food.protein > 0) score += 5;
        if (food.carbs > 0) score += 5;
        if (food.fats > 0) score += 5;
        if (food.fiber > 0) score += 3;
        
        // Prefer shorter, cleaner names (less descriptive fluff)
        const nameLength = food.name.length;
        if (nameLength < 50) score += 10;
        else if (nameLength > 100) score -= 5;
        
        // Prefer standard serving sizes (100g or common portions)
        if (food.serving_size === 100) score += 8;
        
        return { ...food, _groupScore: score };
      });
      
      // Sort by score and take the best one
      scored.sort((a, b) => b._groupScore - a._groupScore);
      deduplicated.push(scored[0]);
    });
    
    return deduplicated;
  }

  /**
   * Remove duplicate foods (simple version - kept for backwards compatibility)
   */
  removeDuplicates(foods) {
    const seen = new Set();
    const unique = [];
    
    for (const food of foods) {
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
    const lowerQuery = query.toLowerCase().trim();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
    
    const scoredFoods = foods.map(food => {
      let score = 0;
      const lowerName = food.name.toLowerCase();
      const lowerBrand = (food.brand || '').toLowerCase();
      const combinedText = `${lowerName} ${lowerBrand}`;
      
      // EXACT PHRASE MATCH (highest priority) - e.g., "big mac"
      if (lowerName === lowerQuery || combinedText.includes(lowerQuery)) {
        score += 1000;
      }
      
      // Exact name match (very high priority)
      if (lowerName === lowerQuery) {
        score += 500;
      }
      // Name starts with exact query
      else if (lowerName.startsWith(lowerQuery)) {
        score += 300;
      }
      // Query phrase appears in name
      else if (lowerName.includes(lowerQuery)) {
        score += 200;
      }
      
      // All query words present in order (e.g., "big" then "mac")
      if (queryWords.length > 1) {
        let allWordsInOrder = true;
        let lastIndex = -1;
        
        for (const word of queryWords) {
          const index = lowerName.indexOf(word, lastIndex + 1);
          if (index === -1) {
            allWordsInOrder = false;
            break;
          }
          lastIndex = index;
        }
        
        if (allWordsInOrder) {
          score += 150;
        }
      }
      
      // Brand exact match bonus (helps with branded items like "Big Mac" from McDonald's)
      if (lowerBrand === lowerQuery) {
        score += 400;
      } else if (lowerBrand && lowerBrand.includes(lowerQuery)) {
        score += 100;
      }
      
      // Count matching words and their positions
      let matchingWordsScore = 0;
      queryWords.forEach((word, idx) => {
        if (lowerName.includes(word)) {
          matchingWordsScore += 30;
          
          // Bonus if word appears at the start of name
          if (lowerName.startsWith(word)) {
            matchingWordsScore += 20;
          }
        }
        if (lowerBrand.includes(word)) {
          matchingWordsScore += 15;
        }
      });
      score += matchingWordsScore;
      
      // Word density bonus (shorter names with matches rank higher)
      const nameWordCount = lowerName.split(/\s+/).length;
      if (nameWordCount > 0 && queryWords.length > 0) {
        const matchRatio = queryWords.filter(word => 
          lowerName.includes(word)
        ).length / nameWordCount;
        score += matchRatio * 50;
      }
      
      // Penalize very long names (likely less relevant)
      if (lowerName.length > 100) {
        score -= 20;
      }
      
      // Branded foods get boost (usually more specific for restaurant items)
      if (food.brand) {
        score += 10;
      }
      
      // For branded fast food items, give extra boost
      if (food.dataType === 'Branded') {
        score += 15;
      }
      
      // Survey/Foundation data gets small boost for generic items
      if (food.dataType === 'Survey (FNDDS)' || food.dataType === 'Foundation') {
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
  logger.warn(`Error searching for ${query}:`, error);
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
  logger.debug("Returning cached suggested foods");
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
  logger.warn("Error fetching suggested foods:", error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache() {
    this.cache.clear();
  logger.info("Food data cache cleared");
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
