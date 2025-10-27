import {
  Plus,
  UtensilsCrossed,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Target,
  ChefHat,
  Award,
  Filter,
  Search,
  Pencil,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

const Meals = () => {
  const [mealPlans, setMealPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_weeks: 4,
    daily_calories: "",
    daily_protein: "",
    daily_carbs: "",
    daily_fats: "",
    plan_type: "weight_loss",
    difficulty_level: "beginner",
    meals_per_day: 3,
    is_active: true,
    is_dynamic: true,
    calorie_adjustment_percent: -0.20,
    protein_percent: 40,
    carbs_percent: 35,
    fat_percent: 25,
  });

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setIsLoading(true);

      // Fetch meal plans
      const { data: plans, error: plansError } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      // Fetch subscriber counts separately to avoid RLS issues
      const plansWithStats = [];
      for (const plan of (plans || [])) {
        try {
          const { count, error: countError } = await supabase
            .from('user_meal_plans')
            .select('*', { count: 'exact', head: true })
            .eq('meal_plan_id', plan.id);

          plansWithStats.push({
            ...plan,
            subscriber_count: countError ? 0 : (count || 0)
          });
        } catch (err) {
          // If count fails, just set to 0
          plansWithStats.push({
            ...plan,
            subscriber_count: 0
          });
        }
      }

      setMealPlans(plansWithStats);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      // Even if there's an error, try to set whatever data we have
      setMealPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Calculate default macros if not provided
      const calories = formData.daily_calories ? parseInt(formData.daily_calories) : 2000;
      const protein = formData.daily_protein ? parseInt(formData.daily_protein) : Math.round(calories * 0.30 / 4);
      const carbs = formData.daily_carbs ? parseInt(formData.daily_carbs) : Math.round(calories * 0.40 / 4);
      const fats = formData.daily_fats ? parseInt(formData.daily_fats) : Math.round(calories * 0.30 / 9);

      // Prepare data with proper type conversions and defaults
      const payload = {
        name: formData.name,
        description: formData.description,
        duration_weeks: parseInt(formData.duration_weeks) || 4,
        daily_calories: calories,
        daily_protein: protein,
        daily_carbs: carbs,
        daily_fats: fats,
        plan_type: formData.plan_type,
        difficulty_level: formData.difficulty_level,
        meals_per_day: parseInt(formData.meals_per_day) || 3,
        is_active: formData.is_active,
        is_dynamic: formData.is_dynamic,
        calorie_adjustment_percent: parseFloat(formData.calorie_adjustment_percent) || 0,
        protein_percent: parseInt(formData.protein_percent) || 30,
        carbs_percent: parseInt(formData.carbs_percent) || 40,
        fat_percent: parseInt(formData.fat_percent) || 30,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('meal_plan_templates')
          .update(payload)
          .eq('id', editingPlan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meal_plan_templates')
          .insert([payload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingPlan(null);
      resetForm();
      await fetchMealPlans();
    } catch (err) {
      console.error('Error saving meal plan:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Delete meal plan "${plan.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('meal_plan_templates')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;
      await fetchMealPlans();
    } catch (err) {
      alert('Error deleting plan: ' + err.message);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      duration_weeks: plan.duration_weeks || 4,
      daily_calories: plan.daily_calories || "",
      daily_protein: plan.daily_protein || "",
      daily_carbs: plan.daily_carbs || "",
      daily_fats: plan.daily_fats || "",
      plan_type: plan.plan_type || "weight_loss",
      difficulty_level: plan.difficulty_level || "beginner",
      meals_per_day: plan.meals_per_day || 3,
      is_active: plan.is_active !== false,
      is_dynamic: plan.is_dynamic !== false,
      calorie_adjustment_percent: plan.calorie_adjustment_percent || -0.20,
      protein_percent: plan.protein_percent || 40,
      carbs_percent: plan.carbs_percent || 35,
      fat_percent: plan.fat_percent || 25,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration_weeks: 4,
      daily_calories: "",
      daily_protein: "",
      daily_carbs: "",
      daily_fats: "",
      plan_type: "weight_loss",
      difficulty_level: "beginner",
      meals_per_day: 3,
      is_active: true,
      is_dynamic: true,
      calorie_adjustment_percent: -0.20,
      protein_percent: 40,
      carbs_percent: 35,
      fat_percent: 25,
    });
  };

  // Helper to update macro percentages when plan type changes
  const updateMacrosForPlanType = (planType) => {
    const macroPresets = {
      cutting: { cal: -0.20, protein: 40, carbs: 35, fat: 25 },
      weight_loss: { cal: -0.15, protein: 35, carbs: 40, fat: 25 },
      maintenance: { cal: 0.00, protein: 30, carbs: 40, fat: 30 },
      bulking: { cal: 0.15, protein: 30, carbs: 45, fat: 25 },
      keto: { cal: -0.10, protein: 25, carbs: 5, fat: 70 },
      vegan: { cal: 0.00, protein: 25, carbs: 50, fat: 25 },
      paleo: { cal: -0.10, protein: 35, carbs: 25, fat: 40 },
      mediterranean: { cal: 0.00, protein: 25, carbs: 45, fat: 30 },
    };

    const preset = macroPresets[planType] || macroPresets.maintenance;
    setFormData(prev => ({
      ...prev,
      plan_type: planType,
      calorie_adjustment_percent: preset.cal,
      protein_percent: preset.protein,
      carbs_percent: preset.carbs,
      fat_percent: preset.fat,
    }));
  };

  const mealTypes = [
    { value: "weight_loss", label: "Weight Loss", variant: "error", color: "red" },
    { value: "bulking", label: "Muscle Building", variant: "info", color: "blue" },
    { value: "cutting", label: "Cutting", variant: "warning", color: "orange" },
    { value: "keto", label: "Keto", variant: "purple", color: "purple" },
    { value: "maintenance", label: "Maintenance", variant: "success", color: "green" },
    { value: "vegan", label: "Vegan", variant: "success", color: "green" },
    { value: "paleo", label: "Paleo", variant: "warning", color: "orange" },
    { value: "mediterranean", label: "Mediterranean", variant: "info", color: "blue" },
  ];

  const getDifficultyIcon = (level) => {
    switch (level) {
      case 'beginner':
        return <Target className="h-4 w-4" />;
      case 'intermediate':
        return <Zap className="h-4 w-4" />;
      case 'advanced':
        return <Award className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Filtering and sorting logic
  const getFilteredAndSortedPlans = () => {
    let filtered = [...mealPlans];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.plan_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(plan => plan.plan_type === filterType);
    }

    // Apply difficulty filter
    if (filterDifficulty !== "all") {
      filtered = filtered.filter(plan => plan.difficulty_level === filterDifficulty);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      filtered = filtered.filter(plan => plan.is_active === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "calories":
          aVal = a.daily_calories || 0;
          bVal = b.daily_calories || 0;
          break;
        case "protein":
          aVal = a.daily_protein || 0;
          bVal = b.daily_protein || 0;
          break;
        case "subscribers":
          aVal = a.subscriber_count || 0;
          bVal = b.subscriber_count || 0;
          break;
        case "duration":
          aVal = a.duration_weeks || 0;
          bVal = b.duration_weeks || 0;
          break;
        case "created_at":
        default:
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredPlans = getFilteredAndSortedPlans();

  const totalPlans = mealPlans.length;
  const activePlans = mealPlans.filter(p => p.is_active).length;
  const avgCalories = Math.round(
    mealPlans.reduce((acc, p) => acc + (p.daily_calories || 0), 0) / (totalPlans || 1)
  );
  const totalSubscribers = mealPlans.reduce((acc, p) => acc + (p.subscriber_count || 0), 0);
  const activeFilterCount = [filterType, filterDifficulty, filterStatus].filter(f => f !== "all").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={UtensilsCrossed}
          title="Meal Plan Management"
          subtitle="Create and manage nutrition meal plans"
          breadcrumbs={['Admin', 'Meal Plans']}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingPlan(null);
                resetForm();
                setIsModalOpen(true);
              }}
            >
              Add Meal Plan
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <StatsCard
            title="Total Plans"
            value={totalPlans}
            icon={UtensilsCrossed}
            color="green"
            subtitle={`${activePlans} active`}
          />
          <StatsCard
            title="Total Subscribers"
            value={totalSubscribers}
            icon={Users}
            color="blue"
            subtitle="Across all plans"
          />
          <StatsCard
            title="Avg Daily Calories"
            value={avgCalories}
            icon={Flame}
            color="orange"
            subtitle="Per plan"
          />
          <StatsCard
            title="Plan Types"
            value={new Set(mealPlans.map(p => p.plan_type)).size}
            icon={ChefHat}
            color="purple"
            subtitle="Different categories"
          />
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search meal plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Sort Section */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
                <option value="calories">Calories</option>
                <option value="protein">Protein</option>
                <option value="subscribers">Subscribers</option>
                <option value="duration">Duration</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                <TrendingUp className={`h-4 w-4 text-gray-600 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="space-y-3">
            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Type:</span>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterType === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {mealTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterType === type.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Difficulty & Status Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 mr-1">Difficulty:</span>
                <button
                  onClick={() => setFilterDifficulty("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterDifficulty === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterDifficulty("beginner")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterDifficulty === "beginner"
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Beginner
                </button>
                <button
                  onClick={() => setFilterDifficulty("intermediate")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterDifficulty === "intermediate"
                      ? "bg-yellow-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Intermediate
                </button>
                <button
                  onClick={() => setFilterDifficulty("advanced")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterDifficulty === "advanced"
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Advanced
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 mr-1">Status:</span>
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "active"
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus("inactive")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "inactive"
                      ? "bg-gray-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Inactive
                </button>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterType("all");
                    setFilterDifficulty("all");
                    setFilterStatus("all");
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                >
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meal Plans Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <UtensilsCrossed className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No meal plans found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || activeFilterCount > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first meal plan"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-56">
                      Meal Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Calorie Strategy
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Macro Split
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Subscribers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPlans.map((plan) => {
                    const type = mealTypes.find(t => t.value === plan.plan_type);
                    const getTypeColor = () => {
                      switch(type?.color) {
                        case 'red': return 'bg-red-500';
                        case 'blue': return 'bg-blue-500';
                        case 'orange': return 'bg-orange-500';
                        case 'purple': return 'bg-purple-500';
                        case 'green': return 'bg-green-500';
                        default: return 'bg-green-500';
                      }
                    };

                    return (
                      <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                        {/* Meal Plan Name & Description */}
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`h-9 w-9 rounded-lg ${getTypeColor()} flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5`}>
                              <ChefHat className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-gray-900 truncate">{plan.name}</p>
                              <p className="text-xs text-gray-500 leading-snug">{plan.description}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={type?.variant || 'default'}>
                            {type?.label || plan.plan_type}
                          </Badge>
                        </td>

                        {/* Difficulty with Icon */}
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium text-xs ${getDifficultyColor(plan.difficulty_level)}`}>
                            {getDifficultyIcon(plan.difficulty_level)}
                            <span className="capitalize">{plan.difficulty_level}</span>
                          </div>
                        </td>

                        {/* Calorie Strategy - Dynamic or Static */}
                        <td className="px-4 py-3">
                          {plan.is_dynamic ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                                  plan.calorie_adjustment_percent < 0
                                    ? 'bg-red-100 text-red-700'
                                    : plan.calorie_adjustment_percent > 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {plan.calorie_adjustment_percent > 0 ? '+' : ''}
                                  {(plan.calorie_adjustment_percent * 100).toFixed(0)}%
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-500 leading-tight">
                                {plan.calorie_adjustment_percent < 0 ? 'Deficit' :
                                 plan.calorie_adjustment_percent > 0 ? 'Surplus' : 'Maintenance'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold w-fit">
                                {plan.daily_calories || 0} cal
                              </div>
                              <p className="text-[9px] text-gray-500 leading-tight">Static</p>
                            </div>
                          )}
                        </td>

                        {/* Macro Split - Percentages or Grams */}
                        <td className="px-4 py-3">
                          {plan.is_dynamic ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Beef className="h-3 w-3 text-red-500" />
                                <span className="text-xs font-semibold text-gray-900">{plan.protein_percent}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Wheat className="h-3 w-3 text-amber-500" />
                                <span className="text-xs font-semibold text-gray-900">{plan.carbs_percent}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Droplet className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs font-semibold text-gray-900">{plan.fat_percent}%</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded bg-orange-50 flex items-center justify-center flex-shrink-0">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-900 leading-tight">{plan.daily_calories || 0}</p>
                                  <p className="text-[9px] text-gray-500 leading-tight">cal</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
                                  <Beef className="h-3 w-3 text-red-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-900 leading-tight">{plan.daily_protein || 0}g</p>
                                  <p className="text-[9px] text-gray-500 leading-tight">pro</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded bg-yellow-50 flex items-center justify-center flex-shrink-0">
                                  <Droplet className="h-3 w-3 text-yellow-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-900 leading-tight">{plan.daily_fats || 0}g</p>
                                  <p className="text-[9px] text-gray-500 leading-tight">fat</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded bg-amber-50 flex items-center justify-center flex-shrink-0">
                                  <Wheat className="h-3 w-3 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-900 leading-tight">{plan.daily_carbs || 0}g</p>
                                  <p className="text-[9px] text-gray-500 leading-tight">carb</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100 w-fit">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700 whitespace-nowrap">{plan.duration_weeks}w</span>
                          </div>
                        </td>

                        {/* Subscribers Count */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100 w-fit">
                            <Users className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-700">{plan.subscriber_count || 0}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                            plan.is_active
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(plan)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit meal plan"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(plan)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete meal plan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredPlans.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalPlans}</span> meal plans
            </p>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPlan(null);
            resetForm();
          }}
          title={editingPlan ? 'Edit Meal Plan' : 'Create New Meal Plan'}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPlan(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-blue-600" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Plan Name"
                    placeholder="e.g., High Protein Bulking Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe this meal plan and its benefits..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Configuration */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  Plan Configuration
                </h3>

                {/* Dynamic vs Static Toggle */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.is_dynamic}
                        onChange={(e) => setFormData({ ...formData, is_dynamic: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Dynamic Calculation</span>
                      <p className="text-xs text-gray-600">
                        {formData.is_dynamic
                          ? 'Personalized based on user activity & body metrics'
                          : 'Static values for all users'
                        }
                      </p>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Type
                    </label>
                    <select
                      value={formData.plan_type}
                      onChange={(e) => updateMacrosForPlanType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      {mealTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Auto-fills macro percentages</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (weeks)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={formData.duration_weeks}
                        onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meals Per Day
                    </label>
                    <div className="relative">
                      <UtensilsCrossed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.meals_per_day}
                        onChange={(e) => setFormData({ ...formData, meals_per_day: parseInt(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Nutrition Targets */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-600" />
                  {formData.is_dynamic ? 'Calorie & Macro Strategy' : 'Daily Nutrition Targets'}
                </h3>

                {formData.is_dynamic ? (
                  /* DYNAMIC MODE - Percentages and Adjustments */
                  <div className="space-y-4">
                    {/* Calorie Adjustment Slider */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calorie Adjustment (% from Daily Needs)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          step="5"
                          value={formData.calorie_adjustment_percent * 100}
                          onChange={(e) => setFormData({
                            ...formData,
                            calorie_adjustment_percent: parseInt(e.target.value) / 100
                          })}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm min-w-[100px] text-center ${
                          formData.calorie_adjustment_percent < 0
                            ? 'bg-red-100 text-red-700'
                            : formData.calorie_adjustment_percent > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {formData.calorie_adjustment_percent > 0 ? '+' : ''}
                          {(formData.calorie_adjustment_percent * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>-30% (Deficit)</span>
                        <span>0% (Maintenance)</span>
                        <span>+30% (Surplus)</span>
                      </div>
                    </div>

                    {/* Macro Percentages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Macro Split (must equal 100%)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                            <Beef className="h-3 w-3 text-red-500" />
                            Protein
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.protein_percent}
                              onChange={(e) => setFormData({...formData, protein_percent: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-center font-semibold"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                            <Wheat className="h-3 w-3 text-amber-500" />
                            Carbs
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.carbs_percent}
                              onChange={(e) => setFormData({...formData, carbs_percent: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-center font-semibold"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                            <Droplet className="h-3 w-3 text-yellow-500" />
                            Fat
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.fat_percent}
                              onChange={(e) => setFormData({...formData, fat_percent: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm text-center font-semibold"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Validation Message */}
                      <div className={`mt-2 p-2 rounded-lg text-xs font-medium ${
                        formData.protein_percent + formData.carbs_percent + formData.fat_percent === 100
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        Total: {formData.protein_percent + formData.carbs_percent + formData.fat_percent}%
                        {formData.protein_percent + formData.carbs_percent + formData.fat_percent === 100 ? ' ✓' : ' - Must equal 100%'}
                      </div>
                    </div>

                    {/* Example Calculation */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-gray-700 mb-2">💡 Example (80kg, 180cm, 30yo, moderate activity):</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Base Calories:</span>
                          <span className="font-bold text-gray-900 ml-1">~1,850 cal</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Daily Needs:</span>
                          <span className="font-bold text-gray-900 ml-1">~2,867 cal</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Target:</span>
                          <span className="font-bold text-orange-700 ml-1">
                            ~{Math.round(2867 * (1 + formData.calorie_adjustment_percent))} cal
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-bold ml-1 ${
                            formData.calorie_adjustment_percent < 0 ? 'text-red-700' :
                            formData.calorie_adjustment_percent > 0 ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {formData.calorie_adjustment_percent < 0 ? 'Deficit' :
                             formData.calorie_adjustment_percent > 0 ? 'Surplus' : 'Maintenance'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STATIC MODE - Fixed Grams */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                        Calories
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 2500"
                        value={formData.daily_calories}
                        onChange={(e) => setFormData({ ...formData, daily_calories: parseInt(e.target.value) || '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Beef className="h-3.5 w-3.5 text-red-500" />
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 180"
                        value={formData.daily_protein}
                        onChange={(e) => setFormData({ ...formData, daily_protein: parseInt(e.target.value) || '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Wheat className="h-3.5 w-3.5 text-amber-500" />
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 300"
                        value={formData.daily_carbs}
                        onChange={(e) => setFormData({ ...formData, daily_carbs: parseInt(e.target.value) || '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Droplet className="h-3.5 w-3.5 text-yellow-500" />
                        Fats (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 70"
                        value={formData.daily_fats}
                        onChange={(e) => setFormData({ ...formData, daily_fats: parseInt(e.target.value) || '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Toggle */}
              <div className="pt-3 border-t">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Active Status</span>
                    <p className="text-xs text-gray-500">Make this meal plan visible to users</p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Meals;
