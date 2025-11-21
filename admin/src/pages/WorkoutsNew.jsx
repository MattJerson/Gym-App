import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../middleware/adminAuth';
import { PermissionGate, usePermission } from '../components/common/PermissionGate';
import PageHeader from '../components/common/PageHeader';
import StatsCard from '../components/common/StatsCard';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { PlusIcon, UserGroupIcon, AcademicCapIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dumbbell, FolderOpen } from 'lucide-react';

const Workouts = () => {
  const { role, isAdmin, isManager } = useUserRole();
  const { hasPermission: canCreateWorkouts } = usePermission('create_workouts');
  const { hasPermission: canAssignWorkouts } = usePermission('assign_workouts');
  
  const [currentView, setCurrentView] = useState('templates'); // 'templates', 'user-assignments'
  const [loading, setLoading] = useState(true);
  
  // Templates data
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  
  // User assignment data
  const [standardPlanUsers, setStandardPlanUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  
  // Exercise library (1500+ exercises)
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // New workout builder state
  const [workoutForm, setWorkoutForm] = useState({
    name: '',
    description: '',
    difficulty: 'Beginner',
    duration_minutes: 30,
    category_id: '',
    assignment_type: 'public', // 'public', 'standard_plan', 'specific_user'
    assigned_user_ids: [],
    exercises: [] // Array of { exercise_id, sets, reps, rest_seconds, order_index, notes }
  });
  
  useEffect(() => {
    loadInitialData();
  }, []);
  
  useEffect(() => {
    if (currentView === 'user-assignments') {
      loadStandardPlanUsers();
    }
  }, [currentView]);
  
  useEffect(() => {
    if (selectedUser) {
      loadUserWorkouts(selectedUser.user_id);
    }
  }, [selectedUser]);
  
  useEffect(() => {
    // Filter exercises based on search query
    if (exerciseSearchQuery.trim()) {
      const filtered = exerciseLibrary.filter(ex => 
        ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
        ex.body_part?.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
        ex.target_muscle?.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
      );
      setFilteredExercises(filtered.slice(0, 50)); // Limit to 50 results for performance
    } else {
      setFilteredExercises(exerciseLibrary.slice(0, 50));
    }
  }, [exerciseSearchQuery, exerciseLibrary]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCategories(),
        loadTemplates(),
        loadExerciseLibrary()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('workout_categories')
      .select('*')
      .order('display_order');
    
    if (!error && data) {
      setCategories(data);
    }
  };
  
  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('workout_templates')
      .select(`
        *,
        category:workout_categories(name, emoji),
        exercises:workout_template_exercises(
          id,
          sets,
          reps,
          order_index,
          exercise:exercises(name)
        )
      `)
      .eq('is_active', true)
      .is('created_by_user_id', null) // Only show templates not created by regular users
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // Check workout_exercises table for templates with 0 exercises
      const templatesWithNoExercises = data.filter(t => !t.exercises || t.exercises.length === 0);
      
      if (templatesWithNoExercises.length > 0) {
        const templateIds = templatesWithNoExercises.map(t => t.id);
        const { data: customExercises } = await supabase
          .from('workout_exercises')
          .select('template_id, id, exercise_name')
          .in('template_id', templateIds);
        
        // Count exercises per template
        const exerciseCounts = {};
        customExercises?.forEach(ex => {
          exerciseCounts[ex.template_id] = (exerciseCounts[ex.template_id] || 0) + 1;
        });
        
        // Update templates with exercise counts from workout_exercises
        data.forEach(template => {
          if (exerciseCounts[template.id]) {
            template.exercise_count = exerciseCounts[template.id];
          }
        });
      }
      
      // Add exercise count to each template
      const templatesWithCount = data.map(template => ({
        ...template,
        exercise_count: template.exercise_count || template.exercises?.length || 0
      }));
      setTemplates(templatesWithCount);
    } else if (error) {
      console.error('Error loading templates:', error);
    }
  };
  
  const loadExerciseLibrary = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, exercise_id, name, gif_url, met_value')
      .limit(1500);
    
    if (!error && data) {
      setExerciseLibrary(data);
      setFilteredExercises(data.slice(0, 50));
    }
  };
  
  const loadStandardPlanUsers = async () => {
    try {
      // Use RPC function to load ALL users (includes username from auth.users email or details)
      const { data, error } = await supabase.rpc('get_all_users_for_assignment');
      
      if (error) {
        console.error('Error loading users:', error);
        return;
      }
      
      if (data) {
        setStandardPlanUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  
  const loadUserWorkouts = async (userId) => {
    try {
      // Fetch both assigned workouts and saved/custom workouts
      const [assignedResult, savedResult] = await Promise.all([
        supabase.rpc('get_user_assigned_workouts', { p_user_id: userId }),
        supabase
          .from('user_saved_workouts')
          .select(`
            id,
            user_id,
            template_id,
            workout_name,
            workout_type,
            is_scheduled,
            scheduled_day_of_week,
            times_completed,
            template:workout_templates(
              id,
              name,
              description,
              difficulty,
              duration_minutes,
              category:workout_categories(name)
            )
          `)
          .eq('user_id', userId)
      ]);
      
      if (assignedResult.error) {
        console.error('Error loading assigned workouts:', assignedResult.error);
      }
      
      if (savedResult.error) {
        console.error('Error loading saved workouts:', savedResult.error);
      }
      
      // Transform assigned workouts to match display format
      const assignedWorkouts = (assignedResult.data || []).map(w => ({
        workout_id: w.workout_id,
        workout_name: w.workout_name,
        workout_description: w.workout_description,
        difficulty: w.difficulty,
        duration_minutes: w.duration_minutes,
        category_name: w.category_name,
        source_type: 'assigned',
        workout_type: 'Assigned by Coach'
      }));
      
      // Transform saved/custom workouts to match display format
      const savedWorkouts = (savedResult.data || []).map(w => ({
        workout_id: w.template_id,
        workout_name: w.workout_name || w.template?.name,
        workout_description: w.template?.description || '',
        difficulty: w.template?.difficulty || 'Intermediate',
        duration_minutes: w.template?.duration_minutes || 30,
        category_name: w.template?.category?.name || null,
        source_type: w.workout_type === 'Custom' ? 'self_created' : 'public',
        workout_type: w.workout_type || 'Pre-Made',
        times_completed: w.times_completed || 0,
        is_scheduled: w.is_scheduled || false,
        scheduled_day_of_week: w.scheduled_day_of_week
      }));
      
      // Combine and set all workouts
      setUserWorkouts([...assignedWorkouts, ...savedWorkouts]);
    } catch (error) {
      console.error('Error loading user workouts:', error);
    }
  };
  
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setWorkoutForm({
      name: '',
      description: '',
      difficulty: 'Beginner',
      duration_minutes: 30,
      category_id: '',
      assignment_type: 'public', // Default to assigning to ALL users
      assigned_user_ids: selectedUser ? [selectedUser.user_id] : [],
      exercises: []
    });
    setShowTemplateModal(true);
  };
  
  const handleEditTemplate = async (template) => {
    setEditingTemplate(template);
    
    // Set form data with template values
    setWorkoutForm({
      name: template.name || '',
      description: template.description || '',
      difficulty: template.difficulty || 'Beginner',
      duration_minutes: template.duration_minutes || 30,
      category_id: template.category_id || '',
      assignment_type: template.assignment_type || 'public',
      assigned_user_ids: template.assigned_user_ids || [],
      exercises: [] // Will be loaded by loadTemplateExercises
    });
    
    // Load template exercises
    await loadTemplateExercises(template.id);
    setShowTemplateModal(true);
  };
  
  const loadTemplateExercises = async (templateId) => {
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .select(`
        *,
        exercise:exercises(id, name, gif_url, met_value)
      `)
      .eq('template_id', templateId)
      .order('order_index');
    
    if (!error && data) {
      // Map the data to match the expected format
      const mappedExercises = data.map(ex => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise?.name || 'Unknown Exercise',
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        order_index: ex.order_index,
        notes: ex.custom_notes || '',
        gif_url: ex.exercise?.gif_url || '',
        met_value: ex.exercise?.met_value || 3.5
      }));
      
      setWorkoutForm(prev => ({
        ...prev,
        exercises: mappedExercises
      }));
    }
  };
  
  const handleAddExerciseToWorkout = (exercise) => {
    const newExercise = {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 3,
      reps: '10-12',
      rest_seconds: 60,
      order_index: workoutForm.exercises.length + 1,
      notes: '',
      gif_url: exercise.gif_url,
      met_value: exercise.met_value
    };
    
    setWorkoutForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };
  
  const handleRemoveExercise = (index) => {
    setWorkoutForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index).map((ex, i) => ({
        ...ex,
        order_index: i + 1
      }))
    }));
  };
  
  const handleUpdateExercise = (index, field, value) => {
    setWorkoutForm(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };
  
  const handleSaveTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to create workouts');
        return;
      }
      
      // Validation
      if (!workoutForm.name.trim()) {
        alert('Please enter a workout name');
        return;
      }
      
      if (workoutForm.exercises.length === 0) {
        alert('Please add at least one exercise');
        return;
      }
      
      if (workoutForm.assignment_type === 'specific_user' && workoutForm.assigned_user_ids.length === 0) {
        alert('Please select at least one user for specific assignment');
        return;
      }
      
      // Calculate estimated calories and duration
      const totalMET = workoutForm.exercises.reduce((sum, ex) => sum + (ex.met_value || 3.5) * ex.sets, 0);
      const estimatedCalories = Math.round(totalMET * workoutForm.duration_minutes / workoutForm.exercises.length || 0);
      
      const templateData = {
        name: workoutForm.name,
        description: workoutForm.description,
        difficulty: workoutForm.difficulty,
        duration_minutes: workoutForm.duration_minutes,
        category_id: workoutForm.category_id || null,
        custom_category_id: null,
        estimated_calories: estimatedCalories,
        is_custom: false, // Admin templates are NOT custom (custom = user-created)
        is_manager_created: true,
        assigned_by_manager_id: user.id,
        assignment_type: workoutForm.assignment_type,
        is_active: true,
        created_by_user_id: null // NULL = official template, not user-created
      };
      
      let templateId;
      
      if (editingTemplate) {
        // Update existing template
        const { data, error } = await supabase
          .from('workout_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .select()
          .single();
        
        if (error) throw error;
        templateId = data.id;
        
        // Delete old exercises
        await supabase
          .from('workout_template_exercises')
          .delete()
          .eq('template_id', templateId);
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('workout_templates')
          .insert(templateData)
          .select()
          .single();
        
        if (error) throw error;
        templateId = data.id;
      }
      
      // Insert exercises
      if (workoutForm.exercises.length > 0) {
        const exercisesData = workoutForm.exercises.map(ex => ({
          template_id: templateId,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          order_index: ex.order_index,
          custom_notes: ex.notes || null
        }));
        
        const { error: exercisesError } = await supabase
          .from('workout_template_exercises')
          .insert(exercisesData);
        
        if (exercisesError) throw exercisesError;
      }
      
      // Handle assignments
      // Note: Public workouts don't need explicit assignment - they're automatically visible to all users
      if (workoutForm.assignment_type === 'standard_plan') {
        // Assign to all Standard plan users
        const { data: users } = await supabase
          .from('registration_profiles')
          .select('user_id')
          .eq('subscription_tier', 'standard');
        
        if (users && users.length > 0) {
          const assignments = users.map(u => ({
            user_id: u.user_id,
            workout_template_id: templateId,
            assigned_by_manager_id: user.id,
            status: 'active'
          }));
          
          await supabase
            .from('user_assigned_workouts')
            .insert(assignments);
        }
      } else if (workoutForm.assignment_type === 'specific_user' && workoutForm.assigned_user_ids.length > 0) {
        // Assign to specific users
        const assignments = workoutForm.assigned_user_ids.map(userId => ({
          user_id: userId,
          workout_template_id: templateId,
          assigned_by_manager_id: user.id,
          status: 'active'
        }));
        
        await supabase
          .from('user_assigned_workouts')
          .insert(assignments);
      }
      
      // Log activity
      try {
        await supabase.rpc('log_community_manager_action', {
          p_action_type: editingTemplate ? 'workout_edited' : 'workout_created',
          p_target_resource_id: templateId,
          p_target_resource_type: 'workout_template',
          p_details: { 
            workout_name: workoutForm.name,
            assignment_type: workoutForm.assignment_type,
            exercises_count: workoutForm.exercises.length
          }
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
        // Don't fail the save operation if logging fails
      }
      
      alert(editingTemplate ? 'Workout updated successfully!' : 'Workout created successfully!');
      setShowTemplateModal(false);
      loadTemplates();
      
      if (selectedUser && workoutForm.assigned_user_ids.includes(selectedUser.user_id)) {
        loadUserWorkouts(selectedUser.user_id);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save workout: ' + error.message);
    }
  };
  
  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"? Users who saved this workout will keep their own copies.`)) {
      return;
    }
    
    try {
      // Use the database function for proper cascading deletion
      const { data, error } = await supabase
        .rpc('delete_workout_template_cascade', { 
          p_template_id: templateId 
        });
      
      if (error) throw error;
      
      // Log the deletion
      try {
        await supabase.rpc('log_community_manager_action', {
          p_action_type: 'workout_deleted',
          p_target_resource_id: templateId,
          p_target_resource_type: 'workout_template',
          p_details: { workout_name: templateName }
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
      
      alert('Workout deleted successfully. User copies remain intact.');
      loadTemplates();
      
      if (selectedUser) {
        loadUserWorkouts(selectedUser.user_id);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete workout: ' + error.message);
    }
  };
  
  const handleUnassignWorkout = async (userId, workoutId, workoutName) => {
    if (!window.confirm(`Unassign "${workoutName}" from this user?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_assigned_workouts')
        .delete()
        .eq('user_id', userId)
        .eq('workout_template_id', workoutId);
      
      if (error) throw error;
      
      // Log the unassignment
      try {
        await supabase.rpc('log_community_manager_action', {
          p_action_type: 'workout_unassigned',
          p_target_user_id: userId,
          p_target_resource_id: workoutId,
          p_target_resource_type: 'workout_template',
          p_details: { workout_name: workoutName }
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
      
      alert('Workout unassigned successfully');
      loadUserWorkouts(userId);
    } catch (error) {
      console.error('Error unassigning workout:', error);
      alert('Failed to unassign workout: ' + error.message);
    }
  };
  
  return (
    <div className="p-6">
      <PageHeader
        title="Workout Management"
        subtitle="Create and manage workout templates with exercises. Workouts are automatically available to all users by default."
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Workouts"
          value={templates.length}
          icon={Dumbbell}
          trend="+12%"
          trendLabel="from last month"
        />
        <StatsCard
          title="Active Users"
          value={standardPlanUsers.length}
          icon={UserGroupIcon}
          trend="+8%"
          trendLabel="this week"
        />
        <StatsCard
          title="Exercises Library"
          value={exerciseLibrary.length}
          icon={AcademicCapIcon}
          trend="1500+"
          trendLabel="available"
        />
        <StatsCard
          title="Categories"
          value={categories.length}
          icon={FolderOpen}
          trend="Active"
          trendLabel="all categories"
        />
      </div>
      
      {/* View Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setCurrentView('templates')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            currentView === 'templates'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AcademicCapIcon className="w-5 h-5 inline-block mr-2" />
          Workout Templates
        </button>
        
        {canAssignWorkouts && (
          <button
            onClick={() => setCurrentView('user-assignments')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === 'user-assignments'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <UserGroupIcon className="w-5 h-5 inline-block mr-2" />
            User Assignments
          </button>
        )}
      </div>
      
      {/* Templates View */}
      {currentView === 'templates' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <SearchBar 
              placeholder="Search workouts..." 
              onSearch={(query) => console.log('Search:', query)}
            />
            
            <PermissionGate permission="create_workouts">
              <Button
                variant="primary"
                icon={PlusIcon}
                onClick={handleCreateTemplate}
              >
                Create Workout
              </Button>
            </PermissionGate>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workout Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exercises
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      Loading workouts...
                    </td>
                  </tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No workouts found. Create your first workout!
                    </td>
                  </tr>
                ) : (
                  templates.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Dumbbell className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                            <div className="text-xs text-gray-500">{row.description || 'No description'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.category ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {row.category.emoji} {row.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {row.exercise_count || 0} exercises
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          row.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.duration_minutes} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.assignment_type === 'public' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            All Users
                          </span>
                        ) : row.assignment_type === 'standard_plan' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Standard Plan
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Specific Users
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTemplate(row)}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Edit workout"
                          >
                            <PencilIcon className="h-4 w-4 mr-1.5" />
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteTemplate(row.id, row.name)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                              title="Delete workout"
                            >
                              <TrashIcon className="h-4 w-4 mr-1.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* User Assignments View */}
      {currentView === 'user-assignments' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Users List */}
          <div className="col-span-1 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">All Users</h3>
            <div className="space-y-2">
              {standardPlanUsers.map(user => (
                <button
                  key={user.user_id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedUser?.user_id === user.user_id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{user.username || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.subscription_tier === 'rapid_results' ? 'bg-purple-100 text-purple-700' :
                        user.subscription_tier === 'standard' ? 'bg-blue-100 text-blue-700' :
                        user.subscription_tier === 'basic' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.subscription_tier === 'rapid_results' ? 'Rapid Results' :
                         user.subscription_tier === 'standard' ? 'Standard' :
                         user.subscription_tier === 'basic' ? 'Basic' :
                         'Free'}
                      </span>
                      {user.role === 'admin' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          Admin
                        </span>
                      )}
                      {user.role === 'community_manager' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                          Manager
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {standardPlanUsers.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No users found
                </div>
              )}
            </div>
          </div>
          
          {/* User's Workouts */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6">
            {selectedUser ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                    {selectedUser.username}'s Workouts
                  </h3>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    icon={PlusIcon}
                    onClick={() => {
                      setWorkoutForm(prev => ({
                        ...prev,
                        assignment_type: 'specific_user',
                        assigned_user_ids: [selectedUser.user_id]
                      }));
                      setShowTemplateModal(true);
                    }}
                  >
                    Assign Workout
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {userWorkouts.map(workout => (
                    <div
                      key={workout.workout_id || workout.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {workout.workout_name || workout.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {workout.workout_description || workout.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={workout.difficulty === 'Beginner' ? 'success' : 'warning'}>
                              {workout.difficulty}
                            </Badge>
                            <Badge variant="info">
                              {workout.duration_minutes} min
                            </Badge>
                            {workout.source_type === 'self_created' ? (
                              <Badge variant="success">Self Created</Badge>
                            ) : workout.source_type === 'assigned' ? (
                              <Badge variant="warning">Assigned by Coach</Badge>
                            ) : (
                              <Badge variant="default">Public Template</Badge>
                            )}
                          </div>
                        </div>
                        
                        {(workout.source_type === 'assigned' || workout.source_type === 'public') && (
                          <button
                            onClick={() => handleUnassignWorkout(
                              selectedUser.user_id,
                              workout.workout_id,
                              workout.workout_name
                            )}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {userWorkouts.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                      No workouts assigned yet
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select a user to view and manage their workouts
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Workout Template Creation/Edit Modal */}
      {showTemplateModal && (
        <Modal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setUserSearchQuery('');
          }}
          title={editingTemplate ? 'Edit Workout' : 'Create New Workout'}
          size="xl"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Workout Name *</label>
                <input
                  type="text"
                  value={workoutForm.name}
                  onChange={(e) => setWorkoutForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Upper Body Strength"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={workoutForm.category_id}
                  onChange={(e) => setWorkoutForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty *</label>
                <select
                  value={workoutForm.difficulty}
                  onChange={(e) => setWorkoutForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Duration (minutes) *</label>
                <input
                  type="number"
                  value={workoutForm.duration_minutes}
                  onChange={(e) => setWorkoutForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="5"
                  max="180"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={workoutForm.description}
                onChange={(e) => setWorkoutForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
                placeholder="Describe the workout..."
              />
            </div>
            
            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Assignment Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="public"
                    checked={workoutForm.assignment_type === 'public'}
                    onChange={(e) => setWorkoutForm(prev => ({ 
                      ...prev, 
                      assignment_type: e.target.value,
                      assigned_user_ids: []
                    }))}
                    className="mr-2"
                  />
                  <span>Public Template (All Users)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="standard_plan"
                    checked={workoutForm.assignment_type === 'standard_plan'}
                    onChange={(e) => setWorkoutForm(prev => ({ 
                      ...prev, 
                      assignment_type: e.target.value,
                      assigned_user_ids: []
                    }))}
                    className="mr-2"
                  />
                  <span>Standard Plan Users</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="specific_user"
                    checked={workoutForm.assignment_type === 'specific_user'}
                    onChange={(e) => setWorkoutForm(prev => ({ 
                      ...prev, 
                      assignment_type: e.target.value
                    }))}
                    className="mr-2"
                  />
                  <span>Specific User(s)</span>
                </label>
              </div>
              
              {/* User Selector - Shows when specific_user is selected */}
              {workoutForm.assignment_type === 'specific_user' && (
                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-semibold mb-2">
                    Select Users ({workoutForm.assigned_user_ids.length} selected)
                  </label>
                  
                  {/* Search Users */}
                  <input
                    type="text"
                    placeholder="Search users by username..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-3"
                  />
                  
                  {/* User List with Checkboxes */}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {standardPlanUsers
                      .filter(user => 
                        user.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.user_id.includes(userSearchQuery)
                      )
                      .map(user => (
                        <label
                          key={user.user_id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            workoutForm.assigned_user_ids.includes(user.user_id)
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-white border border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={workoutForm.assigned_user_ids.includes(user.user_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWorkoutForm(prev => ({
                                  ...prev,
                                  assigned_user_ids: [...prev.assigned_user_ids, user.user_id]
                                }));
                              } else {
                                setWorkoutForm(prev => ({
                                  ...prev,
                                  assigned_user_ids: prev.assigned_user_ids.filter(id => id !== user.user_id)
                                }));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{user.username || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              user.subscription_tier === 'rapid_results' ? 'bg-purple-100 text-purple-700' :
                              user.subscription_tier === 'standard' ? 'bg-blue-100 text-blue-700' :
                              user.subscription_tier === 'basic' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {user.subscription_tier === 'rapid_results' ? 'Rapid' :
                               user.subscription_tier === 'standard' ? 'Standard' :
                               user.subscription_tier === 'basic' ? 'Basic' : 'Free'}
                            </span>
                          </div>
                        </label>
                      ))}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setWorkoutForm(prev => ({
                        ...prev,
                        assigned_user_ids: standardPlanUsers.map(u => u.user_id)
                      }))}
                      className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkoutForm(prev => ({
                        ...prev,
                        assigned_user_ids: []
                      }))}
                      className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkoutForm(prev => ({
                        ...prev,
                        assigned_user_ids: standardPlanUsers
                          .filter(u => u.subscription_tier === 'standard')
                          .map(u => u.user_id)
                      }))}
                      className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      Standard Plan Only
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Exercises Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Exercises ({workoutForm.exercises.length})</h3>
              </div>
              
              {/* Exercise Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={exerciseSearchQuery}
                  onChange={(e) => setExerciseSearchQuery(e.target.value)}
                  placeholder="Search 1500+ exercises..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              {/* Exercise Library Grid */}
              <div className="max-h-60 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-4 gap-3">
                  {filteredExercises.map(exercise => (
                    <button
                      key={exercise.id}
                      onClick={() => handleAddExerciseToWorkout(exercise)}
                      className="text-left p-3 bg-white rounded-lg border hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <img 
                        src={exercise.gif_url} 
                        alt={exercise.name}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <p className="text-xs font-semibold truncate">{exercise.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Selected Exercises */}
              <div className="space-y-3">
                {workoutForm.exercises.map((exercise, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start gap-4">
                      <img 
                        src={exercise.gif_url} 
                        alt={exercise.exercise_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div className="col-span-2">
                          <label className="text-xs font-semibold">Exercise</label>
                          <p className="font-semibold">{exercise.exercise_name}</p>
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold">Sets</label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value))}
                            className="w-full px-2 py-1 border rounded"
                            min="1"
                            max="10"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold">Reps</label>
                          <input
                            type="text"
                            value={exercise.reps}
                            onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                            placeholder="10-12"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold">Rest (sec)</label>
                          <input
                            type="number"
                            value={exercise.rest_seconds}
                            onChange={(e) => handleUpdateExercise(index, 'rest_seconds', parseInt(e.target.value))}
                            className="w-full px-2 py-1 border rounded"
                            min="0"
                            max="300"
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <label className="text-xs font-semibold">Notes</label>
                          <input
                            type="text"
                            value={exercise.notes || ''}
                            onChange={(e) => handleUpdateExercise(index, 'notes', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                            placeholder="Optional notes..."
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveExercise(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {workoutForm.exercises.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No exercises added yet. Search and click to add exercises.
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSaveTemplate}
                disabled={!workoutForm.name || workoutForm.exercises.length === 0}
              >
                {editingTemplate ? 'Update Workout' : 'Create Workout'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Workouts;
