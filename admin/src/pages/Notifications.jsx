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
import { usePermissions } from '../hooks/usePermissions';
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
  const { hasPermission } = usePermissions();
  const [notifications, setNotifications] = useState([]);
  const [triggerTemplates, setTriggerTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'automated'
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    total_sent: 0,
    manual_notifications: 0,
    automated_triggers: 0
  });

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    target_audience: "all",
  });

  const [triggerFormData, setTriggerFormData] = useState({
    title: "",
    message: "",
    type: "info",
    trigger_type: "",
    frequency_type: "daily",
    frequency_value: 1,
    frequency_unit: "days",
    is_active: true
  });

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    fetchTriggerTemplates();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // Fetch all notifications (all are manual in this table)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
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
      const { count: allCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      const { count: sentCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .not('sent_at', 'is', null);

      const { count: triggerCount } = await supabase
        .from('notification_triggers')
        .select('*', { count: 'exact', head: true });

      setStats({
        total_sent: sentCount || 0,
        manual_notifications: allCount || 0,
        automated_triggers: triggerCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotification) {
        // Update existing notification
        const { error } = await supabase
          .from('notifications')
          .update({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            target_audience: formData.target_audience,
          })
          .eq('id', editingNotification.id);
        
        if (error) throw error;
      } else {
        // Create new notification (always as draft, ready to send)
        const { error } = await supabase
          .from('notifications')
          .insert([{
            title: formData.title,
            message: formData.message,
            type: formData.type,
            target_audience: formData.target_audience,
            status: 'draft',
            created_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingNotification(null);
      resetForm();
      await fetchNotifications();
      await fetchStats();
    } catch (err) {
      console.error('Error saving notification:', err);
      alert('Error: ' + (err.message || 'Failed to save notification'));
    }
  };

  const handleDelete = async (notification) => {
    if (!confirm(`Delete notification "${notification.title}"?`)) return;
    
    try {
      const { error} = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);
      
      if (error) throw error;
      await fetchNotifications();
      await fetchStats();
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
    });
    setIsModalOpen(true);
  };

  const handleSendNow = async (notification) => {
    const action = notification.status === 'sent' ? 'resend' : 'send';
    if (!confirm(`${action === 'resend' ? 'Resend' : 'Send'} notification "${notification.title}"?`)) return;
    
    try {
      let notificationId = notification.id;
      
      // If resending, create a NEW notification (duplicate) with fresh ID
      // This allows users to see it again even if they marked the original as read
      if (action === 'resend') {
        const { data: newNotification, error: insertError } = await supabase
          .from('notifications')
          .insert({
            title: notification.title,
            message: notification.message,
            type: notification.type,
            target_audience: notification.target_audience,
            user_id: notification.user_id,
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        notificationId = newNotification.id;
        
        console.log('Created duplicate notification with new ID:', notificationId);
      } else {
        // First send: just update status
        const { error } = await supabase
          .from('notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', notification.id);
        if (error) throw error;
      }

      // Call Edge Function for push (best effort)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token || '';
        
        const targetUserId = notification.target_audience === 'user' && notification.user_id 
          ? notification.user_id 
          : null;
        
        await fetch(`${SUPABASE_URL}/functions/v1/notify`, {
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
      
      // Log the notification activity
      await supabase.rpc('log_admin_activity', {
        p_activity_type: 'notification_launched',
        p_activity_category: 'admin',
        p_title: `Notification ${action === 'resend' ? 'Resent' : 'Sent'}`,
        p_description: `${action === 'resend' ? 'Resent' : 'Sent'} notification: "${notification.title}"`,
        p_metadata: {
          notification_id: notificationId,
          notification_title: notification.title,
          target_audience: notification.target_audience,
          notification_type: notification.type,
          action: action
        },
        p_target_id: notificationId,
        p_target_type: 'notification'
      });
      
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
      target_audience: "all"
    });
  };

  const resetTriggerForm = () => {
    setTriggerFormData({
      title: "",
      message: "",
      type: "info",
      trigger_type: "",
      frequency_type: "daily",
      frequency_value: 1,
      frequency_unit: "days",
      is_active: true
    });
  };

  const handleEditTrigger = (trigger) => {
    setEditingTrigger(trigger);
    setTriggerFormData({
      title: trigger.title || "",
      message: trigger.message || "",
      type: trigger.type || "info",
      trigger_type: trigger.trigger_type || "",
      frequency_type: trigger.frequency_type || "daily",
      frequency_value: trigger.frequency_value || 1,
      frequency_unit: trigger.frequency_unit || "days",
      is_active: trigger.is_active ?? true
    });
    setIsTriggerModalOpen(true);
  };

  const handleToggleTriggerActive = async (trigger) => {
    try {
      const { error } = await supabase
        .from('notification_triggers')
        .update({ is_active: !trigger.is_active })
        .eq('id', trigger.id);
      
      if (error) throw error;
      await fetchTriggerTemplates();
      await fetchStats();
    } catch (err) {
      alert('Error toggling trigger: ' + err.message);
    }
  };

  const handleSubmitTrigger = async (e) => {
    e.preventDefault();
    try {
      if (editingTrigger) {
        // Update existing trigger
        const { error } = await supabase
          .from('notification_triggers')
          .update({
            title: triggerFormData.title,
            message: triggerFormData.message,
            type: triggerFormData.type,
            trigger_type: triggerFormData.trigger_type,
            frequency_type: triggerFormData.frequency_type,
            frequency_value: triggerFormData.frequency_value,
            frequency_unit: triggerFormData.frequency_unit,
            is_active: triggerFormData.is_active
          })
          .eq('id', editingTrigger.id);
        
        if (error) throw error;
      } else {
        // Create new trigger
        const { error } = await supabase
          .from('notification_triggers')
          .insert([{
            title: triggerFormData.title,
            message: triggerFormData.message,
            type: triggerFormData.type,
            trigger_type: triggerFormData.trigger_type,
            frequency_type: triggerFormData.frequency_type,
            frequency_value: triggerFormData.frequency_value,
            frequency_unit: triggerFormData.frequency_unit,
            is_active: triggerFormData.is_active
          }]);
        
        if (error) throw error;
      }
      
      setIsTriggerModalOpen(false);
      setEditingTrigger(null);
      resetTriggerForm();
      await fetchTriggerTemplates();
      await fetchStats();
    } catch (err) {
      console.error('Error saving trigger:', err);
      alert('Error: ' + (err.message || 'Failed to save trigger'));
    }
  };

  const handleDeleteTrigger = async (trigger) => {
    if (!confirm(`Delete automated trigger "${trigger.title}"? This will stop all automated sends for this trigger.`)) return;
    
    try {
      const { error } = await supabase
        .from('notification_triggers')
        .delete()
        .eq('id', trigger.id);
      
      if (error) throw error;
      await fetchTriggerTemplates();
      await fetchStats();
    } catch (err) {
      alert('Error deleting trigger: ' + err.message);
    }
  };

  const getFrequencyDisplay = (trigger) => {
    if (!trigger.frequency_type) return 'Not set';
    
    switch (trigger.frequency_type) {
      case 'once':
        return '⚡ Once (milestone)';
      case 'daily':
        return '📅 Daily (every 24h)';
      case 'weekly':
        return '📆 Weekly (every 7 days)';
      case 'periodic':
      case 'custom':
        const value = trigger.frequency_value || 1;
        const unit = trigger.frequency_unit || 'days';
        return `🔧 Every ${value} ${unit}`;
      default:
        return trigger.frequency_type;
    }
  };

  // Simple search/filter
  const getFilteredNotifications = () => {
    let filtered = [...notifications];
    
    if (searchTerm) {
      filtered = filtered.filter(notif =>
        notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by created date (newest first)
    filtered.sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
    
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const totalManual = notifications.length;
  const totalAutomated = triggerTemplates.length;

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
          subtitle="Send push notifications at a glance"
          breadcrumbs={['Admin', 'Notifications']}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                if (activeTab === 'manual') {
                  setEditingNotification(null);
                  resetForm();
                  setIsModalOpen(true);
                } else {
                  setEditingTrigger(null);
                  resetTriggerForm();
                  setIsTriggerModalOpen(true);
                }
              }}
            >
              {activeTab === 'manual' ? 'Create Notification' : 'Create Trigger'}
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <StatsCard
            title="Total Sent"
            value={stats.total_sent}
            icon={CheckCircle}
            color="green"
            subtitle="All-time notifications sent"
          />
          <StatsCard
            title="Manual Notifications"
            value={stats.manual_notifications}
            icon={Bell}
            color="blue"
            subtitle="Admin-created notifications"
          />
          <StatsCard
            title="Automated Triggers"
            value={stats.automated_triggers}
            icon={Zap}
            color="purple"
            subtitle="System-triggered notifications"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'manual'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Manual Notifications
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {totalManual}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('automated')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'automated'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Automated Triggers
                  <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                    {totalAutomated}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {/* Manual Notifications Tab */}
        {activeTab === 'manual' && (
          <>
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">💡 Manual Notifications</p>
                <p>Create and send broadcast notifications for <strong>announcements, promotions, feature launches</strong>, and time-sensitive updates. These are sent when you click "Send".</p>
                <p className="mt-2 text-xs text-blue-700">
                  <strong>Note:</strong> Automated notifications (like "We Miss You!", streak milestones, daily reminders) are managed in the Automated Triggers tab and fire based on user behavior.
                </p>
              </div>
            </div>

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
                <p className="text-gray-400 text-sm mt-2">Create your first notification to get started</p>
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
                      <span className="capitalize">{notification.target_audience.replace('_', ' ')}</span>
                    </div>
                    
                    {notification.sent_at && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Sent {new Date(notification.sent_at).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Created {new Date(notification.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleSendNow(notification)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {notification.sent_at ? 'Resend' : 'Send'}
                    </button>
                    <button
                      onClick={() => handleEdit(notification)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {hasPermission('notifications', 'delete') && (
                      <button
                        onClick={() => handleDelete(notification)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          </>
        )}

        {/* Automated Triggers Tab */}
        {activeTab === 'automated' && (
          <>
            {/* Info Banner */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-5 flex items-start gap-3">
              <Zap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-900">
                <p className="font-semibold mb-1">⚡ Automated Triggers</p>
                <p>These notifications are sent automatically by the system based on user behavior. <strong>Edit frequency settings to control how often users receive them.</strong></p>
                <p className="mt-2 text-xs text-purple-700">
                  <strong>Examples:</strong> Inactivity reminders ("We Miss You!"), streak milestones, daily hydration reminders, weekly progress reports.
                </p>
              </div>
            </div>

            <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading triggers...</p>
              </div>
            ) : triggerTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No automated triggers configured</p>
                <p className="text-gray-400 text-sm mt-2">Create your first automated trigger</p>
              </div>
            ) : (
              triggerTemplates.map((trigger) => (
                <div
                  key={trigger.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
                        trigger.is_active 
                          ? 'from-purple-500 to-purple-600' 
                          : 'from-gray-400 to-gray-500'
                      } flex items-center justify-center flex-shrink-0`}>
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{trigger.title}</h3>
                          <Badge variant={trigger.is_active ? 'success' : 'default'}>
                            {trigger.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant={
                            trigger.type === 'success' ? 'success' :
                            trigger.type === 'warning' ? 'warning' :
                            trigger.type === 'error' ? 'error' :
                            'info'
                          }>
                            {trigger.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{trigger.message}</p>
                        
                        <div className="space-y-1.5 text-xs">
                          <div className="text-gray-500">
                            <span className="font-semibold">Trigger Type:</span> <code className="bg-gray-100 px-2 py-0.5 rounded">{trigger.trigger_type}</code>
                          </div>
                          <div className="text-purple-600 font-semibold">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Frequency: {getFrequencyDisplay(trigger)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleToggleTriggerActive(trigger)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          trigger.is_active
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={trigger.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {trigger.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleEditTrigger(trigger)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Frequency"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {hasPermission('notifications', 'delete') && (
                        <button
                          onClick={() => handleDeleteTrigger(trigger)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          </>
        )}

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
                <p className="font-semibold mb-1">Note</p>
                <p>Manual notifications stay in draft status and can be sent or resent anytime without status changes.</p>
              </div>
            </div>
          </form>
        </Modal>

        {/* Create/Edit Automated Trigger Modal */}
        <Modal
          isOpen={isTriggerModalOpen}
          onClose={() => {
            setIsTriggerModalOpen(false);
            setEditingTrigger(null);
            resetTriggerForm();
          }}
          title={editingTrigger ? 'Edit Automated Trigger' : 'Create Automated Trigger'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsTriggerModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitTrigger}>
                {editingTrigger ? 'Update Trigger' : 'Create Trigger'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmitTrigger} className="space-y-4">
            <Input
              label="Notification Title"
              value={triggerFormData.title}
              onChange={(e) => setTriggerFormData({ ...triggerFormData, title: e.target.value })}
              icon={Zap}
              placeholder="e.g., We Miss You!"
              required
            />
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={triggerFormData.message}
                onChange={(e) => setTriggerFormData({ ...triggerFormData, message: e.target.value })}
                rows={4}
                placeholder="e.g., It's been a while since your last workout. Let's get back on track!"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={triggerFormData.type}
                onChange={(e) => setTriggerFormData({ ...triggerFormData, type: e.target.value })}
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
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={triggerFormData.is_active}
                    onChange={(e) => setTriggerFormData({ ...triggerFormData, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (sends automatically)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trigger Type (Code Name)
              </label>
              <input
                type="text"
                value={triggerFormData.trigger_type}
                onChange={(e) => setTriggerFormData({ ...triggerFormData, trigger_type: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g., no_login_7_days, custom_reminder"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for this trigger (lowercase, use underscores). This determines WHEN the notification fires.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Frequency Control
              </h4>
              
              <Select
                label="Frequency Type"
                value={triggerFormData.frequency_type}
                onChange={(e) => setTriggerFormData({ ...triggerFormData, frequency_type: e.target.value })}
                options={[
                  { value: 'once', label: '⚡ Once - Send only once per user (milestones)' },
                  { value: 'daily', label: '📅 Daily - Every 24 hours' },
                  { value: 'weekly', label: '📆 Weekly - Every 7 days' },
                  { value: 'custom', label: '🔧 Custom - Set your own interval' }
                ]}
                required
              />

              {triggerFormData.frequency_type === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Every (number)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={triggerFormData.frequency_value}
                      onChange={(e) => setTriggerFormData({ ...triggerFormData, frequency_value: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <Select
                    label="Unit"
                    value={triggerFormData.frequency_unit}
                    onChange={(e) => setTriggerFormData({ ...triggerFormData, frequency_unit: e.target.value })}
                    options={[
                      { value: 'hours', label: 'Hours' },
                      { value: 'days', label: 'Days' },
                      { value: 'weeks', label: 'Weeks' }
                    ]}
                    required
                  />
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-purple-800">
                  <p className="font-semibold mb-1">How Frequency Works</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Once:</strong> User receives it once, never again (good for achievements)</li>
                    <li><strong>Daily:</strong> User receives it once per day if conditions met</li>
                    <li><strong>Weekly:</strong> User receives it once per week if conditions met</li>
                    <li><strong>Custom:</strong> You set the interval (e.g., every 3 days, every 12 hours)</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Example:</strong> "We Miss You" with custom 3 days = user gets it once every 3 days while inactive, not every hour!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Important: Trigger Logic</p>
                <p>The <strong>trigger_type</strong> must match logic in the auto-notify Edge Function. Creating a trigger here doesn't automatically add the condition checking code.</p>
                <p className="mt-1">
                  <strong>Built-in triggers:</strong> no_login_today, no_login_3_days, no_workout_logged, no_meal_logged, streak_milestone_3/7/30, monday_morning, etc.
                </p>
                <p className="mt-1">
                  <strong>Custom triggers:</strong> You'll need to add the condition logic to <code className="bg-yellow-100 px-1 rounded">supabase/functions/auto-notify/index.ts</code>
                </p>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Notifications;
