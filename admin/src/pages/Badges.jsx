import { useState, useEffect } from "react";
import { 
  Plus, 
  Award, 
  Trophy, 
  Target, 
  Star,
  Search,
  TrendingUp,
  Pencil,
  Trash2,
  Flame,
  Zap,
  Crown,
  Medal,
  RefreshCw,
  Calendar,
  Users,
  Activity
} from "lucide-react";
import { supabase } from '../lib/supabase';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

const Badges = () => {
  const [badges, setbadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  
  // Filters and sorting
  const [sortBy, setSortBy] = useState("points_value");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
  name: '',
  description: '',
  icon_name: 'trophy',           // maps to DB column: icon
  criteria_type: 'workout_count', // maps to DB: requirement_type
  criteria_value: 10,             // maps to DB: requirement_value
  points_reward: 100,             // maps to DB: points_value
  is_active: true
  });

  useEffect(() => {
    fetchBadges();
    fetchChallenges();
    fetchLeaderboard();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_value', { ascending: false });

      if (error) throw error;
      setbadges(data || []);
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
    }
  };
  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const { data, error } = await supabase
        .from('safe_weekly_leaderboard')
        .select('*')
        .order('position', { ascending: true })
        .limit(10);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

    const fetchChallenges = async () => {
    try {
      setChallengesLoading(true);
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching challenges:', error);
      } else {
        setChallenges(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setChallengesLoading(false);
    }
  };

  const toggleChallengeStatus = async (challengeId, currentStatus) => {
    try {
      if (!currentStatus) {
        // Activating this challenge - deactivate all others first
        await supabase
          .from('challenges')
          .update({ is_active: false })
          .neq('id', challengeId);
      }

      const { error } = await supabase
        .from('challenges')
        .update({ is_active: !currentStatus })
        .eq('id', challengeId);

      if (error) throw error;
      
      fetchChallenges();
    } catch (error) {
      console.error('Error toggling challenge:', error);
      alert('Failed to update challenge status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map UI form keys to DB columns
      const payload = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon_name,
        requirement_type: formData.criteria_type,
        requirement_value: formData.criteria_value,
        points_value: formData.points_reward,
        is_active: formData.is_active
      };

      if (editingBadge) {
        const { error } = await supabase
          .from('badges')
          .update(payload)
          .eq('id', editingBadge.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('badges')
          .insert([payload]);
        
        if (error) throw error;
      }
      
      setShowModal(false);
      setEditingBadge(null);
      resetForm();
      await fetchBadges();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (badge) => {
    if (!confirm(`Delete badge "${badge.name}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badge.id);
      
      if (error) throw error;
      await fetchBadges();
    } catch (err) {
      alert('Error deleting badge: ' + err.message);
    }
  };

  const handleEdit = (badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name || '',
      description: badge.description || '',
      icon_name: badge.icon || 'trophy',
      criteria_type: badge.requirement_type || 'workout_count',
      criteria_value: badge.requirement_value ?? 10,
      points_reward: badge.points_value ?? 100,
      is_active: badge.is_active !== false
    });
    setShowModal(true);
  };
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_name: 'trophy',
      criteria_type: 'workout_count',
      criteria_value: 10,
      points_reward: 100,
      is_active: true
    });
  };

  const createSampleBadges = async () => {
    if (!confirm('Create sample badges? This will add 5 achievement badges to get you started.')) return;

  const sampleBadges = [
      {
        name: 'First Workout',
        description: 'Complete your first workout',
    icon: 'trophy',
    requirement_type: 'workout_count',
    requirement_value: 1,
    points_value: 50,
        is_active: true
      },
      {
        name: '7 Day Streak',
        description: 'Workout for 7 consecutive days',
    icon: 'flame',
    requirement_type: 'streak_days',
    requirement_value: 7,
    points_value: 200,
        is_active: true
      },
      {
        name: '30 Workouts',
        description: 'Complete 30 total workouts',
    icon: 'star',
    requirement_type: 'workout_count',
    requirement_value: 30,
    points_value: 500,
        is_active: true
      },
      {
        name: 'Calorie Crusher',
        description: 'Burn 10,000 total calories',
    icon: 'fire',
    requirement_type: 'total_calories',
    requirement_value: 10000,
    points_value: 750,
        is_active: true
      },
      {
        name: 'Points Master',
        description: 'Earn 1,000 total points',
    icon: 'award',
    requirement_type: 'points_earned',
    requirement_value: 1000,
    points_value: 1000,
        is_active: true
      }
    ];

    try {
      const { error } = await supabase
        .from('badges')
        .insert(sampleBadges);
      
      if (error) throw error;
      alert('Sample badges created successfully!');
      await fetchBadges();
    } catch (err) {
      alert('Error creating sample badges: ' + err.message);
    }
  };

  // Icon component mapper
  const getIconComponent = (iconName) => {
    const icons = {
      'trophy': Trophy,
      'award': Award,
      'star': Star,
      'flame': Flame,
      'fire': Flame,
      'target': Target,
      'zap': Zap,
      'crown': Crown,
      'medal': Medal
    };
    return icons[iconName?.toLowerCase()] || Award;
  };

  // Filtering and sorting
  const getFilteredAndSortedBadges = () => {
    let filtered = [...badges];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(badge =>
        badge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(badge => 
        filterStatus === 'active' ? badge.is_active : !badge.is_active
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(badge => badge.requirement_type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'points_value':
          aVal = a.points_value || 0;
          bVal = b.points_value || 0;
          break;
        case 'requirement_value':
          aVal = a.requirement_value || 0;
          bVal = b.requirement_value || 0;
          break;
        default:
          aVal = a.points_value || 0;
          bVal = b.points_value || 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredAndSortedBadges = getFilteredAndSortedBadges();

  const totalBadges = badges.length;
  const activeBadges = badges.filter(b => b.is_active).length;
  const totalPoints = badges.reduce((sum, b) => sum + (b.points_value || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Badges & Achievements</h1>
              <p className="text-gray-600 mt-1">Create and manage gamification badges and rewards</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Badges</p>
                <p className="text-3xl font-bold text-gray-900">{totalBadges}</p>
                <p className="text-xs text-green-600 mt-2 font-medium">
                  {activeBadges} active
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Points</p>
                <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
                <p className="text-xs text-gray-500 mt-2">Available rewards</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Achievement Types</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(badges.map(b => b.requirement_type)).size}
                </p>
                <p className="text-xs text-gray-500 mt-2">Different criteria</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search badges by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm font-medium text-gray-700"
              >
                <option value="points_value">Points Value</option>
                <option value="name">Name</option>
                <option value="requirement_value">Requirement</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <TrendingUp className={`h-5 w-5 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {badges.length === 0 && (
                <Button
                  variant="outline"
                  onClick={createSampleBadges}
                >
                  Create Samples
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  setEditingBadge(null);
                  resetForm();
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Badge
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600 mr-2">Status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'all'
                  ? 'bg-yellow-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'inactive'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>

            <span className="text-xs font-semibold text-gray-600 ml-4 mr-2">Type:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-yellow-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('workout_count')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'workout_count'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Workouts
            </button>
            <button
              onClick={() => setFilterType('streak_days')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'streak_days'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Streaks
            </button>
            <button
              onClick={() => setFilterType('total_calories')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'total_calories'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calories
            </button>

            {/* Clear Filters */}
            {(filterStatus !== 'all' || filterType !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterType('all');
                  setSearchTerm('');
                }}
                className="ml-auto px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Badges Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading badges...</p>
              </div>
            </div>
          ) : filteredAndSortedBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Award className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No badges found</h3>
              <p className="text-gray-600 text-sm">
                {badges.length === 0 
                  ? "Click 'Create Badge' to add your first achievement!" 
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Icon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Badge
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Criteria
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedBadges.map((badge) => {
                    const IconComponent = getIconComponent(badge.icon);
                    return (
                      <tr key={badge.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                              badge.is_active 
                                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
                                : 'bg-gradient-to-br from-gray-300 to-gray-400'
                            }`}>
                              <IconComponent className={`h-7 w-7 ${badge.is_active ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900">
                              {badge.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {badge.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {badge.requirement_type?.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              Target: {badge.requirement_value}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold text-gray-900">
                              {badge.points_value}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            badge.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {badge.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(badge)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit badge"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(badge)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete badge"
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
        {!loading && filteredAndSortedBadges.length > 0 && (
          <div className="mb-8 text-center text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredAndSortedBadges.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalBadges}</span> badges
          </div>
        )}

        {/* Challenges & Leaderboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Challenges Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Challenges</h2>
                  <p className="text-xs text-gray-600">Manage community challenges</p>
                </div>
              </div>
              <button
                onClick={fetchChallenges}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Challenges"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {challengesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : challenges.length > 0 ? (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {challenges.map((challenge) => {
                  const now = new Date();
                  const startDate = new Date(challenge.start_date);
                  const endDate = new Date(challenge.end_date);
                  const isExpired = endDate < now;
                  const isUpcoming = startDate > now;
                  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={challenge.id} className={`border-2 rounded-lg p-4 transition-all ${
                      challenge.is_active 
                        ? 'border-green-400 bg-green-50 shadow-md' 
                        : isExpired 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}>
                      {/* Header with Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                            {challenge.is_active && (
                              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full uppercase">
                                Active
                              </span>
                            )}
                            {isExpired && !challenge.is_active && (
                              <span className="px-2 py-0.5 bg-gray-400 text-white text-xs font-bold rounded-full uppercase">
                                Expired
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full uppercase">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                        
                        {!isExpired && (
                          <button
                            onClick={() => toggleChallengeStatus(challenge.id, challenge.is_active)}
                            className={`ml-3 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              challenge.is_active
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {challenge.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>

                      {/* Challenge Details */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-xs">
                          <span className="text-gray-500 font-medium">Type: </span>
                          <span className="font-bold text-gray-900 capitalize">
                            {challenge.challenge_type?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500 font-medium">Metric: </span>
                          <span className="font-bold text-gray-900 capitalize">
                            {challenge.metric_type?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500 font-medium">Target: </span>
                          <span className="font-bold text-gray-900">
                            {challenge.target_value}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500 font-medium">Prize: </span>
                          <span className="font-bold text-gray-900">
                            Badge #{challenge.prize_badge_id}
                          </span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-medium">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex-1 mx-2 h-0.5 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Days Remaining (for active/upcoming challenges) */}
                      {!isExpired && (
                        <div className="mt-2 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            challenge.is_active 
                              ? daysLeft > 7 
                                ? 'text-green-700 bg-green-100' 
                                : daysLeft > 3 
                                ? 'text-orange-700 bg-orange-100' 
                                : 'text-red-700 bg-red-100'
                              : 'text-blue-700 bg-blue-100'
                          }`}>
                            {isUpcoming ? `Starts in ${Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))} days` : `${daysLeft} days remaining`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No challenges available</p>
                <p className="text-gray-400 text-sm mt-1">Create challenges to engage users</p>
              </div>
            )}
          </div>

          {/* Weekly Leaderboard */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Weekly Leaderboard</h2>
                  <p className="text-xs text-gray-600">Top performers this week</p>
                </div>
              </div>
              <button
                onClick={fetchLeaderboard}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Leaderboard"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {leaderboardLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                {leaderboard.map((user, index) => {
                  const rankColors = [
                    'from-yellow-400 to-yellow-500',
                    'from-gray-300 to-gray-400',
                    'from-orange-400 to-orange-500',
                    'from-blue-400 to-blue-500',
                    'from-blue-400 to-blue-500',
                    'from-blue-400 to-blue-500',
                    'from-blue-400 to-blue-500',
                    'from-blue-400 to-blue-500',
                    'from-blue-400 to-blue-500',
                    'from-blue-400 to-blue-500'
                  ];
                  
                  return (
                    <div key={user.user_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                      {/* Rank Badge */}
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rankColors[index]} flex items-center justify-center text-white font-bold shadow-md shrink-0`}>
                        {user.rank}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate">{user.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">{user.total_points}</div>
                          <div className="text-[10px] text-gray-500">Points</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">{user.workouts_count}</div>
                          <div className="text-[10px] text-gray-500">Workouts</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">{user.current_streak}</div>
                          <div className="text-[10px] text-gray-500">Streak</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">{user.badges_earned}</div>
                          <div className="text-[10px] text-gray-500">Badges</div>
                        </div>
                      </div>
                      
                      {/* Trophy for Top 3 */}
                      {index < 3 && (
                        <Trophy className={`w-6 h-6 shrink-0 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-500'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No leaderboard data</p>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingBadge(null);
            resetForm();
          }}
          title={editingBadge ? 'Edit Badge' : 'Create Badge'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingBadge ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Badge Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={Award}
              required
            />
            
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Criteria Type"
                value={formData.criteria_type}
                onChange={(e) => setFormData({ ...formData, criteria_type: e.target.value })}
                options={[
                  { value: 'workout_count', label: 'Workout Count' },
                  { value: 'streak_days', label: 'Streak Days' },
                  { value: 'total_calories', label: 'Total Calories' },
                  { value: 'points_earned', label: 'Points Earned' }
                ]}
                required
              />
              
              <Input
                label="Criteria Value"
                type="number"
                value={formData.criteria_value}
                onChange={(e) => setFormData({ ...formData, criteria_value: parseInt(e.target.value) })}
                icon={Target}
                required
              />
            </div>

            <Input
              label="Points Reward"
              type="number"
              value={formData.points_reward}
              onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) })}
              icon={Star}
              required
            />

            <Input
              label="Icon Name"
              value={formData.icon_name}
              onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
              helperText="e.g., trophy, medal, star"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active (users can earn this badge)
              </label>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Badges;
