import {
  Plus,
  Dumbbell,
  Activity,
  Clock,
  Flame,
  ChevronRight,
  FolderOpen,
  Search,
  TrendingUp,
  Filter,
  Pencil,
  Trash2,
  Target,
  Zap,
  Award,
  Image as ImageIcon,
  Video,
  ListOrdered,
  Play,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

const Workouts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('categories'); // 'categories', 'templates', 'exercises'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Filters and sorting
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category', 'template', 'exercise'
  const [editingItem, setEditingItem] = useState(null);
  
  // Form data
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    emoji: '🏋️',
    color: '#3B82F6',
    image_url: '',
    display_order: 0,
    is_active: true
  });
  
  const [templateForm, setTemplateForm] = useState({
    category_id: '',
    name: '',
    description: '',
    difficulty: 'Beginner',
    duration_minutes: 30,
    estimated_calories: 200,
    equipment: [],
    muscle_groups: [],
    thumbnail_url: '',
    video_url: '',
    is_active: true
  });

  const [exerciseForm, setExerciseForm] = useState({
    template_id: '',
    exercise_name: '',
    description: '',
    sets: 3,
    reps: '10-12',
    rest_seconds: 60,
    calories_per_set: 10,
    muscle_groups: [],
    equipment: [],
    video_url: '',
    tips: [],
    order_index: 1,
    is_warmup: false,
    is_cooldown: false
  });

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
    fetchExercises();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_categories(name, emoji, color, image_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          workout_templates(name, difficulty, workout_categories(name, emoji))
        `)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('workout_categories')
          .update(categoryForm)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workout_categories')
          .insert([categoryForm]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      resetCategoryForm();
      await fetchCategories();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSubmitTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('workout_templates')
          .update(templateForm)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workout_templates')
          .insert([templateForm]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      resetTemplateForm();
      await fetchTemplates();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSubmitExercise = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('workout_exercises')
          .update(exerciseForm)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workout_exercises')
          .insert([exerciseForm]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      resetExerciseForm();
      await fetchExercises();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      emoji: category.emoji || '🏋️',
      color: category.color || '#3B82F6',
      image_url: category.image_url || '',
      display_order: category.display_order || 0,
      is_active: category.is_active !== false
    });
    setModalType('category');
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template) => {
    setEditingItem(template);
    setTemplateForm({
      category_id: template.category_id,
      name: template.name,
      description: template.description || '',
      difficulty: template.difficulty || 'Beginner',
      duration_minutes: template.duration_minutes || 30,
      estimated_calories: template.estimated_calories || 200,
      equipment: template.equipment || [],
      muscle_groups: template.muscle_groups || [],
      thumbnail_url: template.thumbnail_url || '',
      video_url: template.video_url || '',
      is_active: template.is_active !== false
    });
    setModalType('template');
    setIsModalOpen(true);
  };

  const handleEditExercise = (exercise) => {
    setEditingItem(exercise);
    setExerciseForm({
      template_id: exercise.template_id,
      exercise_name: exercise.exercise_name,
      description: exercise.description || '',
      sets: exercise.sets || 3,
      reps: exercise.reps || '10-12',
      rest_seconds: exercise.rest_seconds || 60,
      calories_per_set: exercise.calories_per_set || 10,
      muscle_groups: exercise.muscle_groups || [],
      equipment: exercise.equipment || [],
      video_url: exercise.video_url || '',
      tips: exercise.tips || [],
      order_index: exercise.order_index || 1,
      is_warmup: exercise.is_warmup || false,
      is_cooldown: exercise.is_cooldown || false
    });
    setModalType('exercise');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete category "${category.name}"? This will also delete all templates and exercises in this category.`)) return;
    
    try {
      const { error } = await supabase
        .from('workout_categories')
        .delete()
        .eq('id', category.id);
      
      if (error) throw error;
      await fetchCategories();
      await fetchTemplates();
      await fetchExercises();
    } catch (err) {
      alert('Error deleting category: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Delete template "${template.name}"? This will also delete all exercises in this template.`)) return;
    
    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', template.id);
      
      if (error) throw error;
      await fetchTemplates();
      await fetchExercises();
    } catch (err) {
      alert('Error deleting template: ' + err.message);
    }
  };

  const handleDeleteExercise = async (exercise) => {
    if (!confirm(`Delete exercise "${exercise.exercise_name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exercise.id);
      
      if (error) throw error;
      await fetchExercises();
    } catch (err) {
      alert('Error deleting exercise: ' + err.message);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      emoji: '🏋️',
      color: '#3B82F6',
      image_url: '',
      display_order: 0,
      is_active: true
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      category_id: '',
      name: '',
      description: '',
      difficulty: 'Beginner',
      duration_minutes: 30,
      estimated_calories: 200,
      equipment: [],
      muscle_groups: [],
      thumbnail_url: '',
      video_url: '',
      is_active: true
    });
  };

  const resetExerciseForm = () => {
    setExerciseForm({
      template_id: '',
      exercise_name: '',
      description: '',
      sets: 3,
      reps: '10-12',
      rest_seconds: 60,
      calories_per_set: 10,
      muscle_groups: [],
      equipment: [],
      video_url: '',
      tips: [],
      order_index: 1,
      is_warmup: false,
      is_cooldown: false
    });
  };

  // Helper functions
  const getDifficultyIcon = (level) => {
    switch (level) {
      case 'Beginner': return <Target className="h-4 w-4" />;
      case 'Intermediate': return <Zap className="h-4 w-4" />;
      case 'Advanced': return <Award className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Advanced': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Filtering and sorting logic
  const getFilteredAndSortedData = () => {
    let filtered = [];
    
    if (currentView === 'categories') {
      filtered = [...categories];
      
      // Apply search
      if (searchTerm) {
        filtered = filtered.filter(cat =>
          cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply status filter
      if (filterStatus !== 'all') {
        const isActive = filterStatus === 'active';
        filtered = filtered.filter(cat => cat.is_active === isActive);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'name':
            aVal = a.name?.toLowerCase() || '';
            bVal = b.name?.toLowerCase() || '';
            break;
          case 'display_order':
            aVal = a.display_order || 0;
            bVal = b.display_order || 0;
            break;
          case 'created_at':
          default:
            aVal = new Date(a.created_at || 0).getTime();
            bVal = new Date(b.created_at || 0).getTime();
            break;
        }
        return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
      
    } else if (currentView === 'templates') {
      filtered = [...templates];
      
      // Apply search
      if (searchTerm) {
        filtered = filtered.filter(temp =>
          temp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          temp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          temp.workout_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply difficulty filter
      if (filterDifficulty !== 'all') {
        filtered = filtered.filter(temp => temp.difficulty === filterDifficulty);
      }
      
      // Apply category filter
      if (filterCategory !== 'all') {
        filtered = filtered.filter(temp => temp.category_id === filterCategory);
      }
      
      // Apply status filter
      if (filterStatus !== 'all') {
        const isActive = filterStatus === 'active';
        filtered = filtered.filter(temp => temp.is_active === isActive);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'name':
            aVal = a.name?.toLowerCase() || '';
            bVal = b.name?.toLowerCase() || '';
            break;
          case 'duration':
            aVal = a.duration_minutes || 0;
            bVal = b.duration_minutes || 0;
            break;
          case 'calories':
            aVal = a.estimated_calories || 0;
            bVal = b.estimated_calories || 0;
            break;
          case 'created_at':
          default:
            aVal = new Date(a.created_at || 0).getTime();
            bVal = new Date(b.created_at || 0).getTime();
            break;
        }
        return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
      
    } else if (currentView === 'exercises') {
      filtered = [...exercises];
      
      // Apply search
      if (searchTerm) {
        filtered = filtered.filter(ex =>
          ex.exercise_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.workout_templates?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply template filter (category filter for exercises)
      if (filterCategory !== 'all') {
        filtered = filtered.filter(ex => ex.template_id === filterCategory);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'name':
            aVal = a.exercise_name?.toLowerCase() || '';
            bVal = b.exercise_name?.toLowerCase() || '';
            break;
          case 'order':
            aVal = a.order_index || 0;
            bVal = b.order_index || 0;
            break;
          case 'sets':
            aVal = a.sets || 0;
            bVal = b.sets || 0;
            break;
          case 'created_at':
          default:
            aVal = new Date(a.created_at || 0).getTime();
            bVal = new Date(b.created_at || 0).getTime();
            break;
        }
        return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
    }
    
    return filtered;
  };

  const filteredData = getFilteredAndSortedData();
  const activeFilterCount = [filterDifficulty, filterCategory, filterStatus].filter(f => f !== 'all').length;

  const totalCategories = categories.length;
  const totalTemplates = templates.length;
  const totalExercises = exercises.length;
  const activeCategories = categories.filter(c => c.is_active).length;
  const avgDuration = Math.round(templates.reduce((acc, t) => acc + (t.duration_minutes || 0), 0) / (totalTemplates || 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Dumbbell}
          title="Workout Management"
          subtitle="Manage workout categories, templates, and exercises"
          breadcrumbs={['Admin', 'Workouts']}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                if (currentView === 'categories') {
                  setModalType('category');
                  setEditingItem(null);
                  resetCategoryForm();
                } else if (currentView === 'templates') {
                  setModalType('template');
                  setEditingItem(null);
                  resetTemplateForm();
                } else {
                  setModalType('exercise');
                  setEditingItem(null);
                  resetExerciseForm();
                }
                setIsModalOpen(true);
              }}
            >
              Add {currentView === 'categories' ? 'Category' : currentView === 'templates' ? 'Template' : 'Exercise'}
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <StatsCard
            title="Total Categories"
            value={totalCategories}
            icon={FolderOpen}
            color="blue"
            subtitle={`${activeCategories} active`}
          />
          <StatsCard
            title="Total Templates"
            value={totalTemplates}
            icon={Dumbbell}
            color="orange"
            subtitle="Workout plans"
          />
          <StatsCard
            title="Total Exercises"
            value={totalExercises}
            icon={Activity}
            color="purple"
            subtitle="In all templates"
          />
          <StatsCard
            title="Avg Duration"
            value={`${avgDuration} min`}
            icon={Clock}
            color="green"
            subtitle="Per workout"
          />
        </div>

        {/* Search, View Selector, and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
          {/* Top Row: Search and View Buttons */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${currentView}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* View Selector Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentView('categories');
                  setSearchTerm('');
                  setFilterDifficulty('all');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  currentView === 'categories'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                Categories
              </button>
              <button
                onClick={() => {
                  setCurrentView('templates');
                  setSearchTerm('');
                  setFilterDifficulty('all');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  currentView === 'templates'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Dumbbell className="h-4 w-4" />
                Templates
              </button>
              <button
                onClick={() => {
                  setCurrentView('exercises');
                  setSearchTerm('');
                  setFilterDifficulty('all');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  currentView === 'exercises'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity className="h-4 w-4" />
                Exercises
              </button>
            </div>

            {/* Sort Section */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {currentView === 'categories' && (
                  <>
                    <option value="created_at">Date Created</option>
                    <option value="name">Name</option>
                    <option value="display_order">Display Order</option>
                  </>
                )}
                {currentView === 'templates' && (
                  <>
                    <option value="created_at">Date Created</option>
                    <option value="name">Name</option>
                    <option value="duration">Duration</option>
                    <option value="calories">Calories</option>
                  </>
                )}
                {currentView === 'exercises' && (
                  <>
                    <option value="created_at">Date Created</option>
                    <option value="name">Name</option>
                    <option value="order">Order</option>
                    <option value="sets">Sets</option>
                  </>
                )}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <TrendingUp className={`h-4 w-4 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          {(currentView === 'templates' || currentView === 'exercises') && (
            <div className="flex flex-wrap items-center gap-4">
              {/* Difficulty Filter (Templates only) */}
              {currentView === 'templates' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 mr-1">Difficulty:</span>
                  <button
                    onClick={() => setFilterDifficulty('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterDifficulty === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterDifficulty('Beginner')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterDifficulty === 'Beginner'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => setFilterDifficulty('Intermediate')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterDifficulty === 'Intermediate'
                        ? 'bg-yellow-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Intermediate
                  </button>
                  <button
                    onClick={() => setFilterDifficulty('Advanced')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterDifficulty === 'Advanced'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Advanced
                  </button>
                </div>
              )}

              {/* Category/Template Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 mr-1">
                  {currentView === 'templates' ? 'Category:' : 'Template:'}
                </span>
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {currentView === 'templates' 
                  ? categories.slice(0, 5).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setFilterCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          filterCategory === cat.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.emoji} {cat.name}
                      </button>
                    ))
                  : templates.slice(0, 5).map(temp => (
                      <button
                        key={temp.id}
                        onClick={() => setFilterCategory(temp.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          filterCategory === temp.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {temp.name}
                      </button>
                    ))
                }
              </div>

              {/* Status Filter */}
              {currentView !== 'exercises' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 mr-1">Status:</span>
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterStatus === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterStatus === 'active'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilterStatus('inactive')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterStatus === 'inactive'
                        ? 'bg-gray-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              )}

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterDifficulty('all');
                    setFilterCategory('all');
                    setFilterStatus('all');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                >
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>
          )}

          {/* Status Filter for Categories */}
          {currentView === 'categories' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Status:</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === 'inactive'
                    ? 'bg-gray-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive
              </button>
            </div>
          )}
        </div>

        {/* Data Tables */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Dumbbell className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No {currentView} found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm || activeFilterCount > 0 
                  ? 'Try adjusting your search or filters'
                  : `Get started by creating your first ${currentView === 'categories' ? 'category' : currentView === 'templates' ? 'template' : 'exercise'}`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {currentView === 'categories' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-56">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Display Order
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Templates
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    )}
                    {currentView === 'templates' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-64">
                          Workout Template
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Difficulty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Calories
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Exercises
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    )}
                    {currentView === 'exercises' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-64">
                          Exercise
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Template
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Sets × Reps
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Rest
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Video
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentView === 'categories' && filteredData.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div 
                            className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
                            style={{ backgroundColor: category.color || '#3B82F6' }}
                          >
                            <span className="text-xl">{category.emoji || '🏋️'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 truncate">{category.name}</p>
                            <p className="text-xs text-gray-500 leading-snug">{category.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {category.image_url ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={category.image_url} 
                              alt={category.name}
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                            />
                            <ImageIcon className="h-3 w-3 text-green-600" />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No image</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 rounded-lg border border-purple-100 w-fit">
                          <ListOrdered className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">{category.display_order || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">
                          {templates.filter(t => t.category_id === category.id).length} templates
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                          category.is_active 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit category"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentView === 'templates' && filteredData.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                            <Dumbbell className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 truncate">{template.name}</p>
                            <p className="text-xs text-gray-500 leading-snug">{template.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{template.workout_categories?.emoji}</span>
                          <span className="text-sm text-gray-600">{template.workout_categories?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium text-xs ${getDifficultyColor(template.difficulty)}`}>
                          {getDifficultyIcon(template.difficulty)}
                          <span>{template.difficulty}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100 w-fit">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">{template.duration_minutes}m</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 rounded-lg border border-orange-100 w-fit">
                          <Flame className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-xs font-semibold text-orange-700">{template.estimated_calories}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="purple">
                          {exercises.filter(e => e.template_id === template.id).length} exercises
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs ${
                          template.is_active 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit template"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentView === 'exercises' && filteredData.map((exercise) => (
                    <tr key={exercise.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                            <Activity className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 truncate">{exercise.exercise_name}</p>
                            <p className="text-xs text-gray-500 leading-snug">{exercise.description || 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{exercise.workout_templates?.workout_categories?.emoji}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{exercise.workout_templates?.name}</p>
                            <p className="text-xs text-gray-500">{exercise.workout_templates?.difficulty}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100 w-fit">
                          <span className="text-xs font-bold text-indigo-700">{exercise.sets} × {exercise.reps}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                          <Clock className="h-3.5 w-3.5 text-gray-600" />
                          <span className="text-xs font-semibold text-gray-700">{exercise.rest_seconds}s</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 rounded-lg border border-purple-100 w-fit">
                          <ListOrdered className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">#{exercise.order_index}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {exercise.video_url ? (
                          <a 
                            href={exercise.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                          >
                            <Play className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-xs font-semibold text-red-700">Watch</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No video</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditExercise(exercise)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit exercise"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(exercise)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete exercise"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> of{' '}
              <span className="font-semibold text-gray-900">
                {currentView === 'categories' ? totalCategories : currentView === 'templates' ? totalTemplates : totalExercises}
              </span> {currentView}
            </p>
          </div>
        )}

        {/* Create/Edit Modals */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
            if (modalType === 'category') resetCategoryForm();
            else if (modalType === 'template') resetTemplateForm();
            else resetExerciseForm();
          }}
          title={`${editingItem ? 'Edit' : 'Create'} ${modalType === 'category' ? 'Category' : modalType === 'template' ? 'Template' : 'Exercise'}`}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  if (modalType === 'category') resetCategoryForm();
                  else if (modalType === 'template') resetTemplateForm();
                  else resetExerciseForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={modalType === 'category' ? handleSubmitCategory : modalType === 'template' ? handleSubmitTemplate : handleSubmitExercise}
              >
                {editingItem ? 'Update' : 'Create'} {modalType === 'category' ? 'Category' : modalType === 'template' ? 'Template' : 'Exercise'}
              </Button>
            </div>
          }
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            if (modalType === 'category') handleSubmitCategory(e);
            else if (modalType === 'template') handleSubmitTemplate(e);
            else handleSubmitExercise(e);
          }} className="space-y-6 px-6 py-4">
            
            {/* Category Form */}
            {modalType === 'category' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                    Category Information
                  </h3>
                  <div className="space-y-3">
                    <Input
                      label="Category Name"
                      placeholder="e.g., Strength Training"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      required
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        placeholder="Describe this workout category..."
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emoji
                        </label>
                        <input
                          type="text"
                          placeholder="🏋️"
                          value={categoryForm.emoji}
                          onChange={(e) => setCategoryForm({ ...categoryForm, emoji: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl text-center"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <input
                          type="color"
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                          className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                        Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={categoryForm.image_url}
                        onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter an image URL from the internet</p>
                      {categoryForm.image_url && (
                        <div className="mt-2">
                          <img 
                            src={categoryForm.image_url} 
                            alt="Preview"
                            className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <ListOrdered className="h-3.5 w-3.5 text-gray-500" />
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={categoryForm.display_order}
                        onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                    </div>
                  </div>
                </div>

                {/* Active Status Toggle */}
                <div className="pt-3 border-t">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={categoryForm.is_active}
                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Active Status</span>
                      <p className="text-xs text-gray-500">Make this category visible to users</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Template Form */}
            {modalType === 'template' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-orange-600" />
                    Template Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={templateForm.category_id}
                        onChange={(e) => setTemplateForm({ ...templateForm, category_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Template Name"
                      placeholder="e.g., Upper Body Power"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      required
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        placeholder="Describe this workout template..."
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={templateForm.difficulty}
                        onChange={(e) => setTemplateForm({ ...templateForm, difficulty: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="240"
                          value={templateForm.duration_minutes}
                          onChange={(e) => setTemplateForm({ ...templateForm, duration_minutes: parseInt(e.target.value) || 30 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-gray-500" />
                          Estimated Calories
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={templateForm.estimated_calories}
                          onChange={(e) => setTemplateForm({ ...templateForm, estimated_calories: parseInt(e.target.value) || 200 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/thumbnail.jpg"
                        value={templateForm.thumbnail_url}
                        onChange={(e) => setTemplateForm({ ...templateForm, thumbnail_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      {templateForm.thumbnail_url && (
                        <div className="mt-2">
                          <img 
                            src={templateForm.thumbnail_url} 
                            alt="Preview"
                            className="h-20 w-32 rounded-lg object-cover border border-gray-200"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-gray-500" />
                        Overview Video URL (YouTube, etc.)
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={templateForm.video_url}
                        onChange={(e) => setTemplateForm({ ...templateForm, video_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Status Toggle */}
                <div className="pt-3 border-t">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={templateForm.is_active}
                        onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Active Status</span>
                      <p className="text-xs text-gray-500">Make this template visible to users</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Exercise Form */}
            {modalType === 'exercise' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    Exercise Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template
                      </label>
                      <select
                        value={exerciseForm.template_id}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, template_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      >
                        <option value="">Select a template</option>
                        {templates.map(temp => (
                          <option key={temp.id} value={temp.id}>
                            {temp.workout_categories?.emoji} {temp.name} ({temp.difficulty})
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Exercise Name"
                      placeholder="e.g., Barbell Bench Press"
                      value={exerciseForm.exercise_name}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, exercise_name: e.target.value })}
                      required
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description / Instructions
                      </label>
                      <textarea
                        placeholder="How to perform this exercise..."
                        value={exerciseForm.description}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sets
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={exerciseForm.sets}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 3 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reps
                        </label>
                        <input
                          type="text"
                          placeholder="8-12"
                          value={exerciseForm.reps}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          Rest (sec)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="15"
                          value={exerciseForm.rest_seconds}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, rest_seconds: parseInt(e.target.value) || 60 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-gray-500" />
                          Calories Per Set
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={exerciseForm.calories_per_set}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, calories_per_set: parseInt(e.target.value) || 10 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                          <ListOrdered className="h-3.5 w-3.5 text-gray-500" />
                          Order Index
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={exerciseForm.order_index}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, order_index: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-gray-500" />
                        Exercise Demo Video URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={exerciseForm.video_url}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, video_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">YouTube, Vimeo, or any video URL</p>
                    </div>

                    {/* Warmup / Cooldown Toggles */}
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exerciseForm.is_warmup}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, is_warmup: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Warmup Exercise</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exerciseForm.is_cooldown}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, is_cooldown: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Cooldown Exercise</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Workouts;
