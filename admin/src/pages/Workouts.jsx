import {
  Plus,
  Dumbbell,
  Activity,
  Clock,
  Flame,
  ChevronRight,
  FolderOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

// Initialize Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = SUPABASE_SERVICE || SUPABASE_ANON || '';
const supabase = createClient(SUPABASE_URL, supabaseKey);

const Workouts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category' or 'template'
  const [editingItem, setEditingItem] = useState(null);
  
  // Form data
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    emoji: '🏋️',
    color: '#3B82F6',
    is_active: true
  });
  
  const [templateForm, setTemplateForm] = useState({
    category_id: '',
    name: '',
    description: '',
    difficulty: 'Beginner',
    duration_minutes: 30,
    estimated_calories: 200
  });

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
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
          workout_categories(name, emoji, color)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const { error } = await supabase
        .from('workout_categories')
        .insert([categoryForm]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setCategoryForm({ name: '', description: '', emoji: '🏋️', color: '#3B82F6', is_active: true });
      await fetchCategories();
    } catch (err) {
      alert('Error creating category: ' + err.message);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .insert([templateForm]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setTemplateForm({
        category_id: '',
        name: '',
        description: '',
        difficulty: 'Beginner',
        duration_minutes: 30,
        estimated_calories: 200
      });
      await fetchTemplates();
    } catch (err) {
      alert('Error creating template: ' + err.message);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('workout_categories')
        .delete()
        .eq('id', category.id);
      
      if (error) throw error;
      await fetchCategories();
    } catch (err) {
      alert('Error deleting category: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', template.id);
      
      if (error) throw error;
      await fetchTemplates();
    } catch (err) {
      alert('Error deleting template: ' + err.message);
    }
  };

  const categoryColumns = [
    {
      header: 'Category',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="text-3xl">{row.emoji || '🏋️'}</div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Templates',
      accessor: 'templates',
      render: (row) => {
        const count = templates.filter(t => t.category_id === row.id).length;
        return (
          <Badge variant="info">
            {count} {count === 1 ? 'template' : 'templates'}
          </Badge>
        );
      }
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

  const templateColumns = [
    {
      header: 'Workout Template',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{row.workout_categories?.emoji}</span>
          <span className="text-sm text-gray-600">{row.workout_categories?.name}</span>
        </div>
      )
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      render: (row) => {
        const variants = {
          'Beginner': 'success',
          'Intermediate': 'warning',
          'Advanced': 'error'
        };
        return <Badge variant={variants[row.difficulty]}>{row.difficulty}</Badge>;
      }
    },
    {
      header: 'Duration',
      accessor: 'duration_minutes',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{row.duration_minutes} min</span>
        </div>
      )
    },
    {
      header: 'Calories',
      accessor: 'estimated_calories',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Flame className="h-4 w-4 text-orange-500" />
          <span>{row.estimated_calories} cal</span>
        </div>
      )
    }
  ];

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = templates.filter(temp =>
    temp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    temp.workout_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTemplates = templates.length;
  const activeCategories = categories.filter(c => c.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Dumbbell}
          title="Workout Management"
          subtitle="Manage workout categories and templates"
          breadcrumbs={['Admin', 'Workout Management']}
          actions={
            <div className="flex gap-3">
              <Button
                variant={currentView === 'categories' ? 'primary' : 'outline'}
                onClick={() => setCurrentView('categories')}
                icon={FolderOpen}
              >
                Categories
              </Button>
              <Button
                variant={currentView === 'templates' ? 'primary' : 'outline'}
                onClick={() => setCurrentView('templates')}
                icon={Dumbbell}
              >
                Templates
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Categories"
            value={categories.length}
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
            title="Avg Duration"
            value={`${Math.round(templates.reduce((acc, t) => acc + t.duration_minutes, 0) / (templates.length || 1))} min`}
            icon={Clock}
            color="purple"
            subtitle="Average workout time"
          />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={`Search ${currentView}...`}
          />
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setModalType(currentView === 'categories' ? 'category' : 'template');
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          >
            Add {currentView === 'categories' ? 'Category' : 'Template'}
          </Button>
        </div>

        {/* Data Tables */}
        {currentView === 'categories' ? (
          <DataTable
            columns={categoryColumns}
            data={filteredCategories}
            loading={loading}
            onDelete={handleDeleteCategory}
            actions={['delete']}
            emptyMessage="No categories found"
          />
        ) : (
          <DataTable
            columns={templateColumns}
            data={filteredTemplates}
            loading={loading}
            onDelete={handleDeleteTemplate}
            actions={['delete']}
            emptyMessage="No templates found"
          />
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={modalType === 'category' ? 'Create Category' : 'Create Workout Template'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={modalType === 'category' ? handleCreateCategory : handleCreateTemplate}
              >
                Create
              </Button>
            </>
          }
        >
          {modalType === 'category' ? (
            <div className="space-y-4">
              <Input
                label="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
              <Input
                label="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
              <Input
                label="Emoji"
                value={categoryForm.emoji}
                onChange={(e) => setCategoryForm({ ...categoryForm, emoji: e.target.value })}
                helperText="Enter an emoji to represent this category"
              />
              <Input
                label="Color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label="Category"
                value={templateForm.category_id}
                onChange={(e) => setTemplateForm({ ...templateForm, category_id: e.target.value })}
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                required
              />
              <Input
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                required
              />
              <Input
                label="Description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              />
              <Select
                label="Difficulty"
                value={templateForm.difficulty}
                onChange={(e) => setTemplateForm({ ...templateForm, difficulty: e.target.value })}
                options={[
                  { value: 'Beginner', label: 'Beginner' },
                  { value: 'Intermediate', label: 'Intermediate' },
                  { value: 'Advanced', label: 'Advanced' }
                ]}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (minutes)"
                  type="number"
                  value={templateForm.duration_minutes}
                  onChange={(e) => setTemplateForm({ ...templateForm, duration_minutes: parseInt(e.target.value) })}
                  icon={Clock}
                />
                <Input
                  label="Estimated Calories"
                  type="number"
                  value={templateForm.estimated_calories}
                  onChange={(e) => setTemplateForm({ ...templateForm, estimated_calories: parseInt(e.target.value) })}
                  icon={Flame}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Workouts;
