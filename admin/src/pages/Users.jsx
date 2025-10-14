import { 
  Users as UsersIcon, 
  Mail, 
  Calendar, 
  Shield, 
  Search,
  TrendingUp,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import PageHeader from '../components/common/PageHeader';
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

  // Filters and sorting
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");

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

  // Filtering and sorting
  const getFilteredAndSortedUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.account_status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'display_name':
          aVal = a.display_name?.toLowerCase() || '';
          bVal = b.display_name?.toLowerCase() || '';
          break;
        case 'last_sign_in_at':
          aVal = new Date(a.last_sign_in_at || 0).getTime();
          bVal = new Date(b.last_sign_in_at || 0).getTime();
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

  const filteredAndSortedUsers = getFilteredAndSortedUsers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor all registered users</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-2">All registered users</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-green-600 mt-2 font-medium">
                  {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}% of total` : '0%'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">New This Month</p>
                <p className="text-3xl font-bold text-gray-900">{stats.newThisMonth}</p>
                <p className="text-xs text-gray-500 mt-2">Recent registrations</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-red-800 font-semibold">Error loading users</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700"
              >
                <option value="created_at">Date Joined</option>
                <option value="email">Email</option>
                <option value="display_name">Name</option>
                <option value="last_sign_in_at">Last Sign In</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <TrendingUp className={`h-5 w-5 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600 mr-2">Status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Active
            </button>
            <button
              onClick={() => setFilterStatus('suspended')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'suspended'
                  ? 'bg-yellow-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Suspended
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'inactive'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <XCircle className="h-3 w-3 inline mr-1" />
              Inactive
            </button>

            {/* Clear Filters */}
            {(filterStatus !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
                className="ml-auto px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <UsersIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 text-sm">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No users have registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Last Sign In
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {user.display_name}
                              </p>
                              {user.is_admin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.account_status === 'active' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        )}
                        {user.account_status === 'suspended' && (
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Suspended
                            </span>
                            {user.suspended_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                Since {new Date(user.suspended_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                        {user.account_status === 'inactive' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3 inline mr-1" />
                            Inactive
                          </span>
                        )}
                        {user.account_status === 'banned' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Banned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {!user.last_sign_in_at ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            Never
                          </span>
                        ) : (() => {
                          const lastSignIn = new Date(user.last_sign_in_at);
                          const isRecent = (new Date() - lastSignIn) < 7 * 24 * 60 * 60 * 1000;
                          return (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className={`text-sm ${isRecent ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                {lastSignIn.toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.account_status === 'inactive'
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={user.account_status === 'inactive' ? 'Activate user' : 'Deactivate user'}
                          >
                            {user.account_status === 'inactive' ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && filteredAndSortedUsers.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredAndSortedUsers.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{stats.total}</span> users
          </div>
        )}

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

