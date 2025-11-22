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
  Zap,
  Award,
  Target
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
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // ==================== USERS DATA ====================
      // Fetch all profiles with created_at
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at, full_name, nickname');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const usersCount = allProfiles?.length || 0;
      const usersThisMonth = allProfiles?.filter(p => 
        new Date(p.created_at) >= currentMonthStart
      ).length || 0;

      const usersLastMonth = allProfiles?.filter(p => {
        const createdDate = new Date(p.created_at);
        return createdDate >= lastMonthStart && createdDate < currentMonthStart;
      }).length || 0;

      const userGrowth = usersLastMonth > 0 
        ? parseFloat((((usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1))
        : (usersThisMonth > 0 ? 100 : 0);

      const newUsersThisMonth = usersThisMonth;

      // ==================== SUBSCRIPTIONS DATA ====================
      // Use same query as Subscriptions page for consistency
      let allSubscriptions = [];
      let subsCount = 0;
      let mrr = 0;
      let subsGrowth = 0;
      
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_packages (
              id,
              name,
              slug,
              price,
              billing_interval
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching subscriptions:', error);
        } else {
          allSubscriptions = data || [];
          
          console.log('📊 Total subscriptions found:', allSubscriptions.length);
          console.log('📊 Sample subscription:', allSubscriptions[0]);
          
          // Filter active subscriptions (same as Subscriptions page)
          const activeSubscriptions = allSubscriptions.filter(sub => sub.status === 'active');
          
          console.log('💰 Active subscriptions:', activeSubscriptions.length);
          subsCount = activeSubscriptions.length;

          // Calculate MRR using the joined package data
          activeSubscriptions.forEach(sub => {
            const pkg = sub.subscription_packages;
            if (pkg && pkg.price) {
              if (pkg.billing_interval === 'month') {
                mrr += pkg.price;
              } else if (pkg.billing_interval === 'year') {
                mrr += pkg.price / 12;
              }
            }
          });

          console.log('💵 Monthly Recurring Revenue:', mrr);

          // Calculate subscription growth (this month vs last month)
          const subsThisMonth = allSubscriptions.filter(sub => 
            sub.status === 'active' &&
            new Date(sub.created_at) >= currentMonthStart
          ).length;

          const subsLastMonthCount = allSubscriptions.filter(sub => {
            const createdDate = new Date(sub.created_at);
            return createdDate >= lastMonthStart && 
                   createdDate < currentMonthStart &&
                   sub.status === 'active';
          }).length;

          subsGrowth = subsLastMonthCount > 0
            ? parseFloat((((subsThisMonth - subsLastMonthCount) / subsLastMonthCount) * 100).toFixed(1))
            : (subsThisMonth > 0 ? 100 : 0);
        }
      } catch (err) {
        console.error('Error in subscription processing:', err);
      }

      // Calculate conversion rate
      const conversionRate = usersCount > 0 
        ? parseFloat(((subsCount / usersCount) * 100).toFixed(1))
        : 0;

      // ==================== WORKOUT DATA ====================
      const { data: allWorkouts, error: workoutsError } = await supabase
        .from('workout_logs')
        .select('user_id, duration_minutes, created_at, workout_name, calories_burned');

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
      }

      const workoutsThisMonth = allWorkouts?.filter(w => 
        new Date(w.created_at) >= currentMonthStart
      ).length || 0;

      const workoutsLastMonth = allWorkouts?.filter(w => {
        const createdDate = new Date(w.created_at);
        return createdDate >= lastMonthStart && createdDate < currentMonthStart;
      }).length || 0;

      const workoutGrowth = workoutsLastMonth > 0
        ? parseFloat((((workoutsThisMonth - workoutsLastMonth) / workoutsLastMonth) * 100).toFixed(1))
        : (workoutsThisMonth > 0 ? 100 : 0);

      // User engagement metrics (users who worked out in last 7 days)
      const workoutsThisWeek = allWorkouts?.filter(w => 
        new Date(w.created_at) >= sevenDaysAgo
      ) || [];

      const activeUsersThisWeek = new Set(workoutsThisWeek.map(w => w.user_id)).size;
      
      const engagementRate = usersCount > 0
        ? parseFloat(((activeUsersThisWeek / usersCount) * 100).toFixed(1))
        : 0;

      // Calculate workout stats for last 30 days
      const workoutsLast30Days = allWorkouts?.filter(w => 
        new Date(w.created_at) >= thirtyDaysAgo
      ) || [];

      const totalWorkoutMinutes = workoutsLast30Days.reduce((sum, w) => 
        sum + (w.duration_minutes || 0), 0
      );

      const avgWorkoutDuration = workoutsLast30Days.length > 0 
        ? Math.round(totalWorkoutMinutes / workoutsLast30Days.length) 
        : 0;

      // Calculate churn risk (users who haven't worked out in 14+ days)
      const workoutsLast14Days = allWorkouts?.filter(w => 
        new Date(w.created_at) >= fourteenDaysAgo
      ) || [];

      const activeUsersLast14Days = new Set(workoutsLast14Days.map(w => w.user_id));
      const inactiveUsers = usersCount - activeUsersLast14Days.size;
      
      const churnRisk = usersCount > 0
        ? parseFloat(((inactiveUsers / usersCount) * 100).toFixed(1))
        : 0;
      
      // ==================== LEADERBOARD DATA ====================
      // Fetch top users from user_stats table
      const { data: userStatsData, error: statsError } = await supabase
        .from('user_stats')
        .select(`
          user_id,
          total_points,
          current_streak,
          total_workouts,
          badges_earned
        `)
        .order('total_points', { ascending: false })
        .limit(5);

      if (statsError) {
        console.error('Error fetching user stats:', statsError);
      }

      // Get profile data for top users
      let topUsers = [];
      if (userStatsData && userStatsData.length > 0) {
        const userIds = userStatsData.map(u => u.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, nickname')
          .in('id', userIds);

        const profileMap = {};
        profilesData?.forEach(p => {
          profileMap[p.id] = p;
        });

        topUsers = userStatsData.map(user => ({
          user_id: user.user_id,
          total_points: user.total_points || 0,
          current_streak: user.current_streak || 0,
          total_workouts: user.total_workouts || 0,
          badges_earned: user.badges_earned || 0,
          profiles: {
            full_name: profileMap[user.user_id]?.full_name || 
                      profileMap[user.user_id]?.nickname || 
                      'Unknown User'
          }
        }));
      }

      // ==================== POPULAR WORKOUTS DATA ====================
      // Count workout completions in last 30 days
      const workoutCounts = {};
      workoutsLast30Days.forEach(w => {
        if (w.workout_name) {
          workoutCounts[w.workout_name] = (workoutCounts[w.workout_name] || 0) + 1;
        }
      });

      const topWorkouts = Object.entries(workoutCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // ==================== RECENT ACTIVITY DATA ====================
      // Fetch admin activity logs
      const { data: adminActivities } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch recent user registrations from profiles (with created_at)
      const recentNewUsers = allProfiles
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10) || [];

      // Fetch emails from auth.users for recent users
      let emailMap = {};
      if (supabaseAdmin) {
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          authUsers?.users?.forEach(u => {
            emailMap[u.id] = u.email;
          });
        } catch (err) {
          console.log('Could not fetch auth users emails:', err.message);
        }
      }

      // Fetch recent workouts (last 10)
      const recentWorkoutsActivity = allWorkouts
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10) || [];

      // Get profile data for workout users
      const workoutUserIds = [...new Set(recentWorkoutsActivity.map(w => w.user_id))];
      const { data: workoutProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, nickname')
        .in('id', workoutUserIds);

      const profileMap = {};
      workoutProfiles?.forEach(p => {
        profileMap[p.id] = p;
      });

      // Format recent activity - combining all sources
      const activities = [
        // Admin activity logs
        ...(adminActivities?.map(a => {
          if (a.activity_type === 'user_registered') {
            const userEmail = emailMap[a.target_id] || 'No email';
            const displayName = a.metadata?.nickname || 'Unknown User';
            const shortUID = (a.target_id || '').substring(0, 8) + '...';
            
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
          
          return {
            id: a.id,
            type: a.activity_category,
            activityType: a.activity_type,
            name: a.title,
            action: a.description || a.title,
            metadata: a.metadata?.notification_title || a.metadata?.content_preview || '',
            time: formatTimeAgo(a.created_at),
            timestamp: a.created_at
          };
        }) || []),
        // Recent user registrations (if no admin logs)
        ...((!adminActivities || adminActivities.length === 0) ? recentNewUsers.map(u => {
          const displayName = u.full_name || u.nickname || 'Unknown User';
          const shortUID = u.id.substring(0, 8) + '...';
          const userEmail = emailMap[u.id] || 'No email';
          
          return {
            id: u.id,
            type: 'user',
            activityType: 'user_registered',
            name: 'New User Registered',
            action: `Name: ${displayName}`,
            email: userEmail,
            metadata: `UID: ${shortUID}`,
            time: formatTimeAgo(u.created_at),
            timestamp: u.created_at
          };
        }) : []),
        // Workout completions
        ...recentWorkoutsActivity.map(w => ({
          id: w.user_id + w.created_at,
          type: 'workout',
          activityType: 'workout_completed',
          name: profileMap[w.user_id]?.full_name || profileMap[w.user_id]?.nickname || 'User',
          action: `Completed ${w.workout_name}`,
          metadata: `${w.duration_minutes}min • ${w.calories_burned} cal`,
          time: formatTimeAgo(w.created_at),
          timestamp: w.created_at
        }))
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10); // Show top 10 most recent activities

      // ==================== EXECUTIVE KPIS ====================
      const quickStats = [
        { 
          label: 'MRR (Monthly Revenue)', 
          value: `$${Math.round(mrr).toLocaleString()}`, 
          subtitle: `${subsCount} active subscription${subsCount !== 1 ? 's' : ''}`,
          trend: subsGrowth
        },
        { 
          label: 'User Engagement', 
          value: `${engagementRate}%`, 
          subtitle: `${activeUsersThisWeek} active this week`,
          trend: 0
        },
        { 
          label: 'Avg Session Time', 
          value: `${avgWorkoutDuration} min`, 
          subtitle: `${Math.round(totalWorkoutMinutes / 60)} hours total`,
          trend: workoutGrowth
        },
        { 
          label: 'Churn Risk', 
          value: `${churnRisk}%`, 
          subtitle: `${inactiveUsers} inactive users`,
          trend: -churnRisk
        }
      ];

      // ==================== SET DASHBOARD STATE ====================
      setDashboardData({
        totalUsers: usersCount,
        userGrowth: userGrowth,
        newUsersThisMonth: newUsersThisMonth,
        activeSubscriptions: subsCount,
        subsGrowth: subsGrowth,
        mrr: mrr,
        conversionRate: conversionRate,
        totalWorkouts: workoutsThisMonth,
        workoutGrowth: workoutGrowth,
        totalMeals: 0, // Not used in display
        engagementRate: engagementRate,
        churnRisk: churnRisk,
        recentActivity: activities,
        topUsers: topUsers.map(u => ({
          id: u.user_id,
          name: u.profiles?.full_name || 'User',
          subtitle: `${u.total_workouts || 0} workouts • ${u.badges_earned || 0} badges`,
          value: (u.total_points || 0).toLocaleString(),
          badge: `${u.current_streak || 0} day streak`
        })),
        topWorkouts: topWorkouts.map(w => ({
          id: w.name,
          name: w.name,
          subtitle: 'Last 30 days',
          value: w.count,
          badge: 'completions'
        })),
        quickStats: quickStats
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <StatsCard
            title="Total Users"
            value={dashboardData.totalUsers.toLocaleString()}
            icon={Users}
            color="blue"
            subtitle={`${dashboardData.newUsersThisMonth} new this month`}
          />
          <StatsCard
            title="Workouts This Month"
            value={dashboardData.totalWorkouts.toLocaleString()}
            icon={Dumbbell}
            color="orange"
            subtitle={dashboardData.workoutGrowth >= 0 ? `+${dashboardData.workoutGrowth}% vs last month` : `${dashboardData.workoutGrowth}% vs last month`}
            trend={dashboardData.workoutGrowth}
          />
          <StatsCard
            title="Active Subscribers"
            value={dashboardData.activeSubscriptions.toLocaleString()}
            icon={Crown}
            color="green"
            subtitle={dashboardData.activeSubscriptions > 0 ? `${dashboardData.conversionRate}% conversion` : 'No active subs'}
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${Math.round(dashboardData.mrr).toLocaleString()}`}
            icon={DollarSign}
            color="purple"
            subtitle="From active subs"
          />
          <StatsCard
            title="User Engagement"
            value={`${dashboardData.engagementRate}%`}
            icon={Activity}
            color="blue"
            subtitle="Active this week"
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

        {/* Performance Insights - Similar to Analytics Page */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">Performance Insights</h3>
              <p className="text-blue-100">Key takeaways from your fitness platform</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <p className="text-sm font-semibold text-blue-100">Growth</p>
              </div>
              <p className="text-xl font-bold mb-1">{dashboardData.totalUsers}</p>
              <p className="text-sm text-blue-100">Total registered users</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-300" />
                <p className="text-sm font-semibold text-blue-100">Active Users</p>
              </div>
              <p className="text-xl font-bold mb-1">{dashboardData.totalWorkouts}</p>
              <p className="text-sm text-blue-100">Workouts this month</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-orange-300" />
                <p className="text-sm font-semibold text-blue-100">Revenue</p>
              </div>
              <p className="text-xl font-bold mb-1">${Math.round(dashboardData.mrr).toLocaleString()}</p>
              <p className="text-sm text-blue-100">Monthly recurring revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
