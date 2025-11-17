/**
 * AllergenDetectionService.js
 * 
 * Service for detecting dietary restrictions and allergens in food items
 * based on ingredients, descriptions, and food categories.
 */

/**
 * Allergen keyword mappings for different dietary restrictions
 */
const ALLERGEN_KEYWORDS = {
  'gluten-free': {
    keywords: [
      'wheat', 'barley', 'rye', 'gluten', 'malt', 'triticale', 
      'flour', 'bread', 'pasta', 'couscous', 'seitan', 'semolina',
      'spelt', 'farro', 'bulgur', 'wheat germ', 'wheat bran'
    ],
    categories: ['bread', 'pasta', 'cereal', 'baked goods']
  },
  'dairy-free': {
    keywords: [
      'milk', 'cheese', 'butter', 'cream', 'whey', 'casein', 
      'lactose', 'yogurt', 'yoghurt', 'ghee', 'buttermilk',
      'curd', 'dairy', 'milk powder', 'condensed milk', 'evaporated milk',
      'half and half', 'sour cream', 'creme', 'fromage', 'queso'
    ],
    categories: ['dairy', 'cheese', 'milk', 'yogurt', 'ice cream']
  },
  'nut-free': {
    keywords: [
      'nut', 'almond', 'cashew', 'walnut', 'peanut', 'pecan',
      'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut',
      'chestnut', 'groundnut', 'nut butter', 'nutella', 'marzipan',
      'praline', 'gianduja', 'amaretto'
    ],
    categories: ['nuts', 'nut butter', 'trail mix']
  },
  'soy-free': {
    keywords: [
      'soy', 'tofu', 'tempeh', 'edamame', 'miso', 'soya',
      'soybean', 'soy sauce', 'tamari', 'shoyu', 'natto',
      'textured vegetable protein', 'tvp', 'soy protein', 'soy lecithin',
      'soy flour', 'soy milk'
    ],
    categories: ['soy', 'tofu', 'soy products']
  }
};

/**
 * Detects allergens in a food item based on its text content
 * 
 * @param {Object} food - Food item from FoodData API
 * @param {string} food.description - Food description
 * @param {string} food.ingredients - Ingredients list (may be undefined)
 * @param {string} food.foodCategory - Food category (may be undefined)
 * @param {Array<string>} userRestrictions - User's dietary restrictions
 * @returns {Object} Detection results with violations array
 */
export const detectAllergens = (food, userRestrictions = []) => {
  if (!food || !userRestrictions || userRestrictions.length === 0) {
    return { hasViolations: false, violations: [] };
  }

  // Combine all text fields for searching
  const searchText = [
    food.description || '',
    food.ingredients || '',
    food.foodCategory || '',
    food.brandOwner || '',
    food.additionalDescriptions || ''
  ].join(' ').toLowerCase();

  const violations = [];

  // Check each user restriction
  userRestrictions.forEach(restriction => {
    const allergenData = ALLERGEN_KEYWORDS[restriction];
    
    if (!allergenData) return; // Skip unknown restrictions

    // Check keywords
    const hasKeywordMatch = allergenData.keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );

    // Check categories
    const hasCategoryMatch = allergenData.categories.some(category =>
      searchText.includes(category.toLowerCase())
    );

    if (hasKeywordMatch || hasCategoryMatch) {
      violations.push(restriction);
    }
  });

  return {
    hasViolations: violations.length > 0,
    violations,
    searchText: searchText.substring(0, 200) // For debugging
  };
};

/**
 * Gets a human-readable label for a restriction
 * 
 * @param {string} restriction - Restriction key (e.g., 'gluten-free')
 * @returns {string} Human-readable label
 */
export const getRestrictionLabel = (restriction) => {
  const labels = {
    'gluten-free': 'Gluten',
    'dairy-free': 'Dairy',
    'nut-free': 'Nuts',
    'soy-free': 'Soy'
  };
  return labels[restriction] || restriction;
};

/**
 * Gets an icon name for a restriction (for UI display)
 * 
 * @param {string} restriction - Restriction key
 * @returns {string} Ionicons icon name
 */
export const getRestrictionIcon = (restriction) => {
  const icons = {
    'gluten-free': 'leaf-outline',
    'dairy-free': 'water-outline',
    'nut-free': 'close-circle-outline',
    'soy-free': 'nutrition-outline'
  };
  return icons[restriction] || 'alert-circle-outline';
};

/**
 * Filters foods based on dietary restrictions
 * 
 * @param {Array} foods - Array of food items
 * @param {Array<string>} userRestrictions - User's dietary restrictions
 * @param {boolean} filterEnabled - Whether to filter out restricted foods
 * @returns {Array} Filtered/annotated foods
 */
export const filterFoodsByRestrictions = (foods, userRestrictions = [], filterEnabled = false) => {
  if (!userRestrictions || userRestrictions.length === 0) {
    return foods.map(food => ({ ...food, violatesRestrictions: false, violations: [] }));
  }

  return foods.map(food => {
    const detection = detectAllergens(food, userRestrictions);
    return {
      ...food,
      violatesRestrictions: detection.hasViolations,
      violations: detection.violations
    };
  }).filter(food => {
    // If filter is disabled, show all foods (but still annotated)
    if (!filterEnabled) return true;
    // If filter is enabled, hide restricted foods
    return !food.violatesRestrictions;
  });
};

/**
 * Gets a warning message for restricted foods
 * 
 * @param {Array<string>} violations - Array of violated restrictions
 * @returns {string} Warning message
 */
export const getRestrictionWarning = (violations = []) => {
  if (violations.length === 0) return '';
  
  const labels = violations.map(v => getRestrictionLabel(v));
  
  if (labels.length === 1) {
    return `Contains ${labels[0]}`;
  } else if (labels.length === 2) {
    return `Contains ${labels[0]} and ${labels[1]}`;
  } else {
    return `Contains ${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
  }
};

export default {
  detectAllergens,
  getRestrictionLabel,
  getRestrictionIcon,
  filterFoodsByRestrictions,
  getRestrictionWarning
};
