import {
  X,
  Plus,
  Edit,
  Trash2,
  Upload,
  Calendar,
  Dumbbell,
  Activity,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using root .env via Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = SUPABASE_SERVICE || SUPABASE_ANON || '';
const supabase = createClient(SUPABASE_URL, supabaseKey);

const Workouts = () => {
  // State for Supabase data
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentView, setCurrentView] = useState('categories'); // 'categories', 'templates', 'exercises'
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [createType, setCreateType] = useState('category'); // 'category', 'template', 'exercise'
  const [editingItem, setEditingItem] = useState(null);
  
  // Form Data
  const [categoryForm, setCategoryForm] = useState({
    name: '', description: '', icon: '', emoji: '', color: '#A3E635', 
    display_order: 0, is_active: true
  });
  
  const [templateForm, setTemplateForm] = useState({
    category_id: '', name: '', description: '', difficulty: 'Beginner',
    duration_minutes: 30, estimated_calories: 200, equipment: [], muscle_groups: [],
    is_active: true
  });
  
  const [exerciseForm, setExerciseForm] = useState({
    template_id: '', exercise_name: '', description: '', sets: 3, reps: '10-12',
    rest_seconds: 60, calories_per_set: 10, muscle_groups: [], equipment: [],
    tips: [], order_index: 1
  });

  // Fetch data from Supabase
  useEffect(() => {
    fetchWorkoutData();
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    fetchWorkoutData();
  }, []);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('workout_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('workout_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;

      setCategories(categoriesData || []);
      setTemplates(templatesData || []);
      setExercises(exercisesData || []);
    } catch (err) {
      console.error('Error fetching workout data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Navigation helpers
  const showCategories = () => {
    setCurrentView('categories');
    setSelectedCategory(null);
    setSelectedTemplate(null);
  };

  const showTemplates = (category) => {
    setCurrentView('templates');
    setSelectedCategory(category);
    setSelectedTemplate(null);
  };

  const showExercises = (template) => {
    setCurrentView('exercises');
    setSelectedTemplate(template);
  };

  // Data helpers
  const getCategoryTemplates = (categoryId) => {
    return templates.filter(t => t.category_id === categoryId);
  };

  const getTemplateExercises = (templateId) => {
    return exercises.filter(e => e.template_id === templateId);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': 'bg-green-100 text-green-800',
      'Intermediate': 'bg-yellow-100 text-yellow-800',
      'Advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  // CRUD Operations
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('workout_categories')
        .insert([categoryForm])
        .select();
      
      if (error) throw error;
      
      setCategories([...categories, data[0]]);
      setIsCreateModalOpen(false);
      setCategoryForm({ name: '', description: '', icon: '', emoji: '', color: '#A3E635', display_order: 0, is_active: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .insert([{
          ...templateForm,
          equipment: JSON.stringify(templateForm.equipment),
          muscle_groups: JSON.stringify(templateForm.muscle_groups)
        }])
        .select();
      
      if (error) throw error;
      
      setTemplates([...templates, data[0]]);
      setIsCreateModalOpen(false);
      setTemplateForm({
        category_id: '', name: '', description: '', difficulty: 'Beginner',
        duration_minutes: 30, estimated_calories: 200, equipment: [], muscle_groups: [],
        is_active: true
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert([{
          ...exerciseForm,
          muscle_groups: JSON.stringify(exerciseForm.muscle_groups),
          equipment: JSON.stringify(exerciseForm.equipment),
          tips: JSON.stringify(exerciseForm.tips)
        }])
        .select();
      
      if (error) throw error;
      
      setExercises([...exercises, data[0]]);
      setIsCreateModalOpen(false);
      setExerciseForm({
        template_id: '', exercise_name: '', description: '', sets: 3, reps: '10-12',
        rest_seconds: 60, calories_per_set: 10, muscle_groups: [], equipment: [],
        tips: [], order_index: 1
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const tableName = type === 'category' ? 'workout_categories' : 
                       type === 'template' ? 'workout_templates' : 'workout_exercises';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (type === 'category') {
        setCategories(categories.filter(c => c.id !== id));
        if (selectedCategory?.id === id) showCategories();
      } else if (type === 'template') {
        setTemplates(templates.filter(t => t.id !== id));
        if (selectedTemplate?.id === id) setSelectedTemplate(null);
      } else {
        setExercises(exercises.filter(e => e.id !== id));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (type, item) => {
    setEditingItem({ type, item });
    
    if (type === 'category') {
      setCategoryForm(item);
    } else if (type === 'template') {
      setTemplateForm({
        ...item,
        equipment: Array.isArray(item.equipment) ? item.equipment : [],
        muscle_groups: Array.isArray(item.muscle_groups) ? item.muscle_groups : []
      });
    } else {
      setExerciseForm({
        ...item,
        muscle_groups: Array.isArray(item.muscle_groups) ? item.muscle_groups : [],
        equipment: Array.isArray(item.equipment) ? item.equipment : [],
        tips: Array.isArray(item.tips) ? item.tips : []
      });
    }
    
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { type, item } = editingItem;
    
    try {
      const tableName = type === 'category' ? 'workout_categories' : 
                       type === 'template' ? 'workout_templates' : 'workout_exercises';
      
      let updateData;
      if (type === 'category') {
        updateData = categoryForm;
      } else if (type === 'template') {
        updateData = {
          ...templateForm,
          equipment: JSON.stringify(templateForm.equipment),
          muscle_groups: JSON.stringify(templateForm.muscle_groups)
        };
      } else {
        updateData = {
          ...exerciseForm,
          muscle_groups: JSON.stringify(exerciseForm.muscle_groups),
          equipment: JSON.stringify(exerciseForm.equipment),
          tips: JSON.stringify(exerciseForm.tips)
        };
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', item.id)
        .select();
      
      if (error) throw error;
      
      if (type === 'category') {
        setCategories(categories.map(c => c.id === item.id ? data[0] : c));
      } else if (type === 'template') {
        setTemplates(templates.map(t => t.id === item.id ? data[0] : t));
      } else {
        setExercises(exercises.map(e => e.id === item.id ? data[0] : e));
      }
      
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateModal = (type) => {
    setCreateType(type);
    setIsCreateModalOpen(true);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    exercises: "",
    difficulty: "Beginner",
    active: true,
    video: null,
  });

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  // ✅ Handle inputs, including video upload & thumbnail extraction
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (createType === 'category') {
      setCategoryForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else if (createType === 'template') {
      setTemplateForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else {
      setExerciseForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle array inputs (equipment, muscle_groups, tips)
  const handleArrayInput = (field, value, formType = createType) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    
    if (formType === 'category') {
      setCategoryForm(prev => ({ ...prev, [field]: arrayValue }));
    } else if (formType === 'template') {
      setTemplateForm(prev => ({ ...prev, [field]: arrayValue }));
    } else {
      setExerciseForm(prev => ({ ...prev, [field]: arrayValue }));
    }
  };

  // ✅ Create or update workout plan (kept for future admin functionality)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (createType === 'category') {
      handleCreateCategory(e);
    } else if (createType === 'template') {
      handleCreateTemplate(e);
    } else {
      handleCreateExercise(e);
    }
  };

  // ✅ Reset modal
  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingItem(null);
    setCategoryForm({ name: '', description: '', icon: '', emoji: '', color: '#A3E635', display_order: 0, is_active: true });
    setTemplateForm({
      category_id: '', name: '', description: '', difficulty: 'Beginner',
      duration_minutes: 30, estimated_calories: 200, equipment: [], muscle_groups: [],
      is_active: true
    });
    setExerciseForm({
      template_id: '', exercise_name: '', description: '', sets: 3, reps: '10-12',
      rest_seconds: 60, calories_per_set: 10, muscle_groups: [], equipment: [],
      tips: [], order_index: 1
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Workout Management</h2>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button 
              onClick={showCategories}
              className={`hover:text-orange-600 ${currentView === 'categories' ? 'text-orange-600 font-medium' : ''}`}
            >
              Categories
            </button>
            {selectedCategory && (
              <>
                <span>›</span>
                <button 
                  onClick={() => showTemplates(selectedCategory)}
                  className={`hover:text-orange-600 ${currentView === 'templates' ? 'text-orange-600 font-medium' : ''}`}
                >
                  {selectedCategory.name}
                </button>
              </>
            )}
            {selectedTemplate && (
              <>
                <span>›</span>
                <span className="text-orange-600 font-medium">{selectedTemplate.name}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Create Button */}
        <div className="flex gap-2">
          {currentView === 'categories' && (
            <button
              onClick={() => openCreateModal('category')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
          {currentView === 'templates' && (
            <button
              onClick={() => openCreateModal('template')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Add Workout
            </button>
          )}
          {currentView === 'exercises' && (
            <button
              onClick={() => openCreateModal('exercise')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold mb-2">Total Categories</h4>
          <p className="text-3xl font-bold text-orange-600">{categories.length}</p>
          <p className="text-sm text-gray-600">Active workout categories</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold mb-2">Total Workouts</h4>
          <p className="text-blue-600 text-3xl font-bold">{templates.length}</p>
          <p className="text-sm text-gray-600">Workout templates</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold mb-2">Total Exercises</h4>
          <p className="text-3xl font-bold text-green-600">{exercises.length}</p>
          <p className="text-sm text-gray-600">Exercise variations</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Loading workout data...</p>
        </div>
      ) : (
        <>
          {/* Categories View */}
          {currentView === 'categories' && (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Workout Categories</h3>
              {categories.length === 0 ? (
                <p className="text-gray-500">No categories found. Create one!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => {
                    const categoryTemplates = getCategoryTemplates(category.id);
                    return (
                      <div
                        key={category.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => showTemplates(category)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{category.emoji}</span>
                            <h4 className="font-semibold text-lg">{category.name}</h4>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit('category', category)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('category', category.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                        <div className="flex items-center justify-between">
                          <span 
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{ backgroundColor: category.color + '20', color: category.color }}
                          >
                            {categoryTemplates.length} workouts
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Templates View */}
          {currentView === 'templates' && selectedCategory && (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedCategory.name} Workouts</h3>
                <button
                  onClick={showCategories}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  ← Back to Categories
                </button>
              </div>
              
              {getCategoryTemplates(selectedCategory.id).length === 0 ? (
                <p className="text-gray-500">No workouts found. Create one!</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {getCategoryTemplates(selectedCategory.id).map((template) => {
                    const templateExercises = getTemplateExercises(template.id);
                    return (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">{template.name}</h4>
                              <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(template.difficulty)}`}>
                                {template.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit('template', template)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('template', template.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {template.duration_minutes} min
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Activity className="h-4 w-4" />
                            {template.estimated_calories} kcal
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Dumbbell className="h-4 w-4" />
                            {templateExercises.length} exercises
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <button
                          onClick={() => showExercises(template)}
                          className="w-full px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                        >
                          View Exercises ({templateExercises.length})
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Exercises View */}
          {currentView === 'exercises' && selectedTemplate && (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedTemplate.name} - Exercises</h3>
                <button
                  onClick={() => showTemplates(selectedCategory)}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  ← Back to Workouts
                </button>
              </div>
              
              {getTemplateExercises(selectedTemplate.id).length === 0 ? (
                <p className="text-gray-500">No exercises found. Add some!</p>
              ) : (
                <div className="space-y-3">
                  {getTemplateExercises(selectedTemplate.id).map((exercise) => (
                    <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {exercise.order_index}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{exercise.exercise_name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Sets:</span>
                                <span className="ml-1 font-medium">{exercise.sets}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Reps:</span>
                                <span className="ml-1 font-medium">{exercise.reps}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Rest:</span>
                                <span className="ml-1 font-medium">{exercise.rest_seconds}s</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Calories:</span>
                                <span className="ml-1 font-medium">{exercise.calories_per_set}/set</span>
                              </div>
                            </div>
                            
                            {exercise.tips && Array.isArray(exercise.tips) && exercise.tips.length > 0 && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <span className="text-gray-500">💡 Tip:</span> {exercise.tips[0]}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit('exercise', exercise)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('exercise', exercise.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Create {createType === 'category' ? 'Category' : createType === 'template' ? 'Workout Template' : 'Exercise'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Category Form */}
              {createType === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={categoryForm.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Strength Training"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={categoryForm.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of this category"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emoji *</label>
                      <input
                        type="text"
                        name="emoji"
                        value={categoryForm.emoji}
                        onChange={handleInputChange}
                        required
                        placeholder="💪"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                      <input
                        type="text"
                        name="icon"
                        value={categoryForm.icon}
                        onChange={handleInputChange}
                        placeholder="barbell-outline"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color *</label>
                      <input
                        type="color"
                        name="color"
                        value={categoryForm.color}
                        onChange={handleInputChange}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                      <input
                        type="number"
                        name="display_order"
                        value={categoryForm.display_order}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={categoryForm.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active (visible to users)</label>
                  </div>
                </>
              )}

              {/* Template Form */}
              {createType === 'template' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      name="category_id"
                      value={templateForm.category_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workout Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={templateForm.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Upper Body Power"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={templateForm.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of this workout"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                      <select
                        name="difficulty"
                        value={templateForm.difficulty}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min) *</label>
                      <input
                        type="number"
                        name="duration_minutes"
                        value={templateForm.duration_minutes}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                      <input
                        type="number"
                        name="estimated_calories"
                        value={templateForm.estimated_calories}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Barbell, Dumbbells, Bench"
                      value={Array.isArray(templateForm.equipment) ? templateForm.equipment.join(', ') : ''}
                      onChange={(e) => handleArrayInput('equipment', e.target.value, 'template')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Muscle Groups (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Chest, Back, Shoulders"
                      value={Array.isArray(templateForm.muscle_groups) ? templateForm.muscle_groups.join(', ') : ''}
                      onChange={(e) => handleArrayInput('muscle_groups', e.target.value, 'template')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={templateForm.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active (visible to users)</label>
                  </div>
                </>
              )}

              {/* Exercise Form */}
              {createType === 'exercise' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workout Template *</label>
                    <select
                      name="template_id"
                      value={exerciseForm.template_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select a workout</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Name *</label>
                    <input
                      type="text"
                      name="exercise_name"
                      value={exerciseForm.exercise_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Bench Press"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={exerciseForm.description}
                      onChange={handleInputChange}
                      placeholder="How to perform this exercise"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sets *</label>
                      <input
                        type="number"
                        name="sets"
                        value={exerciseForm.sets}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reps *</label>
                      <input
                        type="text"
                        name="reps"
                        value={exerciseForm.reps}
                        onChange={handleInputChange}
                        required
                        placeholder="8-10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rest (sec)</label>
                      <input
                        type="number"
                        name="rest_seconds"
                        value={exerciseForm.rest_seconds}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                      <input
                        type="number"
                        name="order_index"
                        value={exerciseForm.order_index}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tips (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Keep core tight, Control the movement"
                      value={Array.isArray(exerciseForm.tips) ? exerciseForm.tips.join(', ') : ''}
                      onChange={(e) => handleArrayInput('tips', e.target.value, 'exercise')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Create {createType === 'category' ? 'Category' : createType === 'template' ? 'Workout' : 'Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Edit {editingItem.type === 'category' ? 'Category' : editingItem.type === 'template' ? 'Workout Template' : 'Exercise'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {/* Same form fields as create, but with current values */}
              {editingItem.type === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={categoryForm.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={categoryForm.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emoji *</label>
                      <input
                        type="text"
                        name="emoji"
                        value={categoryForm.emoji}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color *</label>
                      <input
                        type="color"
                        name="color"
                        value={categoryForm.color}
                        onChange={handleInputChange}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={categoryForm.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active (visible to users)</label>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
