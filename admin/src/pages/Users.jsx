import { Plus, Users as UsersIcon, Mail, Phone, Calendar, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', display_name: '', password: '' });
  const [error, setError] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new admin function to get user overview with status
      const { data, error: fetchError } = await supabase.rpc('get_admin_user_overview');
      
      if (fetchError) {
        console.error('RPC Error:', fetchError);
        throw fetchError;
      }

      console.log('Raw RPC data:', data); // Debug log

      // Map the RPC function results to user rows
      const rows = (data || []).map(u => ({
        uid: u.id,
        email: u.email,
        phone: u.phone || null,
        display_name: u.email?.split('@')[0] || 'User', // Extract from email
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        account_status: u.account_status || 'active',
        suspended_at: u.suspended_at,
        suspended_reason: u.suspended_reason,
        is_admin: u.is_admin || false,
        onboarding_completed: u.onboarding_completed || false,
        raw: u,
      }));

      console.log('Mapped users:', rows); // Debug log
      setUsers(rows);

      // Calculate stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const activeUsers = rows.filter(u => {
        if (!u.last_sign_in_at || u.account_status !== 'active') return false;
        const lastSignIn = new Date(u.last_sign_in_at);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return lastSignIn >= weekAgo;
      }).length;
      
      const newUsers = rows.filter(u => new Date(u.created_at) >= monthStart).length;

      setStats({
        total: rows.length,
        active: activeUsers,
        newThisMonth: newUsers
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    const isInactive = user.account_status === 'inactive';
    const action = isInactive ? 'activate' : 'deactivate';
    const confirmMsg = action === 'deactivate'
      ? `Deactivate user ${user.email}? They won't be able to log in.`
      : `Activate user ${user.email}? They will be able to log in again.`;

    if (!confirm(confirmMsg)) return;

    try {
      const functionName = action === 'deactivate' ? 'deactivate_user' : 'activate_user';
      const params = action === 'deactivate'
        ? { target_user_id: user.uid, reason: 'Deactivated by admin' }
        : { target_user_id: user.uid };

      const { error } = await supabase.rpc(functionName, params);
      if (error) throw error;

      await fetchUsers();
    } catch (err) {
      alert(`Error ${action}ing user: ` + err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      display_name: user.display_name,
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updates = {};
        if (formData.email !== editingUser.email) updates.email = formData.email;
        if (formData.password) updates.password = formData.password;
        if (formData.display_name !== editingUser.display_name) {
          updates.user_metadata = { full_name: formData.display_name };
        }
        
        const { error } = await supabase.auth.admin.updateUserById(editingUser.uid, updates);
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          user_metadata: { full_name: formData.display_name }
        });
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ email: '', display_name: '', password: '' });
      await fetchUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'User',
      accessor: 'email',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {row.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {row.display_name}
              {row.is_admin && (
                <Badge variant="info" className="ml-2 text-xs">Admin</Badge>
              )}
            </p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'account_status',
      render: (row) => {
        const statusConfig = {
          active: { variant: 'success', label: 'Active' },
          suspended: { variant: 'warning', label: 'Suspended' },
          inactive: { variant: 'default', label: 'Inactive' },
          banned: { variant: 'danger', label: 'Banned' }
        };
        const config = statusConfig[row.account_status] || statusConfig.active;
        return (
          <div>
            <Badge variant={config.variant}>{config.label}</Badge>
            {row.suspended_at && (
              <p className="text-xs text-gray-500 mt-1">
                Since {new Date(row.suspended_at).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Joined',
      accessor: 'created_at',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: 'Last Sign In',
      accessor: 'last_sign_in_at',
      render: (row) => {
        if (!row.last_sign_in_at) return <Badge variant="default">Never</Badge>;
        const lastSignIn = new Date(row.last_sign_in_at);
        const isRecent = (new Date() - lastSignIn) < 7 * 24 * 60 * 60 * 1000;
        return (
          <Badge variant={isRecent ? 'success' : 'default'}>
            {new Date(row.last_sign_in_at).toLocaleDateString()}
          </Badge>
        );
      }
    }
  ];

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-compact">
      <div className="admin-page-container">
        {/* Page Header - Compact */}
        <div className="page-header">
          <div className="page-header-title">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1>User Management</h1>
              <p className="page-header-subtitle">Manage and monitor all registered users</p>
            </div>
          </div>
          {/* Removed Add User button - users should register via app */}
        </div>

        {/* Stats Grid - Compact */}
        <div className="admin-grid-3 mb-5">
          <StatsCard
            title="Total Users"
            value={stats.total}
            icon={UsersIcon}
            color="blue"
            subtitle="All registered users"
          />
          <StatsCard
            title="Active Users"
            value={stats.active}
            icon={Shield}
            color="green"
            subtitle="Active in last 7 days"
            change={`${((stats.active / stats.total) * 100).toFixed(0)}% of total`}
            changeType="positive"
          />
          <StatsCard
            title="New This Month"
            value={stats.newThisMonth}
            icon={Calendar}
            color="purple"
            subtitle="Recent registrations"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error loading users:</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Search Bar - Integrated */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search users by email or name..."
          showExport={true}
          onExportClick={() => alert('Export functionality coming soon!')}
        />

        {/* Data Table - Compact */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={['edit', 'delete']}
          deleteLabel={(row) => row.account_status === 'inactive' ? 'Activate' : 'Deactivate'}
          deleteVariant={(row) => row.account_status === 'inactive' ? 'success' : 'warning'}
          emptyMessage="No users found"
        />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ email: '', display_name: '', password: '' });
          }}
          title={editingUser ? 'Edit User' : 'Create New User'}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
              >
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={Mail}
              required
            />
            
            <Input
              label="Display Name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              icon={UsersIcon}
              required
            />
            
            <Input
              label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Users;

