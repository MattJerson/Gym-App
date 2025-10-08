import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Trophy, Award, Calendar, Target } from "lucide-react";
import { supabase } from '../lib/supabase';

const Badges = () => {
  // State
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [adminLeaderboard, setAdminLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges' or 'challenges'

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Form data for badges
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🏅",
    color: "#f1c40f",
    category: "achievement",
    rarity: "common",
    points_value: 10,
    requirement_type: "workout_count",
    requirement_value: 1,
  });

  // Form data for challenges
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    challenge_type: "weekly",
    metric_type: "workouts_completed",
    target_value: null,
    start_date: "",
    end_date: "",
    prize_description: "",
  });

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchBadges(),
        fetchChallenges(),
        fetchLeaderboard(),
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    const { data, error: fetchError } = await supabase
      .from('badges')
      .select(`
        *,
        user_badges(count)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    // Transform data to include earned count
    const transformedBadges = data.map(badge => ({
      ...badge,
      earned: badge.user_badges?.[0]?.count || 0,
    }));

    setBadges(transformedBadges);
  };

  const fetchChallenges = async () => {
    const { data, error: fetchError } = await supabase
      .from('challenges')
      .select(`
        *,
        challenge_progress(count)
      `)
      .order('is_active', { ascending: false }) // Active first
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    const transformedChallenges = data.map(challenge => ({
      ...challenge,
      participants: challenge.challenge_progress?.[0]?.count || 0,
    }));

    console.log('Fetched challenges:', transformedChallenges);
    console.log('Active challenges:', transformedChallenges.filter(c => c.is_active).length);
    console.log('Inactive challenges:', transformedChallenges.filter(c => !c.is_active).length);

    setChallenges(transformedChallenges);
  };
  const fetchLeaderboard = async () => {
    try {
      // For admin, query the FULL PII leaderboard directly (weekly_leaderboard)
      // Admin has service role access, so this is allowed
      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .limit(100);

      if (error) {
        console.warn('Could not fetch admin leaderboard, falling back to safe view:', error);
        // Fallback to safe view if admin access fails
        const { data: safeData, error: safeError } = await supabase
          .from('safe_weekly_leaderboard')
          .select('*')
          .limit(100);
        
        if (safeError) throw safeError;
        
        const normalized = (safeData || []).map((row, index) => ({
          user_id: row.anon_id,
          user_name: row.display_name || `Athlete #${index + 1}`,
          total_points: row.total_points ?? 0,
          current_streak: row.current_streak ?? 0,
          total_workouts: row.total_workouts ?? 0,
          badges_earned: row.badges_earned ?? 0,
          position: row.position ?? index + 1,
        }));
        setLeaderboard(normalized);
        return;
      }

      const normalized = (data || []).map((row, index) => ({
        user_id: row.user_id,
        user_name: row.user_name || row.email || `User #${index + 1}`,
        email: row.email,
        total_points: row.total_points ?? 0,
        current_streak: row.current_streak ?? 0,
        total_workouts: row.total_workouts ?? 0,
        badges_earned: row.badges_earned ?? 0,
        position: row.position ?? index + 1,
      }));

      setLeaderboard(normalized);

      // Optionally fetch the full PII leaderboard from a secure server endpoint (admin-only)
      try {
        const ADMIN_API = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8080/api/admin/weekly-leaderboard';
        const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;
        if (ADMIN_SECRET) {
          const res = await fetch(`${ADMIN_API}?limit=100`, {
            headers: {
              'x-admin-secret': ADMIN_SECRET,
              'Content-Type': 'application/json',
            },
          });

          if (res.ok) {
            const json = await res.json();
            const adminRows = (json?.data || []).map((r, i) => ({
              user_id: r.user_id,
              email: r.email || r.user_email || null,
              full_name: r.user_name || r.full_name || null,
              total_points: r.total_points ?? 0,
              current_streak: r.current_streak ?? 0,
              total_workouts: r.total_workouts ?? 0,
              badges_earned: r.badges_earned ?? 0,
              position: r.position ?? i + 1,
            }));
            setAdminLeaderboard(adminRows);
          } else {
            console.warn('Admin leaderboard fetch failed', res.status);
            setAdminLeaderboard([]);
          }
        } else {
          setAdminLeaderboard([]);
        }
      } catch (adminErr) {
        console.warn('Error fetching admin leaderboard:', adminErr);
        setAdminLeaderboard([]);
      }

    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setLeaderboard([]);
      setAdminLeaderboard([]);
    }
  };

  // Badge Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'points_value' || name === 'requirement_value' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingId) {
        // Update existing badge
        const { error: updateError } = await supabase
          .from('badges')
          .update(formData)
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        // Create new badge
        const { error: insertError } = await supabase
          .from('badges')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      await fetchBadges();
      handleCancel();
    } catch (err) {
      console.error('Error saving badge:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchBadges();
    } catch (err) {
      console.error('Error deleting badge:', err);
      setError(err.message);
    }
  };

  const handleEdit = (badge) => {
    setEditingId(badge.id);
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      category: badge.category,
      rarity: badge.rarity,
      points_value: badge.points_value,
      requirement_type: badge.requirement_type,
      requirement_value: badge.requirement_value,
    });
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      icon: "🏅",
      color: "#f1c40f",
      category: "achievement",
      rarity: "common",
      points_value: 10,
      requirement_type: "workout_count",
      requirement_value: 1,
    });
  };

  // Challenge Handlers
  const handleChallengeInputChange = (e) => {
    const { name, value } = e.target;
    setChallengeForm((prev) => ({
      ...prev,
      [name]: name === 'target_value' ? (value ? parseInt(value) : null) : value,
    }));
  };

  const handleChallengeSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('challenges')
        .insert([challengeForm]);

      if (insertError) throw insertError;

      await fetchChallenges();
      handleChallengeCancel();
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError(err.message);
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchChallenges();
    } catch (err) {
      console.error('Error deleting challenge:', err);
      setError(err.message);
    }
  };

  const handleActivateTemplate = async (template) => {
    try {
      // Calculate dates based on challenge type
      const now = new Date();
      let startDate, endDate;

      if (template.challenge_type === 'weekly') {
        // Start on next Monday
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + daysUntilMonday);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      } else if (template.challenge_type === 'monthly') {
        // Start on 1st of next month
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
      } else {
        // Special event - start tomorrow
        startDate = new Date(now);
        startDate.setDate(now.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      }

      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          is_active: true,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', template.id);

      if (updateError) throw updateError;

      await fetchChallenges();
      
      alert(`Challenge "${template.title}" activated!\nStart: ${startDate.toLocaleDateString()}\nEnd: ${endDate.toLocaleDateString()}`);
    } catch (err) {
      console.error('Error activating template:', err);
      setError(err.message);
    }
  };

  const handleDeactivateChallenge = async (challenge) => {
    if (!confirm(`Deactivate "${challenge.title}"? It will return to templates.`)) return;

    try {
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ is_active: false })
        .eq('id', challenge.id);

      if (updateError) throw updateError;

      await fetchChallenges();
    } catch (err) {
      console.error('Error deactivating challenge:', err);
      setError(err.message);
    }
  };

  const handleChallengeCancel = () => {
    setIsChallengeModalOpen(false);
    setChallengeForm({
      title: "",
      description: "",
      challenge_type: "weekly",
      metric_type: "workouts_completed",
      target_value: null,
      start_date: "",
      end_date: "",
      prize_description: "",
    });
  };

  const handleViewDetails = (badge) => {
    setSelectedBadge(badge);
    setIsDetailsOpen(true);
  };

  // Dynamic Stats
  const totalBadges = badges.length;
  const mostEarned = badges.length > 0 ? badges.reduce(
    (max, b) => (b.earned > max.earned ? b : max),
    badges[0]
  ) : null;
  const rarestBadge = badges.length > 0 ? badges.reduce(
    (min, b) => (b.earned < min.earned ? b : min),
    badges[0]
  ) : null;

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-gray-100 text-gray-700',
      rare: 'bg-blue-100 text-blue-700',
      epic: 'bg-purple-100 text-purple-700',
      legendary: 'bg-yellow-100 text-yellow-700',
    };
    return colors[rarity] || colors.common;
  };

  const getChallengeTypeColor = (type) => {
    const colors = {
      weekly: 'bg-green-100 text-green-700',
      monthly: 'bg-blue-100 text-blue-700',
      special_event: 'bg-purple-100 text-purple-700',
    };
    return colors[type] || colors.weekly;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading gamification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gamification & Challenges
          </h2>
          <p className="text-sm text-gray-600 mt-1">Manage badges, challenges, and leaderboard</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'badges' ? 'challenges' : 'badges')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            {activeTab === 'badges' ? (
              <><Calendar className="h-4 w-4" /> View Challenges</>
            ) : (
              <><Award className="h-4 w-4" /> View Badges</>
            )}
          </button>
          <button
            onClick={() => activeTab === 'badges' ? setIsOpen(true) : setIsChallengeModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'badges' ? 'Create Badge' : 'Create Challenge'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Leaderboard + Badge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">        {/* Top Performers */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold">Weekly Leaderboard</h3>
            </div>
            {challenges.filter(c => c.is_active).length > 0 && (
              <p className="text-sm text-purple-600 font-medium">
                🎯 Active: {challenges.filter(c => c.is_active)[0]?.title}
              </p>
            )}
          </div>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((user, index) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <div>
                    <p className="font-semibold">{user.user_name || 'Anonymous'}</p>
                    {user.email && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                    <p className="text-sm text-gray-600">{user.total_points} points</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{user.total_workouts} workouts</p>
                  <p className="text-xs text-gray-400">{user.current_streak}🔥 streak</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-gray-500 py-4">No active users this week</p>
            )}
          </div>
        </div>

        {/* Badge Statistics */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Badge Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Total Badges</span>
              <span className="font-semibold">{totalBadges}</span>
            </div>
            {mostEarned && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Most Earned</span>
                <span className="font-semibold">
                  {mostEarned.icon} {mostEarned.name} ({mostEarned.earned})
                </span>
              </div>
            )}
            {rarestBadge && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>Rarest Badge</span>
                <span className="font-semibold">
                  {rarestBadge.icon} {rarestBadge.name} ({rarestBadge.earned})
                </span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-200">
              <span className="text-purple-700">Active Challenges</span>
              <span className="font-semibold text-purple-700">{challenges.filter(c => c.is_active).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Available Badges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="text-center mb-3">
                  <span className="text-4xl mb-2 block">{badge.icon}</span>
                  <h4 className="font-semibold text-lg">{badge.name}</h4>
                  <div className="flex justify-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(badge.rarity)}`}>
                      {badge.rarity}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {badge.points_value} pts
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 text-center min-h-[40px]">
                  {badge.description}
                </p>
                <div className="text-xs text-gray-500 text-center mb-3">
                  <p>Requirement: {badge.requirement_type?.replace(/_/g, ' ')} ≥ {badge.requirement_value}</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t pt-3">
                  <span className="text-sm text-gray-500">
                    Earned by {badge.earned} users
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleViewDetails(badge)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(badge)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Badge"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(badge.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Badge"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Challenges Tab - Combined Active & Inactive */}
      {activeTab === 'challenges' && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">All Challenges</h3>
              <p className="text-sm text-gray-500 mt-1">
                {challenges.filter(c => c.is_active).length} active • {challenges.filter(c => !c.is_active).length} inactive
              </p>
            </div>
            <span className="text-sm text-gray-500">{challenges.length} total</span>
          </div>

          {/* Active Challenges Section */}
          {challenges.filter(c => c.is_active).length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-md text-gray-700 mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                Active Challenges
                <span className="text-xs font-normal text-gray-500">({challenges.filter(c => c.is_active).length})</span>
              </h4>
              <div className="space-y-3">
                {challenges
                  .filter(challenge => challenge.is_active)
                  .map((challenge) => (
                    <div
                      key={challenge.id}
                      className="border-2 border-green-300 bg-green-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-green-600" />
                            <h5 className="font-semibold text-lg">{challenge.title}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${getChallengeTypeColor(challenge.challenge_type)}`}>
                              {challenge.challenge_type}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-400">
                              ✓ Active
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{challenge.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span>📊 Metric: {challenge.metric_type?.replace(/_/g, ' ')}</span>
                            {challenge.target_value && <span>🎯 Target: {challenge.target_value}</span>}
                            <span>👥 {challenge.participants} participants</span>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-600 mt-2">
                            <span>Start: {new Date(challenge.start_date).toLocaleDateString()}</span>
                            <span>End: {new Date(challenge.end_date).toLocaleDateString()}</span>
                          </div>
                          {challenge.prize_description && (
                            <p className="text-sm text-purple-600 font-medium mt-2">🏆 {challenge.prize_description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => handleDeactivateChallenge(challenge)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                            title="Deactivate Challenge"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Challenge"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Inactive Challenges Section (Templates) */}
          {challenges.filter(c => !c.is_active).length > 0 && (
            <div>
              <h4 className="font-semibold text-md text-gray-700 mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-gray-400 rounded-full"></span>
                Inactive Challenges (Templates)
                <span className="text-xs font-normal text-gray-500">({challenges.filter(c => !c.is_active).length})</span>
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Click the activate button to enable a template with automatically calculated dates
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {challenges
                  .filter(challenge => !challenge.is_active)
                  .map((challenge) => (
                    <div
                      key={challenge.id}
                      className="border border-gray-200 bg-white rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-md">{challenge.title}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${getChallengeTypeColor(challenge.challenge_type)}`}>
                              {challenge.challenge_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">📊 {challenge.metric_type?.replace(/_/g, ' ')}</span>
                            {challenge.target_value && (
                              <span className="bg-gray-100 px-2 py-1 rounded">🎯 Target: {challenge.target_value}</span>
                            )}
                          </div>
                          {challenge.prize_description && (
                            <p className="text-xs text-purple-600 mb-2">🏆 {challenge.prize_description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <button
                          onClick={() => handleActivateTemplate(challenge)}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center justify-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Activate
                        </button>
                        <button
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50"
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {challenges.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No challenges found</p>
              <p className="text-sm text-gray-400">Create a custom challenge or run the SQL query to add templates</p>
            </div>
          )}
        </div>
      )}

      {/* ✅ View Details Modal */}
      {isDetailsOpen && selectedBadge && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Badge Details
              </h3>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-center mb-4">
                <span className="text-6xl">{selectedBadge.icon}</span>
              </div>
              <p><strong>Name:</strong> {selectedBadge.name}</p>
              <p><strong>Description:</strong> {selectedBadge.description}</p>
              <p><strong>Category:</strong> {selectedBadge.category}</p>
              <p><strong>Rarity:</strong> <span className={`px-2 py-1 rounded text-sm ${getRarityColor(selectedBadge.rarity)}`}>{selectedBadge.rarity}</span></p>
              <p><strong>Points Value:</strong> {selectedBadge.points_value}</p>
              <p><strong>Requirement:</strong> {selectedBadge.requirement_type?.replace(/_/g, ' ')} ≥ {selectedBadge.requirement_value}</p>
              <p><strong>Earned by:</strong> {selectedBadge.earned} users</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Create/Edit Badge Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Badge" : "Create Badge"}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Badge Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., First Workout"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon (emoji) *
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    required
                    placeholder="🏅"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="2"
                  placeholder="Brief description of how to earn this badge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="achievement">Achievement</option>
                    <option value="milestone">Milestone</option>
                    <option value="streak">Streak</option>
                    <option value="social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rarity *
                  </label>
                  <select
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Value *
                  </label>
                  <input
                    type="number"
                    name="points_value"
                    value={formData.points_value}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirement Type *
                  </label>
                  <select
                    name="requirement_type"
                    value={formData.requirement_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="workout_count">Workout Count</option>
                    <option value="streak_days">Streak Days</option>
                    <option value="calories_burned">Calories Burned</option>
                    <option value="exercise_count">Exercise Count</option>
                    <option value="challenge_joined">Challenge Joined</option>
                    <option value="challenge_won">Challenge Won</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirement Value *
                  </label>
                  <input
                    type="number"
                    name="requirement_value"
                    value={formData.requirement_value}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-32 h-10 border border-gray-300 rounded-lg"
                />
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingId ? "Update Badge" : "Create Badge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Create Challenge Modal */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Create New Challenge
              </h3>
              <button
                onClick={handleChallengeCancel}
                className="text-gray-400 hover:text-gray-600 ml-auto"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleChallengeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={challengeForm.title}
                  onChange={handleChallengeInputChange}
                  required
                  placeholder="e.g., Weekly Warrior Challenge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={challengeForm.description}
                  onChange={handleChallengeInputChange}
                  required
                  rows="3"
                  placeholder="Describe the challenge and how users can participate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Challenge Type *
                  </label>
                  <select
                    name="challenge_type"
                    value={challengeForm.challenge_type}
                    onChange={handleChallengeInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="special_event">Special Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metric Type *
                  </label>
                  <select
                    name="metric_type"
                    value={challengeForm.metric_type}
                    onChange={handleChallengeInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="workouts_completed">Workouts Completed</option>
                    <option value="calories_burned">Calories Burned</option>
                    <option value="total_exercises">Total Exercises</option>
                    <option value="streak_days">Streak Days</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={challengeForm.start_date}
                    onChange={handleChallengeInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={challengeForm.end_date}
                    onChange={handleChallengeInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Value (optional)
                </label>
                <input
                  type="number"
                  name="target_value"
                  value={challengeForm.target_value || ''}
                  onChange={handleChallengeInputChange}
                  placeholder="e.g., 1000 (calories to burn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for leaderboard-style challenges</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prize Description
                </label>
                <input
                  type="text"
                  name="prize_description"
                  value={challengeForm.prize_description}
                  onChange={handleChallengeInputChange}
                  placeholder="e.g., Top 10 earn Challenge Champion badge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleChallengeCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Badges;
