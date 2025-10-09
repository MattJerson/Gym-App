import { useState, useEffect } from "react";
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Users,
  Activity,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Award,
  Zap
} from "lucide-react";
import { supabase } from '../lib/supabase';
import PageHeader from '../components/common/PageHeader';
import StatsCard from '../components/common/StatsCard';
import Select from '../components/common/Select';
import Button from '../components/common/Button';

const Analytics = () => {
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    userEngagement: 0,
    workoutCompletion: 0,
    avgSession: 0,
    retentionRate: 0,
    activeUsers: 0,
    totalWorkouts: 0,
    popularWorkouts: [],
    revenueData: {
      total: 0,
      growth: 0
    },
    subscriptionBreakdown: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch active users in period
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .gte('last_sign_in_at', startDate.toISOString());

      if (usersError) throw usersError;

      // Fetch all users for retention
      const { data: allUsers } = await supabase
        .from('users')
        .select('*');

      // Fetch workout templates for popular workouts
      const { data: workouts } = await supabase
        .from('workout_templates')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false });

      // Fetch subscription packages
      const { data: packages } = await supabase
        .from('subscription_packages')
        .select('*');

      // Fetch user subscriptions for revenue
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_packages(*)');

      // Calculate metrics
      const totalUsers = allUsers?.length || 0;
      const activeUsers = users?.length || 0;
      const userEngagement = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;
      
      // Calculate retention (users who logged in within period)
      const retentionRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;

      // Calculate revenue
      const activeSubscriptions = subscriptions?.filter(sub => sub.status === 'active') || [];
      const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
        const price = sub.billing_cycle === 'monthly' 
          ? sub.subscription_packages?.monthly_price || 0 
          : sub.subscription_packages?.yearly_price || 0;
        return sum + price;
      }, 0);

      // Subscription breakdown
      const subBreakdown = packages?.map(pkg => ({
        name: pkg.name,
        count: subscriptions?.filter(sub => sub.package_id === pkg.id && sub.status === 'active').length || 0,
        percentage: 0
      })) || [];

      const totalSubs = subBreakdown.reduce((sum, item) => sum + item.count, 0);
      subBreakdown.forEach(item => {
        item.percentage = totalSubs > 0 ? ((item.count / totalSubs) * 100).toFixed(1) : 0;
      });

      setAnalytics({
        userEngagement,
        workoutCompletion: 76.8, // Mock data
        avgSession: 23,
        retentionRate,
        activeUsers,
        totalWorkouts: workouts?.length || 0,
        popularWorkouts: workouts || [],
        revenueData: {
          total: totalRevenue,
          growth: 12.5 // Mock growth
        },
        subscriptionBreakdown: subBreakdown
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = {
      period: `Last ${period} days`,
      date: new Date().toISOString(),
      metrics: analytics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const periodOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader
          icon={BarChart3}
          title="Reports & Analytics"
          subtitle="Track performance metrics and insights"
          breadcrumbs={['Admin', 'Analytics']}
          actions={
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                options={periodOptions}
                icon={Calendar}
              />
              <Button
                variant="primary"
                icon={Download}
                onClick={handleExport}
              >
                Export Report
              </Button>
            </div>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={Users}
            label="User Engagement"
            value={`${analytics.userEngagement}%`}
            trend={5.2}
            color="blue"
          />
          <StatsCard
            icon={Target}
            label="Workout Completion"
            value={`${analytics.workoutCompletion}%`}
            trend={3.1}
            color="green"
          />
          <StatsCard
            icon={Clock}
            label="Average Session"
            value={`${analytics.avgSession}m`}
            trend={-8.7}
            color="purple"
          />
          <StatsCard
            icon={Activity}
            label="Retention Rate"
            value={`${analytics.retentionRate}%`}
            trend={1.8}
            color="orange"
          />
        </div>

        {/* Revenue & Active Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                  <p className="text-sm text-gray-600">Active subscriptions</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  ${analytics.revenueData.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-semibold">
                    +{analytics.revenueData.growth}% vs last period
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Subscribers</span>
                  <span className="font-semibold text-gray-900">
                    {analytics.subscriptionBreakdown.reduce((sum, item) => sum + item.count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
                  <p className="text-sm text-gray-600">Last {period} days</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {analytics.activeUsers}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-semibold">
                    {analytics.userEngagement}% engagement rate
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Retention Rate</span>
                  <span className="font-semibold text-gray-900">{analytics.retentionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Workouts */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Popular Workouts</h3>
                <p className="text-sm text-gray-600">Top performing templates</p>
              </div>
            </div>
            <div className="space-y-3">
              {analytics.popularWorkouts.length > 0 ? (
                analytics.popularWorkouts.map((workout, index) => (
                  <div 
                    key={workout.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{workout.name}</p>
                        <p className="text-xs text-gray-600">{workout.category_name || 'General'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">{workout.duration_minutes}m</p>
                      <p className="text-xs text-gray-600">{workout.difficulty || 'N/A'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No workout data available</p>
              )}
            </div>
          </div>

          {/* Subscription Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Subscription Plans</h3>
                <p className="text-sm text-gray-600">Distribution by plan type</p>
              </div>
            </div>
            <div className="space-y-4">
              {analytics.subscriptionBreakdown.length > 0 ? (
                analytics.subscriptionBreakdown.map((sub, index) => {
                  const colors = [
                    'from-purple-500 to-purple-600',
                    'from-blue-500 to-blue-600',
                    'from-green-500 to-green-600',
                    'from-orange-500 to-orange-600'
                  ];
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">{sub.name}</span>
                        <span className="text-gray-600">{sub.count} users ({sub.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">No subscription data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8" />
            <div>
              <h3 className="text-2xl font-bold">Performance Insights</h3>
              <p className="text-blue-100">Key takeaways from the last {period} days</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <p className="text-sm font-semibold text-blue-100">Growth</p>
              </div>
              <p className="text-2xl font-bold mb-1">{analytics.activeUsers}</p>
              <p className="text-sm text-blue-100">Active users this period</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-300" />
                <p className="text-sm font-semibold text-blue-100">Engagement</p>
              </div>
              <p className="text-2xl font-bold mb-1">{analytics.userEngagement}%</p>
              <p className="text-sm text-blue-100">Overall engagement rate</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-orange-300" />
                <p className="text-sm font-semibold text-blue-100">Completion</p>
              </div>
              <p className="text-2xl font-bold mb-1">{analytics.workoutCompletion}%</p>
              <p className="text-sm text-blue-100">Workout completion rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
