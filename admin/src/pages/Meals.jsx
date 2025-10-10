import {
  Plus,
  UtensilsCrossed,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Calendar,
  Clock,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
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
  });

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
      setMealPlans(data || []);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('meal_plan_templates')
          .update(formData)
          .eq('id', editingPlan.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meal_plan_templates')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingPlan(null);
      resetForm();
      await fetchMealPlans();
    } catch (err) {
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
    });
  };

  const mealTypes = [
    { value: "weight_loss", label: "Weight Loss", variant: "error" },
    { value: "bulking", label: "Muscle Building", variant: "info" },
    { value: "cutting", label: "Cutting", variant: "warning" },
    { value: "keto", label: "Keto", variant: "purple" },
    { value: "maintenance", label: "Maintenance", variant: "success" },
    { value: "vegan", label: "Vegan", variant: "success" },
    { value: "paleo", label: "Paleo", variant: "warning" },
    { value: "mediterranean", label: "Mediterranean", variant: "info" },
  ];

  const columns = [
    {
      header: 'Meal Plan',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'plan_type',
      render: (row) => {
        const type = mealTypes.find(t => t.value === row.plan_type);
        return <Badge variant={type?.variant || 'default'}>{type?.label || row.plan_type}</Badge>;
      }
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty_level',
      render: (row) => {
        const variants = {
          'beginner': 'success',
          'intermediate': 'warning',
          'advanced': 'error'
        };
        return <Badge variant={variants[row.difficulty_level]}>{row.difficulty_level}</Badge>;
      }
    },
    {
      header: 'Nutrition',
      accessor: 'nutrition',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Flame className="h-3 w-3 text-orange-500" />
            <span>{row.daily_calories || 0} cal</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Beef className="h-3 w-3 text-red-500" />
            <span>{row.daily_protein || 0}g protein</span>
          </div>
        </div>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration_weeks',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{row.duration_weeks} weeks</span>
        </div>
      )
    },
    {
      header: 'Meals/Day',
      accessor: 'meals_per_day',
      render: (row) => (
        <Badge variant="info">{row.meals_per_day} meals</Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'default'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ];

  const filteredPlans = mealPlans.filter(plan =>
    plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.plan_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPlans = mealPlans.length;
  const activePlans = mealPlans.filter(p => p.is_active).length;
  const avgCalories = Math.round(
    mealPlans.reduce((acc, p) => acc + (p.daily_calories || 0), 0) / (totalPlans || 1)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Plans"
            value={totalPlans}
            icon={UtensilsCrossed}
            color="green"
            subtitle={`${activePlans} active`}
          />
          <StatsCard
            title="Avg Daily Calories"
            value={avgCalories}
            icon={Flame}
            color="orange"
            subtitle="Across all plans"
          />
          <StatsCard
            title="Plan Types"
            value={new Set(mealPlans.map(p => p.plan_type)).size}
            icon={TrendingUp}
            color="purple"
            subtitle="Different categories"
          />
        </div>

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search meal plans..."
          showExport={true}
          onExportClick={() => alert('Export functionality coming soon!')}
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredPlans}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={['edit', 'delete']}
          emptyMessage="No meal plans found"
        />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPlan(null);
            resetForm();
          }}
          title={editingPlan ? 'Edit Meal Plan' : 'Create Meal Plan'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Plan Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Plan Type"
                value={formData.plan_type}
                onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                options={mealTypes.map(t => ({ value: t.value, label: t.label }))}
                required
              />
              
              <Select
                label="Difficulty Level"
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (weeks)"
                type="number"
                value={formData.duration_weeks}
                onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                icon={Calendar}
                required
              />
              
              <Input
                label="Meals Per Day"
                type="number"
                value={formData.meals_per_day}
                onChange={(e) => setFormData({ ...formData, meals_per_day: parseInt(e.target.value) })}
                icon={UtensilsCrossed}
                required
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Nutrition Targets</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Calories"
                  type="number"
                  value={formData.daily_calories}
                  onChange={(e) => setFormData({ ...formData, daily_calories: parseInt(e.target.value) })}
                  icon={Flame}
                />
                
                <Input
                  label="Protein (g)"
                  type="number"
                  value={formData.daily_protein}
                  onChange={(e) => setFormData({ ...formData, daily_protein: parseInt(e.target.value) })}
                  icon={Beef}
                />
                
                <Input
                  label="Carbs (g)"
                  type="number"
                  value={formData.daily_carbs}
                  onChange={(e) => setFormData({ ...formData, daily_carbs: parseInt(e.target.value) })}
                  icon={Wheat}
                />
                
                <Input
                  label="Fats (g)"
                  type="number"
                  value={formData.daily_fats}
                  onChange={(e) => setFormData({ ...formData, daily_fats: parseInt(e.target.value) })}
                  icon={Droplet}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active (visible to users)
              </label>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Meals;
