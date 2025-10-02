import { Plus, Edit, Search, Trash2, Filter, Download, X, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using root .env via Vite (VITE_SUPABASE_*)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = SUPABASE_SERVICE || SUPABASE_ANON || '';
console.debug('[Admin] Supabase URL:', SUPABASE_URL);
console.debug('[Admin] Supabase key present:', !!supabaseKey);
const supabase = createClient(SUPABASE_URL, supabaseKey);

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', display_name: '', password: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('[Admin] fetchUsers start');
      setLoading(true);
      setError(null);

      const { data, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('[Admin] listUsers error', listError);
        setError(listError.message || String(listError));
        setUsers([]);
        return;
      }

      console.debug('[Admin] listUsers count', data?.users?.length || 0);
      const rows = (data?.users || []).map(u => ({
        uid: u.id,
        email: u.email,
        phone: u.phone || null,
        display_name: u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.nickname || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        identities: u.identities || [],
        raw: u,
      }));

      setUsers(rows);
    } catch (err) {
      console.error('[Admin] fetchUsers exception', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const s = (searchTerm || '').toLowerCase();
    return (
      u.uid?.toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s) ||
      (u.display_name || '').toLowerCase().includes(s)
    );
  });

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email || '', display_name: user.display_name || '', password: '' });
    } else {
      setEditingUser(null);
      setFormData({ email: '', display_name: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (editingUser) {
        console.log('[Admin] update user', editingUser.uid);
        const { error: updateErr } = await supabase.auth.admin.updateUserById(editingUser.uid, {
          email: formData.email,
          user_metadata: { full_name: formData.display_name }
        });
        if (updateErr) throw updateErr;
        await fetchUsers();
        setIsModalOpen(false);
        return;
      }

      // Create new user
      if (!formData.email || !formData.password) {
        setError('Email and password are required to create a user.');
        return;
      }

      console.log('[Admin] create user', formData.email);
      const { data, error: createErr } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { full_name: formData.display_name }
      });

      if (createErr) throw createErr;
      console.debug('[Admin] createUser result', data);
      await fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      console.error('[Admin] handleSave error', err);
      setError(err.message || String(err));
    }
  };

  const handleDelete = async (uid) => {
    if (!confirm('Delete user?')) return;
    try {
      console.log('[Admin] delete user', uid);
      const { error: delErr } = await supabase.auth.admin.deleteUser(uid);
      if (delErr) throw delErr;
      await fetchUsers();
    } catch (err) {
      console.error('[Admin] handleDelete error', err);
      setError(err.message || String(err));
    }
  };

  // helpers for display + subscription status similar to original UI
  const getUserDisplayName = (u) => {
    return u.display_name || (u.raw?.user_metadata?.nickname) || (u.email ? u.email.split('@')[0] : 'No name');
  };

  const getSubscriptionInfo = (u) => {
    return (u.raw?.user_metadata?.subscription === 'premium') ? 'Premium' : 'Free';
  };

  const statusColors = {
    active: "text-green-600 font-medium",
    inactive: "text-gray-600 font-medium",
    suspended: "text-yellow-600 font-medium",
    deleted: "text-red-600 font-medium",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600 mt-1">Total Users: {users.length} | Active: {users.filter(u => (u.raw?.banned_until ? 'suspended' : 'active') === 'active').length}</p>
        </div>

        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Search & Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button className="px-3 sm:px-4 py-2 border border-gray-400 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filter</span>
            </button>
            <button className="px-3 sm:px-4 py-2 border border-gray-400 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Full Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Username</th>
                  <th className="text-left py-3 px-4">Subscription</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Last Login</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.uid} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{getUserDisplayName(user)}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 font-medium">@{user.display_name || (user.email?.split('@')[0])}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSubscriptionInfo(user) === 'Free' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        {getSubscriptionInfo(user)}
                      </span>
                    </td>
                    <td className={`py-3 px-4 capitalize ${statusColors[user.raw?.banned_until ? 'suspended' : 'active'] || 'text-gray-600'}`}>
                      {user.raw?.banned_until ? 'suspended' : 'active'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : <span className="text-gray-400">Never</span>}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(user)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Edit User"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(user.uid)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete User"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500 italic">{searchTerm ? 'No users match your search' : 'No users found'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit/Create Modal (styled like original) */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>

            <h2 className="text-xl font-bold mb-6">{editingUser ? 'Edit User' : 'Add User'}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input type="text" placeholder="e.g., John Smith" className="w-full border rounded-lg px-3 py-2 mt-1" value={formData.display_name} onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <input type="email" placeholder="e.g., john@email.com" className="w-full border rounded-lg px-3 py-2 mt-1" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Username *</label>
                <input type="text" placeholder="e.g., john_smith" className="w-full border rounded-lg px-3 py-2 mt-1" value={formData.display_name} onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input type="tel" placeholder="e.g., +1234567890" className="w-full border rounded-lg px-3 py-2 mt-1" value={formData.phone || ''} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              {!editingUser && (
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <input type="password" placeholder="Temporary password" className="w-full border rounded-lg px-3 py-2 mt-1" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Status *</label>
                <select className="w-full border rounded-lg px-3 py-2 mt-1" value={formData.status || 'active'} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{editingUser ? 'Save Changes' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

