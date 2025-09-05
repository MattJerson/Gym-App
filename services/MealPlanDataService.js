// 🔄 Meal Plan Data Service - Replace these with actual API calls
export const MealPlanDataService = {
  // User & Notifications
  async fetchUserNotifications(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/notifications`);
    return {
      count: 3,
      messages: [
        { id: 1, title: "Meal Reminder", message: "Time for your afternoon snack!", type: "reminder" },
        { id: 2, title: "Weekly Goal", message: "You've hit your protein goal 5/7 days this week!", type: "achievement" },
        { id: 3, title: "Meal Prep", message: "Sunday meal prep suggestions are ready", type: "tip" }
      ]
    };
  },

  // Macro Progress & Goals
  async fetchMacroProgress(userId, date = new Date()) {
    // Replace with: const response = await fetch(`/api/users/${userId}/macros?date=${date.toISOString()}`);
    return {
      calories: { 
        current: 1500, 
        target: 2200, 
        percentage: 68,
        remaining: 700,
        unit: "kcal"
      },
      protein: { 
        current: 109, 
        target: 140, 
        percentage: 78,
        remaining: 31,
        unit: "g"
      },
      carbs: { 
        current: 145, 
        target: 200, 
        percentage: 73,
        remaining: 55,
        unit: "g"
      },
      fats: { 
        current: 68, 
        target: 85, 
        percentage: 80,
        remaining: 17,
        unit: "g"
      },
      fiber: {
        current: 22,
        target: 30,
        percentage: 73,
        remaining: 8,
        unit: "g"
      },
      sugar: {
        current: 45,
        target: 60,
        percentage: 75,
        remaining: 15,
        unit: "g"
      }
    };
  },

  async updateMacroGoals(userId, macroGoals) {
    // Replace with: const response = await fetch(`/api/users/${userId}/macro-goals`, { method: 'PUT', body: JSON.stringify(macroGoals) });
    return {
      success: true,
      updatedAt: new Date().toISOString(),
      goals: macroGoals
    };
  },

  // Weekly Meal Plan
  async fetchWeeklyPlan(userId, weekStartDate) {
    // Replace with: const response = await fetch(`/api/users/${userId}/meal-plan?week=${weekStartDate}`);
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return [
      { 
        day: "Mon", 
        date: "2025-09-01",
        active: dayOfWeek === 1, 
        mealsPlanned: 4,
        caloriesPlanned: 2100,
        isCompleted: dayOfWeek > 1
      },
      { 
        day: "Tue", 
        date: "2025-09-02",
        active: dayOfWeek === 2, 
        mealsPlanned: 4,
        caloriesPlanned: 2200,
        isCompleted: dayOfWeek > 2
      },
      { 
        day: "Wed", 
        date: "2025-09-03",
        active: dayOfWeek === 3, 
        mealsPlanned: 3,
        caloriesPlanned: 1950,
        isCompleted: dayOfWeek > 3
      },
      { 
        day: "Thu", 
        date: "2025-09-04",
        active: dayOfWeek === 4, 
        mealsPlanned: 4,
        caloriesPlanned: 2150,
        isCompleted: dayOfWeek > 4
      },
      { 
        day: "Fri", 
        date: "2025-09-05",
        active: dayOfWeek === 5, 
        mealsPlanned: 4,
        caloriesPlanned: 2300,
        isCompleted: dayOfWeek > 5
      },
      { 
        day: "Sat", 
        date: "2025-09-06",
        active: dayOfWeek === 6, 
        mealsPlanned: 3,
        caloriesPlanned: 2000,
        isCompleted: false
      },
      { 
        day: "Sun", 
        date: "2025-09-07",
        active: dayOfWeek === 0, 
        mealsPlanned: 4,
        caloriesPlanned: 2100,
        isCompleted: false
      },
    ];
  },

  // Today's Meals
  async fetchTodaysMeals(userId, date = new Date()) {
    // Replace with: const response = await fetch(`/api/users/${userId}/meals?date=${date.toISOString()}`);
    return [
      {
        id: "meal_1",
        meal: "Breakfast",
        name: "Protein Oats Bowl",
        calories: 420,
        protein: 28,
        carbs: 45,
        fats: 12,
        time: "8:00 AM",
        icon: "🍓",
        isCompleted: true,
        ingredients: ["Oats", "Protein Powder", "Berries", "Almond Milk"],
        prepTime: 10,
        difficulty: "Easy"
      },
      {
        id: "meal_2",
        meal: "Lunch",
        name: "Grilled Chicken Salad",
        calories: 380,
        protein: 35,
        carbs: 15,
        fats: 18,
        time: "1:00 PM",
        icon: "🥗",
        isCompleted: true,
        ingredients: ["Chicken Breast", "Mixed Greens", "Avocado", "Olive Oil"],
        prepTime: 20,
        difficulty: "Medium"
      },
      {
        id: "meal_3",
        meal: "Snack",
        name: "Banana + Almond Butter",
        calories: 220,
        protein: 8,
        carbs: 25,
        fats: 12,
        time: "5:30 PM",
        icon: "🍌",
        isCompleted: false,
        ingredients: ["Banana", "Almond Butter"],
        prepTime: 2,
        difficulty: "Easy"
      },
      {
        id: "meal_4",
        meal: "Dinner",
        name: "Salmon & Sweet Potato",
        calories: 480,
        protein: 38,
        carbs: 35,
        fats: 20,
        time: "7:30 PM",
        icon: "🐟",
        isCompleted: false,
        ingredients: ["Salmon Fillet", "Sweet Potato", "Broccoli", "Lemon"],
        prepTime: 30,
        difficulty: "Medium"
      },
    ];
  },

  async updateMealCompletion(userId, mealId, isCompleted) {
    // Replace with: const response = await fetch(`/api/meals/${mealId}/completion`, { method: 'PUT', body: JSON.stringify({ isCompleted }) });
    return {
      success: true,
      mealId: mealId,
      isCompleted: isCompleted,
      updatedAt: new Date().toISOString()
    };
  },

  // Recent Meals
  async fetchRecentMeals(userId, limit = 4) {
    // Replace with: const response = await fetch(`/api/users/${userId}/recent-meals?limit=${limit}`);
    return [
      {
        id: "rm_1",
        title: "Mediterranean Bowl",
        subtitle: "Quinoa, chickpeas, feta",
        calories: 450,
        protein: 22,
        completedAt: "2025-09-05T19:30:00Z",
        rating: 4.5,
        image: "https://example.com/mediterranean-bowl.jpg",
        gradient: ["#1E3A5F", "#4A90E2"],
        tags: ["High Protein", "Vegetarian"],
        prepTime: 25
      },
      {
        id: "rm_2", 
        title: "Grilled Salmon",
        subtitle: "With roasted vegetables",
        calories: 520,
        protein: 42,
        completedAt: "2025-09-04T18:15:00Z",
        rating: 5.0,
        image: "https://example.com/grilled-salmon.jpg",
        gradient: ["#FF5722", "#FF9800"],
        tags: ["High Protein", "Omega-3"],
        prepTime: 35
      },
      {
        id: "rm_3",
        title: "Chicken Stir Fry",
        subtitle: "Asian-style with brown rice",
        calories: 380,
        protein: 32,
        completedAt: "2025-09-03T20:00:00Z",
        rating: 4.2,
        image: "https://example.com/chicken-stir-fry.jpg",
        gradient: ["#4CAF50", "#8BC34A"],
        tags: ["Quick Cook", "Balanced"],
        prepTime: 20
      },
      {
        id: "rm_4",
        title: "Protein Smoothie Bowl",
        subtitle: "Berry blend with granola",
        calories: 340,
        protein: 25,
        completedAt: "2025-09-02T09:30:00Z",
        rating: 4.8,
        image: "https://example.com/smoothie-bowl.jpg",
        gradient: ["#9C27B0", "#E1BEE7"],
        tags: ["Breakfast", "Antioxidants"],
        prepTime: 10
      }
    ];
  },

  // Quick Actions Data
  async fetchQuickActions(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/quick-actions`);
    return [
      {
        id: "action_1",
        title: "Meal Prep Guide",
        description: "Plan your week ahead",
        icon: "food-apple",
        iconLibrary: "MaterialCommunityIcons",
        color: "#1E3A5F",
        route: "/meal-prep",
        isAvailable: true
      },
      {
        id: "action_2", 
        title: "Macro Calculator",
        description: "Calculate your daily needs",
        icon: "calculator",
        iconLibrary: "MaterialCommunityIcons",
        color: "#4CAF50",
        route: "/macro-calculator",
        isAvailable: true
      },
      {
        id: "action_3",
        title: "Meal History",
        description: "View past meals & nutrition",
        icon: "history",
        iconLibrary: "FontAwesome5",
        color: "#FF9800",
        route: "/meal-history",
        isAvailable: true
      }
    ];
  },

  // Food Database & Search
  async searchFoods(userId, query = "", category = "all", limit = 20) {
    // Replace with: const response = await fetch(`/api/foods/search?q=${query}&category=${category}&limit=${limit}`);
    const allFoods = [
      // Proteins
      {
        id: "food_1",
        name: "Grilled Chicken Breast",
        brand: "Generic",
        category: "protein",
        servingSize: "100g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        verified: true,
        barcode: "123456789",
        image: "https://example.com/chicken.jpg"
      },
      {
        id: "food_2", 
        name: "Salmon Fillet",
        brand: "Generic",
        category: "protein",
        servingSize: "100g",
        calories: 208,
        protein: 20,
        carbs: 0,
        fats: 13,
        fiber: 0,
        sugar: 0,
        sodium: 59,
        verified: true,
        barcode: "123456790",
        image: "https://example.com/salmon.jpg"
      },
      {
        id: "food_3",
        name: "Greek Yogurt",
        brand: "Chobani",
        category: "protein",
        servingSize: "150g",
        calories: 100,
        protein: 15,
        carbs: 6,
        fats: 0,
        fiber: 0,
        sugar: 4,
        sodium: 55,
        verified: true,
        barcode: "123456791",
        image: "https://example.com/yogurt.jpg"
      },
      // Carbohydrates
      {
        id: "food_4",
        name: "Brown Rice",
        brand: "Generic",
        category: "carbs",
        servingSize: "100g cooked",
        calories: 111,
        protein: 2.6,
        carbs: 23,
        fats: 0.9,
        fiber: 1.8,
        sugar: 0.4,
        sodium: 5,
        verified: true,
        barcode: "123456792",
        image: "https://example.com/rice.jpg"
      },
      {
        id: "food_5",
        name: "Sweet Potato",
        brand: "Generic",
        category: "carbs",
        servingSize: "100g",
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fats: 0.1,
        fiber: 3,
        sugar: 4.2,
        sodium: 54,
        verified: true,
        barcode: "123456793",
        image: "https://example.com/sweetpotato.jpg"
      },
      {
        id: "food_6",
        name: "Oats",
        brand: "Quaker",
        category: "carbs",
        servingSize: "40g dry",
        calories: 150,
        protein: 5,
        carbs: 27,
        fats: 3,
        fiber: 4,
        sugar: 1,
        sodium: 0,
        verified: true,
        barcode: "123456794",
        image: "https://example.com/oats.jpg"
      },
      // Vegetables
      {
        id: "food_7",
        name: "Broccoli",
        brand: "Generic",
        category: "vegetables",
        servingSize: "100g",
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fats: 0.4,
        fiber: 2.6,
        sugar: 1.5,
        sodium: 33,
        verified: true,
        barcode: "123456795",
        image: "https://example.com/broccoli.jpg"
      },
      {
        id: "food_8",
        name: "Spinach",
        brand: "Generic",
        category: "vegetables",
        servingSize: "100g",
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fats: 0.4,
        fiber: 2.2,
        sugar: 0.4,
        sodium: 79,
        verified: true,
        barcode: "123456796",
        image: "https://example.com/spinach.jpg"
      },
      // Fruits
      {
        id: "food_9",
        name: "Banana",
        brand: "Generic",
        category: "fruits",
        servingSize: "1 medium (118g)",
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fats: 0.4,
        fiber: 3.1,
        sugar: 14.4,
        sodium: 1,
        verified: true,
        barcode: "123456797",
        image: "https://example.com/banana.jpg"
      },
      {
        id: "food_10",
        name: "Apple",
        brand: "Generic",
        category: "fruits",
        servingSize: "1 medium (182g)",
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fats: 0.3,
        fiber: 4.4,
        sugar: 19,
        sodium: 2,
        verified: true,
        barcode: "123456798",
        image: "https://example.com/apple.jpg"
      },
      // Fats
      {
        id: "food_11",
        name: "Avocado",
        brand: "Generic",
        category: "fats",
        servingSize: "1/2 medium (75g)",
        calories: 120,
        protein: 2,
        carbs: 6,
        fats: 11,
        fiber: 5,
        sugar: 1,
        sodium: 5,
        verified: true,
        barcode: "123456799",
        image: "https://example.com/avocado.jpg"
      },
      {
        id: "food_12",
        name: "Almonds",
        brand: "Generic",
        category: "fats",
        servingSize: "28g (23 nuts)",
        calories: 164,
        protein: 6,
        carbs: 6,
        fats: 14,
        fiber: 3.5,
        sugar: 1.2,
        sodium: 0,
        verified: true,
        barcode: "123456800",
        image: "https://example.com/almonds.jpg"
      }
    ];

    // Filter by search query
    let filteredFoods = query 
      ? allFoods.filter(food => 
          food.name.toLowerCase().includes(query.toLowerCase()) ||
          food.brand.toLowerCase().includes(query.toLowerCase()) ||
          food.category.toLowerCase().includes(query.toLowerCase())
        )
      : allFoods;

    // Filter by category
    if (category !== "all") {
      filteredFoods = filteredFoods.filter(food => food.category === category);
    }

    // Apply limit
    filteredFoods = filteredFoods.slice(0, limit);

    return {
      foods: filteredFoods,
      totalResults: filteredFoods.length,
      categories: [
        { id: "all", name: "All Foods", count: allFoods.length },
        { id: "protein", name: "Protein", count: allFoods.filter(f => f.category === "protein").length },
        { id: "carbs", name: "Carbohydrates", count: allFoods.filter(f => f.category === "carbs").length },
        { id: "vegetables", name: "Vegetables", count: allFoods.filter(f => f.category === "vegetables").length },
        { id: "fruits", name: "Fruits", count: allFoods.filter(f => f.category === "fruits").length },
        { id: "fats", name: "Fats", count: allFoods.filter(f => f.category === "fats").length }
      ]
    };
  },

  async getFoodDetails(userId, foodId) {
    // Replace with: const response = await fetch(`/api/foods/${foodId}`);
    const searchResult = await this.searchFoods(userId);
    return searchResult.foods.find(food => food.id === foodId);
  },

  async addFoodToMeal(userId, mealType, foodData, date = new Date()) {
    // Replace with: const response = await fetch(`/api/users/${userId}/meals`, { method: 'POST', body: JSON.stringify(foodData) });
    return {
      id: `meal_entry_${Date.now()}`,
      userId: userId,
      mealType: mealType,
      date: date.toISOString(),
      food: foodData.food,
      quantity: foodData.quantity,
      servingSize: foodData.servingSize,
      totalCalories: Math.round(foodData.food.calories * foodData.quantity),
      totalProtein: Math.round(foodData.food.protein * foodData.quantity * 10) / 10,
      totalCarbs: Math.round(foodData.food.carbs * foodData.quantity * 10) / 10,
      totalFats: Math.round(foodData.food.fats * foodData.quantity * 10) / 10,
      totalFiber: Math.round(foodData.food.fiber * foodData.quantity * 10) / 10,
      addedAt: new Date().toISOString()
    };
  },

  async getRecentFoods(userId, limit = 10) {
    // Replace with: const response = await fetch(`/api/users/${userId}/recent-foods?limit=${limit}`);
    const searchResult = await this.searchFoods(userId);
    return searchResult.foods.slice(0, limit).map(food => ({
      ...food,
      lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random last week
      frequency: Math.floor(Math.random() * 20) + 1
    }));
  },

  async getFavoritesFoods(userId, limit = 10) {
    // Replace with: const response = await fetch(`/api/users/${userId}/favorite-foods?limit=${limit}`);
    const searchResult = await this.searchFoods(userId);
    return searchResult.foods.slice(0, limit).map(food => ({
      ...food,
      isFavorite: true,
      timesUsed: Math.floor(Math.random() * 50) + 10
    }));
  },

  // Meal Planning & Recommendations
  async fetchMealRecommendations(userId, mealType, preferences = {}) {
    // Replace with: const response = await fetch(`/api/recommendations/meals?userId=${userId}&type=${mealType}`, { method: 'POST', body: JSON.stringify(preferences) });
    return [
      {
        id: "rec_1",
        name: "Greek Yogurt Parfait",
        calories: 320,
        protein: 20,
        carbs: 35,
        fats: 8,
        prepTime: 5,
        difficulty: "Easy",
        ingredients: ["Greek Yogurt", "Berries", "Granola", "Honey"],
        matchScore: 0.95
      },
      {
        id: "rec_2",
        name: "Avocado Toast with Egg",
        calories: 380,
        protein: 18,
        carbs: 25,
        fats: 22,
        prepTime: 10,
        difficulty: "Easy",
        ingredients: ["Whole Grain Bread", "Avocado", "Egg", "Everything Seasoning"],
        matchScore: 0.88
      }
    ];
  },

  // Nutrition Analytics
  async fetchNutritionAnalytics(userId, period = "week") {
    // Replace with: const response = await fetch(`/api/analytics/${userId}/nutrition?period=${period}`);
    return {
      avgCalories: 2050,
      avgProtein: 125,
      avgCarbs: 180,
      avgFats: 78,
      goalAdherence: 82, // percentage
      streakDays: 5,
      favoriteFood: "Grilled Chicken",
      improvementAreas: ["Fiber Intake", "Hydration"],
      weeklyTrend: "improving",
      mealTimingConsistency: 87
    };
  },

  // Utilities
  formatDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long", 
      day: "numeric"
    });
  },

  calculateMacroPercentage(current, target) {
    return Math.round((current / target) * 100);
  },

  getMealIcon(mealType) {
    const icons = {
      "breakfast": "🌅",
      "lunch": "☀️",
      "dinner": "🌙",
      "snack": "🍎"
    };
    return icons[mealType.toLowerCase()] || "🍽️";
  },

  getDifficultyColor(difficulty) {
    const colors = {
      "Easy": "#4CAF50",
      "Medium": "#FF9800",
      "Hard": "#F44336"
    };
    return colors[difficulty] || "#757575";
  },

  calculateTotalMacros(meals) {
    return meals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fats: totals.fats + (meal.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }
};
