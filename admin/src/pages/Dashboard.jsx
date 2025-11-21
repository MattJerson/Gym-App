import {
  Users,
  Activity,
  DollarSign,
  Dumbbell,
  CreditCard,
  Apple,
  Trophy,
  TrendingUp,
  Crown,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, supabaseAdmin } from '../lib/supabase';
import StatsCard from '../components/common/StatsCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import QuickStatsGrid from '../components/dashboard/QuickStatsGrid';
import TopItemsCard from '../components/dashboard/TopItemsCard';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    userGrowth: 0,
    newUsersThisMonth: 0,
    activeSubscriptions: 0,
    subsGrowth: 0,
    mrr: 0,
    conversionRate: 0,
    totalWorkouts: 0,
    workoutGrowth: 0,
    totalMeals: 0,
    engagementRate: 0,
    churnRisk: 0,
    recentActivity: [],
    topUsers: [],
    topWorkouts: [],
    quickStats: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Date calculations
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Fetch total users and growth
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: lastMonthUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', currentMonthStart.toISOString());

      const userGrowth = lastMonthUsers > 0 
        ? (((usersCount - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1)
        : 0;

      const newUsersThisMonth = usersCount - lastMonthUsers;

      // Fetch active subscriptions with packages (with error handling)
      let activeSubscriptions = [];
      let subsCount = 0;
      let mrr = 0;
      let subsGrowth = 0;
      
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_packages(price_monthly, price_yearly, billing_cycle)
          `)
          .eq('status', 'active');
        
        if (!error && data) {
          activeSubscriptions = data;
          subsCount = data.length;
          
          // Calculate MRR (Monthly Recurring Revenue)
          data.forEach(sub => {
            const pkg = sub.subscription_packages;
            if (pkg) {
              if (pkg.billing_cycle === 'monthly') {
                mrr += pkg.price_monthly || 0;
              } else if (pkg.billing_cycle === 'yearly') {
                mrr += (pkg.price_yearly || 0) / 12;
              }
            }
          });

          // Get subscription growth
          const { count: lastMonthSubs } = await supabase
            .from('user_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .lt('created_at', currentMonthStart.toISOString());

          subsGrowth = lastMonthSubs > 0
            ? (((subsCount - lastMonthSubs) / lastMonthSubs) * 100).toFixed(1)
            : 0;
        }
      } catch (err) {
        console.log('Could not fetch subscription data:', err.message);
      }

      // Calculate conversion rate
      const conversionRate = usersCount > 0 
        ? ((subsCount / usersCount) * 100).toFixed(1)
        : 0;

      // Fetch workout data (with error handling)
      let workoutsThisMonth = 0;
      let workoutsLastMonth = 0;
      let workoutGrowth = 0;
      let activeUsersThisWeek = 0;
      let engagementRate = 0;
      let totalWorkoutMinutes = 0;
      let avgWorkoutDuration = 0;
      
      try {
        const { count: thisMonth } = await supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', currentMonthStart.toISOString());

        const { count: lastMonth } = await supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lt('created_at', currentMonthStart.toISOString());

        workoutsThisMonth = thisMonth || 0;
        workoutsLastMonth = lastMonth || 0;
        
        workoutGrowth = lastMonth > 0
          ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1)
          : 0;

        // User engagement metrics
        const { data: activeWorkouts } = await supabase
          .from('workout_logs')
          .select('user_id')
          .gte('created_at', sevenDaysAgo.toISOString());

        activeUsersThisWeek = new Set(activeWorkouts?.map(w => w.user_id)).size;
        
        engagementRate = usersCount > 0
          ? ((activeUsersThisWeek / usersCount) * 100).toFixed(1)
          : 0;

        // Calculate workout stats
        const { data: workoutStats } = await supabase
          .from('workout_logs')
          .select('duration_minutes')
          .gte('created_at', thirtyDaysAgo.toISOString());

        totalWorkoutMinutes = workoutStats?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
        avgWorkoutDuration = workoutStats?.length > 0 
          ? Math.round(totalWorkoutMinutes / workoutStats?.length) 
          : 0;
      } catch (err) {
        console.log('Could not fetch workout data:', err.message);
      }

      // Fetch meal data (with error handling)
      let mealsCount = 0;
      try {
        const { count } = await supabase
          .from('user_meals')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());
        mealsCount = count || 0;
      } catch (err) {
        console.log('Could not fetch meal data:', err.message);
      }

      // Calculate churn risk (with error handling)
      let churnRisk = 0;
      let inactiveUsers = 0;
      try {
        const { data: recentActivityData } = await supabase
          .from('workout_logs')
          .select('user_id')
          .gte('created_at', fourteenDaysAgo.toISOString());

        const activeUserIds = new Set(recentActivityData?.map(w => w.user_id));
        inactiveUsers = usersCount - activeUserIds.size;
        churnRisk = usersCount > 0
          ? ((inactiveUsers / usersCount) * 100).toFixed(1)
          : 0;
      } catch (err) {
        console.log('Could not calculate churn risk:', err.message);
      }

      // Fetch weekly leaderboard top performers (with error handling)
      let topUsers = [];
      try {
        const { data } = await supabase
          .from('weekly_challenge_leaderboard')
          .select('*')
          .order('challenge_score', { ascending: false })
          .limit(5);
        
        // Map to expected format
        topUsers = (data || []).map(user => ({
          user_id: user.user_id,
          total_points: user.challenge_score || 0,
          current_streak: user.current_streak || 0,
          profiles: {
            full_name: user.full_name || user.nickname || 'Unknown User'
          }
        }));
      } catch (err) {
        console.log('Could not fetch weekly leaderboard:', err.message);
      }

      // Fetch most popular workouts (with error handling)
      let topWorkouts = [];
      try {
        const { data: popularWorkouts } = await supabase
          .from('workout_logs')
          .select('workout_name')
          .gte('created_at', thirtyDaysAgo.toISOString());

        const workoutCounts = {};
        popularWorkouts?.forEach(w => {
          workoutCounts[w.workout_name] = (workoutCounts[w.workout_name] || 0) + 1;
        });
        topWorkouts = Object.entries(workoutCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
      } catch (err) {
        console.log('Could not fetch popular workouts:', err.message);
      }

      // Fetch admin activity logs (may not exist if migration not run yet)
      let adminActivities = [];
      try {
        const { data, error } = await supabase
          .from('admin_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50); // Fetch more to have enough after combining
        
        if (!error) {
          adminActivities = data || [];
        }
      } catch (err) {
        console.log('Admin activity log table not available yet:', err.message);
      }

      // Fetch recent users ONLY if admin_activity_log is empty (backward compatibility)
      let recentUsers = [];
      if (adminActivities.length === 0 || !adminActivities.some(a => a.activity_type === 'user_registered')) {
        const { data } = await supabase
          .from('registration_profiles')
          .select(`
            user_id,
            details,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(6);
        
        recentUsers = data || [];
      }

      // Fetch emails from auth.users for recent users (using admin client)
      let emailMap = {};
      try {
        if (supabaseAdmin) {
          const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
          if (!error && authUsers?.users) {
            authUsers.users.forEach(u => {
              emailMap[u.id] = u.email;
            });
          }
        } else {
          console.log('Service role key not configured - emails will not be displayed');
        }
      } catch (err) {
        console.log('Could not fetch auth users:', err.message);
      }

      // Fetch recent workouts
      const { data: recentWorkouts } = await supabase
        .from('workout_logs')
        .select(`
          id,
          workout_name,
          duration_minutes,
          calories_burned,
          created_at,
          user_id,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      // Fetch most popular workouts
      const { data: popularWorkouts } = await supabase
        .from('workout_logs')
        .select('workout_name')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Format recent activity with detailed info - combining all sources
      const activities = [
        // Admin activity logs (shuffles, notifications, moderation, user registrations, etc.)
        ...(adminActivities?.map(a => {
          // For user registrations, enrich with email
          if (a.activity_type === 'user_registered') {
            const userEmail = emailMap[a.target_id] || emailMap[a.metadata?.user_id] || 'No email';
            const displayName = a.metadata?.nickname || 'Unknown User';
            const shortUID = (a.target_id || a.metadata?.user_id || '').substring(0, 8) + '...';
            
            return {
              id: a.id,
              type: 'user',
              activityType: 'user_registered',
              name: 'New User Registered',
              action: `Name: ${displayName}`,
              email: userEmail,
              metadata: `UID: ${shortUID}`,
              time: formatTimeAgo(a.created_at),
              timestamp: a.created_at
            };
          }
          
          // For other admin activities
          return {
            id: a.id,
            type: a.activity_category,
            activityType: a.activity_type,
            name: a.title,
            action: a.description || a.title,
            metadata: a.metadata?.nickname || a.metadata?.content_preview || 
                     (a.metadata?.notification_title ? `"${a.metadata.notification_title}"` : '') ||
                     (a.metadata?.channel_id ? `in ${a.metadata.channel_id}` : ''),
            time: formatTimeAgo(a.created_at),
            timestamp: a.created_at
          };
        }) || []),
        // User registrations - ONLY if admin_activity_log doesn't have them (backward compatibility)
        ...(recentUsers?.map(u => {
          const displayName = u.details?.display_name || 'Unknown User';
          const shortUID = u.user_id.substring(0, 8) + '...';
          const userEmail = emailMap[u.user_id] || 'No email';
          
          return {
            id: u.user_id,
            type: 'user',
            activityType: 'user_registered',
            name: 'New User Registered',
            action: `Name: ${displayName}`,
            email: userEmail,
            metadata: `UID: ${shortUID}`,
            time: formatTimeAgo(u.created_at),
            timestamp: u.created_at
          };
        }) || []),
        // Workout completions
        ...(recentWorkouts?.map(w => ({
          id: w.id,
          type: 'workout',
          activityType: 'workout_completed',
          name: w.profiles?.full_name || 'User',
          action: `Completed ${w.workout_name}`,
          metadata: `${w.duration_minutes}min • ${w.calories_burned} cal`,
          time: formatTimeAgo(w.created_at),
          timestamp: w.created_at
        })) || [])
      ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Show top 10 most recent activities

      // Executive-level quick stats
      const quickStats = [
        { 
          label: 'MRR (Monthly Revenue)', 
          value: `$${mrr.toFixed(0).toLocaleString()}`, 
          subtitle: `${subsCount} active subscriptions`,
          trend: parseFloat(subsGrowth)
        },
        { 
          label: 'User Engagement', 
          value: `${engagementRate}%`, 
          subtitle: `${activeUsersThisWeek} active this week`,
          trend: parseFloat(engagementRate) - 50 // Compare to 50% baseline
        },
        { 
          label: 'Avg Session Time', 
          value: `${avgWorkoutDuration} min`, 
          subtitle: `${(totalWorkoutMinutes / 60).toFixed(0)} hours total`,
          trend: parseFloat(workoutGrowth)
        },
        { 
          label: 'Churn Risk', 
          value: `${churnRisk}%`, 
          subtitle: `${inactiveUsers} inactive users`,
          trend: -parseFloat(churnRisk) // Negative is good for churn
        }
      ];

      setDashboardData({
        totalUsers: usersCount || 0,
        userGrowth: parseFloat(userGrowth),
        newUsersThisMonth: newUsersThisMonth,
        activeSubscriptions: subsCount || 0,
        subsGrowth: parseFloat(subsGrowth),
        mrr: mrr,
        conversionRate: parseFloat(conversionRate),
        totalWorkouts: workoutsThisMonth || 0,
        workoutGrowth: parseFloat(workoutGrowth),
        totalMeals: mealsCount || 0,
        engagementRate: parseFloat(engagementRate),
        churnRisk: parseFloat(churnRisk),
        recentActivity: activities,
        topUsers: topUsers?.map(u => ({
          id: u.user_id,
          name: u.profiles?.full_name || 'User',
          subtitle: `${u.total_workouts} workouts • ${u.badges_earned} badges`,
          value: u.total_points.toLocaleString(),
          badge: `${u.current_streak} day streak`
        })) || [],
        topWorkouts: topWorkouts.map(w => ({
          id: w.name,
          name: w.name,
          subtitle: 'Last 30 days',
          value: w.count,
          badge: 'completions'
        })),
        quickStats
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="admin-page-compact">
      <div className="admin-page-container">
        {/* Header - Streamlined */}
        <div className="page-header">
          <div className="page-header-title">
            <Zap className="h-8 w-8 text-blue-600" />
            <div>
              <h1>Executive Dashboard</h1>
              <p className="page-header-subtitle">Real-time business metrics and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600">Live Data</span>
          </div>
        </div>

        {/* Main Stats Grid - Compact */}
        <div className="admin-grid-4 mb-4">
          <StatsCard
            title="Total Users"
            value={dashboardData.totalUsers.toLocaleString()}
            icon={Users}
            color="blue"
            subtitle={`${dashboardData.newUsersThisMonth} new this month`}
          />
          <StatsCard
            title="Active Subscriptions"
            value={dashboardData.activeSubscriptions.toLocaleString()}
            icon={Crown}
            color="purple"
            subtitle={`${dashboardData.conversionRate}% conversion rate`}
          />
          <StatsCard
            title="Workouts This Month"
            value={dashboardData.totalWorkouts.toLocaleString()}
            icon={Dumbbell}
            color="orange"
            subtitle={`${dashboardData.engagementRate}% user engagement`}
          />
          <StatsCard
            title="Meals Logged (7d)"
            value={dashboardData.totalMeals.toLocaleString()}
            icon={Apple}
            color="green"
            subtitle="Nutrition tracking active"
          />
        </div>

        {/* Content Grid - Tighter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivityCard 
              activities={dashboardData.recentActivity} 
              loading={loading}
            />
          </div>

          {/* Quick Stats */}
          <div>
            <QuickStatsGrid 
              stats={dashboardData.quickStats} 
              loading={loading}
            />
          </div>
        </div>

        {/* Top Items Grid - Compact */}
        <div className="admin-grid-2 mb-4">
          <TopItemsCard
            title="🏆 Weekly Leaderboard"
            subtitle="Top performers this week"
            items={dashboardData.topUsers}
            type="users"
            loading={loading}
          />
          <TopItemsCard
            title="💪 Most Popular Workouts"
            items={dashboardData.topWorkouts}
            type="workouts"
            loading={loading}
          />
        </div>

        {/* Executive Summary Footer - Streamlined */}
                {/* Subscription Performance Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6" />
            <h3 className="text-xl font-bold">Key Business Metrics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">${dashboardData.mrr.toFixed(0).toLocaleString()}</p>
              <p className="text-xs text-blue-100 mt-1 font-medium">Monthly Recurring Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{dashboardData.conversionRate}%</p>
              <p className="text-xs text-blue-100 mt-1 font-medium">Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{dashboardData.engagementRate}%</p>
              <p className="text-xs text-blue-100 mt-1 font-medium">User Engagement</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{dashboardData.churnRisk}%</p>
              <p className="text-xs text-blue-100 mt-1 font-medium">Churn Risk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
