import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    status: "Draft",
  });
  const [editId, setEditId] = useState(null);

  // Input handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Open modal for create
  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({
      title: "",
      type: "",
      status: "Draft",
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (notification) => {
    setIsEditMode(true);
    setEditId(notification.id);
    setFormData({
      title: notification.title,
      type: notification.type,
      status: notification.status,
    });
    setIsModalOpen(true);
  };

  // Save or Update
  const handleSave = () => {
    if (isEditMode) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === editId ? { ...n, ...formData } : n))
      );
    } else {
      const newNotification = {
        id: Date.now(),
        ...formData,
        sent: 0, // default
        opened: 0, // default
      };
      setNotifications((prev) => [...prev, newNotification]);
    }
    setIsModalOpen(false);
  };

  // Delete
  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Stats
  const totalSent = notifications.reduce((sum, n) => sum + n.sent, 0);
  const totalOpened = notifications.reduce((sum, n) => sum + n.opened, 0);
  const openRate =
    totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Notifications & Alerts
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Notification
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Sent</h3>
          <p className="text-3xl font-bold text-blue-600">
            {totalSent.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Open Rate</h3>
          <p className="text-3xl font-bold text-green-600">{openRate}%</p>
          <p className="text-sm text-gray-600">Above industry average</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Click Rate</h3>
          <p className="text-3xl font-bold text-purple-600">—</p>
          <p className="text-sm text-gray-600">Dynamic when tracked</p>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Notification Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Title</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Sent</th>
                <th className="text-left py-3 px-4">Opened</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr
                  key={notification.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">
                    {notification.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {notification.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">{notification.sent}</td>
                  <td className="py-3 px-4">{notification.opened}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {notification.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(notification)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    No notifications created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal (matching workout/meal plan style) */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Notification" : "Create Notification"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Notification Title *
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Welcome Back Campaign"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                >
                  <option value="">Select Type</option>
                  <option value="Welcome">Welcome</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Promo">Promo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {isEditMode ? "Update" : "Create Notification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
