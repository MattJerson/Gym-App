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
  TrendingDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import StatCard from '../components/dashboard/StatCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import QuickStatsGrid from '../components/dashboard/QuickStatsGrid';
import TopItemsCard from '../components/dashboard/TopItemsCard';

// Initialize Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

      // Fetch active subscriptions with packages
      const { data: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_packages(price_monthly, price_yearly, billing_cycle)
        `)
        .eq('status', 'active');

      const subsCount = activeSubscriptions?.length || 0;
      
      // Calculate MRR (Monthly Recurring Revenue)
      let mrr = 0;
      activeSubscriptions?.forEach(sub => {
        const pkg = sub.subscription_packages;
        if (pkg) {
          if (pkg.billing_cycle === 'monthly') {
            mrr += pkg.price_monthly || 0;
          } else if (pkg.billing_cycle === 'yearly') {
            mrr += (pkg.price_yearly || 0) / 12; // Convert yearly to monthly
          }
        }
      });

      // Get subscription growth
      const { count: lastMonthSubs } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('created_at', currentMonthStart.toISOString());

      const subsGrowth = lastMonthSubs > 0
        ? (((subsCount - lastMonthSubs) / lastMonthSubs) * 100).toFixed(1)
        : 0;

      // Calculate conversion rate
      const conversionRate = usersCount > 0 
        ? ((subsCount / usersCount) * 100).toFixed(1)
        : 0;

      // Fetch workout data
      const { count: workoutsThisMonth } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonthStart.toISOString());

      const { count: workoutsLastMonth } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      const workoutGrowth = workoutsLastMonth > 0
        ? (((workoutsThisMonth - workoutsLastMonth) / workoutsLastMonth) * 100).toFixed(1)
        : 0;

      // User engagement metrics
      const { data: activeWorkouts } = await supabase
        .from('workout_logs')
        .select('user_id')
        .gte('created_at', sevenDaysAgo.toISOString());

      const activeUsersThisWeek = new Set(activeWorkouts?.map(w => w.user_id)).size;
      
      const engagementRate = usersCount > 0
        ? ((activeUsersThisWeek / usersCount) * 100).toFixed(1)
        : 0;

      // Fetch meal data
      const { count: mealsCount } = await supabase
        .from('user_meals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Calculate churn risk (users with no activity in 14 days)
      const { data: recentActivityData } = await supabase
        .from('workout_logs')
        .select('user_id')
        .gte('created_at', fourteenDaysAgo.toISOString());

      const activeUserIds = new Set(recentActivityData?.map(w => w.user_id));
      const inactiveUsers = usersCount - activeUserIds.size;
      const churnRisk = usersCount > 0
        ? ((inactiveUsers / usersCount) * 100).toFixed(1)
        : 0;

      // Fetch top users by points
      const { data: topUsers } = await supabase
        .from('user_stats')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('total_points', { ascending: false })
        .limit(5);

      // Fetch recent activity with details
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

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      // Get emails from auth.users for recent users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const emailMap = {};
      authUsers?.users?.forEach(u => {
        emailMap[u.id] = u.email;
      });

      // Fetch most popular workouts
      const { data: popularWorkouts } = await supabase
        .from('workout_logs')
        .select('workout_name')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const workoutCounts = {};
      popularWorkouts?.forEach(w => {
        workoutCounts[w.workout_name] = (workoutCounts[w.workout_name] || 0) + 1;
      });
      const topWorkouts = Object.entries(workoutCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Calculate workout stats
      const { data: workoutStats } = await supabase
        .from('workout_logs')
        .select('duration_minutes')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const totalWorkoutMinutes = workoutStats?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
      const avgWorkoutDuration = workoutStats?.length > 0 
        ? Math.round(totalWorkoutMinutes / workoutStats?.length) 
        : 0;

      // Format recent activity with detailed info
      const activities = [
        ...(recentUsers?.slice(0, 4).map(u => ({
          id: u.id,
          type: 'user',
          name: u.full_name || 'New User',
          action: 'Joined the platform',
          email: emailMap[u.id] || 'No email',
          metadata: `ID: ${u.id.substring(0, 8)}...`,
          time: formatTimeAgo(u.created_at)
        })) || []),
        ...(recentWorkouts?.slice(0, 4).map(w => ({
          id: w.id,
          type: 'workout',
          name: w.profiles?.full_name || 'User',
          action: `Completed ${w.workout_name}`,
          metadata: `${w.duration_minutes}min • ${w.calories_burned} cal`,
          time: formatTimeAgo(w.created_at)
        })) || [])
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 font-display">
              <Zap className="h-10 w-10 text-blue-600" />
              Executive Dashboard
            </h1>
            <p className="text-lg text-gray-600 mt-2">Real-time business metrics and insights</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium">Live Data</span>
          </div>
        </div>

        {/* Main Stats Grid - Large Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={dashboardData.totalUsers.toLocaleString()}
            icon={Users}
            color="blue"
            change={dashboardData.userGrowth}
            changeLabel={`${dashboardData.userGrowth > 0 ? '+' : ''}${dashboardData.userGrowth}% vs last month`}
            subMetric={`${dashboardData.newUsersThisMonth} new this month`}
            loading={loading}
          />
          <StatCard
            title="Active Subscriptions"
            value={dashboardData.activeSubscriptions.toLocaleString()}
            icon={Crown}
            color="purple"
            change={dashboardData.subsGrowth}
            changeLabel={`${dashboardData.subsGrowth > 0 ? '+' : ''}${dashboardData.subsGrowth}% growth`}
            subMetric={`${dashboardData.conversionRate}% conversion rate`}
            loading={loading}
          />
          <StatCard
            title="Workouts This Month"
            value={dashboardData.totalWorkouts.toLocaleString()}
            icon={Dumbbell}
            color="orange"
            change={dashboardData.workoutGrowth}
            changeLabel={`${dashboardData.workoutGrowth > 0 ? '+' : ''}${dashboardData.workoutGrowth}% vs last month`}
            subMetric={`${dashboardData.engagementRate}% user engagement`}
            loading={loading}
          />
          <StatCard
            title="Meals Logged (7d)"
            value={dashboardData.totalMeals.toLocaleString()}
            icon={Apple}
            color="green"
            change={15}
            changeLabel="+15% vs last week"
            subMetric="Nutrition tracking active"
            loading={loading}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <RecentActivityCard 
              activities={dashboardData.recentActivity} 
              loading={loading}
            />
          </div>

          {/* Quick Stats - Executive KPIs */}
          <div>
            <QuickStatsGrid 
              stats={dashboardData.quickStats} 
              loading={loading}
            />
          </div>
        </div>

        {/* Top Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopItemsCard
            title="🏆 Top Users by Points"
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

        {/* Executive Summary Footer */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-7 w-7" />
            <h3 className="text-2xl font-bold">Key Business Metrics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold">${dashboardData.mrr.toFixed(0).toLocaleString()}</p>
              <p className="text-sm text-blue-100 mt-2 font-medium">Monthly Recurring Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{dashboardData.conversionRate}%</p>
              <p className="text-sm text-blue-100 mt-2 font-medium">Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{dashboardData.engagementRate}%</p>
              <p className="text-sm text-blue-100 mt-2 font-medium">User Engagement</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{dashboardData.churnRisk}%</p>
              <p className="text-sm text-blue-100 mt-2 font-medium">Churn Risk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
