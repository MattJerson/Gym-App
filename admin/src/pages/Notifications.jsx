import { useState, useEffect } from "react";
import { Plus, Bell, Send, Users, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    target_audience: "all",
    status: "draft",
    scheduled_at: ""
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Fallback to localStorage
      const saved = localStorage.getItem("notifications");
      setNotifications(saved ? JSON.parse(saved) : []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotification) {
        const { error } = await supabase
          .from('notifications')
          .update(formData)
          .eq('id', editingNotification.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert([{ ...formData, created_at: new Date().toISOString() }]);
        
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingNotification(null);
      resetForm();
      await fetchNotifications();
    } catch (err) {
      // Fallback to localStorage
      const newNotif = {
        id: editingNotification?.id || Date.now(),
        ...formData,
        created_at: new Date().toISOString()
      };
      
      if (editingNotification) {
        setNotifications(prev => prev.map(n => n.id === editingNotification.id ? newNotif : n));
      } else {
        setNotifications(prev => [newNotif, ...prev]);
      }
      
      setIsModalOpen(false);
      setEditingNotification(null);
      resetForm();
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
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
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
      scheduled_at: notification.scheduled_at || ""
    });
    setIsModalOpen(true);
  };

  const handleSendNow = async (notification) => {
    if (!confirm(`Send notification "${notification.title}" to ${notification.target_audience}?`)) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id);
      
      if (error) throw error;
      await fetchNotifications();
      alert('Notification sent successfully!');
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
      scheduled_at: ""
    });
  };

  const columns = [
    {
      header: 'Notification',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
            row.type === 'success' ? 'from-green-500 to-green-600' :
            row.type === 'warning' ? 'from-yellow-500 to-yellow-600' :
            row.type === 'error' ? 'from-red-500 to-red-600' :
            'from-blue-500 to-blue-600'
          } flex items-center justify-center`}>
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.title}</p>
            <p className="text-sm text-gray-500 line-clamp-1">{row.message}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => {
        const variants = {
          'info': 'info',
          'success': 'success',
          'warning': 'warning',
          'error': 'error'
        };
        return <Badge variant={variants[row.type] || 'default'}>{row.type}</Badge>;
      }
    },
    {
      header: 'Audience',
      accessor: 'target_audience',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 capitalize">{row.target_audience}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const variants = {
          'draft': 'default',
          'scheduled': 'warning',
          'sent': 'success',
          'failed': 'error'
        };
        return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    }
  ];

  const filteredNotifications = notifications.filter(notif =>
    notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalNotifications = notifications.length;
  const sentNotifications = notifications.filter(n => n.status === 'sent').length;
  const draftNotifications = notifications.filter(n => n.status === 'draft').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Bell}
          title="Notification Management"
          subtitle="Send push notifications and announcements to users"
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Notifications"
            value={totalNotifications}
            icon={Bell}
            color="blue"
            subtitle="All notifications"
          />
          <StatsCard
            title="Sent"
            value={sentNotifications}
            icon={CheckCircle}
            color="green"
            subtitle="Successfully delivered"
          />
          <StatsCard
            title="Drafts"
            value={draftNotifications}
            icon={AlertCircle}
            color="orange"
            subtitle="Pending notifications"
          />
        </div>

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search notifications..."
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredNotifications}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={['edit', 'delete']}
          customActions={(row) => (
            row.status === 'draft' && (
              <button
                onClick={() => handleSendNow(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Send Now"
              >
                <Send className="h-4 w-4" />
              </button>
            )
          )}
          emptyMessage="No notifications found"
        />

        {/* Create/Edit Modal */}
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
              <Input
                label="Schedule Date & Time"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            )}
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Notifications;
