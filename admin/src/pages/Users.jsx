import { Plus, Edit, Search, Trash2, Filter, Download, X } from "lucide-react";
import { useState, useEffect } from "react";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subscription: "Basic",
    status: "Active",
    joinDate: "",
  });

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("users");
    if (stored) setUsers(JSON.parse(stored));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // Search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open Modal (Add/Edit)
  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        subscription: "Basic",
        status: "Active",
        joinDate: "",
      });
    }
    setIsModalOpen(true);
  };

  // Save User
  const handleSave = () => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...formData } : u))
      );
    } else {
      setUsers((prev) => [...prev, { ...formData, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  // Delete User
  const handleDelete = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Status colors
  const statusColors = {
    Active: "text-green-600 font-medium",
    Cancelled: "text-red-600 font-medium",
    Suspended: "text-yellow-600 font-medium",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          User Management
        </h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Search & Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Subscription</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Join Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">{user.subscription}</td>
                  <td
                    className={`py-3 px-4 ${
                      statusColors[user.status] || "text-gray-600"
                    }`}
                  >
                    {user.status}
                  </td>
                  <td className="py-3 px-4">{user.joinDate}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(user)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-6">
              {editingUser ? "Edit User" : "Add User"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John Smith"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <input
                  type="email"
                  placeholder="e.g., john@email.com"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subscription *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={formData.subscription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subscription: e.target.value,
                    }))
                  }
                >
                  <option>Basic</option>
                  <option>Premium</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option>Active</option>
                  <option>Cancelled</option>
                  <option>Suspended</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Join Date *</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={formData.joinDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      joinDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
