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
  const [editingNotification, setEditingNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'automated'

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
                setEditingNotification(null);
                resetForm();
                setIsModalOpen(true);
              }}
            >
              Create Notification
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
                <p>These notifications are sent automatically by the system based on user behavior and conditions. <strong>They cannot be manually sent.</strong></p>
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
                <p className="text-gray-400 text-sm mt-2">Triggers are managed by the system</p>
              </div>
            ) : (
              triggerTemplates.map((trigger) => (
                <div
                  key={trigger.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
                        <p className="text-sm text-gray-600 mb-2">{trigger.message}</p>
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold">Trigger Type:</span> <code className="bg-gray-100 px-2 py-0.5 rounded">{trigger.trigger_type}</code>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      View Only
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
      </div>
    </div>
  );
};

export default Notifications;
