import {
  X,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Activity,
  UtensilsCrossed,
  Flame,
  Beef,
  Wheat,
  Droplet,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const Meals = () => {
  const [mealPlans, setMealPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch meal plans from Supabase on mount
  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database format to component format
      const transformedPlans = data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        duration: plan.duration_weeks?.toString() || '4',
        calories: plan.daily_calories?.toString() || '',
        protein: plan.daily_protein?.toString() || '',
        carbs: plan.daily_carbs?.toString() || '',
        fats: plan.daily_fats?.toString() || '',
        type: plan.plan_type || 'weight_loss',
        difficulty: plan.difficulty_level || 'beginner',
        mealsPerDay: plan.meals_per_day?.toString() || '3',
        active: plan.is_active !== false,
      }));

      setMealPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      alert('Failed to load meal plans. Please check your Supabase connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "4",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    type: "weight_loss",
    difficulty: "beginner",
    mealsPerDay: "3",
    active: true,
  });

  const mealTypes = [
    { value: "weight_loss", label: "Weight Loss", color: "bg-red-100 text-red-800" },
    { value: "bulking", label: "Muscle Building", color: "bg-blue-100 text-blue-800" },
    { value: "cutting", label: "Cutting", color: "bg-orange-100 text-orange-800" },
    { value: "keto", label: "Keto", color: "bg-purple-100 text-purple-800" },
    { value: "maintenance", label: "Maintenance", color: "bg-green-100 text-green-800" },
    { value: "vegan", label: "Vegan", color: "bg-emerald-100 text-emerald-800" },
    { value: "paleo", label: "Paleo", color: "bg-yellow-100 text-yellow-800" },
    { value: "mediterranean", label: "Mediterranean", color: "bg-cyan-100 text-cyan-800" },
  ];

  const difficultyLevels = ["beginner", "intermediate", "advanced"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing plan in Supabase
      updateMealPlan(editingId, formData);
    } else {
      // Create new plan in Supabase
      createMealPlan(formData);
    }
  };

  const createMealPlan = async (planData) => {
    try {
      const { data, error } = await supabase
        .from('meal_plan_templates')
        .insert([{
          name: planData.name,
          description: planData.description,
          duration_weeks: parseInt(planData.duration),
          plan_type: planData.type,
          daily_calories: parseInt(planData.calories),
          daily_protein: parseInt(planData.protein),
          daily_carbs: parseInt(planData.carbs),
          daily_fats: parseInt(planData.fats),
          protein_percentage: calculateMacroPercentages(
            parseFloat(planData.protein),
            parseFloat(planData.carbs),
            parseFloat(planData.fats)
          ).protein,
          carbs_percentage: calculateMacroPercentages(
            parseFloat(planData.protein),
            parseFloat(planData.carbs),
            parseFloat(planData.fats)
          ).carbs,
          fats_percentage: calculateMacroPercentages(
            parseFloat(planData.protein),
            parseFloat(planData.carbs),
            parseFloat(planData.fats)
          ).fats,
          difficulty_level: planData.difficulty,
          meals_per_day: parseInt(planData.mealsPerDay),
          is_active: planData.active,
        }])
        .select();

      if (error) throw error;

      alert('Meal plan created successfully!');
      handleCancel();
      fetchMealPlans(); // Refresh the list
    } catch (error) {
      console.error('Error creating meal plan:', error);
      alert('Failed to create meal plan: ' + error.message);
    }
  };

  const updateMealPlan = async (id, planData) => {
    try {
      const { error } = await supabase
        .from('meal_plan_templates')
        .update({
          name: planData.name,
          description: planData.description,
          duration_weeks: parseInt(planData.duration),
          plan_type: planData.type,
          daily_calories: parseInt(planData.calories),
          daily_protein: parseInt(planData.protein),
          daily_carbs: parseInt(planData.carbs),
          daily_fats: parseInt(planData.fats),
          protein_percentage: calculateMacroPercentages(
            parseFloat(planData.protein),
            parseFloat(planData.carbs),
            parseFloat(planData.fats)
          ).protein,
          carbs_percentage: calculateMacroPercentages(
            parseFloat(planData.protein),
            parseFloat(planData.carbs),
            parseFloat(planData.fats)
          ).carbs,
          fats_percentage: calculateMacroPercentages(
            parseFloat(planData.protein),
            parseFloat(planData.carbs),
            parseFloat(planData.fats)
          ).fats,
          difficulty_level: planData.difficulty,
          meals_per_day: parseInt(planData.mealsPerDay),
          is_active: planData.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      alert('Meal plan updated successfully!');
      handleCancel();
      fetchMealPlans(); // Refresh the list
    } catch (error) {
      console.error('Error updating meal plan:', error);
      alert('Failed to update meal plan: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this meal plan? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('meal_plan_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Meal plan deleted successfully!');
      fetchMealPlans(); // Refresh the list
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      alert('Failed to delete meal plan: ' + error.message);
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setFormData(plan);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      duration: "4",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
      type: "weight_loss",
      difficulty: "beginner",
      mealsPerDay: "3",
      active: true,
    });
  };

  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  };

  // Calculate macro percentages
  const calculateMacroPercentages = (protein, carbs, fats) => {
    const proteinCals = protein * 4;
    const carbsCals = carbs * 4;
    const fatsCals = fats * 9;
    const totalCals = proteinCals + carbsCals + fatsCals;
    
    return {
      protein: Math.round((proteinCals / totalCals) * 100) || 0,
      carbs: Math.round((carbsCals / totalCals) * 100) || 0,
      fats: Math.round((fatsCals / totalCals) * 100) || 0,
    };
  };

  // Get plan type color
  const getPlanTypeColor = (type) => {
    const planType = mealTypes.find(t => t.value === type);
    return planType ? planType.color : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl md:text-left text-center font-bold text-gray-900">
          Meal Planning
        </h2>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Create Meal Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Plans</h3>
          <p className="text-3xl font-bold text-green-600">
            {mealPlans.length}
          </p>
          <p className="text-sm text-gray-600">+1 when you add new plan</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Most Popular</h3>
          <p className="text-xl font-bold text-blue-600">Weight Loss</p>
          <p className="text-sm text-gray-600">1,897 followers</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Adherence Rate</h3>
          <p className="text-3xl font-bold text-purple-600">84.2%</p>
          <p className="text-sm text-gray-600">+5.1% vs last month</p>
        </div>
      </div>

      {/* Meal Plans */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Meal Plans</h3>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent mb-3"></div>
            <p className="text-gray-500">Loading meal plans from database...</p>
          </div>
        ) : mealPlans.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No meal plans yet</p>
            <p className="text-sm text-gray-400">Create your first meal plan to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealPlans.map((plan) => {
              const macroPercentages = plan.protein && plan.carbs && plan.fats 
                ? calculateMacroPercentages(plan.protein, plan.carbs, plan.fats)
                : null;
              
              return (
                <div
                  key={plan.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all hover:border-green-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{plan.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPlanTypeColor(plan.type)}`}>
                        {mealTypes.find(t => t.value === plan.type)?.label || plan.type}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        plan.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {plan.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {/* Macros Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-red-50 p-2 rounded">
                      <div className="flex items-center gap-1 mb-1">
                        <Flame className="h-3 w-3 text-red-600" />
                        <span className="text-xs font-medium text-gray-600">Calories</span>
                      </div>
                      <p className="text-lg font-bold text-red-600">{plan.calories}</p>
                      <p className="text-xs text-gray-500">kcal/day</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="flex items-center gap-1 mb-1">
                        <Beef className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-gray-600">Protein</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{plan.protein || '-'}</p>
                      <p className="text-xs text-gray-500">{macroPercentages ? `${macroPercentages.protein}%` : 'g/day'}</p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="flex items-center gap-1 mb-1">
                        <Wheat className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium text-gray-600">Carbs</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-600">{plan.carbs || '-'}</p>
                      <p className="text-xs text-gray-500">{macroPercentages ? `${macroPercentages.carbs}%` : 'g/day'}</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="flex items-center gap-1 mb-1">
                        <Droplet className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium text-gray-600">Fats</span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">{plan.fats || '-'}</p>
                      <p className="text-xs text-gray-500">{macroPercentages ? `${macroPercentages.fats}%` : 'g/day'}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-1 mb-3 text-xs text-gray-600">
                    <p>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Duration: {plan.duration} weeks
                    </p>
                    {plan.difficulty && (
                      <p>
                        <Activity className="inline h-3 w-3 mr-1" />
                        Level: <span className="capitalize">{plan.difficulty}</span>
                      </p>
                    )}
                    {plan.mealsPerDay && (
                      <p>
                        <UtensilsCrossed className="inline h-3 w-3 mr-1" />
                        {plan.mealsPerDay} meals/day
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleViewDetails(plan)}
                      className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 rounded text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ View Details Modal */}
      {isDetailsOpen && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold">
                  {selectedPlan.name}
                </h3>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur`}>
                {mealTypes.find(t => t.value === selectedPlan.type)?.label || selectedPlan.type}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              {selectedPlan.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{selectedPlan.description}</p>
                </div>
              )}

              {/* Macros Grid */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Daily Targets</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-red-200 rounded-lg">
                        <Flame className="h-5 w-5 text-red-700" />
                      </div>
                      <span className="font-semibold text-gray-700">Calories</span>
                    </div>
                    <p className="text-3xl font-bold text-red-700">{selectedPlan.calories}</p>
                    <p className="text-sm text-red-600 mt-1">kcal per day</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-blue-200 rounded-lg">
                        <Beef className="h-5 w-5 text-blue-700" />
                      </div>
                      <span className="font-semibold text-gray-700">Protein</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{selectedPlan.protein || '-'}</p>
                    <p className="text-sm text-blue-600 mt-1">grams per day</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-yellow-200 rounded-lg">
                        <Wheat className="h-5 w-5 text-yellow-700" />
                      </div>
                      <span className="font-semibold text-gray-700">Carbs</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-700">{selectedPlan.carbs || '-'}</p>
                    <p className="text-sm text-yellow-600 mt-1">grams per day</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-purple-200 rounded-lg">
                        <Droplet className="h-5 w-5 text-purple-700" />
                      </div>
                      <span className="font-semibold text-gray-700">Fats</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-700">{selectedPlan.fats || '-'}</p>
                    <p className="text-sm text-purple-600 mt-1">grams per day</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedPlan.duration} weeks</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Difficulty</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{selectedPlan.difficulty || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Meals Per Day</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedPlan.mealsPerDay || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                  <p className={`text-lg font-semibold ${selectedPlan.active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedPlan.active ? '✓ Active' : '✗ Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Meal Plan" : "Create New Meal Plan"}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Weight Loss Pro"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe this meal plan..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      {mealTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level *
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white capitalize"
                    >
                      {difficultyLevels.map((level) => (
                        <option key={level} value={level} className="capitalize">
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (weeks) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 4"
                      min="1"
                      max="52"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meals Per Day *
                    </label>
                    <input
                      type="number"
                      name="mealsPerDay"
                      value={formData.mealsPerDay}
                      onChange={handleInputChange}
                      placeholder="e.g., 3"
                      min="1"
                      max="8"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Daily Macros */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Daily Macro Targets</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-red-600" />
                      Calories (kcal) *
                    </label>
                    <input
                      type="number"
                      name="calories"
                      value={formData.calories}
                      onChange={handleInputChange}
                      placeholder="e.g., 2000"
                      min="800"
                      max="5000"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Beef className="h-4 w-4 text-blue-600" />
                      Protein (grams) *
                    </label>
                    <input
                      type="number"
                      name="protein"
                      value={formData.protein}
                      onChange={handleInputChange}
                      placeholder="e.g., 150"
                      min="20"
                      max="500"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-yellow-600" />
                      Carbs (grams) *
                    </label>
                    <input
                      type="number"
                      name="carbs"
                      value={formData.carbs}
                      onChange={handleInputChange}
                      placeholder="e.g., 200"
                      min="0"
                      max="800"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-purple-600" />
                      Fats (grams) *
                    </label>
                    <input
                      type="number"
                      name="fats"
                      value={formData.fats}
                      onChange={handleInputChange}
                      placeholder="e.g., 65"
                      min="10"
                      max="300"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Macro Preview */}
                {formData.protein && formData.carbs && formData.fats && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Macro Distribution</p>
                    <div className="flex gap-4 text-sm">
                      {(() => {
                        const percentages = calculateMacroPercentages(
                          parseFloat(formData.protein),
                          parseFloat(formData.carbs),
                          parseFloat(formData.fats)
                        );
                        return (
                          <>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="font-medium">{percentages.protein}%</span>
                              <span className="text-gray-500">Protein</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="font-medium">{percentages.carbs}%</span>
                              <span className="text-gray-500">Carbs</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="font-medium">{percentages.fats}%</span>
                              <span className="text-gray-500">Fats</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Set as active plan (users can enroll)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm"
                >
                  {editingId ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meals;
