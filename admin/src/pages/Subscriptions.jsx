import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem("subscriptions");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions]);

  // --- Stats (dynamic) ---
  const activeCount = subscriptions.filter((s) => s.status === "Active").length;

  const monthlyRevenue = subscriptions.reduce((sum, s) => {
    const amount = parseFloat(s.amount.replace(/[^0-9.-]+/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const churnRate =
    subscriptions.length > 0
      ? (
          (subscriptions.filter((s) => s.status !== "Active").length /
            subscriptions.length) *
          100
        ).toFixed(1)
      : 0;

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    user: "",
    plan: "",
    amount: "",
    status: "Active",
    nextBilling: "",
  });

  // Input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for create
  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({
      user: "",
      plan: "",
      amount: "",
      status: "Active",
      nextBilling: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (sub) => {
    setIsEditMode(true);
    setEditId(sub.id);
    setFormData(sub);
    setIsModalOpen(true);
  };

  // Save
  const handleSave = () => {
    if (isEditMode) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === editId ? { ...s, ...formData } : s))
      );
    } else {
      setSubscriptions((prev) => [...prev, { id: Date.now(), ...formData }]);
    }
    setIsModalOpen(false);
  };

  // Delete
  const handleDelete = (id) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-0 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-left text-center sm:text-2xl font-bold text-gray-900">
          Subscription Management
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create Subscription
        </button>
      </div>

      {/* Stats Overview (dynamic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Active Subscriptions
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            {activeCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Monthly Revenue
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">
            $
            {monthlyRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md sm:col-span-2 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Churn Rate
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">
            {churnRate}%
          </p>
        </div>
      </div>

      {/* Subscription Details */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold">
            Subscription Details
          </h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 sm:px-6">User</th>
                <th className="text-left py-3 px-4 sm:px-6">Plan</th>
                <th className="text-left py-3 px-4 sm:px-6">Amount</th>
                <th className="text-left py-3 px-4 sm:px-6">Status</th>
                <th className="text-left py-3 px-4 sm:px-6">Next Billing</th>
                <th className="text-left py-3 px-4 sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 sm:px-6 font-medium">{sub.user}</td>
                  <td className="py-3 px-4 sm:px-6">{sub.plan}</td>
                  <td className="py-3 px-4 sm:px-6 font-semibold">
                    {sub.amount}
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        sub.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : sub.status === "Paused"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-6 text-gray-600">
                    {sub.nextBilling}
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-6 text-gray-500 text-sm"
                  >
                    No subscriptions found
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
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Subscription" : "Create Subscription"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">User *</label>
                <input
                  type="text"
                  name="user"
                  placeholder="e.g., John Smith"
                  value={formData.user}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Plan *</label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                >
                  <option value="">Select Plan</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Amount *</label>
                <input
                  type="text"
                  name="amount"
                  placeholder="e.g., $19.99"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Next Billing Date *
                </label>
                <input
                  type="date"
                  name="nextBilling"
                  value={formData.nextBilling}
                  onChange={handleInputChange}
                  className="w-full mt-1 border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {isEditMode ? "Update" : "Create Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
