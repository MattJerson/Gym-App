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
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedTemplates, setExpandedTemplates] = useState({});

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

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleTemplate = (templateId) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

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
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files[0]) {
      const file = files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const videoURL = reader.result;

        // ✅ Immediately store name + data
        setFormData((prev) => ({
          ...prev,
          [name]: {
            name: file.name,
            data: videoURL,
            thumbnail: null, // placeholder until we extract it
          },
        }));

        const videoElement = document.createElement("video");
        videoElement.src = videoURL;

        videoElement.onloadedmetadata = () => {
          videoElement.currentTime = 1; // seek to 1s
        };

        videoElement.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth / 2;
          canvas.height = videoElement.videoHeight / 2;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          const thumbnail = canvas.toDataURL("image/png");

          // ✅ Update state with thumbnail (without losing existing data)
          setFormData((prev) => ({
            ...prev,
            [name]: {
              ...prev[name],
              thumbnail,
            },
          }));
        };
      };

      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // ✅ Create or update workout plan (kept for future admin functionality)
  const handleSubmit = (e) => {
    e.preventDefault();
    // Future: Save to Supabase instead of localStorage
    handleCancel();
  };

  // ✅ Delete workout plan (kept for future admin functionality)
  const handleDelete = (id) => {
    // Future: Delete from Supabase
  };

  // ✅ Edit workout plan (kept for future admin functionality)
  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setFormData(plan);
    setIsOpen(true);
  };

  // ✅ Open details modal
  const handleViewDetails = (plan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  };

  // ✅ Reset modal
  const handleCancel = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      duration: "",
      exercises: "",
      difficulty: "Beginner",
      active: true,
      video: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Workout Management</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Create Workout (Coming Soon)
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold mb-2">Total Categories</h4>
          <p className="text-3xl font-bold text-orange-600">
            {categories.length}
          </p>
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
          {/* Workout Categories & Templates */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Workout Database</h3>
            {categories.length === 0 ? (
              <p className="text-gray-500">No workout categories found. Import data from Supabase!</p>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryTemplates = getCategoryTemplates(category.id);
                  const isExpanded = expandedCategories[category.id];
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <div 
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-lg">{category.name}</h4>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium" style={{ color: category.color }}>
                              {categoryTemplates.length} workouts
                            </p>
                            <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                        </div>
                      </div>

                      {/* Templates List (Expandable) */}
                      {isExpanded && (
                        <div className="p-4 space-y-3 bg-white">
                          {categoryTemplates.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No workouts in this category yet.</p>
                          ) : (
                            categoryTemplates.map((template) => {
                              const templateExercises = getTemplateExercises(template.id);
                              const isTemplateExpanded = expandedTemplates[template.id];
                              
                              return (
                                <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Template Header */}
                                  <div 
                                    onClick={() => toggleTemplate(template.id)}
                                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-semibold">{template.name}</h5>
                                        <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(template.difficulty)}`}>
                                          {template.difficulty}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {template.duration_minutes} min
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Activity className="h-3 w-3" />
                                          {template.estimated_calories} kcal
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Dumbbell className="h-3 w-3" />
                                          {templateExercises.length} exercises
                                        </span>
                                      </div>
                                    </div>
                                    {isTemplateExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                  </div>

                                  {/* Exercises List (Expandable) */}
                                  {isTemplateExpanded && (
                                    <div className="p-3 bg-white space-y-2">
                                      {templateExercises.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">No exercises added yet.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {templateExercises.map((exercise, idx) => (
                                            <div key={exercise.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded border border-gray-200">
                                              <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                {exercise.order_index}
                                              </span>
                                              <div className="flex-1">
                                                <h6 className="text-sm font-semibold">{exercise.exercise_name}</h6>
                                                <p className="text-xs text-gray-600 mb-1">{exercise.description}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                  <span>{exercise.sets} sets</span>
                                                  <span>×</span>
                                                  <span>{exercise.reps} reps</span>
                                                  <span>•</span>
                                                  <span>{exercise.rest_seconds}s rest</span>
                                                  <span>•</span>
                                                  <span>{exercise.calories_per_set} kcal/set</span>
                                                </div>
                                                {exercise.tips && Array.isArray(exercise.tips) && exercise.tips.length > 0 && (
                                                  <div className="mt-1">
                                                    <p className="text-xs text-gray-500 italic">💡 {exercise.tips[0]}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Workout Plan Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Workout Plan" : "Create Workout Plan"}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Full Body Strength"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Duration *
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 4 weeks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Dumbbell className="inline h-4 w-4 mr-1" />
                  Exercises *
                </label>
                <input
                  type="number"
                  name="exercises"
                  value={formData.exercises}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Activity className="inline h-4 w-4 mr-1" />
                  Difficulty *
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {difficulties.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Upload className="inline h-4 w-4 mr-1" />
                  Upload Workout Video
                </label>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleInputChange}
                  className="w-full text-sm text-gray-700"
                />
                {formData.video && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formData.video.name}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Set as active plan
                </label>
              </div>
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
                  {editingId ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ View Details Modal */}
      {isDetailsOpen && selectedPlan && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Workout Plan Details
              </h3>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p>
                <strong>Name:</strong> {selectedPlan.name}
              </p>
              <p>
                <strong>Duration:</strong> {selectedPlan.duration}
              </p>
              <p>
                <strong>Exercises:</strong> {selectedPlan.exercises}
              </p>
              <p>
                <strong>Difficulty:</strong> {selectedPlan.difficulty}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedPlan.active ? "Active ✅" : "Inactive ❌"}
              </p>

              {/* 🎥 Video Thumbnail */}
              {selectedPlan.video && (
                <div className="mt-4">
                  <strong>Video:</strong>
                  {selectedPlan.video.thumbnail ? (
                    <img
                      src={selectedPlan.video.thumbnail}
                      alt="Video thumbnail"
                      className="mt-2 w-full rounded-lg border border-gray-300"
                    />
                  ) : (
                    <video
                      src={selectedPlan.video.data}
                      className="mt-2 w-full rounded-lg border border-gray-300"
                      controls={false}
                      preload="metadata"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedPlan.video.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
