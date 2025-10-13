import { useState, useEffect } from "react";
import { Plus, Award, Trophy, Target, Star } from "lucide-react";
import { supabase } from '../lib/supabase';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

const Badges = () => {
  const [badges, setbadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);

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
  fetchLeaderboard();
  fetchActiveChallenge();
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

  const fetchActiveChallenge = async () => {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('challenges')
        .select('id,title,description,challenge_type,metric_type,target_value,start_date,end_date,prize_badge_id,prize_description')
        .eq('is_active', true)
        .lte('start_date', nowIso)
        .gte('end_date', nowIso)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveChallenge(data || null);
    } catch (err) {
      console.error('Error fetching active challenge:', err);
      setActiveChallenge(null);
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

  const columns = [
    {
      header: 'Badge',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
            <Award className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Criteria',
      accessor: 'requirement_type',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900 capitalize">
            {row.requirement_type?.replace('_', ' ')}
          </p>
          <p className="text-xs text-gray-500">Threshold: {row.requirement_value}</p>
        </div>
      )
    },
    {
      header: 'Points',
      accessor: 'points_value',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-gray-900">{row.points_value}</span>
        </div>
      )
    },
    {
      header: 'Icon',
      accessor: 'icon',
      render: (row) => (
        <Badge variant="warning">{row.icon}</Badge>
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

  const filteredBadges = badges.filter(badge =>
    badge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBadges = badges.length;
  const activeBadges = badges.filter(b => b.is_active).length;
  const totalPoints = badges.reduce((sum, b) => sum + (b.points_value || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-7xl mx-auto">        <PageHeader
          icon={Award}
          title="Badges & Achievements"
          subtitle="Create and manage gamification badges and rewards"
          breadcrumbs={['Admin', 'Badges']}
          actions={
            <div className="flex items-center gap-3">
              {badges.length === 0 && (
                <Button
                  variant="secondary"
                  icon={Star}
                  onClick={createSampleBadges}
                >
                  Create Sample Badges
                </Button>
              )}
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingBadge(null);
                  resetForm();
                  setShowModal(true);
                }}
              >
                Create Badge
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <StatsCard
            title="Total Badges"
            value={totalBadges}
            icon={Award}
            color="yellow"
            subtitle={`${activeBadges} active`}
          />
          <StatsCard
            title="Total Points"
            value={totalPoints}
            icon={Star}
            color="purple"
            subtitle="Available rewards"
          />
          <StatsCard
            title="Achievement Types"
            value={new Set(badges.map(b => b.criteria_type)).size}
            icon={Target}
            color="blue"
            subtitle="Different criteria"
          />
        </div>

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search badges..."
        />        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredBadges}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={['edit', 'delete']}
          emptyMessage={
            badges.length === 0 
              ? "No badges found. Click 'Create Badge' to add your first achievement badge!"
              : "No badges match your search criteria"
          }
        />

        {/* Active Challenge + Weekly Leaderboard Section */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            {/* Active Challenge Card */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Active Challenge</h3>
              {activeChallenge ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-blue-700">{activeChallenge.title}</p>
                      <p className="text-sm text-blue-800/80">{activeChallenge.description}</p>
                      <p className="text-xs text-blue-900 mt-1">
                        Type: {activeChallenge.challenge_type} • Metric: {activeChallenge.metric_type} • Target: {activeChallenge.target_value}
                      </p>
                      <p className="text-xs text-blue-900 mt-1">
                        {new Date(activeChallenge.start_date).toLocaleDateString()} – {new Date(activeChallenge.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No active challenge right now.</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Weekly Leaderboard</h3>
                  <p className="text-sm text-gray-600">Top performers this week</p>
                </div>
              </div>
              <Button
                variant="outline"
                icon={Award}
                onClick={fetchLeaderboard}
                loading={leaderboardLoading}
              >
                Refresh
              </Button>
            </div>

            {leaderboardLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : leaderboard.length > 0 ? (              <div className="space-y-3">
                {leaderboard.map((user, index) => {
                  const rankColors = [
                    'from-yellow-400 to-yellow-500',    // 1st - Gold
                    'from-gray-300 to-gray-400',        // 2nd - Silver
                    'from-orange-400 to-orange-500',    // 3rd - Bronze
                    'from-blue-400 to-blue-500',        // 4th+
                  ];
                  const rankColor = rankColors[Math.min(index, 3)];
                  
                  return (
                    <div
                      key={user.anon_id || index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-l-4 border-yellow-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank Badge */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rankColor} flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-bold text-lg">#{user.position || index + 1}</span>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {user.display_name || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            User: {user.anon_id ? String(user.anon_id) : 'N/A'}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Points</p>
                            <p className="text-xl font-bold text-purple-600">
                              {user.total_points || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Workouts</p>
                            <p className="text-xl font-bold text-blue-600">
                              {user.total_workouts || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Streak</p>
                            <p className="text-xl font-bold text-orange-600">
                              {user.current_streak || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Badges</p>
                            <p className="text-xl font-bold text-green-600">
                              {user.badges_earned || 0}
                            </p>
                          </div>
                        </div>

                        {/* Badge if top 3 */}
                        {index < 3 && (
                          <div className="ml-4">
                            <Trophy className={`h-8 w-8 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              'text-orange-500'
                            }`} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No leaderboard data available yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Users need to complete workouts to appear on the leaderboard
                </p>
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
