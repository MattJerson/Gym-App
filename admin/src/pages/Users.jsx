import { Plus, Users as UsersIcon, Mail, Phone, Calendar, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import StatsCard from '../components/common/StatsCard';

// Initialize Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = SUPABASE_SERVICE || SUPABASE_ANON || '';
const supabase = createClient(SUPABASE_URL, supabaseKey);

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

      const { data, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const rows = (data?.users || []).map(u => ({
        uid: u.id,
        email: u.email,
        phone: u.phone || null,
        display_name: u.user_metadata?.full_name || u.user_metadata?.name || 'N/A',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        raw: u,
      }));

      setUsers(rows);

      // Calculate stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const activeUsers = rows.filter(u => {
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
    if (!confirm(`Delete user ${user.email}?`)) return;
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.uid);
      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      alert('Error deleting user: ' + err.message);
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
            <p className="font-semibold text-gray-900">{row.display_name}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{row.email}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Phone className="h-4 w-4" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      )
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
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const lastSignIn = row.last_sign_in_at ? new Date(row.last_sign_in_at) : null;
        const isActive = lastSignIn && (new Date() - lastSignIn) < 7 * 24 * 60 * 60 * 1000;
        return (
          <Badge variant={isActive ? 'success' : 'default'}>
            {isActive ? 'Active' : 'Inactive'}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={UsersIcon}
          title="User Management"
          subtitle="Manage and monitor all registered users"
          breadcrumbs={['Admin', 'User Management']}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingUser(null);
                setFormData({ email: '', display_name: '', password: '' });
                setIsModalOpen(true);
              }}
            >
              Add User
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search users by email or name..."
          showExport={true}
          onExportClick={() => alert('Export functionality coming soon!')}
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={['edit', 'delete']}
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

