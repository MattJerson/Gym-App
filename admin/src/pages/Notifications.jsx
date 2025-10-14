import { useState, useEffect } from "react";
import { 
  Plus, 
  Bell, 
  Send, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Search,
  TrendingUp,
  Filter,
  Pencil,
  Trash2,
  Sparkles,
  Calendar,
  User,
  Zap,
  Target,
  Award,
  ListOrdered
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

// Initialize Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [triggerTemplates, setTriggerTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [editingTrigger, setEditingTrigger] = useState(null);

  // Shuffle state
  const [shuffleSettings, setShuffleSettings] = useState(null);
  const [shuffling, setShuffling] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    total_sent: 0,
    total_created: 0,
    total_scheduled: 0
  });

  // Filters and sorting
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    target_audience: "all",
    status: "draft",
    scheduled_at: "",
    user_id: "",
    display_order: 0
  });

  const [triggerForm, setTriggerForm] = useState({
    trigger_type: "",
    title: "",
    message: "",
    type: "info",
    is_active: true
  });

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    fetchShuffleSettings();
    fetchTriggerTemplates();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // Only fetch manually created notifications (exclude automated trigger notifications)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .neq('target_audience', 'user') // Exclude user-specific automated notifications
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_stats')
        .select('stat_type, count');

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      if (data && data.length > 0) {
        const statsObj = data.reduce((acc, item) => {
          acc[item.stat_type] = item.count;
          return acc;
        }, {});
        setStats({
          total_sent: statsObj.total_sent || 0,
          total_created: statsObj.total_created || 0,
          total_scheduled: statsObj.total_scheduled || 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchShuffleSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_shuffle_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching shuffle settings:', error);
        return;
      }
      setShuffleSettings(data);
    } catch (err) {
      console.error('Error fetching shuffle settings:', err);
    }
  };

  const fetchTriggerTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_triggers')
        .select('*')
        .order('trigger_type');

      if (error) {
        console.error('Error fetching trigger templates:', error);
        return;
      }
      setTriggerTemplates(data || []);
    } catch (err) {
      console.error('Error fetching trigger templates:', err);
    }
  };

  const toggleAutoShuffle = async () => {
    if (!shuffleSettings) return;
    
    try {
      const newValue = !shuffleSettings?.auto_shuffle_enabled;
      
      const { error } = await supabase
        .from('notification_shuffle_settings')
        .update({ 
          auto_shuffle_enabled: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', shuffleSettings.id);

      if (error) throw error;
      
      setShuffleSettings(prev => ({ ...prev, auto_shuffle_enabled: newValue }));
    } catch (err) {
      alert('Error updating shuffle settings: ' + err.message);
    }
  };

  const handleManualShuffle = async () => {
    if (!confirm('Shuffle all scheduled notifications now?')) return;
    
    try {
      setShuffling(true);
      
      const { data, error } = await supabase
        .rpc('shuffle_scheduled_notifications');

      if (error) throw error;
      
      alert('Scheduled notifications shuffled successfully!');
      await fetchNotifications();
      await fetchShuffleSettings();
    } catch (err) {
      alert('Error shuffling notifications: ' + err.message);
    } finally {
      setShuffling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      if (!submitData.user_id || submitData.user_id.trim() === '') {
        delete submitData.user_id;
      }
      
      if (!submitData.scheduled_at || submitData.scheduled_at.trim() === '') {
        delete submitData.scheduled_at;
      }
      
      if (editingNotification) {
        const { error } = await supabase
          .from('notifications')
          .update(submitData)
          .eq('id', editingNotification.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert([{ ...submitData, created_at: new Date().toISOString() }]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingNotification(null);
      resetForm();
      await fetchNotifications();
      await fetchStats();
    } catch (err) {
      console.error('Error creating notification:', err);
      alert('Error: ' + (err.message || 'Failed to save notification'));
    }
  };

  const handleTriggerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrigger) {
        const { error } = await supabase
          .from('notification_triggers')
          .update(triggerForm)
          .eq('id', editingTrigger.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_triggers')
          .insert([triggerForm]);
        
        if (error) throw error;
      }
      
      setIsTriggerModalOpen(false);
      setEditingTrigger(null);
      resetTriggerForm();
      await fetchTriggerTemplates();
      alert('Trigger template saved successfully!');
    } catch (err) {
      alert('Error saving trigger: ' + err.message);
    }
  };

  const handleDelete = async (notification) => {
    if (!confirm(`Delete notification "${notification.title}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);
      
      if (error) throw error;
      await fetchNotifications();
    } catch (err) {
      alert('Error deleting notification: ' + err.message);
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title || "",
      message: notification.message || "",
      type: notification.type || "info",
      target_audience: notification.target_audience || "all",
      status: notification.status || "draft",
      scheduled_at: notification.scheduled_at || "",
      user_id: notification.user_id || "",
      display_order: notification.display_order || 0
    });
    setIsModalOpen(true);
  };

  const handleEditTrigger = (trigger) => {
    setEditingTrigger(trigger);
    setTriggerForm({
      trigger_type: trigger.trigger_type || "",
      title: trigger.title || "",
      message: trigger.message || "",
      type: trigger.type || "info",
      is_active: trigger.is_active !== undefined ? trigger.is_active : true
    });
    setIsTriggerModalOpen(true);
  };

  const handleDeleteTrigger = async (trigger) => {
    if (!confirm(`Delete trigger "${trigger.title}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('notification_triggers')
        .delete()
        .eq('id', trigger.id);
      
      if (error) throw error;
      await fetchTriggerTemplates();
      alert('Trigger deleted successfully!');
    } catch (err) {
      alert('Error deleting trigger: ' + err.message);
    }
  };

  const handleSendNow = async (notification) => {
    const action = notification.status === 'sent' ? 'resend' : 'send';
    if (!confirm(`${action === 'resend' ? 'Resend' : 'Send'} notification "${notification.title}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', notification.id);
      if (error) throw error;

      // Call Edge Function for push (best effort)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token || '';
        
        const targetUserId = notification.target_audience === 'user' && notification.user_id 
          ? notification.user_id 
          : null;
        
        await fetch(`${SUPABASE_URL}/functions/v1/deploy-for-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            user_id: targetUserId,
            title: notification.title,
            body: notification.message,
            data: { type: notification.type }
          })
        });
      } catch (pushErr) {
        console.warn('Push notification failed (non-fatal):', pushErr.message);
      }

      await fetchNotifications();
      await fetchStats();
      alert(`Notification ${action === 'resend' ? 'resent' : 'sent'} successfully!`);
    } catch (err) {
      alert('Error sending notification: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      target_audience: "all",
      status: "draft",
      scheduled_at: "",
      user_id: "",
      display_order: 0
    });
  };

  const resetTriggerForm = () => {
    setTriggerForm({
      trigger_type: "",
      title: "",
      message: "",
      type: "info",
      is_active: true
    });
  };

  // Filtering and sorting logic
  const getFilteredAndSortedData = () => {
    let filtered = [...notifications];
    
    if (searchTerm) {
      filtered = filtered.filter(notif =>
        notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterType);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(notif => notif.status === filterStatus);
    }
    
    if (filterAudience !== 'all') {
      filtered = filtered.filter(notif => notif.target_audience === filterAudience);
    }
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'display_order':
          aVal = a.display_order || 0;
          bVal = b.display_order || 0;
          break;
        case 'scheduled_at':
          aVal = new Date(a.scheduled_at || 0).getTime();
          bVal = new Date(b.scheduled_at || 0).getTime();
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const filteredNotifications = getFilteredAndSortedData();
  const activeFilterCount = [filterType, filterStatus, filterAudience].filter(f => f !== 'all').length;

  const totalNotifications = notifications.length;
  const currentScheduledNotifications = notifications.filter(n => n.status === 'scheduled').length;
  const draftNotifications = notifications.filter(n => n.status === 'draft').length;

  const notificationTypes = [
    { value: 'info', label: 'Info', color: 'blue' },
    { value: 'success', label: 'Success', color: 'green' },
    { value: 'warning', label: 'Warning', color: 'yellow' },
    { value: 'error', label: 'Error', color: 'red' }
  ];

  const audienceTypes = [
    { value: 'all', label: 'All Users', icon: Users },
    { value: 'subscribers', label: 'Subscribers Only', icon: Award },
    { value: 'free_users', label: 'Free Users', icon: User },
    { value: 'inactive', label: 'Inactive Users', icon: AlertCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-5">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Bell}
          title="Notification Management"
          subtitle="Send push notifications and manage automated triggers"
          breadcrumbs={['Admin', 'Notifications']}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={Zap}
                onClick={() => {
                  setEditingTrigger(null);
                  resetTriggerForm();
                  setIsTriggerModalOpen(true);
                }}
              >
                Manage Triggers
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingNotification(null);
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                Create Notification
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <StatsCard
            title="Total Notifications"
            value={totalNotifications}
            icon={Bell}
            color="blue"
            subtitle="Currently in system"
          />
          <StatsCard
            title="Total Sent (All Time)"
            value={stats.total_sent}
            icon={CheckCircle}
            color="green"
            subtitle="Permanent counter"
          />
          <StatsCard
            title="Scheduled"
            value={currentScheduledNotifications}
            icon={Clock}
            color="purple"
            subtitle="Waiting to be sent"
          />
          <StatsCard
            title="Trigger Templates"
            value={triggerTemplates.length}
            icon={Zap}
            color="orange"
            subtitle={`Active: ${triggerTemplates.filter(t => t.is_active).length}`}
          />
        </div>

        {/* Auto-Shuffle Control Panel (for Scheduled only) */}
        {shuffleSettings && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5 mb-5 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Auto-Shuffle Scheduled Notifications
                    {shuffleSettings?.auto_shuffle_enabled && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {shuffleSettings?.auto_shuffle_enabled 
                      ? `Automatically shuffles scheduled notifications daily. Last shuffle: ${
                          shuffleSettings?.last_shuffle_date 
                            ? new Date(shuffleSettings.last_shuffle_date).toLocaleDateString()
                            : 'Never'
                        }`
                      : 'Enable to automatically randomize scheduled notification order every day'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAutoShuffle}
                  disabled={!shuffleSettings}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    shuffleSettings?.auto_shuffle_enabled 
                      ? 'bg-purple-600' 
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      shuffleSettings?.auto_shuffle_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                <button
                  onClick={handleManualShuffle}
                  disabled={shuffling}
                  className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles className={`h-4 w-4 ${shuffling ? 'animate-spin' : ''}`} />
                  {shuffling ? 'Shuffling...' : 'Shuffle Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="created_at">Date Created</option>
                <option value="scheduled_at">Scheduled Time</option>
                <option value="display_order">Display Order</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <TrendingUp className={`h-4 w-4 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Type:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {notificationTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterType === type.value
                      ? `bg-${type.color}-600 text-white shadow-sm`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Status:</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {['draft', 'scheduled', 'sent', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Audience Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Audience:</span>
              <button
                onClick={() => setFilterAudience('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterAudience === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {audienceTypes.filter(a => a.value !== 'all').map(audience => (
                <button
                  key={audience.value}
                  onClick={() => setFilterAudience(audience.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterAudience === audience.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {audience.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterStatus('all');
                  setFilterAudience('all');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters ({activeFilterCount})
              </button>
            </div>
          )}
        </div>

        {/* Notifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterAudience('all');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
                    notification.type === 'success' ? 'from-green-500 to-green-600' :
                    notification.type === 'warning' ? 'from-yellow-500 to-yellow-600' :
                    notification.type === 'error' ? 'from-red-500 to-red-600' :
                    'from-blue-500 to-blue-600'
                  } flex items-center justify-center flex-shrink-0`}>
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex gap-1">
                    <Badge variant={
                      notification.status === 'sent' ? 'success' :
                      notification.status === 'scheduled' ? 'warning' :
                      notification.status === 'failed' ? 'error' :
                      'default'
                    }>
                      {notification.status}
                    </Badge>
                    <Badge variant={
                      notification.type === 'success' ? 'success' :
                      notification.type === 'warning' ? 'warning' :
                      notification.type === 'error' ? 'error' :
                      'info'
                    }>
                      {notification.type}
                    </Badge>
                  </div>
                </div>

                {/* Title and Message */}
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {notification.message}
                </p>

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    <span className="capitalize">{notification.target_audience}</span>
                  </div>
                  
                  {notification.scheduled_at && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {new Date(notification.scheduled_at).toLocaleDateString()} at{' '}
                        {new Date(notification.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  {notification.sent_at && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Sent {new Date(notification.sent_at).toLocaleDateString()}</span>
                    </div>
                  )}

                  {notification.status === 'scheduled' && notification.display_order > 0 && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <ListOrdered className="h-3.5 w-3.5" />
                      <span>Order: {notification.display_order}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  {notification.status === 'draft' && (
                    <button
                      onClick={() => handleSendNow(notification)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send Now
                    </button>
                  )}
                  {notification.status === 'sent' && (
                    <button
                      onClick={() => handleSendNow(notification)}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Resend
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(notification)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(notification)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Notification Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingNotification(null);
            resetForm();
          }}
          title={editingNotification ? 'Edit Notification' : 'Create Notification'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingNotification ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Notification Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              icon={Bell}
              required
            />
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'info', label: 'Info' },
                  { value: 'success', label: 'Success' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'error', label: 'Error' }
                ]}
                required
              />
              <Select
                label="Target Audience"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                options={[
                  { value: 'all', label: 'All Users' },
                  { value: 'subscribers', label: 'Subscribers Only' },
                  { value: 'free_users', label: 'Free Users' },
                  { value: 'inactive', label: 'Inactive Users' }
                ]}
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">About User-Specific Notifications</p>
                <p>Personalized notifications (like "We miss you" or "No workout today") are automatically created by the edge function based on user behavior. You only need to create broadcast notifications here.</p>
              </div>
            </div>

            {formData.target_audience === 'user' && (
              <Input
                label="Target User ID"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                placeholder="UUID of the user"
              />
            )}

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'sent', label: 'Sent' }
              ]}
              required
            />

            {formData.status === 'scheduled' && (
              <>
                <Input
                  label="Schedule Date & Time"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
                <Input
                  label="Display Order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </>
            )}
          </form>
        </Modal>

        {/* Trigger Templates Modal */}
        <Modal
          isOpen={isTriggerModalOpen}
          onClose={() => {
            setIsTriggerModalOpen(false);
            setEditingTrigger(null);
            resetTriggerForm();
          }}
          title="Manage Trigger Templates"
          size="xl"
        >
          <div className="space-y-4">
            {/* Trigger List */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Active Trigger Templates ({triggerTemplates.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {triggerTemplates.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{trigger.title}</h4>
                          <Badge variant={trigger.is_active ? 'success' : 'default'}>
                            {trigger.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="info" className="text-xs">
                            {trigger.trigger_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{trigger.message}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEditTrigger(trigger)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(trigger)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add/Edit Trigger Form */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                {editingTrigger ? 'Edit' : 'Add New'} Trigger Template
              </h3>
              <form onSubmit={handleTriggerSubmit} className="space-y-4">
                <Input
                  label="Trigger Type"
                  value={triggerForm.trigger_type}
                  onChange={(e) => setTriggerForm({ ...triggerForm, trigger_type: e.target.value })}
                  placeholder="e.g., no_login_today, streak_milestone_7"
                  required
                  disabled={!!editingTrigger}
                />
                
                <Input
                  label="Title"
                  value={triggerForm.title}
                  onChange={(e) => setTriggerForm({ ...triggerForm, title: e.target.value })}
                  required
                />
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={triggerForm.message}
                    onChange={(e) => setTriggerForm({ ...triggerForm, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Type"
                    value={triggerForm.type}
                    onChange={(e) => setTriggerForm({ ...triggerForm, type: e.target.value })}
                    options={[
                      { value: 'info', label: 'Info' },
                      { value: 'success', label: 'Success' },
                      { value: 'warning', label: 'Warning' },
                      { value: 'error', label: 'Error' }
                    ]}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        checked={triggerForm.is_active}
                        onChange={(e) => setTriggerForm({ ...triggerForm, is_active: e.target.checked })}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingTrigger && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingTrigger(null);
                        resetTriggerForm();
                      }}
                      type="button"
                    >
                      Cancel Edit
                    </Button>
                  )}
                  <Button variant="primary" type="submit">
                    {editingTrigger ? 'Update' : 'Add'} Trigger
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Notifications;
